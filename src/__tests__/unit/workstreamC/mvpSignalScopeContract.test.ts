import fs from 'fs';
import path from 'path';
import { parseCsv } from '../../../identity/workstreamA/csv';
import {
  buildADataMapsFromCsvRecords,
  buildWorkstreamCPublicationRecordsFromParsedPack,
} from '../../../workstreamC/skeleton/workstreamCPublicationCore';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const A_DATA = path.join(ROOT, 'workstreamA', 'a-data', 'wave1-v0.14', 'input');
const PACK = path.join(ROOT, 'workstreamC', 'c-data', 'v0.4', 'input');

function loadA() {
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

/** Minimal publishable news signal row (in-memory only — does not mutate pack). */
function newsSignal(id: string) {
  return {
    signal_id: id,
    signal_class: 'in_the_news',
    signal_publication_state: 'publishable',
    review_state: 'reviewed',
    confidence_state: 'strong',
    resolution_status: 'resolved_with_warning',
    source_id: 'SRC_TEST',
    source_record_url: 'https://example.test/signal',
    headline: id,
    short_summary: 'test',
    editorial_review_required: 'N',
    editorial_review_state: 'not_required',
  };
}

describe('MVP Signal-scope contract (brand vs parent; dedupe)', () => {
  it('KitKat-scoped brand link qualifies; Nestlé sibling brand does not', () => {
    const { aData, brandRows, aliasRows } = loadA();
    const kitLinks = [
      {
        link_id: 'SL_TEST_KIT',
        signal_id: 'SIG_NEWS_GLOBAL_001',
        subject_type: 'brand',
        subject_id: 'B0060',
        market_key: 'GLOBAL_CONTEXT',
      },
    ];
    const signals = [newsSignal('SIG_NEWS_GLOBAL_001')];

    const kit = buildWorkstreamCPublicationRecordsFromParsedPack({
      links: kitLinks,
      signals,
      uxRows: [],
      aData,
      barcode: '9300650123456',
      productName: 'KitKat Chunky',
      scanMarketPublic: 'AU',
      product: {
        barcode: '9300650123456',
        brands: 'Nestlé',
        product_name: 'KitKat Chunky',
        categories_tags: ['en:chocolates'],
      } as any,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
    });
    expect(kit.map((r) => r.signal_id)).toEqual(['SIG_NEWS_GLOBAL_001']);

    const sibling = buildWorkstreamCPublicationRecordsFromParsedPack({
      links: kitLinks,
      signals,
      uxRows: [],
      aData,
      barcode: '9300605099999',
      productName: 'Nestlé Sweetened Condensed Milk',
      scanMarketPublic: 'AU',
      product: {
        barcode: '9300605099999',
        brands: 'Nestlé',
        product_name: 'Nestlé Sweetened Condensed Milk',
      } as any,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
    });
    expect(sibling).toHaveLength(0);
  });

  it('Nestlé parent-scoped Signal also qualifies for KitKat product (entity-wide path)', () => {
    const { aData, brandRows, aliasRows } = loadA();
    const links = [
      {
        link_id: 'SL_TEST_PARENT',
        signal_id: 'SIG_TEST_NESTLE_ENTITY',
        subject_type: 'parent',
        subject_id: 'P0008',
        market_key: 'GLOBAL_CONTEXT',
      },
    ];
    const logs: string[] = [];
    const recs = buildWorkstreamCPublicationRecordsFromParsedPack({
      links,
      signals: [newsSignal('SIG_TEST_NESTLE_ENTITY')],
      uxRows: [],
      aData,
      barcode: '9300650123456',
      productName: 'KitKat Chunky',
      scanMarketPublic: 'AU',
      product: {
        barcode: '9300650123456',
        brands: 'Nestlé',
        product_name: 'KitKat Chunky',
        categories_tags: ['en:chocolates'],
      } as any,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
      logLines: logs,
    });
    expect(recs.map((r) => r.signal_id)).toEqual(['SIG_TEST_NESTLE_ENTITY']);
    expect(logs.some((l) => l.includes('subject=parent:P0008'))).toBe(true);
  });

  it('same Signal via brand + parent links displays once (dedupe by signal_id)', () => {
    const { aData, brandRows, aliasRows } = loadA();
    const links = [
      {
        link_id: 'SL_BRAND',
        signal_id: 'SIG_NEWS_GLOBAL_001',
        subject_type: 'brand',
        subject_id: 'B0060',
        market_key: 'GLOBAL_CONTEXT',
      },
      {
        link_id: 'SL_PARENT',
        signal_id: 'SIG_NEWS_GLOBAL_001',
        subject_type: 'parent',
        subject_id: 'P0008',
        market_key: 'GLOBAL_CONTEXT',
      },
    ];
    const logs: string[] = [];
    const recs = buildWorkstreamCPublicationRecordsFromParsedPack({
      links,
      signals: [newsSignal('SIG_NEWS_GLOBAL_001')],
      uxRows: [],
      aData,
      barcode: '9300650123456',
      productName: 'KitKat Chunky',
      scanMarketPublic: 'AU',
      product: {
        barcode: '9300650123456',
        brands: 'Nestlé',
        product_name: 'KitKat Chunky',
        categories_tags: ['en:chocolates'],
      } as any,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
      logLines: logs,
    });
    expect(recs).toHaveLength(1);
    expect(recs[0].signal_id).toBe('SIG_NEWS_GLOBAL_001');
    expect(recs[0].dedupe_key).toBe('p6|workstream_c_skeleton|SIG_NEWS_GLOBAL_001|9300650123456');
    expect(logs.some((l) => l.includes('dedupe: skip duplicate signal=SIG_NEWS_GLOBAL_001'))).toBe(true);
  });

  it('pack product_family Alfamino Safety does not fire for KitKat (recall scope)', () => {
    const signals = parseCsv(fs.readFileSync(path.join(PACK, 'signal_records.csv'), 'utf8'));
    const links = parseCsv(fs.readFileSync(path.join(PACK, 'signal_subject_links.csv'), 'utf8'));
    const { aData, brandRows, aliasRows } = loadA();
    const recs = buildWorkstreamCPublicationRecordsFromParsedPack({
      links,
      signals,
      uxRows: [],
      aData,
      barcode: '9300650123456',
      productName: 'KitKat Chunky Milk Chocolate',
      scanMarketPublic: 'AU',
      product: {
        barcode: '9300650123456',
        brands: 'Nestlé',
        product_name: 'KitKat Chunky Milk Chocolate',
        categories_tags: ['en:chocolates'],
      } as any,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
    });
    expect(recs.some((r) => r.signal_id === 'SIG_REG_AU_002')).toBe(false);
    expect(recs.some((r) => r.signal_id === 'SIG_REG_AU_001')).toBe(false);
  });
});
