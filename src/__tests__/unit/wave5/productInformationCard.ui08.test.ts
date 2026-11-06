/**
 * W5-UI-08. The voluntary action is presented inside the existing Data Limitations card.
 * Eligibility stays in voluntaryContributionOffer. Touch targets stay siblings.
 */

import fs from 'fs';
import path from 'path';

const CARD = path.join(__dirname, '../../../components/productLegal/ProductDataLimitationsCard.tsx');
const OFFER = path.join(__dirname, '../../../contribution/voluntaryContributionOffer.ts');
const RESULT = path.join(__dirname, '../../../../app/result/[barcode].tsx');

describe('unified product information card', () => {
  const card = fs.readFileSync(CARD, 'utf8');
  const offer = fs.readFileSync(OFFER, 'utf8');
  const result = fs.readFileSync(RESULT, 'utf8');

  it('keeps eligibility in the offer and leaves the Data Limitations modal in place', () => {
    expect(card).not.toContain('voluntaryContributionOffer');
    expect(card).not.toContain('resultContributionActions(');
    expect(offer).toContain("status === 'rated' || status === 'nr'");
    expect(card).toContain('result.legalDataLimitationsTeaserTitle');
    expect(card).toContain('result.legalDataLimitationsTeaserBody');
    expect(card).toContain('result.legalDataLimitationsModalTitle');
    expect(card).toContain('result.legalDataLimitationsModalP5');
    expect(card).toContain('bodyDataLimitationActions(product)');
    expect(card).toContain("action.destination === 'nutrition'");
    expect(card).toContain('onOpenIngredients()');
  });

  it('gives the explanation and the contribution action separate touch targets in one card', () => {
    const teaser = card.indexOf('testID="product-data-limitations-teaser"');
    const teaserClose = card.indexOf('</TouchableOpacity>', teaser);
    const improve = card.indexOf('testID="improve-product-information"');
    const gradient = card.indexOf('<LinearGradient');
    const gradientClose = card.indexOf('</LinearGradient>', gradient);
    expect(card.match(/<LinearGradient/g)).toHaveLength(1);
    expect(teaser).toBeGreaterThan(gradient);
    expect(improve).toBeGreaterThan(teaserClose);
    expect(gradientClose).toBeGreaterThan(improve);
    expect(card).toContain('onPress={open}');
    expect(card).toContain('onPress={voluntaryContribution.onPress}');
    expect(card).not.toContain('onPress={() => { open(); voluntaryContribution');
    expect(card).toContain('styles.divider');
    expect(result).not.toContain('styles.improveInformation');
  });

  it('shows a neutral heading only when an action arrives without an S26 explanation', () => {
    expect(card).toContain('if (!showLimitations && !showVoluntary) return null');
    expect(card).toContain('const PRODUCT_INFORMATION_HEADING = \'Product information\'');
    expect(card).toContain('title={PRODUCT_INFORMATION_HEADING}');
    expect(card).toContain('showChevron={false}');
    expect(card).toContain('{showLimitations && publication && product ?');
    const neutral = card.slice(card.indexOf('title={PRODUCT_INFORMATION_HEADING}'));
    expect(neutral.slice(0, neutral.indexOf('/>'))).not.toContain('legalDataLimitationsTeaser');
  });
});
