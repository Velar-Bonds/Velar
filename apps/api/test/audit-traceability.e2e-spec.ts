/**
 * Integration tests for AuditService.getBondTraceability and
 * GET /audit/bonds/:tokenId/traceability endpoint.
 *
 * These tests verify the server-side ownership derivation, paid flag logic,
 * current-owner marking, camelCase response shape, profile stripping,
 * 404 handling, and 401 auth enforcement.
 */
import { Test } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { Role } from '@velar/types';
import { AuditService } from '../src/audit/audit.service';
import { BondsService } from '../src/bonds/bonds.service';
import { StellarBondService } from '../src/escrow/stellar-bond.service';
import { SorobanBondService } from '../src/escrow/soroban-bond.service';
import { WalletService } from '../src/escrow/wallet.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { SupabaseService } from '../src/common/supabase/supabase.service';
import { AuditModule } from '../src/audit/audit.module';
import { SupabaseModule } from '../src/common/supabase/supabase.module';
import { BondsModule } from '../src/bonds/bonds.module';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers para mockear el query builder fluído de Supabase
// ─────────────────────────────────────────────────────────────────────────────

type FakeValue = string | number | boolean | null | undefined | FakeRow | FakeValue[];
type FakeRow = { [key: string]: FakeValue };
type QueryExecution = {
  data: FakeRow[] | FakeRow | null;
  error: { message: string } | null;
};
type QueryBuilder = {
  select: (sel?: string) => QueryBuilder;
  eq: (col: string, val: unknown) => QueryBuilder;
  in: () => QueryBuilder;
  neq: () => QueryBuilder;
  not: () => QueryBuilder;
  gte: () => QueryBuilder;
  order: () => QueryBuilder;
  limit: () => QueryBuilder;
  maybeSingle: () => Promise<QueryExecution>;
  single: () => Promise<QueryExecution>;
  then: <TResult1 = QueryExecution, TResult2 = never>(
    onfulfilled?: ((value: QueryExecution) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) => Promise<TResult1 | TResult2>;
};

let dbStore: Record<string, FakeRow[]> = {};

function resetDb() {
  dbStore = {
    bonds: [],
    audit_events: [],
    transfers: [],
    profiles: [
      { id: 'party-1', full_name: 'Partido Aurora' },
      { id: 'user-2', full_name: 'Juan Pérez' },
      { id: 'user-3', full_name: 'María García' },
      { id: 'user-4', full_name: 'Carlos López' },
    ],
  };
}

function mockSupabase(): SupabaseService {
  const builder = (table: string) => {
    const ctx = { table, where: [] as Array<[string, unknown]>, select: '*', isSingle: false };
    const exec = (): Promise<QueryExecution> => {
      let rows = dbStore[ctx.table] ?? [];
      for (const [col, val] of ctx.where) rows = rows.filter((r) => r[col] === val);
      if (ctx.isSingle) {
        return Promise.resolve({ data: rows[0] ?? null, error: rows[0] ? null : { message: 'not found' } });
      }
      return Promise.resolve({ data: rows, error: null });
    };
    const chain: QueryBuilder = {
      select: (sel?: string) => { ctx.select = sel ?? '*'; return chain; },
      eq: (col: string, val: unknown) => { ctx.where.push([col, val]); return chain; },
      in: () => chain,
      neq: () => chain,
      not: () => chain,
      gte: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: () => { ctx.isSingle = true; return exec(); },
      single: () => { ctx.isSingle = true; return exec(); },
      then: (onfulfilled, onrejected) => exec().then(onfulfilled, onrejected),
    };
    return chain;
  };

  return {
    admin: { from: builder, auth: { admin: {} } },
    getUser: async () => ({ id: 'mock' }),
  } as unknown as SupabaseService;
}

function setAuthenticatedProfile(role: Role = 'admin') {
  dbStore.profiles.push({ id: 'mock', full_name: 'Mock User', role });
}

/** Crea un bono en dbStore y devuelve los datos que devolvería Supabase (snake_case). */
function seedBond(overrides: Record<string, FakeValue> = {}): FakeRow {
  const defaults = {
    token_id: 'bond-1',
    bond_id: 'SOL-2026-001',
    issuer_party_id: 'party-1',
    current_owner: 'user-2',
    status: 'activo',
    document_hash: 'abc123',
    face_value: 1000000,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
    parties: { id: 'party-1', name: 'Partido Aurora' },
    profiles: { id: 'user-2', full_name: 'Juan Pérez' },
  };
  const bond = { ...defaults, ...overrides };
  dbStore.bonds.push(bond);
  return bond;
}

function seedTransfer(overrides: Record<string, FakeValue> = {}): FakeRow {
  const defaults = {
    id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    bond_token_id: 'bond-1',
    from_owner: 'party-1',
    to_owner: 'user-2',
    status: 'solicitada',
    created_at: '2026-02-01T10:00:00Z',
    from_profile: { id: 'party-1', full_name: 'Partido Aurora' },
    to_profile: { id: 'user-2', full_name: 'Juan Pérez' },
  };
  const t = { ...defaults, ...overrides };
  dbStore.transfers.push(t);
  return t;
}

function seedAuditEvents(bondTokenId = 'bond-1') {
  dbStore.audit_events.push(
    {
      id: 'e1',
      bond_token_id: bondTokenId,
      type: 'bond_emitido',
      actor_id: 'tse-1',
      payload: {},
      created_at: '2026-01-15T11:00:00Z',
    },
    {
      id: 'e2',
      bond_token_id: bondTokenId,
      type: 'transfer_solicitada',
      actor_id: 'user-2',
      payload: {},
      created_at: '2026-02-01T12:00:00Z',
    },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite: Service-level integration tests
// ─────────────────────────────────────────────────────────────────────────────

describe('AuditService.getBondTraceability', () => {
  let audit: AuditService;

  beforeEach(async () => {
    resetDb();
    const supabase = mockSupabase();
    const mod = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: SupabaseService, useValue: supabase },
      ],
    }).compile();
    audit = mod.get(AuditService);
  });

  it('returns full traceability for a bond with 3 transfers (happy path)', async () => {
    // GIVEN a bond with transfers
    seedBond({ token_id: 'bond-1', issuer_party_id: 'party-1' });
    seedAuditEvents('bond-1');
    // 3 transfers: party-1 → user-2, user-2 → user-3, user-3 → user-4
    seedTransfer({ from_owner: 'party-1', to_owner: 'user-2', status: 'liberada', created_at: '2026-02-01T10:00:00Z', id: 't1' });
    seedTransfer({ from_owner: 'user-2', to_owner: 'user-3', status: 'solicitada', created_at: '2026-03-01T10:00:00Z', id: 't2' });
    seedTransfer({ from_owner: 'user-3', to_owner: 'user-4', status: 'solicitada', created_at: '2026-04-01T10:00:00Z', id: 't3' });

    // WHEN the traceability endpoint is called
    const result = await audit.getBondTraceability('bond-1');

    // THEN bond is returned
    expect(result.bond.tokenId).toBe('bond-1');
    expect(result.events).toBeDefined();
    expect(result.events.length).toBeGreaterThanOrEqual(1);

    // AND transfers are sorted ascending by createdAt
    expect(result.transfers).toHaveLength(3);
    expect(result.transfers[0].createdAt).toBe('2026-02-01T10:00:00Z');
    expect(result.transfers[1].createdAt).toBe('2026-03-01T10:00:00Z');
    expect(result.transfers[2].createdAt).toBe('2026-04-01T10:00:00Z');

    // AND owners has 4 entries: issuer + 3 transfer recipients
    expect(result.owners).toHaveLength(4);

    // AND first owner is the issuer
    expect(result.owners[0].ownerId).toBe('party-1');
    expect(result.owners[0].name).toBe('Partido Aurora');
    expect(result.owners[0].since).toBe('2026-01-15T10:00:00Z');
    expect(result.owners[0].until).toBe('2026-02-01T10:00:00Z');

    // AND second owner is first transfer recipient
    expect(result.owners[1].ownerId).toBe('user-2');
    expect(result.owners[1].name).toBe('Juan Pérez');

    // AND last owner is current
    expect(result.owners[3].ownerId).toBe('user-4');
    expect(result.owners[3].current).toBe(true);
    expect(result.owners[3].until).toBeNull();

    // AND previous owners are NOT current
    expect(result.owners[0].current).toBe(false);
    expect(result.owners[1].current).toBe(false);
    expect(result.owners[2].current).toBe(false);
  });

  it('returns single owner for a bond with no transfers', async () => {
    // GIVEN a bond with zero transfer records
    seedBond({ token_id: 'bond-2', issuer_party_id: 'party-1', created_at: '2026-01-15T10:00:00Z' });
    seedAuditEvents('bond-2');

    // WHEN the endpoint is called
    const result = await audit.getBondTraceability('bond-2');

    // THEN owners has exactly 1 entry
    expect(result.owners).toHaveLength(1);

    // AND that entry is the issuer
    expect(result.owners[0].ownerId).toBe('party-1');
    expect(result.owners[0].name).toBe('Partido Aurora');
    expect(result.owners[0].since).toBe('2026-01-15T10:00:00Z');
    expect(result.owners[0].until).toBeNull();
    expect(result.owners[0].paid).toBe(false);
    expect(result.owners[0].current).toBe(true);
  });

  it('marks paid=true for liberada transfers and paid=false for solicitada', async () => {
    // GIVEN a bond with two transfers: first completed (liberada), second pending (solicitada)
    seedBond({ token_id: 'bond-3', issuer_party_id: 'party-1' });
    seedAuditEvents('bond-3');
    seedTransfer({ bond_token_id: 'bond-3', from_owner: 'party-1', to_owner: 'user-2', status: 'liberada', created_at: '2026-02-01T10:00:00Z', id: 't1' });
    seedTransfer({ bond_token_id: 'bond-3', from_owner: 'user-2', to_owner: 'user-3', status: 'solicitada', created_at: '2026-03-01T10:00:00Z', id: 't2' });

    const result = await audit.getBondTraceability('bond-3');

    // THEN issuer has paid: false (no transfer TO issuer)
    expect(result.owners[0].ownerId).toBe('party-1');
    expect(result.owners[0].paid).toBe(false);

    // AND first transfer to_owner has paid: true (liberada)
    expect(result.owners[1].ownerId).toBe('user-2');
    expect(result.owners[1].paid).toBe(true);

    // AND second transfer to_owner has paid: false (solicitada)
    expect(result.owners[2].ownerId).toBe('user-3');
    expect(result.owners[2].paid).toBe(false);
  });

  it('marks the last chronological owner as current: true', async () => {
    // GIVEN a bond whose last transfer made user-456 the to_owner
    seedBond({ token_id: 'bond-4', issuer_party_id: 'party-1', current_owner: 'user-456' });
    seedAuditEvents('bond-4');
    seedTransfer({ bond_token_id: 'bond-4', from_owner: 'party-1', to_owner: 'user-456', status: 'liberada', created_at: '2026-02-01T10:00:00Z', id: 't1' });

    const result = await audit.getBondTraceability('bond-4');

    // THEN the last owners entry has current: true and the correct ownerId
    const last = result.owners[result.owners.length - 1];
    expect(last.ownerId).toBe('user-456');
    expect(last.current).toBe(true);
  });

  it('returns camelCase keys and strips profile embeds from transfers', async () => {
    // GIVEN a bond with a transfer that has profile embeds
    seedBond({ token_id: 'bond-5', issuer_party_id: 'party-1', created_at: '2026-01-15T10:00:00Z' });
    seedAuditEvents('bond-5');
    seedTransfer({ id: 't1', bond_token_id: 'bond-5', from_owner: 'party-1', to_owner: 'user-2', created_at: '2026-02-01T10:00:00Z' });

    const result = await audit.getBondTraceability('bond-5');

    // THEN bond uses camelCase
    expect(result.bond.tokenId).toBeDefined();
    expect((result.bond as unknown as Record<string, unknown>).token_id).toBeUndefined();

    // THEN events use camelCase
    expect(result.events[0].bondTokenId).toBe('bond-5');
    expect((result.events[0] as unknown as Record<string, unknown>).bond_token_id).toBeUndefined();

    // THEN transfers use camelCase
    expect(result.transfers[0].bondTokenId).toBe('bond-5');
    expect(result.transfers[0].fromOwner).toBe('party-1');
    expect(result.transfers[0].toOwner).toBe('user-2');
    expect((result.transfers[0] as unknown as Record<string, unknown>).bond_token_id).toBeUndefined();
    expect((result.transfers[0] as unknown as Record<string, unknown>).from_owner).toBeUndefined();
    expect((result.transfers[0] as unknown as Record<string, unknown>).to_owner).toBeUndefined();

    // AND transfer has NO profile embeds
    expect((result.transfers[0] as unknown as Record<string, unknown>).from_profile).toBeUndefined();
    expect((result.transfers[0] as unknown as Record<string, unknown>).to_profile).toBeUndefined();

    // AND owners use camelCase
    expect(result.owners[0].ownerId).toBeDefined();
    expect(result.owners[0].since).toBeDefined();
    expect(result.owners[0].until).toBeDefined();
    expect(result.owners[0].paid).toBeDefined();
    expect(result.owners[0].current).toBeDefined();
  });

  it('throws NotFoundException for unknown bond', async () => {
    // GIVEN no bond with tokenId 'nonexistent-id' exists
    resetDb();

    // WHEN/THEN getBondTraceability throws NotFoundException
    await expect(
      audit.getBondTraceability('nonexistent-id'),
    ).rejects.toThrow(NotFoundException);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite: HTTP endpoint tests
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /audit/bonds/:tokenId/traceability (HTTP)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    resetDb();
    const supabase = mockSupabase();

    const mod = await Test.createTestingModule({
      imports: [AuditModule, SupabaseModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(supabase)
      .compile();

    app = mod.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns 401 when no auth token is provided', async () => {
    // GIVEN no auth header
    const response = await request(app.getHttpServer())
      .get('/api/audit/bonds/bond-1/traceability');

    // THEN status is 401
    expect(response.status).toBe(401);
  });

  it('returns 200 for authenticated requests with valid bond', async () => {
    // GIVEN a valid bond exists
    setAuthenticatedProfile('comprador');
    seedBond({ token_id: 'bond-1', issuer_party_id: 'party-1' });
    seedAuditEvents('bond-1');
    seedTransfer({ id: 't1', bond_token_id: 'bond-1', from_owner: 'party-1', to_owner: 'user-2', created_at: '2026-02-01T10:00:00Z' });

    // WHEN authenticated request is made
    const response = await request(app.getHttpServer())
      .get('/api/audit/bonds/bond-1/traceability')
      .set('Authorization', 'Bearer valid-token');

    // THEN status is 200
    expect(response.status).toBe(200);

    // AND response has camelCase keys
    expect(response.body.bond).toBeDefined();
    expect(response.body.events).toBeDefined();
    expect(response.body.transfers).toBeDefined();
    expect(response.body.owners).toBeDefined();
    expect(response.body.bond.tokenId).toBe('bond-1');
  });

  it('returns 404 for unknown bond with auth', async () => {
    // GIVEN no bond with this tokenId
    resetDb();
    setAuthenticatedProfile('comprador');

    // WHEN authenticated request to unknown bond
    const response = await request(app.getHttpServer())
      .get('/api/audit/bonds/nonexistent-id/traceability')
      .set('Authorization', 'Bearer valid-token');

    // THEN status is 404
    expect(response.status).toBe(404);
    const errMsg = (response.body.error ?? response.body.message ?? '').toLowerCase();
    expect(errMsg).toContain('not found');
  });

  it('preserves timeline access for tse/admin-only roles', async () => {
    setAuthenticatedProfile('admin');
    seedBond({ token_id: 'bond-6', issuer_party_id: 'party-1' });
    seedAuditEvents('bond-6');
    seedTransfer({ id: 't1', bond_token_id: 'bond-6', from_owner: 'party-1', to_owner: 'user-2', created_at: '2026-02-01T10:00:00Z' });

    const response = await request(app.getHttpServer())
      .get('/api/audit/bonds/bond-6/timeline')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.bond.token_id).toBe('bond-6');
    expect(response.body.transfers).toHaveLength(1);
    expect(response.body.transfers[0].from_profile.full_name).toBe('Partido Aurora');
  });

  it('keeps timeline forbidden for authenticated non-tse roles', async () => {
    setAuthenticatedProfile('comprador');
    seedBond({ token_id: 'bond-7', issuer_party_id: 'party-1' });

    const response = await request(app.getHttpServer())
      .get('/api/audit/bonds/bond-7/timeline')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(403);
    expect(String(response.body.message)).toContain('TSE/Admin only');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite: BondsService.getSummary
// ─────────────────────────────────────────────────────────────────────────────

describe('BondsService.getSummary', () => {
  let bonds: BondsService;

  beforeEach(async () => {
    resetDb();
    const supabase = mockSupabase();
    const mockAudit = { emit: jest.fn() };
    const mockStellar = { enabled: false } as unknown as StellarBondService;
    const mockWallet = { createWallet: jest.fn(), createWalletRecord: jest.fn() } as unknown as WalletService;
    const mockSoroban = { enabled: false } as unknown as SorobanBondService;
    const mockNotifications = { emit: jest.fn() } as unknown as NotificationsService;
    const mod = await Test.createTestingModule({
      providers: [
        BondsService,
        { provide: SupabaseService, useValue: supabase },
        { provide: AuditService, useValue: mockAudit },
        { provide: StellarBondService, useValue: mockStellar },
        { provide: WalletService, useValue: mockWallet },
        { provide: SorobanBondService, useValue: mockSoroban },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();
    bonds = mod.get(BondsService);
  });

  it('returns summary for all bonds with only id/name/value/status', async () => {
    dbStore.bonds.push(
      { token_id: 'b1', bond_id: 'SOL-001', face_value: 1000000, status: 'activo' },
      { token_id: 'b2', bond_id: 'SOL-002', face_value: 500000, status: 'emitido' },
      { token_id: 'b3', bond_id: 'SOL-003', face_value: 250000, status: 'en_venta' },
    );

    const result = await bonds.getSummary();

    expect(result).toHaveLength(3);
    for (const entry of result) {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('value');
      expect(entry).toHaveProperty('status');
      expect(Object.keys(entry)).toHaveLength(4);
    }

    expect(result[0]).toEqual({ id: 'b1', name: 'SOL-001', value: 1000000, status: 'activo' });
    expect(result[1]).toEqual({ id: 'b2', name: 'SOL-002', value: 500000, status: 'emitido' });
    expect(result[2]).toEqual({ id: 'b3', name: 'SOL-003', value: 250000, status: 'en_venta' });
  });

  it('returns empty array when no bonds exist', async () => {
    resetDb();
    const result = await bonds.getSummary();
    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suite: GET /bonds/summary (HTTP)
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /bonds/summary (HTTP)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    resetDb();
    const supabase = mockSupabase();
    const mockAudit = { emit: jest.fn() } as unknown as AuditService;
    const mockStellar = { enabled: false } as unknown as StellarBondService;
    const mockWallet = { createWallet: jest.fn(), createWalletRecord: jest.fn() } as unknown as WalletService;
    const mockSoroban = { enabled: false } as unknown as SorobanBondService;
    const mockNotifications = { emit: jest.fn() } as unknown as NotificationsService;

    const mod = await Test.createTestingModule({
      imports: [BondsModule, SupabaseModule],
    })
      .overrideProvider(SupabaseService)
      .useValue(supabase)
      .overrideProvider(AuditService)
      .useValue(mockAudit)
      .overrideProvider(StellarBondService)
      .useValue(mockStellar)
      .overrideProvider(WalletService)
      .useValue(mockWallet)
      .overrideProvider(SorobanBondService)
      .useValue(mockSoroban)
      .overrideProvider(NotificationsService)
      .useValue(mockNotifications)
      .compile();

    app = mod.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns 401 when no auth token is provided', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/bonds/summary');

    expect(response.status).toBe(401);
  });

  it('returns 200 with bond summaries for authenticated user', async () => {
    setAuthenticatedProfile('comprador');
    dbStore.bonds.push(
      { token_id: 'b1', bond_id: 'SOL-001', face_value: 1000000, status: 'activo' },
      { token_id: 'b2', bond_id: 'SOL-002', face_value: 500000, status: 'emitido' },
    );

    const response = await request(app.getHttpServer())
      .get('/api/bonds/summary')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toEqual({ id: 'b1', name: 'SOL-001', value: 1000000, status: 'activo' });
    expect(response.body[1]).toEqual({ id: 'b2', name: 'SOL-002', value: 500000, status: 'emitido' });
  });
});
