export declare const BondStatus: {
    readonly EMITIDO: "emitido";
    readonly PENDIENTE: "pendiente";
    readonly APROBADO: "aprobado";
    readonly ACTIVO: "activo";
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
    createdAt: string;
    updatedAt: string;
}
export interface RegisterBondInput {
    bondId: string;
    issuerPartyId: string;
    documentHash: string;
    metadataUri?: string;
    faceValue?: number;
    initialOwner?: string;
    certificateNumber?: string;
    currency?: string;
    interestRate?: number;
    series?: string;
    issueDate?: string;
    maturityDate?: string;
}
export interface BondRequestInput {
    faceValue: number;
    currency?: string;
    interestRate?: number;
    series?: string;
    issueDate?: string;
    maturityDate?: string;
    notes?: string;
    certificateNumber?: string;
}
