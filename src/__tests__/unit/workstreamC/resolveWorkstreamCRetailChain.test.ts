import path from 'path';
import fs from 'fs';
import { parseCsv } from '../../../identity/workstreamA/csv';
import { buildADataMapsFromCsvRecords } from '../../../workstreamC/skeleton/workstreamCPublicationCore';
import {
  isChocolateOrCocoaContext,
  productNameLeadingPhraseMatches,
  resolveReviewedRetailChainUnified,
} from '../../../workstreamC/skeleton/resolveWorkstreamCRetailChain';
import { buildDynamicSignalsAssetRuntimePublicationRecords } from '../../../dynamicSignals/asset/v0.2/buildDynamicSignalsAssetRuntimePublicationRecords';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const A_DATA = path.join(ROOT, 'workstreamA', 'a-data', 'wave1-v0.15', 'input');
const BRAND_CHILD = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.2', 'brand_child_of_brand.csv');

function loadFrozenADataMaps() {
  const brandRows = parseCsv(fs.readFileSync(path.join(A_DATA, 'canonical_brands.csv'), 'utf8'));
  const parentRows = parseCsv(fs.readFileSync(path.join(A_DATA, 'canonical_parents.csv'), 'utf8'));
  const gtinRows = parseCsv(fs.readFileSync(path.join(A_DATA, 'gtin_brand_links.csv'), 'utf8'));
  const aliasRows = parseCsv(fs.readFileSync(path.join(A_DATA, 'brand_aliases.csv'), 'utf8'));
  const brandChildRows = parseCsv(fs.readFileSync(BRAND_CHILD, 'utf8'));
  return {
    aData: buildADataMapsFromCsvRecords(brandRows, parentRows, gtinRows),
    brandRows,
    aliasRows,
    brandChildRows,
  };
}

function resolveChain(product: Record<string, unknown>, barcode: string, logLines?: string[]) {
  const { aData, brandRows, aliasRows, brandChildRows } = loadFrozenADataMaps();
  return resolveReviewedRetailChainUnified({
    barcode,
    productName: (product.product_name as string) ?? '',
    product: product as any,
    aData,
    canonicalBrandRows: brandRows,
    brandAliasRows: aliasRows,
    brandChildRows,
    logLines,
    applyCadburyUatBridge: false,
  });
}

describe('resolveWorkstreamCRetailChain', () => {
  it('isChocolateOrCocoaContext true for chocolates category', () => {
    expect(
      isChocolateOrCocoaContext({
        categories_tags: ['en:chocolates'],
      } as any)
    ).toBe(true);
  });

  it('isChocolateOrCocoaContext false for plain cracker / biscuit products without chocolate cues', () => {
    expect(
      isChocolateOrCocoaContext({
        categories_tags: ['en:biscuits-and-crackers'],
        product_name: 'Ritz Original Crackers',
        brands: 'Ritz',
      } as any)
    ).toBe(false);
    expect(
      isChocolateOrCocoaContext({
        categories_tags: ['en:biscuits-and-crackers'],
        product_name: 'Cadbury Biscuits',
        brands: 'Cadbury',
      } as any)
    ).toBe(false);
  });

  it('leading phrase boundary: MIX matches leading token only', () => {
    expect(productNameLeadingPhraseMatches('MIX Curry Sauce', 'MIX')).toBe(true);
    expect(productNameLeadingPhraseMatches('Japanese Curry Mix', 'MIX')).toBe(false);
    expect(productNameLeadingPhraseMatches('Mixed Berry Yogurt', 'MIX')).toBe(false);
  });

  it('Cadbury Dairy Milk product_name refines to reviewed child brand B0241 (not UAT bridge)', () => {
    const chain = resolveChain(
      {
        barcode: '9300601234567',
        brands: 'Cadbury',
        product_name: 'Cadbury Dairy Milk',
        categories_tags: ['en:chocolates'],
      },
      '9300601234567'
    );
    expect(chain).not.toBeNull();
    expect(chain?.brand_id).toBe('B0241');
    expect(chain?.parent_id).toBe('P0009');
    expect(chain?.source).toBe('identity_resolution');
  });

  it('umbrella Cadbury chocolate stays B0067 when UAT bridge off; opt-in bridge → B0241', () => {
    const { aData, brandRows, aliasRows, brandChildRows } = loadFrozenADataMaps();
    const base = {
      barcode: '9300601234568',
      productName: 'Cadbury Chocolate Block',
      product: {
        barcode: '9300601234568',
        brands: 'Cadbury',
        product_name: 'Cadbury Chocolate Block',
        categories_tags: ['en:chocolates'],
      } as any,
      aData,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
      brandChildRows,
    };
    const without = resolveReviewedRetailChainUnified({ ...base, applyCadburyUatBridge: false });
    expect(without?.brand_id).toBe('B0067');
    const withBridge = resolveReviewedRetailChainUnified({ ...base, applyCadburyUatBridge: true });
    expect(withBridge?.brand_id).toBe('B0241');
  });

  it('Ritz cracker resolves to B0069 — not bridged to B0241', () => {
    const chain = resolveChain(
      {
        barcode: '9310123456789',
        brands: 'Ritz',
        product_name: 'Ritz Original Crackers',
        categories_tags: ['en:biscuits-and-crackers'],
      },
      '9310123456789'
    );
    expect(chain?.brand_id).toBe('B0069');
    expect(chain?.source).toBe('identity_resolution');
  });

  it('KitKat: Nestlé-only brands + KitKat in product_name resolves to B0060 (not umbrella B0066)', () => {
    const logs: string[] = [];
    const chain = resolveChain(
      {
        barcode: '9300605012345',
        brands: 'Nestlé',
        product_name: 'KitKat Chunky Milk Chocolate',
        categories_tags: ['en:chocolates'],
      },
      '9300605012345',
      logs
    );
    expect(chain?.brand_id).toBe('B0060');
    expect(chain?.parent_id).toBe('P0008');
    expect(logs.some((l) => l.includes('brand_id=B0060') && l.includes('parent_id=P0008'))).toBe(true);
  });

  it('Kit Kat (spaced) product_name resolves to B0060 via reviewed alias leading phrase', () => {
    const chain = resolveChain(
      {
        barcode: '9300605012346',
        brands: 'Nestlé',
        product_name: 'Kit Kat Chunky Milk Chocolate',
        categories_tags: ['en:chocolates'],
      },
      '9300605012346'
    );
    expect(chain?.brand_id).toBe('B0060');
    expect(chain?.parent_id).toBe('P0008');
  });

  it('generic_name KitKat alone does not override Nestlé product brand', () => {
    const chain = resolveChain(
      {
        barcode: '9300605012347',
        brands: 'Nestlé',
        product_name: 'Nestlé Sweetened Condensed Milk',
        generic_name: 'KitKat chocolate wafer bar',
      },
      '9300605012347'
    );
    expect(chain?.brand_id).not.toBe('B0060');
    expect(chain?.parent_id).toBe('P0008');
  });

  it('cross-parent product_name refinement cannot override resolved brands-field identity', () => {
    const logs: string[] = [];
    const chain = resolveChain(
      {
        barcode: '9300605012348',
        brands: 'Cadbury',
        product_name: 'KitKat Chunky',
        categories_tags: ['en:chocolates'],
      },
      '9300605012348',
      logs
    );
    expect(chain?.brand_id).toBe('B0067');
    expect(chain?.parent_id).toBe('P0009');
  });

  it('Nestlé condensed-milk title refines to specific brand B0237 (parent Nestlé retained; not KitKat)', () => {
    const chain = resolveChain(
      {
        barcode: '9300605099999',
        brands: 'Nestlé',
        product_name: 'Nestlé Sweetened Condensed Milk',
      },
      '9300605099999'
    );
    expect(chain?.brand_id).toBe('B0237');
    expect(chain?.parent_id).toBe('P0008');
  });

  it('explicit S&B + Japanese Curry Mix fails closed (no Coles MIX inference)', () => {
    const logs: string[] = [];
    const chain = resolveChain(
      {
        barcode: '4901002156565',
        brands: 'S&B',
        product_name: 'Japanese Curry Mix',
      },
      '4901002156565',
      logs
    );
    expect(chain).toBeNull();
    expect(logs.some((l) => l.includes('explicit brand evidence present but unresolved'))).toBe(true);
  });

  it('explicit S&B + Coles Japanese Curry Mix fails closed (no cross-family override)', () => {
    const logs: string[] = [];
    const chain = resolveChain(
      {
        barcode: '4901002156566',
        brands: 'S&B',
        product_name: 'Coles Japanese Curry Mix',
      },
      '4901002156566',
      logs
    );
    expect(chain).toBeNull();
    expect(logs.some((l) => l.includes('explicit brand evidence present but unresolved'))).toBe(true);
  });

  it('no brand field + Japanese Curry Mix does not resolve to MIX', () => {
    const chain = resolveChain(
      {
        barcode: '4901002156565',
        product_name: 'Japanese Curry Mix',
      },
      '4901002156565'
    );
    expect(chain).toBeNull();
  });

  it('no brand field + Mixed Berry does not resolve to MIX', () => {
    const chain = resolveChain(
      {
        barcode: '9300000000888',
        product_name: 'Mixed Berry Yogurt',
      },
      '9300000000888'
    );
    expect(chain).toBeNull();
  });

  it('no brand field + leading MIX resolves B0769 when brands field corroborates at start', () => {
    const chain = resolveChain(
      {
        barcode: '9300000000999',
        product_name: 'MIX Curry Sauce',
      },
      '9300000000999'
    );
    expect(chain?.brand_id).toBe('B0769');
    expect(chain?.parent_id).toBe('P0002');
  });

  it('no brand field + Coles Kitchen leading phrase resolves correctly', () => {
    const chain = resolveChain(
      {
        barcode: '9300000000777',
        product_name: 'Coles Kitchen Tomato Paste',
      },
      '9300000000777'
    );
    expect(chain?.brand_id).toBe('B0202');
    expect(chain?.parent_id).toBe('P0002');
  });

  it('absent brand field preserves product_name-only inference via leading whitelist', () => {
    const chain = resolveChain(
      {
        barcode: '9300601234567',
        product_name: 'Cadbury Dairy Milk',
        categories_tags: ['en:chocolates'],
      },
      '9300601234567'
    );
    expect(chain?.brand_id).toBe('B0241');
  });

  it('explicit Cadbury + Crunchie product name refines to child brand B0244', () => {
    const chain = resolveChain(
      {
        barcode: '9300605099998',
        brands: 'Cadbury',
        product_name: 'Crunchie Bar',
      },
      '9300605099998'
    );
    expect(chain?.brand_id).toBe('B0244');
    expect(chain?.parent_id).toBe('P0009');
  });

  it('trailing canonical phrase collision is rejected (leading brand wins; trailing MIX ignored)', () => {
    const chain = resolveChain(
      {
        barcode: '9300605099997',
        brands: 'Cadbury',
        product_name: 'Cadbury Dairy Milk Bar MIX',
      },
      '9300605099997'
    );
    expect(chain?.brand_id).toBe('B0241');
    expect(chain?.brand_id).not.toBe('B0769');
  });

  it('Coles-family product with brands-field MIX still receives SIG-SR-AU-003 without signal guard', () => {
    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = '1';
    const recs = buildDynamicSignalsAssetRuntimePublicationRecords({
      barcode: '9300000000100',
      productName: 'MIX Curry',
      product: {
        barcode: '9300000000100',
        brands: 'MIX',
        product_name: 'MIX Curry',
      } as any,
      scanMarketPublic: 'AU',
      forceRun: true,
    });
    expect(recs.some((r) => r.signal_id === 'SIG-SR-AU-003')).toBe(true);
  });

  it('S&B Japanese Curry Mix does not receive SIG-SR-AU-003', () => {
    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = '1';
    const recs = buildDynamicSignalsAssetRuntimePublicationRecords({
      barcode: '4901002156565',
      productName: 'Japanese Curry Mix',
      product: {
        barcode: '4901002156565',
        brands: 'S&B',
        product_name: 'Japanese Curry Mix',
      } as any,
      scanMarketPublic: 'AU',
      forceRun: true,
    });
    expect(recs.some((r) => r.signal_id === 'SIG-SR-AU-003')).toBe(false);
  });
});
