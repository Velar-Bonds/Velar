import type { AnalyticsQuery } from '@velar/types';
import { queryToQueryString, queryToSearchParams, searchParamsToQuery } from './query';

describe('queryToSearchParams', () => {
  it('includes only the fields that are set', () => {
    const params = queryToSearchParams({ country: 'CR', bucket: 'week' });
    expect(params.get('country')).toBe('CR');
    expect(params.get('bucket')).toBe('week');
    expect(params.has('from')).toBe(false);
    expect(params.has('partyId')).toBe(false);
  });

  it('omits null/undefined/empty-string fields', () => {
    const params = queryToSearchParams({ from: null, to: undefined, country: null, status: '' as any });
    expect([...params.keys()]).toEqual([]);
  });

  it('an empty query yields empty params', () => {
    expect(queryToSearchParams({}).toString()).toBe('');
  });
});

describe('searchParamsToQuery', () => {
  it('parses a fully populated query string', () => {
    const params = new URLSearchParams('from=2026-01-01&to=2026-02-01&country=CO&partyId=party-1&status=activo&bucket=month');
    expect(searchParamsToQuery(params)).toEqual({
      from: '2026-01-01',
      to: '2026-02-01',
      country: 'CO',
      partyId: 'party-1',
      status: 'activo',
      bucket: 'month',
    });
  });

  it('missing fields become null (or undefined for bucket)', () => {
    expect(searchParamsToQuery(new URLSearchParams())).toEqual({
      from: null,
      to: null,
      country: null,
      partyId: null,
      status: null,
      bucket: undefined,
    });
  });
});

describe('queryToQueryString', () => {
  it('prefixes with ? when non-empty', () => {
    expect(queryToQueryString({ country: 'CR' })).toBe('?country=CR');
  });

  it('is empty string (no ?) for an empty query', () => {
    expect(queryToQueryString({})).toBe('');
  });
});

describe('round-trip', () => {
  it('query → params → query is stable', () => {
    const original: AnalyticsQuery = { from: '2026-01-01', country: 'AR', bucket: 'day' };
    const roundTripped = searchParamsToQuery(queryToSearchParams(original));
    expect(roundTripped).toEqual({
      from: '2026-01-01',
      to: null,
      country: 'AR',
      partyId: null,
      status: null,
      bucket: 'day',
    });
  });
});
