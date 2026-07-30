/**
 * Shared `{{parameter}}` template resolution used by both summary derivation
 * (`summary.ts`) and document assembly (`assembly.ts`) — PURE, no I/O.
 *
 * A missing parameter is never fabricated: it's left as a clearly-marked,
 * non-legal-sounding placeholder and reported in `missingParameters`.
 */

const TOKEN_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export interface ResolvedTemplate {
  text: string;
  missingParameters: string[];
}

export function resolveClauseTemplate(
  bodyTemplate: string,
  params: Record<string, string>,
): ResolvedTemplate {
  const missing = new Set<string>();
  const text = bodyTemplate.replace(TOKEN_RE, (_match, key: string) => {
    const value = params[key];
    if (value === undefined || value === null || value === '') {
      missing.add(key);
      return `[dato no disponible: ${key}]`;
    }
    return value;
  });
  return { text, missingParameters: [...missing] };
}
