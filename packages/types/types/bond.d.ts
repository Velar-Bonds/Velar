export declare const BondStatus: {
    readonly EMITIDO: "emitido";
    readonly PENDIENTE: "pendiente";
    readonly APROBADO: "aprobado";
    readonly ACTIVO: "activo";
    readonly EN_VENTA: "en_venta";
    readonly EN_ESCROW: "en_escrow";
    readonly TRANSFERIDO: "transferido";
    readonly CANCELADO: "cancelado";
    readonly RECHAZADO: "rechazado";
    readonly CONGELADO: "congelado";
};
export type BondStatus = (typeof BondStatus)[keyof typeof BondStatus];
export declare const NON_TRANSFERABLE_STATUSES: BondStatus[];
export interface BondToken {
    tokenId: string;
    bondId: string;
    issuerPartyId: string;
    /** País (jurisdicción) del bono. Derivado del partido emisor. */
    country?: string | null;
    currentOwner: string | null;
    status: BondStatus;
    documentHash: string;
    metadataUri?: string | null;
    faceValue?: number | null;
    certificateNumber?: string | null;
    currency?: string | null;
    interestRate?: number | null;
    series?: string | null;
    issueDate?: string | null;
    maturityDate?: string | null;
    stellarStatus?: string | null;
    stellarTransactionHash?: string | null;
    stellarLedger?: number | null;
    stellarAssetCode?: string | null;
    stellarIssuerPublicKey?: string | null;
    stellarOwnerPublicKey?: string | null;
    stellarRegisteredAt?: string | null;
    stellarError?: string | null;
    createdAt: string;
    updatedAt: string;
}
/** @deprecated Import `CreateBondRequest`; kept as a schema-derived compatibility alias. */
export type RegisterBondInput = import('zod').infer<typeof import('./schemas/bonds').createBondRequestSchema>;
/** @deprecated Import `BondRequestRequest`; kept as a schema-derived compatibility alias. */
export type BondRequestInput = import('zod').infer<typeof import('./schemas/bonds').createBondRequestRequestSchema>;
