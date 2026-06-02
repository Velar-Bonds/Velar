/**
 * Roles del sistema VELAR.
 * Cada usuario autenticado tiene exactamente un rol asignado en su perfil.
 */
export const Role = {
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
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const ALL_ROLES: Role[] = Object.values(Role);

/** Roles que pueden poseer bonos (aparecer como currentOwner). */
export const OWNER_ROLES: Role[] = [Role.COMPRADOR, Role.RECOMPRADOR];

export interface Profile {
  id: string; // = auth.users.id (uuid)
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
