/**
 * Roles del sistema VELAR.
 * Cada usuario autenticado tiene exactamente un rol asignado en su perfil.
 */
export declare const Role: {
    /** Tribunal Supremo de Elecciones: supervisión, auditoría y congelamiento. */
    readonly TSE: "tse";
    /** Partido político emisor del bono. */
    readonly EMISOR: "emisor";
    /** Comprador inicial del bono. */
    readonly COMPRADOR: "comprador";
    /** Recomprador: adquiere el bono de un dueño anterior. */
    readonly RECOMPRADOR: "recomprador";
    /** Valida el cumplimiento del pago físico para liberar el escrow. */
    readonly VALIDADOR: "validador";
    /** Administrador técnico del sistema. */
    readonly ADMIN: "admin";
};
export type Role = (typeof Role)[keyof typeof Role];
export declare const ALL_ROLES: Role[];
/** Roles que pueden poseer bonos (aparecer como currentOwner). */
export declare const OWNER_ROLES: Role[];
export interface Profile {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    /** Partido asociado, solo para rol EMISOR. */
    partyId?: string | null;
    /** Llave pública Stellar del usuario (custodia asistida o propia). */
    stellarWallet?: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface Party {
    id: string;
    /** Código oficial del partido. */
    code: string;
    name: string;
    createdAt: string;
}
