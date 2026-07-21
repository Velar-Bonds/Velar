import {
  Injectable,
  Inject,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FILE_SCANNER, FileScanner } from './files/file-scanner';
import {
  sha256,
  validateUpload,
  reportFilePath,
  FileValidationError,
} from './files/file-validation';
import { reconcile, declaredRefsFromLineItems } from './domain/reconciliation';
import { resolveSubmit, isEditable } from './domain/workflow';
import {
  AuditEventType,
  NotificationType,
  ReportStatus,
  Role,
  ReportLineItem,
  ReportLineItemInput,
  ReportFile,
  ReportVersion,
  ReconciliationResult,
  ReportSnapshot,
  HeldBond,
  MonthlyReport,
} from '@velar/types';

const PARTY_ROLE: Role = 'emisor';
const AUTHORITY: Role[] = ['tse', 'admin'];

const REPORT_BUCKET = 'report-files';

// ── Mappers snake_case (DB) → camelCase (@velar/types) ──────────────────────
function mapReport(r: any): MonthlyReport {
  return {
    id: r.id,
    partyId: r.party_id,
    periodYear: r.period_year,
    periodMonth: r.period_month,
    status: r.status,
    currentVersion: r.current_version ?? 0,
    title: r.title,
    submittedBy: r.submitted_by ?? null,
    submittedAt: r.submitted_at ?? null,
    reviewedBy: r.reviewed_by ?? null,
    reviewedAt: r.reviewed_at ?? null,
    tseNotes: r.tse_notes ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapLineItem(r: any): ReportLineItem {
  return {
    id: r.id,
    reportId: r.report_id,
    concept: r.concept,
    amount: Number(r.amount ?? 0),
    category: r.category,
    bondTokenId: r.bond_token_id ?? null,
    createdAt: r.created_at,
  };
}

function mapFile(r: any): ReportFile {
  return {
    id: r.id,
    reportId: r.report_id,
    filePath: r.file_path,
    fileName: r.file_name,
    mimeType: r.mime_type,
    sizeBytes: Number(r.size_bytes ?? 0),
    checksum: r.checksum,
    scanStatus: r.scan_status,
    createdAt: r.created_at,
  };
}

function mapVersion(r: any): ReportVersion {
  return {
    id: r.id,
    reportId: r.report_id,
    version: r.version,
    status: r.status,
    snapshot: r.snapshot,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

/**
 * Ciclo de vida estructurado del reporte mensual: builder (borrador, líneas,
 * archivos), conciliación on-chain, versionado inmutable y workflow de envío/
 * corrección. Convive con ReportsService (metadata legacy) sin reescribirlo.
 */
@Injectable()
export class ReportLifecycleService {
  constructor(
    private supabase: SupabaseService,
    private audit: AuditService,
    private notifications: NotificationsService,
    @Inject(FILE_SCANNER) private scanner: FileScanner,
  ) {}

  // ── Autorización ──────────────────────────────────────────────────────────
  private assertEmisor(role: Role) {
    if (role !== PARTY_ROLE) {
      throw new ForbiddenException('Solo un partido (emisor) puede operar reportes');
    }
  }

  private assertOwner(report: any, partyId: string | null) {
    if (!partyId || report.party_id !== partyId) {
      throw new ForbiddenException('No autorizado sobre este reporte');
    }
  }

  private assertEditable(report: any) {
    if (!isEditable(report.status)) {
      throw new BadRequestException(
        `El reporte en estado "${report.status}" no admite ediciones`,
      );
    }
  }

  // ── Acceso a datos (aislado para test y claridad) ─────────────────────────
  private async loadReportRow(reportId: string): Promise<any> {
    const { data, error } = await this.supabase.admin
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();
    if (error || !data) throw new NotFoundException('Reporte no encontrado');
    return data;
  }

  private async getLineItemRows(reportId: string): Promise<any[]> {
    const { data } = await this.supabase.admin
      .from('report_line_items')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });
    return data ?? [];
  }

  private async getFileRows(reportId: string): Promise<any[]> {
    const { data } = await this.supabase.admin
      .from('report_files')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });
    return data ?? [];
  }

  private async getVersionRows(reportId: string): Promise<any[]> {
    const { data } = await this.supabase.admin
      .from('report_versions')
      .select('*')
      .eq('report_id', reportId)
      .order('version', { ascending: true });
    return data ?? [];
  }

  /** Bonos que el partido posee on-chain (fixture-fed en tests). */
  private async getHeldBonds(partyId: string): Promise<HeldBond[]> {
    const { data } = await this.supabase.admin
      .from('bonds')
      .select('token_id, face_value')
      .eq('issuer_party_id', partyId);
    return (data ?? []).map((b: any) => ({
      bondTokenId: b.token_id,
      amount: Number(b.face_value ?? 0),
    }));
  }

  private async tseUserIds(): Promise<string[]> {
    const { data } = await this.supabase.admin
      .from('profiles')
      .select('id')
      .eq('role', 'tse');
    return (data ?? []).map((p: any) => p.id);
  }

  // ── Builder ───────────────────────────────────────────────────────────────
  async createDraft(
    input: { periodYear: number; periodMonth: number; title?: string },
    actorId: string,
    partyId: string | null,
    role: Role,
  ): Promise<MonthlyReport> {
    this.assertEmisor(role);
    if (!partyId) throw new ForbiddenException('El usuario no pertenece a un partido');
    if (!input.periodYear || !input.periodMonth || input.periodMonth < 1 || input.periodMonth > 12) {
      throw new BadRequestException('Período (año/mes) inválido');
    }
    const { data, error } = await this.supabase.admin
      .from('reports')
      .insert({
        party_id: partyId,
        submitted_by: actorId,
        title: input.title?.trim() || `Reporte ${input.periodMonth}/${input.periodYear}`,
        description: '',
        period_year: input.periodYear,
        period_month: input.periodMonth,
        status: ReportStatus.BORRADOR,
        current_version: 0,
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return mapReport(data);
  }

  async addLineItem(
    reportId: string,
    input: ReportLineItemInput,
    partyId: string | null,
    role: Role,
  ): Promise<ReportLineItem> {
    this.assertEmisor(role);
    const report = await this.loadReportRow(reportId);
    this.assertOwner(report, partyId);
    this.assertEditable(report);
    if (!input.concept?.trim()) throw new BadRequestException('El concepto es obligatorio');
    if (typeof input.amount !== 'number' || Number.isNaN(input.amount)) {
      throw new BadRequestException('El monto es inválido');
    }
    const { data, error } = await this.supabase.admin
      .from('report_line_items')
      .insert({
        report_id: reportId,
        concept: input.concept.trim(),
        amount: input.amount,
        category: input.category,
        bond_token_id: input.bondTokenId ?? null,
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return mapLineItem(data);
  }

  async removeLineItem(
    reportId: string,
    lineItemId: string,
    partyId: string | null,
    role: Role,
  ): Promise<{ ok: true }> {
    this.assertEmisor(role);
    const report = await this.loadReportRow(reportId);
    this.assertOwner(report, partyId);
    this.assertEditable(report);
    await this.supabase.admin
      .from('report_line_items')
      .delete()
      .eq('id', lineItemId)
      .eq('report_id', reportId);
    return { ok: true };
  }

  async listLineItems(
    reportId: string,
    partyId: string | null,
    role: Role,
  ): Promise<{ items: ReportLineItem[]; total: number }> {
    const report = await this.loadReportRow(reportId);
    if (!AUTHORITY.includes(role)) this.assertOwner(report, partyId);
    const items = (await this.getLineItemRows(reportId)).map(mapLineItem);
    return { items, total: computeTotal(items) };
  }

  // ── Archivos ──────────────────────────────────────────────────────────────
  async uploadFile(
    reportId: string,
    file: { fileName: string; mimeType: string; buffer: Buffer },
    actorId: string,
    partyId: string | null,
    role: Role,
  ): Promise<ReportFile> {
    this.assertEmisor(role);
    const report = await this.loadReportRow(reportId);
    this.assertOwner(report, partyId);
    this.assertEditable(report);

    try {
      validateUpload({
        fileName: file.fileName,
        mimeType: file.mimeType,
        sizeBytes: file.buffer.length,
      });
    } catch (e) {
      if (e instanceof FileValidationError) throw new BadRequestException(e.message);
      throw e;
    }

    const checksum = sha256(file.buffer);
    const scan = await this.scanner.scan({ fileName: file.fileName, buffer: file.buffer });
    if (scan.status === 'infected') {
      throw new BadRequestException(
        `Archivo rechazado por el antivirus (${scan.signature ?? 'amenaza'})`,
      );
    }

    const path = reportFilePath(partyId as string, reportId, file.fileName);
    const { error: upErr } = await this.supabase.admin.storage
      .from(REPORT_BUCKET)
      .upload(path, file.buffer, { contentType: file.mimeType, upsert: true });
    if (upErr) throw new BadRequestException(`Fallo al subir el archivo: ${upErr.message}`);

    const { data, error } = await this.supabase.admin
      .from('report_files')
      .insert({
        report_id: reportId,
        file_path: path,
        file_name: file.fileName,
        mime_type: file.mimeType,
        size_bytes: file.buffer.length,
        checksum,
        scan_status: scan.status,
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);

    await this.audit.emit({
      type: AuditEventType.REPORT_FILE_UPLOADED,
      actorId,
      payload: { reportId, filePath: path, checksum, scanStatus: scan.status },
    });
    return mapFile(data);
  }

  // ── Conciliación ─────────────────────────────────────────────────────────
  async previewReconciliation(
    reportId: string,
    partyId: string | null,
    role: Role,
  ): Promise<ReconciliationResult> {
    const report = await this.loadReportRow(reportId);
    if (!AUTHORITY.includes(role)) this.assertOwner(report, partyId);
    return this.reconcileReport(report);
  }

  private async reconcileReport(report: any): Promise<ReconciliationResult> {
    const items = (await this.getLineItemRows(report.id)).map(mapLineItem);
    const held = await this.getHeldBonds(report.party_id);
    return reconcile(declaredRefsFromLineItems(items), held);
  }

  // ── Envío / corrección (núcleo del workflow) ───────────────────────────────
  async submit(
    reportId: string,
    actorId: string,
    partyId: string | null,
    role: Role,
  ): Promise<{ report: MonthlyReport; version: number; reconciliation: ReconciliationResult }> {
    this.assertEmisor(role);
    const report = await this.loadReportRow(reportId);
    this.assertOwner(report, partyId);

    // Transición legal: borrador→enviado o observado→reenviado. Ilegal → error.
    let next: ReportStatus;
    let isResubmission: boolean;
    try {
      ({ next, isResubmission } = resolveSubmit(report.status));
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }

    const items = (await this.getLineItemRows(reportId)).map(mapLineItem);
    if (items.length === 0) {
      throw new BadRequestException('No se puede enviar un reporte sin líneas');
    }
    const files = (await this.getFileRows(reportId)).map(mapFile);
    const held = await this.getHeldBonds(report.party_id);
    const reconciliation = reconcile(declaredRefsFromLineItems(items), held);

    const version = (report.current_version ?? 0) + 1;
    const snapshot: ReportSnapshot = {
      status: next,
      title: report.title,
      periodYear: report.period_year,
      periodMonth: report.period_month,
      lineItems: items.map(({ reportId: _r, createdAt: _c, ...rest }) => rest),
      files: files.map(({ reportId: _r, createdAt: _c, ...rest }) => rest),
      declaredTotal: computeTotal(items),
      reconciliation,
    };

    // Snapshot inmutable (append-only por trigger en DB).
    await this.supabase.admin.from('report_versions').insert({
      report_id: reportId,
      version,
      status: next,
      snapshot,
      created_by: actorId,
    });

    const submittedAt = new Date().toISOString();
    const { data: updated, error } = await this.supabase.admin
      .from('reports')
      .update({
        status: next,
        current_version: version,
        submitted_by: actorId,
        submitted_at: submittedAt,
      })
      .eq('id', reportId)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);

    // Auditoría: versión creada + envío/reenvío.
    await this.audit.emit({
      type: AuditEventType.REPORT_VERSION_CREATED,
      actorId,
      payload: { reportId, version, status: next },
    });
    await this.audit.emit({
      type: isResubmission
        ? AuditEventType.REPORT_RESUBMITTED
        : AuditEventType.REPORT_SUBMITTED,
      actorId,
      payload: { reportId, version, reconciliationStatus: reconciliation.status },
    });

    // Notificaciones: confirmación al partido + aviso al TSE en el envío.
    const notifType = isResubmission
      ? NotificationType.REPORT_RESUBMITTED
      : NotificationType.REPORT_SUBMITTED;
    await this.notifications.emit(actorId, notifType, { reportId, version });
    for (const tseId of await this.tseUserIds()) {
      await this.notifications.emit(tseId, NotificationType.REPORT_SUBMITTED, {
        reportId,
        version,
        partyId: report.party_id,
      });
    }

    return { report: mapReport(updated), version, reconciliation };
  }

  // ── Detalle completo ───────────────────────────────────────────────────────
  async getDetail(reportId: string, partyId: string | null, role: Role) {
    const report = await this.loadReportRow(reportId);
    if (!AUTHORITY.includes(role)) this.assertOwner(report, partyId);
    const [items, files, versions] = await Promise.all([
      this.getLineItemRows(reportId),
      this.getFileRows(reportId),
      this.getVersionRows(reportId),
    ]);
    const mappedItems = items.map(mapLineItem);
    const held = await this.getHeldBonds(report.party_id);
    return {
      ...mapReport(report),
      lineItems: mappedItems,
      files: files.map(mapFile),
      versions: versions.map(mapVersion),
      reconciliation: reconcile(declaredRefsFromLineItems(mappedItems), held),
    };
  }
}

/** Suma de montos de las líneas (helper puro). */
export function computeTotal(items: Array<{ amount: number }>): number {
  return Math.round(items.reduce((s, i) => s + (i.amount ?? 0), 0) * 100) / 100;
}
