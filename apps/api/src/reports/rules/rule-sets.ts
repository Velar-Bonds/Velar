/**
 * Registro versionado de conjuntos de reglas — sin DB ni side-effects.
 *
 * Cada versión ajusta las bandas de severidad para amount_mismatch y el
 * umbral a partir del cual se dispara un finding de threshold_breach.
 * v2 es más estricto que v1 (bandas más bajas + umbral menor) para que
 * el backtesting v1→v2 produzca diffs visibles.
 */
import type { RuleSetVersion } from '@velar/types';

export interface RuleSetDefinition {
  version: RuleSetVersion;
  /**
   * Bandas de ratio relativo |declared − actual| / max(1, actual|declared)
   * para severity de amount_mismatch:
   *   < low → LOW, < medium → MEDIUM, < high → HIGH, else CRITICAL.
   */
  amountMismatchBands: { low: number; medium: number; high: number };
  /**
   * Monto declarado total a partir del cual se dispara `threshold_breach`
   * (y, en unknown_reference, eleva a CRITICAL si el monto declarado del
   * bono fantasma supera este umbral).
   */
  thresholdBreachAmount: number;
}

export const RULE_SETS: Record<RuleSetVersion, RuleSetDefinition> = {
  v1: {
    version: 'v1',
    amountMismatchBands: { low: 0.1, medium: 0.3, high: 0.6 },
    thresholdBreachAmount: 5_000_000,
  },
  v2: {
    version: 'v2',
    amountMismatchBands: { low: 0.05, medium: 0.15, high: 0.4 },
    thresholdBreachAmount: 3_000_000,
  },
};

export const DEFAULT_RULE_SET_VERSION: RuleSetVersion = 'v1';

export function getRuleSet(version: RuleSetVersion): RuleSetDefinition {
  const ruleSet = RULE_SETS[version];
  if (!ruleSet) {
    throw new Error(`Unknown rule-set version: ${version}`);
  }
  return ruleSet;
}

export function listRuleSetVersions(): RuleSetVersion[] {
  return Object.keys(RULE_SETS);
}
