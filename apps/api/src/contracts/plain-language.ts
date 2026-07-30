import type {
  ClauseCategory,
  ClauseKeyTerm,
  ContractClause,
  ContractReaderResponse,
  ContractSummary,
  GlossaryTerm,
  PlainLanguageClause,
  ReaderLocale,
} from '@velar/types';

/**
 * Plain-language derivation for the contract reading & comprehension experience
 * (issue #39). These are PURE functions: given a structured contract + a
 * maintained glossary, they produce per-clause plain-language explanations and a
 * highlighted key-terms set.
 *
 * Key rule: legal meaning is NEVER invented. Plain-language content comes from a
 * maintained, category-based template set describing what a clause of that kind
 * means in general terms; the contract-specific wording stays in `legalText`.
 * When there is no template for a clause's category, the clause is flagged as
 * `unknown` and its `plainLanguage` is left empty (the reader shows a neutral
 * "no simplified explanation available" state).
 */

/** Maintained plain-language templates per clause category, per locale. */
const PLAIN_LANGUAGE_TEMPLATES: Record<ReaderLocale, Partial<Record<ClauseCategory, string>>> = {
  es: {
    partes:
      'Identifica quiénes firman el contrato: quién vende y quién compra el bono.',
    objeto:
      'Explica qué se está transfiriendo: la propiedad del bono, representado por un token único en la blockchain.',
    pago: 'Describe cuánto se paga y por qué medio, y que el pago queda registrado como evidencia.',
    transferencia:
      'Explica cómo cambia de dueño el bono una vez que se cumplen las condiciones acordadas.',
    garantia:
      'Explica que el token queda retenido en un escrow (una garantía) hasta que se confirme el pago, para proteger a ambas partes.',
    plazo: 'Indica los tiempos o las fechas límite que aplican a la operación.',
    incumplimiento:
      'Describe qué sucede si alguna de las partes no cumple con lo acordado.',
    jurisdiccion: 'Indica bajo qué leyes y qué autoridad se rige el contrato.',
    firmas: 'Confirma que las partes aceptan el contrato.',
    // `otro` is intentionally omitted → such clauses are flagged as `unknown`.
  },
  en: {
    // English templates can be added later; until then EN clauses are flagged unknown.
  },
};

/** Short label per category, used to build the top-level summary (no invented facts). */
const CATEGORY_LABELS: Record<ReaderLocale, Partial<Record<ClauseCategory, string>>> = {
  es: {
    partes: 'las partes',
    objeto: 'el objeto de la transferencia',
    pago: 'el precio y la forma de pago',
    transferencia: 'la transferencia de propiedad',
    garantia: 'la custodia en escrow',
    plazo: 'los plazos',
    incumplimiento: 'el incumplimiento',
    jurisdiccion: 'la jurisdicción',
    firmas: 'las firmas',
    otro: 'otras disposiciones',
  },
  en: {},
};

/** Stable deep-link anchor for a clause. */
export function clauseAnchor(clause: Pick<ContractClause, 'order'>): string {
  return `clausula-${clause.order}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extracts the glossary key terms that actually appear in `text`, matching each
 * term and its aliases as whole words (Unicode-aware, case-insensitive). Returns
 * at most one reference per glossary entry, in glossary order.
 */
export function extractKeyTerms(text: string, glossary: GlossaryTerm[]): ClauseKeyTerm[] {
  const haystack = text.toLowerCase();
  const found: ClauseKeyTerm[] = [];

  for (const entry of glossary) {
    const forms = [entry.term, ...(entry.aliases ?? [])];
    const matched = forms.some((form) => {
      const needle = form.toLowerCase().trim();
      if (!needle) return false;
      // Whole-word match with Unicode-aware boundaries (handles accents).
      const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(needle)}([^\\p{L}\\p{N}]|$)`, 'u');
      return re.test(haystack);
    });
    if (matched) {
      found.push({ term: entry.term, glossaryId: entry.id });
    }
  }

  return found;
}

/** Derives the plain-language view of a single clause. */
export function derivePlainLanguageClause(
  clause: ContractClause,
  glossary: GlossaryTerm[],
  locale: ReaderLocale = 'es',
): PlainLanguageClause {
  const template = PLAIN_LANGUAGE_TEMPLATES[locale]?.[clause.category];
  return {
    clauseId: clause.id,
    order: clause.order,
    title: clause.title,
    category: clause.category,
    legalText: clause.legalText,
    plainLanguage: template ?? '',
    keyTerms: extractKeyTerms(clause.legalText, glossary),
    unknown: template === undefined,
    anchor: clauseAnchor(clause),
  };
}

/**
 * Builds the top-level plain-language summary from the categories present in the
 * contract. Purely structural — it lists what the contract covers, never asserts
 * contract-specific facts.
 */
export function deriveContractSummaryText(
  clauses: ContractClause[],
  locale: ReaderLocale = 'es',
): string {
  const labels = CATEGORY_LABELS[locale] ?? {};
  const seen: string[] = [];
  for (const clause of clauses) {
    const label = labels[clause.category];
    if (label && !seen.includes(label)) seen.push(label);
  }
  if (seen.length === 0) return '';

  if (locale === 'es') {
    const list =
      seen.length === 1
        ? seen[0]
        : `${seen.slice(0, -1).join(', ')} y ${seen[seen.length - 1]}`;
    return `Este contrato cubre ${list}. A continuación se explica cada cláusula en lenguaje simple. Esta guía complementa el contrato legal; no lo reemplaza.`;
  }
  return '';
}

/**
 * Builds the full typed reader response for a structured contract. The returned
 * glossary is limited to the entries actually referenced by the clauses.
 */
export function buildContractReaderResponse(
  summary: ContractSummary,
  glossary: GlossaryTerm[],
  locale: ReaderLocale = 'es',
): ContractReaderResponse {
  const clauses = summary.clauses.map((clause) =>
    derivePlainLanguageClause(clause, glossary, locale),
  );
  const referencedIds = new Set(
    clauses.flatMap((clause) => clause.keyTerms.map((term) => term.glossaryId)),
  );
  const usedGlossary = glossary.filter((entry) => referencedIds.has(entry.id));

  return {
    bondId: summary.bondId,
    contractId: summary.contractId,
    title: summary.title,
    version: summary.version,
    summary: deriveContractSummaryText(summary.clauses, locale),
    clauses,
    glossary: usedGlossary,
    locale,
    generatedAt: summary.generatedAt,
  };
}
