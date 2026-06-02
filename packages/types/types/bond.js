"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NON_TRANSFERABLE_STATUSES = exports.BondStatus = void 0;
/**
 * Estados del ciclo de vida de un bono/token.
 * Ver sección 9 de la especificación.
 */
exports.BondStatus = {
    /** Token creado, puede estar pendiente de asignación a un dueño. */
    EMITIDO: 'emitido',
    /** Token con dueño actual válido y disponible. */
    ACTIVO: 'activo',
    /** Token bloqueado temporalmente por una transferencia en proceso. */
    EN_ESCROW: 'en_escrow',
    /** La propiedad fue cambiada exitosamente (estado transitorio de historial). */
    TRANSFERIDO: 'transferido',
    /** Bono inhabilitado para transferencias. */
    CANCELADO: 'cancelado',
    /** Bloqueado por el TSE / rol autorizado por revisión o disputa. */
    CONGELADO: 'congelado',
};
/** Estados desde los cuales NO se permite iniciar una transferencia. */
exports.NON_TRANSFERABLE_STATUSES = [
    exports.BondStatus.EN_ESCROW,
    exports.BondStatus.CANCELADO,
    exports.BondStatus.CONGELADO,
];
