import { ExportManifest } from '@velar/types';
import { computeEventHash } from '../../audit/audit-chain';

export interface DecisionExportRow {
  reportId: string;
  partyName: string;
  periodYear: number;
  periodMonth: number;
  status: string;
  declaredTotal: number;
  reviewedBy: string | null;
  reviewedAt: string | null;
  ruleSetVersion: string | null;
  overallSeverity: string | null;
}

const CSV_HEADER =
  'report_id,party_name,period_year,period_month,status,declared_total,reviewed_by,reviewed_at,rule_set_version,overall_severity';

function csvEscape(value: string | number | null): string {
  const s = value === null ? '' : String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowToCsvLine(row: DecisionExportRow): string {
  return [
    csvEscape(row.reportId),
    csvEscape(row.partyName),
    csvEscape(row.periodYear),
    csvEscape(row.periodMonth),
    csvEscape(row.status),
    csvEscape(row.declaredTotal),
    csvEscape(row.reviewedBy),
    csvEscape(row.reviewedAt),
    csvEscape(row.ruleSetVersion),
    csvEscape(row.overallSeverity),
  ].join(',');
}

/**
 * Generador async que produce el CSV línea por línea (streaming real: no
 * buferiza todo el dataset), encadenando un hash por fila (reutiliza
 * `computeEventHash` del módulo de audit-chain) y termina con una fila de
 * manifiesto (`# manifest: {...}` como JSON de `ExportManifest`) para
 * evidencia de integridad — cualquier fila alterada después de generarse
 * invalidaría el hash final recalculado por un verificador.
 */
export async function* streamDecisionsCsv(
  rows: DecisionExportRow[],
  now: string,
): AsyncGenerator<string> {
  yield CSV_HEADER + '\n';
  let prevHash: string | null = null;
  for (const row of rows) {
    const line = rowToCsvLine(row);
    prevHash = computeEventHash(prevHash, line);
    yield line + '\n';
  }
  const manifest: ExportManifest = {
    format: 'csv' as ExportManifest['format'],
    generatedAt: now,
    rowCount: rows.length,
    finalHash: prevHash ?? computeEventHash(null, CSV_HEADER),
    algorithm: 'sha256',
  };
  yield `# manifest: ${JSON.stringify(manifest)}\n`;
}

/** Recolecta el generador en un string completo (para tests o para el caso no-streaming). */
export async function collectCsv(rows: DecisionExportRow[], now: string): Promise<string> {
  let out = '';
  for await (const chunk of streamDecisionsCsv(rows, now)) out += chunk;
  return out;
}

/** Recalcula el hash final a partir de las filas (sin la fila de manifiesto) — para verificación posterior. */
export function recomputeFinalHash(rows: DecisionExportRow[]): string {
  let prevHash: string | null = null;
  for (const row of rows) prevHash = computeEventHash(prevHash, rowToCsvLine(row));
  return prevHash ?? computeEventHash(null, CSV_HEADER);
}
