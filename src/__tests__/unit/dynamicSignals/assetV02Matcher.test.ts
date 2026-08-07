import fs from 'fs';
import path from 'path';
import { parseCsv, type CsvRecord } from '../../../identity/workstreamA/csv';
import { buildProductFamilyMapsFromCsvRecords } from '../../../identity/chaining/productFamilyMaps';
import {
  buildDynamicSignalsAssetPublicationRecords,
  type AssetPackParsed,
} from '../../../dynamicSignals/asset/v0.2/matchDynamicSignalsAsset';
import { buildProductScanResult } from '../../../services/buildProductScanResult';
import { flattenSignalsOrdered, dedupeSignalCards } from '../../../utils/scanResultPresentation';
import { resolveReviewedRetailChainUnified } from '../../../workstreamC/skeleton/resolveWorkstreamCRetailChain';
import { buildADataMapsFromCsvRecords } from '../../../workstreamC/skeleton/workstreamCPublicationCore';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const PACK = path.join(ROOT, 'workstreamC', 'c-data', 'dynamic-signals-v0.2', 'input');
const FAM = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.1');
const A_DATA = path.join(ROOT, 'workstreamA', 'a-data', 'wave1-v0.14', 'input');

function loadBasePack(): AssetPackParsed {
  const read = (p: string) => parseCsv(fs.readFileSync(p, 'utf8'));
  return {
    sources: read(path.join(PACK, 'source_universe.csv')),
    signals: read(path.join(PACK, 'signals.csv')),
    targets: read(path.join(PACK, 'signal_targets.csv')),
    familyMaps: buildProductFamilyMapsFromCsvRecords(
      read(path.join(FAM, 'product_families.csv')),
      read(path.join(FAM, 'product_family_membership.csv'))
    ),
  };
}

function withPublishable(signals: CsvRecord[], ids: string[]): CsvRecord[] {
  const set = new Set(ids);
  return signals.map((s) =>
    set.has(s.signal_id ?? '')
      ? {
          ...s,
          signal_publication_state: 'publishable',
          review_state: 'reviewed',
          editorial_review_state: 'approved',
        }
      : s
  );
}

function withMembership(
  pack: AssetPackParsed,
  rows: { gtin: string; family_id: string; market_key: string }[]
): AssetPackParsed {
  const membership: CsvRecord[] = rows.map((r, i) => ({
    membership_id: `M_TEST_${i}`,
    product_family_id: r.family_id,
    gtin: r.gtin,
    market_key: r.market_key,
    review_state: 'reviewed',
    confidence_state: 'strong',
    effective_from: '2026-01-01',
    effective_to: '',
    lineage_reference: 'test',
    notes: 'test fixture only',
  }));
  const familyRows = parseCsv(fs.readFileSync(path.join(FAM, 'product_families.csv'), 'utf8')).map((f) =>
    rows.some((r) => r.family_id === f.product_family_id) ? { ...f, review_state: 'reviewed' } : f
  );
  return {
    ...pack,
    familyMaps: buildProductFamilyMapsFromCsvRecords(familyRows, membership),
  };
}

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

describe('Dynamic Signals Asset v0.2 — target matcher', () => {
  it('pack row counts match founder asset (13/14/16/25)', () => {
    const pack = loadBasePack();
    expect(pack.sources).toHaveLength(13);
    expect(pack.signals).toHaveLength(16);
    expect(pack.targets).toHaveLength(25);
    expect(parseCsv(fs.readFileSync(path.join(PACK, 'reveal_domains.csv'), 'utf8'))).toHaveLength(14);
  });

  it('candidate Signals do not render publicly even when target would match', () => {
    const pack = loadBasePack();
    const logs: string[] = [];
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300000000001',
        brand_id: 'B0067',
        parent_id: 'P0009',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
      logLines: logs,
      includeNonPublishable: false,
    });
    expect(recs).toHaveLength(0);
    expect(logs.some((l) => l.includes('candidate_hold'))).toBe(true);

    const { result } = buildProductScanResult({
      barcode: '9300000000001',
      product: { barcode: '9300000000001', brands: 'Cadbury', source: 'test' } as any,
      userPreferences: {} as any,
      isSubscriber: false,
      market: 'AU',
      terminal_state: 'success',
      dynamicSignalRecords: recs,
    });
    const flat = dedupeSignalCards(flattenSignalsOrdered(result.signals));
    expect(flat).toHaveLength(0);
  });

  it('exact-product positive and sibling negative', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-SR-AU-002']),
      targets: pack.targets.map((t) =>
        t.signal_target_id === 'TGT-005'
          ? {
              ...t,
              canonical_target_id: '9312345678901',
              resolution_status: 'resolved',
            }
          : t
      ),
    };
    const hit = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9312345678901',
        brand_id: 'B0059',
        parent_id: 'P0008',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(hit.map((r) => r.signal_id)).toEqual(['SIG-SR-AU-002']);

    const miss = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9312345678999',
        brand_id: 'B0059',
        parent_id: 'P0008',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(miss).toHaveLength(0);
  });

  it('family_members: multiple pack sizes inherit; outsider does not', () => {
    let pack = loadBasePack();
    pack = withMembership(pack, [
      { gtin: '9411111111111', family_id: 'PF_LEGGOS_TOMATO_PASTE_AU', market_key: 'AU' },
      { gtin: '9411111111112', family_id: 'PF_LEGGOS_TOMATO_PASTE_AU', market_key: 'AU' },
    ]);
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-AU-001']),
      targets: pack.targets.map((t) =>
        t.signal_target_id === 'TGT-009' ? { ...t, resolution_status: 'resolved' } : t
      ),
    };

    for (const gtin of ['9411111111111', '9411111111112']) {
      const recs = buildDynamicSignalsAssetPublicationRecords({
        pack,
        identity: {
          barcode: gtin,
          brand_id: 'B0179',
          parent_id: 'P0041',
          product_family_ids: [],
          scanMarketPublic: 'AU',
        },
      });
      expect(recs.map((r) => r.signal_id)).toEqual(['SIG-IN-AU-001']);
    }

    const outsider = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9499999999999',
        brand_id: 'B0179',
        parent_id: 'P0041',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(outsider).toHaveLength(0);
  });

  it('brand_descendants: Cadbury inherits cocoa Signal; Ritz sibling does not', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-GL-001']),
    };
    const cadbury = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300601234567',
        brand_id: 'B0067',
        parent_id: 'P0009',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(cadbury.map((r) => r.signal_id)).toContain('SIG-IN-GL-001');

    const ritz = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9310123456789',
        brand_id: 'B0069',
        parent_id: 'P0009',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(ritz.some((r) => r.signal_id === 'SIG-IN-GL-001')).toBe(false);
  });

  it('entity_descendants: Coles own-label inherits; third-party stocked brand does not', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-SR-AU-003']),
      targets: pack.targets.map((t) =>
        t.signal_target_id === 'TGT-008' ? { ...t, resolution_status: 'resolved' } : t
      ),
    };
    const colesOwn = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300000000100',
        brand_id: 'B0013',
        parent_id: 'P0002',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(colesOwn.map((r) => r.signal_id)).toContain('SIG-SR-AU-003');

    const nestleSoldAtColes = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300000000101',
        brand_id: 'B0066',
        parent_id: 'P0008',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    expect(nestleSoldAtColes.some((r) => r.signal_id === 'SIG-SR-AU-003')).toBe(false);
  });

  it('AU/NZ market isolation', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-GL-001']),
    };
    const nz = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9410000000001',
        brand_id: 'B0067',
        parent_id: 'P0009',
        product_family_ids: [],
        scanMarketPublic: 'NZ',
      },
    });
    // TGT-014 is AU-only; TGT-015 is NZ — NZ scan should match NZ target
    expect(nz.map((r) => r.signal_id)).toContain('SIG-IN-GL-001');

    const auOnlyFamily = withPublishable(loadBasePack().signals, ['SIG-IN-AU-001']);
    let packAu = {
      ...loadBasePack(),
      signals: auOnlyFamily,
      targets: loadBasePack().targets.map((t) =>
        t.signal_target_id === 'TGT-009' ? { ...t, resolution_status: 'resolved' } : t
      ),
    };
    packAu = withMembership(packAu, [
      { gtin: '9411111111111', family_id: 'PF_LEGGOS_TOMATO_PASTE_AU', market_key: 'AU' },
    ]);
    const nzLeak = buildDynamicSignalsAssetPublicationRecords({
      pack: packAu,
      identity: {
        barcode: '9411111111111',
        brand_id: 'B0179',
        parent_id: 'P0041',
        product_family_ids: ['PF_LEGGOS_TOMATO_PASTE_AU'],
        scanMarketPublic: 'NZ',
      },
    });
    expect(nzLeak.some((r) => r.signal_id === 'SIG-IN-AU-001')).toBe(false);
  });

  it('needs_review / blocked targets fail closed', () => {
    const pack = loadBasePack();
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack: { ...pack, signals: withPublishable(pack.signals, ['SIG-SR-AU-001']) },
      identity: {
        barcode: 'any',
        brand_id: null,
        parent_id: null,
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
      includeNonPublishable: true,
    });
    // Chickadees targets remain needs_review with empty canonical ids
    expect(recs.some((r) => r.signal_id === 'SIG-SR-AU-001')).toBe(false);
  });

  it('two distinct Signals are not incorrectly deduped', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-GL-001', 'SIG-IN-GL-002']),
    };
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300601234567',
        brand_id: 'B0241',
        parent_id: 'P0009',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    // B0241 matches Cadbury Dairy Milk target for GL-002; B0067 needed for GL-001 — only GL-002
    expect(recs.map((r) => r.signal_id)).toEqual(['SIG-IN-GL-002']);

    const both = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300601234567',
        brand_id: 'B0067',
        parent_id: 'P0009',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    // Only GL-001 for B0067 (GL-002 targets B0241)
    expect(both.map((r) => r.signal_id)).toEqual(['SIG-IN-GL-001']);
  });

  it('no TruScore mutation when Asset records attach', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-GL-001']),
    };
    const product = {
      barcode: '9300601234567',
      brands: 'Cadbury',
      product_name: 'Cadbury Chocolate',
      source: 'test',
      trust_score: 55,
      trust_score_breakdown: { body: 14, planet: 13, ethics: 14, open: 14 },
    } as any;
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300601234567',
        brand_id: 'B0067',
        parent_id: 'P0009',
        product_family_ids: [],
        scanMarketPublic: 'AU',
      },
    });
    const { result } = buildProductScanResult({
      barcode: '9300601234567',
      product,
      userPreferences: {} as any,
      isSubscriber: false,
      market: 'AU',
      terminal_state: 'success',
      dynamicSignalRecords: recs,
    });
    expect(result.scores?.trust).toBe(55);
    expect(result.scores?.pillars).toEqual({ body: 14, planet: 13, ethics: 14, open: 14 });
  });

  it('Finding B: reviewed GTIN supplementary when product identity fails', () => {
    const { aData, brandRows, aliasRows } = loadA();
    // Use a barcode that has reviewed gtin link — wave1 only has provisional; inject into maps
    const aData2 = {
      ...aData,
      gtinRows: new Map(aData.gtinRows),
    };
    aData2.gtinRows.set('9990001112223', {
      brand_id: 'B0060',
      parent_id: 'P0008',
      link_review_state: 'reviewed',
    });
    const logs: string[] = [];
    const chain = resolveReviewedRetailChainUnified({
      barcode: '9990001112223',
      productName: 'Unknown Mystery Bar',
      product: {
        barcode: '9990001112223',
        brands: '',
        product_name: 'Unknown Mystery Bar',
      } as any,
      aData: aData2,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
      logLines: logs,
      applyCadburyUatBridge: false,
    });
    expect(chain?.brand_id).toBe('B0060');
    expect(chain?.parent_id).toBe('P0008');
    expect(logs.some((l) => l.includes('gtin_link_supplementary'))).toBe(true);
  });

  it('production Asset path does not apply Cadbury UAT bridge', () => {
    const { aData, brandRows, aliasRows } = loadA();
    const chain = resolveReviewedRetailChainUnified({
      barcode: '9300601234567',
      productName: 'Cadbury Dairy Milk Chocolate',
      product: {
        barcode: '9300601234567',
        brands: 'Cadbury',
        product_name: 'Cadbury Dairy Milk Chocolate',
        categories_tags: ['en:chocolates'],
      } as any,
      aData,
      canonicalBrandRows: brandRows,
      brandAliasRows: aliasRows,
      applyCadburyUatBridge: false,
    });
    // Without bridge: Dairy Milk alias still refines to B0241 via product_name — that is governed alias refine, not UAT bridge
    expect(chain?.brand_id).toBe('B0241');
    expect(chain?.parent_id).toBe('P0009');

    const plainCadbury = resolveReviewedRetailChainUnified({
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
      applyCadburyUatBridge: false,
    });
    expect(plainCadbury?.brand_id).toBe('B0067');
  });
});
