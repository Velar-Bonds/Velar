"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NON_TRANSFERABLE_STATUSES = exports.BondStatus = void 0;
exports.BondStatus = {
    EMITIDO: 'emitido',
    PENDIENTE: 'pendiente',
    APROBADO: 'aprobado',
    ACTIVO: 'activo',
    EN_ESCROW: 'en_escrow',
    TRANSFERIDO: 'transferido',
    CANCELADO: 'cancelado',
    RECHAZADO: 'rechazado',
    CONGELADO: 'congelado',
};
exports.NON_TRANSFERABLE_STATUSES = [
    exports.BondStatus.EN_ESCROW,
    exports.BondStatus.CANCELADO,
    exports.BondStatus.CONGELADO,
    exports.BondStatus.PENDIENTE,
    exports.BondStatus.RECHAZADO,
];
