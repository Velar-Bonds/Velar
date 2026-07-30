/**
 * Motor de reglas explicable y versionado para el command center TSE.
 *
 * Evalúa reportes históricos y en vivo, produce findings con trazas de
 * razonamiento y soporta backtesting entre versiones de reglas.
 */

import type { DeclaredBondRef, HeldBond } from './report';

// ---------------------------------------------------------------------------
// Tipos de finding
// ---------------------------------------------------------------------------

/**
 * Clasificación de un hallazgo de reglas.
 * Reutiliza la semántica de `DiscrepancyType` y añade condiciones
 * temporales y de umbral.
 */
export const FindingType = {
  AMOUNT_MISMATCH: 'amount_mismatch',
  MISSING_BOND: 'missing_bond',
  UNKNOWN_REFERENCE: 'unknown_reference',
  OVERDUE: 'overdue',
  THRESHOLD_BREACH: 'threshold_breach',
} as const;

export type FindingType = (typeof FindingType)[keyof typeof FindingType];

// ---------------------------------------------------------------------------
// Severidad
// ---------------------------------------------------------------------------

export const FindingSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type FindingSeverity =
  (typeof FindingSeverity)[keyof typeof FindingSeverity];

// ---------------------------------------------------------------------------
// Finding y evaluación
// ---------------------------------------------------------------------------

export interface Finding {
  type: FindingType;
  severity: FindingSeverity;
  score: number;
  bondTokenId: string | null;
  message: string;
  /** Pasos ordenados de razonamiento ("por qué se disparó este finding"). */
  explanation: string[];
}

/** Identificador de versión del conjunto de reglas (p. ej. `'v1'`, `'v2'`). */
export type RuleSetVersion = string;

export interface RuleEvalResult {
  ruleSetVersion: RuleSetVersion;
  findings: Finding[];
  overallSeverity: FindingSeverity;
  evaluatedAt: string;
}

// ---------------------------------------------------------------------------
// Backtesting
// ---------------------------------------------------------------------------

/** Entrada de fixture para evaluar reglas contra reportes históricos. */
export interface HistoricalReportFixture {
  reportId: string;
  declared: DeclaredBondRef[];
  held: HeldBond[];
  periodYear: number;
  periodMonth: number;
  submittedAt: string | null;
  now: string;
}

export interface BacktestOutcomeDiff {
  reportId: string;
  baseline: RuleEvalResult;
  candidate: RuleEvalResult;
  added: Finding[];
  removed: Finding[];
  severityChanged: boolean;
}

export interface BacktestResult {
  baselineVersion: RuleSetVersion;
  candidateVersion: RuleSetVersion;
  diffs: BacktestOutcomeDiff[];
  summary: {
    reportsChanged: number;
    totalReports: number;
  };
}
