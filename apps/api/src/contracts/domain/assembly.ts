import type { AssembleDocumentInput, AssembledContractDocument, AssembledDocumentSection } from '@velar/types';
import { resolveClauseTemplate } from './template';

/**
 * Deterministic document assembly: renders the full legal document text from
 * a contract version + resolved parameters — PURE, no I/O. Same input always
 * produces byte-identical output. Missing parameters are never fabricated:
 * they're left as a marked placeholder and listed per-section.
 */
export function assembleContractDocument(input: AssembleDocumentInput): AssembledContractDocument {
  const { bond, version, params, now } = input;

  const sections: AssembledDocumentSection[] = version.clauses.map((clause, index) => {
    const { text, missingParameters } = resolveClauseTemplate(clause.bodyTemplate, params);
    return {
      clauseKey: clause.clauseKey,
      order: index + 1,
      title: clause.title,
      category: clause.category,
      text,
      missingParameters,
    };
  });

  const title = `Contrato — ${bond.bondId} (v${version.versionNumber})`;
  const fullText = [
    title,
    '',
    ...sections.map((section) => `${section.order}. ${section.title}\n${section.text}`),
  ].join('\n\n');

  return {
    bondId: bond.bondId,
    templateId: version.templateId,
    versionId: version.id,
    versionNumber: version.versionNumber,
    title,
    sections,
    fullText,
    generatedAt: now,
  };
}
