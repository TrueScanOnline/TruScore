/**
 * Deterministic product_scope_guard = cocoa_chocolate.
 * After identity/target resolution, display only where existing product fields
 * contain positive cocoa/chocolate evidence. No taxonomy, AI, or brand allowlist.
 */

const POSITIVE_TERMS = ['chocolate', 'choc', 'cocoa', 'cacao'] as const;

export type CocoaChocolateProductScopeEvidence = {
  product_name?: string;
  generic_name?: string;
  categories?: string;
  categories_tags?: string[] | string;
  ingredients_text?: string;
};

export function normalizeProductScopeText(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) {
    return value.map((item) => normalizeProductScopeText(item)).filter(Boolean).join(' ');
  }
  return String(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

export function productHasPositiveCocoaChocolateEvidence(
  evidence: CocoaChocolateProductScopeEvidence | null | undefined
): boolean {
  if (!evidence) return false;
  const hay = [
    evidence.product_name,
    evidence.generic_name,
    evidence.categories,
    evidence.categories_tags,
    evidence.ingredients_text,
  ]
    .map((part) => normalizeProductScopeText(part))
    .filter(Boolean)
    .join(' ');
  if (!hay) return false;
  return POSITIVE_TERMS.some((term) => hay.includes(term));
}

/**
 * Empty guard → no additional restriction.
 * cocoa_chocolate → require positive product evidence.
 * Unknown guard value → fail closed.
 */
export function productScopeGuardAllowsDisplay(
  guardValue: string | undefined,
  evidence: CocoaChocolateProductScopeEvidence | null | undefined
): boolean {
  const guard = (guardValue ?? '').trim();
  if (!guard) return true;
  if (guard === 'cocoa_chocolate') {
    return productHasPositiveCocoaChocolateEvidence(evidence);
  }
  return false;
}
