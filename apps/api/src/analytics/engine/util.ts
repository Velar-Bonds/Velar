/** Shared pure helpers for the analytics engine. No I/O, no DB, no Nest. */

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Whole days between two ISO timestamps (to - from). Negative if `to` precedes `from`. */
export function daysBetweenIso(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return Math.round(ms / 86_400_000);
}
