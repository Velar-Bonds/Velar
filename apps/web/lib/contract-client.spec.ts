import { ErrorCode } from '@velar/types';
import { createTypedApiClient, type FetchLike } from './contract-client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('schema-derived typed API client', () => {
  it('validates input before sending a request', async () => {
    const fetcher = jest.fn<ReturnType<FetchLike>, Parameters<FetchLike>>();
    const client = createTypedApiClient({ baseUrl: 'http://test/api', fetch: fetcher });
    await expect(client.call('reports.create', { body: { title: '', description: '' } }))
      .rejects.toMatchObject({ code: ErrorCode.VALIDATION_ERROR });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('returns a runtime-validated typed response', async () => {
    const fetcher: FetchLike = async () => jsonResponse({
      id: 'report-1',
      party_id: 'party-1',
      submitted_by: 'user-1',
      title: 'Q1',
      description: 'Detalle',
      period_start: null,
      period_end: null,
      bond_token_ids: null,
      total_amount: null,
      status: 'enviado',
      reviewed_by: null,
      reviewed_at: null,
      tse_notes: null,
      created_at: '2026-07-19T00:00:00Z',
      updated_at: '2026-07-19T00:00:00Z',
    });
    const client = createTypedApiClient({ baseUrl: 'http://test/api', fetch: fetcher });
    const report = await client.call('reports.create', { body: { title: 'Q1', description: 'Detalle' } });
    expect(report.id).toBe('report-1');
  });

  it('rejects response drift', async () => {
    const client = createTypedApiClient({ baseUrl: 'http://test/api', fetch: async () => jsonResponse({ id: 'report-1' }) });
    await expect(client.call('reports.create', { body: { title: 'Q1', description: 'Detalle' } }))
      .rejects.toMatchObject({ code: ErrorCode.RESPONSE_VALIDATION_ERROR });
  });

  it('surfaces structured backend errors', async () => {
    const client = createTypedApiClient({
      baseUrl: 'http://test/api',
      fetch: async () => jsonResponse({ success: false, error: { code: 'FORBIDDEN', message: 'No autorizado' } }, 403),
    });
    await expect(client.call('users.me')).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN, status: 403 });
  });
});
