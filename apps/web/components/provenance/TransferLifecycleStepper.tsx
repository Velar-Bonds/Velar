'use client';

import { Ban, Check, Circle, Loader2 } from 'lucide-react';
import type { TransferLifecycle } from '@velar/types';
import { abortedStage, statusLabel, stepStates, type StepState } from '../../lib/provenance';

const fmtDate = (s?: string | null) =>
  s
    ? new Date(s).toLocaleString('es-CR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

const DOT: Record<StepState, string> = {
  done: 'border-emerald-500 bg-emerald-500 text-white',
  current: 'border-primary-container bg-white text-primary-container',
  pending: 'border-outline-variant/50 bg-white text-on-surface-variant/40',
  aborted: 'border-rose-300 bg-rose-50 text-rose-400',
};

const CONNECTOR: Record<StepState, string> = {
  done: 'bg-emerald-500',
  current: 'bg-emerald-500',
  pending: 'bg-outline-variant/30',
  aborted: 'bg-rose-200',
};

function StepIcon({ state }: { state: StepState }) {
  if (state === 'done') return <Check size={14} aria-hidden="true" />;
  if (state === 'current') return <Loader2 size={14} className="animate-spin" aria-hidden="true" />;
  if (state === 'aborted') return <Ban size={13} aria-hidden="true" />;
  return <Circle size={9} aria-hidden="true" />;
}

export interface TransferLifecycleStepperProps {
  lifecycle: TransferLifecycle;
  /** Optional resolver from an owner id to a display name. */
  ownerName?: (id: string) => string;
}

/**
 * Vertical stepper for one transfer's lifecycle (issue #36). Shows the six
 * happy-path steps with their reached/current/pending state; if the transfer
 * was rechazada/cancelada the unreached steps read as aborted and a terminal
 * chip explains why. Presentational only — data comes from the engine.
 */
export function TransferLifecycleStepper({ lifecycle, ownerName }: TransferLifecycleStepperProps) {
  const steps = stepStates(lifecycle);
  const aborted = abortedStage(lifecycle);
  const name = (id: string) => ownerName?.(id) ?? id;

  return (
    <div className="rounded-2xl border border-outline-variant/25 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-on-surface">
          {name(lifecycle.fromOwner)} <span className="text-on-surface-variant">→</span>{' '}
          {name(lifecycle.toOwner)}
        </p>
        {aborted ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
            <Ban size={12} aria-hidden="true" /> {statusLabel(lifecycle.status)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            {statusLabel(lifecycle.status)}
          </span>
        )}
      </div>

      <ol className="relative">
        {steps.map((step, i) => {
          const last = i === steps.length - 1;
          const at = fmtDate(step.at);
          return (
            <li key={step.status} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${DOT[step.state]}`}
                >
                  <StepIcon state={step.state} />
                </span>
                {!last && <span className={`w-0.5 flex-1 ${CONNECTOR[step.state]}`} aria-hidden="true" />}
              </div>
              <div className={`pb-4 ${step.state === 'pending' || step.state === 'aborted' ? 'opacity-60' : ''}`}>
                <p className="text-sm font-medium text-on-surface">{statusLabel(step.status)}</p>
                {at && <p className="text-xs text-on-surface-variant">{at}</p>}
                {step.state === 'current' && (
                  <p className="text-xs font-medium text-primary-container">En curso</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {aborted && (
        <p className="mt-1 text-xs text-rose-700">
          Finalizó como <strong>{statusLabel(lifecycle.status)}</strong>
          {fmtDate(aborted.at) ? ` · ${fmtDate(aborted.at)}` : ''}.
        </p>
      )}
    </div>
  );
}

export default TransferLifecycleStepper;
