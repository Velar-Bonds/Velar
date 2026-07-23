'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Printer,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import type { AuditEvent, BondProvenance, ProvenanceSeverity } from '@velar/types';
import { txUrl } from '../../lib/stellar';
import {
  anomalyLabel,
  buildProvenanceCsv,
  createProvenanceClient,
  provenanceSummary,
  sortAnomalies,
  statusLabel,
  type FetchLike,
} from '../../lib/provenance';
import { OwnershipTimeline } from './OwnershipTimeline';
import { TransferLifecycleStepper } from './TransferLifecycleStepper';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const fmtDateTime = (s?: string | null) =>
  s
    ? new Date(s).toLocaleString('es-CR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const SEVERITY_STYLE: Record<ProvenanceSeverity, string> = {
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
};

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ProvenanceExplorerProps {
  /** token_id (auth) or token_id/bond_id (public). */
  subjectId: string;
  mode: 'auth' | 'public';
  /** Bearer token for the authenticated read. */
  token?: string;
  /** Optional resolver from an owner id to a display name. */
  ownerName?: (id: string) => string;
  /** Preloaded provenance (fixtures/SSR); when present no request is made. */
  initialProvenance?: BondProvenance;
}

/**
 * Provenance & traceability explorer (issue #36): integrity report, ownership
 * timeline, per-transfer lifecycle steppers, an event inspector with type
 * filter, on-chain links and per-transfer owner diff, plus CSV/print export.
 * The append-only history is shown chronologically and never reordered/mutated.
 */
export function ProvenanceExplorer({
  subjectId,
  mode,
  token,
  ownerName,
  initialProvenance,
}: ProvenanceExplorerProps) {
  const [data, setData] = useState<BondProvenance | null>(initialProvenance ?? null);
  const [loading, setLoading] = useState(!initialProvenance);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [openEvent, setOpenEvent] = useState<string | null>(null);

  useEffect(() => {
    if (initialProvenance) return;
    let active = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      const authFetch: FetchLike | undefined = token
        ? (url, init) =>
            fetch(url, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } })
        : undefined;
      const client = createProvenanceClient({ baseUrl: API_BASE, fetch: authFetch });
      try {
        const res =
          mode === 'auth'
            ? await client.getBondProvenance(subjectId)
            : await client.getPublicBondProvenance(subjectId);
        if (active) setData(res);
      } catch (e: unknown) {
        if (active) setError(e instanceof Error ? e.message : 'No se pudo cargar la procedencia');
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [subjectId, mode, token, initialProvenance]);

  const eventTypes = useMemo(
    () => (data ? Array.from(new Set(data.events.map((e) => e.type))) : []),
    [data],
  );
  const visibleEvents = useMemo(
    () => (data ? data.events.filter((e) => typeFilter === 'all' || e.type === typeFilter) : []),
    [data, typeFilter],
  );

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12 text-on-surface-variant">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-container border-t-transparent" />
        Reconstruyendo la procedencia…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        <AlertTriangle size={16} aria-hidden="true" /> {error}
      </div>
    );
  }
  if (!data) return null;

  const summary = provenanceSummary(data);
  const name = (id: string) => ownerName?.(id) ?? id;

  return (
    <div className="space-y-6">
      {/* Header + integrity + export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-on-surface-variant">Procedencia verificada</div>
          <div className="mono-data text-lg font-bold text-primary-container">
            {data.bond.bondId ?? data.bond.tokenId}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {summary.ok ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck size={14} aria-hidden="true" /> Historial íntegro
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
              <ShieldAlert size={14} aria-hidden="true" /> {summary.errorCount} error(es)
              {summary.warningCount > 0 ? `, ${summary.warningCount} aviso(s)` : ''}
            </span>
          )}
          <button
            type="button"
            onClick={() => download(`procedencia-${data.bond.bondId ?? data.bond.tokenId}.csv`, buildProvenanceCsv(data), 'text/csv;charset=utf-8')}
            className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 px-3 py-1 text-xs font-medium text-on-surface hover:bg-surface-container-low"
          >
            <Download size={13} aria-hidden="true" /> CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 px-3 py-1 text-xs font-medium text-on-surface hover:bg-surface-container-low"
          >
            <Printer size={13} aria-hidden="true" /> PDF
          </button>
        </div>
      </div>

      {/* Integrity anomalies */}
      {!summary.ok && (
        <div className="space-y-2">
          {sortAnomalies(data.integrity.anomalies).map((a, i) => (
            <div
              key={`${a.type}-${i}`}
              className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${SEVERITY_STYLE[a.severity]}`}
            >
              <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <span className="font-semibold">{anomalyLabel(a.type)}</span>
                <span className="opacity-80"> — {a.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-surface-container-low px-3 py-1 text-on-surface-variant">
          {summary.ownerCount} dueño(s)
        </span>
        <span className="rounded-full bg-surface-container-low px-3 py-1 text-on-surface-variant">
          {summary.transferCount} transferencia(s)
        </span>
        <span className="rounded-full bg-surface-container-low px-3 py-1 text-on-surface-variant">
          {summary.eventCount} evento(s)
        </span>
      </div>

      {/* Ownership timeline */}
      <section aria-label="Cadena de propiedad">
        <h3 className="mb-2 text-sm font-semibold text-on-surface">Cadena de propiedad</h3>
        <OwnershipTimeline segments={data.ownership} ownerName={ownerName} />
      </section>

      {/* Transfer lifecycles + owner diff */}
      {data.transfers.length > 0 && (
        <section aria-label="Ciclo de vida de las transferencias">
          <h3 className="mb-2 text-sm font-semibold text-on-surface">Transferencias</h3>
          <div className="space-y-4">
            {data.transfers.map((t) => (
              <div key={t.transferId}>
                <TransferLifecycleStepper lifecycle={t} ownerName={ownerName} />
                <p className="mt-1 px-1 text-xs text-on-surface-variant">
                  Cambio de estado: dueño <strong>{name(t.fromOwner)}</strong>{' '}
                  <span aria-hidden="true">→</span> <strong>{name(t.toOwner)}</strong>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Event inspector */}
      <section aria-label="Bitácora de eventos">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-on-surface">
            Bitácora <span className="font-normal text-on-surface-variant">(append-only, en orden)</span>
          </h3>
          {eventTypes.length > 1 && (
            <label className="flex items-center gap-1.5 text-xs text-on-surface-variant">
              Filtrar:
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-outline-variant/40 bg-white px-2 py-1 text-xs text-on-surface"
              >
                <option value="all">Todos</option>
                {eventTypes.map((t) => (
                  <option key={t} value={t}>
                    {statusLabel(t)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <ol className="space-y-1">
          {visibleEvents.map((e) => (
            <EventRow
              key={e.id}
              event={e}
              open={openEvent === e.id}
              onToggle={() => setOpenEvent(openEvent === e.id ? null : e.id)}
            />
          ))}
          {visibleEvents.length === 0 && (
            <li className="rounded-xl border border-dashed border-outline-variant/40 px-3 py-4 text-center text-xs text-on-surface-variant">
              No hay eventos para ese filtro.
            </li>
          )}
        </ol>
      </section>
    </div>
  );
}

function EventRow({
  event,
  open,
  onToggle,
}: {
  event: AuditEvent;
  open: boolean;
  onToggle: () => void;
}) {
  const hasPayload = event.payload && Object.keys(event.payload).length > 0;
  return (
    <li className="rounded-xl border border-outline-variant/25 bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        {hasPayload ? (
          open ? (
            <ChevronDown size={14} className="shrink-0 text-on-surface-variant" aria-hidden="true" />
          ) : (
            <ChevronRight size={14} className="shrink-0 text-on-surface-variant" aria-hidden="true" />
          )
        ) : (
          <span className="w-3.5" aria-hidden="true" />
        )}
        <span className="flex-1 text-sm font-medium text-on-surface">{statusLabel(event.type)}</span>
        <span className="text-xs text-on-surface-variant">{fmtDateTime(event.createdAt)}</span>
        {event.txHash && (
          <a
            href={txUrl(event.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(ev) => ev.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-full border border-outline-variant/40 px-2 py-0.5 text-[11px] font-medium text-primary-container hover:bg-primary-container/5"
          >
            on-chain <ExternalLink size={11} aria-hidden="true" />
          </a>
        )}
      </button>
      {open && hasPayload && (
        <pre className="overflow-x-auto border-t border-outline-variant/20 bg-surface-container-low/40 px-3 py-2 text-[11px] text-on-surface-variant">
          {JSON.stringify(event.payload, null, 2)}
        </pre>
      )}
    </li>
  );
}

export default ProvenanceExplorer;
