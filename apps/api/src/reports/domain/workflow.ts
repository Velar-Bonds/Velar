/**
 * Máquina de estados del reporte — FUNCIONES PURAS, sin DB ni framework.
 *
 * Ciclo legal:
 *   borrador → enviado → en_revision → observado → reenviado → en_revision → aprobado
 *   en_revision → pendiente_segunda_aprobacion → aprobado  (dual control, alto monto)
 *   en_revision → rechazado  (terminal)
 *
 * `aprobado` y `rechazado` son terminales. Solo se permiten transiciones
 * declaradas aquí; el service las usa para rechazar cambios de estado ilegales
 * antes de tocar la DB.
 */
import { EDITABLE_REPORT_STATUSES, ReportStatus } from '@velar/types';

/** Transiciones legales por estado de origen. */
export const TRANSITIONS: Record<string, ReportStatus[]> = {
  [ReportStatus.BORRADOR]: [ReportStatus.ENVIADO],
  [ReportStatus.ENVIADO]: [ReportStatus.EN_REVISION],
  [ReportStatus.EN_REVISION]: [
    ReportStatus.OBSERVADO,
    ReportStatus.APROBADO,
    ReportStatus.RECHAZADO,
    ReportStatus.PENDIENTE_SEGUNDA_APROBACION,
  ],
  [ReportStatus.OBSERVADO]: [ReportStatus.REENVIADO],
  [ReportStatus.REENVIADO]: [ReportStatus.EN_REVISION],
  [ReportStatus.PENDIENTE_SEGUNDA_APROBACION]: [
    ReportStatus.APROBADO,
    ReportStatus.OBSERVADO,
    ReportStatus.RECHAZADO,
  ],
  [ReportStatus.APROBADO]: [],
  [ReportStatus.RECHAZADO]: [],
  // Compat: estado legacy 'revisado' del módulo original se trata como en_revision.
  revisado: [ReportStatus.OBSERVADO, ReportStatus.APROBADO],
};

export class InvalidTransitionError extends Error {
  constructor(from: ReportStatus, to: ReportStatus) {
    super(`Transición de estado ilegal: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

/** Estados a los que se puede pasar desde `from`. */
export function nextStatuses(from: ReportStatus): ReportStatus[] {
  return TRANSITIONS[from] ?? [];
}

/** ¿Es legal la transición from → to? */
export function canTransition(from: ReportStatus, to: ReportStatus): boolean {
  return nextStatuses(from).includes(to);
}

/** Lanza InvalidTransitionError si la transición no es legal. */
export function assertTransition(from: ReportStatus, to: ReportStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

/** ¿El partido puede editar líneas/archivos en este estado? */
export function isEditable(status: ReportStatus): boolean {
  return EDITABLE_REPORT_STATUSES.includes(status);
}

/** ¿Es un estado terminal (no admite más transiciones)? */
export function isTerminal(status: ReportStatus): boolean {
  return nextStatuses(status).length === 0;
}

/**
 * Resuelve el efecto de la acción "enviar/reenviar" del partido:
 * - borrador  → enviado   (primer envío)
 * - observado → reenviado (corrección: bumpea versión, preserva historial)
 * Cualquier otro estado no admite envío.
 */
export function resolveSubmit(current: ReportStatus): {
  next: ReportStatus;
  isResubmission: boolean;
} {
  if (current === ReportStatus.BORRADOR) {
    return { next: ReportStatus.ENVIADO, isResubmission: false };
  }
  if (current === ReportStatus.OBSERVADO) {
    return { next: ReportStatus.REENVIADO, isResubmission: true };
  }
  throw new Error(`No se puede enviar un reporte en estado "${current}"`);
}

export interface DecisionContext {
  /** Total declarado del reporte (suma de line items), usado para el umbral de dual control. */
  declaredTotal: number;
  /** Umbral de monto a partir del cual una aprobación requiere doble control. */
  dualControlThreshold: number;
}

export interface DecisionResolution {
  next: ReportStatus;
  /** true si esta decisión crea un nuevo estado pendiente de segunda aprobación. */
  requiresSecondApproval: boolean;
  /** true si esta decisión es la segunda aprobación que cierra el dual control. */
  isSecondApproval: boolean;
}

/**
 * Resuelve el efecto de una decisión de revisión del TSE (aprobar/observar/rechazar),
 * intercalando la guarda de dual control sobre la aprobación de reportes de alto monto:
 *  - en_revision, aprobar, monto >= umbral        → pendiente_segunda_aprobacion (requiresSecondApproval)
 *  - en_revision, aprobar, monto <  umbral        → aprobado (directo)
 *  - pendiente_segunda_aprobacion, aprobar        → aprobado (isSecondApproval, cierra el dual control)
 *  - cualquier otro par (from, requested) legal    → se resuelve por TRANSITIONS tal cual
 * Lanza InvalidTransitionError si la transición no es legal.
 */
export function resolveDecision(
  current: ReportStatus,
  requested: ReportStatus,
  ctx: DecisionContext,
): DecisionResolution {
  if (requested === ReportStatus.APROBADO) {
    if (current === ReportStatus.EN_REVISION) {
      const next =
        ctx.declaredTotal >= ctx.dualControlThreshold
          ? ReportStatus.PENDIENTE_SEGUNDA_APROBACION
          : ReportStatus.APROBADO;
      assertTransition(current, next);
      return {
        next,
        requiresSecondApproval: next === ReportStatus.PENDIENTE_SEGUNDA_APROBACION,
        isSecondApproval: false,
      };
    }

    if (current === ReportStatus.PENDIENTE_SEGUNDA_APROBACION) {
      assertTransition(current, ReportStatus.APROBADO);
      return {
        next: ReportStatus.APROBADO,
        requiresSecondApproval: false,
        isSecondApproval: true,
      };
    }
  }

  assertTransition(current, requested);
  return {
    next: requested,
    requiresSecondApproval: false,
    isSecondApproval: false,
  };
}
