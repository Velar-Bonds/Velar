/**
 * E2E tests for the Audit Traceability Endpoint.
 *
 * These tests verify the full flow: auth enforcement, 404 handling,
 * role-agnostic access, profile stripping, and backward compat.
 *
 * Uses mocked Supabase and Stellar layers (same pattern as bonds-flow.e2e-spec.ts).
 */
import { Test } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { AuditController } from '../src/audit/audit.controller';
import { AuditService } from '../src/audit/audit.service';
import { SupabaseService } from '../src/common/supabase/supabase.service';
import { AuthGuard } from '../src/auth/auth.guard';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

type FakeRow = Record<string, any>;
let dbStore: Record<string, FakeRow[]> = {};

function resetDb() {
  dbStore = {
    bonds: [],
    audit_events: [],
    transfers: [],
  };
}

function mockSupabase(): SupabaseService {
  const builder = (table: string) => {
    const ctx: any = { table, filters: [] };

    const chain: any = {
      select: () => chain,
      eq: (col: string, val: any) => { ctx.filters.push([col, val]); return chain; },
      order: () => chain,
      single: () => {
        let rows = dbStore[ctx.table] ?? [];
        for (const [col, val] of ctx.filters) {
          rows = rows.filter((r) => r[col] === val);
        }
        const row = rows[0] ?? null;
        return Promise.resolve({ data: row, error: row ? null : { message: 'not found', code: 'PGRST116' } });
      },
      then: (resolve: any) => {
        let rows = dbStore[ctx.table] ?? [];
        for (const [col, val] of ctx.filters) {
          rows = rows.filter((r) => r[col] === val);
        }
        return Promise.resolve(resolve({ data: rows, error: null }));
      },
    };
    return chain;
  };

  return {
    admin: { from: builder },
  } as any;
}

// AuthGuard mock that simulates an authenticated user with the given role
class MockAuthGuard {
  private role: string;

  constructor(role: string) {
    this.role = role;
  }

  canActivate(ctx: any) {
    const req = ctx.switchToHttp().getRequest();
    req.user = {
      id: 'mock-user',
      profile: { id: 'mock-user', full_name: 'Mock User', email: 'mock@test.cr', role: this.role },
    };
    return true;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const BASE_DATE = '2026-06-01T12:00:00Z';

function seedBond() {
  dbStore.bonds.push({
    token_id: 'bond-e2e-001',
    bond_id: 'E2E-2026-001',
    issuer_party_id: 'party-emisor',
    current_owner: 'comprador-1',
    status: 'activo',
    face_value: 5000000,
    currency: 'CRC',
    created_at: BASE_DATE,
    updated_at: BASE_DATE,
    parties: { id: 'party-emisor', name: 'Partido Aurora', code: 'PA' },
    profiles: { id: 'comprador-1', full_name: 'Juan Pérez', email: 'juan@test.cr', role: 'comprador' },
  });
}

function seedTransfer() {
  dbStore.transfers.push({
    id: 'transfer-e2e-001',
    bond_token_id: 'bond-e2e-001',
    from_owner: 'party-emisor',
    to_owner: 'comprador-1',
    status: 'liberada',
    amount: 5000000,
    created_at: '2026-06-10T12:00:00Z',
    updated_at: '2026-06-10T13:00:00Z',
    from_profile: { id: 'party-emisor', full_name: 'Partido Aurora', email: 'aurora@test.cr', role: 'emisor' },
    to_profile: { id: 'comprador-1', full_name: 'Juan Pérez', email: 'juan@test.cr', role: 'comprador' },
  });
}

function seedEvent() {
  dbStore.audit_events.push({
    id: 'event-e2e-001',
    bond_token_id: 'bond-e2e-001',
    type: 'bond_emitido',
    actor_id: 'tse-1',
    payload: {},
    created_at: BASE_DATE,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('Audit Traceability E2E', () => {
  let app: INestApplication;

  function buildApp(role: string) {
    return Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        AuditService,
        { provide: SupabaseService, useFactory: mockSupabase },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(new MockAuthGuard(role))
      .compile();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 401 — Unauthenticated
  // ─────────────────────────────────────────────────────────────────────────

  describe('401 Unauthorized', () => {
    beforeEach(async () => {
      resetDb();
      seedBond();
      seedEvent();
      seedTransfer();

      // Build app WITHOUT overriding AuthGuard — it will fail on missing token
      const mod = await Test.createTestingModule({
        controllers: [AuditController],
        providers: [
          AuditService,
          { provide: SupabaseService, useFactory: mockSupabase },
        ],
      }).compile();

      app = mod.createNestApplication();
      app.setGlobalPrefix('api');
      await app.init();
    });

    afterEach(async () => {
      await app?.close();
    });

    it('returns 401 when no auth token is provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/audit/bonds/bond-e2e-001/traceability')
        .expect(401);

      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 404 — Unknown bond
  // ─────────────────────────────────────────────────────────────────────────

  describe('404 Not Found', () => {
    beforeEach(async () => {
      resetDb();
      const mod = await buildApp('tse');
      app = mod.createNestApplication();
      app.setGlobalPrefix('api');
      await app.init();
    });

    afterEach(async () => {
      await app?.close();
    });

    it('returns 404 for unknown tokenId', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/audit/bonds/nonexistent/traceability')
        .expect(404);

      expect(res.body.error).toBe('Bond not found');
      expect(res.body.statusCode).toBe(404);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Cross-role access — all authenticated roles get 200
  // ─────────────────────────────────────────────────────────────────────────

  describe('Cross-role access', () => {
    const ROLES = ['tse', 'emisor', 'comprador', 'recomprador', 'validador', 'admin'];

    beforeEach(() => {
      resetDb();
      seedBond();
      seedEvent();
      seedTransfer();
    });

    afterEach(async () => {
      await app?.close();
    });

    ROLES.forEach((role) => {
      it(`returns 200 for role: ${role}`, async () => {
        const mod = await buildApp(role);
        app = mod.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();

        const res = await request(app.getHttpServer())
          .get('/api/audit/bonds/bond-e2e-001/traceability')
          .expect(200);

        expect(res.body).toHaveProperty('bond');
        expect(res.body).toHaveProperty('events');
        expect(res.body).toHaveProperty('transfers');
        expect(res.body).toHaveProperty('owners');
        expect(res.body.bond.tokenId).toBe('bond-e2e-001');
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Full traceability flow
  // ─────────────────────────────────────────────────────────────────────────

  describe('Full traceability response', () => {
    beforeEach(async () => {
      resetDb();
      seedBond();
      seedEvent();
      seedTransfer();

      const mod = await buildApp('tse');
      app = mod.createNestApplication();
      app.setGlobalPrefix('api');
      await app.init();
    });

    afterEach(async () => {
      await app?.close();
    });

    it('returns complete TraceabilityResponse with owners', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/audit/bonds/bond-e2e-001/traceability')
        .expect(200);

      // Response shape
      expect(res.body.bond).toBeDefined();
      expect(res.body.events).toBeDefined();
      expect(res.body.transfers).toBeDefined();
      expect(res.body.owners).toBeDefined();
      expect(res.body.bond.tokenId).toBe('bond-e2e-001');
      expect(res.body.bond.currentOwner).toBe('comprador-1');
      expect(res.body.bond.parties).toBeUndefined();
      expect(res.body.bond.profiles).toBeUndefined();
      expect(res.body.events[0].createdAt).toBe(BASE_DATE);
      expect(res.body.transfers[0].bondTokenId).toBe('bond-e2e-001');
      expect(res.body.transfers[0].fromOwner).toBe('party-emisor');
      expect(res.body.transfers[0].toOwner).toBe('comprador-1');

      // Owners derived correctly
      expect(res.body.owners).toHaveLength(2);
      expect(res.body.owners[0].ownerId).toBe('party-emisor');
      expect(res.body.owners[0].current).toBe(false);
      expect(res.body.owners[1].ownerId).toBe('comprador-1');
      expect(res.body.owners[1].current).toBe(true);
      expect(res.body.owners[1].paid).toBe(true);
    });

    it('transfers do NOT include from_profile or to_profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/audit/bonds/bond-e2e-001/traceability')
        .expect(200);

      expect(res.body.transfers).toHaveLength(1);
      expect(res.body.transfers[0].from_profile).toBeUndefined();
      expect(res.body.transfers[0].to_profile).toBeUndefined();
      expect(res.body.transfers[0].fromOwner).toBe('party-emisor');
      expect(res.body.transfers[0].toOwner).toBe('comprador-1');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Backward compatibility — /timeline still works
  // ─────────────────────────────────────────────────────────────────────────

  describe('Backward compatibility', () => {
    beforeEach(async () => {
      resetDb();
      seedBond();
      seedEvent();
      seedTransfer();

      const mod = await buildApp('tse');
      app = mod.createNestApplication();
      app.setGlobalPrefix('api');
      await app.init();
    });

    afterEach(async () => {
      await app?.close();
    });

    it('existing /timeline endpoint still returns 200 with correct shape', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/audit/bonds/bond-e2e-001/timeline')
        .expect(200);

      expect(res.body.bond).toBeDefined();
      expect(res.body.bond.token_id).toBe('bond-e2e-001');
      expect(res.body.events).toBeDefined();
      expect(res.body.transfers).toBeDefined();
      expect(res.body.transfers[0].from_owner).toBe('party-emisor');
      // Timeline does NOT have owners
      expect(res.body.owners).toBeUndefined();
    });
  });
});
