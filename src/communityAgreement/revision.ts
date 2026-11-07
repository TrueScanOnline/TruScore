/**
 * Deterministic revision identity for WP-09 Community Agreements.
 * Server and client share this encoding. Client values never invent versionIds.
 */

import { sha256Hex } from '../packetContribution/sha256';
import type { AuthorityEnv } from '../evidenceAuthority/types';
import {
  COMMUNITY_AGREEMENT_EMPTY_VARIANT,
  COMMUNITY_AGREEMENT_REVISION_ENCODING,
  type AgreementRevision,
  type AgreementSubjectVersion,
  type CommunityAgreementGroup,
} from './types';

export function sortAgreementPairs(pairs: AgreementSubjectVersion[]): AgreementSubjectVersion[] {
  return [...pairs].sort((a, b) => {
    if (a.subjectKey < b.subjectKey) return -1;
    if (a.subjectKey > b.subjectKey) return 1;
    if (a.versionId < b.versionId) return -1;
    if (a.versionId > b.versionId) return 1;
    return 0;
  });
}

/**
 * Canonical payload:
 * v1\0{env}\0{barcode}\0{variantKey}\0{cardGroup}\0{subjectKey}\0{versionId}\0…
 */
export function encodeAgreementRevisionPayload(input: {
  authorityEnv: AuthorityEnv;
  barcode: string;
  variantKey: string;
  cardGroup: CommunityAgreementGroup;
  pairs: AgreementSubjectVersion[];
}): string {
  const pairs = sortAgreementPairs(input.pairs);
  const parts = [
    COMMUNITY_AGREEMENT_REVISION_ENCODING,
    input.authorityEnv,
    input.barcode,
    input.variantKey,
    input.cardGroup,
  ];
  for (const pair of pairs) {
    parts.push(pair.subjectKey, pair.versionId);
  }
  return parts.join('\0');
}

export function computeAgreementRevisionId(input: {
  authorityEnv: AuthorityEnv;
  barcode: string;
  variantKey: string;
  cardGroup: CommunityAgreementGroup;
  pairs: AgreementSubjectVersion[];
}): string {
  const payload = encodeAgreementRevisionPayload(input);
  return sha256Hex(new TextEncoder().encode(payload));
}

export function buildAgreementRevision(input: {
  authorityEnv: AuthorityEnv;
  barcode: string;
  variantKey?: string | null;
  cardGroup: CommunityAgreementGroup;
  pairs: AgreementSubjectVersion[];
}): AgreementRevision {
  const variantKey =
    input.variantKey == null || input.variantKey === COMMUNITY_AGREEMENT_EMPTY_VARIANT
      ? COMMUNITY_AGREEMENT_EMPTY_VARIANT
      : input.variantKey;
  const pairs = sortAgreementPairs(input.pairs);
  return {
    authorityEnv: input.authorityEnv,
    barcode: input.barcode,
    variantKey,
    cardGroup: input.cardGroup,
    pairs,
    revisionId: computeAgreementRevisionId({
      authorityEnv: input.authorityEnv,
      barcode: input.barcode,
      variantKey,
      cardGroup: input.cardGroup,
      pairs,
    }),
  };
}

/**
 * WP-09 does not invent variant separation. Non-empty client variant labels are rejected.
 * When EA later distinguishes variants authoritatively, this gate can be revisited.
 */
export function resolveAgreementVariantKey(clientVariant: unknown): {
  ok: true;
  variantKey: typeof COMMUNITY_AGREEMENT_EMPTY_VARIANT;
} | { ok: false; reason: 'unsupported_variant' } {
  if (clientVariant == null || clientVariant === COMMUNITY_AGREEMENT_EMPTY_VARIANT) {
    return { ok: true, variantKey: COMMUNITY_AGREEMENT_EMPTY_VARIANT };
  }
  if (typeof clientVariant === 'string' && clientVariant.trim() === '') {
    return { ok: true, variantKey: COMMUNITY_AGREEMENT_EMPTY_VARIANT };
  }
  return { ok: false, reason: 'unsupported_variant' };
}
