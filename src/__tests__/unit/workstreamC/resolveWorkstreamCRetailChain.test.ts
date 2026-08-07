import path from 'path';
import fs from 'fs';
import { parseCsv } from '../../../identity/workstreamA/csv';
import { buildADataMapsFromCsvRecords } from '../../../workstreamC/skeleton/workstreamCPublicationCore';
import { isChocolateOrCocoaContext, resolveReviewedRetailChainUnified } from '../../../workstreamC/skeleton/resolveWorkstreamCRetailChain';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const A_DATA = path.join(ROOT, 'workstreamA', 'a-data', 'wave1-v0.14', 'input');

function loadFrozenADataMaps() {
  const brandRows = parseCsv(fs.readFileSync(path.join(A_DATA, 'canonical_brands.csv'), 'utf8'));
  const parentRows = parseCsv(fs.readFileSync(path.join(A_DATA, 'canonical_parents.csv'), 'utf8'));
  const gtinRows = parseCsv(fs.readFileSync(path.join(A_DATA, 'gtin_brand_links.csv'), 'utf8'));
  const aliasRows = parseCsv(fs.readFileSync(path.join(A_DATA, 'brand_aliases.csv'), 'utf8'));
  return {
    aData: buildADataMapsFromCsvRecords(brandRows, parentRows, gtinRows),
    brandRows,
    aliasRows,
  };
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

  it('Cadbury Dairy Milk product_name refines to reviewed child brand B0241 (not UAT bridge)', () => {
    const { aData, brandRows, aliasRows } = loadFrozenADataMaps();
    const chain = resolveReviewedRetailChainUnified({
      barcode: '9300601234567',
      productName: 'Cadbury Dairy Milk',
      product: {
        barcode: '9300601234567',
        brands: 'Cadbury',
        product_name: 'Cadbury Dairy Milk',
        categories_tags: ['en:chocolates'],
      } as any,
      aData,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
      applyCadburyUatBridge: false,
    });
    expect(chain).not.toBeNull();
    expect(chain?.brand_id).toBe('B0241');
    expect(chain?.parent_id).toBe('P0009');
    expect(chain?.source).toBe('identity_resolution');
  });

  it('umbrella Cadbury chocolate stays B0067 when UAT bridge off; opt-in bridge → B0241', () => {
    const { aData, brandRows, aliasRows } = loadFrozenADataMaps();
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
    };
    const without = resolveReviewedRetailChainUnified({ ...base, applyCadburyUatBridge: false });
    expect(without?.brand_id).toBe('B0067');
    const withBridge = resolveReviewedRetailChainUnified({ ...base, applyCadburyUatBridge: true });
    expect(withBridge?.brand_id).toBe('B0241');
  });

  it('Ritz cracker resolves to B0069 — not bridged to B0241', () => {
    const { aData, brandRows, aliasRows } = loadFrozenADataMaps();
    const chain = resolveReviewedRetailChainUnified({
      barcode: '9310123456789',
      productName: 'Ritz Original',
      product: {
        barcode: '9310123456789',
        brands: 'Ritz',
        product_name: 'Ritz Original Crackers',
        categories_tags: ['en:biscuits-and-crackers'],
      } as any,
      aData,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
    });
    expect(chain?.brand_id).toBe('B0069');
    expect(chain?.source).toBe('identity_resolution');
  });

  it('KitKat: Nestlé-only brands + KitKat in product_name resolves to B0060 (not umbrella B0066)', () => {
    const { aData, brandRows, aliasRows } = loadFrozenADataMaps();
    const logs: string[] = [];
    const chain = resolveReviewedRetailChainUnified({
      barcode: '9300605012345',
      productName: 'KitKat Chunky Milk Chocolate',
      product: {
        barcode: '9300605012345',
        brands: 'Nestlé',
        product_name: 'KitKat Chunky Milk Chocolate',
        categories_tags: ['en:chocolates'],
      } as any,
      aData,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
      logLines: logs,
    });
    expect(chain?.brand_id).toBe('B0060');
    expect(chain?.parent_id).toBe('P0008');
    expect(logs.some((l) => l.includes('brand_id=B0060') && l.includes('parent_id=P0008'))).toBe(true);
  });

  it('Kit Kat (spaced) product_name resolves to B0060 via reviewed alias compact match', () => {
    const { aData, brandRows, aliasRows } = loadFrozenADataMaps();
    const chain = resolveReviewedRetailChainUnified({
      barcode: '9300605012346',
      productName: 'Kit Kat Chunky Milk Chocolate',
      product: {
        barcode: '9300605012346',
        brands: 'Nestlé',
        product_name: 'Kit Kat Chunky Milk Chocolate',
        categories_tags: ['en:chocolates'],
      } as any,
      aData,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
    });
    expect(chain?.brand_id).toBe('B0060');
    expect(chain?.parent_id).toBe('P0008');
  });

  it('generic_name KitKat alone does not override Nestlé product brand', () => {
    const { aData, brandRows, aliasRows } = loadFrozenADataMaps();
    const chain = resolveReviewedRetailChainUnified({
      barcode: '9300605012347',
      productName: 'Nestlé Sweetened Condensed Milk',
      product: {
        barcode: '9300605012347',
        brands: 'Nestlé',
        product_name: 'Nestlé Sweetened Condensed Milk',
        generic_name: 'KitKat chocolate wafer bar',
      } as any,
      aData,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
    });
    // Specific same-entity brand from product_name is fine; KitKat via generic_name must not win.
    expect(chain?.brand_id).not.toBe('B0060');
    expect(chain?.parent_id).toBe('P0008');
  });

  it('ambiguous cross-parent brands-field vs product_name refinement fails closed', () => {
    const { aData, brandRows, aliasRows } = loadFrozenADataMaps();
    const logs: string[] = [];
    const chain = resolveReviewedRetailChainUnified({
      barcode: '9300605012348',
      productName: 'KitKat Chunky',
      product: {
        barcode: '9300605012348',
        brands: 'Cadbury',
        product_name: 'KitKat Chunky',
        categories_tags: ['en:chocolates'],
      } as any,
      aData,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
      logLines: logs,
    });
    expect(chain).toBeNull();
    expect(logs.some((l) => l.includes('fail_closed'))).toBe(true);
  });

  it('Nestlé condensed-milk title refines to specific brand B0237 (parent Nestlé retained; not KitKat)', () => {
    const { aData, brandRows, aliasRows } = loadFrozenADataMaps();
    const chain = resolveReviewedRetailChainUnified({
      barcode: '9300605099999',
      productName: 'Nestlé Sweetened Condensed Milk',
      product: {
        barcode: '9300605099999',
        brands: 'Nestlé',
        product_name: 'Nestlé Sweetened Condensed Milk',
      } as any,
      aData,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
    });
    expect(chain?.brand_id).toBe('B0237');
    expect(chain?.parent_id).toBe('P0008');
  });
});
