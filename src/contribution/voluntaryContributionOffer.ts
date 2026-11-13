/**
 * Voluntary Result contribution menu.
 * Opens only journeys the settled card pencils already support.
 * A score, Confidence, or Highlight cannot create a row.
 */

import { isGuidedContributionSubmitEnabled } from '../config/mvpFeatureGates';
import type { Product } from '../types/product';
import { productOriginsCardPresentation } from '../origins/productOriginsCard';
import {
  ADD_PACKET_INFORMATION,
  ADD_PRODUCT_ORIGINS,
  CHANGE_INGREDIENTS,
  CHANGE_NUTRITION,
  CHANGE_PACKET_INFORMATION,
  CHANGE_PRODUCT_ORIGINS,
} from './consumerSurface';
import { resultContributionActions } from './resultContributionActions';

export const IMPROVE_PRODUCT_INFORMATION = 'Improve product information';

export const IMPROVE_PRODUCT_INFORMATION_SUBTITLE =
  'Have more details from the pack? Add information or correct what is shown. This may or may not change the score.';

export type VoluntaryContributionDestination = 'nutrition' | 'ingredients' | 'origins' | 'packetClaims';

export type VoluntaryContributionAction = {
  key:
    | 'change-nutrition'
    | 'change-ingredients'
    | 'add-origins'
    | 'change-origins'
    | 'add-packet'
    | 'change-packet';
  label: string;
  destination: VoluntaryContributionDestination;
  journey: 'add' | 'change';
};

/**
 * Settled Rated or NR, with the Result latch open.
 * Every pillar status must be Rated or NR.
 * Checking, a missing pillar, and a closed latch supply nothing.
 */
export function voluntaryContributionOffer(
  product: Product | null | undefined,
  options?: { publicationSettled?: boolean }
): VoluntaryContributionAction[] {
  // MVP: hide submit destinations when guided contribution is not entitled.
  if (!isGuidedContributionSubmitEnabled()) return [];
  if (options?.publicationSettled !== true) return [];
  const publication = product?._publication;
  if (!publication || publication.settled !== true) return [];
  const overall = publication.overall?.publicationStatus;
  if (overall !== 'rated' && overall !== 'nr') return [];
  const pillarStatuses = [
    publication.body?.publicationStatus,
    publication.planet?.publicationStatus,
    publication.claims?.publicationStatus,
    publication.transparency?.publicationStatus,
  ];
  if (!pillarStatuses.every((status) => status === 'rated' || status === 'nr')) return [];
  if (
    !publication.body?.assessmentLanes ||
    !publication.claims?.assessmentLanes ||
    !publication.transparency?.assessmentLanes
  ) {
    return [];
  }

  const actions = resultContributionActions(product as Product);
  const rows: VoluntaryContributionAction[] = [];

  if (actions.updateNutrition) {
    rows.push({
      key: 'change-nutrition',
      label: CHANGE_NUTRITION,
      destination: 'nutrition',
      journey: 'change',
    });
  }
  if (actions.updateIngredients) {
    rows.push({
      key: 'change-ingredients',
      label: CHANGE_INGREDIENTS,
      destination: 'ingredients',
      journey: 'change',
    });
  }

  const originsCard = productOriginsCardPresentation(product as Product);
  const originsPencil =
    actions.originsAction === 'update' ||
    originsCard.facts.length > 0 ||
    Boolean(originsCard.offCountry);
  if (originsPencil) {
    rows.push({
      key: 'add-origins',
      label: ADD_PRODUCT_ORIGINS,
      destination: 'origins',
      journey: 'add',
    });
    rows.push({
      key: 'change-origins',
      label: CHANGE_PRODUCT_ORIGINS,
      destination: 'origins',
      journey: 'change',
    });
  }

  const packetPencil =
    actions.packetInformationAction === 'update' ||
    (product?.rveelGovernedPacketClaims || []).length > 0 ||
    (product?.rveelGovernedCertifications || []).length > 0 ||
    (product?.certifications || []).length > 0;
  if (packetPencil) {
    rows.push({
      key: 'add-packet',
      label: ADD_PACKET_INFORMATION,
      destination: 'packetClaims',
      journey: 'add',
    });
    rows.push({
      key: 'change-packet',
      label: CHANGE_PACKET_INFORMATION,
      destination: 'packetClaims',
      journey: 'change',
    });
  }

  return rows;
}
