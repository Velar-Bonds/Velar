"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferStatus = void 0;
/**
 * Estados de una solicitud de transferencia / recompra.
 * Modela el flujo 3 de la especificación (transferencia con escrow).
 */
exports.TransferStatus = {
    /** Dueño actual inició la solicitud hacia un recomprador. */
    SOLICITADA: 'solicitada',
    /** Recomprador aceptó la intención de compra. */
    ACEPTADA: 'aceptada',
    CONTRAOFERTA: 'contraoferta',
    /** Token bloqueado en canasta/escrow on-chain. */
    EN_ESCROW: 'en_escrow',
    /** Pago físico registrado, pendiente de validación. */
    PAGO_REGISTRADO: 'pago_registrado',
    /** Validador confirmó el pago; escrow liberable. */
    PAGO_VALIDADO: 'pago_validado',
    /** Token liberado al recomprador; transferencia completa. */
    LIBERADA: 'liberada',
    /** Recomprador o sistema rechazó la transferencia. */
    RECHAZADA: 'rechazada',
    /** Cancelada antes de la validación final; token vuelve al dueño anterior. */
    CANCELADA: 'cancelada',
};
