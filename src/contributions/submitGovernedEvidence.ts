import { buildEvidenceId, normalizeClaimKey } from './evidenceVersion';
import {
  admitEvidence,
  evidenceKeyOf,
  selectPrevailingAdmittedEvidence,
} from './admissionContract';
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
import {
  checkpointMaterialCompletion,
  markRecoveryRemoteSynced,
} from './contributionRecovery';
import { getContributorId } from './contributorIdentity';
import { resolveCertificationLane } from './certificationLane';
import {
  buildExactWordingFromStructured,
  type OriginStructuredEvidence,
} from './originStructured';
import { CURRENT_PRODUCTION_CONTRIBUTION_EPOCH } from './productionEpoch';
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
  variantKey?: string;
  /**
   * When true (default for production cutover paths), stamp current production epoch
   * and leave admissionStatus=submitted (not yet admitted).
   */
  asProductionEpoch?: boolean;
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
    (e) =>
      e.domain === params.domain &&
      normalizeClaimKey(e.claimKey) === claimKey &&
      (params.variantKey ? e.variantKey === params.variantKey : !e.variantKey)
  );

  // Correction creates a new version — never overwrite an existing evidenceId/version.
  const evidenceVersion =
    sameClaim.length === 0 ? 1 : Math.max(...sameClaim.map((e) => e.evidenceVersion)) + 1;

  const certificationLane =
    params.domain === 'certifications'
      ? resolveCertificationLane({ labelsTags: params.labelsTags, claimValue })
      : undefined;

  const asProduction = params.asProductionEpoch !== false;

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
    variantKey: params.variantKey,
    labelsTags: params.labelsTags,
    certificationLane,
    originStructured: structured,
    submitterId,
    createdAt: Date.now(),
    imageUrl: params.imageUrl,
    exactWording,
    ...(asProduction
      ? {
          productionEpoch: CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
          recordClass: 'production' as const,
          admissionStatus: 'submitted' as const,
          sourceProvenance: 'primary_user_submission',
          receiverEligibility: undefined,
        }
      : {
          productionEpoch: null,
          recordClass: 'historical' as const,
          admissionStatus: undefined,
        }),
  });

  await upsertLocalEvidence(evidence);

  const key = evidenceKeyOf(evidence);
  const checkpoint = asProduction ? await checkpointMaterialCompletion(evidence, key) : null;
  const remoteOk = await persistEvidenceRemote(evidence).catch(() => false);
  if (checkpoint && remoteOk) {
    await markRecoveryRemoteSynced(checkpoint.recoveryId);
  }

  return evidence;
}

/**
 * Explicit governed admission. Raw/submitted upload success is not admission.
 * Only current production-epoch submitted evidence may be admitted.
 */
export async function admitGovernedEvidence(
  evidenceId: string,
  params?: { admissionReason?: string; admittedBy?: string }
): Promise<{ ok: boolean; evidence: ContributionEvidence | null; reason?: string }> {
  const existing = await getLocalEvidenceById(evidenceId);
  if (!existing) return { ok: false, evidence: null, reason: 'not_found' };

  const result = admitEvidence(existing, {
    admissionReason: params?.admissionReason || 'primary_user_evidence_admission',
    admittedBy: params?.admittedBy,
  });
  if (!result.ok) {
    return { ok: false, evidence: result.evidence, reason: result.reason };
  }

  await upsertLocalEvidence(result.evidence);
  const key = evidenceKeyOf(result.evidence);
  const checkpoint = await checkpointMaterialCompletion(result.evidence, key);
  const remoteOk = await persistEvidenceRemote(result.evidence).catch(() => false);
  if (checkpoint && remoteOk) {
    await markRecoveryRemoteSynced(checkpoint.recoveryId);
  }
  return { ok: true, evidence: result.evidence };
}

/** Submit then admit under the production contract (controlled creation path). */
export async function submitAndAdmitGovernedEvidence(
  params: Parameters<typeof submitGovernedEvidence>[0]
): Promise<{ ok: boolean; evidence: ContributionEvidence; reason?: string }> {
  const submitted = await submitGovernedEvidence({ ...params, asProductionEpoch: true });
  const admitted = await admitGovernedEvidence(submitted.evidenceId);
  if (!admitted.ok || !admitted.evidence) {
    return {
      ok: false,
      evidence: submitted,
      reason: admitted.reason || 'admission_failed',
    };
  }
  return { ok: true, evidence: admitted.evidence };
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

export async function getPrevailingAdmittedEvidenceForKey(params: {
  barcode: string;
  domain: ContributionEvidence['domain'];
  claimKey: string;
  variantKey?: string;
}): Promise<ContributionEvidence | null> {
  const rows = await getLocalEvidenceForBarcode(params.barcode);
  return selectPrevailingAdmittedEvidence(rows, {
    barcode: params.barcode,
    domain: params.domain,
    claimKey: normalizeClaimKey(params.claimKey),
    variantKey: params.variantKey,
  });
}

export { confirmEvidence, disputeEvidence, markCanonicalPromoted, confirmAndPromoteIfEligible };
