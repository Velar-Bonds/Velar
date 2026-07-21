import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ReportLifecycleService, computeTotal } from './report-lifecycle.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FILE_SCANNER, StubFileScanner, EICAR_TEST_SIGNATURE } from './files/file-scanner';
import { ReportStatus } from '@velar/types';

/** Chain mockeable de Supabase: awaitable y con .single(). */
function chain(result: any) {
  const p: any = {
    select: () => p,
    insert: () => p,
    update: () => p,
    delete: () => p,
    eq: () => p,
    order: () => p,
    single: () => Promise.resolve(result),
    then: (res: any, rej: any) => Promise.resolve(result).then(res, rej),
  };
  return p;
}

const PARTY = 'party-1';

function lineRow(over: Partial<any> = {}) {
  return {
    id: 'li-1',
    report_id: 'rep-1',
    concept: 'Bono A',
    amount: 1000,
    category: 'bono',
    bond_token_id: 'bond-a',
    created_at: '2026-02-01T00:00:00Z',
    ...over,
  };
}

function reportRow(over: Partial<any> = {}) {
  return {
    id: 'rep-1',
    party_id: PARTY,
    period_year: 2026,
    period_month: 1,
    status: ReportStatus.BORRADOR,
    current_version: 0,
    title: 'Reporte 1/2026',
    submitted_by: 'user-1',
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    ...over,
  };
}

describe('ReportLifecycleService', () => {
  let service: ReportLifecycleService;
  let audit: { emit: jest.Mock };
  let notifications: { emit: jest.Mock };
  let fromMock: jest.Mock;
  let uploadMock: jest.Mock;

  beforeEach(async () => {
    audit = { emit: jest.fn() };
    notifications = { emit: jest.fn() };
    fromMock = jest.fn();
    uploadMock = jest.fn().mockResolvedValue({ error: null });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportLifecycleService,
        {
          provide: SupabaseService,
          useValue: {
            admin: {
              from: fromMock,
              storage: { from: () => ({ upload: uploadMock }) },
            },
          },
        },
        { provide: AuditService, useValue: audit },
        { provide: NotificationsService, useValue: notifications },
        { provide: FILE_SCANNER, useValue: new StubFileScanner() },
      ],
    }).compile();

    service = module.get(ReportLifecycleService);
  });

  // ── Autorización de envío ──────────────────────────────────────────────────
  describe('submit authorization', () => {
    it('rejects a non-emisor role', async () => {
      await expect(
        service.submit('rep-1', 'user-1', PARTY, 'comprador' as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects an emisor from another party', async () => {
      jest.spyOn(service as any, 'loadReportRow').mockResolvedValue(reportRow());
      await expect(
        service.submit('rep-1', 'user-1', 'other-party', 'emisor'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects an illegal state transition (en_revision cannot submit)', async () => {
      jest
        .spyOn(service as any, 'loadReportRow')
        .mockResolvedValue(reportRow({ status: ReportStatus.EN_REVISION }));
      await expect(
        service.submit('rep-1', 'user-1', PARTY, 'emisor'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects submitting a report with no line items', async () => {
      jest.spyOn(service as any, 'loadReportRow').mockResolvedValue(reportRow());
      jest.spyOn(service as any, 'getLineItemRows').mockResolvedValue([]);
      await expect(
        service.submit('rep-1', 'user-1', PARTY, 'emisor'),
      ).rejects.toThrow(/sin líneas/);
    });
  });

  // ── Envío feliz: snapshot inmutable, versión, auditoría, notificaciones ─────
  describe('submit happy path', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'loadReportRow').mockResolvedValue(reportRow());
      jest.spyOn(service as any, 'getLineItemRows').mockResolvedValue([lineRow()]);
      jest.spyOn(service as any, 'getFileRows').mockResolvedValue([]);
      jest
        .spyOn(service as any, 'getHeldBonds')
        .mockResolvedValue([{ bondTokenId: 'bond-a', amount: 1000 }]);
      jest.spyOn(service as any, 'tseUserIds').mockResolvedValue(['tse-1']);
      fromMock.mockImplementation((table: string) => {
        if (table === 'report_versions') return chain({ error: null });
        if (table === 'reports')
          return chain({ data: reportRow({ status: ReportStatus.ENVIADO, current_version: 1 }), error: null });
        return chain({ data: [], error: null });
      });
    });

    it('bumps version, moves to enviado, and reconciles clean', async () => {
      const res = await service.submit('rep-1', 'user-1', PARTY, 'emisor');
      expect(res.version).toBe(1);
      expect(res.report.status).toBe(ReportStatus.ENVIADO);
      expect(res.reconciliation.status).toBe('clean');
    });

    it('writes an immutable version snapshot with the reconciliation', async () => {
      const insertSpy = jest.fn((_row: any) => chain({ error: null }));
      fromMock.mockImplementation((table: string) => {
        if (table === 'report_versions') return { insert: insertSpy };
        if (table === 'reports')
          return chain({ data: reportRow({ status: ReportStatus.ENVIADO, current_version: 1 }), error: null });
        return chain({ data: [], error: null });
      });
      await service.submit('rep-1', 'user-1', PARTY, 'emisor');
      expect(insertSpy).toHaveBeenCalledTimes(1);
      const snap: any = insertSpy.mock.calls[0]![0];
      expect(snap.version).toBe(1);
      expect(snap.snapshot.declaredTotal).toBe(1000);
      expect(snap.snapshot.reconciliation.status).toBe('clean');
      expect(snap.snapshot.lineItems).toHaveLength(1);
    });

    it('emits version_created + submitted audit events', async () => {
      await service.submit('rep-1', 'user-1', PARTY, 'emisor');
      const types = audit.emit.mock.calls.map((c) => c[0].type);
      expect(types).toContain('report_version_created');
      expect(types).toContain('report_submitted');
      expect(types).not.toContain('report_resubmitted');
    });

    it('notifies the party and the TSE on submission', async () => {
      await service.submit('rep-1', 'user-1', PARTY, 'emisor');
      const recipients = notifications.emit.mock.calls.map((c) => c[0]);
      expect(recipients).toContain('user-1'); // party confirmation
      expect(recipients).toContain('tse-1'); // TSE notice
    });
  });

  // ── Reenvío (corrección tras observación) ──────────────────────────────────
  describe('resubmit after observado', () => {
    it('bumps to reenviado and emits report_resubmitted', async () => {
      jest
        .spyOn(service as any, 'loadReportRow')
        .mockResolvedValue(reportRow({ status: ReportStatus.OBSERVADO, current_version: 1 }));
      jest.spyOn(service as any, 'getLineItemRows').mockResolvedValue([lineRow()]);
      jest.spyOn(service as any, 'getFileRows').mockResolvedValue([]);
      jest
        .spyOn(service as any, 'getHeldBonds')
        .mockResolvedValue([{ bondTokenId: 'bond-a', amount: 1000 }]);
      jest.spyOn(service as any, 'tseUserIds').mockResolvedValue([]);
      fromMock.mockImplementation((table: string) => {
        if (table === 'report_versions') return chain({ error: null });
        return chain({ data: reportRow({ status: ReportStatus.REENVIADO, current_version: 2 }), error: null });
      });

      const res = await service.submit('rep-1', 'user-1', PARTY, 'emisor');
      expect(res.version).toBe(2);
      const types = audit.emit.mock.calls.map((c) => c[0].type);
      expect(types).toContain('report_resubmitted');
    });
  });

  // ── Subida de archivos: validación, checksum, antivirus ────────────────────
  describe('uploadFile', () => {
    beforeEach(() => {
      jest.spyOn(service as any, 'loadReportRow').mockResolvedValue(reportRow());
    });

    it('stores a clean file with its checksum and emits audit', async () => {
      const insertSpy = jest.fn((_row: any) =>
        chain({ data: { id: 'f1', report_id: 'rep-1', file_path: 'p', file_name: 'r.pdf', mime_type: 'application/pdf', size_bytes: 4, checksum: 'x', scan_status: 'clean', created_at: 'now' }, error: null }),
      );
      fromMock.mockImplementation(() => ({ insert: insertSpy }));

      const res = await service.uploadFile(
        'rep-1',
        { fileName: 'r.pdf', mimeType: 'application/pdf', buffer: Buffer.from('hola') },
        'user-1',
        PARTY,
        'emisor',
      );
      expect(uploadMock).toHaveBeenCalledTimes(1);
      expect(res.scanStatus).toBe('clean');
      const inserted: any = insertSpy.mock.calls[0]![0];
      expect(inserted.checksum).toHaveLength(64); // sha-256 hex
      expect(audit.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'report_file_uploaded' }),
      );
    });

    it('rejects an infected file and never stores it', async () => {
      await expect(
        service.uploadFile(
          'rep-1',
          {
            fileName: 'virus.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from(EICAR_TEST_SIGNATURE, 'latin1'),
          },
          'user-1',
          PARTY,
          'emisor',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(uploadMock).not.toHaveBeenCalled();
    });

    it('rejects a disallowed mime type', async () => {
      await expect(
        service.uploadFile(
          'rep-1',
          { fileName: 'x.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('x') },
          'user-1',
          PARTY,
          'emisor',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ── Builder: edición solo en estados editables ─────────────────────────────
  describe('addLineItem editability', () => {
    it('rejects editing a report under review', async () => {
      jest
        .spyOn(service as any, 'loadReportRow')
        .mockResolvedValue(reportRow({ status: ReportStatus.EN_REVISION }));
      await expect(
        service.addLineItem('rep-1', { concept: 'x', amount: 1, category: 'otro' }, PARTY, 'emisor'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('computeTotal', () => {
    it('sums line item amounts to cents', () => {
      expect(computeTotal([{ amount: 10.1 }, { amount: 20.2 }, { amount: 0.7 }])).toBe(31);
    });
  });
});
