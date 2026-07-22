import type {
  AuditEvent,
  AuditEventType,
  BondProvenance,
  IntegrityReport,
  OwnershipSegment,
  ProvenanceAnomaly,
  ProvenanceInput,
  Transfer,
  TransferLifecycle,
  TransferLifecycleStage,
  TransferStatus,
} from '@velar/types';
import { TERMINAL_TRANSFER_STATUSES, TRANSFER_LIFECYCLE_STEPS } from '@velar/types';

/**
 * Provenance reconstruction & verification engine (issue #36).
 *
 * PURE functions: given a bond's audit events, transfers and escrow records,
 * reconstruct the ordered ownership timeline and each transfer's lifecycle, and
 * produce an integrity report with typed anomaly flags. The append-only history
 * is never mutated — events are sorted into a COPY for analysis only.
 */

// ─── Transfer state machine (for legality checks) ─────────────────────────────

/** Allowed transfer status transitions. */
export const TRANSFER_TRANSITIONS: Readonly<Record<TransferStatus, readonly TransferStatus[]>> = {
  solicitada: ['aceptada', 'contraoferta', 'rechazada', 'cancelada'],
  contraoferta: ['aceptada', 'rechazada', 'cancelada'],
  aceptada: ['en_escrow', 'cancelada'],
  en_escrow: ['pago_registrado', 'cancelada'],
  pago_registrado: ['pago_validado', 'cancelada'],
  pago_validado: ['liberada'],
  liberada: [],
  rechazada: [],
  cancelada: [],
};

export function isLegalTransferTransition(from: TransferStatus, to: TransferStatus): boolean {
  return TRANSFER_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Maps an audit event type to the transfer status it represents, if any. */
const EVENT_TO_TRANSFER_STATUS: Partial<Record<AuditEventType, TransferStatus>> = {
  transfer_solicitada: 'solicitada',
  counter_offer_sent: 'contraoferta',
  transfer_aceptada: 'aceptada',
  escrow_bloqueado: 'en_escrow',
  pago_registrado: 'pago_registrado',
  pago_validado: 'pago_validado',
  token_liberado: 'liberada',
  transfer_rechazada: 'rechazada',
  transfer_cancelada: 'cancelada',
};

const OWNERSHIP_EVENT_TYPES: AuditEventType[] = ['bond_emitido', 'bond_asignado', 'token_liberado'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const asTime = (iso: string): number => new Date(iso).getTime();

/** Events sorted ascending by createdAt (stable). Does NOT mutate the input. */
function sortedByTime(events: AuditEvent[]): AuditEvent[] {
  return [...events]
    .map((e, i) => ({ e, i }))
    .sort((a, b) => asTime(a.e.createdAt) - asTime(b.e.createdAt) || a.i - b.i)
    .map(({ e }) => e);
}

function ownerFromEvent(event: AuditEvent, bond: ProvenanceInput['bond']): string | null {
  const payload = event.payload ?? {};
  if (event.type === 'bond_emitido') {
    return (payload.owner as string) ?? bond.issuerPartyId ?? null;
  }
  if (event.type === 'bond_asignado') {
    return (payload.owner as string) ?? (payload.to as string) ?? null;
  }
  if (event.type === 'token_liberado') {
    return (payload.to as string) ?? null;
  }
  return null;
}

// ─── Ownership timeline ───────────────────────────────────────────────────────

export function reconstructOwnership(
  events: AuditEvent[],
  bond: ProvenanceInput['bond'],
  transfers: Transfer[],
): OwnershipSegment[] {
  const ordered = sortedByTime(events);
  const transferById = new Map(transfers.map((t) => [t.id, t]));
  const segments: OwnershipSegment[] = [];

  for (const event of ordered) {
    if (!OWNERSHIP_EVENT_TYPES.includes(event.type)) continue;
    let ownerId = ownerFromEvent(event, bond);
    if (event.type === 'token_liberado' && !ownerId && event.transferId) {
      ownerId = transferById.get(event.transferId)?.toOwner ?? null;
    }
    if (!ownerId) continue;

    // Close the previous open segment at this event's time.
    const open = segments[segments.length - 1];
    if (open && open.to === null) open.to = event.createdAt;

    segments.push({
      ownerId,
      from: event.createdAt,
      to: null,
      current: false,
      viaTransferId: event.transferId ?? null,
      viaEventId: event.id,
    });
  }

  if (segments.length > 0) segments[segments.length - 1].current = true;
  return segments;
}

// ─── Transfer lifecycle ───────────────────────────────────────────────────────

export function reconstructTransferLifecycle(
  transfer: Transfer,
  events: AuditEvent[],
): TransferLifecycle {
  const ordered = sortedByTime(events.filter((e) => e.transferId === transfer.id));
  const stages: TransferLifecycleStage[] = [];
  for (const event of ordered) {
    const status = EVENT_TO_TRANSFER_STATUS[event.type];
    if (!status) continue;
    stages.push({ status, at: event.createdAt, eventId: event.id });
  }

  const terminal = (TERMINAL_TRANSFER_STATUSES as readonly string[]).includes(transfer.status);
  const currentStepIndex = (TRANSFER_LIFECYCLE_STEPS as readonly string[]).indexOf(transfer.status);

  return {
    transferId: transfer.id,
    fromOwner: transfer.fromOwner,
    toOwner: transfer.toOwner,
    status: transfer.status,
    currentStepIndex,
    terminal,
    stages,
  };
}

// ─── Integrity checks ─────────────────────────────────────────────────────────

export function checkIntegrity(
  input: ProvenanceInput,
  ownership: OwnershipSegment[],
  lifecycles: TransferLifecycle[],
): ProvenanceAnomaly[] {
  const anomalies: ProvenanceAnomaly[] = [];
  const { bond, events, transfers } = input;
  const transferById = new Map(transfers.map((t) => [t.id, t]));

  // 1. Chronological order: the events must already be in ascending time order.
  for (let i = 1; i < events.length; i++) {
    if (asTime(events[i].createdAt) < asTime(events[i - 1].createdAt)) {
      anomalies.push({
        type: 'out_of_order',
        severity: 'error',
        message: `El evento ${events[i].id} está fuera de orden cronológico.`,
        eventId: events[i].id,
        at: events[i].createdAt,
      });
    }
  }

  // 2. Ownership gaps: each release must hand over from the current owner.
  for (let i = 1; i < ownership.length; i++) {
    const prev = ownership[i - 1];
    const seg = ownership[i];
    const event = events.find((e) => e.id === seg.viaEventId);
    const declaredFrom = (event?.payload?.from as string | undefined) ?? undefined;
    if (declaredFrom && declaredFrom !== prev.ownerId) {
      anomalies.push({
        type: 'ownership_gap',
        severity: 'error',
        message: `La transferencia entrega desde ${declaredFrom} pero el dueño previo era ${prev.ownerId}.`,
        eventId: seg.viaEventId,
        transferId: seg.viaTransferId,
        ownerId: prev.ownerId,
        at: seg.from,
      });
    }
  }

  // 3. State-machine legality: consecutive transfer stages must be legal transitions.
  for (const lifecycle of lifecycles) {
    for (let i = 1; i < lifecycle.stages.length; i++) {
      const from = lifecycle.stages[i - 1].status;
      const to = lifecycle.stages[i].status;
      if (from === to) continue;
      if (!isLegalTransferTransition(from, to)) {
        anomalies.push({
          type: 'illegal_transition',
          severity: 'error',
          message: `Transición ilegal "${from}" → "${to}" en la transferencia ${lifecycle.transferId}.`,
          transferId: lifecycle.transferId,
          eventId: lifecycle.stages[i].eventId,
          at: lifecycle.stages[i].at,
        });
      }
    }
  }

  // 4. On-chain/off-chain agreement: the bond's recorded owner must match the
  //    owner established by the last ownership event, and a release event's
  //    target must match its transfer's toOwner.
  const lastSegment = ownership[ownership.length - 1];
  if (lastSegment && bond.currentOwner && bond.currentOwner !== lastSegment.ownerId) {
    anomalies.push({
      type: 'onchain_offchain_mismatch',
      severity: 'error',
      message: `El dueño registrado del bono (${bond.currentOwner}) no coincide con el historial (${lastSegment.ownerId}).`,
      ownerId: bond.currentOwner,
    });
  }
  for (const event of events) {
    if (event.type !== 'token_liberado' || !event.transferId) continue;
    const transfer = transferById.get(event.transferId);
    const to = event.payload?.to as string | undefined;
    if (transfer && to && to !== transfer.toOwner) {
      anomalies.push({
        type: 'onchain_offchain_mismatch',
        severity: 'error',
        message: `El evento on-chain libera a ${to} pero la transferencia apunta a ${transfer.toOwner}.`,
        eventId: event.id,
        transferId: transfer.id,
        at: event.createdAt,
      });
    }
  }

  // 5. Missing supporting events: a completed transfer must have every prior
  //    happy-path stage backed by an event.
  for (const lifecycle of lifecycles) {
    if (lifecycle.currentStepIndex < 0) continue;
    const reached = new Set(lifecycle.stages.map((s) => s.status));
    for (let step = 0; step <= lifecycle.currentStepIndex; step++) {
      const expected = TRANSFER_LIFECYCLE_STEPS[step];
      if (!reached.has(expected)) {
        anomalies.push({
          type: 'missing_event',
          severity: 'warning',
          message: `Falta el evento de la etapa "${expected}" en la transferencia ${lifecycle.transferId}.`,
          transferId: lifecycle.transferId,
        });
      }
    }
  }

  return anomalies;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

/** Reconstructs and verifies the full provenance of a bond from raw inputs. */
export function reconstructProvenance(input: ProvenanceInput, now = new Date()): BondProvenance {
  const events = sortedByTime(input.events);
  const ownership = reconstructOwnership(input.events, input.bond, input.transfers);
  const transfers = input.transfers.map((t) => reconstructTransferLifecycle(t, input.events));
  const anomalies = checkIntegrity(input, ownership, transfers);

  const integrity: IntegrityReport = {
    ok: !anomalies.some((a) => a.severity === 'error'),
    anomalies,
    checkedAt: now.toISOString(),
  };

  return {
    bond: input.bond,
    ownership,
    transfers,
    events,
    integrity,
    reconstructedAt: now.toISOString(),
  };
}
