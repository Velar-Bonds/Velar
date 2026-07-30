/**
 * Motor de evaluación de reglas — FUNCIONES PURAS, sin Date.now()/Math.random().
 *
 * Toma un resultado de conciliación + cumplimiento de período ya computados
 * y produce findings tipados con trazas de razonamiento. Determinístico:
 * mismas entradas + misma versión + mismo `now` → salida idéntica.
 */
import {
  ComplianceStatus,
  Discrepancy,
  DiscrepancyType,
  Finding,
  FindingSeverity,
  FindingType,
  PeriodCompliance,
  ReconciliationResult,
  RuleEvalResult,
  RuleSetVersion,
} from '@velar/types';
import { getRuleSet, RuleSetDefinition } from './rule-sets';

export interface RuleEvalInput {
  reconciliation: ReconciliationResult;
  compliance: PeriodCompliance;
  declaredTotal: number;
}

const SEVERITY_RANK: Record<FindingSeverity, number> = {
  [FindingSeverity.LOW]: 0,
  [FindingSeverity.MEDIUM]: 1,
  [FindingSeverity.HIGH]: 2,
  [FindingSeverity.CRITICAL]: 3,
};

function clampScore(n: number): number {
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n * 100) / 100;
}

function maxSeverity(a: FindingSeverity, b: FindingSeverity): FindingSeverity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

function bandAmountMismatch(
  ratio: number,
  bands: RuleSetDefinition['amountMismatchBands'],
): FindingSeverity {
  if (ratio < bands.low) return FindingSeverity.LOW;
  if (ratio < bands.medium) return FindingSeverity.MEDIUM;
  if (ratio < bands.high) return FindingSeverity.HIGH;
  return FindingSeverity.CRITICAL;
}

function findingFromAmountMismatch(
  d: Discrepancy,
  ruleSet: RuleSetDefinition,
): Finding {
  const declared = d.declaredAmount ?? 0;
  const actual = d.actualAmount;
  const denom = Math.max(1, actual ?? declared ?? 1);
  const ratio = Math.abs(declared - (actual ?? 0)) / denom;
  const severity = bandAmountMismatch(ratio, ruleSet.amountMismatchBands);
  return {
    type: FindingType.AMOUNT_MISMATCH,
    severity,
    score: clampScore(ratio * 100),
    bondTokenId: d.bondTokenId,
    message: d.message,
    explanation: [
      `Monto declarado: ${declared}`,
      `Monto real: ${actual ?? 'n/a'}`,
      `Ratio de discrepancia: ${(ratio * 100).toFixed(2)}%`,
      `Bandas (${ruleSet.version}): low=${ruleSet.amountMismatchBands.low}, medium=${ruleSet.amountMismatchBands.medium}, high=${ruleSet.amountMismatchBands.high}`,
      `Severidad asignada: ${severity}`,
    ],
  };
}

function findingFromMissingBond(
  d: Discrepancy,
  declaredTotal: number,
): Finding {
  const actual = d.actualAmount ?? 0;
  const fraction = declaredTotal > 0 ? actual / declaredTotal : actual > 0 ? Infinity : 0;
  const material = fraction > 0.1;
  const severity = material ? FindingSeverity.HIGH : FindingSeverity.MEDIUM;
  const pct =
    declaredTotal > 0
      ? `${((actual / declaredTotal) * 100).toFixed(2)}%`
      : 'n/a (declaredTotal=0)';
  return {
    type: FindingType.MISSING_BOND,
    severity,
    score: clampScore(material ? Math.min(100, fraction * 100) : 40),
    bondTokenId: d.bondTokenId,
    message: d.message,
    explanation: [
      `Bono no declarado: ${d.bondTokenId}`,
      `Valor real del bono: ${actual}`,
      `Total declarado del reporte: ${declaredTotal}`,
      `Fracción relativa al total declarado: ${pct}`,
      material
        ? 'Fracción material (>10%) → severidad HIGH'
        : 'Fracción no material (≤10%) → severidad MEDIUM',
    ],
  };
}

function findingFromUnknownReference(
  d: Discrepancy,
  ruleSet: RuleSetDefinition,
): Finding {
  const declared = d.declaredAmount ?? 0;
  const exceeds = declared > ruleSet.thresholdBreachAmount;
  const severity = exceeds ? FindingSeverity.CRITICAL : FindingSeverity.HIGH;
  return {
    type: FindingType.UNKNOWN_REFERENCE,
    severity,
    score: clampScore(
      exceeds
        ? 100
        : Math.min(
            99,
            70 + (declared / Math.max(1, ruleSet.thresholdBreachAmount)) * 25,
          ),
    ),
    bondTokenId: d.bondTokenId,
    message: d.message,
    explanation: [
      `Referencia desconocida: el reporte cita el bono ${d.bondTokenId} que el partido no posee`,
      `Monto declarado para ese bono: ${declared}`,
      `Umbral de breach (${ruleSet.version}): ${ruleSet.thresholdBreachAmount}`,
      exceeds
        ? 'Monto declarado supera el umbral → severidad CRITICAL (posible tenencia fabricada material)'
        : 'Bandera roja de tenencia fabricada → severidad HIGH (mínimo)',
    ],
  };
}

function findingFromDiscrepancy(
  d: Discrepancy,
  ruleSet: RuleSetDefinition,
  declaredTotal: number,
): Finding {
  switch (d.type) {
    case DiscrepancyType.AMOUNT_MISMATCH:
      return findingFromAmountMismatch(d, ruleSet);
    case DiscrepancyType.MISSING_BOND:
      return findingFromMissingBond(d, declaredTotal);
    case DiscrepancyType.UNKNOWN_REFERENCE:
      return findingFromUnknownReference(d, ruleSet);
    default: {
      const _exhaustive: never = d.type;
      throw new Error(`Unhandled discrepancy type: ${_exhaustive}`);
    }
  }
}

function findingFromOverdue(compliance: PeriodCompliance): Finding | null {
  if (
    compliance.status !== ComplianceStatus.OVERDUE &&
    compliance.status !== ComplianceStatus.MISSING
  ) {
    return null;
  }
  const daysOver =
    compliance.daysRemaining === null
      ? 0
      : Math.max(0, -compliance.daysRemaining);
  const isMissing = compliance.status === ComplianceStatus.MISSING;
  const severity = isMissing ? FindingSeverity.HIGH : FindingSeverity.MEDIUM;
  return {
    type: FindingType.OVERDUE,
    severity,
    score: clampScore(isMissing ? Math.min(100, 60 + daysOver) : Math.min(80, 40 + daysOver)),
    bondTokenId: null,
    message: isMissing
      ? `Reporte faltante: venció el ${compliance.dueDate} y ya está fuera de gracia (${daysOver} días de atraso).`
      : `Reporte vencido: venció el ${compliance.dueDate} (${daysOver} días de atraso, aún en gracia).`,
    explanation: [
      `Estado de cumplimiento: ${compliance.status}`,
      `Fecha de vencimiento: ${compliance.dueDate}`,
      `Días de atraso: ${daysOver}`,
      isMissing
        ? 'Sin envío y fuera de gracia → severidad HIGH'
        : 'Sin envío pero dentro de gracia → severidad MEDIUM',
    ],
  };
}

function findingFromThresholdBreach(
  declaredTotal: number,
  ruleSet: RuleSetDefinition,
): Finding | null {
  if (declaredTotal < ruleSet.thresholdBreachAmount) return null;
  const multiple = declaredTotal / ruleSet.thresholdBreachAmount;
  const severity =
    multiple > 2 ? FindingSeverity.CRITICAL : FindingSeverity.HIGH;
  return {
    type: FindingType.THRESHOLD_BREACH,
    severity,
    score: clampScore(Math.min(100, multiple * 50)),
    bondTokenId: null,
    message: `Total declarado (${declaredTotal}) alcanza o supera el umbral (${ruleSet.thresholdBreachAmount}).`,
    explanation: [
      `Total declarado: ${declaredTotal}`,
      `Umbral configurado (${ruleSet.version}): ${ruleSet.thresholdBreachAmount}`,
      `Múltiplo del umbral: ${multiple.toFixed(2)}x`,
      multiple > 2
        ? 'Supera 2× el umbral → severidad CRITICAL'
        : 'En o por encima del umbral (≤2×) → severidad HIGH',
    ],
  };
}

function compareFindings(a: Finding, b: Finding): number {
  const sev = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
  if (sev !== 0) return sev;
  const typeCmp = a.type.localeCompare(b.type);
  if (typeCmp !== 0) return typeCmp;
  return (a.bondTokenId ?? '').localeCompare(b.bondTokenId ?? '');
}

/**
 * Evalúa reglas sobre datos de conciliación/cumplimiento ya disponibles.
 * Puro y determinístico: pasa `now` explícito (ISO) para `evaluatedAt`.
 */
export function evaluate(
  input: RuleEvalInput,
  ruleSetVersion: RuleSetVersion,
  now: string,
): RuleEvalResult {
  const ruleSet = getRuleSet(ruleSetVersion);
  const findings: Finding[] = [];

  for (const d of input.reconciliation.discrepancies) {
    findings.push(findingFromDiscrepancy(d, ruleSet, input.declaredTotal));
  }

  const overdue = findingFromOverdue(input.compliance);
  if (overdue) findings.push(overdue);

  const breach = findingFromThresholdBreach(input.declaredTotal, ruleSet);
  if (breach) findings.push(breach);

  findings.sort(compareFindings);

  let overallSeverity: FindingSeverity = FindingSeverity.LOW;
  for (const f of findings) {
    overallSeverity = maxSeverity(overallSeverity, f.severity);
  }

  return {
    ruleSetVersion,
    findings,
    overallSeverity,
    evaluatedAt: now,
  };
}
