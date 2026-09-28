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
};

export function resultContributionActions(product: Product): ResultContributionActions {
  const publication = product._publication;
  const certifications = Array.isArray(product.certifications) ? product.certifications : [];
  const certificationsAction: AssessedContributionAction =
    certifications.length > 0 ? 'update' : 'add';

  if (!publication || publication.settled !== true) {
    return {
      addNutrition: false,
      addIngredients: false,
      updateNutrition: false,
      updateIngredients: false,
      originsAction: null,
      packetClaimsAction: null,
      certificationsAction,
    };
  }

  const nutritionResolved = publication.body.assessmentLanes.nutrition === 'resolved';
  const processingResolved = publication.body.assessmentLanes.processing === 'resolved';
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
    addIngredients: !processingResolved || !ingredientResolved,
    updateNutrition: nutritionResolved,
    updateIngredients: processingResolved && ingredientResolved,
    originsAction,
    packetClaimsAction: packetAssessed ? 'update' : 'add',
    certificationsAction,
  };
}
