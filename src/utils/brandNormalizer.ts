/**
 * Brand Normalizer for BBFAW Parent Mapping
 *
 * Per BBFAW_2024_Supermarket_Parent_Brand_Mapping spec (ReadMe tab):
 * - Lowercase
 * - Replace & → and
 * - Remove punctuation
 * - Collapse whitespace
 *
 * Examples:
 *   Ben & Jerry's → ben and jerrys
 *   Coca-Cola → coca cola
 *   M&M's → m and ms
 *   Nestlé → nestle
 */

/**
 * Fold accents to ASCII for consistent matching (Nestlé/Nestle both → nestle).
 */
function accentFold(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

/**
 * Normalize a brand string for consistent matching against alias tables.
 */
export function normalizeBrand(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let s = raw
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/['`'´]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // remove punctuation (keep letters, numbers, spaces)
    .replace(/\s+/g, ' ')
    .trim();

  return accentFold(s);
}
