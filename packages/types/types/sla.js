"use strict";
/**
 * Motor de SLA y escalamiento para reportes en revisión TSE.
 *
 * Define la escalera de notificaciones por días vencidos y el estado
 * resultante de cada chequeo periódico.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscalationLevel = void 0;
// ---------------------------------------------------------------------------
// Niveles de escalamiento
// ---------------------------------------------------------------------------
exports.EscalationLevel = {
    NONE: 'none',
    LEVEL_1: 'level_1',
    LEVEL_2: 'level_2',
    LEVEL_3: 'level_3',
};
