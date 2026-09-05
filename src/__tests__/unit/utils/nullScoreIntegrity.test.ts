/**
 * Wave 3 null-score integrity — unavailable presentation + share semantics.
 * Score-neutral: does not change pillar arithmetic; asserts consumer/share contracts.
 *
 * Share assertions run against the live share services (shareCardGenerator and
 * ShareContentBuilder), not a local mirror of their logic. They assert only the invariant that an
 * unavailable score is never fabricated as 0 and that a genuine score still reaches the consumer.
 * The transitional Wave-4 share wording itself is deliberately not locked here as product policy.
 */

import {
  getTruScoreConsumerPresentation,
  RVEEL_SCORE_UNAVAILABLE_EXPLANATION,
  RVEEL_SCORE_UNAVAILABLE_TITLE,
} from '../../../utils/truScorePresentation';
import {
  resolveShareOverallScore,
  resolveShareBreakdownForOverall,
  resolveGenuinePillarBreakdown,
} from '../../../utils/shareScoreSemantics';
import { getShareCardData, generateShareMessage } from '../../../services/shareCardGenerator';
import { ShareContentBuilder } from '../../../features/sharing/services/ShareContentBuilder';
import { calculateOpenPillar, calculateTruScore } from '../../../lib/truscoreEngine';
import type { TruScoreResult } from '../../../lib/truscoreEngine';
import type { Product, ProductWithTrustScore } from '../../../types/product';

function unavailableResult(): TruScoreResult {
  return {
    truscore: null,
    breakdown: { Body: null, Planet: null, Ethics: null, Open: null },
    scoringUnavailable: true,
    hasNutriScore: false,
    hasEcoScore: false,
    hasOrigin: false,
  };
}

function scoredResult(overrides?: Partial<TruScoreResult>): TruScoreResult {
  return {
    truscore: 72,
    breakdown: { Body: 18, Planet: 16, Ethics: 20, Open: 18 },
    scoringUnavailable: false,
    hasNutriScore: true,
    hasEcoScore: true,
    hasOrigin: true,
    ...overrides,
  };
}

const baseProduct: ProductWithTrustScore = {
  barcode: '9300000000001',
  product_name: 'Test Cereal',
  brands: 'Test',
  categories: '',
  categories_tags: [],
  labels_tags: [],
  ingredients_text: 'Wheat, sugar, salt.',
  ingredients_analysis_tags: [],
  additives_tags: [],
  nutriments: {},
  source: 'test',
  trust_score: null,
  trust_score_breakdown: null,
};

/** Score tokens that would mean an unavailable score had been fabricated as a number. */
const FABRICATED_SCORE_PATTERNS = [/\b0\/100\b/, /\b0\/25\b/, /\bnull\/100\b/, /NaN/];

function truScoreShareContent(
  truScore: TruScoreResult | undefined,
  product: ProductWithTrustScore
) {
  return ShareContentBuilder.buildContent({
    product: product as never,
    truScore: truScore as never,
    item: 'truScore',
  });
}

describe('null-score integrity — unavailable presentation', () => {
  test('unavailable overall cannot present Poor, red band, 0/25, or zero pillar bars', () => {
    const p = getTruScoreConsumerPresentation(unavailableResult());
    expect(p.kind).toBe('unavailable');
    if (p.kind !== 'unavailable') return;
    expect(p.title).toBe(RVEEL_SCORE_UNAVAILABLE_TITLE);
    expect(p.explanation).toBe(RVEEL_SCORE_UNAVAILABLE_EXPLANATION);
    expect(p.showScoreCircle).toBe(false);
    expect(p.showScoreLabel).toBe(false);
    expect(p.showNumericScore).toBe(false);
    expect(p.showPillarBars).toBe(false);
    expect(p.forbiddenConsumerTokens).toEqual(
      expect.arrayContaining(['Poor', '0/25', '0/100', 'Confidence'])
    );
    expect(p.title.toLowerCase()).not.toContain('confidence');
    expect(p.explanation.toLowerCase()).not.toContain('confidence');
  });

  test('ordinary scored products remain scored presentation', () => {
    const p = getTruScoreConsumerPresentation(scoredResult());
    expect(p.kind).toBe('scored');
    if (p.kind !== 'scored') return;
    expect(p.score).toBe(72);
    expect(p.showScoreCircle).toBe(true);
    expect(p.showPillarBars).toBe(true);
  });
});

describe('null-score integrity — sharing semantics', () => {
  test('live shareCardGenerator never fabricates an unavailable score as 0', () => {
    const tru = unavailableResult();

    const cardData = getShareCardData(baseProduct, tru);
    expect(cardData.truScore).toBeNull();
    expect(cardData.breakdown).toBeUndefined();

    const message = generateShareMessage(baseProduct, tru);
    for (const pattern of FABRICATED_SCORE_PATTERNS) {
      expect(message).not.toMatch(pattern);
    }
    expect(message).not.toMatch(/Breakdown:/);
  });

  test('live ShareContentBuilder never fabricates an unavailable score as 0', () => {
    const content = truScoreShareContent(unavailableResult(), baseProduct);
    for (const pattern of FABRICATED_SCORE_PATTERNS) {
      expect(content.title).not.toMatch(pattern);
      expect(content.message).not.toMatch(pattern);
    }
    // The unavailable state is communicated, without locking the transitional wording itself.
    expect(content.message).toContain(RVEEL_SCORE_UNAVAILABLE_TITLE);
    expect(content.message).not.toMatch(/• Body: /);
  });

  test('a stale persisted score cannot resurrect a share score once scoring is unavailable', () => {
    const withStale: ProductWithTrustScore = {
      ...baseProduct,
      trust_score: 55,
      trust_score_breakdown: { body: 10, planet: 10, ethics: 10, open: 10, reasons: [] },
    };
    expect(getShareCardData(withStale, unavailableResult()).truScore).toBeNull();
    const content = truScoreShareContent(unavailableResult(), withStale);
    expect(content.message).not.toMatch(/55\/100/);
  });

  test('resolveShareOverallScore preserves explicit null from TruScoreResult', () => {
    const withStaleProduct: ProductWithTrustScore = {
      ...baseProduct,
      trust_score: 55,
      trust_score_breakdown: {
        body: 10,
        planet: 10,
        ethics: 10,
        open: 10,
        reasons: [],
      },
    };
    expect(resolveShareOverallScore(unavailableResult(), withStaleProduct)).toBeNull();
    expect(resolveShareBreakdownForOverall(null, unavailableResult(), withStaleProduct)).toBeNull();
  });

  test('legacy ?? 0 pattern would invent a score — helpers must not', () => {
    const coerced = (unavailableResult().truscore ?? 0) as number;
    expect(coerced).toBe(0);
    expect(resolveShareOverallScore(unavailableResult(), baseProduct)).toBeNull();
  });

  test('scored share content still carries the genuine score and breakdown', () => {
    const tru = scoredResult();

    const cardData = getShareCardData(baseProduct, tru);
    expect(cardData.truScore).toBe(72);
    expect(cardData.breakdown).toEqual({ Body: 18, Planet: 16, Ethics: 20, Open: 18 });

    const message = generateShareMessage(baseProduct, tru);
    expect(message).toContain('72/100');
    expect(message).toContain('Body: 18/25');

    const content = truScoreShareContent(tru, baseProduct);
    expect(content.message).toContain('72/100');
    expect(content.message).toContain('• Planet: 16/25');
  });

  test('incomplete pillar set omits breakdown (no zero fill)', () => {
    const partial = scoredResult({
      breakdown: { Body: 18, Planet: null, Ethics: 20, Open: 18 },
    });
    expect(resolveGenuinePillarBreakdown(partial, baseProduct)).toBeNull();
  });
});

describe('null-score integrity — Open v15 + score neutrality smoke', () => {
  test('Open verifier fields match v15 clarity bands', () => {
    const base: Product = {
      barcode: '1',
      product_name: 'X',
      brands: '',
      categories: '',
      categories_tags: [],
      labels_tags: [],
      ingredients_text: '',
      ingredients_analysis_tags: [],
      additives_tags: [],
      nutriments: {},
      source: 'test',
    };

    expect(calculateOpenPillar(base).details.ingredientClarityAdjustment).toBe(0);

    const zero = calculateOpenPillar({
      ...base,
      ingredients_text: 'Water, organic cane sugar, sea salt.',
    });
    expect(zero.details.ingredientClarityAdjustment).toBe(1);

    const one = calculateOpenPillar({ ...base, ingredients_text: 'Water, natural flavor.' });
    expect(one.details.ingredientClarityAdjustment).toBe(-2);

    const two = calculateOpenPillar({
      ...base,
      ingredients_text: 'Water, natural flavor, spice extractives.',
    });
    expect(two.details.ingredientClarityAdjustment).toBe(-4);

    const three = calculateOpenPillar({
      ...base,
      ingredients_text: 'Water, natural flavor, aroma, smoke flavouring, artificial flavouring.',
    });
    expect(three.details.ingredientClarityAdjustment).toBe(-6);

    expect(typeof zero.details.originsAdjustmentId).toBe('string');
    expect(typeof zero.details.originsAdjustment).toBe('number');
  });

  test('scored product pillar scores and adjustment arrays remain identical shape', () => {
    const product: Product = {
      barcode: '3017620422003',
      product_name: 'Nutella',
      brands: 'Ferrero',
      categories: 'Spreads',
      categories_tags: ['en:spreads'],
      labels_tags: [],
      ingredients_text:
        'Sugar, palm oil, hazelnuts, skimmed milk powder, fat-reduced cocoa, emulsifier, vanillin.',
      ingredients_analysis_tags: [],
      additives_tags: [],
      nutriments: {
        'energy-kcal_100g': 539,
        sugars_100g: 56.3,
        fat_100g: 30.9,
        salt_100g: 0.107,
      },
      nutriscore_grade: 'e',
      nova_group: 4,
      source: 'test',
    };

    const a = calculateTruScore(product);
    const b = calculateTruScore(product);
    expect(a.truscore).toBe(b.truscore);
    expect(a.breakdown).toEqual(b.breakdown);
    expect(a.pillarDetails?.open?.adjustments.map((x) => ({ id: x.id, value: x.value }))).toEqual(
      b.pillarDetails?.open?.adjustments.map((x) => ({ id: x.id, value: x.value }))
    );
    expect(a.pillarDetails?.body?.adjustments.map((x) => ({ id: x.id, value: x.value }))).toEqual(
      b.pillarDetails?.body?.adjustments.map((x) => ({ id: x.id, value: x.value }))
    );
  });
});
