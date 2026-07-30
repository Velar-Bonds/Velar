/**
 * Motor de SLA y escalamiento para reportes en revisión TSE.
 *
 * Define la escalera de notificaciones por días vencidos y el estado
 * resultante de cada chequeo periódico.
 */
import type { Role } from './roles';
export declare const EscalationLevel: {
    readonly NONE: "none";
    readonly LEVEL_1: "level_1";
    readonly LEVEL_2: "level_2";
    readonly LEVEL_3: "level_3";
};
export type EscalationLevel = (typeof EscalationLevel)[keyof typeof EscalationLevel];
export interface EscalationLadderStep {
    level: EscalationLevel;
    /** Días transcurridos después de la fecha de vencimiento. */
    afterDays: number;
    notify: Role[];
}
export interface SlaConfig {
    ladder: EscalationLadderStep[];
}
export interface SlaState {
    reportId: string;
    currentLevel: EscalationLevel;
    lastEscalatedAt: string | null;
    breached: boolean;
}
export interface SlaCheckResult {
    reportId: string;
    previousLevel: EscalationLevel;
    newLevel: EscalationLevel;
    escalated: boolean;
    notified: Role[];
}
