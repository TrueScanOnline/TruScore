import { buildEvidenceId, normalizeClaimKey } from './evidenceVersion';
import {
  confirmAndPromoteIfEligible,
  confirmEvidence,
  createPendingEvidence,
  disputeEvidence,
  markCanonicalPromoted,
} from './lifecycle';
import {
  persistEvidenceRemote,
  upsertLocalEvidence,
  getLocalEvidenceForBarcode,
  getLocalEvidenceById,
} from './evidenceStore';
import { getContributorId } from './contributorIdentity';
import { resolveCertificationLane } from './certificationLane';
import {
  buildExactWordingFromStructured,
  type OriginStructuredEvidence,
} from './originStructured';
import type { ContributionEvidence } from './types';
import type { ContributionDisputeReason, ContributionDomain } from '../config/contributionPolicy';

export async function submitGovernedEvidence(params: {
  barcode: string;
  domain: Extract<ContributionDomain, 'origins' | 'certifications'>;
  claimValue: string;
  labelsTags?: string[];
  imageUrl?: string;
  exactWording?: string;
  originStructured?: OriginStructuredEvidence;
}): Promise<ContributionEvidence> {
  const submitterId = await getContributorId();
  const structured = params.originStructured;
  const claimValue =
    params.domain === 'origins' && structured?.primaryCountry
      ? structured.primaryCountry
      : params.claimValue;
  const claimKey = normalizeClaimKey(
    params.domain === 'origins' && structured
      ? `${structured.claimType}:${structured.primaryCountry}`
      : claimValue
  );
  const exactWording =
    params.exactWording ||
    (structured ? buildExactWordingFromStructured(structured) : params.claimValue.trim());

  const existing = await getLocalEvidenceForBarcode(params.barcode);
  const sameClaim = existing.filter(
    (e) => e.domain === params.domain && normalizeClaimKey(e.claimKey) === claimKey
  );
  const evidenceVersion = sameClaim.length === 0 ? 1 : Math.max(...sameClaim.map((e) => e.evidenceVersion));

  const certificationLane =
    params.domain === 'certifications'
      ? resolveCertificationLane({ labelsTags: params.labelsTags, claimValue })
      : undefined;

  const evidence = createPendingEvidence({
    evidenceId: buildEvidenceId({
      barcode: params.barcode,
      domain: params.domain,
      claimKey,
      evidenceVersion,
    }),
    barcode: params.barcode,
    domain: params.domain,
    evidenceVersion,
    claimKey,
    claimValue: claimValue.trim(),
    labelsTags: params.labelsTags,
    certificationLane,
    originStructured: structured,
    submitterId,
    createdAt: Date.now(),
    imageUrl: params.imageUrl,
    exactWording,
  });

  await upsertLocalEvidence(evidence);
  await persistEvidenceRemote(evidence).catch(() => false);
  return evidence;
}

async function persistUpdatedEvidence(evidence: ContributionEvidence): Promise<void> {
  await upsertLocalEvidence(evidence);
  await persistEvidenceRemote(evidence).catch(() => false);
}

export async function confirmGovernedEvidence(
  evidenceId: string,
  contributorId?: string
): Promise<{ ok: boolean; evidence: ContributionEvidence | null; reason?: string }> {
  const existing = await getLocalEvidenceById(evidenceId);
  if (!existing) return { ok: false, evidence: null, reason: 'not_found' };
  const id = contributorId || (await getContributorId());
  const result = confirmAndPromoteIfEligible(existing, id);
  if (result.ok) await persistUpdatedEvidence(result.evidence);
  return result;
}

export async function disputeGovernedEvidence(
  evidenceId: string,
  reason: ContributionDisputeReason,
  contributorId?: string,
  note?: string
): Promise<{ ok: boolean; evidence: ContributionEvidence | null; reason?: string }> {
  const existing = await getLocalEvidenceById(evidenceId);
  if (!existing) return { ok: false, evidence: null, reason: 'not_found' };
  const id = contributorId || (await getContributorId());
  const result = disputeEvidence(existing, id, reason, Date.now(), note);
  if (result.ok) await persistUpdatedEvidence(result.evidence);
  return result;
}

export { confirmEvidence, disputeEvidence, markCanonicalPromoted, confirmAndPromoteIfEligible };
