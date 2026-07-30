import type { AnalyticsQuery } from '@velar/types';

/**
 * Pure (de)serialization of `AnalyticsQuery` to/from `URLSearchParams` (issue #44).
 * Used both for the filter bar's shareable URL state and for saved views
 * (a saved view is just a stored `AnalyticsQuery`).
 */

const KEYS = ['from', 'to', 'country', 'partyId', 'status', 'bucket'] as const;

export function queryToSearchParams(query: AnalyticsQuery): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of KEYS) {
    const value = query[key];
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  return params;
}

export function searchParamsToQuery(params: URLSearchParams): AnalyticsQuery {
  return {
    from: params.get('from') || null,
    to: params.get('to') || null,
    country: (params.get('country') as AnalyticsQuery['country']) || null,
    partyId: params.get('partyId') || null,
    status: (params.get('status') as AnalyticsQuery['status']) || null,
    bucket: (params.get('bucket') as AnalyticsQuery['bucket']) || undefined,
  };
}

/** `?a=1&b=2`, or `''` when the query is empty (no trailing `?`). */
export function queryToQueryString(query: AnalyticsQuery): string {
  const s = queryToSearchParams(query).toString();
  return s ? `?${s}` : '';
}
