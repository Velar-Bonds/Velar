import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import type { AnalyticsSnapshot } from '@velar/types';

/**
 * Deterministic PDF export of an `AnalyticsSnapshot` (issue #44). Pure Node,
 * no headless browser/vendor. Content is deterministic given the same
 * snapshot; internal PDF object ordering/IDs are not byte-stable across
 * pdf-lib versions, so tests assert structurally (see analytics-pdf.spec.ts).
 */
export async function renderAnalyticsPdf(snapshot: AnalyticsSnapshot): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let page = doc.addPage();
  let y = page.getSize().height - margin;

  const draw = (text: string, size = 11, useFont: PDFFont = font) => {
    if (y < margin + size) {
      page = doc.addPage();
      y = page.getSize().height - margin;
    }
    page.drawText(text, { x: margin, y, size, font: useFont, color: rgb(0, 0, 0) });
    y -= size + 6;
  };

  draw('VELAR — Reporte de analítica', 16, bold);
  draw(`Generado: ${snapshot.generatedAt}`);
  draw('');

  draw('Resumen', 13, bold);
  draw(`Bonos totales: ${snapshot.valueVolume.totalBonds}`);
  draw(`Valor emitido: ${snapshot.valueVolume.totalEmittedValue}`);
  draw(`Transferencias: ${snapshot.valueVolume.totalTransfers}`);
  draw(`Ventas liberadas: ${snapshot.valueVolume.totalSales}`);
  draw(`Volumen movido: ${snapshot.valueVolume.totalVolumeMoved}`);
  draw('');

  draw('Bonos por estado', 13, bold);
  for (const b of snapshot.bondStatusBreakdown) {
    draw(`${b.status}: ${b.count} bono(s), valor ${b.faceValue}`);
  }
  draw('');

  draw('Por partido', 13, bold);
  for (const p of snapshot.partyBreakdown) {
    draw(`${p.partyId}: ${p.bondsCount} bono(s), volumen movido ${p.volumeMoved}`);
  }
  draw('');

  draw('Embudo de transferencias', 13, bold);
  for (const stage of snapshot.funnel.stages) {
    draw(`${stage.step}: ${stage.reachedCount} (${stage.conversionFromStartPct}%)`);
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
