/**
 * Motor de SLA y escalamiento para reportes en revisión TSE.
 *
 * Define la escalera de notificaciones por días vencidos y el estado
 * resultante de cada chequeo periódico.
 */

import type { Role } from './roles';

// ---------------------------------------------------------------------------
// Niveles de escalamiento
// ---------------------------------------------------------------------------

export const EscalationLevel = {
  NONE: 'none',
  LEVEL_1: 'level_1',
  LEVEL_2: 'level_2',
  LEVEL_3: 'level_3',
} as const;

export type EscalationLevel =
  (typeof EscalationLevel)[keyof typeof EscalationLevel];

// ---------------------------------------------------------------------------
// Configuración y estado
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Resultado de un chequeo
// ---------------------------------------------------------------------------

export interface SlaCheckResult {
  reportId: string;
  previousLevel: EscalationLevel;
  newLevel: EscalationLevel;
  escalated: boolean;
  notified: Role[];
}
