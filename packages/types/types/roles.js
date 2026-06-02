"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OWNER_ROLES = exports.ALL_ROLES = exports.Role = void 0;
/**
 * Roles del sistema VELAR.
 * Cada usuario autenticado tiene exactamente un rol asignado en su perfil.
 */
exports.Role = {
    /** Tribunal Supremo de Elecciones: supervisión, auditoría y congelamiento. */
    TSE: 'tse',
    /** Partido político emisor del bono. */
    EMISOR: 'emisor',
    /** Comprador inicial del bono. */
    COMPRADOR: 'comprador',
    /** Recomprador: adquiere el bono de un dueño anterior. */
    RECOMPRADOR: 'recomprador',
    /** Valida el cumplimiento del pago físico para liberar el escrow. */
    VALIDADOR: 'validador',
    /** Administrador técnico del sistema. */
    ADMIN: 'admin',
};
exports.ALL_ROLES = Object.values(exports.Role);
/** Roles que pueden poseer bonos (aparecer como currentOwner). */
exports.OWNER_ROLES = [exports.Role.COMPRADOR, exports.Role.RECOMPRADOR];
