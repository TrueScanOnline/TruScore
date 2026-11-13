/**
 * Score Highlights look-through contribution links.
 * Reads settled publication lanes, resultContributionActions, and S26 opportunities.
 * A Highlight, a score, or Confidence cannot create a link.
 */

import {
  ADD_PACKET_INFORMATION,
  ADD_PRODUCT_ORIGINS,
  CHANGE_INGREDIENTS,
  CHANGE_NUTRITION,
  CHANGE_PACKET_INFORMATION,
  CHANGE_PRODUCT_ORIGINS,
} from '../../contribution/consumerSurface';
import {
  resultContributionActions,
  type ContributionEntryContext,
} from '../../contribution/resultContributionActions';
import { isGuidedContributionSubmitEnabled } from '../../config/mvpFeatureGates';
import type { ContributionOpportunity, CrossPillarPublicationSnapshot } from '../rateability/types';
import type { Product } from '../../types/product';
import type { ScoreHighlightPillar } from './types';

export const HIGHLIGHT_ADD_INFORMATION_HEADING = 'Add information from the pack';

const ADD_NUTRITION = 'Add nutrition';
const ADD_INGREDIENTS = 'Add ingredients';

export type HighlightContributionKind = 'add' | 'change' | 'complete';

export type HighlightContributionDestination = Exclude<ContributionEntryContext, 'certifications'>;

export type HighlightContributionLink = {
  key: string;
  label: string;
  destination: HighlightContributionDestination;
  /** Form journey. A complete origins action still opens the existing add journey. */
  journey: 'add' | 'change';
  /** Keeps origins `complete` distinct from origins `add` and from Change. */
  kind: HighlightContributionKind;
};

export type HighlightContributionOffer = {
  links: HighlightContributionLink[];
  /** Null when there is nothing to add, including a Change-only set. */
  heading: string | null;
};

export type HighlightContributionOptions = {
  /**
   * Result publication latch. Links and taps require `true`.
   * An omitted latch is not permission.
   */
  publicationSettled?: boolean;
  /** Accepted and ignored. A Highlight must not create an invitation. */
  highlight?: unknown;
};

const EMPTY: HighlightContributionOffer = { links: [], heading: null };

function liveOpportunity(opportunity: ContributionOpportunity | undefined): boolean {
  return opportunity?.material === true && opportunity.routeStatus === 'live';
}

function selectedPillarStatus(
  publication: CrossPillarPublicationSnapshot,
  pillar: ScoreHighlightPillar
): string | undefined {
  if (pillar === 'Body') return publication.body?.publicationStatus;
  if (pillar === 'Planet') return publication.planet?.publicationStatus;
  if (pillar === 'Ethics') return publication.claims?.publicationStatus;
  return publication.transparency?.publicationStatus;
}

function offer(links: HighlightContributionLink[]): HighlightContributionOffer {
  if (links.length === 0) return EMPTY;
  const assessmentAdd = links.some((link) => link.kind === 'add' || link.kind === 'complete');
  return {
    links,
    heading: assessmentAdd ? HIGHLIGHT_ADD_INFORMATION_HEADING : null,
  };
}

export function highlightContributionOffer(
  product: Product | null | undefined,
  pillar: ScoreHighlightPillar,
  options?: HighlightContributionOptions
): HighlightContributionOffer {
  void options?.highlight;
  // MVP: do not offer submit destinations when guided contribution is off.
  if (!isGuidedContributionSubmitEnabled()) return EMPTY;
  if (options?.publicationSettled !== true) return EMPTY;
  const publication = product?._publication;
  if (!publication || publication.settled !== true) return EMPTY;
  if (publication.overall?.publicationStatus === 'checking') return EMPTY;
  if (selectedPillarStatus(publication, pillar) === 'checking') return EMPTY;
  if (
    !publication.body?.assessmentLanes ||
    !publication.claims?.assessmentLanes ||
    !publication.transparency?.assessmentLanes
  ) {
    return EMPTY;
  }

  const actions = resultContributionActions(product as Product);

  if (pillar === 'Planet') return EMPTY;

  if (pillar === 'Body') {
    const body = publication.body;
    const nutritionResolved = body.assessmentLanes.nutrition === 'resolved';
    const links: HighlightContributionLink[] = [];
    if (!nutritionResolved) {
      if (liveOpportunity(body.s26?.contributionOpportunity)) {
        links.push({
          key: 'nutrition',
          label: ADD_NUTRITION,
          destination: 'nutrition',
          journey: 'add',
          kind: 'add',
        });
      }
    } else if (actions.updateNutrition) {
      links.push({
        key: 'nutrition',
        label: CHANGE_NUTRITION,
        destination: 'nutrition',
        journey: 'change',
        kind: 'change',
      });
    }
    if (nutritionResolved && actions.updateIngredients) {
      links.push({
        key: 'ingredients',
        label: CHANGE_INGREDIENTS,
        destination: 'ingredients',
        journey: 'change',
        kind: 'change',
      });
    }
    return offer(links);
  }

  if (pillar === 'Ethics') {
    const claims = publication.claims;
    const packetAssessed = claims.assessmentLanes.packet === 'assessed';
    if (packetAssessed && actions.packetInformationAction === 'update') {
      return offer([
        {
          key: 'packet',
          label: CHANGE_PACKET_INFORMATION,
          destination: 'packetClaims',
          journey: 'change',
          kind: 'change',
        },
      ]);
    }
    if (!packetAssessed && liveOpportunity(claims.s26?.contributionOpportunity) && actions.packetInformationAction === 'add') {
      return offer([
        {
          key: 'packet',
          label: ADD_PACKET_INFORMATION,
          destination: 'packetClaims',
          journey: 'add',
          kind: 'add',
        },
      ]);
    }
    return EMPTY;
  }

  const transparency = publication.transparency;
  const ingredientUnresolved = transparency.assessmentLanes.ingredient_clarity !== 'resolved';
  const originsUnresolved = transparency.assessmentLanes.origins !== 'resolved';
  const transparencyLive = liveOpportunity(transparency.s26?.contributionOpportunity);
  const links: HighlightContributionLink[] = [];

  if (ingredientUnresolved && transparencyLive && actions.addIngredients) {
    links.push({
      key: 'ingredients',
      label: ADD_INGREDIENTS,
      destination: 'ingredients',
      journey: 'add',
      kind: 'add',
    });
  } else if (!ingredientUnresolved && actions.updateIngredients) {
    links.push({
      key: 'ingredients',
      label: CHANGE_INGREDIENTS,
      destination: 'ingredients',
      journey: 'change',
      kind: 'change',
    });
  }

  if (
    originsUnresolved &&
    transparencyLive &&
    (actions.originsAction === 'add' || actions.originsAction === 'complete')
  ) {
    links.push({
      key: 'origins',
      label: ADD_PRODUCT_ORIGINS,
      destination: 'origins',
      journey: 'add',
      kind: actions.originsAction,
    });
  } else if (!originsUnresolved && actions.originsAction === 'update') {
    links.push({
      key: 'origins',
      label: CHANGE_PRODUCT_ORIGINS,
      destination: 'origins',
      journey: 'change',
      kind: 'change',
    });
  }

  return offer(links);
}

/** Current link for a tap. A publication change since the button was shown returns null. */
export function highlightContributionTap(
  product: Product | null | undefined,
  pillar: ScoreHighlightPillar,
  destination: HighlightContributionDestination,
  options?: HighlightContributionOptions
): HighlightContributionLink | null {
  return (
    highlightContributionOffer(product, pillar, options).links.find((link) => link.destination === destination) ??
    null
  );
}
