"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowStatus = void 0;
/**
 * Tipos para la integración con Trustless Work (escrow sobre Stellar).
 * Mapea el ciclo lock -> fund -> approve -> release del escrow.
 */
exports.EscrowStatus = {
    INITIALIZED: 'initialized',
    FUNDED: 'funded',
    APPROVED: 'approved',
    RELEASED: 'released',
    REFUNDED: 'refunded',
    DISPUTED: 'disputed',
};
