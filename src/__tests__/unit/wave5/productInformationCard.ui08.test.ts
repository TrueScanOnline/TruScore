/**
 * Product information card. One contribution action and one explanation link.
 * The card does not decide which journeys are eligible.
 */

import fs from 'fs';
import path from 'path';

const CARD = path.join(__dirname, '../../../components/productLegal/ProductDataLimitationsCard.tsx');
const MENU = path.join(__dirname, '../../../contribution/productInformationMenu.ts');
const RESULT = path.join(__dirname, '../../../../app/result/[barcode].tsx');

describe('product information card', () => {
  const card = fs.readFileSync(CARD, 'utf8');
  const menu = fs.readFileSync(MENU, 'utf8');
  const result = fs.readFileSync(RESULT, 'utf8');

  it('uses one card, one primary action, and one explanation link', () => {
    expect(menu).toContain("export const PRODUCT_INFORMATION_HEADING = 'Information missing?'");
    expect(menu).toContain(
      'If you think any of the information about this product displayed is incorrect or missing then please help us out and make any necessary additions.'
    );
    expect(menu).toContain("export const ADD_OR_CORRECT_INFORMATION = 'Add or correct information'");
    expect(menu).toContain("export const ABOUT_THIS_INFORMATION = 'About this information'");
    expect(card).toContain('PRODUCT_INFORMATION_HEADING');
    expect(card).toContain('ADD_OR_CORRECT_INFORMATION');
    expect(card).toContain('ABOUT_THIS_INFORMATION');
    expect(card).not.toContain('Incomplete product data');
    expect(card).not.toContain('may or may not change the score');
    expect(card).not.toContain('voluntaryContributionOffer');
    expect(card).not.toContain('resultContributionActions');
    expect(card.match(/<LinearGradient/g)).toHaveLength(1);
    expect(card).toContain('minHeight: 44');
    const primary = card.indexOf('testID="add-or-correct-information"');
    const secondary = card.indexOf('testID="about-this-information"');
    const primaryClose = card.indexOf('</TouchableOpacity>', primary);
    expect(secondary).toBeGreaterThan(primaryClose);
    expect(card).toContain('onPress={onAddOrCorrect}');
    expect(card).toContain('onPress={openExplanation}');
    expect(menu).toContain('voluntaryContributionOffer');
    expect(result).toContain('freshProductInformationMenu');
    expect(result).not.toContain("setContributionChoice('voluntary')");
  });
});
