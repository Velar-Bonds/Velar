"use strict";
/**
 * Reporte mensual del partido al TSE — ciclo de vida completo, versionado y
 * motor de conciliación contra los bonos que el partido realmente posee on-chain.
 *
 * Esta es la FUENTE DE VERDAD del dominio de reportes: la comparten `apps/api`
 * (lógica y persistencia) y `apps/web` (builder multi-paso e historial). El
 * módulo `reports` original solo guardaba metadata de texto libre; esto lo
 * extiende a un reporte estructurado, con archivos, líneas y conciliación.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceStatus = exports.DiscrepancyType = exports.FileScanStatus = exports.ReportLineCategory = exports.EDITABLE_REPORT_STATUSES = exports.ReportStatus = void 0;
// ---------------------------------------------------------------------------
// Estados del workflow
// ---------------------------------------------------------------------------
/**
 * Ciclo legal del reporte:
 *   borrador → enviado → en_revision → observado → reenviado → (en_revision) → aprobado
 *
 * `aprobado` es terminal. `observado` es la vía de corrección: el partido
 * reenvía (nueva versión) y vuelve a revisión.
 */
exports.ReportStatus = {
    BORRADOR: 'borrador',
    ENVIADO: 'enviado',
    EN_REVISION: 'en_revision',
    OBSERVADO: 'observado',
    REENVIADO: 'reenviado',
    APROBADO: 'aprobado',
};
/** Estados en los que el partido todavía puede editar el borrador/corregir. */
exports.EDITABLE_REPORT_STATUSES = [
    exports.ReportStatus.BORRADOR,
    exports.ReportStatus.OBSERVADO,
];
// ---------------------------------------------------------------------------
// Líneas del reporte
// ---------------------------------------------------------------------------
/** Categoría contable de una línea del reporte. */
exports.ReportLineCategory = {
    INGRESO: 'ingreso',
    EGRESO: 'egreso',
    DONACION: 'donacion',
    BONO: 'bono',
    OTRO: 'otro',
};
// ---------------------------------------------------------------------------
// Archivos adjuntos
// ---------------------------------------------------------------------------
/** Resultado del hook de antivirus (interfaz + stub, sin vendor real). */
exports.FileScanStatus = {
    PENDING: 'pending',
    CLEAN: 'clean',
    INFECTED: 'infected',
};
// ---------------------------------------------------------------------------
// Motor de conciliación (funciones puras)
// ---------------------------------------------------------------------------
/** Tipo de discrepancia detectada al conciliar el reporte con la cadena. */
exports.DiscrepancyType = {
    /** El monto declarado no coincide con el valor del bono en poder del partido. */
    AMOUNT_MISMATCH: 'amount_mismatch',
    /** El partido posee un bono que no está declarado en el reporte. */
    MISSING_BOND: 'missing_bond',
    /** El reporte referencia un bono que el partido no posee. */
    UNKNOWN_REFERENCE: 'unknown_reference',
};
// ---------------------------------------------------------------------------
// Deadlines y cumplimiento (funciones puras)
// ---------------------------------------------------------------------------
/** Estado de cumplimiento de un período. */
exports.ComplianceStatus = {
    /** Aún no vence. */
    NOT_DUE: 'not_due',
    /** Enviado antes del vencimiento. */
    ON_TIME: 'on_time',
    /** Enviado después del vencimiento pero dentro de la gracia. */
    LATE: 'late',
    /** Vencido y aún no enviado. */
    OVERDUE: 'overdue',
    /** Sin enviar y ya fuera de toda gracia. */
    MISSING: 'missing',
};
