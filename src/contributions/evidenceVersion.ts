import type { ContributionDomain } from '../config/contributionPolicy';

export function normalizeClaimKey(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^en:/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');
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
  const variant = params.variantKey
    ? `|var:${String(params.variantKey).trim()}`
    : '';
  return `${barcode}|${params.domain}|${claim}${variant}|v${params.evidenceVersion}`;
}
