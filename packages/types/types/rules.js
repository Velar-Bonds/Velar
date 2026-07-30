"use strict";
/**
 * Motor de reglas explicable y versionado para el command center TSE.
 *
 * Evalúa reportes históricos y en vivo, produce findings con trazas de
 * razonamiento y soporta backtesting entre versiones de reglas.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindingSeverity = exports.FindingType = void 0;
// ---------------------------------------------------------------------------
// Tipos de finding
// ---------------------------------------------------------------------------
/**
 * Clasificación de un hallazgo de reglas.
 * Reutiliza la semántica de `DiscrepancyType` y añade condiciones
 * temporales y de umbral.
 */
exports.FindingType = {
    AMOUNT_MISMATCH: 'amount_mismatch',
    MISSING_BOND: 'missing_bond',
    UNKNOWN_REFERENCE: 'unknown_reference',
    OVERDUE: 'overdue',
    THRESHOLD_BREACH: 'threshold_breach',
};
// ---------------------------------------------------------------------------
// Severidad
// ---------------------------------------------------------------------------
exports.FindingSeverity = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
};
