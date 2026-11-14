/**
 * Score Highlights look-through contribution links.
 * Reads settled publication lanes, resultContributionActions, and S26 opportunities.
 * A Highlight, a score, or Confidence cannot create a link.
 *
 * FM-02: pillar look-through offers assessment-driven Add / complete only.
 * Change / Edit remains on Result cards and the Product Information menu.
 *
 * FM-03: Claims may also offer the governed packet-absence entry (not a Change action).
 */

import {
  ADD_PACKET_INFORMATION,
  ADD_PRODUCT_ORIGINS,
} from '../../contribution/consumerSurface';
import {
  resultContributionActions,
  type ContributionEntryContext,
  type ResultContributionActions,
} from '../../contribution/resultContributionActions';
import { isGuidedContributionSubmitEnabled } from '../../config/mvpFeatureGates';
import type { ContributionOpportunity, CrossPillarPublicationSnapshot } from '../rateability/types';
import type { Product } from '../../types/product';
import type { ScoreHighlightPillar } from './types';

export const HIGHLIGHT_ADD_INFORMATION_HEADING = 'Add information from the pack';

/** Founder-requested Claims pillar absence entry label (exact wording). */
export const CLAIMS_PACKET_ABSENCE_PILLAR_LABEL = 'There are no claims on the packet';

const ADD_NUTRITION = 'Add nutrition';
const ADD_INGREDIENTS = 'Add ingredients';

export type HighlightContributionKind = 'add' | 'complete' | 'absence';

export type HighlightContributionEntryIntent = 'packet_absence';

export type HighlightContributionDestination = Exclude<ContributionEntryContext, 'certifications'>;

export type HighlightContributionLink = {
  key: string;
  label: string;
  destination: HighlightContributionDestination;
  /** Form journey. A complete origins action still opens the existing add journey. */
  journey: 'add';
  /** Keeps origins `complete` distinct from origins `add`. Change is never offered here. */
  kind: HighlightContributionKind;
  /** Dedicated entry into the guided journey (absence does not auto-admit). */
  entryIntent?: HighlightContributionEntryIntent;
};

export type HighlightContributionOffer = {
  links: HighlightContributionLink[];
  /** Null when there is nothing to add. Absence-only sets also keep the Add heading off. */
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

/**
 * Positive packet claims/certifications already on the governed projection contradict absence.
 * Does not invent qualification from unclassified OFF marketing text.
 */
export function claimsPacketAbsenceContradicted(product: Product): boolean {
  if ((product.rveelGovernedPacketClaims || []).length > 0) return true;
  if ((product.rveelGovernedCertifications || []).length > 0) return true;
  if ((product.certifications || []).length > 0) return true;
  return false;
}

/**
 * FM-03 eligibility for the Claims pillar "There are no claims on the packet" action.
 * Does not admit evidence. Opening the journey still requires explicit confirmation + photo.
 */
export function claimsPacketAbsencePillarEligible(
  product: Product,
  publication: CrossPillarPublicationSnapshot,
  actions: ResultContributionActions
): boolean {
  if (!isGuidedContributionSubmitEnabled()) return false;
  if (publication.settled !== true) return false;
  if (publication.overall?.publicationStatus === 'checking') return false;
  if (publication.claims?.publicationStatus === 'checking') return false;
  if (!publication.claims?.assessmentLanes) return false;
  if (publication.claims.assessmentLanes.packet === 'assessed') return false;
  if (!liveOpportunity(publication.claims.s26?.contributionOpportunity)) return false;
  if (actions.packetInformationAction !== 'add') return false;
  if (product.rveelPacketAbsenceEstablished === true) return false;
  if (claimsPacketAbsenceContradicted(product)) return false;
  return true;
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

  // Planet has no authorised live contribution destination for missing assessment.
  if (pillar === 'Planet') return EMPTY;

  if (pillar === 'Body') {
    const body = publication.body;
    const nutritionResolved = body.assessmentLanes.nutrition === 'resolved';
    // Body: Add nutrition only while the nutrition lane is unresolved with a live S26 opportunity.
    // Never offer Change nutrition, Change ingredients, or an invented Add ingredients here.
    if (
      !nutritionResolved &&
      liveOpportunity(body.s26?.contributionOpportunity) &&
      actions.addNutrition
    ) {
      return offer([
        {
          key: 'nutrition',
          label: ADD_NUTRITION,
          destination: 'nutrition',
          journey: 'add',
          kind: 'add',
        },
      ]);
    }
    return EMPTY;
  }

  if (pillar === 'Ethics') {
    const claims = publication.claims;
    const packetAssessed = claims.assessmentLanes.packet === 'assessed';
    const links: HighlightContributionLink[] = [];
    // Claims: Add packet information only while the packet lane is unassessed with a live opportunity.
    // Never offer Change packet information from the pillar look-through.
    if (
      !packetAssessed &&
      liveOpportunity(claims.s26?.contributionOpportunity) &&
      actions.packetInformationAction === 'add'
    ) {
      links.push({
        key: 'packet',
        label: ADD_PACKET_INFORMATION,
        destination: 'packetClaims',
        journey: 'add',
        kind: 'add',
      });
    }
    // FM-03: eligible-absence action (not a Change). May sit beside Add when packet is unresolved.
    if (claimsPacketAbsencePillarEligible(product as Product, publication, actions)) {
      links.push({
        key: 'packet-absence',
        label: CLAIMS_PACKET_ABSENCE_PILLAR_LABEL,
        destination: 'packetClaims',
        journey: 'add',
        kind: 'absence',
        entryIntent: 'packet_absence',
      });
    }
    return offer(links);
  }

  const transparency = publication.transparency;
  const ingredientUnresolved = transparency.assessmentLanes.ingredient_clarity !== 'resolved';
  const originsUnresolved = transparency.assessmentLanes.origins !== 'resolved';
  const transparencyLive = liveOpportunity(transparency.s26?.contributionOpportunity);
  const links: HighlightContributionLink[] = [];

  // Transparency: Add only for unresolved substantive lanes with a live opportunity.
  // May appear even when Transparency is Rated. Never offer Change from this modal.
  if (ingredientUnresolved && transparencyLive && actions.addIngredients) {
    links.push({
      key: 'ingredients',
      label: ADD_INGREDIENTS,
      destination: 'ingredients',
      journey: 'add',
      kind: 'add',
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
  }

  return offer(links);
}

/** Current link for a tap. A publication change since the button was shown returns null. */
export function highlightContributionTap(
  product: Product | null | undefined,
  pillar: ScoreHighlightPillar,
  destination: HighlightContributionDestination,
  options?: HighlightContributionOptions & { linkKey?: string }
): HighlightContributionLink | null {
  const links = highlightContributionOffer(product, pillar, options).links;
  if (options?.linkKey) {
    return links.find((link) => link.key === options.linkKey) ?? null;
  }
  return links.find((link) => link.destination === destination) ?? null;
}
