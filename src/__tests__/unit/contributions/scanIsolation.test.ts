import { calculateTruScore } from '../../../lib/truscoreEngine';
import { persistEvidenceRemote } from '../../../contributions/evidenceStore';
import { createPendingEvidence } from '../../../contributions/lifecycle';
import {
  markPendingContributionFields,
  toScoringProduct,
} from '../../../contributions/eligibilityBoundary';
import { CONTRIBUTION_POLICY, INGREDIENTS_NUTRITION_SUCCESS_COPY } from '../../../config/contributionPolicy';
import { buildVercelManualProductPayload } from '../../../utils/vercelProprietaryManualProduct';
import type { Product } from '../../../types/product';
import type { ContributionEvidence } from '../../../contributions/types';
import type { ManualProductData } from '../../../types/manualProduct';

const BARCODE = '9415000000123';

function evidence(): ContributionEvidence {
  return createPendingEvidence({
    evidenceId: `${BARCODE}|origins|australia|v1`,
    barcode: BARCODE,
    domain: 'origins',
    evidenceVersion: 1,
    claimKey: 'australia',
    claimValue: 'Australia',
    submitterId: 'user_submitter',
    createdAt: 1,
  });
}

describe('NUT — Ingredients & Nutrition OFF authority', () => {
  it('NUT-01 successful local contribution does not change contributor canonical score', () => {
    const before = {
      barcode: BARCODE,
      product_name: 'Local contributor product',
      source: 'user_contributed',
    } as Product;
    const afterLocalSave = markPendingContributionFields(
      {
        ...before,
        ingredients_text: 'Water, sugar',
        nutriments: { 'energy-kcal_100g': 200, sugars_100g: 10, fat_100g: 1, proteins_100g: 1, salt_100g: 0.1 },
      } as Product,
      { ingredients: true, nutrition: true }
    );
    expect(calculateTruScore(afterLocalSave).truscore).toBe(calculateTruScore(before).truscore);
  });

  it('NUT-02 local/manual contribution record does not alter another user score', () => {
    const otherUserView = {
      barcode: BARCODE,
      product_name: 'Other user view',
      source: 'user_contributed',
      _source: 'BACKEND',
      ingredients_text: 'Water, sugar',
      nutriments: { 'energy-kcal_100g': 200 },
    } as Product;
    const bare = { barcode: BARCODE, product_name: 'Other user view', source: 'user_contributed' } as Product;
    expect(calculateTruScore(otherUserView).breakdown.Open).toBe(calculateTruScore(bare).breakdown.Open);
    expect(calculateTruScore(otherUserView).breakdown.Body).toBe(calculateTruScore(bare).breakdown.Body);
  });

  it('NUT-03 only OFF/public retrieval path may score Ingredients/Nutrition', () => {
    expect(CONTRIBUTION_POLICY.ingredientsNutrition.authorityRoute).toBe('off_public_product_retrieval');
    expect(CONTRIBUTION_POLICY.ingredientsNutrition.canonicalScoringFromLocalContribution).toBe(false);
    const offArrived = {
      barcode: BARCODE,
      product_name: 'OFF read-back',
      source: 'openfoodfacts',
      ingredients_text: 'Water, organic cane sugar, sea salt.',
      nutriscore_grade: 'a',
    } as Product;
    expect(calculateTruScore(offArrived).breakdown.Body).toBe(22);
    expect(INGREDIENTS_NUTRITION_SUCCESS_COPY.body).toContain('Open Food Facts');
  });

  it('NUT-04 existing Ingredients/Nutrition Vercel payload still excludes scoring fields (OFF remains authority route)', () => {
    const payload = buildVercelManualProductPayload({
      barcode: BARCODE,
      product_name: 'X',
      timestamp: 1,
      ingredients_text: 'Water',
      nutriments: { 'energy-kcal_100g': 100 },
      allergens_tags: ['en:milk'],
    } as ManualProductData);
    expect(payload.ingredients_text).toBeUndefined();
    expect(payload.nutriments).toBeUndefined();
    expect(payload.allergens_tags).toEqual(['en:milk']);
  });
});

describe('PROV — storage location is not trust', () => {
  it('PROV-01 stale local contribution values in cache/SQLite/AsyncStorage shapes cannot score', () => {
    const asyncStorageShaped = {
      barcode: BARCODE,
      product_name: 'Stale cache',
      source: 'user_contributed',
      _database: 'AsyncStorage',
      labels_tags: ['en:fair-trade'],
      manufacturing_places: 'Australia',
      manufacturing_places_tags: ['en:australia'],
    } as Product;
    const sqliteLocalOverlay = {
      barcode: BARCODE,
      product_name: 'Stale sqlite overlay',
      source: 'openfoodfacts',
      _source: 'LOCAL',
      labels_tags: ['en:fair-trade'],
      manufacturing_places: 'Australia',
      manufacturing_places_tags: ['en:australia'],
    } as Product;

    expect(toScoringProduct(asyncStorageShaped)?.labels_tags).toBeUndefined();
    expect(toScoringProduct(asyncStorageShaped)?.manufacturing_places).toBeUndefined();
    expect(calculateTruScore(asyncStorageShaped).breakdown.Ethics).toBe(
      calculateTruScore({ barcode: BARCODE, product_name: 'Stale cache', source: 'user_contributed' } as Product)
        .breakdown.Ethics
    );

    expect(toScoringProduct(sqliteLocalOverlay)?.labels_tags).toBeUndefined();
    expect(calculateTruScore(sqliteLocalOverlay).breakdown.Ethics).toBe(
      calculateTruScore({
        barcode: BARCODE,
        product_name: 'Stale sqlite overlay',
        source: 'openfoodfacts',
      } as Product).breakdown.Ethics
    );

    // Trusted OFF without contribution overlay still scores.
    expect(
      calculateTruScore({
        barcode: BARCODE,
        product_name: 'Trusted OFF',
        brands: 'Totally Unknown Indie Brand',
        source: 'openfoodfacts',
        labels_tags: ['en:fair-trade'],
      } as Product).breakdown.Ethics
    ).toBe(21);
  });
});

describe('SCAN — evidence failure must not block scoring', () => {
  it('SCAN-01 persistEvidenceRemote returns false on network failure and does not throw', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network down'));
    await expect(persistEvidenceRemote(evidence())).resolves.toBe(false);
  });

  it('SCAN-02 persistEvidenceRemote returns false on HTTP error and does not throw', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(persistEvidenceRemote(evidence())).resolves.toBe(false);
  });

  it('SCAN-03 calculateTruScore still returns a result when pending contribution fields are present', () => {
    const product = markPendingContributionFields(
      {
        barcode: BARCODE,
        product_name: 'Scan isolation fixture',
        source: 'openfoodfacts',
        manufacturing_places: 'Australia',
        labels_tags: ['en:fair-trade'],
      } as Product,
      { origin: true, labels: true }
    );
    const result = calculateTruScore(product);
    expect(typeof result.truscore).toBe('number');
    expect(result.breakdown).toEqual(
      expect.objectContaining({
        Body: expect.any(Number),
        Planet: expect.any(Number),
        Ethics: expect.any(Number),
        Open: expect.any(Number),
      })
    );
  });
});

describe('W1 — Wave 1 Signals/Chaining untouched; trusted fields remain authoritative', () => {
  it('W1-01 OFF product with origin + Fairtrade + Nutri-Score remains authoritative', () => {
    const trusted: Product = {
      barcode: BARCODE,
      product_name: 'Trusted OFF fixture',
      brands: 'Totally Unknown Indie Brand',
      source: 'openfoodfacts',
      nutriscore_grade: 'a',
      labels_tags: ['en:fair-trade'],
      manufacturing_places: 'New Zealand',
      manufacturing_places_tags: ['en:new-zealand'],
      ingredients_text: 'Water, organic cane sugar, sea salt.',
    };
    const result = calculateTruScore(trusted);
    expect(result.breakdown.Body).toBe(22);
    expect(result.breakdown.Ethics).toBe(21);
    expect(result.hasNutriScore).toBe(true);
  });
});
