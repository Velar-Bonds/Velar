import type { AlertBreach, AlertComparator, AlertRule, AnalyticsSnapshot } from '@velar/types';

/**
 * Threshold alerting (issue #44). Pure comparator logic — no I/O, no
 * notification delivery (that's the service's job, via `NotificationsService`).
 */

function getMetric(snapshot: AnalyticsSnapshot, path: string): number | undefined {
  const value = path
    .split('.')
    .reduce<unknown>((acc, key) => (acc != null && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), snapshot);
  return typeof value === 'number' ? value : undefined;
}

function compare(value: number, comparator: AlertComparator, threshold: number): boolean {
  switch (comparator) {
    case 'gt':
      return value > threshold;
    case 'lt':
      return value < threshold;
    case 'gte':
      return value >= threshold;
    case 'lte':
      return value <= threshold;
  }
}

/** Evaluates every rule against the snapshot; rules whose metric path resolves to a non-number are skipped. */
export function evaluateAlertRules(snapshot: AnalyticsSnapshot, rules: AlertRule[], now = new Date()): AlertBreach[] {
  const breaches: AlertBreach[] = [];
  for (const rule of rules) {
    const value = getMetric(snapshot, rule.metricPath);
    if (value === undefined) continue;
    if (compare(value, rule.comparator, rule.threshold)) {
      breaches.push({
        ruleId: rule.id,
        ruleName: rule.name,
        metricPath: rule.metricPath,
        value,
        threshold: rule.threshold,
        comparator: rule.comparator,
        at: now.toISOString(),
      });
    }
  }
  return breaches;
}
