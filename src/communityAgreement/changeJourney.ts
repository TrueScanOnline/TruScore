/**
 * Thumbs-down navigation: reuse existing Change journeys only.
 */

import type { Product } from '../types/product';
import {
  voluntaryContributionOffer,
  type VoluntaryContributionDestination,
} from '../contribution/voluntaryContributionOffer';
import type { CommunityAgreementGroup } from './types';

export type AgreementChangeDestination = VoluntaryContributionDestination;

export function agreementGroupToChangeDestination(
  group: CommunityAgreementGroup
): AgreementChangeDestination {
  if (group === 'packet_information') return 'packetClaims';
  return group;
}

/**
 * True when voluntaryContributionOffer exposes Change for this group.
 * Also requires settled publication and Rated/NR overall + pillars (via that offer).
 */
export function eligibleAgreementChangeJourney(
  group: CommunityAgreementGroup,
  product: Product | null | undefined,
  options: { publicationSettled: boolean }
): { ok: true; destination: AgreementChangeDestination } | { ok: false } {
  if (options.publicationSettled !== true || !product) return { ok: false };
  const destination = agreementGroupToChangeDestination(group);
  const rows = voluntaryContributionOffer(product, { publicationSettled: true });
  const change = rows.find((row) => row.destination === destination && row.journey === 'change');
  if (!change) return { ok: false };
  return { ok: true, destination };
}
