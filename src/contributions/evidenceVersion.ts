import type { ContributionDomain } from '../config/contributionPolicy';

export function normalizeClaimKey(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^en:/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Canonicalise variantKey once at the governed submission boundary.
 * Whitespace-equivalent keys must allocate the same identity/version history.
 * No fuzzy matching, alias resolution, or product inference.
 */
export function canonicalizeVariantKey(
  value: string | null | undefined
): string | undefined {
  const trimmed = String(value ?? '').trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function buildEvidenceId(params: {
  barcode: string;
  domain: Extract<ContributionDomain, 'origins' | 'certifications'>;
  claimKey: string;
  evidenceVersion: number;
  /** When present, participates in durable identity so variants cannot collide with base. */
  variantKey?: string;
}): string {
  const barcode = String(params.barcode || '').trim();
  const claim = normalizeClaimKey(params.claimKey);
  const variantCanon = canonicalizeVariantKey(params.variantKey);
  const variant = variantCanon ? `|var:${variantCanon}` : '';
  return `${barcode}|${params.domain}|${claim}${variant}|v${params.evidenceVersion}`;
}
