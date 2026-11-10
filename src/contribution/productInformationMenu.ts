/**
 * Presentation menu for the Product information card.
 * Assessment rows come from the existing lane and S26 opportunity checks.
 * Voluntary rows come from voluntaryContributionOffer.
 * This module does not score, publish, or admit.
 */

import type { ContributionOpportunity } from '../lib/rateability/types';
import type { Product } from '../types/product';
import {
  ADD_PACKET_INFORMATION,
  ADD_PRODUCT_ORIGINS,
  CHANGE_INGREDIENTS,
  CHANGE_NUTRITION,
  CHANGE_PACKET_INFORMATION,
  CHANGE_PRODUCT_ORIGINS,
} from './consumerSurface';
import {
  bodyDataLimitationActions,
  transparencyShowsSeparateAddIngredients,
} from './governedDisplayProjection';
import {
  admittedPacketContributionRepresented,
  resultContributionActions,
} from './resultContributionActions';
import { voluntaryContributionOffer, type VoluntaryContributionDestination } from './voluntaryContributionOffer';

export const PRODUCT_INFORMATION_HEADING = 'Information missing?';
export const PRODUCT_INFORMATION_SUPPORT =
  'If you think any of the information about this product displayed is incorrect or missing then please help us out and make any necessary additions.';
export const ADD_OR_CORRECT_INFORMATION = 'Add or correct information';
export const ABOUT_THIS_INFORMATION = 'Data limitations >';
export const PRODUCT_INFORMATION_MENU_INSTRUCTION = 'Choose the information you would like to update.';

export const CATEGORY_NUTRITION = 'Nutrition information';
export const CATEGORY_INGREDIENTS = 'Ingredients';
export const CATEGORY_ORIGINS = 'Product origins';
export const CATEGORY_PACKET = 'Claims & certifications';

const ADD_NUTRITION = 'Add nutrition';
const ADD_INGREDIENTS = 'Add ingredients';

export type ProductInformationCategory = 'nutrition' | 'ingredients' | 'origins' | 'packet';

export type ProductInformationAction = {
  key: string;
  category: ProductInformationCategory;
  categoryLabel: string;
  label: string;
  destination: VoluntaryContributionDestination;
  journey: 'add' | 'change';
  /** Voluntary corrections open the existing form directly. Assessment Add keeps its current entry. */
  formFirst: boolean;
};

const CATEGORY_ORDER: ProductInformationCategory[] = ['nutrition', 'ingredients', 'origins', 'packet'];

const CATEGORY_LABEL: Record<ProductInformationCategory, string> = {
  nutrition: CATEGORY_NUTRITION,
  ingredients: CATEGORY_INGREDIENTS,
  origins: CATEGORY_ORIGINS,
  packet: CATEGORY_PACKET,
};

function terminal(status: string | undefined): boolean {
  return status === 'rated' || status === 'nr';
}

function live(opportunity: ContributionOpportunity | undefined, routeKey?: string): boolean {
  if (opportunity?.material !== true || opportunity.routeStatus !== 'live') return false;
  if (routeKey && opportunity.routeKey !== routeKey) return false;
  return true;
}

function categoryFor(destination: VoluntaryContributionDestination): ProductInformationCategory {
  if (destination === 'nutrition') return 'nutrition';
  if (destination === 'ingredients') return 'ingredients';
  if (destination === 'origins') return 'origins';
  return 'packet';
}

export function productInformationMenu(
  product: Product | null | undefined,
  options?: { publicationSettled?: boolean }
): ProductInformationAction[] {
  // Same fail-closed gate as voluntaryContributionOffer. One Checking or missing pillar supplies nothing.
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
  const bodyOk = terminal(publication.body.publicationStatus);
  const claimsOk = terminal(publication.claims.publicationStatus);
  const transparencyOk = terminal(publication.transparency.publicationStatus);
  const byKey = new Map<string, ProductInformationAction>();

  if (bodyOk && actions.addNutrition && live(publication.body.s26?.contributionOpportunity)) {
    byKey.set('add-nutrition', {
      key: 'add-nutrition',
      category: 'nutrition',
      categoryLabel: CATEGORY_NUTRITION,
      label: ADD_NUTRITION,
      destination: 'nutrition',
      journey: 'add',
      formFirst: false,
    });
  }

  const ingredientsFromTransparency =
    transparencyOk &&
    actions.addIngredients &&
    (live(publication.transparency.s26?.contributionOpportunity, 'ingredients_nutrition') ||
      (live(publication.transparency.s26?.contributionOpportunity, 'origins') &&
        transparencyShowsSeparateAddIngredients(product as Product)));
  const ingredientsFromBody =
    bodyOk &&
    transparencyOk &&
    live(publication.body.s26?.contributionOpportunity) &&
    bodyDataLimitationActions(product as Product).some((action) => action.destination === 'ingredients');
  if (ingredientsFromTransparency || ingredientsFromBody) {
    byKey.set('add-ingredients', {
      key: 'add-ingredients',
      category: 'ingredients',
      categoryLabel: CATEGORY_INGREDIENTS,
      label: ADD_INGREDIENTS,
      destination: 'ingredients',
      journey: 'add',
      formFirst: false,
    });
  }

  if (
    transparencyOk &&
    (actions.originsAction === 'add' || actions.originsAction === 'complete') &&
    live(publication.transparency.s26?.contributionOpportunity, 'origins')
  ) {
    byKey.set('add-origins', {
      key: 'add-origins',
      category: 'origins',
      categoryLabel: CATEGORY_ORIGINS,
      label: ADD_PRODUCT_ORIGINS,
      destination: 'origins',
      journey: 'add',
      formFirst: false,
    });
  }

  if (
    claimsOk &&
    actions.packetInformationAction === 'add' &&
    live(publication.claims.s26?.contributionOpportunity, 'packet_claims') &&
    !admittedPacketContributionRepresented(product as Product)
  ) {
    byKey.set('add-packet', {
      key: 'add-packet',
      category: 'packet',
      categoryLabel: CATEGORY_PACKET,
      label: ADD_PACKET_INFORMATION,
      destination: 'packetClaims',
      journey: 'add',
      formFirst: false,
    });
  }

  for (const voluntary of voluntaryContributionOffer(product, options)) {
    const category = categoryFor(voluntary.destination);
    byKey.set(voluntary.key, {
      key: voluntary.key,
      category,
      categoryLabel: CATEGORY_LABEL[category],
      label: voluntary.label,
      destination: voluntary.destination,
      journey: voluntary.journey,
      formFirst: true,
    });
  }

  return [...byKey.values()].sort((left, right) => {
    const categoryDelta = CATEGORY_ORDER.indexOf(left.category) - CATEGORY_ORDER.indexOf(right.category);
    if (categoryDelta !== 0) return categoryDelta;
    if (left.journey === right.journey) return 0;
    return left.journey === 'add' ? -1 : 1;
  });
}

export function productInformationMenuSections(
  actions: readonly ProductInformationAction[]
): Array<{ category: ProductInformationCategory; categoryLabel: string; actions: ProductInformationAction[] }> {
  return CATEGORY_ORDER.map((category) => ({
    category,
    categoryLabel: CATEGORY_LABEL[category],
    actions: actions.filter((action) => action.category === category),
  })).filter((section) => section.actions.length > 0);
}
