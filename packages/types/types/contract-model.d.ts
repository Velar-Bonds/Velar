/**
 * PROVISIONAL structured-contract model.
 *
 * The canonical structured-contract/clause model is owned by the
 * "Contract intelligence & document assembly engine" epic (issue #38), which is
 * not merged yet. The contract reading & comprehension experience (issue #39) is
 * built against a FIXTURE of this shape, per that issue's instructions.
 *
 * When #38 lands, replace these types with the canonical ones and re-point the
 * reader/derivation at them. Keep the field names stable in the meantime so the
 * swap is mechanical.
 */
/** Domain category of a contract clause. */
export declare const ClauseCategory: {
    readonly PARTES: "partes";
    readonly OBJETO: "objeto";
    readonly PAGO: "pago";
    readonly TRANSFERENCIA: "transferencia";
    readonly GARANTIA: "garantia";
    readonly PLAZO: "plazo";
    readonly INCUMPLIMIENTO: "incumplimiento";
    readonly JURISDICCION: "jurisdiccion";
    readonly FIRMAS: "firmas";
    readonly OTRO: "otro";
};
export type ClauseCategory = (typeof ClauseCategory)[keyof typeof ClauseCategory];
/** A single structured clause of a contract. */
export interface ContractClause {
    id: string;
    /** 1-based position within the contract. */
    order: number;
    title: string;
    category: ClauseCategory;
    /** Original legal text of the clause. Source of truth — never rewritten in place. */
    legalText: string;
    /** Keys of structured contract/bond fields this clause references (data anchors). */
    references?: string[];
}
/** The assembled structured contract for a bond. */
export interface ContractSummary {
    bondId: string;
    contractId: string;
    title: string;
    /** Contract template/version identifier. */
    version: string;
    clauses: ContractClause[];
    /** ISO-8601 timestamp when the structured contract was assembled. */
    generatedAt: string;
}
