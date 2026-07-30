import * as PDFDocument from 'pdfkit';
import { ExportManifest } from '@velar/types';
import { recomputeFinalHash, type DecisionExportRow } from './csv-export';

/**
 * Genera un PDF streameable (PDFDocument extiende stream.Readable) con una
 * tabla simple de decisiones y un pie con el hash de integridad (mismo
 * esquema de encadenamiento que el CSV, vía `recomputeFinalHash`). Determinístico
 * dado el mismo `now` — fija `info.CreationDate` explícitamente para que el
 * PDF no incluya un timestamp implícito no determinístico.
 */
export function buildDecisionsPdf(rows: DecisionExportRow[], now: string): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    info: {
      CreationDate: new Date(now),
      Title: 'VELAR — Decisiones de cumplimiento TSE',
    },
  });
  doc.fontSize(14).text('VELAR — Reporte de decisiones de cumplimiento TSE', { align: 'center' });
  doc.moveDown();
  doc.fontSize(9);
  for (const row of rows) {
    doc.text(
      `${row.reportId} | ${row.partyName} | ${row.periodYear}/${row.periodMonth} | ${row.status} | ${row.declaredTotal}`,
    );
  }
  const manifest: ExportManifest = {
    format: 'pdf' as ExportManifest['format'],
    generatedAt: now,
    rowCount: rows.length,
    finalHash: recomputeFinalHash(rows),
    algorithm: 'sha256',
  };
  doc.moveDown().fontSize(7).fillColor('gray').text(`Integridad: ${JSON.stringify(manifest)}`);
  doc.end();
  return doc;
}
