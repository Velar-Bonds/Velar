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
    DOCUMENTO_SUBIDO: 'documento_subido',
    PARTY_CREATED: 'party_created',
    WALLET_PROVISIONED: 'wallet_provisioned',
    BOND_PUBLISHED: 'bond_published',
    COUNTER_OFFER_SENT: 'counter_offer_sent',
    REPORT_SUBMITTED: 'report_submitted',
    REPORT_RESUBMITTED: 'report_resubmitted',
    REPORT_VERSION_CREATED: 'report_version_created',
    REPORT_OBSERVED: 'report_observed',
    REPORT_APPROVED: 'report_approved',
    REPORT_FILE_UPLOADED: 'report_file_uploaded',
};
