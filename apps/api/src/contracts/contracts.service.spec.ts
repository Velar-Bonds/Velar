import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { SupabaseService } from '../common/supabase/supabase.service';

const GLOSSARY_ROWS = [
  { id: 'g-escrow', term: 'escrow', definition: 'Depósito en garantía.', locale: 'es', aliases: ['custodia'] },
  { id: 'g-token', term: 'token', definition: 'Representación digital del bono.', locale: 'es', aliases: null },
];

/**
 * Builds a mock SupabaseService whose `.from(table).select(cols).eq(col, val)`
 * chain resolves to the given result.
 */
function mockSupabase(result: { data: unknown; error: unknown }) {
  const eq = jest.fn().mockResolvedValue(result);
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });
  return { service: { admin: { from } } as unknown as SupabaseService, from, select, eq };
}

async function buildService(supabase: SupabaseService): Promise<ContractsService> {
  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [ContractsService, { provide: SupabaseService, useValue: supabase }],
  }).compile();
  return moduleRef.get(ContractsService);
}

describe('ContractsService', () => {
  describe('getGlossary', () => {
    it('maps glossary rows to typed GlossaryTerm[] and filters by locale', async () => {
      const { service: supabase, from, select, eq } = mockSupabase({ data: GLOSSARY_ROWS, error: null });
      const service = await buildService(supabase);

      const glossary = await service.getGlossary('es');

      expect(from).toHaveBeenCalledWith('glossary_terms');
      expect(select).toHaveBeenCalledWith('id, term, definition, locale, aliases');
      expect(eq).toHaveBeenCalledWith('locale', 'es');
      expect(glossary).toEqual([
        { id: 'g-escrow', term: 'escrow', definition: 'Depósito en garantía.', locale: 'es', aliases: ['custodia'] },
        { id: 'g-token', term: 'token', definition: 'Representación digital del bono.', locale: 'es', aliases: undefined },
      ]);
    });

    it('returns an empty array when there are no rows', async () => {
      const { service: supabase } = mockSupabase({ data: null, error: null });
      const service = await buildService(supabase);
      await expect(service.getGlossary('es')).resolves.toEqual([]);
    });

    it('throws when Supabase returns an error', async () => {
      const { service: supabase } = mockSupabase({ data: null, error: { message: 'boom' } });
      const service = await buildService(supabase);
      await expect(service.getGlossary('es')).rejects.toThrow('boom');
    });
  });

  describe('getReader', () => {
    it('returns a typed reader response derived from the contract + glossary', async () => {
      const { service: supabase } = mockSupabase({ data: GLOSSARY_ROWS, error: null });
      const service = await buildService(supabase);

      const reader = await service.getReader('bond-xyz', 'es');

      expect(reader.bondId).toBe('bond-xyz');
      expect(reader.locale).toBe('es');
      expect(reader.clauses.length).toBeGreaterThan(0);
      // Each clause exposes the shape the reader UI needs.
      for (const clause of reader.clauses) {
        expect(typeof clause.legalText).toBe('string');
        expect(typeof clause.unknown).toBe('boolean');
        expect(clause.anchor).toMatch(/^clausula-\d+$/);
      }
      // Glossary is limited to referenced entries, all resolvable.
      const referenced = new Set(reader.clauses.flatMap((c) => c.keyTerms.map((t) => t.glossaryId)));
      for (const entry of reader.glossary) {
        expect(referenced.has(entry.id)).toBe(true);
      }
    });
  });
});
