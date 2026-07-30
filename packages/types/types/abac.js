"use strict";
/**
 * Autorización basada en atributos (ABAC) para el command center TSE.
 *
 * Tipos para evaluar políticas de acceso, segregación de funciones y
 * decisiones explicables sobre acciones sensibles de cumplimiento.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbacAction = void 0;
// ---------------------------------------------------------------------------
// Acciones protegidas
// ---------------------------------------------------------------------------
exports.AbacAction = {
    REVIEW_REPORT: 'review_report',
    APPROVE_REPORT: 'approve_report',
    SECOND_APPROVE_REPORT: 'second_approve_report',
    VIEW_ANALYTICS: 'view_analytics',
    BACKTEST_RULES: 'backtest_rules',
    EXPORT_REPORT: 'export_report',
};
