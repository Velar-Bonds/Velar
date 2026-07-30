import { contractSummaryFixture, type ContractVersionDiff } from '@velar/types';
import {
  attentionSeverityTone,
  buildDiffSummary,
  buildDocumentExportText,
  createContractEngineClient,
  formatContractAmount,
  statusLabel,
  statusTone,
  type FetchLike,
} from './contract-engine';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('createContractEngineClient', () => {
  it('fetches the summary from the bonds endpoint', async () => {
    const calls: string[] = [];
    const fetchMock: FetchLike = async (input) => {
      calls.push(String(input));
      return jsonResponse(contractSummaryFixture);
    };
    const client = createContractEngineClient({ baseUrl: 'http://api.test', fetch: fetchMock });

    const summary = await client.getSummary('token-abc');

    expect(calls[0]).toBe('http://api.test/bonds/token-abc/summary');
    expect(summary.bondId).toBe(contractSummaryFixture.bondId);
  });

  it('appends the versionId query param to the document endpoint only when provided', async () => {
    const calls: string[] = [];
    const fetchMock: FetchLike = async (input) => {
      calls.push(String(input));
      return jsonResponse({});
    };
    const client = createContractEngineClient({ baseUrl: 'http://api.test', fetch: fetchMock });

    await client.getDocument('bond-001');
    await client.getDocument('bond-001', 'ver-2');

    expect(calls[0]).toBe('http://api.test/contracts/bond-001/document');
    expect(calls[1]).toBe('http://api.test/contracts/bond-001/document?versionId=ver-2');
  });

  it('throws with the server message on a non-ok response', async () => {
    const fetchMock: FetchLike = async () => jsonResponse({ message: 'No autorizado' }, 403);
    const client = createContractEngineClient({ baseUrl: 'http://api.test', fetch: fetchMock });
    await expect(client.getSummary('token-abc')).rejects.toThrow('No autorizado');
  });
});

describe('statusLabel / statusTone', () => {
  it('has a label and tone for every ContractStatus value', () => {
    const statuses = ['borrador', 'vigente', 'en_negociacion', 'en_escrow', 'liberado', 'cancelado', 'congelado'] as const;
    for (const status of statuses) {
      expect(statusLabel(status)).not.toBe(status);
      expect(statusTone(status)).toBeTruthy();
    }
  });
});

describe('attentionSeverityTone', () => {
  it('maps critical to the error tone', () => {
    expect(attentionSeverityTone('critical')).toBe('error');
  });
  it('maps info/warning to themselves', () => {
    expect(attentionSeverityTone('info')).toBe('info');
    expect(attentionSeverityTone('warning')).toBe('warning');
  });
});

describe('formatContractAmount', () => {
  it('formats a known amount with currency', () => {
    const text = formatContractAmount({ value: 520000, currency: 'CRC', unknown: false }, 'CR');
    expect(text).not.toBe('No disponible');
    expect(text.length).toBeGreaterThan(0);
  });

  it('never fabricates a value: shows "No disponible" when unknown', () => {
    expect(formatContractAmount({ value: null, currency: null, unknown: true })).toBe('No disponible');
  });
});

describe('buildDiffSummary', () => {
  const baseDiff: ContractVersionDiff = { fromVersionId: 'a', toVersionId: 'b', added: [], removed: [], changed: [], unchanged: [] };

  it('reports no changes when the diff is empty', () => {
    expect(buildDiffSummary(baseDiff)).toBe('Sin cambios entre las versiones seleccionadas.');
  });

  it('summarizes added/removed/changed counts', () => {
    const diff: ContractVersionDiff = {
      ...baseDiff,
      added: [{ clauseKey: 'clause-plazo', title: 'Plazo', order: 3 }],
      removed: [{ clauseKey: 'clause-garantia', title: 'Garantía', order: 3 }],
      changed: [{ clauseKey: 'clause-pago', title: 'Pago', fromOrder: 2, toOrder: 2, bodyChanged: true }],
    };
    expect(buildDiffSummary(diff)).toBe('+1 agregada · -1 eliminada · 1 modificada');
  });
});

describe('buildDocumentExportText', () => {
  it('includes the title, each section, and flags missing parameters', () => {
    const text = buildDocumentExportText({
      bondId: 'bond-001',
      templateId: 'tpl-1',
      versionId: 'ver-1',
      versionNumber: 1,
      title: 'Contrato — bond-001 (v1)',
      generatedAt: '2026-07-20T00:00:00.000Z',
      fullText: 'irrelevant',
      sections: [
        { clauseKey: 'clause-partes', order: 1, title: 'Partes', category: 'partes', text: 'Comparecen...', missingParameters: [] },
        {
          clauseKey: 'clause-pago', order: 2, title: 'Pago', category: 'pago',
          text: 'El precio es [dato no disponible: amount].', missingParameters: ['amount'],
        },
      ],
    });

    expect(text).toContain('Contrato — bond-001 (v1)');
    expect(text).toContain('1. Partes');
    expect(text).toContain('2. Pago');
    expect(text).toContain('Datos pendientes: amount');
  });
});
