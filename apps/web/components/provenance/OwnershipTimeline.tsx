'use client';

import { ArrowDown, UserCheck, UserRound } from 'lucide-react';
import type { OwnershipSegment } from '@velar/types';
import { ownershipDurationLabel } from '../../lib/provenance';

const fmtDate = (s?: string | null) =>
  s
    ? new Date(s).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

export interface OwnershipTimelineProps {
  segments: OwnershipSegment[];
  /** Optional resolver from an owner id to a display name. */
  ownerName?: (id: string) => string;
  /** Reference "now" for the current owner's duration (injectable for tests/SSR). */
  now?: Date;
}

/**
 * Vertical ownership chain for a bond (issue #36): one card per owner with the
 * period they held it, ordered from the issuer to the current holder. The last
 * segment is flagged as the current owner. Presentational only.
 */
export function OwnershipTimeline({ segments, ownerName, now }: OwnershipTimelineProps) {
  const name = (id: string) => ownerName?.(id) ?? id;

  if (segments.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-outline-variant/40 bg-white p-4 text-sm text-on-surface-variant">
        Sin historial de propiedad reconstruible para este bono.
      </p>
    );
  }

  return (
    <ol className="space-y-1">
      {segments.map((seg, i) => {
        const last = i === segments.length - 1;
        return (
          <li key={`${seg.ownerId}-${seg.from}`}>
            <div
              className={`flex items-start gap-3 rounded-2xl border p-4 ${
                seg.current
                  ? 'border-emerald-300 bg-emerald-50/60'
                  : 'border-outline-variant/25 bg-white'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  seg.current
                    ? 'bg-emerald-500 text-white'
                    : 'bg-primary-container/10 text-primary-container'
                }`}
              >
                {seg.current ? <UserCheck size={18} aria-hidden="true" /> : <UserRound size={18} aria-hidden="true" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-on-surface">{name(seg.ownerId)}</p>
                  {seg.current && (
                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                      Dueño actual
                    </span>
                  )}
                  {i === 0 && (
                    <span className="rounded-full border border-outline-variant/40 px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">
                      Emisor inicial
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  {fmtDate(seg.from)} <span aria-hidden="true">→</span>{' '}
                  {seg.to ? fmtDate(seg.to) : 'actualidad'} · {ownershipDurationLabel(seg, now)}
                </p>
              </div>
            </div>
            {!last && (
              <div className="flex justify-center py-0.5 text-on-surface-variant/40" aria-hidden="true">
                <ArrowDown size={16} />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default OwnershipTimeline;
