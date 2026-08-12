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
}): string {
  const barcode = String(params.barcode || '').trim();
  const claim = normalizeClaimKey(params.claimKey);
  return `${barcode}|${params.domain}|${claim}|v${params.evidenceVersion}`;
}
