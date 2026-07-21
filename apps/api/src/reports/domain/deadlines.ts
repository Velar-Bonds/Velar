/**
 * Lógica de vencimientos y cumplimiento — FUNCIONES PURAS, sin DB.
 *
 * Un reporte mensual vence el día `dueDayOfMonth` del mes SIGUIENTE al período.
 * A partir de la config, la fecha de envío (si existe) y una fecha de referencia
 * ("hoy"), se computa el estado de cumplimiento del período y los días restantes.
 * Todo el cálculo es en UTC sobre fechas YYYY-MM-DD para evitar sesgos de zona.
 */
import {
  ComplianceStatus,
  DeadlineConfig,
  PeriodCompliance,
} from '@velar/types';

const MS_PER_DAY = 86_400_000;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Milisegundos UTC del inicio del día de una fecha ISO (ignora la hora). */
function dayUtc(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Días enteros entre dos fechas ISO (to - from). Negativo si `to` es anterior. */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((dayUtc(toIso) - dayUtc(fromIso)) / MS_PER_DAY);
}

/** Fecha de vencimiento (ISO) del reporte de un período. */
export function computeDueDate(
  periodYear: number,
  periodMonth: number,
  dueDayOfMonth: number,
): string {
  let year = periodYear;
  let month = periodMonth + 1; // vence el mes siguiente
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return isoDate(year, month, dueDayOfMonth);
}

export interface ComplianceInput {
  periodYear: number;
  periodMonth: number;
  config: DeadlineConfig;
  /** Fecha de envío del reporte, o null si no se envió. */
  submittedAt: string | null;
  /** Fecha de referencia ("hoy"), ISO. */
  now: string;
}

/** Computa el estado de cumplimiento de un período. Determinístico. */
export function computeCompliance(input: ComplianceInput): PeriodCompliance {
  const { periodYear, periodMonth, config, submittedAt, now } = input;
  const dueDate = computeDueDate(periodYear, periodMonth, config.dueDayOfMonth);
  const graceEnd = daysBetween('1970-01-01', dueDate) + config.graceDays;

  let status: ComplianceStatus;
  let daysRemaining: number | null;

  if (submittedAt) {
    // Ya enviado: on-time si fue en o antes del vencimiento, si no late.
    status =
      daysBetween(submittedAt, dueDate) >= 0
        ? ComplianceStatus.ON_TIME
        : ComplianceStatus.LATE;
    daysRemaining = null;
  } else {
    const toDue = daysBetween(now, dueDate);
    const nowDay = daysBetween('1970-01-01', now);
    if (toDue >= 0) {
      status = ComplianceStatus.NOT_DUE;
    } else if (nowDay <= graceEnd) {
      status = ComplianceStatus.OVERDUE;
    } else {
      status = ComplianceStatus.MISSING;
    }
    daysRemaining = toDue;
  }

  return {
    periodYear,
    periodMonth,
    dueDate,
    status,
    daysRemaining,
    submittedAt: submittedAt ?? null,
  };
}

/** Computa cumplimiento para varios períodos de una vez (dashboard del partido). */
export function computeComplianceForPeriods(
  periods: Array<{ periodYear: number; periodMonth: number; submittedAt: string | null }>,
  config: DeadlineConfig,
  now: string,
): PeriodCompliance[] {
  return periods.map((p) =>
    computeCompliance({
      periodYear: p.periodYear,
      periodMonth: p.periodMonth,
      config,
      submittedAt: p.submittedAt,
      now,
    }),
  );
}
