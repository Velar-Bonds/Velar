/**
 * Exportaciones streaming con evidencia de integridad (tamper-evident).
 *
 * Describe el manifiesto y hashes por fila que se adjuntan al final de
 * un export CSV/PDF para verificación posterior.
 */

// ---------------------------------------------------------------------------
// Formato de export
// ---------------------------------------------------------------------------

export const ExportFormat = {
  CSV: 'csv',
  PDF: 'pdf',
} as const;

export type ExportFormat = (typeof ExportFormat)[keyof typeof ExportFormat];

// ---------------------------------------------------------------------------
// Integridad por fila y manifiesto final
// ---------------------------------------------------------------------------

export interface ExportRowHash {
  rowIndex: number;
  hash: string;
}

/** Trailer de un export streamed: resume formato, conteo y hash final. */
export interface ExportManifest {
  format: ExportFormat;
  generatedAt: string;
  rowCount: number;
  finalHash: string;
  algorithm: 'sha256';
}
