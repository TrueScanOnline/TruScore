import { calculateTruScore } from '../../../lib/truscoreEngine';
import {
  canPromoteToCanonicalProduct,
  confirmAndPromoteIfEligible,
  confirmEvidence,
  createPendingEvidence,
  disputeEvidence,
  markCanonicalPromoted,
} from '../../../contributions/lifecycle';
import {
  markPendingContributionFields,
  toScoringProduct,
} from '../../../contributions/eligibilityBoundary';
import { buildExactWordingFromStructured } from '../../../contributions/originStructured';
import { resolveCertificationLane } from '../../../contributions/certificationLane';
import { CONTRIBUTION_POLICY } from '../../../config/contributionPolicy';
import type { Product } from '../../../types/product';
import type { ContributionEvidence } from '../../../contributions/types';

const BARCODE = '9300000000888';

function offBare(overrides: Partial<Product> = {}): Product {
  return {
    barcode: BARCODE,
    product_name: 'Assurance fixture',
    brands: 'Totally Unknown Indie Brand',
    source: 'openfoodfacts',
    ...overrides,
  } as Product;
}

function pendingLaneA(): ContributionEvidence {
  return createPendingEvidence({
    evidenceId: `${BARCODE}|certifications|fair trade|v1`,
    barcode: BARCODE,
    domain: 'certifications',
    evidenceVersion: 1,
    claimKey: 'fair trade',
    claimValue: 'en:fair-trade',
    labelsTags: ['en:fair-trade'],
    submitterId: 'user_a',
    createdAt: 1,
  });
}

function pendingLaneB(): ContributionEvidence {
  return createPendingEvidence({
    evidenceId: `${BARCODE}|certifications|carbon neutral|v1`,
    barcode: BARCODE,
    domain: 'certifications',
    evidenceVersion: 1,
    claimKey: 'carbon neutral',
    claimValue: 'en:carbon-neutral',
    labelsTags: ['en:carbon-neutral'],
    submitterId: 'user_a',
    createdAt: 1,
  });
}

function pendingOriginQualified(): ContributionEvidence {
  const originStructured = {
    claimType: 'made_in' as const,
    primaryCountry: 'Australia',
    ingredientOriginPercentage: 75,
    percentageQualifier: 'at_least' as const,
    ingredientOriginCountry: 'Australia',
  };
  return createPendingEvidence({
    evidenceId: `${BARCODE}|origins|made_in:australia|v1`,
    barcode: BARCODE,
    domain: 'origins',
    evidenceVersion: 1,
    claimKey: 'made_in:australia',
    claimValue: 'Australia',
    originStructured,
    imageUrl: 'https://cdn.example.com/packet-front.jpg',
    // Faithful packet transcript (user confirms/corrects structured draft; not forced to type it).
    exactWording: 'Made in Australia from at least 75% Australian ingredients',
    submitterId: 'user_a',
    createdAt: 1,
  });
}

describe('CERT — certifications promotion and isolation', () => {
  it('CERT-01 pending Lane A does not alter another user Ethics/TruScore', () => {
    const pending = markPendingContributionFields(offBare({ labels_tags: ['en:fair-trade'] }), {
      labels: true,
    });
    expect(calculateTruScore(pending).breakdown.Ethics).toBe(calculateTruScore(offBare()).breakdown.Ethics);
  });

  it('CERT-02 existing legitimate certification evidence continues to score', () => {
    expect(calculateTruScore(offBare({ labels_tags: ['en:fair-trade'] })).breakdown.Ethics).toBe(21);
  });

  it('CERT-03 independent confirmation satisfies configured threshold', () => {
    const confirmed = confirmEvidence(pendingLaneA(), 'user_b');
    expect(confirmed.ok).toBe(true);
    expect(confirmed.evidence.state).toBe('cross_user_eligible');
    expect(confirmed.evidence.scoringEligible).toBe(true);
    expect(CONTRIBUTION_POLICY.certifications.independentConfirmationsRequired).toBe(1);
  });

  it('CERT-04 continuing confirmation after promotion', () => {
    const promoted = confirmAndPromoteIfEligible(pendingLaneA(), 'user_b').evidence;
    expect(promoted.canonicalPromoted).toBe(true);
    const continued = confirmEvidence(promoted, 'user_c');
    expect(continued.ok).toBe(true);
    expect(continued.evidence.confirmations.map((c) => c.contributorId).sort()).toEqual([
      'user_b',
      'user_c',
    ]);
    expect(continued.evidence.canonicalPromoted).toBe(true);
  });

  it('CERT-05 ongoing dispute after promotion; duplicate active response does not inflate', () => {
    const promoted = confirmAndPromoteIfEligible(pendingLaneA(), 'user_b').evidence;
    const disputed = disputeEvidence(promoted, 'user_c', 'claim_not_present');
    expect(disputed.ok).toBe(true);
    const duplicate = disputeEvidence(disputed.evidence, 'user_c', 'wrong_product');
    expect(duplicate.ok).toBe(false);
    expect(duplicate.reason).toBe('duplicate_dispute');
    expect(disputed.evidence.disputes).toHaveLength(1);
  });

  it('CERT-06 two independent disputes → review_required', () => {
    const first = disputeEvidence(pendingLaneA(), 'user_b', 'claim_not_present');
    const second = disputeEvidence(first.evidence, 'user_c', 'wrong_product');
    expect(second.evidence.state).toBe('review_required');
  });

  it('CERT-07 review_required does not auto-withdraw or clear prior scoring eligibility', () => {
    const promoted = confirmAndPromoteIfEligible(pendingLaneA(), 'user_b').evidence;
    expect(promoted.scoringEligible).toBe(true);
    expect(promoted.canonicalPromoted).toBe(true);
    const d1 = disputeEvidence(promoted, 'user_c', 'claim_not_present');
    const d2 = disputeEvidence(d1.evidence, 'user_d', 'wrong_product');
    expect(d2.evidence.state).toBe('review_required');
    expect(d2.evidence.scoringEligible).toBe(true);
    expect(d2.evidence.canonicalPromoted).toBe(true);
    expect(d2.evidence.state).not.toBe('withdrawn');
  });

  it('CERT-08 verified Lane A promotes and scores via existing Ethics evaluator', () => {
    const promoted = confirmAndPromoteIfEligible(pendingLaneA(), 'user_b').evidence;
    expect(canPromoteToCanonicalProduct(promoted)).toBe(true);
    expect(promoted.canonicalPromoted).toBe(true);
    const scored = calculateTruScore(offBare(), undefined, {
      promotedContributionEvidence: [promoted],
    });
    expect(scored.breakdown.Ethics).toBe(21);
    expect(scored.truscore).toBe(calculateTruScore(offBare({ labels_tags: ['en:fair-trade'] })).truscore);
  });

  it('CERT-09 verified Lane B remains non-scoring', () => {
    expect(resolveCertificationLane({ labelsTags: ['en:carbon-neutral'] })).toBe('B');
    const confirmed = confirmEvidence(pendingLaneB(), 'user_b').evidence;
    expect(confirmed.state).toBe('cross_user_eligible');
    expect(confirmed.scoringEligible).toBe(false);
    expect(canPromoteToCanonicalProduct(confirmed)).toBe(false);
    expect(markCanonicalPromoted(confirmed).canonicalPromoted).toBe(false);
    const scored = calculateTruScore(offBare(), undefined, {
      promotedContributionEvidence: [markCanonicalPromoted(confirmed)],
    });
    expect(scored.breakdown.Ethics).toBe(calculateTruScore(offBare()).breakdown.Ethics);
  });
});

describe('ORG — origins promotion and isolation', () => {
  it('ORG-01 pending origin does not alter Open/TruScore', () => {
    const pending = markPendingContributionFields(offBare({ manufacturing_places: 'Australia' }), {
      origin: true,
    });
    expect(calculateTruScore(pending).breakdown.Open).toBe(calculateTruScore(offBare()).breakdown.Open);
  });

  it('ORG-02 trusted external origin preserved', () => {
    const trusted = offBare({
      manufacturing_places: 'New Zealand',
      manufacturing_places_tags: ['en:new-zealand'],
    });
    expect(calculateTruScore(trusted).breakdown.Open).not.toBe(calculateTruScore(offBare()).breakdown.Open);
  });

  it('ORG-03 Manual country cannot independently bypass governed Origins lifecycle', () => {
    // Local Manual Edit-shaped product with origin fields is pending-marked / stripped.
    const manualLocal = markPendingContributionFields(
      {
        barcode: BARCODE,
        product_name: 'Manual entry',
        source: 'user_contributed',
        manufacturing_places: 'Australia',
        countries: 'Australia',
      } as Product,
      { origin: true }
    );
    const scoring = toScoringProduct(manualLocal);
    expect(scoring?.manufacturing_places).toBeUndefined();
    expect(scoring?.countries).toBeUndefined();
    expect(calculateTruScore(manualLocal).breakdown.Open).toBe(
      calculateTruScore({ barcode: BARCODE, product_name: 'Manual entry', source: 'user_contributed' } as Product)
        .breakdown.Open
    );
  });

  it('ORG-04 continuing verification after promotion', () => {
    const promoted = confirmAndPromoteIfEligible(pendingOriginQualified(), 'user_b').evidence;
    const continued = confirmEvidence(promoted, 'user_c');
    expect(continued.ok).toBe(true);
    expect(continued.evidence.confirmations).toHaveLength(2);
    const disputed = disputeEvidence(promoted, 'user_d', 'wording_differs');
    expect(disputed.ok).toBe(true);
  });

  it('ORG-05 responses attach to evidence version, not undifferentiated GTIN', () => {
    const v1 = pendingOriginQualified();
    const v2 = createPendingEvidence({
      ...v1,
      evidenceId: `${BARCODE}|origins|made_in:australia|v2`,
      evidenceVersion: 2,
      claimValue: 'Australia',
      createdAt: 2,
    });
    const c1 = confirmEvidence(v1, 'user_b').evidence;
    expect(c1.evidenceVersion).toBe(1);
    expect(c1.evidenceId).toContain('v1');
    expect(v2.confirmations).toHaveLength(0);
    expect(v2.evidenceId).not.toBe(c1.evidenceId);
  });

  it('ORG-06 verified qualified Origins promotes faithfully; existing Open assigns partial (not coerced complete +4)', () => {
    const pending = pendingOriginQualified();
    expect(pending.imageUrl).toBe('https://cdn.example.com/packet-front.jpg');
    expect(pending.exactWording).toBe('Made in Australia from at least 75% Australian ingredients');
    expect(pending.originStructured?.claimType).toBe('made_in');
    expect(pending.originStructured?.primaryCountry).toBe('Australia');
    expect(pending.originStructured?.ingredientOriginPercentage).toBe(75);
    expect(pending.originStructured?.percentageQualifier).toBe('at_least');
    // Structured draft exists so the user confirms/corrects fields rather than typing the full sentence.
    const structuredDraft = buildExactWordingFromStructured(pending.originStructured!);
    expect(structuredDraft.toLowerCase()).toContain('made in australia');
    expect(structuredDraft).toContain('75%');
    expect(pending.exactWording).not.toEqual('');
    expect(pending.exactWording).toContain('75%');

    const promoted = confirmAndPromoteIfEligible(pending, 'user_b').evidence;
    expect(promoted.canonicalPromoted).toBe(true);
    expect(promoted.scoringEligible).toBe(true);
    // Evidence semantics preserved on the governed record (not flattened to “complete”).
    expect(promoted.originStructured?.ingredientOriginPercentage).toBe(75);
    expect(promoted.originStructured?.percentageQualifier).toBe('at_least');
    expect(promoted.exactWording).toBe('Made in Australia from at least 75% Australian ingredients');

    const scoringProduct = toScoringProduct(offBare(), [promoted]);
    expect(scoringProduct?.manufacturing_places).toBe('Australia');
    expect(scoringProduct?.origins).toBe('Made in Australia from at least 75% Australian ingredients');
    // Must not invent tags to manufacture Open “complete” (+4).
    expect(scoringProduct?.manufacturing_places_tags).toBeUndefined();

    const withOrigin = calculateTruScore(offBare(), undefined, {
      promotedContributionEvidence: [promoted],
    });
    const without = calculateTruScore(offBare());
    // Bare Open includes origin absent (−4). Faithful string-only/partial → current Open 0.
    // Delta is therefore +4 Open points (−4 → 0), not an Origins “+8 contribution” and not coerced −4 → +4.
    expect(withOrigin.breakdown.Open - without.breakdown.Open).toBe(4);

    // Source consistency: identical string-only OFF shape scores the same as promoted Rveel evidence.
    const offStringOnly = calculateTruScore(
      offBare({
        manufacturing_places: 'Australia',
        origins: 'Made in Australia from at least 75% Australian ingredients',
      })
    );
    expect(withOrigin.breakdown.Open).toBe(offStringOnly.breakdown.Open);
  });
});
