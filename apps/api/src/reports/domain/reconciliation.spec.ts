import { reconcile, declaredRefsFromLineItems } from './reconciliation';
import { DeclaredBondRef, DiscrepancyType, HeldBond } from '@velar/types';

const held: HeldBond[] = [
  { bondTokenId: 'bond-a', amount: 1000 },
  { bondTokenId: 'bond-b', amount: 2500 },
];

describe('reconcile', () => {
  it('clean match: declared == held → no discrepancies', () => {
    const declared: DeclaredBondRef[] = [
      { bondTokenId: 'bond-a', amount: 1000 },
      { bondTokenId: 'bond-b', amount: 2500 },
    ];
    const res = reconcile(declared, held);
    expect(res.status).toBe('clean');
    expect(res.discrepancies).toHaveLength(0);
    expect(res.matchedCount).toBe(2);
    expect(res.declaredTotal).toBe(3500);
    expect(res.actualTotal).toBe(3500);
  });

  it('amount mismatch: declared amount differs from held value', () => {
    const declared: DeclaredBondRef[] = [
      { bondTokenId: 'bond-a', amount: 999 },
      { bondTokenId: 'bond-b', amount: 2500 },
    ];
    const res = reconcile(declared, held);
    expect(res.status).toBe('discrepancies');
    expect(res.discrepancies).toHaveLength(1);
    expect(res.discrepancies[0]).toMatchObject({
      type: DiscrepancyType.AMOUNT_MISMATCH,
      bondTokenId: 'bond-a',
      declaredAmount: 999,
      actualAmount: 1000,
    });
    expect(res.matchedCount).toBe(1);
  });

  it('missing bond: party holds a bond that was not declared', () => {
    const declared: DeclaredBondRef[] = [{ bondTokenId: 'bond-a', amount: 1000 }];
    const res = reconcile(declared, held);
    expect(res.status).toBe('discrepancies');
    const missing = res.discrepancies.find((d) => d.type === DiscrepancyType.MISSING_BOND);
    expect(missing).toMatchObject({
      bondTokenId: 'bond-b',
      declaredAmount: null,
      actualAmount: 2500,
    });
    expect(res.matchedCount).toBe(1);
  });

  it('unknown reference: report cites a bond the party does not hold', () => {
    const declared: DeclaredBondRef[] = [
      { bondTokenId: 'bond-a', amount: 1000 },
      { bondTokenId: 'bond-b', amount: 2500 },
      { bondTokenId: 'ghost', amount: 50 },
    ];
    const res = reconcile(declared, held);
    const unknown = res.discrepancies.find((d) => d.type === DiscrepancyType.UNKNOWN_REFERENCE);
    expect(unknown).toMatchObject({
      bondTokenId: 'ghost',
      declaredAmount: 50,
      actualAmount: null,
    });
    expect(res.matchedCount).toBe(2);
  });

  it('empty report against held bonds → all held flagged as missing', () => {
    const res = reconcile([], held);
    expect(res.status).toBe('discrepancies');
    expect(res.discrepancies).toHaveLength(2);
    expect(res.discrepancies.every((d) => d.type === DiscrepancyType.MISSING_BOND)).toBe(true);
    expect(res.declaredTotal).toBe(0);
    expect(res.actualTotal).toBe(3500);
    expect(res.matchedCount).toBe(0);
  });

  it('empty report against no held bonds → clean', () => {
    const res = reconcile([], []);
    expect(res.status).toBe('clean');
    expect(res.discrepancies).toHaveLength(0);
    expect(res.matchedCount).toBe(0);
  });

  it('aggregates multiple line items citing the same bond', () => {
    const declared: DeclaredBondRef[] = [
      { bondTokenId: 'bond-a', amount: 600 },
      { bondTokenId: 'bond-a', amount: 400 },
      { bondTokenId: 'bond-b', amount: 2500 },
    ];
    const res = reconcile(declared, held);
    expect(res.status).toBe('clean');
    expect(res.matchedCount).toBe(2);
  });

  it('tolerates sub-cent floating point noise', () => {
    const declared: DeclaredBondRef[] = [
      { bondTokenId: 'bond-a', amount: 1000.004 },
      { bondTokenId: 'bond-b', amount: 2500 },
    ];
    const res = reconcile(declared, held);
    expect(res.status).toBe('clean');
  });

  it('produces a deterministic, stable ordering of discrepancies', () => {
    const declared: DeclaredBondRef[] = [{ bondTokenId: 'zeta', amount: 10 }];
    const a = reconcile(declared, held);
    const b = reconcile(declared, held);
    expect(a.discrepancies).toEqual(b.discrepancies);
  });
});

describe('declaredRefsFromLineItems', () => {
  it('keeps only line items with a bond reference', () => {
    const refs = declaredRefsFromLineItems([
      { bondTokenId: 'bond-a', amount: 100 },
      { bondTokenId: null, amount: 50 },
      { bondTokenId: 'bond-b', amount: 200 },
    ]);
    expect(refs).toEqual([
      { bondTokenId: 'bond-a', amount: 100 },
      { bondTokenId: 'bond-b', amount: 200 },
    ]);
  });
});
