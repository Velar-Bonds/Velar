import {
  contractSummaryFixture,
  glossaryFixture,
  type ContractClause,
} from '@velar/types';
import {
  buildContractReaderResponse,
  clauseAnchor,
  deriveContractSummaryText,
  derivePlainLanguageClause,
  extractKeyTerms,
} from './plain-language';

describe('plain-language derivation', () => {
  describe('extractKeyTerms', () => {
    it('finds glossary terms present in a clause and links them by id', () => {
      const escrowClause = contractSummaryFixture.clauses.find((c) => c.category === 'garantia')!;
      const terms = extractKeyTerms(escrowClause.legalText, glossaryFixture);
      const ids = terms.map((t) => t.glossaryId);
      expect(ids).toContain('g-escrow');
      expect(ids).toContain('g-token');
    });

    it('matches aliases (e.g. "custodia" → escrow)', () => {
      const terms = extractKeyTerms('El token queda en custodia hasta el pago.', glossaryFixture);
      expect(terms.map((t) => t.glossaryId)).toEqual(expect.arrayContaining(['g-escrow', 'g-token']));
    });

    it('is case-insensitive and matches whole words only', () => {
      expect(extractKeyTerms('SINPE o transferencia', glossaryFixture).map((t) => t.glossaryId)).toContain(
        'g-sinpe',
      );
      // "tokenizado" must NOT match the term "token" (whole-word only)
      expect(extractKeyTerms('bono tokenizado', glossaryFixture).map((t) => t.glossaryId)).not.toContain(
        'g-token',
      );
    });

    it('returns at most one reference per glossary entry', () => {
      const terms = extractKeyTerms('token, token, token', glossaryFixture);
      expect(terms.filter((t) => t.glossaryId === 'g-token')).toHaveLength(1);
    });

    it('returns nothing for text with no glossary terms', () => {
      expect(extractKeyTerms('texto sin términos técnicos', glossaryFixture)).toEqual([]);
    });
  });

  describe('derivePlainLanguageClause', () => {
    it('maps a known category to its maintained template (nothing invented)', () => {
      const pagoClause = contractSummaryFixture.clauses.find((c) => c.category === 'pago')!;
      const result = derivePlainLanguageClause(pagoClause, glossaryFixture);
      expect(result.unknown).toBe(false);
      expect(result.plainLanguage.length).toBeGreaterThan(0);
      // The legal text is preserved verbatim (never rewritten).
      expect(result.legalText).toBe(pagoClause.legalText);
      expect(result.anchor).toBe(clauseAnchor(pagoClause));
    });

    it('flags clauses with no template as unknown and leaves plain language empty', () => {
      const otroClause: ContractClause = {
        id: 'cl-x',
        order: 9,
        title: 'Cláusula 9 — Anexo',
        category: 'otro',
        legalText: 'Disposición sin plantilla de lenguaje simple.',
      };
      const result = derivePlainLanguageClause(otroClause, glossaryFixture);
      expect(result.unknown).toBe(true);
      expect(result.plainLanguage).toBe('');
    });

    it('flags an unsupported locale as unknown rather than inventing content', () => {
      const pagoClause = contractSummaryFixture.clauses.find((c) => c.category === 'pago')!;
      const result = derivePlainLanguageClause(pagoClause, glossaryFixture, 'en');
      expect(result.unknown).toBe(true);
      expect(result.plainLanguage).toBe('');
    });
  });

  describe('deriveContractSummaryText', () => {
    it('summarizes the categories present without asserting contract-specific facts', () => {
      const summary = deriveContractSummaryText(contractSummaryFixture.clauses);
      expect(summary).toContain('las partes');
      expect(summary).toContain('la custodia en escrow');
      expect(summary).toContain('no lo reemplaza');
    });

    it('returns empty string when there are no clauses', () => {
      expect(deriveContractSummaryText([])).toBe('');
    });
  });

  describe('buildContractReaderResponse', () => {
    it('derives one plain-language clause per source clause and preserves identifiers', () => {
      const res = buildContractReaderResponse(contractSummaryFixture, glossaryFixture);
      expect(res.clauses).toHaveLength(contractSummaryFixture.clauses.length);
      expect(res.bondId).toBe(contractSummaryFixture.bondId);
      expect(res.contractId).toBe(contractSummaryFixture.contractId);
      expect(res.version).toBe(contractSummaryFixture.version);
      expect(res.locale).toBe('es');
    });

    it('includes only glossary entries referenced by the clauses', () => {
      const res = buildContractReaderResponse(contractSummaryFixture, glossaryFixture);
      const referenced = new Set(res.clauses.flatMap((c) => c.keyTerms.map((t) => t.glossaryId)));
      for (const entry of res.glossary) {
        expect(referenced.has(entry.id)).toBe(true);
      }
      // Every referenced id resolves to an included glossary entry.
      const includedIds = new Set(res.glossary.map((g) => g.id));
      for (const id of referenced) {
        expect(includedIds.has(id)).toBe(true);
      }
    });

    it('produces unique, order-based anchors for deep-linking', () => {
      const res = buildContractReaderResponse(contractSummaryFixture, glossaryFixture);
      const anchors = res.clauses.map((c) => c.anchor);
      expect(new Set(anchors).size).toBe(anchors.length);
    });
  });
});
