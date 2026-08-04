/**
 * Stage 2 MVP — food recall matcher tests (MILO + path control + variant batches).
 */

import {
  foodRecallMarkingsEntryVisible,
  foodRecallShowEditDetails,
} from '../../../components/FoodRecallMarkingsEntry';
import { buildProductScanResult } from '../../../services/buildProductScanResult';
import { flattenSignalsOrdered, dedupeSignalCards } from '../../../utils/scanResultPresentation';
import {
  buildWorkstreamCRuntimePublicationRecords,
} from '../../../workstreamC/runtime/workstreamCRuntimePublicationRecords';
import {
  createFixedFoodRecallClock,
  evaluateMiloFoodRecallMatch,
  mapFoodRecallMatchToPublicationRecord,
  MILO_AFFECTED_VARIANTS,
  MILO_POWDER_CONTROL_GTIN,
  MILO_RELATED_FAMILY_GTINS,
  MILO_UNVERIFIED_REAL_CANDIDATE_GTIN,
  MILO_VARIANT_BATCH_CODES,
  publicationStateForGtinVerification,
  type MiloAffectedVariant,
} from '../../../workstreamC/recall';

const DIPPED_270 = MILO_AFFECTED_VARIANTS.find((v) => v.pack_key === 'dipped_270g')!;
const DIPPED_160 = MILO_AFFECTED_VARIANTS.find((v) => v.pack_key === 'dipped_160g')!;
const DIPPED_960 = MILO_AFFECTED_VARIANTS.find((v) => v.pack_key === 'dipped_960g')!;
const ORIGINAL_210 = MILO_AFFECTED_VARIANTS.find((v) => v.pack_key === 'original_210g')!;
const RELATED = MILO_RELATED_FAMILY_GTINS[0].gtin;
const CLOCK = '2026-08-05T12:00:00.000Z';
const BB = { bestBeforeMonth: 8, bestBeforeYear: 2026 };

function scoresOf(barcode: string, brands: string, name: string, markings?: any) {
  process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = '1';
  process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
  const product = {
    barcode,
    product_name: name,
    brands,
    source: 'test',
    trust_score: 55,
    trust_score_breakdown: { body: 14, planet: 13, ethics: 14, open: 14 },
  } as any;
  const recs = buildWorkstreamCRuntimePublicationRecords({
    barcode,
    productName: name,
    product,
    scanMarketPublic: 'AU',
    foodRecallMarkings: markings,
    evaluationClockIso: CLOCK,
  });
  const { result } = buildProductScanResult({
    barcode,
    product,
    userPreferences: { palmOil: true, animalWelfare: true, fairTrade: true, organic: true } as any,
    isSubscriber: false,
    market: 'AU',
    dynamicSignalRecords: recs,
    deriveTerminal: false,
    terminal_state: 'success',
    phase6SignalSourceMode: 'governed_5b_only',
  });
  return { result, recs, flat: dedupeSignalCards(flattenSignalsOrdered(result.signals)) };
}

describe('Stage 2 food recall matcher (MILO)', () => {
  const prevSkel = process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT;
  const prevPath = process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = '1';
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = prevSkel;
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = prevPath;
  });

  it('variant-specific: dipped 270g confirms only its batches', () => {
    for (const batch of MILO_VARIANT_BATCH_CODES.dipped_270g) {
      const m = evaluateMiloFoodRecallMatch({
        gtin: DIPPED_270.gtin,
        markings: { batchCodeRaw: batch, ...BB },
        clock: createFixedFoodRecallClock(CLOCK),
      });
      expect(m.match_state).toBe('confirmed_affected');
      expect(m.recall_variant_id).toBe(DIPPED_270.recall_variant_id);
    }
  });

  it('wrong-pack batch cannot confirm another pack', () => {
    // 5317TD15 is 960g-only — must not confirm 270g
    const wrongOn270 = evaluateMiloFoodRecallMatch({
      gtin: DIPPED_270.gtin,
      markings: { batchCodeRaw: '5317TD15', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(wrongOn270.match_state).toBe('batch_not_listed');
    expect(wrongOn270.match_reason_code).toBe('complete_batch_not_on_this_variant');

    // 5323TD15 is original 210g — must not confirm 160g
    const wrongOn160 = evaluateMiloFoodRecallMatch({
      gtin: DIPPED_160.gtin,
      markings: { batchCodeRaw: '5323TD15', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(wrongOn160.match_state).toBe('batch_not_listed');

    // 5316TD15 is valid on 270g and 160g but not 960g
    const wrongOn960 = evaluateMiloFoodRecallMatch({
      gtin: DIPPED_960.gtin,
      markings: { batchCodeRaw: '5316TD15', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(wrongOn960.match_state).toBe('batch_not_listed');

    // 960g-only batch confirms 960g
    const ok960 = evaluateMiloFoodRecallMatch({
      gtin: DIPPED_960.gtin,
      markings: { batchCodeRaw: '5317TD15', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(ok960.match_state).toBe('confirmed_affected');

    // original 210g
    const ok210 = evaluateMiloFoodRecallMatch({
      gtin: ORIGINAL_210.gtin,
      markings: { batchCodeRaw: '5324TD15', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(ok210.match_state).toBe('confirmed_affected');
  });

  it('batch_check_required: missing / partial / malformed — never batch_not_listed', () => {
    const missing = evaluateMiloFoodRecallMatch({
      gtin: DIPPED_270.gtin,
      markings: null,
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(missing.match_state).toBe('batch_check_required');

    const partial = evaluateMiloFoodRecallMatch({
      gtin: DIPPED_270.gtin,
      markings: { batchCodeRaw: '5316TD15' },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(partial.match_state).toBe('batch_check_required');

    const malformed = evaluateMiloFoodRecallMatch({
      gtin: DIPPED_270.gtin,
      markings: { batchCodeRaw: 'bad batch!', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(malformed.match_state).toBe('batch_check_required');
    expect(malformed.match_state).not.toBe('batch_not_listed');
  });

  it('batch_not_listed: complete nonmatching; no safe claim in copy key', () => {
    const m = evaluateMiloFoodRecallMatch({
      gtin: DIPPED_270.gtin,
      markings: { batchCodeRaw: '9999ZZ99', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(m.match_state).toBe('batch_not_listed');
    expect(m.consumer_message_key).toContain('batch_not_listed');
  });

  it('related_recall_variant_unconfirmed for reviewed non-affected snack-bar GTIN', () => {
    const m = evaluateMiloFoodRecallMatch({
      gtin: RELATED,
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(m.match_state).toBe('related_recall_variant_unconfirmed');
  });

  it('same-GTIN family-advisory → affected-mapping transition without duplicate card key shape', () => {
    const sharedGtin = '9300605190888';
    const asRelated = evaluateMiloFoodRecallMatch({
      gtin: sharedGtin,
      clock: createFixedFoodRecallClock(CLOCK),
      packOverrides: {
        affectedVariants: [],
        relatedFamilyGtins: [
          { gtin: sharedGtin, gtin_verification_status: 'controlled_test_synthetic' },
        ],
      },
    });
    expect(asRelated.match_state).toBe('related_recall_variant_unconfirmed');
    expect(asRelated.dedupe_key).toBe(
      `p6|food_recall|RN_FSANZ_MILO_SNACK_BARS_2026_02|${sharedGtin}`
    );

    const mappedVariant: MiloAffectedVariant = {
      ...DIPPED_270,
      gtin: sharedGtin,
      recall_variant_id: 'RV_MILO_MAPPED_AFTER_REVIEW',
      gtin_verification_status: 'controlled_test_awaiting_external_verification',
    };
    const asAffected = evaluateMiloFoodRecallMatch({
      gtin: sharedGtin,
      markings: { batchCodeRaw: '5316TD15', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
      packOverrides: {
        affectedVariants: [mappedVariant],
        relatedFamilyGtins: [],
      },
    });
    expect(asAffected.match_state).toBe('confirmed_affected');
    expect(asAffected.dedupe_key).toBe(asRelated.dedupe_key);
  });

  it('not_applicable for MILO powder and unverified real candidate (no pack mapping)', () => {
    const powder = evaluateMiloFoodRecallMatch({
      gtin: MILO_POWDER_CONTROL_GTIN,
      markings: { batchCodeRaw: '5316TD15', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(powder.match_state).toBe('not_applicable');

    const candidate = evaluateMiloFoodRecallMatch({
      gtin: MILO_UNVERIFIED_REAL_CANDIDATE_GTIN,
      markings: { batchCodeRaw: '5316TD15', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(candidate.match_state).toBe('not_applicable');
  });

  it('card state replacement without duplicate dedupe_key', () => {
    const a = scoresOf(DIPPED_270.gtin, 'Milo', 'MILO Dipped Snack Bars 270g');
    const b = scoresOf(DIPPED_270.gtin, 'Milo', 'MILO Dipped Snack Bars 270g', {
      batchCodeRaw: '5316TD15',
      ...BB,
    });
    const aKeys = a.flat.filter((c) => c.dedupe_key.startsWith('p6|food_recall|')).map((c) => c.dedupe_key);
    const bKeys = b.flat.filter((c) => c.dedupe_key.startsWith('p6|food_recall|')).map((c) => c.dedupe_key);
    expect(aKeys).toHaveLength(1);
    expect(bKeys).toHaveLength(1);
    expect(aKeys[0]).toBe(bKeys[0]);
  });

  it('corrected path on: suppresses legacy broad MILO (no dual publish)', () => {
    const logs: string[] = [];
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
    const recs = buildWorkstreamCRuntimePublicationRecords({
      barcode: DIPPED_270.gtin,
      productName: 'MILO Dipped Snack Bars 270g',
      product: {
        barcode: DIPPED_270.gtin,
        product_name: 'MILO Dipped Snack Bars 270g',
        brands: 'Milo',
        source: 'test',
      } as any,
      scanMarketPublic: 'AU',
      logLines: logs,
    });
    const milo = recs.filter((r) => r.signal_id === 'SIG_REG_AU_001');
    expect(milo).toHaveLength(1);
    expect(milo[0].dedupe_key.startsWith('p6|food_recall|')).toBe(true);
    expect(logs.some((l) => l.includes('legacy_safety_suppressed: SIG_REG_AU_001'))).toBe(true);
  });

  it('corrected-path off: no MILO Safety card; never restores broad legacy path', () => {
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '0';
    const logs: string[] = [];
    const recs = buildWorkstreamCRuntimePublicationRecords({
      barcode: DIPPED_270.gtin,
      productName: 'MILO Dipped Snack Bars 270g',
      product: {
        barcode: DIPPED_270.gtin,
        product_name: 'MILO Dipped Snack Bars 270g',
        brands: 'Milo',
        source: 'test',
      } as any,
      scanMarketPublic: 'AU',
      logLines: logs,
    });
    expect(recs.some((r) => r.signal_id === 'SIG_REG_AU_001')).toBe(false);
    expect(logs.some((l) => l.includes('legacy_safety_suppressed: SIG_REG_AU_001'))).toBe(true);
    expect(recs.every((r) => !r.dedupe_key.startsWith('p6|food_recall|'))).toBe(true);
  });

  it('Pak n Save Moorhouse held — no broad brand Safety publish', () => {
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
    const recs = buildWorkstreamCRuntimePublicationRecords({
      barcode: '9410000000001',
      productName: "PAK'nSAVE Moorhouse Turkish Bread",
      product: {
        barcode: '9410000000001',
        product_name: "PAK'nSAVE Moorhouse Turkish Bread",
        brands: "PAK'nSAVE",
        source: 'test',
      } as any,
      scanMarketPublic: 'NZ',
    });
    expect(recs.some((r) => r.signal_id === 'SIG_REG_NZ_002')).toBe(false);
  });

  it('Pams / Alfamino unavailable — no broad Safety publish', () => {
    const pams = buildWorkstreamCRuntimePublicationRecords({
      barcode: '9400000000002',
      productName: 'Pams Fresh Milk',
      product: {
        barcode: '9400000000002',
        product_name: 'Pams Fresh Milk',
        brands: 'Pams',
        source: 'test',
      } as any,
      scanMarketPublic: 'NZ',
    });
    expect(pams.some((r) => r.signal_id === 'SIG_REG_NZ_001')).toBe(false);

    const alfa = buildWorkstreamCRuntimePublicationRecords({
      barcode: '9300000000003',
      productName: 'Nestlé Alfamino Infant Formula 400g',
      product: {
        barcode: '9300000000003',
        product_name: 'Nestlé Alfamino Infant Formula 400g',
        brands: 'Nestlé',
        source: 'test',
      } as any,
      scanMarketPublic: 'AU',
    });
    expect(alfa.some((r) => r.signal_id === 'SIG_REG_AU_002')).toBe(false);
  });

  it('Safety ordered before News with both classes present; TruScore unchanged', () => {
    const milo = scoresOf(DIPPED_270.gtin, 'Milo', 'MILO Dipped Snack Bars 270g', {
      batchCodeRaw: '5316TD15',
      ...BB,
    });
    const cadburyRecs = buildWorkstreamCRuntimePublicationRecords({
      barcode: '9300617064879',
      productName: 'Cadbury Dairy Milk Chocolate',
      product: {
        barcode: '9300617064879',
        product_name: 'Cadbury Dairy Milk Chocolate',
        brands: 'Cadbury',
        categories: 'chocolates',
        source: 'test',
      } as any,
      scanMarketPublic: 'AU',
      evaluationClockIso: CLOCK,
    });
    const miloSafety = milo.recs.filter((r) => r.signal_class === 'safety_regulatory');
    const cadburyNews = cadburyRecs.filter((r) => r.signal_class === 'in_the_news');
    expect(miloSafety.length).toBeGreaterThanOrEqual(1);
    expect(cadburyNews.length).toBeGreaterThanOrEqual(1);

    const product = {
      barcode: DIPPED_270.gtin,
      product_name: 'MILO Dipped Snack Bars 270g',
      brands: 'Milo',
      source: 'test',
      trust_score: 55,
      trust_score_breakdown: { body: 14, planet: 13, ethics: 14, open: 14 },
    } as any;
    const { result } = buildProductScanResult({
      barcode: DIPPED_270.gtin,
      product,
      userPreferences: { palmOil: true, animalWelfare: true, fairTrade: true, organic: true } as any,
      isSubscriber: false,
      market: 'AU',
      dynamicSignalRecords: [...miloSafety, ...cadburyNews],
      deriveTerminal: false,
      terminal_state: 'success',
      phase6SignalSourceMode: 'governed_5b_only',
    });
    const flat = dedupeSignalCards(flattenSignalsOrdered(result.signals));
    const order = flat.map((c) => c.class);
    const firstA = order.indexOf('A');
    const firstB = order.indexOf('B');
    expect(firstA).toBeGreaterThanOrEqual(0);
    expect(firstB).toBeGreaterThanOrEqual(0);
    expect(firstA).toBeLessThan(firstB);

    const noMarkings = scoresOf(DIPPED_270.gtin, 'Milo', 'MILO Dipped Snack Bars 270g');
    expect(noMarkings.result.scores?.pillars).toEqual(milo.result.scores?.pillars);
    expect(noMarkings.result.scores?.trust).toBe(milo.result.scores?.trust);
  });

  it('powder does not trigger MILO recall on corrected path', () => {
    const { flat } = scoresOf(MILO_POWDER_CONTROL_GTIN, 'Milo', 'Milo powder');
    expect(flat.some((c) => c.id === 'SIG_REG_AU_001')).toBe(false);
  });

  it('controlled/synthetic GTINs use provisional metadata + uat_only_override', () => {
    const m = evaluateMiloFoodRecallMatch({
      gtin: DIPPED_270.gtin,
      markings: { batchCodeRaw: '5316TD15', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    const rec = mapFoodRecallMatchToPublicationRecord(m)!;
    expect(rec.state).toEqual(publicationStateForGtinVerification('controlled_test_synthetic'));
    expect(rec.state.review_state).toBe('provisional');
    expect(rec.state.confidence_state).not.toBe('confirmed');
    expect(rec.food_recall?.uat_only_override).toBe(true);
    expect(rec.food_recall?.gtin_verification_status).toBe('controlled_test_synthetic');
  });

  it('form reset / edit-details visibility helpers', () => {
    expect(
      foodRecallMarkingsEntryVisible({ needsBatchEntry: true, editing: false })
    ).toBe(true);
    expect(
      foodRecallMarkingsEntryVisible({ needsBatchEntry: false, editing: true })
    ).toBe(true);
    expect(
      foodRecallMarkingsEntryVisible({ needsBatchEntry: false, editing: false })
    ).toBe(false);

    expect(
      foodRecallShowEditDetails({
        matchState: 'batch_not_listed',
        editing: false,
        needsBatchEntry: false,
      })
    ).toBe(true);
    expect(
      foodRecallShowEditDetails({
        matchState: 'confirmed_affected',
        editing: false,
        needsBatchEntry: false,
      })
    ).toBe(true);
    expect(
      foodRecallShowEditDetails({
        matchState: 'batch_not_listed',
        editing: true,
        needsBatchEntry: false,
      })
    ).toBe(false);
    // Re-check path: after Edit, entry visible again
    expect(
      foodRecallMarkingsEntryVisible({ needsBatchEntry: false, editing: true })
    ).toBe(true);
  });

  it('barcode change clears parent markings contract (no stale cross-product markings)', () => {
    // Simulates Result screen effect: markings and editing reset when barcode changes
    let markings: { batchCodeRaw: string } | null = { batchCodeRaw: '5316TD15' };
    let editing = true;
    const onBarcodeChange = () => {
      markings = null;
      editing = false;
    };
    onBarcodeChange();
    expect(markings).toBeNull();
    expect(editing).toBe(false);
  });
});
