/**
 * S25 code / term normaliser for presentation and Open deep-link routing.
 * Does not change Open scoring or Body detection.
 */

/** Compact form used for alias lookup (lowercase, no spaces/hyphens). */
export function compactAdditiveToken(raw: string): string {
  return String(raw || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/-/g, '');
}

/**
 * Normalise a matched Open/ingredient coded term to a canonical S25 additive_id (e.g. e102).
 * Accepts E102, E 102, INS 102, en:e102, bare 102, etc.
 * Returns null when the token cannot be resolved to an e-number-shaped id.
 */
export function normalizeCodedTermToAdditiveId(rawTerm: string): string | null {
  const raw = String(rawTerm || '').trim();
  if (!raw) return null;

  // Prefer innermost bracketed code when present: "Colour (102)" / "E102 (Tartrazine)"
  const bracketed = raw.match(/[([{]([^)\]}]+)[)\]}]/);
  if (bracketed) {
    const inner = normalizeCodedTermToAdditiveId(bracketed[1]);
    if (inner) return inner;
  }

  const compact = compactAdditiveToken(raw);
  const enTag = compact.match(/^en:e(\d{3,4}[a-z]?)$/);
  if (enTag) return `e${enTag[1]}`;
  const eDirect = compact.match(/^e(\d{3,4}[a-z]?)$/);
  if (eDirect) return `e${eDirect[1]}`;
  const insDirect = compact.match(/^ins(\d{3,4}[a-z]?)$/);
  if (insDirect) return `e${insDirect[1]}`;
  const numOnly = compact.match(/^(\d{3,4}[a-z]?)$/);
  if (numOnly) return `e${numOnly[1]}`;
  return null;
}

/** Map Body fired ledger IDs to canonical S25 IDs (Body-6 set only). */
export function mapBodyLedgerIdToCanonical(ledgerId: string): string | null {
  const m: Record<string, string> = {
    'body-v12-additive-e102': 'e102',
    'body-v12-additive-e110': 'e110',
    'body-v12-additive-e129': 'e129',
    'body-v12-additive-e171': 'e171',
    'body-v12-additive-e250': 'e250',
    'body-v12-additive-e951': 'e951',
  };
  return m[ledgerId] ?? null;
}
