import type { AnalyticsSnapshot } from '@velar/types';

/**
 * Deterministic CSV export of an `AnalyticsSnapshot` (issue #44). Pure — no
 * I/O — so it's fully fixture-testable, unlike the old `exportTransfersCsv`
 * which needed live joined Supabase rows (seller/buyer names) that don't
 * exist in the fixture-fed `AnalyticsInput` model.
 */

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function row(cells: (string | number)[]): string {
  return cells.map(csvCell).join(',');
}

export function renderSnapshotCsv(snapshot: AnalyticsSnapshot): string {
  const lines: string[] = [];

  lines.push(row(['generated_at', snapshot.generatedAt]));
  lines.push('');

  lines.push(row(['section', 'status', 'count', 'face_value']));
  for (const b of snapshot.bondStatusBreakdown) {
    lines.push(row(['bond_status', b.status, b.count, b.faceValue]));
  }
  lines.push('');

  lines.push(row(['section', 'party_id', 'bonds_count', 'emitted_value', 'sales_count', 'volume_moved']));
  for (const p of snapshot.partyBreakdown) {
    lines.push(row(['party', p.partyId, p.bondsCount, p.emittedValue, p.salesCount, p.volumeMoved]));
  }
  lines.push('');

  lines.push(row(['section', 'country', 'bonds_count', 'emitted_value', 'sales_count', 'volume_moved']));
  for (const c of snapshot.countryBreakdown) {
    lines.push(row(['country', c.country, c.bondsCount, c.emittedValue, c.salesCount, c.volumeMoved]));
  }
  lines.push('');

  lines.push(row(['section', 'metric', 'value']));
  lines.push(row(['value_volume', 'total_bonds', snapshot.valueVolume.totalBonds]));
  lines.push(row(['value_volume', 'total_emitted_value', snapshot.valueVolume.totalEmittedValue]));
  lines.push(row(['value_volume', 'total_transfers', snapshot.valueVolume.totalTransfers]));
  lines.push(row(['value_volume', 'total_sales', snapshot.valueVolume.totalSales]));
  lines.push(row(['value_volume', 'total_volume_moved', snapshot.valueVolume.totalVolumeMoved]));

  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
