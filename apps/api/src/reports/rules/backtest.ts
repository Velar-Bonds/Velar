/**
 * Backtesting entre versiones de conjuntos de reglas — puro, sin DB.
 *
 * Reutiliza reconcile() y computeCompliance() del dominio existente para
 * evaluar fixtures históricos bajo dos rule-set versions y producir diffs.
 */
import {
  BacktestOutcomeDiff,
  BacktestResult,
  DeadlineConfig,
  Finding,
  HistoricalReportFixture,
  RuleEvalResult,
  RuleSetVersion,
} from '@velar/types';
import { computeCompliance } from '../domain/deadlines';
import { reconcile } from '../domain/reconciliation';
import { evaluate } from './engine';

const DEFAULT_DEADLINE_CONFIG: DeadlineConfig = {
  dueDayOfMonth: 15,
  graceDays: 5,
};

function findingKey(f: Finding): string {
  return `${f.type}|${f.bondTokenId ?? ''}`;
}

/** Diff de findings entre dos evaluaciones del mismo reporte. */
export function diffEvaluations(
  baseline: RuleEvalResult,
  candidate: RuleEvalResult,
  reportId: string,
): BacktestOutcomeDiff {
  const baselineKeys = new Set(baseline.findings.map(findingKey));
  const candidateKeys = new Set(candidate.findings.map(findingKey));

  const added = candidate.findings.filter((f) => !baselineKeys.has(findingKey(f)));
  const removed = baseline.findings.filter((f) => !candidateKeys.has(findingKey(f)));

  return {
    reportId,
    baseline,
    candidate,
    added,
    removed,
    severityChanged: baseline.overallSeverity !== candidate.overallSeverity,
  };
}

/**
 * Evalúa un conjunto de fixtures históricos bajo baseline vs candidate.
 * Determinístico: usa `fixture.now` como reloj explícito.
 */
export function backtest(
  baselineVersion: RuleSetVersion,
  candidateVersion: RuleSetVersion,
  fixtures: HistoricalReportFixture[],
): BacktestResult {
  const diffs: BacktestOutcomeDiff[] = [];

  for (const fixture of fixtures) {
    const reconciliation = reconcile(fixture.declared, fixture.held);
    const compliance = computeCompliance({
      periodYear: fixture.periodYear,
      periodMonth: fixture.periodMonth,
      config: DEFAULT_DEADLINE_CONFIG,
      submittedAt: fixture.submittedAt,
      now: fixture.now,
    });

    const input = {
      reconciliation,
      compliance,
      declaredTotal: reconciliation.declaredTotal,
    };

    const baseline = evaluate(input, baselineVersion, fixture.now);
    const candidate = evaluate(input, candidateVersion, fixture.now);
    diffs.push(diffEvaluations(baseline, candidate, fixture.reportId));
  }

  const reportsChanged = diffs.filter(
    (d) => d.added.length > 0 || d.removed.length > 0 || d.severityChanged,
  ).length;

  return {
    baselineVersion,
    candidateVersion,
    diffs,
    summary: {
      reportsChanged,
      totalReports: fixtures.length,
    },
  };
}
