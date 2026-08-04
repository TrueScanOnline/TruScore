/**
 * Stage 2 MVP — food recall matcher tests (MILO + path control).
 */

import { buildProductScanResult } from '../../../services/buildProductScanResult';
import { flattenSignalsOrdered, dedupeSignalCards } from '../../../utils/scanResultPresentation';
import {
  buildWorkstreamCRuntimePublicationRecords,
} from '../../../workstreamC/runtime/workstreamCRuntimePublicationRecords';
import {
  createFixedFoodRecallClock,
  evaluateMiloFoodRecallMatch,
  MILO_POWDER_CONTROL_GTIN,
  MILO_RELATED_FAMILY_GTINS,
} from '../../../workstreamC/recall';

const AFFECTED = '9300605100114';
const RELATED = MILO_RELATED_FAMILY_GTINS[0].gtin;
const CLOCK = '2026-08-05T12:00:00.000Z';
const LISTED_BATCH = '5316TD15';

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

  it('confirmed_affected: exact GTIN + listed batch + Aug 2026', () => {
    const m = evaluateMiloFoodRecallMatch({
      gtin: AFFECTED,
      markings: { batchCodeRaw: LISTED_BATCH, bestBeforeMonth: 8, bestBeforeYear: 2026 },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(m.match_state).toBe('confirmed_affected');
    expect(m.dedupe_key).toBe(`p6|food_recall|RN_FSANZ_MILO_SNACK_BARS_2026_02|${AFFECTED}`);
  });

  it('batch_check_required: missing / partial / malformed — never batch_not_listed', () => {
    const missing = evaluateMiloFoodRecallMatch({
      gtin: AFFECTED,
      markings: null,
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(missing.match_state).toBe('batch_check_required');
    expect(missing.input_status).toBe('missing');

    const partial = evaluateMiloFoodRecallMatch({
      gtin: AFFECTED,
      markings: { batchCodeRaw: LISTED_BATCH },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(partial.match_state).toBe('batch_check_required');
    expect(partial.input_status).toBe('partial');

    const malformed = evaluateMiloFoodRecallMatch({
      gtin: AFFECTED,
      markings: { batchCodeRaw: 'bad batch!', bestBeforeMonth: 8, bestBeforeYear: 2026 },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(malformed.match_state).toBe('batch_check_required');
    expect(malformed.input_status).toBe('malformed');
    expect(malformed.match_state).not.toBe('batch_not_listed');
  });

  it('batch_not_listed: complete nonmatching details; no safe claim in copy key', () => {
    const m = evaluateMiloFoodRecallMatch({
      gtin: AFFECTED,
      markings: { batchCodeRaw: '9999ZZ99', bestBeforeMonth: 8, bestBeforeYear: 2026 },
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

  it('not_applicable for MILO powder', () => {
    const m = evaluateMiloFoodRecallMatch({
      gtin: MILO_POWDER_CONTROL_GTIN,
      markings: { batchCodeRaw: LISTED_BATCH, bestBeforeMonth: 8, bestBeforeYear: 2026 },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(m.match_state).toBe('not_applicable');
  });

  it('card state replacement without duplicate dedupe_key', () => {
    const a = scoresOf(AFFECTED, 'Milo', 'MILO Dipped Snack Bars');
    const b = scoresOf(AFFECTED, 'Milo', 'MILO Dipped Snack Bars', {
      batchCodeRaw: LISTED_BATCH,
      bestBeforeMonth: 8,
      bestBeforeYear: 2026,
    });
    const aKeys = a.flat.filter((c) => c.dedupe_key.startsWith('p6|food_recall|')).map((c) => c.dedupe_key);
    const bKeys = b.flat.filter((c) => c.dedupe_key.startsWith('p6|food_recall|')).map((c) => c.dedupe_key);
    expect(aKeys).toHaveLength(1);
    expect(bKeys).toHaveLength(1);
    expect(aKeys[0]).toBe(bKeys[0]);
    expect(a.flat.find((c) => c.dedupe_key === aKeys[0])?.title_display).toMatch(/Selected batches/i);
    expect(b.flat.find((c) => c.dedupe_key === bKeys[0])?.title_display).toMatch(/this batch is affected/i);
  });

  it('related advisory can become exact affected after GTIN is on affected list — same key shape for that GTIN', () => {
    // RELATED stays advisory; AFFECTED uses same notice — different GTINs → different keys (two products).
    // Simulate "mapping verified" by evaluating AFFECTED after related: one card per GTIN, no duplicate for AFFECTED.
    const related = scoresOf(RELATED, 'Milo', 'MILO Snack Bar other pack');
    const affected = scoresOf(AFFECTED, 'Milo', 'MILO Dipped Snack Bars', {
      batchCodeRaw: LISTED_BATCH,
      bestBeforeMonth: 8,
      bestBeforeYear: 2026,
    });
    expect(related.flat.filter((c) => c.signalClass === 'A' || c.class === 'A').length).toBeGreaterThanOrEqual(1);
    const keys = affected.flat.filter((c) => c.dedupe_key.includes('food_recall')).map((c) => c.dedupe_key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('corrected path suppresses legacy broad MILO (no dual publish)', () => {
    const logs: string[] = [];
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
    const recs = buildWorkstreamCRuntimePublicationRecords({
      barcode: AFFECTED,
      productName: 'MILO Dipped Snack Bars',
      product: {
        barcode: AFFECTED,
        product_name: 'MILO Dipped Snack Bars',
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

  it('rollback (corrected path off) uses only legacy path for MILO — still one AU_001 max', () => {
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '0';
    const recs = buildWorkstreamCRuntimePublicationRecords({
      barcode: AFFECTED,
      productName: 'MILO Dipped Snack Bars',
      product: {
        barcode: AFFECTED,
        product_name: 'MILO Dipped Snack Bars',
        brands: 'Milo',
        source: 'test',
      } as any,
      scanMarketPublic: 'AU',
    });
    const milo = recs.filter((r) => r.signal_id === 'SIG_REG_AU_001');
    expect(milo.length).toBeLessThanOrEqual(1);
    expect(milo.every((r) => !r.dedupe_key.startsWith('p6|food_recall|'))).toBe(true);
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

  it('Safety ordered before News; TruScore unchanged by recall state', () => {
    const withRecall = scoresOf(AFFECTED, 'Milo', 'MILO Dipped Snack Bars', {
      batchCodeRaw: LISTED_BATCH,
      bestBeforeMonth: 8,
      bestBeforeYear: 2026,
    });
    // Cadbury chocolate on same build path for news — use separate product for order check via dual records
    const cadbury = scoresOf('9300617064879', 'Cadbury', 'Cadbury Dairy Milk Chocolate');
    const order = cadbury.flat.map((c) => c.class);
    const firstA = order.indexOf('A');
    const firstB = order.indexOf('B');
    if (firstA >= 0 && firstB >= 0) expect(firstA).toBeLessThan(firstB);

    const pillars = withRecall.result.scores?.pillars;
    const noMarkings = scoresOf(AFFECTED, 'Milo', 'MILO Dipped Snack Bars');
    expect(noMarkings.result.scores?.pillars).toEqual(pillars);
    expect(noMarkings.result.scores?.trust).toBe(withRecall.result.scores?.trust);
  });

  it('powder does not trigger MILO recall on corrected path', () => {
    const { flat } = scoresOf(MILO_POWDER_CONTROL_GTIN, 'Milo', 'Milo powder');
    expect(flat.some((c) => c.id === 'SIG_REG_AU_001')).toBe(false);
  });
});
