import { calculateTruScore } from '../../../lib/truscoreEngine';
import {
  markPendingContributionFields,
  stripUnauthoredScoringFieldsFromContribution,
  toScoringProduct,
} from '../../../contributions/eligibilityBoundary';
import { canPromoteToCanonicalProduct, confirmEvidence, createPendingEvidence, markCanonicalPromoted } from '../../../contributions/lifecycle';
import { buildVercelManualProductPayload, MANUAL_PRODUCT_SCORING_LEAK_KEYS } from '../../../utils/vercelProprietaryManualProduct';
import type { Product } from '../../../types/product';
import type { ManualProductData } from '../../../types/manualProduct';

const BARCODE = '9300000000999';

function offProduct(overrides: Partial<Product> = {}): Product {
  return {
    barcode: BARCODE,
    product_name: 'Wave4 Boundary Fixture',
    brands: 'Totally Unknown Indie Brand',
    source: 'openfoodfacts',
    ...overrides,
  } as Product;
}

describe('CERT — pending certifications must not score', () => {
  it('CERT-01 pending labels_tags do not change Ethics vs trusted OFF without those tags', () => {
    const trusted = offProduct();
    const pendingUserCerts = markPendingContributionFields(
      offProduct({ labels_tags: ['en:fair-trade'] }),
      { labels: true }
    );
    expect(calculateTruScore(pendingUserCerts).breakdown.Ethics).toBe(
      calculateTruScore(trusted).breakdown.Ethics
    );
  });

  it('CERT-02 same labels on trusted OFF (not pending) still score Fairtrade (W1 preserved)', () => {
    const trustedCerts = offProduct({ labels_tags: ['en:fair-trade'] });
    expect(calculateTruScore(trustedCerts).breakdown.Ethics).toBe(21);
  });

  it('CERT-03 promoted certification evidence may union tags only after canonical mark', () => {
    const pending = createPendingEvidence({
      evidenceId: `${BARCODE}|certifications|fair trade|v1`,
      barcode: BARCODE,
      domain: 'certifications',
      evidenceVersion: 1,
      claimKey: 'fair trade',
      claimValue: 'en:fair-trade',
      labelsTags: ['en:fair-trade'],
      submitterId: 'user_submitter',
      createdAt: 1,
    });
    const eligible = confirmEvidence(pending, 'user_other').evidence;
    expect(canPromoteToCanonicalProduct(eligible)).toBe(true);
    const promoted = markCanonicalPromoted(eligible);
    const scored = toScoringProduct(offProduct(), [promoted]);
    expect(scored?.labels_tags).toEqual(['en:fair-trade']);
  });
});

describe('ORG — pending origin must not score; policy blocks promotion', () => {
  it('ORG-01 pending manufacturing_places does not change Open vs trusted OFF without origin', () => {
    const trusted = offProduct();
    const pendingOrigin = markPendingContributionFields(
      offProduct({ manufacturing_places: 'New Zealand' }),
      { origin: true }
    );
    expect(calculateTruScore(pendingOrigin).breakdown.Open).toBe(
      calculateTruScore(trusted).breakdown.Open
    );
  });

  it('ORG-02 trusted OFF origin fields still score (W1)', () => {
    const trustedOrigin = offProduct({
      manufacturing_places: 'New Zealand',
      manufacturing_places_tags: ['en:new-zealand'],
    });
    const bare = offProduct();
    expect(calculateTruScore(trustedOrigin).breakdown.Open).not.toBe(
      calculateTruScore(bare).breakdown.Open
    );
  });
});

describe('NUT — local ingredients/nutrition isolated from scoring', () => {
  it('NUT-01 standalone local contribution nutriments/ingredients do not score', () => {
    const localEmpty = {
      barcode: BARCODE,
      product_name: 'Local only',
      source: 'user_contributed',
    } as Product;
    const localRich = {
      ...localEmpty,
      ingredients_text: 'Water, sugar, cocoa.',
      nutriments: {
        'energy-kcal_100g': 520,
        sugars_100g: 45,
        fat_100g: 30,
        proteins_100g: 5,
        salt_100g: 0.2,
        fiber_100g: 2,
      },
    } as Product;
    expect(calculateTruScore(localRich).breakdown.Open).toBe(
      calculateTruScore(localEmpty).breakdown.Open
    );
    expect(calculateTruScore(localRich).breakdown.Body).toBe(
      calculateTruScore(localEmpty).breakdown.Body
    );
  });

  it('NUT-02 trusted OFF ingredients/nutrition still score (W1)', () => {
    const trusted = offProduct({
      ingredients_text: 'Water, organic cane sugar, sea salt.',
      nutriscore_grade: 'a',
    });
    const bare = offProduct();
    expect(calculateTruScore(trusted).breakdown.Open).toBeGreaterThan(
      calculateTruScore(bare).breakdown.Open
    );
    expect(calculateTruScore(trusted).breakdown.Body).toBeGreaterThan(
      calculateTruScore(bare).breakdown.Body
    );
  });
});

describe('manual-products payload / strip helpers', () => {
  it('does not put origin/cert/nutrition keys on the Vercel proprietary slice', () => {
    const payload = buildVercelManualProductPayload({
      barcode: BARCODE,
      product_name: 'X',
      timestamp: 1,
      manufacturing_places: 'New Zealand',
      countries: 'New Zealand',
      labels_tags: ['en:fair-trade'],
      nutriments: { 'energy-kcal_100g': 100 },
      ingredients_text: 'Water',
      allergens_tags: ['en:milk'],
      additives_tags: ['en:e330'],
    } as ManualProductData);
    expect(Object.keys(payload).sort()).toEqual(['additives_tags', 'allergens_tags']);
    for (const key of MANUAL_PRODUCT_SCORING_LEAK_KEYS) {
      expect(payload).not.toHaveProperty(key);
    }
  });

  it('stripUnauthoredScoringFieldsFromContribution removes leak keys', () => {
    const stripped = stripUnauthoredScoringFieldsFromContribution(
      offProduct({
        manufacturing_places: 'New Zealand',
        labels_tags: ['en:fair-trade'],
        nutriments: { 'energy-kcal_100g': 10 },
        ingredients_text: 'Water',
      })
    );
    expect(stripped.manufacturing_places).toBeUndefined();
    expect(stripped.labels_tags).toBeUndefined();
    expect(stripped.nutriments).toBeUndefined();
    expect(stripped.ingredients_text).toBeUndefined();
  });
});
