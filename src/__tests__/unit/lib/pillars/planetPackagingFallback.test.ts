import {
  computePackagingFallback,
  dispositionFromRecyclingEvidence,
} from '../../../../lib/truscoreEngine/pillars/planetPackagingFallback';
import type { Product } from '../../../../types/product';

describe('planetPackagingFallback (Annex v2)', () => {
  test('normalisation: synonym triggers kerbside without exact seed literal', () => {
    expect(dispositionFromRecyclingEvidence('Widely recycled at home', '')).toBe('kerbside_recyclable');
  });

  test('conditional: check locally => not positive', () => {
    expect(dispositionFromRecyclingEvidence('Check locally', '')).toBe('conditionally_recyclable');
  });

  test('conditional: deposit return (v2)', () => {
    expect(dispositionFromRecyclingEvidence('Container deposit scheme', '')).toBe('conditionally_recyclable');
  });

  test('+2 when complete and all kerbside (AU)', () => {
    const product = {
      barcode: '1',
      product_name: 'x',
      brands: '',
      categories: '',
      categories_tags: [],
      labels_tags: [],
      ingredients_text: '',
      ingredients_analysis_tags: [],
      additives_tags: [],
      nutriments: {},
      source: 'test' as const,
      true_scan_market: 'AU' as const,
      packagings_complete: true,
      packagings: [{ recycling: 'Recycle' }, { recycling: 'en:Recycle' }],
    } satisfies Product;
    const fb = computePackagingFallback(product);
    expect(fb.points).toBe(2);
  });

  test('+1 when incomplete but one kerbside and none not_recyclable', () => {
    const product = {
      barcode: '1',
      product_name: 'x',
      brands: '',
      categories: '',
      categories_tags: [],
      labels_tags: [],
      ingredients_text: '',
      ingredients_analysis_tags: [],
      additives_tags: [],
      nutriments: {},
      source: 'test' as const,
      true_scan_market: 'AU' as const,
      packagings_complete: false,
      packagings: [{ recycling: 'Recycle' }, { recycling: '' }],
    } satisfies Product;
    const fb = computePackagingFallback(product);
    expect(fb.points).toBe(1);
  });

  test('not_recyclable blocks +1', () => {
    const product = {
      barcode: '1',
      product_name: 'x',
      brands: '',
      categories: '',
      categories_tags: [],
      labels_tags: [],
      ingredients_text: '',
      ingredients_analysis_tags: [],
      additives_tags: [],
      nutriments: {},
      source: 'test' as const,
      true_scan_market: 'AU' as const,
      packagings: [{ recycling: 'Recycle' }, { recycling: 'Not recyclable' }],
    } satisfies Product;
    expect(computePackagingFallback(product).points).toBe(0);
  });

  test('+2 blocked when one component is deposit return (conditional)', () => {
    const product = {
      barcode: '1',
      product_name: 'x',
      brands: '',
      categories: '',
      categories_tags: [],
      labels_tags: [],
      ingredients_text: '',
      ingredients_analysis_tags: [],
      additives_tags: [],
      nutriments: {},
      source: 'test' as const,
      true_scan_market: 'AU' as const,
      packagings_complete: true,
      packagings: [{ recycling: 'Recycle' }, { recycling: 'Deposit return' }],
    } satisfies Product;
    const fb = computePackagingFallback(product);
    expect(fb.dispositions[0]).toBe('kerbside_recyclable');
    expect(fb.dispositions[1]).toBe('conditionally_recyclable');
    expect(fb.points).toBe(1);
  });
});
