/**
 * Machine Register normalisation (R-004) and closed-set matching (REG-02).
 */

export function normalizePacketStatement(raw: string): string {
  let s = raw.normalize('NFKC');
  s = s.toLowerCase();
  s = s.replace(/\s*[&+]\s*/g, ' and ');
  s = s.replace(/[\u2010-\u2015\-–—]/g, ' ');
  s = s.replace(/(\d)(g|mg|mcg|µg)\b/gi, '$1 $2');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/** HTML/display escaping for outward-facing claim tokens. Immutable observed_text is never mutated. */
export function escapeDisplayText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Preserve meaning; light sentence-case where whole string is uppercase; then escape for display. */
export function toDisplaySafeClaimText(observed: string): string {
  const trimmed = observed.trim();
  if (!trimmed) return '';
  let display = trimmed;
  if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    display = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }
  return escapeDisplayText(display);
}

export function naturalLanguageList(items: string[]): string {
  const unique = dedupeCaseInsensitive(items);
  if (unique.length === 0) return '';
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  if (unique.length === 3) return `${unique[0]}, ${unique[1]} and ${unique[2]}`;
  const shown = unique.slice(0, 3);
  const remaining = unique.length - 3;
  const otherLabel =
    remaining === 1 ? '1 other packet statement' : `${remaining} other packet statements`;
  return `${shown[0]}, ${shown[1]}, ${shown[2]} and ${otherLabel}`;
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
