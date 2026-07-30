/**
 * Exportaciones streaming con evidencia de integridad (tamper-evident).
 *
 * Describe el manifiesto y hashes por fila que se adjuntan al final de
 * un export CSV/PDF para verificación posterior.
 */
export declare const ExportFormat: {
    readonly CSV: "csv";
    readonly PDF: "pdf";
};
export type ExportFormat = (typeof ExportFormat)[keyof typeof ExportFormat];
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
