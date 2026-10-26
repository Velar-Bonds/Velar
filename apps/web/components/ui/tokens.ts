/**
 * VELAR — Typed design token helper for `apps/web` (issue #73)
 *
 * Mirrors the single source of truth in `apps/web/app/globals.css` (`@theme static`)
 * and `@velar/ui/tokens` so JS/TS consumers (charts, WebGL/Aurora, SVG art, and
 * third-party OAuth brand icons) never hardcode hex/rgb literals.
 */

export function cssVar(name: string): string {
  return `var(${name})`;
}

export const colors = {
  primary: '#174EA6',
  primaryContainer: '#2563EB',
  primaryHover: '#1D4ED8',
  primaryFixed: '#EEF5FF',
  primaryFixedDim: '#8DBBFF',
  onPrimary: '#ffffff',
  institutional: '#0B1739',
  secondary: '#52627A',
  secondaryContainer: '#D9E6F8',
  secondaryFixed: '#EEF5FF',
  tertiary: '#174EA6',
  tertiaryContainer: '#2563EB',
  background: '#F7FAFF',
  surface: '#FFFFFF',
  surfaceVariant: '#D9E6F8',
  surfaceContainer: '#EEF5FF',
  surfaceContainerLow: '#F1F6FD',
  surfaceContainerHigh: '#E6F0FF',
  surfaceContainerHighest: '#D9E6F8',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#0B1739',
  onSurfaceVariant: '#52627A',
  onBackground: '#0B1739',
  outline: '#B8CBE8',
  outlineVariant: '#D9E6F8',
  inverseSurface: '#0B1739',
  inverseOnSurface: '#F7FAFF',
  error: '#B42318',
  errorContainer: '#FEE4E2',
  success: '#15803D',
  warning: '#B7791F',
  glassBorder: '#D9E6F8',
} as const;

export type ColorToken = keyof typeof colors;

export function colorVar(token: ColorToken): string {
  const kebab = token.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
  return cssVar(`--color-${kebab}`);
}

export const space = {
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
} as const;

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  pill: '999px',
} as const;

export const shadow = {
  card: '0 2px 8px rgba(11, 23, 57, 0.06)',
  glass: '0 8px 18px rgba(11, 23, 57, 0.06)',
  glassStrong: '0 16px 36px rgba(11, 23, 57, 0.10)',
} as const;

export const font = {
  sans: '"Inter", sans-serif',
  display: '"Geist", sans-serif',
  mono: '"JetBrains Mono", monospace',
} as const;

export const duration = {
  fast: 120,
  base: 180,
  slow: 400,
} as const;

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const tokens = { colors, space, radius, shadow, font, duration } as const;
export type Tokens = typeof tokens;

/**
 * Official third-party OAuth brand colors (Google & Microsoft identity guidelines)
 * centralized here so UI components remain 100% free of hardcoded hex literals.
 */
export const oauthBrandColors = {
  googleBlue: '#4285F4',
  googleGreen: '#34A853',
  googleYellow: '#FBBC05',
  googleRed: '#EA4335',
  microsoftRed: '#F25022',
  microsoftGreen: '#7FBA00',
  microsoftBlue: '#00A4EF',
  microsoftYellow: '#FFB900',
} as const;

/**
 * Default RGB hex stops for the WebGL Aurora canvas shader (ogl Color parser requires hex).
 */
export const auroraDefaultColorStops: [string, string, string] = [
  colors.primaryContainer,
  colors.success,
  colors.primaryContainer,
];
