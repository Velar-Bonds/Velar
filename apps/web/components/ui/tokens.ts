/**
 * VELAR — Design tokens (fuente de verdad tipada)
 * ================================================
 * Espejo en TypeScript de las variables CSS declaradas en `app/globals.css`.
 * Los VALORES viven en el CSS (`@theme` + `:root`) para que theming (claro/oscuro
 * y branding por país) funcione en runtime cambiando las variables. Este módulo
 * expone los MISMOS nombres de forma tipada para consumir tokens desde TS/JS
 * (charts, estilos inline, lógica) sin hardcodear hex ni px sueltos.
 *
 * Regla: si agregás un token, declaralo en `globals.css` y acá con el mismo nombre.
 * No dupliques valores que puedan divergir: para colores temáticos usá
 * `cssVar('--color-...')`, no el hex literal.
 */

/** Referencia a una variable CSS, p. ej. `cssVar('--color-primary')`. */
export function cssVar(name: string): string {
  return `var(${name})`;
}

/**
 * Colores semánticos. Los valores son los del tema CLARO (default). En dark /
 * branding se sobreescriben vía CSS; por eso, para pintar en runtime preferí
 * `colorVar('primary')` sobre `colors.primary` (el primero respeta el tema).
 */
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

/** Nombre de token → variable CSS temática (respeta claro/oscuro/país). */
export function colorVar(token: keyof typeof colors): string {
  // camelCase → kebab-case: primaryContainer → --color-primary-container
  const kebab = token.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
  return cssVar(`--color-${kebab}`);
}

/** Escala de espaciado (px). Espejo de `--velar-space-*`. */
export const space = {
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
} as const;

/** Radios de borde. Espejo de `--velar-radius-*`. */
export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  pill: '999px',
} as const;

/** Sombras. Espejo de `--shadow-*`. */
export const shadow = {
  card: '0 2px 8px rgba(11, 23, 57, 0.06)',
  glass: '0 8px 18px rgba(11, 23, 57, 0.06)',
  glassStrong: '0 16px 36px rgba(11, 23, 57, 0.10)',
} as const;

/** Familias tipográficas. Espejo de `--font-*`. */
export const font = {
  sans: '"Inter", sans-serif',
  display: '"Geist", sans-serif',
  mono: '"JetBrains Mono", monospace',
} as const;

/** Duraciones de motion usadas en la UI (ms). */
export const duration = {
  fast: 120,
  base: 180,
  slow: 400,
} as const;

/** Los dos temas soportados. */
export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const tokens = { colors, space, radius, shadow, font, duration } as const;
export type Tokens = typeof tokens;
