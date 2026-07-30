import type {
  BondProvenance,
  OwnershipSegment,
  ProvenanceAnomaly,
  ProvenanceAnomalyType,
  ProvenanceSeverity,
  TransferLifecycle,
} from '@velar/types';
import { TRANSFER_LIFECYCLE_STEPS } from '@velar/types';

/**
 * Client + pure helpers for the provenance & traceability explorer (issue #36).
 *
 * The helpers are pure and framework-free so they can be unit-tested in the
 * repo's node test environment; the React components compose them.
 */

// ─── Client ───────────────────────────────────────────────────────────────────

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface ProvenanceClientOptions {
  baseUrl: string;
  fetch?: FetchLike;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

async function getJson<T>(opts: ProvenanceClientOptions, path: string): Promise<T> {
  const doFetch = opts.fetch ?? fetch;
  const res = await doFetch(joinUrl(opts.baseUrl, path), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = (await res.json()) as { message?: unknown; error?: unknown };
      const detail = body?.message ?? body?.error;
      if (typeof detail === 'string' && detail.trim()) message = detail;
    } catch {
      /* keep the status-based message */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export interface ProvenanceClient {
  /** Authenticated read for a token_id. */
  getBondProvenance(tokenId: string): Promise<BondProvenance>;
  /** Public read (citizen verification); accepts token_id or readable bond_id. */
  getPublicBondProvenance(idOrToken: string): Promise<BondProvenance>;
}

export function createProvenanceClient(opts: ProvenanceClientOptions): ProvenanceClient {
  return {
    getBondProvenance: (tokenId) =>
      getJson<BondProvenance>(opts, `/bonds/${encodeURIComponent(tokenId)}/provenance`),
    getPublicBondProvenance: (idOrToken) =>
      getJson<BondProvenance>(opts, `/public/bonds/${encodeURIComponent(idOrToken)}/provenance`),
  };
}

// ─── Anomalies ────────────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<ProvenanceSeverity, number> = { error: 0, warning: 1, info: 2 };

/** Anomalies sorted by severity (errors first), stable within a severity. */
export function sortAnomalies(anomalies: ProvenanceAnomaly[]): ProvenanceAnomaly[] {
  return anomalies
    .map((a, i) => ({ a, i }))
    .sort((x, y) => SEVERITY_ORDER[x.a.severity] - SEVERITY_ORDER[y.a.severity] || x.i - y.i)
    .map(({ a }) => a);
}

export const ANOMALY_LABELS: Record<ProvenanceAnomalyType, string> = {
  out_of_order: 'Eventos fuera de orden',
  ownership_gap: 'Salto en la cadena de propiedad',
  illegal_transition: 'Transición de estado no permitida',
  onchain_offchain_mismatch: 'Discrepancia on-chain / off-chain',
  missing_event: 'Falta un evento de respaldo',
};

export function anomalyLabel(type: ProvenanceAnomalyType): string {
  return ANOMALY_LABELS[type] ?? type;
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export interface ProvenanceSummary {
  ownerCount: number;
  transferCount: number;
  eventCount: number;
  anomalyCount: number;
  errorCount: number;
  warningCount: number;
  /** True when there are no error-severity anomalies. */
  ok: boolean;
  currentOwnerId: string | null;
}

export function provenanceSummary(p: BondProvenance): ProvenanceSummary {
  const anomalies = p.integrity.anomalies;
  const current = p.ownership.find((s) => s.current) ?? null;
  return {
    ownerCount: p.ownership.length,
    transferCount: p.transfers.length,
    eventCount: p.events.length,
    anomalyCount: anomalies.length,
    errorCount: anomalies.filter((a) => a.severity === 'error').length,
    warningCount: anomalies.filter((a) => a.severity === 'warning').length,
    ok: p.integrity.ok,
    currentOwnerId: current?.ownerId ?? null,
  };
}

// ─── Ownership timeline ───────────────────────────────────────────────────────

/** Human-readable owned-duration label (Spanish), e.g. "3 meses" / "en curso". */
export function ownershipDurationLabel(segment: OwnershipSegment, now: Date = new Date()): string {
  const start = new Date(segment.from).getTime();
  const end = segment.to ? new Date(segment.to).getTime() : now.getTime();
  const days = Math.max(0, Math.round((end - start) / 86_400_000));
  const suffix = segment.current ? ' · en curso' : '';
  if (days < 1) return `menos de un día${suffix}`;
  if (days < 30) return `${days} día${days === 1 ? '' : 's'}${suffix}`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} mes${months === 1 ? '' : 'es'}${suffix}`;
  const years = Math.round(months / 12);
  return `${years} año${years === 1 ? '' : 's'}${suffix}`;
}

// ─── Transfer lifecycle stepper ───────────────────────────────────────────────

/** Spanish labels for the transfer lifecycle statuses (stepper + terminal chips). */
export const STATUS_LABELS: Record<string, string> = {
  solicitada: 'Solicitada',
  aceptada: 'Aceptada',
  contraoferta: 'Contraoferta',
  en_escrow: 'En escrow',
  pago_registrado: 'Pago registrado',
  pago_validado: 'Pago validado',
  liberada: 'Liberada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export type StepState = 'done' | 'current' | 'pending' | 'aborted';

export interface StepView {
  status: string;
  index: number;
  state: StepState;
  /** ISO time the step was reached, if it was. */
  at: string | null;
}

/**
 * Projects a transfer lifecycle onto the canonical happy-path steps for the
 * stepper UI. Terminal non-`liberada` transfers (rechazada/cancelada) mark the
 * unreached steps as `aborted`.
 */
export function stepStates(lifecycle: TransferLifecycle): StepView[] {
  const abortedTerminal = lifecycle.terminal && lifecycle.status !== 'liberada';
  return TRANSFER_LIFECYCLE_STEPS.map((status, index) => {
    const stage = lifecycle.stages.find((s) => s.status === status);
    if (stage) return { status, index, state: 'done', at: stage.at };
    if (abortedTerminal) return { status, index, state: 'aborted', at: null };
    if (index === lifecycle.currentStepIndex) return { status, index, state: 'current', at: null };
    return { status, index, state: 'pending', at: null };
  });
}

/** The terminal stage (rechazada/cancelada) if the transfer was aborted, else null. */
export function abortedStage(lifecycle: TransferLifecycle) {
  if (!lifecycle.terminal || lifecycle.status === 'liberada') return null;
  return lifecycle.stages[lifecycle.stages.length - 1] ?? null;
}

// ─── Export ───────────────────────────────────────────────────────────────────

const fmt = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toISOString() : '—';

const csvCell = (value: string | null | undefined): string => {
  const s = value ?? '';
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV of the append-only event history (one row per event), for export. */
export function buildProvenanceCsv(p: BondProvenance): string {
  const header = ['event_id', 'type', 'created_at', 'transfer_id', 'actor_id', 'tx_hash'];
  const rows = p.events.map((e) =>
    [e.id, e.type, e.createdAt, e.transferId, e.actorId, e.txHash].map(csvCell).join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

/** Plain-text provenance report for download/print (no PII beyond owner ids). */
export function buildProvenanceExportText(p: BondProvenance): string {
  const s = provenanceSummary(p);
  const lines: string[] = [];
  lines.push(`PROCEDENCIA Y TRAZABILIDAD — ${p.bond.bondId ?? p.bond.tokenId}`);
  lines.push(`Reconstruido: ${fmt(p.reconstructedAt)}`);
  lines.push(`Integridad: ${s.ok ? 'OK' : `${s.errorCount} error(es), ${s.warningCount} advertencia(s)`}`);
  lines.push('');
  lines.push('CADENA DE PROPIEDAD');
  p.ownership.forEach((seg, i) => {
    lines.push(
      `  ${i + 1}. ${seg.ownerId}  ${fmt(seg.from)} → ${seg.to ? fmt(seg.to) : 'actual'}` +
        (seg.current ? '  [actual]' : ''),
    );
  });
  lines.push('');
  lines.push('TRANSFERENCIAS');
  p.transfers.forEach((t, i) => {
    lines.push(`  ${i + 1}. ${t.fromOwner} → ${t.toOwner}  [${t.status}]`);
    t.stages.forEach((st) => lines.push(`       - ${st.status}  ${fmt(st.at)}`));
  });
  if (p.integrity.anomalies.length > 0) {
    lines.push('');
    lines.push('ANOMALÍAS');
    sortAnomalies(p.integrity.anomalies).forEach((a) => {
      lines.push(`  [${a.severity.toUpperCase()}] ${anomalyLabel(a.type)}: ${a.message}`);
    });
  }
  lines.push('');
  return lines.join('\n');
}
