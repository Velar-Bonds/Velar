import { bondFixture, contractVersionFixture, type AssembleDocumentInput } from '@velar/types';
import { assembleContractDocument } from './assembly';

const NOW = '2026-07-20T00:00:00.000Z';

const FULL_PARAMS = {
  sellerName: 'Partido Aurora',
  buyerName: 'Juan Pérez',
  bondId: bondFixture.bondId,
  tokenId: bondFixture.tokenId,
  amount: '520000',
  currency: 'CRC',
  paymentMethod: 'SINPE',
  jurisdiction: 'la República de Costa Rica',
  authority: 'el Tribunal Supremo de Elecciones (TSE)',
};

function baseInput(overrides: Partial<AssembleDocumentInput> = {}): AssembleDocumentInput {
  return { bond: bondFixture, version: contractVersionFixture, params: FULL_PARAMS, now: NOW, ...overrides };
}

describe('assembleContractDocument', () => {
  it('produces one section per clause, in order', () => {
    const doc = assembleContractDocument(baseInput());
    expect(doc.sections).toHaveLength(contractVersionFixture.clauses.length);
    expect(doc.sections.map((s) => s.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it('resolves all placeholders when every parameter is provided', () => {
    const doc = assembleContractDocument(baseInput());
    for (const section of doc.sections) {
      expect(section.text).not.toMatch(/\{\{/);
      expect(section.missingParameters).toEqual([]);
    }
    expect(doc.fullText).not.toMatch(/\{\{/);
  });

  it('marks missing parameters per-section instead of fabricating text', () => {
    const doc = assembleContractDocument(baseInput({ params: {} }));
    const pago = doc.sections.find((s) => s.category === 'pago')!;
    expect(pago.missingParameters).toEqual(expect.arrayContaining(['amount', 'currency', 'paymentMethod']));
    expect(pago.text).toContain('[dato no disponible: amount]');
  });

  it('is deterministic: identical input produces byte-identical output', () => {
    const a = assembleContractDocument(baseInput());
    const b = assembleContractDocument(baseInput());
    expect(a).toEqual(b);
    expect(a.fullText).toBe(b.fullText);
  });

  it('includes the bond and version identity in the document', () => {
    const doc = assembleContractDocument(baseInput());
    expect(doc.bondId).toBe(bondFixture.bondId);
    expect(doc.versionId).toBe(contractVersionFixture.id);
    expect(doc.versionNumber).toBe(contractVersionFixture.versionNumber);
  });
});
