import type {
  ClauseKeyTerm,
  ContractReaderResponse,
  GlossaryTerm,
  PlainLanguageClause,
  ReaderLocale,
} from '@velar/types';

/**
 * Client + pure helpers for the contract reading experience (issue #39).
 *
 * The helpers are pure and framework-free so they can be unit-tested in the
 * repo's node test environment; the React component composes them.
 */

// ─── Client ───────────────────────────────────────────────────────────────────

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface ContractReaderClientOptions {
  baseUrl: string;
  fetch?: FetchLike;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

async function getJson<T>(opts: ContractReaderClientOptions, path: string): Promise<T> {
  const doFetch = opts.fetch ?? fetch;
  const res = await doFetch(joinUrl(opts.baseUrl, path), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = (await res.json()) as { message?: unknown };
      if (typeof body?.message === 'string' && body.message.trim()) message = body.message;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

/** Creates a small client for the public contract-reader endpoints. */
export function createContractReaderClient(opts: ContractReaderClientOptions) {
  return {
    getGlossary: (locale: ReaderLocale = 'es') =>
      getJson<GlossaryTerm[]>(opts, `/contracts/glossary?locale=${encodeURIComponent(locale)}`),
    getReader: (bondId: string, locale: ReaderLocale = 'es') =>
      getJson<ContractReaderResponse>(
        opts,
        `/contracts/${encodeURIComponent(bondId)}/reader?locale=${encodeURIComponent(locale)}`,
      ),
  };
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** A run of clause text, optionally linked to a glossary entry for highlighting. */
export interface TextSegment {
  text: string;
  glossaryId?: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Index glossary entries by id for quick lookup. */
export function glossaryById(glossary: GlossaryTerm[]): Map<string, GlossaryTerm> {
  return new Map(glossary.map((entry) => [entry.id, entry]));
}

/**
 * Splits `text` into segments, marking the occurrences of a clause's key terms
 * (matched by the glossary entry's term + aliases, whole-word, case-insensitive)
 * so the UI can highlight them and attach glossary tooltips. Non-overlapping,
 * longest-match-first; original casing/spacing is preserved.
 */
export function highlightSegments(
  text: string,
  keyTerms: ClauseKeyTerm[],
  glossary: GlossaryTerm[],
): TextSegment[] {
  if (!text) return [];
  const byId = glossaryById(glossary);

  // Collect all searchable forms with their glossary id, longest first.
  const forms: { form: string; glossaryId: string }[] = [];
  for (const kt of keyTerms) {
    const entry = byId.get(kt.glossaryId);
    const candidates = entry ? [entry.term, ...(entry.aliases ?? [])] : [kt.term];
    for (const form of candidates) {
      const trimmed = form.trim();
      if (trimmed) forms.push({ form: trimmed, glossaryId: kt.glossaryId });
    }
  }
  forms.sort((a, b) => b.form.length - a.form.length);
  if (forms.length === 0) return [{ text }];

  type Match = { start: number; end: number; glossaryId: string };
  const matches: Match[] = [];
  for (const { form, glossaryId } of forms) {
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(form)})(?=[^\\p{L}\\p{N}]|$)`, 'giu');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const start = m.index + m[1].length;
      const end = start + m[2].length;
      // Skip if this span overlaps an already-recorded (longer) match.
      if (!matches.some((x) => start < x.end && end > x.start)) {
        matches.push({ start, end, glossaryId });
      }
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }

  matches.sort((a, b) => a.start - b.start);

  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start > cursor) segments.push({ text: text.slice(cursor, match.start) });
    segments.push({ text: text.slice(match.start, match.end), glossaryId: match.glossaryId });
    cursor = match.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

/** Reading progress as a 0–100 integer given the set of clauses marked as read. */
export function computeReadingProgress(readClauseIds: Iterable<string>, totalClauses: number): number {
  if (totalClauses <= 0) return 0;
  const read = new Set(readClauseIds).size;
  return Math.round((Math.min(read, totalClauses) / totalClauses) * 100);
}

/** Neutral placeholder shown when a clause has no plain-language derivation. */
export const NO_PLAIN_LANGUAGE_ES = 'Sin explicación simplificada disponible para esta cláusula.';

/** Plain-language text for a clause, falling back to a neutral note when unknown. */
export function plainLanguageText(clause: PlainLanguageClause): string {
  return clause.unknown || !clause.plainLanguage ? NO_PLAIN_LANGUAGE_ES : clause.plainLanguage;
}

/** Builds a plain-text export/print version of the reader response. */
export function buildExportText(reader: ContractReaderResponse): string {
  const lines: string[] = [];
  lines.push(reader.title);
  lines.push('='.repeat(reader.title.length));
  lines.push('');
  if (reader.summary) {
    lines.push('Resumen');
    lines.push(reader.summary);
    lines.push('');
  }
  for (const clause of reader.clauses) {
    lines.push(clause.title);
    lines.push(`Lenguaje simple: ${plainLanguageText(clause)}`);
    lines.push(`Texto legal: ${clause.legalText}`);
    lines.push('');
  }
  if (reader.glossary.length > 0) {
    lines.push('Glosario');
    for (const term of reader.glossary) {
      lines.push(`- ${term.term}: ${term.definition}`);
    }
    lines.push('');
  }
  lines.push('Esta guía complementa el contrato legal; no lo reemplaza.');
  return lines.join('\n');
}
