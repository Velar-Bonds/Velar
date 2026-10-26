import fs from 'node:fs';
import path from 'node:path';
import type { Linter as ESLintLinter } from 'eslint';
import {
  auroraDefaultColorStops,
  colors,
  colorVar,
  cssVar,
  duration,
  font,
  oauthBrandColors,
  radius,
  shadow,
  space,
  THEMES,
  tokens,
} from '../components/ui/tokens';

describe('design tokens & color system consolidation (#73)', () => {
  it('resolves canonical palette tokens and CSS variable helpers', () => {
    expect(colors.primary).toBe('#174EA6');
    expect(colors.primaryContainer).toBe('#2563EB');
    expect(colors.background).toBe('#F7FAFF');
    expect(colorVar('primary')).toBe('var(--color-primary)');
    expect(colorVar('primaryContainer')).toBe('var(--color-primary-container)');
    expect(cssVar('--color-surface-container-low')).toBe('var(--color-surface-container-low)');
  });

  it('exposes layout, typography, motion, and brand stop tokens from a single typed surface', () => {
    expect(space[4]).toBe('16px');
    expect(radius.lg).toBe('16px');
    expect(shadow.glass).toContain('0 8px 18px');
    expect(font.display).toContain('Geist');
    expect(duration.base).toBe(180);
    expect(THEMES).toEqual(['light', 'dark']);
    expect(tokens.colors).toBe(colors);
    expect(oauthBrandColors.googleBlue).toBe('#4285F4');
    expect(auroraDefaultColorStops).toEqual(['#2563EB', '#15803D', '#2563EB']);
  });

  it('keeps apps/web/app/globals.css consolidated under @theme static without duplicate :root token definitions', () => {
    const globalsPath = path.resolve(__dirname, '../app/globals.css');
    const css = fs.readFileSync(globalsPath, 'utf8');

    expect(css).toContain('@theme static {');
    expect(css).not.toMatch(/^\s*:root\s*\{/m);

    for (const key of Object.keys(colors)) {
      const kebab = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      expect(css).toContain(`--color-${kebab}:`);
    }
  });

  it('enforces the ESLint no-restricted-syntax guard against hardcoded hex and rgb/hsl colors', async () => {
    const { Linter } = await import('eslint');
    const rulesPath = path.resolve(__dirname, '../../../packages/config/eslint/rules.mjs');
    const rulesSource = fs.readFileSync(rulesPath, 'utf8');
    const cjsBody = `${rulesSource.replace(/export\s+const\s+/g, 'const ')}\nreturn { sharedRules, sharedIgnores };`;
    const { sharedRules } = new Function(cjsBody)() as {
      sharedRules: Record<string, ESLintLinter.RuleEntry>;
    };

    const linter = new Linter({ configType: 'flat' });
    const config = [
      {
        files: ['**/*.{ts,tsx,js,jsx}'],
        languageOptions: { ecmaVersion: 2022, sourceType: 'module' as const },
        rules: {
          'no-restricted-syntax': sharedRules['no-restricted-syntax'] as ESLintLinter.RuleEntry,
        },
      },
    ];

    const hash = '#';
    const rgbaFn = ['rg', 'ba'].join('');

    const badHexMessages = linter.verify(
      `const badgeClass = 'bg-[${hash}1f63ff] text-white';`,
      config,
      'components/BadComponent.tsx',
    );
    expect(badHexMessages).toHaveLength(1);
    expect(badHexMessages[0].ruleId).toBe('no-restricted-syntax');

    const badRgbaMessages = linter.verify(
      `const inlineBg = '${rgbaFn}(255, 255, 255, 0.85)';`,
      config,
      'components/BadComponent.tsx',
    );
    expect(badRgbaMessages).toHaveLength(1);
    expect(badRgbaMessages[0].ruleId).toBe('no-restricted-syntax');

    const cleanMessages = linter.verify(
      [
        "const badgeClass = 'bg-primary-container text-white';",
        "const blockLabel = 'Validación en bloque #1587452';",
        `const colors = { primary: '${hash}174EA6' };`,
      ].join('\n'),
      config,
      'components/CleanComponent.tsx',
    );
    expect(cleanMessages).toHaveLength(0);
  });
});
