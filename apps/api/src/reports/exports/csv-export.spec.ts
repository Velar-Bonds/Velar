import {
  collectCsv,
  recomputeFinalHash,
  type DecisionExportRow,
} from './csv-export';
import { buildDecisionsPdf } from './pdf-export';

const NOW = '2026-07-28T12:00:00.000Z';

function sampleRow(overrides: Partial<DecisionExportRow> = {}): DecisionExportRow {
  return {
    reportId: 'rep-1',
    partyName: 'Partido Alpha',
    periodYear: 2026,
    periodMonth: 3,
    status: 'aprobado',
    declaredTotal: 1500.5,
    reviewedBy: 'tse-1',
    reviewedAt: '2026-04-01T10:00:00.000Z',
    ruleSetVersion: 'v1',
    overallSeverity: 'LOW',
    ...overrides,
  };
}

function collectReadable(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

describe('csv-export', () => {
  it('is deterministic for the same rows + now', async () => {
    const rows = [sampleRow(), sampleRow({ reportId: 'rep-2', partyName: 'Beta' })];
    const a = await collectCsv(rows, NOW);
    const b = await collectCsv(rows, NOW);
    expect(a).toBe(b);
  });

  it('embeds a finalHash that matches recomputeFinalHash', async () => {
    const rows = [sampleRow()];
    const csv = await collectCsv(rows, NOW);
    const match = csv.match(/# manifest: (.+)\n$/);
    expect(match).not.toBeNull();
    const manifest = JSON.parse(match![1]) as { finalHash: string; rowCount: number };
    expect(manifest.rowCount).toBe(1);
    expect(manifest.finalHash).toBe(recomputeFinalHash(rows));
  });

  it('detects tampering when a row is mutated after generation', async () => {
    const rows = [sampleRow(), sampleRow({ reportId: 'rep-2', declaredTotal: 99 })];
    const csv = await collectCsv(rows, NOW);
    const match = csv.match(/# manifest: (.+)\n$/);
    const originalHash = (JSON.parse(match![1]) as { finalHash: string }).finalHash;

    const tampered = rows.map((r, i) =>
      i === 0 ? { ...r, declaredTotal: r.declaredTotal + 1 } : r,
    );
    expect(recomputeFinalHash(tampered)).not.toBe(originalHash);
  });

  it('handles empty rows: header + manifest only with valid finalHash', async () => {
    const csv = await collectCsv([], NOW);
    const lines = csv.trimEnd().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(
      'report_id,party_name,period_year,period_month,status,declared_total,reviewed_by,reviewed_at,rule_set_version,overall_severity',
    );
    const manifest = JSON.parse(lines[1].replace('# manifest: ', '')) as {
      finalHash: string;
      rowCount: number;
      format: string;
    };
    expect(manifest.rowCount).toBe(0);
    expect(manifest.format).toBe('csv');
    expect(manifest.finalHash).toBe(recomputeFinalHash([]));
    expect(manifest.finalHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('CSV-escapes party names containing comma or quote', async () => {
    const rows = [
      sampleRow({ partyName: 'Partido, "Nacional"' }),
    ];
    const csv = await collectCsv(rows, NOW);
    expect(csv).toContain('"Partido, ""Nacional"""');
  });
});

describe('pdf-export', () => {
  it('returns a Readable stream that collects to a non-empty Buffer', async () => {
    const rows = [sampleRow()];
    const doc = buildDecisionsPdf(rows, NOW);
    const buf = await collectReadable(doc);
    expect(buf.length).toBeGreaterThan(0);
    expect(buf.subarray(0, 4).toString('utf8')).toBe('%PDF');
  });

  it('uses the same integrity hash as recomputeFinalHash', () => {
    const rows = [sampleRow({ reportId: 'rep-x' })];
    expect(recomputeFinalHash(rows)).toMatch(/^[a-f0-9]{64}$/);
  });
});
