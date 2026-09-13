/**
 * Machine Register normalisation (R-004) and closed-set matching (REG-02).
 */

export function normalizePacketStatement(raw: string): string {
  // Unicode NFKC
  let s = raw.normalize('NFKC');
  s = s.toLowerCase();
  // Ampersand / plus between claim terms → and
  s = s.replace(/\s*[&+]\s*/g, ' and ');
  // Hyphens/dashes → spaces
  s = s.replace(/[\u2010-\u2015\-–—]/g, ' ');
  // Insert space between number and g/mg/mcg/µg
  s = s.replace(/(\d)(g|mg|mcg|µg)\b/gi, '$1 $2');
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

export function escapeDisplayText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Preserve meaning; light sentence-case only where whole string is uppercase. */
export function toDisplaySafeClaimText(observed: string): string {
  const trimmed = observed.trim();
  if (!trimmed) return '';
  if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }
  return trimmed;
}

export function naturalLanguageList(items: string[]): string {
  const unique = dedupeCaseInsensitive(items);
  if (unique.length === 0) return '';
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  if (unique.length === 3) return `${unique[0]}, ${unique[1]} and ${unique[2]}`;
  const shown = unique.slice(0, 3);
  const remaining = unique.length - 3;
  return `${shown[0]}, ${shown[1]}, ${shown[2]} and ${remaining} other packet statements`;
}

export function naturalLanguageNutrientList(
  labels: ('total sugars' | 'saturated fat' | 'sodium' | string)[]
): string {
  const unique = dedupeCaseInsensitive(labels);
  if (unique.length === 0) return '';
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(', ')} and ${unique[unique.length - 1]}`;
}

function dedupeCaseInsensitive(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = normalizePacketStatement(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return out;
}
