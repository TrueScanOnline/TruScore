/**
 * Wave 4A.5 Result composition contracts.
 * Source order is the consumer render order in app/result/[barcode].tsx and NutritionTable.
 */
import * as fs from 'fs';
import * as path from 'path';
import { MVP_RUNTIME, isMvpAllergensUiEnabled, isMvpPricingUiEnabled } from '../../../config/mvpRuntimeGates';

const REPO = path.resolve(__dirname, '../../../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(REPO, rel), 'utf8');
}

function indexAfter(source: string, marker: string, from: number): number {
  const at = source.indexOf(marker, from);
  expect(at).toBeGreaterThanOrEqual(from);
  return at;
}

describe('Wave 4A.5 Result surface', () => {
  const result = read('app/result/[barcode].tsx');
  const nutrition = read('src/components/NutritionTable.tsx');
  const additives = read('src/components/AboutTheseAdditivesCard.tsx');
  const en = JSON.parse(read('src/i18n/locales/en.json')) as {
    result: { nutritionAndIngredients: string };
    nutrition: { notAvailable: string };
  };

  it('uses the consolidated consumer title Nutrition & Ingredients', () => {
    expect(en.result.nutritionAndIngredients).toBe('Nutrition & Ingredients');
    expect(result).toContain("t('result.nutritionAndIngredients', 'Nutrition & Ingredients')");
    expect(result).toContain('rveelPacketNutritionStatus');
  });

  it('renders Nutrition, then Feel the Burn, then Ingredients when Burn is eligible', () => {
    const populated = nutrition.slice(nutrition.indexOf('const getLevelColor'));
    const tableAt = populated.indexOf('styles.table');
    const burnAt = populated.indexOf('styles.burnStrip');
    const ingredientsAt = populated.indexOf('{afterBurn}');
    expect(tableAt).toBeGreaterThan(0);
    expect(burnAt).toBeGreaterThan(tableAt);
    expect(ingredientsAt).toBeGreaterThan(burnAt);
    expect(nutrition).toContain('const showBurnStrip = burnMinutes !== null && kcalPer100g !== undefined');
    expect(result.indexOf('<ResultIngredientsSection')).toBeGreaterThan(result.indexOf('<NutritionTable'));
    expect(result.indexOf('/>', result.indexOf('afterBurn={'))).toBeGreaterThan(
      result.indexOf('<ResultIngredientsSection')
    );
  });

  it('keeps Ingredients when Feel the Burn is absent, and keeps empty and populated states', () => {
    const emptyReturn = nutrition.slice(
      nutrition.indexOf('if (!nutriments)'),
      nutrition.indexOf('const getLevelColor')
    );
    expect(emptyReturn).toContain("t('nutrition.notAvailable')");
    expect(emptyReturn).toContain('{afterBurn}');
    expect(emptyReturn).not.toContain('styles.burnStrip');
    expect(en.nutrition.notAvailable.length).toBeGreaterThan(0);
    expect(result).toContain('result.ingredientsEmpty');
    expect(result).toContain('onOpenProcessingLevel={() => setProcessingLevelModalVisible(true)}');
    expect(result).toContain('NOVA {novaGroup}');
    expect(nutrition).toContain('NutritionDetailsModal');
    expect(nutrition).toContain('NutritionBurnInfoModal');
  });

  it('places About these Additives, Product Origins, and Packet Claims after Nutrition & Ingredients', () => {
    let cursor = result.indexOf('<ProductDisclaimerCard />');
    const order = [
      '<ProductHeroSection',
      "t('result.nutritionAndIngredients', 'Nutrition & Ingredients')",
      '<AboutTheseAdditivesCard',
      "t('result.productOrigins', 'Product Origins')",
      'accessibilityLabel={PACKET_CLAIMS_CARD_TITLE}',
      '<PalmOilCard',
      'isMvpPricingUiEnabled()',
      'isMvpAllergensUiEnabled()',
      '<ProductDataLimitationsCard',
      'result.scanAnother',
    ];
    for (const marker of order) {
      cursor = indexAfter(result, marker, cursor);
    }
    expect(additives).toContain('if (count < 1) return null');
    expect(result).toContain('count={s25Merged.renderedAdditiveIds.length}');
    expect(result).toContain('{PACKET_CLAIMS_CARD_TITLE}');
    expect(result).toContain('PACKET_CLAIMS_EXPLAINER_HOOK');
    expect(result).toContain('rveelGovernedPacketClaims');
    expect(result).toContain('productOriginsCardPresentation');
    expect(read('src/origins/productOriginsCard.ts')).toContain('rveelGovernedOrigins');
    expect(result).not.toContain('CertificationsCard');
  });

  it('does not render Eco-Score, Packaging & Recycling, or Carbon Footprint on Result', () => {
    expect(result).not.toContain('<EcoScore');
    expect(result).not.toContain('EcoScoreInfoModal');
    expect(result).not.toContain('shouldShowEcoScoreCard');
    expect(result).not.toContain('PackagingOffCardContent');
    expect(result).not.toContain('PackagingInfoModal');
    expect(result).not.toContain('shouldShowPackagingCard');
    expect(result).not.toContain('CarbonFootprintCard');
    expect(result).not.toContain('shouldShowCarbonFootprintCard');
    expect(result).not.toContain("t('result.ecoScore'");
    expect(result).not.toContain("t('result.packaging'");
  });

  it('keeps Palm Oil, Pricing, and legacy Allergens non-rendering', () => {
    expect(read('src/features/product/cards/PalmOilCard/PalmOilCard.tsx')).toContain(
      'export const PALM_OIL_PRODUCT_CARD_VISIBLE = false'
    );
    expect(MVP_RUNTIME.pricingUi).toBe(false);
    expect(MVP_RUNTIME.allergensUi).toBe(false);
    expect(isMvpPricingUiEnabled()).toBe(false);
    expect(isMvpAllergensUiEnabled()).toBe(false);
    expect(result).toContain('<PalmOilCard');
    expect(result).toContain('isMvpPricingUiEnabled()');
    expect(result).toContain('isMvpAllergensUiEnabled()');
  });

  it('retains the surrounding Result surfaces and drops the obsolete pending banner', () => {
    expect(result).toContain('<ProductDisclaimerCard />');
    expect(result).toContain('<ProductHeroSection');
    expect(result).toContain('<BannerAlertsCard');
    expect(result).toContain('<TruScore');
    expect(result).toContain('<ConfidenceBadge');
    expect(result).toContain('What we found');
    expect(result).toContain('Insufficient Data Card');
    expect(result).toContain('<ProductDataLimitationsCard');
    expect(result).toContain('result.scanAnother');
    expect(result).toContain('<ManualProductEntryModal');
    expect(result).not.toContain('PendingContributionsBanner');
    expect(fs.existsSync(path.join(REPO, 'src/components/PendingContributionsBanner.tsx'))).toBe(false);
    expect(read('src/utils/trustScore.ts')).toContain('rveelPacketNutritionStatus: nutritionStatus');
    expect(read('src/ingredientsNutrition/offDispatch.ts')).toContain('export function offDispatchConsumerCopy');
  });
});
