import type { AuditEvent, ProvenanceInput } from '@velar/types';
import { provenanceFixture, provenanceFixtureIds } from '@velar/types';
import {
  isLegalTransferTransition,
  reconstructOwnership,
  reconstructProvenance,
  reconstructTransferLifecycle,
} from './provenance-engine';

/** Deep clone so mutating a scenario never leaks into the shared fixture. */
const clone = (input: ProvenanceInput): ProvenanceInput =>
  JSON.parse(JSON.stringify(input)) as ProvenanceInput;

const ids = provenanceFixtureIds;
const FIXED_NOW = new Date('2026-04-01T00:00:00.000Z');

describe('reconstructProvenance — clean history', () => {
  it('reports no anomalies and ok=true', () => {
    const result = reconstructProvenance(clone(provenanceFixture), FIXED_NOW);
    expect(result.integrity.ok).toBe(true);
    expect(result.integrity.anomalies).toEqual([]);
    expect(result.reconstructedAt).toBe(FIXED_NOW.toISOString());
  });

  it('reconstructs the two-owner ownership timeline in order', () => {
    const { ownership } = reconstructProvenance(clone(provenanceFixture), FIXED_NOW);
    expect(ownership).toHaveLength(2);
    expect(ownership[0]).toMatchObject({ ownerId: ids.party, current: false });
    expect(ownership[0].to).not.toBeNull();
    expect(ownership[1]).toMatchObject({
      ownerId: ids.buyer,
      current: true,
      to: null,
      viaTransferId: ids.transfer,
    });
    // The first owner's end joins the second owner's start (no gap).
    expect(ownership[0].to).toBe(ownership[1].from);
  });

  it('reconstructs the transfer lifecycle through every happy-path stage', () => {
    const { transfers } = reconstructProvenance(clone(provenanceFixture), FIXED_NOW);
    expect(transfers).toHaveLength(1);
    const lifecycle = transfers[0];
    expect(lifecycle.status).toBe('liberada');
    expect(lifecycle.terminal).toBe(true);
    expect(lifecycle.stages.map((s) => s.status)).toEqual([
      'solicitada',
      'aceptada',
      'en_escrow',
      'pago_registrado',
      'pago_validado',
      'liberada',
    ]);
  });

  it('never mutates or reorders the input events', () => {
    const input = clone(provenanceFixture);
    const before = input.events.map((e) => e.id);
    reconstructProvenance(input, FIXED_NOW);
    expect(input.events.map((e) => e.id)).toEqual(before);
  });
});

describe('reconstructProvenance — integrity anomalies', () => {
  it('flags OUT_OF_ORDER when events are not chronological', () => {
    const input = clone(provenanceFixture);
    // Swap two adjacent events so timestamps go backwards.
    [input.events[2], input.events[3]] = [input.events[3], input.events[2]];
    const { integrity } = reconstructProvenance(input, FIXED_NOW);
    expect(integrity.ok).toBe(false);
    expect(integrity.anomalies.some((a) => a.type === 'out_of_order')).toBe(true);
  });

  it('flags OWNERSHIP_GAP when a release hands over from the wrong owner', () => {
    const input = clone(provenanceFixture);
    const release = input.events.find((e) => e.type === 'token_liberado') as AuditEvent;
    release.payload = { ...release.payload, from: 'someone-else' };
    const { integrity } = reconstructProvenance(input, FIXED_NOW);
    const gap = integrity.anomalies.find((a) => a.type === 'ownership_gap');
    expect(gap).toBeDefined();
    expect(gap?.severity).toBe('error');
    expect(integrity.ok).toBe(false);
  });

  it('flags ILLEGAL_TRANSITION when a stage skips backwards', () => {
    const input = clone(provenanceFixture);
    // Turn "pago_registrado" into a second "pago_validado", so the sequence is
    // ... en_escrow -> pago_validado -> pago_validado -> liberada, with an illegal
    // en_escrow -> pago_validado jump.
    const registered = input.events.find((e) => e.type === 'pago_registrado') as AuditEvent;
    registered.type = 'pago_validado';
    const { integrity } = reconstructProvenance(input, FIXED_NOW);
    expect(integrity.anomalies.some((a) => a.type === 'illegal_transition')).toBe(true);
    expect(integrity.ok).toBe(false);
  });

  it('flags ONCHAIN_OFFCHAIN_MISMATCH when the bond owner disagrees with history', () => {
    const input = clone(provenanceFixture);
    input.bond.currentOwner = 'ghost-owner';
    const { integrity } = reconstructProvenance(input, FIXED_NOW);
    const mismatch = integrity.anomalies.find((a) => a.type === 'onchain_offchain_mismatch');
    expect(mismatch).toBeDefined();
    expect(integrity.ok).toBe(false);
  });

  it('flags ONCHAIN_OFFCHAIN_MISMATCH when a release targets the wrong owner', () => {
    const input = clone(provenanceFixture);
    const release = input.events.find((e) => e.type === 'token_liberado') as AuditEvent;
    release.payload = { ...release.payload, to: 'wrong-buyer' };
    const { integrity } = reconstructProvenance(input, FIXED_NOW);
    expect(integrity.anomalies.some((a) => a.type === 'onchain_offchain_mismatch')).toBe(true);
  });

  it('flags MISSING_EVENT when a completed transfer skips an intermediate stage', () => {
    const input = clone(provenanceFixture);
    input.events = input.events.filter((e) => e.type !== 'pago_validado');
    const { integrity } = reconstructProvenance(input, FIXED_NOW);
    const missing = integrity.anomalies.find((a) => a.type === 'missing_event');
    expect(missing).toBeDefined();
    expect(missing?.severity).toBe('warning');
  });
});

describe('transfer state machine', () => {
  it('accepts happy-path transitions and rejects illegal ones', () => {
    expect(isLegalTransferTransition('solicitada', 'aceptada')).toBe(true);
    expect(isLegalTransferTransition('pago_validado', 'liberada')).toBe(true);
    expect(isLegalTransferTransition('en_escrow', 'pago_validado')).toBe(false);
    expect(isLegalTransferTransition('liberada', 'aceptada')).toBe(false);
  });

  it('allows cancellation from any active state but not from terminal states', () => {
    expect(isLegalTransferTransition('aceptada', 'cancelada')).toBe(true);
    expect(isLegalTransferTransition('rechazada', 'cancelada')).toBe(false);
  });
});

describe('reconstruction of degenerate inputs', () => {
  it('returns an empty timeline when there are no ownership events', () => {
    const input = clone(provenanceFixture);
    input.events = input.events.filter(
      (e) => e.type !== 'bond_emitido' && e.type !== 'token_liberado',
    );
    const ownership = reconstructOwnership(input.events, input.bond, input.transfers);
    expect(ownership).toEqual([]);
  });

  it('marks a still-open transfer as non-terminal with the right step index', () => {
    const input = clone(provenanceFixture);
    const transfer = input.transfers[0];
    transfer.status = 'en_escrow';
    const lifecycle = reconstructTransferLifecycle(transfer, input.events);
    expect(lifecycle.terminal).toBe(false);
    expect(lifecycle.currentStepIndex).toBe(2); // index of 'en_escrow'
  });
});
