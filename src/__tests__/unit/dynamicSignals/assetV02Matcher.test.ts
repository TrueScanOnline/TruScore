import fs from 'fs';
import path from 'path';
import { parseCsv, type CsvRecord } from '../../../identity/workstreamA/csv';
import {
  buildDynamicSignalsAssetPublicationRecords,
  requiresFoodRecallMatcherEligibility,
  type AssetPackParsed,
} from '../../../dynamicSignals/asset/v0.2/matchDynamicSignalsAsset';
import { buildDynamicSignalsAssetRuntimePublicationRecords } from '../../../dynamicSignals/asset/v0.2/buildDynamicSignalsAssetRuntimePublicationRecords';
import { buildAssetGovernedFoodRecallPublicationRecords } from '../../../dynamicSignals/asset/v0.2/buildAssetGovernedFoodRecallPublicationRecords';
import { buildProductScanResult } from '../../../services/buildProductScanResult';
import { flattenSignalsOrdered, dedupeSignalCards } from '../../../utils/scanResultPresentation';
import { resolveReviewedRetailChainUnified } from '../../../workstreamC/skeleton/resolveWorkstreamCRetailChain';
import { buildADataMapsFromCsvRecords } from '../../../workstreamC/skeleton/workstreamCPublicationCore';
import { resolveActiveSignalsProducer } from '../../../dynamicSignals/asset/v0.2/signalsProducerGuard';
import { isPublicationRecordPubliclyRenderable } from '../../../signals/signalRenderMapping';
import {
  MILO_AFFECTED_VARIANTS,
  MILO_SIGNAL_ID,
} from '../../../workstreamC/recall/miloRecallPack';
import {
  loadAssetPackFromRoots,
  readCsvFile,
  withProductScopeCriteria,
} from './_assetPackTestHelpers';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const PACK = path.join(ROOT, 'workstreamC', 'c-data', 'dynamic-signals-v0.2', 'input');
const CRITERIA_V03 = path.join(
  ROOT,
  'workstreamC',
  'c-data',
  'dynamic-signals-v0.3',
  'input',
  'signal_target_product_criteria.csv'
);
const FAM = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.2');
const A_DATA = path.join(ROOT, 'workstreamA', 'a-data', 'wave1-v0.15', 'input');

function loadBasePack(criteria?: CsvRecord[]): AssetPackParsed {
  const pack = loadAssetPackFromRoots({
    packRoot: PACK,
    famRoot: FAM,
    // v0.2 pack has no criteria file â€” reuse migrated v0.3 criteria keyed by TGT-* ids.
    signalTargetProductCriteria: criteria ?? readCsvFile(CRITERIA_V03),
  });
  return pack;
}

function withPublishable(signals: CsvRecord[], ids: string[]): CsvRecord[] {
  const set = new Set(ids);
  return signals.map((s) =>
    set.has(s.signal_id ?? '')
      ? {
          ...s,
          signal_publication_state: 'publishable',
          review_state: 'reviewed',
          editorial_review_required: 'FALSE',
          editorial_review_state: 'not_required',
        }
      : s
  );
}

function loadA() {
  const brandRows = parseCsv(fs.readFileSync(path.join(A_DATA, 'canonical_brands.csv'), 'utf8'));
  const parentRows = parseCsv(fs.readFileSync(path.join(A_DATA, 'canonical_parents.csv'), 'utf8'));
  const aliasRows = parseCsv(fs.readFileSync(path.join(A_DATA, 'brand_aliases.csv'), 'utf8'));
  return {
    aData: buildADataMapsFromCsvRecords(brandRows, parentRows, []),
    brandRows,
    aliasRows,
  };
}

describe('Dynamic Signals Asset v0.2 â€” remediation matcher', () => {
  const prevAsset = process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET;
  const prevSkel = process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT;
  afterEach(() => {
    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = prevAsset;
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = prevSkel;
  });

  it('pack row counts match founder asset (13/14/16/25)', () => {
    const pack = loadBasePack();
    expect(pack.sources).toHaveLength(13);
    expect(pack.signals).toHaveLength(16);
    expect(pack.targets).toHaveLength(25);
  });

  it('candidate Signals do not render publicly even when product-scope would match', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      targets: pack.targets.map((t) =>
        t.signal_target_id === 'TGT-009' ? { ...t, resolution_status: 'resolved' } : t
      ),
    };
    const logs: string[] = [];
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300000000999',
        brand_id: 'B0179',
        parent_id: 'P0041',
        productName: "Leggo's Tomato Paste 140g",
        scanMarketPublic: 'AU',
      },
      logLines: logs,
      includeNonPublishable: false,
    });
    expect(recs.some((r) => r.signal_id === 'SIG-IN-AU-001')).toBe(false);
    expect(logs.some((l) => l.includes('candidate_hold'))).toBe(true);
  });

  it('founder-authorised UAT Signals are publishable in pack', () => {
    const pack = loadBasePack();
    const ids = ['SIG-SR-AU-003', 'SIG-IN-GL-001', 'SIG-IN-GL-002', 'SIG-IN-NZ-005'];
    for (const id of ids) {
      const s = pack.signals.find((r) => r.signal_id === id)!;
      expect(s.signal_publication_state).toBe('publishable');
      expect(s.review_state).toBe('reviewed');
    }
    expect(pack.signals.find((r) => r.signal_id === 'SIG-IN-AU-001')?.signal_publication_state).toBe(
      'candidate'
    );
  });

  it('positive publish lifecycle: resolved reviewed Signal reaches publishable with target resolution_status', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-GL-001']),
    };
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300601234567',
        brand_id: 'B0067',
        parent_id: 'P0009',
        productName: 'Cadbury Chocolate',
        scanMarketPublic: 'AU',
      },
    });
    expect(recs).toHaveLength(1);
    expect(recs[0].signal_publication_state).toBe('publishable');
    expect(recs[0].state.resolution_status).toBe('resolved');
    expect(isPublicationRecordPubliclyRenderable(recs[0])).toBe(true);

    const { result } = buildProductScanResult({
      barcode: '9300601234567',
      product: { barcode: '9300601234567', brands: 'Cadbury', source: 'test', trust_score: 40 } as any,
      userPreferences: {} as any,
      isSubscriber: false,
      market: 'AU',
      terminal_state: 'success',
      dynamicSignalRecords: recs,
    });
    const flat = dedupeSignalCards(flattenSignalsOrdered(result.signals));
    expect(flat.some((c) => c.id === 'SIG-IN-GL-001')).toBe(true);
  });

  it('Stage 2 matcher gating is retired: Safety product targets publish through ordinary Asset matching', () => {
    expect(
      requiresFoodRecallMatcherEligibility('safety_regulatory', 'product', 'exact_only')
    ).toBe(false);
    expect(
      requiresFoodRecallMatcherEligibility('safety_regulatory', 'product_family', 'family_members')
    ).toBe(false);

    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-SR-AU-002']),
      targets: pack.targets.map((t) =>
        t.signal_target_id === 'TGT-005' ? { ...t, resolution_status: 'resolved' } : t
      ),
    };
    const logs: string[] = [];
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9312345678901',
        brand_id: 'B0059',
        parent_id: 'P0008',
        productName: "Allen's iNSiDE OUTS",
        scanMarketPublic: 'AU',
      },
      logLines: logs,
    });
    const card = recs.find((r) => r.signal_id === 'SIG-SR-AU-002');
    expect(card).toBeTruthy();
    expect(card!.signal_class).toBe('safety_regulatory');
    expect(logs.some((l) => l.includes('food_recall_matcher_required'))).toBe(false);
  });

  it('exact-product positive for non-Safety News still works; sibling negative', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-SR-AU-003']),
      targets: pack.targets.map((t) =>
        t.signal_target_id === 'TGT-008' ? { ...t, resolution_status: 'resolved' } : t
      ),
    };
    const hit = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300000000100',
        brand_id: 'B0013',
        parent_id: 'P0002',
        productName: 'Coles Own Brand Item',
        scanMarketPublic: 'AU',
      },
    });
    expect(hit.map((r) => r.signal_id)).toContain('SIG-SR-AU-003');
    expect(hit[0].state.resolution_status).toBe('resolved');
  });

  it('product_family scope: tomato-paste product names match; unrelated Leggo product does not', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-AU-001']),
      targets: pack.targets.map((t) =>
        t.signal_target_id === 'TGT-009' ? { ...t, resolution_status: 'resolved' } : t
      ),
    };

    for (const name of ["Leggo's Tomato Paste 140g", "Leggo's Tomato Paste 500g"]) {
      const recs = buildDynamicSignalsAssetPublicationRecords({
        pack,
        identity: {
          barcode: '9411111111111',
          brand_id: 'B0179',
          parent_id: 'P0041',
          productName: name,
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
        productName: "Leggo's Pasta Sauce Traditional",
        scanMarketPublic: 'AU',
      },
    });
    expect(outsider).toHaveLength(0);
  });

  it('unreviewed product-scope criteria cannot match', () => {
    const seeded = readCsvFile(CRITERIA_V03).map((r) =>
      (r.signal_target_id ?? '') === 'TGT-009' ? { ...r, review_state: 'seeded' } : r
    );
    let pack = withProductScopeCriteria(loadBasePack([]), seeded);
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-AU-001']),
      targets: pack.targets.map((t) =>
        t.signal_target_id === 'TGT-009' ? { ...t, resolution_status: 'resolved' } : t
      ),
    };
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9411111111111',
        brand_id: 'B0179',
        parent_id: 'P0041',
        productName: "Leggo's Tomato Paste 140g",
        scanMarketPublic: 'AU',
      },
    });
    expect(recs).toHaveLength(0);
  });

  it('Cadbury-wide Signal inherits to Dairy Milk via brand_child_of_brand; Ritz does not', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-GL-001']),
    };
    const dairyMilk = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300601234567',
        brand_id: 'B0241',
        parent_id: 'P0009',
        productName: 'Cadbury Dairy Milk',
        scanMarketPublic: 'AU',
      },
    });
    expect(dairyMilk.map((r) => r.signal_id)).toContain('SIG-IN-GL-001');

    const ritz = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9310123456789',
        brand_id: 'B0069',
        parent_id: 'P0009',
        productName: 'Ritz Crackers',
        scanMarketPublic: 'AU',
      },
    });
    expect(ritz.some((r) => r.signal_id === 'SIG-IN-GL-001')).toBe(false);
  });

  it('Dairy Milk-only Signal (B0241) does not fire for umbrella Cadbury brand alone', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-GL-002']),
    };
    const cadburyOnly = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300601234568',
        brand_id: 'B0067',
        parent_id: 'P0009',
        productName: 'Cadbury Chocolate',
        scanMarketPublic: 'AU',
      },
    });
    expect(cadburyOnly.some((r) => r.signal_id === 'SIG-IN-GL-002')).toBe(false);

    const dairyMilk = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300601234567',
        brand_id: 'B0241',
        parent_id: 'P0009',
        productName: 'Cadbury Dairy Milk Chocolate',
        scanMarketPublic: 'AU',
      },
    });
    expect(dairyMilk.map((r) => r.signal_id)).toContain('SIG-IN-GL-002');
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
        productName: 'Coles Own Brand Item',
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
        productName: 'Nestle Product',
        scanMarketPublic: 'AU',
      },
    });
    expect(nestleSoldAtColes.some((r) => r.signal_id === 'SIG-SR-AU-003')).toBe(false);
  });

  it('Skeleton flag retired: Asset-only producer guard (legacy Skeleton flag ignored)', () => {
    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = '1';
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = '1';
    const logs: string[] = [];
    expect(resolveActiveSignalsProducer(logs)).toBe('asset');
    expect(logs.some((l) => l.includes('retired') || l.includes('Skeleton'))).toBe(true);

    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = '0';
    const logs2: string[] = [];
    expect(resolveActiveSignalsProducer(logs2)).toBe('none');
  });

  it('AU/NZ market isolation for product-scope criteria', () => {
    let pack = loadBasePack();
    pack = {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-IN-AU-001']),
      targets: pack.targets.map((t) =>
        t.signal_target_id === 'TGT-009' ? { ...t, resolution_status: 'resolved' } : t
      ),
    };
    const nzLeak = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9411111111111',
        brand_id: 'B0179',
        parent_id: 'P0041',
        productName: "Leggo's Tomato Paste 140g",
        scanMarketPublic: 'NZ',
      },
    });
    expect(nzLeak.some((r) => r.signal_id === 'SIG-IN-AU-001')).toBe(false);
  });

  it('needs_review targets fail closed', () => {
    const pack = loadBasePack();
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack: { ...pack, signals: withPublishable(pack.signals, ['SIG-SR-AU-001']) },
      identity: {
        barcode: 'any',
        brand_id: null,
        parent_id: null,
        productName: '',
        scanMarketPublic: 'AU',
      },
    });
    expect(recs.some((r) => r.signal_id === 'SIG-SR-AU-001')).toBe(false);
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
        productName: 'Cadbury Chocolate',
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

  it('Finding B retired: GTINâ†’brand scaffold is not used for ownership resolution', () => {
    const { aData, brandRows, aliasRows } = loadA();
    const aData2 = {
      ...aData,
      gtinRows: new Map(aData.gtinRows),
    };
    // Even if a GTIN row were injected, active Chaining must not consult it.
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
    expect(chain).toBeNull();
    expect(logs.some((l) => l.includes('gtin_link'))).toBe(false);
    expect(logs.some((l) => l.includes('gtin_link_supplementary'))).toBe(false);
  });
});

/**
 * MVP recall doctrine (22 Sep 2026): a governed Safety Signal displays when the scanned
 * product line matches after Chaining. Affected pack size, batch, date and retailer are
 * card qualification content carried by the Signal's own editorial copy.
 */
describe('Dynamic Signals Asset v0.2 — MVP Safety recall path', () => {
  const prevAsset = process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET;
  const prevSkel = process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT;
  const prevRecall = process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH;

  afterEach(() => {
    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = prevAsset;
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = prevSkel;
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = prevRecall;
  });

  /** SIG-SR-AU-002 / TGT-005: Allen's iNSiDE OUTS, AU, brand B0059 / parent P0008. */
  function safetyPack(): AssetPackParsed {
    const pack = loadBasePack();
    return {
      ...pack,
      signals: withPublishable(pack.signals, ['SIG-SR-AU-002']),
      targets: pack.targets.map((t) =>
        t.signal_target_id === 'TGT-005' ? { ...t, resolution_status: 'resolved' } : t
      ),
    };
  }

  function runScan(input: {
    productName: string;
    market: 'AU' | 'NZ';
    barcode?: string;
    logs?: string[];
  }) {
    return buildDynamicSignalsAssetRuntimePublicationRecords({
      barcode: input.barcode ?? '9312345678901',
      productName: input.productName,
      scanMarketPublic: input.market,
      injectedBrandId: 'B0059',
      injectedParentId: 'P0008',
      pack: safetyPack(),
      forceRun: true,
      logLines: input.logs,
    });
  }

  it('product-line match publishes one Safety card using the Signal editorial copy', () => {
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
    const recs = runScan({ productName: "Allen's iNSiDE OUTS 130g", market: 'AU' });
    const safety = recs.filter((r) => r.signal_id === 'SIG-SR-AU-002');
    expect(safety).toHaveLength(1);
    expect(safety[0].skeleton_card_copy?.title_display).toBe("Recall: Allen's iNSiDE OUTS 130g");
    expect(safety[0].skeleton_card_copy?.body_display).toContain('may contain plastic');
    expect(safety[0].skeleton_card_copy?.why_display).toContain('Only the 130g product');
  });

  it('no batch/date markings are required, and no batch entry is ever requested', () => {
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
    const card = runScan({ productName: "Allen's iNSiDE OUTS 130g", market: 'AU' }).find(
      (r) => r.signal_id === 'SIG-SR-AU-002'
    );
    expect(card).toBeTruthy();
    expect(card!.food_recall?.needs_batch_entry).toBeFalsy();
    expect(card!.food_recall?.match_state).toBeUndefined();
  });

  it('absence of batch, date or pack size does not suppress a relevant recall', () => {
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
    for (const productName of ["Allen's iNSiDE OUTS", "Allen's iNSiDE OUTS 130g"]) {
      const recs = runScan({ productName, market: 'AU' });
      expect(recs.some((r) => r.signal_id === 'SIG-SR-AU-002')).toBe(true);
    }
  });

  it('sibling product line does not fire', () => {
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
    const recs = runScan({ productName: "Allen's Party Mix 190g", market: 'AU' });
    expect(recs.some((r) => r.signal_id === 'SIG-SR-AU-002')).toBe(false);
  });

  it('wrong market does not fire', () => {
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
    const recs = runScan({ productName: "Allen's iNSiDE OUTS 130g", market: 'NZ' });
    expect(recs.some((r) => r.signal_id === 'SIG-SR-AU-002')).toBe(false);
  });

  it('Stage 2 recall overlay contributes nothing and records its supersession', () => {
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
    const logs: string[] = [];
    runScan({ productName: "Allen's iNSiDE OUTS 130g", market: 'AU', logs });
    expect(logs.some((l) => l.includes('mvp_recall: stage2_matcher_retired'))).toBe(true);

    expect(
      buildAssetGovernedFoodRecallPublicationRecords({
        pack: safetyPack(),
        barcode: '9312345678901',
        scanMarketPublic: 'AU',
      })
    ).toHaveLength(0);
  });

  it('Asset disabled → no production Safety Signal', () => {
    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = '0';
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = '0';
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
    const recs = buildDynamicSignalsAssetRuntimePublicationRecords({
      barcode: '9312345678901',
      productName: "Allen's iNSiDE OUTS 130g",
      scanMarketPublic: 'AU',
    });
    expect(recs).toHaveLength(0);
  });

  it('historical MILO pack cannot originate a production Signal', () => {
    process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET = '1';
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = '0';
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
    const recs = buildDynamicSignalsAssetRuntimePublicationRecords({
      barcode: MILO_AFFECTED_VARIANTS[0].gtin,
      productName: 'MILO Dipped',
      scanMarketPublic: 'AU',
      pack: loadBasePack(),
      forceRun: true,
    });
    expect(recs.some((r) => r.signal_id === MILO_SIGNAL_ID)).toBe(false);
    expect(recs.some((r) => r.signal_id === 'SIG_REG_AU_001')).toBe(false);
  });
});

