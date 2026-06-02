/**
 * Estados del ciclo de vida de un bono/token.
 * Ver sección 9 de la especificación.
 */
export declare const BondStatus: {
    /** Token creado, puede estar pendiente de asignación a un dueño. */
    readonly EMITIDO: "emitido";
    /** Token con dueño actual válido y disponible. */
    readonly ACTIVO: "activo";
    /** Token bloqueado temporalmente por una transferencia en proceso. */
    readonly EN_ESCROW: "en_escrow";
    /** La propiedad fue cambiada exitosamente (estado transitorio de historial). */
    readonly TRANSFERIDO: "transferido";
    /** Bono inhabilitado para transferencias. */
    readonly CANCELADO: "cancelado";
    /** Bloqueado por el TSE / rol autorizado por revisión o disputa. */
    readonly CONGELADO: "congelado";
};
export type BondStatus = (typeof BondStatus)[keyof typeof BondStatus];
/** Estados desde los cuales NO se permite iniciar una transferencia. */
export declare const NON_TRANSFERABLE_STATUSES: BondStatus[];
export interface BondToken {
    /** Identificador único del bono tokenizado (uuid interno). */
    tokenId: string;
    /** Código interno / número de referencia del bono. */
    bondId: string;
    /** Partido político emisor. */
    issuerPartyId: string;
    /** Dueño actual (profile id). Null si aún no asignado. */
    currentOwner: string | null;
    status: BondStatus;
    /** Hash SHA-256 del documento o certificado asociado. */
    documentHash: string;
    /** Referencia segura a metadatos almacenados fuera de blockchain. */
    metadataUri?: string | null;
    /** Valor facial del bono (off-chain, informativo). */
    faceValue?: number | null;
    createdAt: string;
    updatedAt: string;
}
export interface RegisterBondInput {
    bondId: string;
    issuerPartyId: string;
    documentHash: string;
    metadataUri?: string;
    faceValue?: number;
    /** Dueño inicial opcional; si se omite queda EMITIDO sin asignar. */
    initialOwner?: string;
}
