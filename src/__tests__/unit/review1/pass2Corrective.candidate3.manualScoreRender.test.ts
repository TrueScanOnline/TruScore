/**
 * Pass 2 Candidate 3 — manual-product persisted score must not render as authoritative
 * assessment without Core Truth authority (mirrors Result TruScore useEffect gate).
 */

import {
  hasCoreTruthAuthority,
  stampCoreTruthAuthority,
} from '../../../config/coreTruthProductCacheAuthority';
import type { ProductWithTrustScore } from '../../../types/product';

/**
 * Mirrors app/result/[barcode].tsx Candidate 3 gate for building TruScore UI state
 * from persisted product.trust_score / trust_score_breakdown fields.
 */
function mayRenderPersistedTruScoreAssessment(product: ProductWithTrustScore | null): boolean {
  if (!product) return false;
  if (!hasCoreTruthAuthority(product)) return false;
  return product.trust_score !== null && !!product.trust_score_breakdown;
}

describe('Pass 2 Candidate 3 — manual/unstamped persisted score render gate', () => {
  it('unstamped manual-like product with persisted trust_score cannot render TruScore UI', () => {
    const manual: ProductWithTrustScore = {
      barcode: '9300652815573',
      product_name: 'User Entered',
      source: 'manual',
      trust_score: 55,
      trust_score_breakdown: { body: 14, planet: 14, ethics: 14, open: 13 },
      _truscore_analysis: {
        barcode: '9300652815573',
        totalScore: 55,
        fetchTrace: [],
        pillars: {} as any,
        generatedAt: Date.now(),
      } as any,
    };
    expect(hasCoreTruthAuthority(manual)).toBe(false);
    expect(mayRenderPersistedTruScoreAssessment(manual)).toBe(false);
  });

  it('Core Truth–stamped product with persisted scores may render TruScore UI', () => {
    const stamped = stampCoreTruthAuthority({
      barcode: '9300652815573',
      product_name: 'Authorised',
      source: 'openfoodfacts',
      trust_score: 55,
      trust_score_breakdown: { body: 14, planet: 14, ethics: 14, open: 13 },
    } as ProductWithTrustScore);
    expect(mayRenderPersistedTruScoreAssessment(stamped)).toBe(true);
  });
});
