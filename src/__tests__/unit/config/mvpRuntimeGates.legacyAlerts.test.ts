import { calculateTruScore } from '../../../lib/truscoreEngine';
import { generateInsights } from '../../../lib/alertsInsights';
import { getProductPageAlertsInsights } from '../../../utils/productInfoCardVisibility';
import { isMvpLegacyAlertsInsightsEnabled } from '../../../config/mvpRuntimeGates';
import type { AlertsPreferences } from '../../../store/useAlertsStore';
import type { Product } from '../../../types/product';

/**
 * S-02 — KitKat/Mars-style brand must not produce live Result insights cards
 * via legacy Alerts preferences while MVP gate is off.
 */
describe('mvpRuntimeGates — legacy Alerts insights isolation (S-02)', () => {
  const prefs: AlertsPreferences = {
    geopoliticalEnabled: false,
    ethicalEnabled: true,
    environmentalEnabled: false,
    israelPalestine: 'neutral',
    indiaChina: 'neutral',
    avoidAnimalTesting: true,
    avoidForcedLabour: false,
    avoidPalmOil: false,
  };

  const kitkatLike: Product = {
    barcode: '5000159407236',
    product_name: 'KitKat',
    brands: 'Nestlé',
    brands_tags: ['nestle'],
    nutriscore_grade: 'd',
    ecoscore_grade: 'c',
  } as Product;

  it('MVP gate parks legacy Alerts insights on the consumer path', () => {
    expect(isMvpLegacyAlertsInsightsEnabled()).toBe(false);
  });

  it('generateInsights still exists for parked code but calculateTruScore does not attach insights', () => {
    const parked = generateInsights(kitkatLike, prefs);
    // Parked helper may still compute when called directly (post-MVP reuse).
    expect(Array.isArray(parked)).toBe(true);

    const score = calculateTruScore(kitkatLike, prefs);
    expect(score.insights ?? []).toEqual([]);
    expect(getProductPageAlertsInsights(true, score)).toBeNull();
  });
});
