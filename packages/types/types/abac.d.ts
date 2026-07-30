/**
 * Autorización basada en atributos (ABAC) para el command center TSE.
 *
 * Tipos para evaluar políticas de acceso, segregación de funciones y
 * decisiones explicables sobre acciones sensibles de cumplimiento.
 */
import type { Role } from './roles';
export declare const AbacAction: {
    readonly REVIEW_REPORT: "review_report";
    readonly APPROVE_REPORT: "approve_report";
    readonly SECOND_APPROVE_REPORT: "second_approve_report";
    readonly VIEW_ANALYTICS: "view_analytics";
    readonly BACKTEST_RULES: "backtest_rules";
    readonly EXPORT_REPORT: "export_report";
};
export type AbacAction = (typeof AbacAction)[keyof typeof AbacAction];
export interface AbacAttributes {
    role: Role;
    userId: string;
    assignedReviewerId?: string | null;
    partyId?: string | null;
    amount?: number;
    priorApproverId?: string | null;
}
export interface AbacDecision {
    allowed: boolean;
    reason: string;
}
export interface SegregationOfDutiesViolation {
    rule: string;
    message: string;
}
