import type { Transfer, TransferFunnel, TransferFunnelStage } from '@velar/types';
import { TRANSFER_LIFECYCLE_STEPS } from '@velar/types';
import { round2 } from './util';

/**
 * Transfer funnel / conversion (issue #44). A transfer only has its CURRENT
 * status in `AnalyticsInput` (no per-stage audit events by design — see
 * docs/BACKEND.md), so stage-reached is approximated from
 * `TRANSFER_LIFECYCLE_STEPS`'s index of the current status: a transfer whose
 * current status is at or past step `i` counts as having reached it.
 * Off-path/terminal-negative statuses (`contraoferta`, `rechazada`,
 * `cancelada`) never map to a happy-path index and are reported separately.
 */

function stepIndexOf(status: string): number {
  return (TRANSFER_LIFECYCLE_STEPS as readonly string[]).indexOf(status);
}

export function computeTransferFunnel(transfers: Transfer[]): TransferFunnel {
  const totalStarted = transfers.length;
  const rejectedCount = transfers.filter((t) => t.status === 'rechazada').length;
  const cancelledCount = transfers.filter((t) => t.status === 'cancelada').length;
  const completedCount = transfers.filter((t) => t.status === 'liberada').length;

  const stages: TransferFunnelStage[] = TRANSFER_LIFECYCLE_STEPS.map((step, i) => {
    const reachedCount = transfers.filter((t) => {
      const idx = stepIndexOf(t.status);
      return idx >= i;
    }).length;
    const conversionFromStartPct = totalStarted > 0 ? round2((reachedCount / totalStarted) * 100) : 0;
    return { step, reachedCount, conversionFromStartPct, dropOffPct: 0 };
  });

  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1].reachedCount;
    const cur = stages[i].reachedCount;
    stages[i].dropOffPct = prev > 0 ? round2(((prev - cur) / prev) * 100) : 0;
  }

  return { totalStarted, stages, rejectedCount, cancelledCount, completedCount };
}
