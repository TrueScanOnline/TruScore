/**
 * Result contribution actions from existing publication lanes.
 * Consumers never see these predicates. Assessment truth is the only invitation source.
 */

import type { Product } from '../types/product';

export type ContributionEntryContext =
  | 'ingredients'
  | 'nutrition'
  | 'origins'
  | 'packetClaims'
  | 'certifications';

export const CONTRIBUTION_NOTICE_ADDED = 'Thanks - your contribution has been added.';
export const CONTRIBUTION_NOTICE_SAVED =
  'We couldn’t submit this yet. Your contribution has been saved on this device so you can try again.';
export const PACKET_INFORMATION_ADD = 'Add packet claims or certifications';
export const PACKET_INFORMATION_UPDATE = 'Update packet claims or certifications';
export const PACKET_ABSENCE_CONSUMER_COPY =
  'I checked the pack and couldn’t find a relevant claim or certification.';
/** Admitted absence as product state. The first-person sentence stays on the contribution form. */
export const PACKET_ABSENCE_PRODUCT_STATE = 'No relevant claim or certification was found on the pack.';
export const CONTRIBUTION_NOTICE_PARTIAL = 'Only part of your contribution was added.';

export type OriginsContributionAction = 'add' | 'complete' | 'update';
export type AssessedContributionAction = 'add' | 'update';

export type ResultContributionActions = {
  addNutrition: boolean;
  addIngredients: boolean;
  updateNutrition: boolean;
  updateIngredients: boolean;
  originsAction: OriginsContributionAction | null;
  packetClaimsAction: AssessedContributionAction | null;
  certificationsAction: AssessedContributionAction;
  /** One consumer entry for packet claims and certifications. */
  packetInformationAction: AssessedContributionAction | null;
};

export function resultContributionActions(product: Product): ResultContributionActions {
  const publication = product._publication;
  const certifications = Array.isArray(product.certifications) ? product.certifications : [];
  const governedCertifications = product.rveelGovernedCertifications || [];
  const hasCertifications = certifications.length > 0 || governedCertifications.length > 0;
  const certificationsAction: AssessedContributionAction = hasCertifications ? 'update' : 'add';

  if (!publication || publication.settled !== true) {
    return {
      addNutrition: false,
      addIngredients: false,
      updateNutrition: false,
      updateIngredients: false,
      originsAction: null,
      packetClaimsAction: null,
      certificationsAction,
      packetInformationAction: null,
    };
  }

  const nutritionResolved = publication.body.assessmentLanes.nutrition === 'resolved';
  const ingredientResolved =
    publication.transparency.assessmentLanes.ingredient_clarity === 'resolved';
  const origins = publication.transparency.assessmentLanes.origins;
  const transparencyRated = publication.transparency.publicationStatus === 'rated';
  const packetAssessed = publication.claims.assessmentLanes.packet === 'assessed';

  let originsAction: OriginsContributionAction;
  if (origins === 'resolved') {
    originsAction = 'update';
  } else if (ingredientResolved && transparencyRated) {
    originsAction = 'complete';
  } else {
    originsAction = 'add';
  }

  return {
    addNutrition: !nutritionResolved,
    addIngredients: !ingredientResolved,
    updateNutrition: nutritionResolved,
    updateIngredients: ingredientResolved,
    originsAction,
    packetClaimsAction: packetAssessed ? 'update' : 'add',
    certificationsAction,
    packetInformationAction: packetAssessed ? 'update' : 'add',
  };
}
