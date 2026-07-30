import type { AlertRuleInput, AnalyticsQuery, AnalyticsSnapshot, SavedView, SavedViewInput } from '@velar/types';
import { apiDownload, apiFetch } from '../api';
import { queryToQueryString, queryToSearchParams } from './query';

/** Thin wrapper over `apiFetch`/`apiDownload` for the analytics endpoints — no parallel HTTP client. */

export async function fetchSnapshot(token: string, query: AnalyticsQuery = {}): Promise<AnalyticsSnapshot> {
  return apiFetch(token, 'GET', `/analytics/snapshot${queryToQueryString(query)}`);
}

function withFormat(query: AnalyticsQuery, format: 'csv' | 'pdf'): string {
  const params = queryToSearchParams(query);
  params.set('format', format);
  return `?${params.toString()}`;
}

export async function downloadCsv(token: string, query: AnalyticsQuery, filename: string) {
  await apiDownload(token, `/analytics/export${withFormat(query, 'csv')}`, filename);
}

export async function downloadPdf(token: string, query: AnalyticsQuery, filename: string) {
  await apiDownload(token, `/analytics/export${withFormat(query, 'pdf')}`, filename);
}

export async function listSavedViews(token: string): Promise<SavedView[]> {
  return apiFetch(token, 'GET', '/analytics/views');
}

export async function createSavedView(token: string, input: SavedViewInput): Promise<SavedView> {
  return apiFetch(token, 'POST', '/analytics/views', input);
}

export async function deleteSavedView(token: string, id: string): Promise<{ ok: true }> {
  return apiFetch(token, 'DELETE', `/analytics/views/${id}`);
}

export async function listAlertRules(token: string) {
  return apiFetch(token, 'GET', '/analytics/alert-rules');
}

export async function createAlertRule(token: string, input: AlertRuleInput) {
  return apiFetch(token, 'POST', '/analytics/alert-rules', input);
}

export async function deleteAlertRule(token: string, id: string) {
  return apiFetch(token, 'DELETE', `/analytics/alert-rules/${id}`);
}

export async function evaluateAlertRule(token: string, id: string) {
  return apiFetch(token, 'POST', `/analytics/alert-rules/${id}/evaluate`);
}
