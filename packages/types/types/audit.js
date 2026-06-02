"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditEventType = void 0;
/**
 * Eventos de auditoría inmutables (append-only).
 * Cada acción crítica genera un evento consultable por el TSE.
 */
exports.AuditEventType = {
    BOND_EMITIDO: 'bond_emitido',
    BOND_ASIGNADO: 'bond_asignado',
    TRANSFER_SOLICITADA: 'transfer_solicitada',
    TRANSFER_ACEPTADA: 'transfer_aceptada',
    ESCROW_BLOQUEADO: 'escrow_bloqueado',
    PAGO_REGISTRADO: 'pago_registrado',
    PAGO_VALIDADO: 'pago_validado',
    TOKEN_LIBERADO: 'token_liberado',
    TRANSFER_RECHAZADA: 'transfer_rechazada',
    TRANSFER_CANCELADA: 'transfer_cancelada',
    BOND_CONGELADO: 'bond_congelado',
    BOND_DESCONGELADO: 'bond_descongelado',
    BOND_CANCELADO: 'bond_cancelado',
};
