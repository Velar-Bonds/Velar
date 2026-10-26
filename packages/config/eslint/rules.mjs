/**
 * Rule severities and ignore globs shared across every VELAR workspace.
 *
 * These are plugin-agnostic: they only set severities for rules whose plugins
 * the consumer already registers (e.g. apps/web loads `typescript-eslint` via
 * `eslint-config-next`). apps/web spreads these next to its Next config; the
 * self-contained `eslint/base.mjs` (for non-Next packages) also applies them.
 */
export const sharedIgnores = ['**/dist/**', '**/node_modules/**', '**/.next/**'];

const HARDCODED_COLOR_REGEX = String.raw`/(?:#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|\b(?:rgba?|hsla?)\s*[(])/`;

const ALLOWED_TOKEN_DECLARATOR =
  'VariableDeclarator[id.name=/^(colors|shadow|THEMES|oauthBrandColors|auroraDefaultColorStops)$/]';
const ALLOWED_TEST_CALL =
  'CallExpression[callee.property.name=/^(toBe|toEqual|toMatch|toContain)$/]';

export const sharedRules = {
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-unused-vars': 'warn',
  'no-restricted-syntax': [
    'error',
    {
      selector: `Literal[value=${HARDCODED_COLOR_REGEX}]:not(${ALLOWED_TOKEN_DECLARATOR} Literal, ${ALLOWED_TEST_CALL} Literal)`,
      message:
        'Hardcoded hex/rgb/hsl color literals are forbidden outside design token definitions (apps/web/app/globals.css and @velar/ui/tokens). Use semantic Tailwind classes, CSS variables, or tokens.',
    },
    {
      selector: `TemplateElement[value.raw=${HARDCODED_COLOR_REGEX}]:not(${ALLOWED_TOKEN_DECLARATOR} TemplateElement, ${ALLOWED_TEST_CALL} TemplateElement)`,
      message:
        'Hardcoded hex/rgb/hsl color literals are forbidden outside design token definitions (apps/web/app/globals.css and @velar/ui/tokens). Use semantic Tailwind classes, CSS variables, or tokens.',
    },
  ],
};
