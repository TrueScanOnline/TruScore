import {
  computePackagingFallback,
  dispositionFromRecyclingEvidence,
  filterPrimaryConsumerPackagingItems,
} from '../../../../lib/truscoreEngine/pillars/planetPackagingFallback';
import type { Product } from '../../../../types/product';
import * as countryDetection from '../../../../utils/countryDetection';

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

  test('packaging_text_in_languages applies when exactly one primary component (empty recycling)', () => {
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
      packaging_text_in_languages: { en: 'Widely recycled at kerbside' },
      packagings: [{ recycling: '' }],
    } satisfies Product;
    const fb = computePackagingFallback(product);
    expect(fb.dispositions).toEqual(['kerbside_recyclable']);
    expect(fb.points).toBe(2);
  });

  test('product-level packaging_text_in_languages does not smear across multiple primary rows', () => {
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
      packaging_text_in_languages: { en: 'Place in recycling bin' },
      packagings: [{ recycling: '' }, { recycling: '' }],
    } satisfies Product;
    const fb = computePackagingFallback(product);
    expect(fb.dispositions).toEqual(['unknown', 'unknown']);
    expect(fb.points).toBe(0);
  });

  test('per-component packaging_text_in_languages used for that row when multiple primaries', () => {
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
      packaging_text_in_languages: { en: 'Generic recycle' },
      packagings: [
        { recycling: '' },
        { recycling: '', packaging_text_in_languages: { en: 'Kerbside recycling' } },
      ],
    } satisfies Product;
    const fb = computePackagingFallback(product);
    expect(fb.dispositions[0]).toBe('unknown');
    expect(fb.dispositions[1]).toBe('kerbside_recyclable');
    expect(fb.points).toBe(1);
  });

  test('moderated OFF-aligned rows: structured recycling per component without global text', () => {
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
      true_scan_market: 'NZ' as const,
      packagings_complete: false,
      packagings: [
        { food_contact: 'en:yes', recycling: 'Check locally' },
        { food_contact: 'en:yes', recycling: 'Recycle' },
      ],
    } satisfies Product;
    const fb = computePackagingFallback(product);
    expect(fb.dispositions[0]).toBe('conditionally_recyclable');
    expect(fb.dispositions[1]).toBe('kerbside_recyclable');
    expect(fb.points).toBe(1);
  });

  test('filterPrimaryConsumerPackagingItems drops explicit non–food-contact rows', () => {
    const items = [
      { recycling: 'Recycle', food_contact: 'en:yes' },
      { recycling: 'Recycle', food_contact: 'en:yes' },
      { recycling: 'Recycle', food_contact: 'en:no' },
    ];
    const primaries = filterPrimaryConsumerPackagingItems(items);
    expect(primaries).toHaveLength(2);
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
      packagings: items,
    } satisfies Product;
    expect(computePackagingFallback(product).points).toBe(2);
  });
});

describe('planetPackagingFallback — GLOBAL jurisdiction', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    spy = jest.spyOn(countryDetection, 'getUserCountryCode');
  });

  afterEach(() => {
    spy.mockRestore();
  });

  test('device outside AU/NZ yields GLOBAL and neutral packaging points', () => {
    spy.mockReturnValue('DE');
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
      packagings_complete: true,
      packagings: [{ recycling: 'Recycle' }],
    } satisfies Product;
    const fb = computePackagingFallback(product);
    expect(fb.jurisdiction).toBe('GLOBAL');
    expect(fb.points).toBe(0);
    expect(fb.dispositions).toEqual([]);
  });
});
