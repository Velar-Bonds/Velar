/**
 * Autorización basada en atributos (ABAC) para el command center TSE.
 *
 * Tipos para evaluar políticas de acceso, segregación de funciones y
 * decisiones explicables sobre acciones sensibles de cumplimiento.
 */

import type { Role } from './roles';

// ---------------------------------------------------------------------------
// Acciones protegidas
// ---------------------------------------------------------------------------

export const AbacAction = {
  REVIEW_REPORT: 'review_report',
  APPROVE_REPORT: 'approve_report',
  SECOND_APPROVE_REPORT: 'second_approve_report',
  VIEW_ANALYTICS: 'view_analytics',
  BACKTEST_RULES: 'backtest_rules',
  EXPORT_REPORT: 'export_report',
} as const;

export type AbacAction = (typeof AbacAction)[keyof typeof AbacAction];

// ---------------------------------------------------------------------------
// Atributos y decisiones
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Segregación de funciones
// ---------------------------------------------------------------------------

export interface SegregationOfDutiesViolation {
  rule: string;
  message: string;
}
