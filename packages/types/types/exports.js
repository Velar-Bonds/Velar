"use strict";
/**
 * Exportaciones streaming con evidencia de integridad (tamper-evident).
 *
 * Describe el manifiesto y hashes por fila que se adjuntan al final de
 * un export CSV/PDF para verificación posterior.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportFormat = void 0;
// ---------------------------------------------------------------------------
// Formato de export
// ---------------------------------------------------------------------------
exports.ExportFormat = {
    CSV: 'csv',
    PDF: 'pdf',
};
