/**
 * Client I/O for Community Agreements. No optimistic count increments.
 */

import { getBackendUrl } from '../config/backendConfig';
import { contributorCredential } from '../evidenceAuthority/device';
import type { SharedEvidenceSnapshot } from '../evidenceAuthority/types';
import type { Product } from '../types/product';
import { presentationMatchesAgreementTargets } from './presentation';
import { buildAgreementRevision } from './revision';
import { selectAgreementTargets } from './targets';
import {
  COMMUNITY_AGREEMENT_EMPTY_VARIANT,
  type CommunityAgreementGetResponse,
  type CommunityAgreementGroup,
  type CommunityAgreementPostResponse,
} from './types';

function agreementUrl(): string {
  return `${getBackendUrl().replace(/\/$/, '')}/api/community-agreement`;
}

export type LocalAgreementEligibility = {
  eligible: boolean;
  revisionId: string;
  reason?:
    | 'no_targets'
    | 'presentation_mismatch'
    | 'no_snapshot'
    | 'barcode_mismatch'
    | 'env_mismatch';
};

/**
 * Client recomputes the same target set as the server and requires presentation coverage.
 */
export function localAgreementEligibility(
  group: CommunityAgreementGroup,
  product: Product | null | undefined,
  snapshot: SharedEvidenceSnapshot | null | undefined
): LocalAgreementEligibility {
  if (!product?.barcode || !snapshot) {
    return { eligible: false, revisionId: '', reason: 'no_snapshot' };
  }
  if (snapshot.barcode !== product.barcode) {
    return { eligible: false, revisionId: '', reason: 'barcode_mismatch' };
  }
  const pairs = selectAgreementTargets(group, snapshot);
  if (pairs.length === 0) {
    return { eligible: false, revisionId: '', reason: 'no_targets' };
  }
  if (!presentationMatchesAgreementTargets(group, product, snapshot, pairs)) {
    return { eligible: false, revisionId: '', reason: 'presentation_mismatch' };
  }
  const revision = buildAgreementRevision({
    authorityEnv: snapshot.authorityEnv,
    barcode: product.barcode,
    variantKey: COMMUNITY_AGREEMENT_EMPTY_VARIANT,
    cardGroup: group,
    pairs,
  });
  return { eligible: true, revisionId: revision.revisionId };
}

export function agreementControlsVisible(
  local: LocalAgreementEligibility,
  remote: CommunityAgreementGetResponse | null
): boolean {
  if (!local.eligible || !remote?.eligible) return false;
  if (!remote.revisionId || remote.revisionId !== local.revisionId) return false;
  return true;
}

export async function fetchCommunityAgreement(input: {
  barcode: string;
  cardGroup: CommunityAgreementGroup;
  withCredential?: boolean;
  signal?: AbortSignal;
}): Promise<CommunityAgreementGetResponse | null> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (input.withCredential) {
    try {
      const token = await contributorCredential(null);
      headers.Authorization = `Bearer ${token}`;
    } catch {
      // Unauthenticated GET still returns count.
    }
  }
  const url = new URL(agreementUrl());
  url.searchParams.set('barcode', input.barcode);
  url.searchParams.set('cardGroup', input.cardGroup);
  url.searchParams.set('variantKey', COMMUNITY_AGREEMENT_EMPTY_VARIANT);
  try {
    const response = await fetch(url.toString(), { method: 'GET', headers, signal: input.signal });
    if (!response.ok) return null;
    return (await response.json()) as CommunityAgreementGetResponse;
  } catch {
    return null;
  }
}

export type AgreeOutcome =
  | { ok: true; body: CommunityAgreementPostResponse }
  | { ok: false; reason: string; status?: number };

export async function submitCommunityAgreement(input: {
  barcode: string;
  cardGroup: CommunityAgreementGroup;
  expectedRevisionId: string;
  signal?: AbortSignal;
}): Promise<AgreeOutcome> {
  let token: string;
  try {
    token = await contributorCredential(null);
  } catch {
    return { ok: false, reason: 'offline_or_credential' };
  }
  try {
    const response = await fetch(agreementUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        barcode: input.barcode,
        cardGroup: input.cardGroup,
        variantKey: COMMUNITY_AGREEMENT_EMPTY_VARIANT,
        expectedRevisionId: input.expectedRevisionId,
      }),
      signal: input.signal,
    });
    if (response.status === 409) {
      return { ok: false, reason: 'stale_revision', status: 409 };
    }
    if (response.status === 403) {
      return { ok: false, reason: 'self_agreement_not_allowed', status: 403 };
    }
    if (response.status === 429) {
      return { ok: false, reason: 'rate_limited', status: 429 };
    }
    if (!response.ok) {
      return { ok: false, reason: 'request_failed', status: response.status };
    }
    const body = (await response.json()) as CommunityAgreementPostResponse;
    return { ok: true, body };
  } catch {
    return { ok: false, reason: 'offline_or_network' };
  }
}
