/**
 * Tests de integración del flujo principal de VELAR.
 *
 * Estos tests cubren las reglas críticas del backend sin tocar Supabase ni
 * Stellar reales. Usan mocks de la capa de datos y de blockchain.
 *
 * Si alguno falla, una regla del flujo se rompió.
 */
import { Test } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { BondsService } from '../src/bonds/bonds.service';
import { TransfersService } from '../src/transfers/transfers.service';
import { SupabaseService } from '../src/common/supabase/supabase.service';
import { AuditService } from '../src/audit/audit.service';
import { StellarBondService } from '../src/escrow/stellar-bond.service';
import { WalletService } from '../src/escrow/wallet.service';
import { TrustlessWorkService } from '../src/escrow/trustless-work.service';
import { SorobanBondService } from '../src/escrow/soroban-bond.service';
import { NotificationsService } from '../src/notifications/notifications.service';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers para mockear el query builder fluído de Supabase
// ─────────────────────────────────────────────────────────────────────────────

type FakeRow = Record<string, any>;
let dbStore: Record<string, FakeRow[]> = {};

function resetDb() {
  dbStore = {
    profiles: [
      { id: 'tse-1', email: 'tse@velar.cr', role: 'tse' },
      { id: 'emisor-1', email: 'partido@velar.cr', role: 'emisor', party_id: 'party-1', stellar_wallet: 'GABC123' },
      { id: 'comprador-1', email: 'juan@velar.cr', role: 'comprador', stellar_wallet: 'GDEF456' },
    ],
    parties: [{ id: 'party-1', name: 'Partido Aurora', code: 'PA', stellar_wallet: 'GABC123' }],
    bonds: [],
    bond_requests: [],
    transfers: [],
    audit_events: [],
  };
}

function mockSupabase(): SupabaseService {
  const builder = (table: string) => {
    const ctx = { table, where: [] as Array<[string, any]>, select: '*', isSingle: false };
    const exec = () => {
      let rows = dbStore[ctx.table] ?? [];
      for (const [col, val] of ctx.where) rows = rows.filter((r) => r[col] === val);
      if (ctx.isSingle) {
        return Promise.resolve({ data: rows[0] ?? null, error: rows[0] ? null : { message: 'not found' } });
      }
      return Promise.resolve({ data: rows, error: null });
    };
    const chain: any = {
      select: (sel?: string) => { ctx.select = sel ?? '*'; return chain; },
      eq: (col: string, val: any) => { ctx.where.push([col, val]); return chain; },
      neq: () => chain,
      not: () => chain,
      in: () => chain,
      gte: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: () => { ctx.isSingle = true; return exec(); },
      single: () => { ctx.isSingle = true; return exec(); },
      insert: (row: FakeRow) => {
        const id = row.id ?? row.token_id ?? `gen-${Math.random().toString(36).slice(2, 8)}`;
        const full = { ...row, id, token_id: row.token_id ?? id, created_at: new Date().toISOString() };
        (dbStore[ctx.table] = dbStore[ctx.table] ?? []).push(full);
        return {
          select: () => ({
            single: () => Promise.resolve({ data: full, error: null }),
          }),
        };
      },
      update: (patch: FakeRow) => {
        let updated: FakeRow | null = null;
        return {
          eq: (col: string, val: any) => {
            for (const r of dbStore[ctx.table] ?? []) {
              if (r[col] === val) Object.assign(r, patch), (updated = r);
            }
            return {
              select: () => ({
                single: () => Promise.resolve({ data: updated, error: null }),
              }),
              then: (resolve: any) => resolve({ data: updated, error: null }),
            };
          },
        };
      },
      then: (resolve: any) => exec().then(resolve),
    };
    return chain;
  };

  return {
    admin: { from: builder, auth: { admin: {} } },
    getUser: async () => ({ id: 'mock' }),
  } as any;
}

function mockStellar(): StellarBondService {
  return {
    enabled: true,
    issueBond: jest.fn(async () => ({ txHash: 'tx-issue-001', ledger: 123, assetCode: 'TEST', issuer: 'G', owner: 'G' })),
    lockInEscrow: jest.fn(async () => 'tx-lock-001'),
    releaseFromEscrow: jest.fn(async () => ({ txHash: 'tx-release-001', priceRecorded: true })),
    returnFromEscrow: jest.fn(async () => 'tx-return-001'),
    ensureVcrcTrustline: jest.fn(async () => undefined),
    assetCodeFor: (b: string) => b.replace(/[^A-Za-z0-9]/g, ''),
    explorerUrl: (b: string) => `https://stellar.expert/${b}`,
  } as any;
}

function mockWallets(): WalletService {
  return {
    enabled: true,
    issuerAddress: 'GISSUER',
    escrowAddress: 'GESCROW',
    platformAddress: 'GPLATFORM',
    createWallet: jest.fn(async () => 'GNEW123'),
    keypairFor: jest.fn(),
    hasKeyFor: () => true,
  } as any;
}

function mockTrustlessWork(): TrustlessWorkService {
  return {
    enabled: true,
    createCoordinationEscrow: jest.fn(async () => ({ contractId: 'CONTRACT_TW_001', deployTx: 'tx-deploy-001' })),
    markMilestoneCompleted: jest.fn(async () => 'tx-milestone-001'),
    approveMilestone: jest.fn(async () => 'tx-approve-001'),
    contractExplorerUrl: (id: string) => `https://stellar.expert/contract/${id}`,
  } as any;
}

function mockSoroban(): SorobanBondService {
  return { enabled: false } as SorobanBondService;
}

function mockAudit(): AuditService {
  return { emit: jest.fn(async () => undefined) } as any;
}

function mockNotifications(): NotificationsService {
  return { emit: jest.fn(async () => undefined) } as unknown as NotificationsService;
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────

describe('Flujo principal VELAR', () => {
  let bonds: BondsService;
  let transfers: TransfersService;
  let supabase: SupabaseService;
  let audit: AuditService;
  let stellar: StellarBondService;
  let trustless: TrustlessWorkService;

  beforeEach(async () => {
    resetDb();
    supabase = mockSupabase();
    audit = mockAudit();
    stellar = mockStellar();
    trustless = mockTrustlessWork();
    const soroban = mockSoroban();
    const notifications = mockNotifications();
    const wallets = mockWallets();

    const mod = await Test.createTestingModule({
      providers: [
        BondsService,
        TransfersService,
        { provide: SupabaseService, useValue: supabase },
        { provide: AuditService, useValue: audit },
        { provide: StellarBondService, useValue: stellar },
        { provide: WalletService, useValue: wallets },
        { provide: TrustlessWorkService, useValue: trustless },
        { provide: SorobanBondService, useValue: soroban },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    bonds = mod.get(BondsService);
    transfers = mod.get(TransfersService);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Reglas de autorización
  // ───────────────────────────────────────────────────────────────────────────

  describe('Autorización', () => {
    it('rechaza aprobar si el actor no es TSE/admin', async () => {
      await expect(
        bonds.approveRequest('any-id', 'comprador-1', 'comprador' as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza rechazar solicitud si el actor no es TSE/admin', async () => {
      await expect(
        bonds.rejectRequest('any-id', 'razón', 'emisor-1', 'emisor' as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza aprobar retorno si el actor no es TSE/admin', async () => {
      dbStore.transfers.push({ id: 't1', return_requested_at: new Date().toISOString() });
      await expect(
        transfers.approveReturn('t1', 'notas', 'emisor-1', 'emisor' as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Flujo: partido solicita un bono
  // ───────────────────────────────────────────────────────────────────────────

  describe('Solicitud de bono por el partido', () => {
    it('crea fila en bond_requests con status pendiente', async () => {
      const r = await bonds.requestBond(
        { faceValue: 5_000_000, currency: 'CRC', series: 'A' },
        'emisor-1',
        'party-1',
      );
      expect(r.status).toBe('pendiente');
      expect(r.face_value).toBe(5_000_000);
      expect(r.party_id).toBe('party-1');
      expect(dbStore.bond_requests).toHaveLength(1);
    });

    it('no toca Stellar al solicitar (solo escribe en BD)', async () => {
      await bonds.requestBond({ faceValue: 1000, currency: 'CRC' }, 'emisor-1', 'party-1');
      expect(stellar.issueBond).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Flujo: TSE aprueba la solicitud
  // ───────────────────────────────────────────────────────────────────────────

  describe('Aprobación por el TSE', () => {
    it('crea el bono y dispara la emisión on-chain', async () => {
      const req = await bonds.requestBond(
        { faceValue: 3_000_000, currency: 'CRC', series: 'B' },
        'emisor-1',
        'party-1',
      );

      const bond = await bonds.approveRequest(req.id, 'tse-1', 'tse' as any);

      expect(bond).toBeTruthy();
      expect(bond.face_value).toBe(3_000_000);
      expect(bond.issuer_party_id).toBe('party-1');
      expect(stellar.issueBond).toHaveBeenCalledTimes(1);

      // La solicitud queda marcada como aprobada
      const updatedReq = dbStore.bond_requests.find((r) => r.id === req.id);
      expect(updatedReq?.status).toBe('aprobado');
    });

    it('no permite aprobar dos veces la misma solicitud', async () => {
      const req = await bonds.requestBond(
        { faceValue: 1_000_000, currency: 'CRC' },
        'emisor-1',
        'party-1',
      );
      await bonds.approveRequest(req.id, 'tse-1', 'tse' as any);
      await expect(
        bonds.approveRequest(req.id, 'tse-1', 'tse' as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Reglas de publicación al marketplace
  // ───────────────────────────────────────────────────────────────────────────

  describe('Publicación al marketplace', () => {
    it('solo el dueño actual puede publicar', async () => {
      // Sembrar un bono con dueño emisor-1
      dbStore.bonds.push({
        token_id: 'bond-1',
        bond_id: 'SOL-2026-001',
        current_owner: 'emisor-1',
        status: 'activo',
      });

      // Alguien que no es dueño no puede publicar
      await expect(bonds.publish('bond-1', 'comprador-1')).rejects.toThrow(ForbiddenException);
      expect(audit.emit).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: expect.stringMatching(/BOND_PUBLISHED/) }),
      );

      // El dueño sí puede
      const r = await bonds.publish('bond-1', 'emisor-1');
      expect(r.status).toBe('en_venta');
      expect(audit.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bond_published',
          bondTokenId: 'bond-1',
          actorId: 'emisor-1',
          payload: { previousStatus: 'activo' },
        }),
      );
    });

    it('no permite publicar un bono que no está en estado activo/aprobado', async () => {
      dbStore.bonds.push({
        token_id: 'bond-2',
        bond_id: 'SOL-2026-002',
        current_owner: 'emisor-1',
        status: 'en_escrow',
      });
      await expect(bonds.publish('bond-2', 'emisor-1')).rejects.toThrow(BadRequestException);
    });

    it('emite bond_published con estado anterior correcto', async () => {
      dbStore.bonds.push({
        token_id: 'bond-3',
        bond_id: 'SOL-2026-003',
        current_owner: 'emisor-1',
        status: 'activo',
      });
      await bonds.publish('bond-3', 'emisor-1');
      expect(audit.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bond_published',
          bondTokenId: 'bond-3',
          payload: { previousStatus: 'activo' },
        }),
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Contraoferta: event type fix
  // ───────────────────────────────────────────────────────────────────────────

  describe('Contraoferta', () => {
    beforeEach(() => {
      // Reset audit calls between tests
      (audit.emit as jest.Mock).mockClear();
    });

    it('emite counter_offer_sent, no transfer_aceptada', async () => {
      dbStore.bonds.push({
        token_id: 'bond-co-1',
        bond_id: 'SOL-2026-CO-001',
        current_owner: 'emisor-1',
        status: 'en_venta',
      });
      dbStore.transfers.push({
        id: 'transfer-co-1',
        bond_token_id: 'bond-co-1',
        from_owner: 'emisor-1',
        to_owner: 'comprador-1',
        status: 'solicitada',
        amount: 100000,
        counter_offer_amount: null,
      });

      await transfers.counterOffer('transfer-co-1', 150000, 'mi contra propuesta', 'emisor-1');

      expect(audit.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'counter_offer_sent',
          bondTokenId: 'bond-co-1',
          transferId: 'transfer-co-1',
          actorId: 'emisor-1',
          payload: { counterOfferAmount: 150000, message: 'mi contra propuesta' },
        }),
      );
      // Verificar que NO emite transfer_aceptada
      expect(audit.emit).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'transfer_aceptada' }),
      );
    });

    it('rechaza contraoferta de quien no es el vendedor', async () => {
      dbStore.transfers.push({
        id: 'transfer-co-2',
        bond_token_id: 'bond-co-1',
        from_owner: 'emisor-1',
        to_owner: 'comprador-1',
        status: 'solicitada',
        amount: 100000,
      });

      await expect(
        transfers.counterOffer('transfer-co-2', 200000, undefined, 'comprador-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
