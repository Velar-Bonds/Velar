import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsDataService } from './analytics-data.service';
import { SupabaseService } from '../common/supabase/supabase.service';

const rawBond = {
  token_id: 'tok-1',
  bond_id: 'BOND-1',
  issuer_party_id: 'party-1',
  country: 'CR',
  current_owner: 'owner-1',
  status: 'activo',
  document_hash: 'sha256-x',
  face_value: 1000,
  currency: 'CRC',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
};

const rawTransfer = {
  id: 'transfer-1',
  bond_token_id: 'tok-1',
  from_owner: 'owner-1',
  to_owner: 'owner-2',
  status: 'liberada',
  amount: 1200,
  created_at: '2026-01-05T00:00:00.000Z',
  updated_at: '2026-01-10T00:00:00.000Z',
};

const rawReportWithPeriod = {
  id: 'report-1',
  party_id: 'party-1',
  period_year: 2026,
  period_month: 3,
  status: 'aprobado',
  current_version: 1,
  title: 'Reporte marzo',
  submitted_by: 'user-1',
  submitted_at: '2026-04-10T00:00:00.000Z',
  reviewed_by: 'tse-1',
  reviewed_at: '2026-04-12T00:00:00.000Z',
  tse_notes: null,
  created_at: '2026-04-01T00:00:00.000Z',
  updated_at: '2026-04-12T00:00:00.000Z',
};

const rawLegacyReport = {
  id: 'report-legacy',
  party_id: 'party-1',
  period_year: null,
  period_month: null,
  status: 'enviado',
  title: 'Reporte legado sin período',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

function makeFromMock(overrides: Partial<Record<'bonds' | 'transfers' | 'reports', { data: any[] | null; error: any }>> = {}) {
  const defaults = {
    bonds: { data: [rawBond], error: null },
    transfers: { data: [rawTransfer], error: null },
    reports: { data: [rawReportWithPeriod, rawLegacyReport], error: null },
  };
  const tables = { ...defaults, ...overrides };
  return jest.fn((table: keyof typeof tables) => ({
    select: () => Promise.resolve(tables[table]),
  }));
}

describe('AnalyticsDataService', () => {
  let service: AnalyticsDataService;

  async function build(fromMock: jest.Mock) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsDataService, { provide: SupabaseService, useValue: { admin: { from: fromMock } } }],
    }).compile();
    return module.get(AnalyticsDataService);
  }

  it('maps bonds/transfers/reports rows to the @velar/types camelCase shapes', async () => {
    service = await build(makeFromMock());
    const input = await service.getAnalyticsInput();

    expect(input.bonds).toEqual([
      {
        tokenId: 'tok-1',
        bondId: 'BOND-1',
        issuerPartyId: 'party-1',
        country: 'CR',
        currentOwner: 'owner-1',
        status: 'activo',
        documentHash: 'sha256-x',
        metadataUri: null,
        faceValue: 1000,
        certificateNumber: null,
        currency: 'CRC',
        interestRate: null,
        series: null,
        issueDate: null,
        maturityDate: null,
        stellarStatus: null,
        stellarTransactionHash: null,
        stellarLedger: null,
        stellarAssetCode: null,
        stellarIssuerPublicKey: null,
        stellarOwnerPublicKey: null,
        stellarRegisteredAt: null,
        stellarError: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ]);

    expect(input.transfers).toEqual([
      {
        id: 'transfer-1',
        bondTokenId: 'tok-1',
        fromOwner: 'owner-1',
        toOwner: 'owner-2',
        status: 'liberada',
        escrowContractId: null,
        paymentEvidenceHash: null,
        validatedBy: null,
        amount: 1200,
        counterOfferAmount: null,
        sellerMessage: null,
        buyerMessage: null,
        createdAt: '2026-01-05T00:00:00.000Z',
        updatedAt: '2026-01-10T00:00:00.000Z',
      },
    ]);
  });

  it('excludes legacy reports with no period_year/period_month', async () => {
    service = await build(makeFromMock());
    const input = await service.getAnalyticsInput();
    expect(input.reports).toHaveLength(1);
    expect(input.reports[0]).toMatchObject({ id: 'report-1', periodYear: 2026, periodMonth: 3, currentVersion: 1 });
  });

  it('returns empty arrays when tables have no rows', async () => {
    service = await build(makeFromMock({ bonds: { data: [], error: null }, transfers: { data: null, error: null }, reports: { data: [], error: null } }));
    const input = await service.getAnalyticsInput();
    expect(input).toEqual({ bonds: [], transfers: [], reports: [] });
  });

  it('propagates a Supabase error as BadRequestException', async () => {
    service = await build(makeFromMock({ bonds: { data: null, error: { message: 'boom' } } }));
    await expect(service.getAnalyticsInput()).rejects.toThrow(BadRequestException);
  });
});
