import { Test } from '@nestjs/testing';
import { HttpException, BadRequestException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { SupabaseService } from '../common/supabase/supabase.service';

// ─────────────────────────────────────────────────────────────────────────────
// Mock Supabase builder
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
    const ctx: any = { table, filters: [], orderCol: null, orderDir: 'asc' };

    const exec = () => {
      let rows = dbStore[ctx.table] ?? [];
      for (const [col, val] of ctx.filters) {
        rows = rows.filter((r) => r[col] === val);
      }
      return Promise.resolve({ data: rows, error: null });
    };

    const chain: any = {
      select: () => chain,
      eq: (col: string, val: any) => { ctx.filters.push([col, val]); return chain; },
      order: (col: string, dir?: any) => { ctx.orderCol = col; ctx.orderDir = dir?.ascending ? 'asc' : 'desc'; return chain; },
      single: () => {
        let rows = dbStore[ctx.table] ?? [];
        for (const [col, val] of ctx.filters) {
          rows = rows.filter((r) => r[col] === val);
        }
        const row = rows[0] ?? null;
        return Promise.resolve({ data: row, error: row ? null : { message: 'not found', code: 'PGRST116' } });
      },
      then: (resolve: any) => exec().then(resolve),
    };
    return chain;
  };

  return {
    admin: { from: builder },
  } as any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory helpers for test data
// ─────────────────────────────────────────────────────────────────────────────

const BASE_DATE = '2026-06-01T12:00:00Z';

function makeBond(overrides: Record<string, any> = {}): FakeRow {
  return {
    token_id: 'bond-001',
    bond_id: 'BOND-2026-001',
    issuer_party_id: 'party-emisor',
    current_owner: 'party-emisor',
    status: 'activo',
    face_value: 5000000,
    currency: 'CRC',
    created_at: BASE_DATE,
    updated_at: BASE_DATE,
    parties: { id: 'party-emisor', name: 'Partido Aurora', code: 'PA' },
    profiles: { id: 'party-emisor', full_name: 'Partido Aurora', email: 'aurora@test.cr', role: 'emisor' },
    ...overrides,
  };
}

function makeTransfer(overrides: Record<string, any> = {}): FakeRow {
  return {
    id: overrides.id ?? 'transfer-001',
    bond_token_id: overrides.bond_token_id ?? 'bond-001',
    from_owner: 'party-emisor',
    to_owner: 'comprador-1',
    status: 'liberada',
    amount: 5000000,
    created_at: '2026-06-10T12:00:00Z',
    updated_at: '2026-06-10T13:00:00Z',
    from_profile: { id: 'party-emisor', full_name: 'Partido Aurora', email: 'aurora@test.cr', role: 'emisor' },
    to_profile: { id: 'comprador-1', full_name: 'Juan Pérez', email: 'juan@test.cr', role: 'comprador' },
    ...overrides,
  };
}

function makeEvent(overrides: Record<string, any> = {}): FakeRow {
  return {
    id: overrides.id ?? 'event-001',
    bond_token_id: 'bond-001',
    type: 'bond_emitido',
    actor_id: 'tse-1',
    payload: {},
    created_at: BASE_DATE,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('AuditService', () => {
  let service: AuditService;
  let supabase: SupabaseService;

  beforeEach(async () => {
    resetDb();
    supabase = mockSupabase();

    const mod = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: SupabaseService, useValue: supabase },
      ],
    }).compile();

    service = mod.get(AuditService);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getBondTimeline — 404 fix
  // ─────────────────────────────────────────────────────────────────────────

  describe('getBondTimeline', () => {
    it('throws BadRequestException for unknown bond (legacy timeline contract)', async () => {
      await expect(service.getBondTimeline('nonexistent')).rejects.toThrow(BadRequestException);
    });

    it('returns timeline for existing bond', async () => {
      dbStore.bonds.push(makeBond());
      dbStore.audit_events.push(makeEvent());
      dbStore.transfers.push(makeTransfer());

      const result = await service.getBondTimeline('bond-001');
      expect(result.bond.token_id).toBe('bond-001');
      expect(result.events).toHaveLength(1);
      expect(result.transfers).toHaveLength(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getBondTraceability — ownership derivation
  // ─────────────────────────────────────────────────────────────────────────

  describe('getBondTraceability', () => {
    it('throws HttpException 404 for unknown bond', async () => {
      const promise = service.getBondTraceability('nonexistent');
      await expect(promise).rejects.toBeInstanceOf(HttpException);
      await expect(promise).rejects.toMatchObject({
        status: 404,
        response: { error: 'Bond not found', statusCode: 404 },
      });
    });

    it('returns 1 owner (issuer seed) when bond has no transfers', async () => {
      dbStore.bonds.push(makeBond());
      dbStore.audit_events.push(makeEvent());

      const result = await service.getBondTraceability('bond-001');

      expect(result.bond.tokenId).toBe('bond-001');
      expect((result.bond as any).parties).toBeUndefined();
      expect((result.bond as any).profiles).toBeUndefined();
      expect(result.owners).toHaveLength(1);
      expect(result.owners[0]).toMatchObject({
        ownerId: 'party-emisor',
        name: 'Partido Aurora',
        since: BASE_DATE,
        until: null,
        paid: false,
        current: true,
      });
    });

    it('derives correct owners chain with 1 transfer', async () => {
      dbStore.bonds.push(makeBond());
      dbStore.audit_events.push(makeEvent());
      dbStore.transfers.push(makeTransfer({
        id: 'transfer-001',
        from_owner: 'party-emisor',
        to_owner: 'comprador-1',
        status: 'liberada',
        created_at: '2026-06-10T12:00:00Z',
        to_profile: { id: 'comprador-1', full_name: 'Juan Pérez', email: 'juan@test.cr', role: 'comprador' },
      }));

      const result = await service.getBondTraceability('bond-001');

      expect(result.bond.tokenId).toBe('bond-001');
      expect(result.events[0]).toMatchObject({
        id: 'event-001',
        bondTokenId: 'bond-001',
        createdAt: BASE_DATE,
      });
      expect(result.transfers[0]).toMatchObject({
        id: 'transfer-001',
        bondTokenId: 'bond-001',
        fromOwner: 'party-emisor',
        toOwner: 'comprador-1',
        createdAt: '2026-06-10T12:00:00Z',
      });
      expect((result.transfers[0] as any).to_profile).toBeUndefined();
      expect(result.owners).toHaveLength(2);
      // Seed owner
      expect(result.owners[0]).toMatchObject({
        ownerId: 'party-emisor',
        name: 'Partido Aurora',
        since: BASE_DATE,
        until: '2026-06-10T12:00:00Z',
        paid: false,
        current: false,
      });
      // Transfer recipient
      expect(result.owners[1]).toMatchObject({
        ownerId: 'comprador-1',
        name: 'Juan Pérez',
        since: '2026-06-10T12:00:00Z',
        until: null,
        paid: true,
        current: true,
      });
    });

    it('derives owners chain with 3 transfers in chronological order', async () => {
      dbStore.bonds.push(makeBond());
      dbStore.audit_events.push(makeEvent());

      // Three transfers: emisor -> comprador-1 -> comprador-2 -> comprador-3
      dbStore.transfers.push(makeTransfer({
        id: 't1',
        from_owner: 'party-emisor',
        to_owner: 'comprador-1',
        status: 'liberada',
        created_at: '2026-06-10T12:00:00Z',
        to_profile: { full_name: 'Juan Pérez' },
      }));
      dbStore.transfers.push(makeTransfer({
        id: 't2',
        bond_token_id: 'bond-001',
        from_owner: 'comprador-1',
        to_owner: 'comprador-2',
        status: 'solicitada',
        created_at: '2026-06-20T12:00:00Z',
        to_profile: { full_name: 'María García' },
      }));
      dbStore.transfers.push(makeTransfer({
        id: 't3',
        bond_token_id: 'bond-001',
        from_owner: 'comprador-2',
        to_owner: 'comprador-3',
        status: 'liberada',
        created_at: '2026-06-30T12:00:00Z',
        to_profile: { full_name: 'Carlos López' },
      }));

      const result = await service.getBondTraceability('bond-001');

      expect(result.owners).toHaveLength(4);
      // Seed
      expect(result.owners[0].ownerId).toBe('party-emisor');
      expect(result.owners[0].until).toBe('2026-06-10T12:00:00Z');
      expect(result.owners[0].current).toBe(false);
      expect(result.owners[0].paid).toBe(false);
      // comprador-1 (liberada)
      expect(result.owners[1].ownerId).toBe('comprador-1');
      expect(result.owners[1].paid).toBe(true);
      expect(result.owners[1].until).toBe('2026-06-20T12:00:00Z');
      expect(result.owners[1].current).toBe(false);
      // comprador-2 (solicitada — not paid)
      expect(result.owners[2].ownerId).toBe('comprador-2');
      expect(result.owners[2].paid).toBe(false);
      expect(result.owners[2].until).toBe('2026-06-30T12:00:00Z');
      expect(result.owners[2].current).toBe(false);
      // comprador-3 (liberada)
      expect(result.owners[3].ownerId).toBe('comprador-3');
      expect(result.owners[3].paid).toBe(true);
      expect(result.owners[3].until).toBeNull();
      expect(result.owners[3].current).toBe(true);
      expect(result.transfers.map((t) => t.toOwner)).toEqual(['comprador-1', 'comprador-2', 'comprador-3']);
    });

    it('sets paid:true only for liberada transfers', async () => {
      dbStore.bonds.push(makeBond());
      dbStore.audit_events.push(makeEvent());

      // First: liberada
      dbStore.transfers.push(makeTransfer({
        id: 't1',
        from_owner: 'party-emisor',
        to_owner: 'comprador-1',
        status: 'liberada',
        created_at: '2026-06-10T12:00:00Z',
        to_profile: { full_name: 'Juan Pérez' },
      }));
      // Second: solicitada (not paid)
      dbStore.transfers.push(makeTransfer({
        id: 't2',
        bond_token_id: 'bond-001',
        from_owner: 'comprador-1',
        to_owner: 'comprador-2',
        status: 'solicitada',
        created_at: '2026-06-20T12:00:00Z',
        to_profile: { full_name: 'María García' },
      }));

      const result = await service.getBondTraceability('bond-001');

      expect(result.owners[1].paid).toBe(true);   // liberada
      expect(result.owners[2].paid).toBe(false);  // solicitada
      expect(result.transfers[0].status).toBe('liberada');
      expect(result.transfers[1].status).toBe('solicitada');
    });

    it('last owner.ownerId matches bond.current_owner', async () => {
      dbStore.bonds.push(makeBond({ current_owner: 'comprador-3' }));
      dbStore.audit_events.push(makeEvent());

      dbStore.transfers.push(makeTransfer({
        id: 't1', from_owner: 'party-emisor', to_owner: 'comprador-1',
        status: 'liberada', created_at: '2026-06-10T12:00:00Z',
        to_profile: { full_name: 'Juan Pérez' },
      }));
      dbStore.transfers.push(makeTransfer({
        id: 't2', bond_token_id: 'bond-001',
        from_owner: 'comprador-1', to_owner: 'comprador-2',
        status: 'liberada', created_at: '2026-06-20T12:00:00Z',
        to_profile: { full_name: 'María García' },
      }));
      dbStore.transfers.push(makeTransfer({
        id: 't3', bond_token_id: 'bond-001',
        from_owner: 'comprador-2', to_owner: 'comprador-3',
        status: 'liberada', created_at: '2026-06-30T12:00:00Z',
        to_profile: { full_name: 'Carlos López' },
      }));

      const result = await service.getBondTraceability('bond-001');
      expect(result.owners[result.owners.length - 1].ownerId).toBe('comprador-3');
      expect(result.owners[result.owners.length - 1].current).toBe(true);
      expect(result.bond.currentOwner).toBe('comprador-3');
    });

    it('strips from_profile and to_profile from transfers', async () => {
      dbStore.bonds.push(makeBond());
      dbStore.audit_events.push(makeEvent());
      dbStore.transfers.push(makeTransfer({
        id: 't1',
        from_owner: 'party-emisor',
        to_owner: 'comprador-1',
        status: 'liberada',
        created_at: '2026-06-10T12:00:00Z',
        to_profile: { full_name: 'Juan Pérez' },
        from_profile: { full_name: 'Partido Aurora' },
      }));

      const result = await service.getBondTraceability('bond-001');

      expect(result.transfers).toHaveLength(1);
      expect(result.transfers[0].fromOwner).toBe('party-emisor');
      expect(result.transfers[0].toOwner).toBe('comprador-1');
      expect((result.transfers[0] as any).from_profile).toBeUndefined();
      expect((result.transfers[0] as any).to_profile).toBeUndefined();
    });

    it('returns bond, events, and transfers alongside owners', async () => {
      dbStore.bonds.push(makeBond());
      dbStore.audit_events.push(makeEvent({ id: 'evt-1', type: 'bond_emitido' }));
      dbStore.audit_events.push(makeEvent({ id: 'evt-2', type: 'transfer_solicitada' }));
      dbStore.transfers.push(makeTransfer({
        id: 't1',
        from_owner: 'party-emisor',
        to_owner: 'comprador-1',
        status: 'solicitada',
        created_at: '2026-06-10T12:00:00Z',
      }));

      const result = await service.getBondTraceability('bond-001');

      expect(result.bond).toBeDefined();
      expect(result.bond.tokenId).toBe('bond-001');
      expect(result.events).toHaveLength(2);
      expect(result.transfers).toHaveLength(1);
      expect(result.owners).toHaveLength(2);
    });
  });
});
