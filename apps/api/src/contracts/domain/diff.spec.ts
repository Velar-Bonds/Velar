import { contractVersionFixture, contractVersionFixtureV2 } from '@velar/types';
import { diffContractVersions } from './diff';

describe('diffContractVersions', () => {
  const diff = diffContractVersions(contractVersionFixture, contractVersionFixtureV2);

  it('detects an added clause (plazo, new in v2)', () => {
    expect(diff.added.map((c) => c.clauseKey)).toEqual(['clause-plazo']);
  });

  it('detects removed clauses (garantia and jurisdiccion, dropped in v2)', () => {
    expect(diff.removed.map((c) => c.clauseKey)).toEqual(
      expect.arrayContaining(['clause-garantia', 'clause-jurisdiccion']),
    );
    expect(diff.removed).toHaveLength(2);
  });

  it('detects a changed clause body (pago wording differs)', () => {
    const pago = diff.changed.find((c) => c.clauseKey === 'clause-pago');
    expect(pago).toBeDefined();
    expect(pago!.bodyChanged).toBe(true);
  });

  it('leaves unmodified clauses in unchanged', () => {
    expect(diff.unchanged.map((c) => c.clauseKey)).toEqual(expect.arrayContaining(['clause-partes', 'clause-objeto']));
  });

  it('reports the from/to version ids', () => {
    expect(diff.fromVersionId).toBe(contractVersionFixture.id);
    expect(diff.toVersionId).toBe(contractVersionFixtureV2.id);
  });

  it('is symmetric-ish: diffing a version against itself yields no changes', () => {
    const same = diffContractVersions(contractVersionFixture, contractVersionFixture);
    expect(same.added).toEqual([]);
    expect(same.removed).toEqual([]);
    expect(same.changed).toEqual([]);
    expect(same.unchanged).toHaveLength(contractVersionFixture.clauses.length);
  });
});
