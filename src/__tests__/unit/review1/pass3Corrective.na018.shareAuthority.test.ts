/**
 * Pass 3 corrective — NA-018 Share assessment authority bypass (P1).
 *
 * Unstamped/manual products may persist raw trust_score fields while Result correctly
 * refuses assessment UI (truScore=null). Live share must not resurrect those fields.
 */

import {
  resolveShareOverallScore,
  resolveShareBreakdownForOverall,
  resolveGenuinePillarBreakdown,
} from '../../../utils/shareScoreSemantics';
import { getShareCardData, generateShareMessage } from '../../../services/shareCardGenerator';
import { ShareContentBuilder } from '../../../features/sharing/services/ShareContentBuilder';
import type { TruScoreResult } from '../../../lib/truscoreEngine';
import type { ProductWithTrustScore } from '../../../types/product';

const SCORE_TOKEN = /\b\d{1,3}\/100\b/;
const PILLAR_TOKEN = /•\s*(Body|Planet|Claims|Transparency|Ethics|Open):\s*\d{1,3}\/25/;
const BREAKDOWN_HEADER = /Breakdown:/;

function authorisedResult(): TruScoreResult {
  return {
    truscore: 72,
    breakdown: { Body: 18, Planet: 16, Ethics: 20, Open: 18 },
    scoringUnavailable: false,
    hasNutriScore: true,
    hasEcoScore: true,
    hasOrigin: true,
  };
}

/** Manual/unstamped product with persisted raw assessment fields Result would refuse to display. */
function unstampedManualWithPersistedScore(): ProductWithTrustScore {
  return {
    barcode: '9421901234567',
    product_name: 'Manual Unstamped Cereal',
    brands: 'Test',
    categories: '',
    categories_tags: [],
    labels_tags: [],
    ingredients_text: 'Wheat, sugar.',
    ingredients_analysis_tags: [],
    additives_tags: [],
    nutriments: {},
    source: 'LOCAL',
    trust_score: 55,
    trust_score_breakdown: {
      body: 12,
      planet: 11,
      ethics: 16,
      open: 16,
      reasons: ['stale raw reason must not share'],
    },
    // intentionally no _rveelCoreTruthAuthority
  };
}

function assertNoAssessmentInText(text: string) {
  expect(text).not.toMatch(SCORE_TOKEN);
  expect(text).not.toMatch(PILLAR_TOKEN);
  expect(text).not.toMatch(BREAKDOWN_HEADER);
  expect(text).not.toMatch(/\b55\/100\b/);
  expect(text).not.toMatch(/\b12\/25\b/);
}

describe('Pass 3 NA-018 — Share assessment authority (P1)', () => {
  const product = unstampedManualWithPersistedScore();

  it('unstamped/manual + persisted raw score + truScore=null → no score/pillars in live ShareContentBuilder (truScore + productInfo + negative)', () => {
    for (const item of ['truScore', 'productInfo', 'negativeTruScore'] as const) {
      const content = ShareContentBuilder.buildContent({
        product: product as never,
        truScore: undefined,
        item,
      });
      assertNoAssessmentInText(content.title);
      assertNoAssessmentInText(content.message);
    }
  });

  it('unstamped/manual + truScore=null → no score/pillars in shareCardGenerator representations', () => {
    const card = getShareCardData(product, undefined);
    expect(card.truScore).toBeNull();
    expect(card.breakdown).toBeUndefined();

    assertNoAssessmentInText(generateShareMessage(product, undefined));
  });

  it('story/image resolver follows the same rule (no product.trust_score fallback)', () => {
    expect(resolveShareOverallScore(null)).toBeNull();
    expect(resolveShareOverallScore(undefined)).toBeNull();
  });

  it('raw product breakdown alone cannot reintroduce pillar assessment', () => {
    expect(resolveGenuinePillarBreakdown(undefined)).toBeNull();
    expect(resolveGenuinePillarBreakdown(null)).toBeNull();
    expect(resolveShareBreakdownForOverall(55, undefined)).toBeNull();
    expect(resolveShareBreakdownForOverall(55, null)).toBeNull();
  });

  it('authorised current truScore → Overall and pillars continue to share', () => {
    const tru = authorisedResult();
    const content = ShareContentBuilder.buildContent({
      product: product as never,
      truScore: tru as never,
      item: 'truScore',
    });
    expect(content.message).toContain('72/100');
    expect(content.message).toMatch(/Body: 18\/25/);
    expect(content.message).toMatch(/Planet: 16\/25/);

    const card = getShareCardData(product, tru);
    expect(card.truScore).toBe(72);
    expect(card.breakdown).toEqual({ Body: 18, Planet: 16, Ethics: 20, Open: 18 });

    expect(resolveShareOverallScore(tru)).toBe(72);
    expect(resolveGenuinePillarBreakdown(tru)).toEqual({
      Body: 18,
      Planet: 16,
      Ethics: 20,
      Open: 18,
    });
  });

  it('productInfo with authorised truScore still includes Overall; without truScore omits assessment', () => {
    const withAuth = ShareContentBuilder.buildContent({
      product: product as never,
      truScore: authorisedResult() as never,
      item: 'productInfo',
    });
    expect(withAuth.message).toContain('72/100');

    const without = ShareContentBuilder.buildContent({
      product: product as never,
      truScore: undefined,
      item: 'productInfo',
    });
    assertNoAssessmentInText(without.message);
    expect(without.message).toMatch(/Just scanned/);
  });
});
