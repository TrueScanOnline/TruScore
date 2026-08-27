/**
 * Wave 2 P1 — community additives/packaging/serving must not score for another user.
 */
import { calculateTruScore } from '../../../lib/truscoreEngine';
import { toScoringProduct } from '../../../contributions/eligibilityBoundary';
import type { Product } from '../../../types/product';

const OFF_PRODUCT = {
  barcode: '9300000000999',
  product_name: 'Plain Oats',
  brands: 'Generic',
  source: 'openfoodfacts',
  nutriscore_grade: 'a',
  nova_group: 1,
  ecoscore_grade: 'b',
  ingredients_text: 'oats',
  nutriments: {
    'energy-kcal_100g': 370,
    sugars_100g: 1,
    fat_100g: 7,
    'saturated-fat_100g': 1,
    salt_100g: 0.01,
    proteins_100g: 13,
    fiber_100g: 10,
    'fruits-vegetables-nuts-estimate-from-ingredients_100g': 0,
  },
} as Product;

describe('Wave 2 P1 community scoring eligibility', () => {
  it('strips additives_tags / packagings / packaging_data / serving_size from standalone local contribution', () => {
    const local = {
      ...OFF_PRODUCT,
      source: 'user_contributed',
      additives_tags: ['en:e621'],
      packagings: [{ material: 'en:plastic', recycling: 'en:recycle' }],
      packaging_data: { packaging_text: 'plastic' },
      serving_size: '30g',
    } as Product;

    const scoring = toScoringProduct(local) as Product;
    expect(scoring.additives_tags).toBeUndefined();
    expect(scoring.packagings).toBeUndefined();
    expect(scoring.packaging_data).toBeUndefined();
    expect(scoring.serving_size).toBeUndefined();
  });

  it('User A contribution fields do not change User B OFF score via those four fields', () => {
    const offOnly = calculateTruScore(OFF_PRODUCT);

    // Attempted community overlay on OFF product (another user's scan).
    // mergeUserContributedData no longer writes these scoring fields; toScoringProduct
    // also strips them when LOCAL/contribution-marked.
    const overlaid = {
      ...OFF_PRODUCT,
      _source: 'LOCAL',
      additives_tags: ['en:e102', 'en:e110', 'en:e621'],
      packagings: [{ material: 'en:plastic', shape: 'en:bottle', recycling: 'en:discard' }],
      packaging_data: { packaging_text: 'non-recyclable plastic' },
      serving_size: '999g',
    } as Product;

    const scoringView = toScoringProduct(overlaid) as Product;
    expect(scoringView.additives_tags).toBeUndefined();
    expect(scoringView.packagings).toBeUndefined();
    expect(scoringView.packaging_data).toBeUndefined();
    expect(scoringView.serving_size).toBeUndefined();

    const userB = calculateTruScore({ ...OFF_PRODUCT });
    expect(userB.truscore).toBe(offOnly.truscore);
    expect(userB.breakdown.Body).toBe(offOnly.breakdown.Body);
    expect(userB.breakdown.Planet).toBe(offOnly.breakdown.Planet);
    expect(userB.breakdown.Open).toBe(offOnly.breakdown.Open);
  });

  it('genuine OFF additives_tags still reach Body scoring', () => {
    const withAdditives = {
      ...OFF_PRODUCT,
      additives_tags: ['en:e621'],
    } as Product;
    const scoring = toScoringProduct(withAdditives) as Product;
    expect(scoring.additives_tags).toEqual(['en:e621']);
  });
});
