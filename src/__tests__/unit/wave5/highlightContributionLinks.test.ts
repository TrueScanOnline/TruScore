/**
 * Score Highlights look-through invitations follow settled lanes and S26 opportunities.
 * A Highlight and a published number, including zero, do not create a link.
 */

import type { Product } from '../../../types/product';
import type { ContributionOpportunity } from '../../../lib/rateability/types';
import {
  HIGHLIGHT_ADD_INFORMATION_HEADING,
  highlightContributionOffer,
  highlightContributionTap,
} from '../../../lib/scoreHighlights/highlightContributionLinks';

const HIGHLIGHT = { byPillar: { Body: [{ storyKey: 'body-highlight' }] } };

function live(domain: string, routeKey: string): ContributionOpportunity {
  return { material: true, domain, routeStatus: 'live', routeKey };
}

function product(input: {
  settled?: boolean;
  omitPublication?: boolean;
  overallStatus?: 'checking' | 'nr' | 'rated';
  nutrition?: 'resolved' | 'unassessed';
  processing?: 'resolved' | 'unassessed';
  packet?: 'assessed' | 'unassessed_or_incomplete';
  ingredient?: 'resolved' | 'unassessed';
  origins?: 'resolved' | 'unassessed' | 'assessed_unresolved_conflict';
  bodyStatus?: 'checking' | 'nr' | 'rated';
  planetStatus?: 'checking' | 'nr' | 'rated';
  claimsStatus?: 'checking' | 'nr' | 'rated';
  transparencyStatus?: 'checking' | 'nr' | 'rated';
  publishedScore?: number | null;
  bodyOpportunity?: ContributionOpportunity | null;
  claimsOpportunity?: ContributionOpportunity | null;
  transparencyOpportunity?: ContributionOpportunity | null;
  planetOpportunity?: ContributionOpportunity | null;
} = {}): Product {
  if (input.omitPublication) return {} as Product;
  return {
    _publication: {
      settled: input.settled !== false,
      body: {
        publicationStatus: input.bodyStatus ?? 'rated',
        publishedScore: input.publishedScore === undefined ? 12 : input.publishedScore,
        assessmentLanes: {
          nutrition: input.nutrition ?? 'resolved',
          processing: input.processing ?? 'resolved',
        },
        s26: { contributionOpportunity: input.bodyOpportunity ?? undefined },
      },
      planet: {
        publicationStatus: input.planetStatus ?? 'rated',
        publishedScore: input.publishedScore === undefined ? 12 : input.publishedScore,
        assessmentLanes: { broad_environment: 'resolved', packaging_fallback: 'resolved' },
        s26: { contributionOpportunity: input.planetOpportunity ?? undefined },
      },
      claims: {
        publicationStatus: input.claimsStatus ?? 'rated',
        publishedScore: input.publishedScore === undefined ? 12 : input.publishedScore,
        assessmentLanes: {
          packet: input.packet ?? 'assessed',
          benchmark: 'assessed',
        },
        s26: { contributionOpportunity: input.claimsOpportunity ?? undefined },
      },
      transparency: {
        publicationStatus: input.transparencyStatus ?? 'rated',
        publishedScore: input.publishedScore === undefined ? 12 : input.publishedScore,
        assessmentLanes: {
          ingredient_clarity: input.ingredient ?? 'resolved',
          origins: input.origins ?? 'resolved',
        },
        s26: { contributionOpportunity: input.transparencyOpportunity ?? undefined },
      },
      overall: {
        publicationStatus: input.overallStatus ?? 'rated',
        publishedScore: input.publishedScore === undefined ? 48 : input.publishedScore,
      },
    },
  } as Product;
}

const settled = { publicationSettled: true as const, highlight: HIGHLIGHT };

describe('Score Highlights contribution invitations', () => {
  it('offers nothing while publication is unsettled, even when a Highlight exists', () => {
    const checking = product({
      settled: false,
      overallStatus: 'checking',
      nutrition: 'unassessed',
      bodyOpportunity: live('ingredients_nutrition', 'ingredients_nutrition'),
    });
    expect(highlightContributionOffer(checking, 'Body', { publicationSettled: false, highlight: HIGHLIGHT })).toEqual({
      links: [],
      heading: null,
    });
    expect(
      highlightContributionOffer(checking, 'Body', { publicationSettled: true, highlight: HIGHLIGHT }).links
    ).toEqual([]);
  });

  it('offers nothing for Checking overall, missing publication, or a missing product', () => {
    expect(
      highlightContributionOffer(product({ overallStatus: 'checking', settled: true }), 'Ethics', settled).links
    ).toEqual([]);
    expect(highlightContributionOffer(product({ omitPublication: true }), 'Open', settled).links).toEqual([]);
    expect(highlightContributionOffer(null, 'Body', settled).links).toEqual([]);
  });

  it('does not invite ingredients from Planet when Planet is Rated or NR', () => {
    const rated = highlightContributionOffer(
      product({
        planetStatus: 'rated',
        ingredient: 'unassessed',
        planetOpportunity: live('ingredients_nutrition', 'ingredients_nutrition'),
      }),
      'Planet',
      settled
    );
    const nr = highlightContributionOffer(
      product({ planetStatus: 'nr', overallStatus: 'nr', ingredient: 'unassessed' }),
      'Planet',
      settled
    );
    expect(rated).toEqual({ links: [], heading: null });
    expect(nr).toEqual({ links: [], heading: null });
    expect(JSON.stringify(rated) + JSON.stringify(nr)).not.toMatch(/ingredient|packaging|can still be added/i);
  });

  it('offers Add nutrition only for an unresolved nutrition lane with a live Body opportunity', () => {
    const offer = highlightContributionOffer(
      product({
        nutrition: 'unassessed',
        processing: 'unassessed',
        ingredient: 'unassessed',
        bodyStatus: 'nr',
        bodyOpportunity: live('ingredients_nutrition', 'ingredients_nutrition'),
      }),
      'Body',
      settled
    );
    expect(offer.links.map((link) => link.label)).toEqual(['Add nutrition']);
    expect(offer.heading).toBe(HIGHLIGHT_ADD_INFORMATION_HEADING);
  });

  it('does not invent Add ingredients when nutrition is resolved and processing is not', () => {
    const offer = highlightContributionOffer(
      product({
        nutrition: 'resolved',
        processing: 'unassessed',
        ingredient: 'unassessed',
        bodyOpportunity: live('ingredients_nutrition', 'ingredients_nutrition'),
      }),
      'Body',
      settled
    );
    expect(offer.links.map((link) => ({ label: link.label, kind: link.kind }))).toEqual([
      { label: 'Change nutrition', kind: 'change' },
    ]);
    expect(offer.heading).toBeNull();
  });

  it('offers Add packet information only while the Claims opportunity is live, and Change once assessed', () => {
    const unassessed = highlightContributionOffer(
      product({
        packet: 'unassessed_or_incomplete',
        claimsStatus: 'nr',
        claimsOpportunity: live('packet_claims', 'packet_claims'),
      }),
      'Ethics',
      settled
    );
    const silent = highlightContributionOffer(
      product({
        packet: 'unassessed_or_incomplete',
        claimsOpportunity: { material: true, domain: 'packet_claims', routeStatus: 'none' },
      }),
      'Ethics',
      settled
    );
    const assessed = highlightContributionOffer(product({ packet: 'assessed' }), 'Ethics', settled);
    expect(unassessed.links.map((link) => link.label)).toEqual(['Add packet information']);
    expect(silent.links).toEqual([]);
    expect(assessed.links.map((link) => ({ label: link.label, kind: link.kind }))).toEqual([
      { label: 'Change packet information', kind: 'change' },
    ]);
    expect(assessed.heading).toBeNull();
  });

  it('keeps both Transparency lane actions when S26 names origins, and each lane on its own', () => {
    const both = highlightContributionOffer(
      product({
        ingredient: 'unassessed',
        origins: 'unassessed',
        transparencyStatus: 'nr',
        overallStatus: 'nr',
        transparencyOpportunity: live('origins', 'origins'),
      }),
      'Open',
      settled
    );
    expect(both.links.map((link) => ({ label: link.label, kind: link.kind }))).toEqual([
      { label: 'Add ingredients', kind: 'add' },
      { label: 'Add product origins', kind: 'add' },
    ]);

    const ingredientsOnly = highlightContributionOffer(
      product({
        ingredient: 'unassessed',
        origins: 'resolved',
        transparencyOpportunity: live('ingredients_nutrition', 'ingredients_nutrition'),
      }),
      'Open',
      settled
    );
    expect(ingredientsOnly.links.map((link) => link.label)).toEqual([
      'Add ingredients',
      'Change product origins',
    ]);

    const originsOnly = highlightContributionOffer(
      product({
        ingredient: 'resolved',
        origins: 'unassessed',
        transparencyStatus: 'rated',
        transparencyOpportunity: live('origins', 'origins'),
      }),
      'Open',
      settled
    );
    expect(originsOnly.links.map((link) => ({ label: link.label, kind: link.kind, journey: link.journey }))).toEqual([
      { label: 'Change ingredients', kind: 'change', journey: 'change' },
      { label: 'Add product origins', kind: 'complete', journey: 'add' },
    ]);
  });

  it('keeps voluntary Change and drops assessment-driven Add when every lane is resolved', () => {
    const body = highlightContributionOffer(product(), 'Body', settled);
    const transparency = highlightContributionOffer(product(), 'Open', settled);
    expect(body.links.map((link) => link.label)).toEqual(['Change nutrition', 'Change ingredients']);
    expect(body.heading).toBeNull();
    expect(transparency.links.map((link) => link.label)).toEqual([
      'Change ingredients',
      'Change product origins',
    ]);
    expect(transparency.heading).toBeNull();
    expect(JSON.stringify(body)).not.toContain('Add information from the pack');
    expect(JSON.stringify(transparency)).not.toContain('Add ');
  });

  it('drops a shown action when publication is missing or the latch closes before the tap', () => {
    const shown = product({
      nutrition: 'unassessed',
      bodyOpportunity: live('ingredients_nutrition', 'ingredients_nutrition'),
    });
    expect(highlightContributionTap(shown, 'Body', 'nutrition', settled)?.label).toBe('Add nutrition');
    expect(highlightContributionTap(product({ omitPublication: true }), 'Body', 'nutrition', settled)).toBeNull();
    expect(highlightContributionTap(shown, 'Body', 'nutrition', { publicationSettled: false })).toBeNull();
    expect(highlightContributionTap(shown, 'Body', 'ingredients', settled)).toBeNull();
  });

  it('does not change eligibility when the published score is a genuine zero', () => {
    const lanes = {
      nutrition: 'unassessed' as const,
      processing: 'resolved' as const,
      bodyOpportunity: live('ingredients_nutrition', 'ingredients_nutrition'),
    };
    const zero = highlightContributionOffer(product({ ...lanes, publishedScore: 0 }), 'Body', settled);
    const scored = highlightContributionOffer(product({ ...lanes, publishedScore: 18 }), 'Body', settled);
    expect(zero.links).toEqual(scored.links);
    expect(zero.heading).toBe(scored.heading);
    expect(zero.links.map((link) => link.label)).toEqual(['Add nutrition']);
  });
});
