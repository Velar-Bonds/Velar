import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { AbacService } from '../auth/abac/abac.service';
import {
  AbacAction,
  AuditEventType,
  ReportStatus,
  Role,
  type CreateReportRequest,
  type DualControlApproval,
  type DualControlState,
} from '@velar/types';
import { resolveDecision, InvalidTransitionError } from './domain/workflow';
import { getRuleSet, DEFAULT_RULE_SET_VERSION } from './rules/rule-sets';
import { computeTotal } from './report-lifecycle.service';

const AUTHORITY: Role[] = ['tse', 'admin'];

const DECISION_STATUS_MAP = {
  observado: ReportStatus.OBSERVADO,
  aprobado: ReportStatus.APROBADO,
  rechazado: ReportStatus.RECHAZADO,
} as const;

export type CreateReportInput = CreateReportRequest;

@Injectable()
export class ReportsService {
  constructor(
    private supabase: SupabaseService,
    private audit: AuditService,
    private abac: AbacService,
  ) {}

  async create(input: CreateReportInput, actorId: string, partyId: string | null) {
    if (!partyId) throw new ForbiddenException('Solo partidos pueden enviar reportes');
    if (!input.title?.trim() || !input.description?.trim()) {
      throw new BadRequestException('Título y descripción son obligatorios');
    }
    const { data, error } = await this.supabase.admin
      .from('reports')
      .insert({
        party_id: partyId,
        submitted_by: actorId,
        title: input.title.trim(),
        description: input.description.trim(),
        period_start: input.period_start ?? null,
        period_end: input.period_end ?? null,
        bond_token_ids: input.bond_token_ids ?? null,
        total_amount: input.total_amount ?? null,
        status: 'enviado',
      })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /** Lista reportes: TSE/admin ven todos; partido ve solo los suyos. */
  async list(actorId: string, role: Role, partyId: string | null) {
    let q = this.supabase.admin
      .from('reports')
      .select('*, parties(id, name, code), submitter:profiles!reports_submitted_by_fkey(full_name)')
      .order('created_at', { ascending: false });

    if (!AUTHORITY.includes(role)) {
      if (!partyId) return [];
      q = q.eq('party_id', partyId);
    }
    const { data } = await q;
    return data ?? [];
  }

  async findOne(id: string, actorId: string, role: Role, partyId: string | null) {
    const { data, error } = await this.supabase.admin
      .from('reports')
      .select('*, parties(*), submitter:profiles!reports_submitted_by_fkey(full_name, email), reviewer:profiles!reports_reviewed_by_fkey(full_name)')
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException('Reporte no encontrado');
    if (!AUTHORITY.includes(role) && data.party_id !== partyId) {
      throw new ForbiddenException('No autorizado');
    }
    return data;
  }

  /** El TSE marca el reporte como revisado/observado/aprobado/rechazado. */
  async review(
    id: string,
    status: 'revisado' | 'observado' | 'aprobado' | 'rechazado',
    notes: string | undefined,
    actorId: string,
    role: Role,
    expectedVersion?: number,
  ) {
    // Cheap early role gate — fail fast before touching the DB.
    if (role !== 'tse' && role !== 'admin') {
      throw new ForbiddenException('Solo TSE puede revisar reportes');
    }

    const dualControlThreshold = getRuleSet(DEFAULT_RULE_SET_VERSION).thresholdBreachAmount;

    const { data: currentRow, error: loadError } = await this.supabase.admin
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();
    if (loadError || !currentRow) throw new NotFoundException('Reporte no encontrado');

    // Attribute-based gate: role + assigned-reviewer boundary (SoD stays explicit below).
    this.abac.assertAllowed(
      {
        role,
        userId: actorId,
        assignedReviewerId: currentRow.assigned_reviewer_id ?? null,
      },
      abacActionForReview(status, currentRow.status as ReportStatus),
    );

    const now = new Date().toISOString();
    const nextVersion = (currentRow.current_version ?? 0) + 1;

    // Legacy soft marker — no workflow / dual-control machinery.
    if (status === 'revisado') {
      const updatedRow = await this.applyReportUpdate(
        id,
        {
          status: 'revisado',
          tse_notes: notes ?? null,
          reviewed_by: actorId,
          reviewed_at: now,
          current_version: nextVersion,
        },
        expectedVersion,
      );
      await this.audit.emit({
        type: AuditEventType.REPORT_MARKED_REVIEWED,
        actorId,
        payload: { reportId: id, notes },
      });
      return {
        ...updatedRow,
        dualControl: {
          required: false,
          threshold: dualControlThreshold,
          approval: null,
        } satisfies DualControlState,
      };
    }

    const { data: lineRows } = await this.supabase.admin
      .from('report_line_items')
      .select('amount')
      .eq('report_id', id);
    const declaredTotal = computeTotal(
      (lineRows ?? []).map((r: { amount?: number | string | null }) => ({
        amount: Number(r.amount ?? 0),
      })),
    );

    const target = DECISION_STATUS_MAP[status];
    let resolution;
    try {
      resolution = resolveDecision(currentRow.status as ReportStatus, target, {
        declaredTotal,
        dualControlThreshold,
      });
    } catch (error) {
      if (error instanceof InvalidTransitionError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    let approvalRow: Record<string, unknown> | null = null;

    if (resolution.isSecondApproval) {
      const { data: pending, error: pendingError } = await this.supabase.admin
        .from('report_decision_approvals')
        .select('*')
        .eq('report_id', id)
        .eq('status', 'pending_second')
        .single();
      if (pendingError || !pending) {
        throw new BadRequestException(
          'No hay una aprobación pendiente de segunda revisión para este reporte',
        );
      }
      if (pending.first_approver_id === actorId) {
        throw new ForbiddenException(
          'El segundo aprobador debe ser distinto al primero (segregación de funciones)',
        );
      }
      const { data: completed, error: completeError } = await this.supabase.admin
        .from('report_decision_approvals')
        .update({
          second_approver_id: actorId,
          second_approved_at: now,
          status: 'completed',
        })
        .eq('id', pending.id)
        .select()
        .single();
      if (completeError || !completed) {
        throw new BadRequestException(
          completeError?.message ?? 'No se pudo completar la segunda aprobación',
        );
      }
      approvalRow = completed;
    }

    const updatedRow = await this.applyReportUpdate(
      id,
      {
        status: resolution.next,
        tse_notes: notes ?? null,
        reviewed_by: actorId,
        reviewed_at: now,
        current_version: nextVersion,
      },
      expectedVersion,
    );

    if (resolution.requiresSecondApproval) {
      const { data: inserted, error: insertError } = await this.supabase.admin
        .from('report_decision_approvals')
        .insert({
          report_id: id,
          decision: 'aprobado',
          first_approver_id: actorId,
          first_approved_at: now,
          status: 'pending_second',
        })
        .select()
        .single();
      if (insertError || !inserted) {
        throw new BadRequestException(
          insertError?.message ?? 'No se pudo registrar la aprobación pendiente',
        );
      }
      approvalRow = inserted;
    }

    await this.audit.emit({
      type: this.auditTypeForDecision(resolution),
      actorId,
      payload: { reportId: id, version: nextVersion, declaredTotal },
    });

    const dualControlRequired =
      resolution.requiresSecondApproval ||
      resolution.isSecondApproval ||
      updatedRow.status === ReportStatus.PENDIENTE_SEGUNDA_APROBACION;

    return {
      ...updatedRow,
      dualControl: {
        required: dualControlRequired,
        threshold: dualControlThreshold,
        approval: approvalRow ? mapDecisionApproval(approvalRow) : null,
      } satisfies DualControlState,
    };
  }

  async assignReviewer(id: string, reviewerId: string, actorId: string, role: Role) {
    if (role !== 'admin') throw new ForbiddenException('Solo un admin puede asignar revisores');
    if (!reviewerId?.trim()) throw new BadRequestException('reviewerId es obligatorio');
    const { data, error } = await this.supabase.admin
      .from('reports')
      .update({ assigned_reviewer_id: reviewerId })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new NotFoundException('Reporte no encontrado');
    await this.audit.emit({ type: AuditEventType.REPORT_ASSIGNED, actorId, payload: { reportId: id, reviewerId } });
    return data;
  }

  private async applyReportUpdate(
    id: string,
    patch: Record<string, unknown>,
    expectedVersion: number | undefined,
  ) {
    let query = this.supabase.admin.from('reports').update(patch).eq('id', id);
    if (expectedVersion !== undefined) {
      query = query.eq('current_version', expectedVersion);
    }
    const { data, error } = await query.select().single();
    if (error || !data) {
      if (expectedVersion !== undefined) {
        throw new ConflictException(
          'El reporte fue modificado por otro usuario; recargá los datos e intentá de nuevo.',
        );
      }
      throw new BadRequestException(error?.message ?? 'No se pudo actualizar el reporte');
    }
    return data;
  }

  private auditTypeForDecision(resolution: {
    next: ReportStatus;
    requiresSecondApproval: boolean;
    isSecondApproval: boolean;
  }): AuditEventType {
    if (resolution.next === ReportStatus.RECHAZADO) return AuditEventType.REPORT_REJECTED;
    if (resolution.next === ReportStatus.OBSERVADO) return AuditEventType.REPORT_OBSERVED;
    if (resolution.requiresSecondApproval) return AuditEventType.REPORT_PENDING_SECOND_APPROVAL;
    if (resolution.isSecondApproval) return AuditEventType.REPORT_SECOND_APPROVED;
    return AuditEventType.REPORT_APPROVED;
  }
}

function abacActionForReview(
  status: 'revisado' | 'observado' | 'aprobado' | 'rechazado',
  currentStatus: ReportStatus,
): AbacAction {
  if (status === 'aprobado') {
    return currentStatus === ReportStatus.PENDIENTE_SEGUNDA_APROBACION
      ? AbacAction.SECOND_APPROVE_REPORT
      : AbacAction.APPROVE_REPORT;
  }
  return AbacAction.REVIEW_REPORT;
}

function mapDecisionApproval(row: Record<string, unknown>): DualControlApproval {
  return {
    id: String(row.id),
    reportId: String(row.report_id),
    firstApproverId: String(row.first_approver_id),
    firstApprovedAt: String(row.first_approved_at),
    secondApproverId: row.second_approver_id != null ? String(row.second_approver_id) : null,
    secondApprovedAt: row.second_approved_at != null ? String(row.second_approved_at) : null,
    status: row.status as DualControlApproval['status'],
    createdAt: String(row.created_at),
  };
}
