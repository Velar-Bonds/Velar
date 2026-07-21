import { glossaryFixture, type ContractReaderResponse } from '@velar/types';
import {
  buildExportText,
  computeReadingProgress,
  createContractReaderClient,
  highlightSegments,
  NO_PLAIN_LANGUAGE_ES,
  plainLanguageText,
  type FetchLike,
} from './contract-reader';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const READER: ContractReaderResponse = {
  bondId: 'bond-1',
  contractId: 'contract-1',
  title: 'Contrato de prueba',
  version: 'v1',
  summary: 'Resumen del contrato.',
  locale: 'es',
  generatedAt: '2026-07-01T00:00:00.000Z',
  clauses: [
    {
      clauseId: 'cl-1',
      order: 1,
      title: 'Cláusula 1',
      category: 'garantia',
      legalText: 'El token queda en custodia (escrow) hasta el pago.',
      plainLanguage: 'El bono queda retenido hasta confirmar el pago.',
      keyTerms: [
        { term: 'escrow', glossaryId: 'g-escrow' },
        { term: 'token', glossaryId: 'g-token' },
      ],
      unknown: false,
      anchor: 'clausula-1',
    },
    {
      clauseId: 'cl-2',
      order: 2,
      title: 'Cláusula 2',
      category: 'otro',
      legalText: 'Disposición sin plantilla.',
      plainLanguage: '',
      keyTerms: [],
      unknown: true,
      anchor: 'clausula-2',
    },
  ],
  glossary: glossaryFixture.filter((g) => g.id === 'g-escrow' || g.id === 'g-token'),
};

describe('contract-reader client', () => {
  it('fetches the reader response for a bond', async () => {
    const fetcher: FetchLike = jest.fn(async () => jsonResponse(READER));
    const client = createContractReaderClient({ baseUrl: 'http://test/api', fetch: fetcher });
    const reader = await client.getReader('bond-1', 'es');
    expect(reader.bondId).toBe('bond-1');
    expect(fetcher).toHaveBeenCalledWith(
      'http://test/api/contracts/bond-1/reader?locale=es',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('fetches the glossary', async () => {
    const fetcher: FetchLike = jest.fn(async () => jsonResponse(READER.glossary));
    const client = createContractReaderClient({ baseUrl: 'http://test/api', fetch: fetcher });
    const glossary = await client.getGlossary('es');
    expect(glossary.map((g) => g.id)).toContain('g-escrow');
  });

  it('throws with the backend message on error responses', async () => {
    const fetcher: FetchLike = async () => jsonResponse({ message: 'no existe' }, 404);
    const client = createContractReaderClient({ baseUrl: 'http://test/api', fetch: fetcher });
    await expect(client.getReader('missing')).rejects.toThrow('no existe');
  });
});

describe('highlightSegments', () => {
  it('marks key terms (including aliases) and preserves the original text', () => {
    const clause = READER.clauses[0];
    const segments = highlightSegments(clause.legalText, clause.keyTerms, glossaryFixture);
    // Rebuilding the segments yields the original text unchanged.
    expect(segments.map((s) => s.text).join('')).toBe(clause.legalText);
    const highlighted = segments.filter((s) => s.glossaryId);
    // "custodia" (alias of escrow), "escrow" and "token" are all highlighted.
    expect(highlighted.map((s) => s.glossaryId)).toEqual(
      expect.arrayContaining(['g-escrow', 'g-token']),
    );
    expect(highlighted.map((s) => s.text.toLowerCase())).toEqual(
      expect.arrayContaining(['custodia', 'escrow', 'token']),
    );
  });

  it('matches whole words only', () => {
    const segments = highlightSegments(
      'bono tokenizado',
      [{ term: 'token', glossaryId: 'g-token' }],
      glossaryFixture,
    );
    expect(segments.some((s) => s.glossaryId)).toBe(false);
  });

  it('returns a single plain segment when there are no key terms', () => {
    expect(highlightSegments('texto simple', [], glossaryFixture)).toEqual([{ text: 'texto simple' }]);
  });
});

describe('computeReadingProgress', () => {
  it('returns 0 when there are no clauses', () => {
    expect(computeReadingProgress([], 0)).toBe(0);
  });
  it('rounds the percentage of read clauses', () => {
    expect(computeReadingProgress(['a'], 3)).toBe(33);
    expect(computeReadingProgress(['a', 'b', 'c'], 3)).toBe(100);
  });
  it('caps at 100 and de-duplicates', () => {
    expect(computeReadingProgress(['a', 'a', 'b', 'x'], 2)).toBe(100);
  });
});

describe('plainLanguageText', () => {
  it('returns the neutral note for unknown clauses (no invented meaning)', () => {
    expect(plainLanguageText(READER.clauses[1])).toBe(NO_PLAIN_LANGUAGE_ES);
  });
  it('returns the derived plain language for known clauses', () => {
    expect(plainLanguageText(READER.clauses[0])).toBe(READER.clauses[0].plainLanguage);
  });
});

describe('buildExportText', () => {
  it('includes the title, summary, clauses, glossary and the disclaimer', () => {
    const text = buildExportText(READER);
    expect(text).toContain('Contrato de prueba');
    expect(text).toContain('Resumen del contrato.');
    expect(text).toContain('Cláusula 1');
    expect(text).toContain(NO_PLAIN_LANGUAGE_ES); // unknown clause exported neutrally
    expect(text).toContain('Glosario');
    expect(text).toContain('no lo reemplaza');
  });
});
