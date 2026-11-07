/** WP-09 Community Agreements — display-only sidecar types. Not scoring or EA governance. */

import type { AuthorityEnv } from '../evidenceAuthority/types';

export const COMMUNITY_AGREEMENT_GROUPS = [
  'nutrition',
  'ingredients',
  'origins',
  'packet_information',
] as const;

export type CommunityAgreementGroup = (typeof COMMUNITY_AGREEMENT_GROUPS)[number];

/** Canonical empty variant when Evidence Authority does not distinguish variants. */
export const COMMUNITY_AGREEMENT_EMPTY_VARIANT = '';

export const COMMUNITY_AGREEMENT_REVISION_ENCODING = 'v1';

export type AgreementSubjectVersion = {
  subjectKey: string;
  versionId: string;
};

export type AgreementRevision = {
  authorityEnv: AuthorityEnv;
  barcode: string;
  variantKey: typeof COMMUNITY_AGREEMENT_EMPTY_VARIANT | string;
  cardGroup: CommunityAgreementGroup;
  pairs: AgreementSubjectVersion[];
  revisionId: string;
};

export type CommunityAgreementGetResponse = {
  authorityEnv: AuthorityEnv;
  barcode: string;
  variantKey: string;
  cardGroup: CommunityAgreementGroup;
  revisionId: string;
  count: number;
  hasAgreed?: boolean;
  eligible: boolean;
};

export type CommunityAgreementPostResponse = {
  authorityEnv: AuthorityEnv;
  barcode: string;
  variantKey: string;
  cardGroup: CommunityAgreementGroup;
  revisionId: string;
  count: number;
  hasAgreed: boolean;
};

export function isCommunityAgreementGroup(value: unknown): value is CommunityAgreementGroup {
  return (
    typeof value === 'string' &&
    (COMMUNITY_AGREEMENT_GROUPS as readonly string[]).includes(value)
  );
}
