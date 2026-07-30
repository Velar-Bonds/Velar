import type { ContractVersionDetail, ContractVersionDiff } from '@velar/types';

/**
 * Structured diff between two versions of the same template — PURE, no I/O.
 * Compares the ordered `clauseKeys` list: a key present in both is "changed"
 * if its resolved clause body or its order differs, "unchanged" otherwise.
 */
export function diffContractVersions(from: ContractVersionDetail, to: ContractVersionDetail): ContractVersionDiff {
  const fromByKey = new Map(from.clauses.map((clause, index) => [clause.clauseKey, { clause, order: index }]));
  const toByKey = new Map(to.clauses.map((clause, index) => [clause.clauseKey, { clause, order: index }]));

  const added = [...toByKey.entries()]
    .filter(([key]) => !fromByKey.has(key))
    .map(([key, { clause, order }]) => ({ clauseKey: key, title: clause.title, order }));

  const removed = [...fromByKey.entries()]
    .filter(([key]) => !toByKey.has(key))
    .map(([key, { clause, order }]) => ({ clauseKey: key, title: clause.title, order }));

  const changed: ContractVersionDiff['changed'] = [];
  const unchanged: ContractVersionDiff['unchanged'] = [];

  for (const [key, fromEntry] of fromByKey.entries()) {
    const toEntry = toByKey.get(key);
    if (!toEntry) continue;
    const bodyChanged = fromEntry.clause.bodyTemplate !== toEntry.clause.bodyTemplate;
    const orderChanged = fromEntry.order !== toEntry.order;
    if (bodyChanged || orderChanged) {
      changed.push({
        clauseKey: key,
        title: toEntry.clause.title,
        fromOrder: fromEntry.order,
        toOrder: toEntry.order,
        bodyChanged,
      });
    } else {
      unchanged.push({ clauseKey: key, title: toEntry.clause.title, order: toEntry.order });
    }
  }

  return { fromVersionId: from.id, toVersionId: to.id, added, removed, changed, unchanged };
}
