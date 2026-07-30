/**
 * Workflow formal de revisión de reportes TSE — transiciones declarativas,
 * dual control y contexto del actor que toma decisiones.
 *
 * Tipos puros para el command center de cumplimiento: documentan el spec
 * del flujo de aprobación; la lógica de guards/effects vive en código aparte.
 */
import type { MonthlyReport, ReportStatus } from './report';
import type { Role } from './roles';
/** Verbo de la acción que un revisor ejecuta sobre un reporte. */
export type ReviewAction = 'aprobar' | 'observar' | 'rechazar';
/**
 * Payload de una decisión de revisión.
 * Superset estructural de `reviewReportRequestSchema` (añade `'rechazado'`
 * y `expectedVersion` para control optimista de concurrencia).
 */
export interface ReviewDecisionRequest {
    status: 'revisado' | 'observado' | 'aprobado' | 'rechazado';
    notes?: string;
    expectedVersion?: number;
}
/** Contexto del actor que participa en una transición del workflow. */
export interface WorkflowActorContext {
    actorId: string;
    role: Role;
}
/**
 * Descripción formal de una transición legal entre estados.
 * `guard`, `effect` y `compensation` son identificadores/descripciones
 * legibles; la implementación real reside en el motor de workflow.
 */
export interface WorkflowTransition {
    from: ReportStatus;
    to: ReportStatus;
    guard?: string;
    effect?: string;
    compensation?: string;
}
export interface DualControlApproval {
    id: string;
    reportId: string;
    firstApproverId: string;
    firstApprovedAt: string;
    secondApproverId: string | null;
    secondApprovedAt: string | null;
    status: 'pending_second' | 'completed';
    createdAt: string;
}
export interface DualControlState {
    required: boolean;
    threshold: number;
    approval: DualControlApproval | null;
}
export interface ReviewDecisionResult {
    report: MonthlyReport;
    version: number;
    dualControl: DualControlState;
}
