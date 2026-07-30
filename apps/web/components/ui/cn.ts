/** Une clases condicionales, ignorando falsy. Ligero, sin dependencias. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
