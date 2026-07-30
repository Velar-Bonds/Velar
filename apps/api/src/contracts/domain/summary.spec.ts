import {
  bondFixture,
  contractTemplateFixture,
  contractVersionFixture,
  transferFixtureReleased,
  transfersFixture,
  type BondToken,
  type ContractSummaryInput,
  type Transfer,
} from '@velar/types';
import {
  deriveAmount,
  deriveAttentionFlags,
  deriveContractStatus,
  deriveContractSummary,
  deriveKeyDates,
} from './summary';

const NOW = '2026-07-20T00:00:00.000Z';

const PARAMS = {
  sellerName: 'Partido Aurora',
  buyerName: 'Juan Pérez',
  bondId: bondFixture.bondId,
  tokenId: bondFixture.tokenId,
  amount: '520000',
  currency: 'CRC',
  paymentMethod: 'SINPE',
  jurisdiction: 'la República de Costa Rica',
  authority: 'el Tribunal Supremo de Elecciones (TSE)',
};

function baseInput(overrides: Partial<ContractSummaryInput> = {}): ContractSummaryInput {
  return {
    bond: bondFixture,
    transfers: transfersFixture,
    template: contractTemplateFixture,
    version: contractVersionFixture,
    params: PARAMS,
    now: NOW,
    ...overrides,
  };
}

describe('deriveContractStatus', () => {
  it('returns congelado when the bond is frozen, regardless of transfers', () => {
    const bond: BondToken = { ...bondFixture, status: 'congelado' };
    expect(deriveContractStatus(bond, transfersFixture)).toBe('congelado');
  });

  it('returns liberado when the latest transfer was released', () => {
    expect(deriveContractStatus(bondFixture, transfersFixture)).toBe('liberado');
  });

  it('returns en_escrow while the transfer is in escrow/payment stages', () => {
    const transfer: Transfer = { ...transferFixtureReleased, status: 'en_escrow' };
    expect(deriveContractStatus(bondFixture, [transfer])).toBe('en_escrow');
  });

  it('returns en_negociacion while the transfer is being negotiated', () => {
    const transfer: Transfer = { ...transferFixtureReleased, status: 'solicitada' };
    expect(deriveContractStatus(bondFixture, [transfer])).toBe('en_negociacion');
  });

  it('ignores rejected/cancelled transfers and falls back to bond status', () => {
    const transfer: Transfer = { ...transferFixtureReleased, status: 'rechazada' };
    const bond: BondToken = { ...bondFixture, status: 'activo' };
    expect(deriveContractStatus(bond, [transfer])).toBe('vigente');
  });

  it('returns borrador for a freshly-issued bond with no transfers', () => {
    const bond: BondToken = { ...bondFixture, status: 'emitido' };
    expect(deriveContractStatus(bond, [])).toBe('borrador');
  });
});

describe('deriveAmount', () => {
  it('prefers the active transfer amount over the bond face value', () => {
    const amount = deriveAmount(bondFixture, transfersFixture);
    expect(amount).toEqual({ value: transferFixtureReleased.amount, currency: bondFixture.currency, unknown: false });
  });

  it('falls back to bond face value when there is no active transfer', () => {
    const amount = deriveAmount(bondFixture, []);
    expect(amount).toEqual({ value: bondFixture.faceValue, currency: bondFixture.currency, unknown: false });
  });

  it('is explicitly unknown when neither source has a value', () => {
    const bond: BondToken = { ...bondFixture, faceValue: null };
    expect(deriveAmount(bond, []).unknown).toBe(true);
  });
});

describe('deriveKeyDates', () => {
  it('maps every date field to real input and flags missing ones as unknown', () => {
    const dates = deriveKeyDates(baseInput());
    const issue = dates.find((d) => d.kind === 'issue_date')!;
    expect(issue.date).toBe(bondFixture.issueDate);
    expect(issue.unknown).toBe(false);

    const bondNoMaturity: BondToken = { ...bondFixture, maturityDate: null };
    const maturity = deriveKeyDates(baseInput({ bond: bondNoMaturity })).find((d) => d.kind === 'maturity_date')!;
    expect(maturity.date).toBeNull();
    expect(maturity.unknown).toBe(true);
  });

  it('adds a "released" date only when the transfer is liberada', () => {
    const dates = deriveKeyDates(baseInput());
    expect(dates.some((d) => d.kind === 'released')).toBe(true);

    const noTransfers = deriveKeyDates(baseInput({ transfers: [] }));
    expect(noTransfers.some((d) => d.kind === 'released')).toBe(false);
    expect(noTransfers.some((d) => d.kind === 'transfer_requested')).toBe(false);
  });
});

describe('deriveAttentionFlags', () => {
  it('fires approaching_maturity when the maturity date is within 30 days', () => {
    const bond: BondToken = { ...bondFixture, maturityDate: '2026-08-05' };
    const flags = deriveAttentionFlags(baseInput({ bond, now: NOW }));
    expect(flags.map((f) => f.kind)).toContain('approaching_maturity');
  });

  it('does not fire approaching_maturity when the deadline is far away', () => {
    const bond: BondToken = { ...bondFixture, maturityDate: '2027-06-01' };
    const flags = deriveAttentionFlags(baseInput({ bond, now: NOW }));
    expect(flags.map((f) => f.kind)).not.toContain('approaching_maturity');
  });

  it('fires frozen for a congelado bond', () => {
    const bond: BondToken = { ...bondFixture, status: 'congelado' };
    const flags = deriveAttentionFlags(baseInput({ bond }));
    expect(flags.map((f) => f.kind)).toContain('frozen');
  });

  it('fires stalled_escrow when a transfer has sat in escrow past the threshold', () => {
    const transfer: Transfer = { ...transferFixtureReleased, status: 'en_escrow', updatedAt: '2026-06-01T00:00:00.000Z' };
    const flags = deriveAttentionFlags(baseInput({ transfers: [transfer], now: NOW }));
    expect(flags.map((f) => f.kind)).toContain('stalled_escrow');
  });

  it('does not fire stalled_escrow for a recently-updated escrow transfer', () => {
    const transfer: Transfer = { ...transferFixtureReleased, status: 'en_escrow', updatedAt: '2026-07-18T00:00:00.000Z' };
    const flags = deriveAttentionFlags(baseInput({ transfers: [transfer], now: NOW }));
    expect(flags.map((f) => f.kind)).not.toContain('stalled_escrow');
  });

  it('fires amount_mismatch when the transfer amount differs from the face value', () => {
    const transfer: Transfer = { ...transferFixtureReleased, amount: 999999 };
    const flags = deriveAttentionFlags(baseInput({ transfers: [transfer] }));
    expect(flags.map((f) => f.kind)).toContain('amount_mismatch');
  });
});

describe('deriveContractSummary', () => {
  it('resolves every clause and never leaves an unresolved {{token}} when params are complete', () => {
    const summary = deriveContractSummary(baseInput());
    for (const clause of summary.clauses) {
      expect(clause.legalText).not.toMatch(/\{\{/);
    }
  });

  it('marks missing parameters explicitly instead of fabricating text', () => {
    const summary = deriveContractSummary(baseInput({ params: {} }));
    const pago = summary.clauses.find((c) => c.category === 'pago')!;
    expect(pago.legalText).toContain('[dato no disponible: amount]');
  });

  it('never invents a clause: clause count matches the version', () => {
    const summary = deriveContractSummary(baseInput());
    expect(summary.clauses).toHaveLength(contractVersionFixture.clauses.length);
  });

  it('is deterministic for identical input', () => {
    expect(deriveContractSummary(baseInput())).toEqual(deriveContractSummary(baseInput()));
  });
});
