import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';

const GLOSSARY_ROWS = [
  { id: 'g-escrow', term: 'escrow', definition: 'Depósito en garantía.', locale: 'es', aliases: ['custodia'] },
  { id: 'g-token', term: 'token', definition: 'Representación digital del bono.', locale: 'es', aliases: null },
];

const BOND = {
  tokenId: 'token-abc',
  bondId: 'bond-001',
  issuerPartyId: 'party-aurora',
  currentOwner: 'user-buyer',
  status: 'activo',
  documentHash: 'hash-abc',
  metadataUri: null,
  faceValue: 500000,
  certificateNumber: null,
  currency: 'CRC',
  interestRate: null,
  series: null,
  issueDate: '2026-01-15',
  maturityDate: '2026-12-31',
  stellarStatus: null,
  stellarTransactionHash: null,
  stellarLedger: null,
  stellarAssetCode: null,
  stellarIssuerPublicKey: null,
  stellarOwnerPublicKey: null,
  stellarRegisteredAt: null,
  stellarError: null,
  createdAt: '2026-01-15T00:00:00.000Z',
  updatedAt: '2026-07-10T00:00:00.000Z',
};

const TRANSFER = {
  id: 'transfer-1',
  bondTokenId: 'token-abc',
  fromOwner: 'party-aurora',
  toOwner: 'user-buyer',
  status: 'liberada',
  amount: 520000,
  createdAt: '2026-07-05T00:00:00.000Z',
  updatedAt: '2026-07-10T00:00:00.000Z',
};

const TEMPLATE_ROW = {
  id: 'tpl-cr-1',
  key: 'bond-transfer-cr',
  country: 'CR',
  name: 'Contrato de transferencia de bono político — Costa Rica',
  description: null,
  created_at: '2026-07-01T00:00:00.000Z',
  updated_at: '2026-07-01T00:00:00.000Z',
};

const VERSION_ROW = {
  id: 'ver-1',
  template_id: 'tpl-cr-1',
  version_number: 1,
  status: 'published',
  clause_keys: ['clause-partes', 'clause-pago'],
  notes: null,
  created_by: null,
  created_at: '2026-07-01T00:00:00.000Z',
  published_at: '2026-07-01T00:00:00.000Z',
};

const CLAUSE_ROWS = [
  {
    id: 'lib-partes', clause_key: 'clause-partes', category: 'partes', title: 'Partes',
    body_template: 'Comparecen {{sellerName}} y {{buyerName}}.', parameters: ['sellerName', 'buyerName'],
    locale: 'es', created_at: '2026-07-01T00:00:00.000Z', updated_at: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'lib-pago', clause_key: 'clause-pago', category: 'pago', title: 'Pago',
    body_template: 'El precio es {{amount}} {{currency}}.', parameters: ['amount', 'currency'],
    locale: 'es', created_at: '2026-07-01T00:00:00.000Z', updated_at: '2026-07-01T00:00:00.000Z',
  },
];

/** A chainable fake query builder: every method returns itself; terminal calls resolve `result`. */
function chain(result: { data: any; error?: any }) {
  const obj: any = {};
  const self = () => obj;
  for (const method of ['select', 'eq', 'in', 'order', 'limit', 'insert', 'update', 'upsert']) {
    obj[method] = jest.fn(self);
  }
  obj.single = jest.fn().mockResolvedValue(result);
  obj.maybeSingle = jest.fn().mockResolvedValue(result);
  obj.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
  return obj;
}

function mockSupabase(tables: Record<string, { data: any; error?: any }>) {
  const from = jest.fn((table: string) => {
    if (!(table in tables)) throw new Error(`Unmocked table in test: ${table}`);
    return chain(tables[table]);
  });
  return { admin: { from } } as unknown as SupabaseService;
}

function mockAudit(overrides: Partial<jest.Mocked<Pick<AuditService, 'resolveTokenId' | 'getProvenanceInput'>>> = {}) {
  return {
    resolveTokenId: jest.fn().mockResolvedValue(BOND.tokenId),
    getProvenanceInput: jest.fn().mockResolvedValue({ bond: BOND, events: [], transfers: [TRANSFER] }),
    ...overrides,
  } as unknown as AuditService;
}

async function buildService(supabase: SupabaseService, audit: AuditService): Promise<ContractsService> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      ContractsService,
      { provide: SupabaseService, useValue: supabase },
      { provide: AuditService, useValue: audit },
    ],
  }).compile();
  return moduleRef.get(ContractsService);
}

const FULL_TABLES = {
  bonds: { data: { country: 'CR' } },
  contract_templates: { data: TEMPLATE_ROW },
  contract_versions: { data: VERSION_ROW },
  contract_clauses: { data: CLAUSE_ROWS },
  profiles: { data: { full_name: 'Juan Pérez' } },
  parties: { data: { name: 'Partido Aurora' } },
};

describe('ContractsService', () => {
  describe('getGlossary', () => {
    it('maps glossary rows to typed GlossaryTerm[] and filters by locale', async () => {
      const supabase = mockSupabase({ glossary_terms: { data: GLOSSARY_ROWS, error: null } });
      const service = await buildService(supabase, mockAudit());
      const glossary = await service.getGlossary('es');
      expect(glossary).toEqual([
        { id: 'g-escrow', term: 'escrow', definition: 'Depósito en garantía.', locale: 'es', aliases: ['custodia'] },
        { id: 'g-token', term: 'token', definition: 'Representación digital del bono.', locale: 'es', aliases: undefined },
      ]);
    });

    it('throws when Supabase returns an error', async () => {
      const supabase = mockSupabase({ glossary_terms: { data: null, error: { message: 'boom' } } });
      const service = await buildService(supabase, mockAudit());
      await expect(service.getGlossary('es')).rejects.toThrow('boom');
    });
  });

  describe('getContractSummary', () => {
    it('derives a real ContractSummary from bond/transfer/template/version/clause rows', async () => {
      const supabase = mockSupabase(FULL_TABLES);
      const service = await buildService(supabase, mockAudit());

      const summary = await service.getContractSummary('bond-001');

      expect(summary.bondId).toBe('bond-001');
      expect(summary.country).toBe('CR');
      expect(summary.status).toBe('liberado');
      expect(summary.amount).toEqual({ value: 520000, currency: 'CRC', unknown: false });
      expect(summary.clauses).toHaveLength(2);
      // Params were resolved (profile/party names), so nothing is left unresolved.
      for (const clause of summary.clauses) expect(clause.legalText).not.toMatch(/\{\{/);
    });

    it('falls back to the bond face value when there is no relevant transfer', async () => {
      const supabase = mockSupabase(FULL_TABLES);
      const audit = mockAudit({
        getProvenanceInput: jest.fn().mockResolvedValue({ bond: BOND, events: [], transfers: [] }),
      });
      const service = await buildService(supabase, audit);
      const summary = await service.getContractSummary('bond-001');
      expect(summary.amount).toEqual({ value: BOND.faceValue, currency: 'CRC', unknown: false });
      expect(summary.status).toBe('vigente');
    });
  });

  describe('getReader', () => {
    it('returns a typed reader response derived from the real contract summary', async () => {
      const supabase = mockSupabase({ ...FULL_TABLES, glossary_terms: { data: GLOSSARY_ROWS, error: null } });
      const service = await buildService(supabase, mockAudit());

      const reader = await service.getReader('bond-001', 'es');

      expect(reader.bondId).toBe('bond-001');
      expect(reader.locale).toBe('es');
      expect(reader.clauses.length).toBeGreaterThan(0);
      for (const clause of reader.clauses) {
        expect(typeof clause.legalText).toBe('string');
        expect(typeof clause.unknown).toBe('boolean');
        expect(clause.anchor).toMatch(/^clausula-\d+$/);
      }
    });
  });

  describe('template/version/clause management', () => {
    it('listTemplates maps rows and applies the country filter', async () => {
      const supabase = mockSupabase({ contract_templates: { data: [TEMPLATE_ROW] } });
      const service = await buildService(supabase, mockAudit());
      const templates = await service.listTemplates('CR');
      expect(templates).toEqual([
        {
          id: 'tpl-cr-1', key: 'bond-transfer-cr', country: 'CR',
          name: TEMPLATE_ROW.name, description: null,
          createdAt: TEMPLATE_ROW.created_at, updatedAt: TEMPLATE_ROW.updated_at,
        },
      ]);
    });

    it('createTemplate inserts and maps the created row', async () => {
      const supabase = mockSupabase({ contract_templates: { data: TEMPLATE_ROW } });
      const service = await buildService(supabase, mockAudit());
      const template = await service.createTemplate({ key: 'bond-transfer-cr', country: 'CR', name: TEMPLATE_ROW.name });
      expect(template.id).toBe('tpl-cr-1');
    });

    it('getVersionDetail resolves clauses in the version order', async () => {
      const supabase = mockSupabase({ contract_versions: { data: VERSION_ROW }, contract_clauses: { data: CLAUSE_ROWS } });
      const service = await buildService(supabase, mockAudit());
      const version = await service.getVersionDetail('ver-1');
      expect(version.clauses.map((c) => c.clauseKey)).toEqual(['clause-partes', 'clause-pago']);
    });

    it('diffVersions delegates to the pure diff engine', async () => {
      const supabase = mockSupabase({ contract_versions: { data: VERSION_ROW }, contract_clauses: { data: CLAUSE_ROWS } });
      const service = await buildService(supabase, mockAudit());
      const diff = await service.diffVersions('ver-1', 'ver-1');
      expect(diff.added).toEqual([]);
      expect(diff.removed).toEqual([]);
      expect(diff.changed).toEqual([]);
    });

    it('listClauses maps rows and applies the category filter', async () => {
      const supabase = mockSupabase({ contract_clauses: { data: CLAUSE_ROWS } });
      const service = await buildService(supabase, mockAudit());
      const clauses = await service.listClauses('pago');
      expect(clauses.map((c) => c.clauseKey)).toEqual(['clause-partes', 'clause-pago']);
    });

    it('upsertClause upserts and maps the row', async () => {
      const supabase = mockSupabase({ contract_clauses: { data: CLAUSE_ROWS[1] } });
      const service = await buildService(supabase, mockAudit());
      const clause = await service.upsertClause({
        clauseKey: 'clause-pago', category: 'pago', title: 'Pago', bodyTemplate: 'El precio es {{amount}}.',
      });
      expect(clause.clauseKey).toBe('clause-pago');
    });
  });
});
