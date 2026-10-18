import fs from 'fs';
import path from 'path';
import {
  PRODUCT_ORIGINS_EMPTY_STATE,
  PRODUCT_ORIGINS_MORE_INFORMATION,
  productOriginsCardShowsEmptyState,
} from '../../../components/productOriginsCardCopy';

describe('product origins card consumer copy', () => {
  it('shows the empty sentence only when the card has nothing to display', () => {
    expect(PRODUCT_ORIGINS_EMPTY_STATE).toBe(
      'This product does not currently have any product origins that we can find. If there are any stated on the packet, you can add them now.'
    );
    expect(PRODUCT_ORIGINS_MORE_INFORMATION).toContain('Product origins are claims or statements made by the manufacturer');
    expect(productOriginsCardShowsEmptyState({ offCountry: null, consumerLineCount: 0 })).toBe(true);
    expect(productOriginsCardShowsEmptyState({ offCountry: 'Australia', consumerLineCount: 0 })).toBe(false);
    expect(productOriginsCardShowsEmptyState({ offCountry: null, consumerLineCount: 1 })).toBe(false);
  });

  it('opens the existing Product Origins explanation from an information icon', () => {
    const screen = fs.readFileSync(path.join(__dirname, '../../../../app/result/[barcode].tsx'), 'utf8');
    expect(screen).toContain('PRODUCT_ORIGINS_EMPTY_STATE');
    expect(screen).toContain('PRODUCT_ORIGINS_MORE_INFORMATION');
    expect(screen).toContain('accessibilityLabel="More information about product origins"');
    expect(screen).toContain('setProductOriginsExplainerVisible(true)');
    expect(screen).not.toContain('PRODUCT_ORIGINS_EXPLAINER_HOOK');
    expect(screen).not.toContain('L1 / L2 / L3');
  });
});
