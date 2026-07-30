/**
 * Ventana de tolerancia para conciliación on-chain — FUNCIONES PURAS.
 *
 * Envuelve `reconcile()` con semántica de consistencia eventual: una lectura
 * on-chain reciente puede estar desactualizada por transferencias pendientes
 * de confirmación, por lo que las discrepancias no son definitivas hasta
 * cumplir confirmaciones mínimas y agotar la ventana de gracia.
 */
import { DeclaredBondRef, HeldBond, ReconciliationResult } from '@velar/types';
import { reconcile } from './reconciliation';

export interface ChainObservation {
  /** ISO timestamp de cuándo se tomó esta lectura on-chain. */
  observedAt: string;
  /** Cantidad de confirmaciones/bloques que respaldan esta lectura (mientras más, más confiable). */
  confirmations: number;
}

export interface ToleranceWindowConfig {
  /** Confirmaciones mínimas para considerar la lectura on-chain definitiva. */
  requiredConfirmations: number;
  /** Ventana de gracia (ms) desde `observedAt` durante la cual una discrepancia se considera "pendiente" en vez de definitiva. */
  toleranceWindowMs: number;
}

export type ReconciliationWindowStatus = 'clean' | 'discrepancies' | 'pending_confirmation';

export interface ReconciliationWindowResult extends ReconciliationResult {
  /** Igual que `status` de ReconciliationResult salvo el nuevo caso 'pending_confirmation'. */
  windowStatus: ReconciliationWindowStatus;
  /** true si se recomienda re-chequear (agotó ventana o confirmaciones insuficientes) antes de confiar en el resultado. */
  shouldRecheck: boolean;
}

function parseISODate(iso: string): number {
  return Date.parse(iso);
}

export function isWithinToleranceWindow(
  observedAt: string,
  now: string,
  toleranceWindowMs: number,
): boolean {
  const elapsed = Math.max(0, parseISODate(now) - parseISODate(observedAt));
  return elapsed < toleranceWindowMs;
}

export function hasSufficientConfirmations(confirmations: number, required: number): boolean {
  return confirmations >= required;
}

export function reconcileWithTolerance(
  declared: DeclaredBondRef[],
  held: HeldBond[],
  observation: ChainObservation,
  config: ToleranceWindowConfig,
  now: string,
): ReconciliationWindowResult {
  const base = reconcile(declared, held);

  if (base.status === 'clean') {
    return {
      ...base,
      windowStatus: 'clean',
      shouldRecheck: false,
    };
  }

  const sufficient = hasSufficientConfirmations(
    observation.confirmations,
    config.requiredConfirmations,
  );
  const withinWindow = isWithinToleranceWindow(
    observation.observedAt,
    now,
    config.toleranceWindowMs,
  );

  if (sufficient && !withinWindow) {
    return {
      ...base,
      windowStatus: 'discrepancies',
      shouldRecheck: false,
    };
  }

  return {
    ...base,
    windowStatus: 'pending_confirmation',
    shouldRecheck: true,
  };
}
