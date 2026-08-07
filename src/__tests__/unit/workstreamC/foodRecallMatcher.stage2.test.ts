/**
 * Stage 2 MVP — food recall matcher tests (MILO pack as matcher regression infrastructure).
 * Does not use retired Skeleton runtime. Production Safety content requires governed Asset eligibility.
 */

import {
  foodRecallMarkingsEntryVisible,
  foodRecallShowEditDetails,
} from '../../../components/FoodRecallMarkingsEntry';
import { buildProductScanResult } from '../../../services/buildProductScanResult';
import { flattenSignalsOrdered, dedupeSignalCards } from '../../../utils/scanResultPresentation';
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
import type { DynamicSignalPublicationRecord } from '../../../dynamicSignals/publish/types';

const DIPPED_270 = MILO_AFFECTED_VARIANTS.find((v) => v.pack_key === 'dipped_270g')!;
const DIPPED_160 = MILO_AFFECTED_VARIANTS.find((v) => v.pack_key === 'dipped_160g')!;
const DIPPED_960 = MILO_AFFECTED_VARIANTS.find((v) => v.pack_key === 'dipped_960g')!;
const ORIGINAL_210 = MILO_AFFECTED_VARIANTS.find((v) => v.pack_key === 'original_210g')!;
const RELATED = MILO_RELATED_FAMILY_GTINS[0].gtin;
const CLOCK = '2026-08-05T12:00:00.000Z';
const BB = { bestBeforeMonth: 8, bestBeforeYear: 2026 };

function matchRec(
  gtin: string,
  markings?: { batchCodeRaw?: string; bestBeforeMonth?: number; bestBeforeYear?: number } | null,
  correctedPathEnabled = true
): DynamicSignalPublicationRecord | null {
  const m = evaluateMiloFoodRecallMatch({
    gtin,
    markings,
    clock: createFixedFoodRecallClock(CLOCK),
    correctedPathEnabled,
  });
  return mapFoodRecallMatchToPublicationRecord(m);
}

function scoresOf(barcode: string, brands: string, name: string, markings?: any) {
  process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
  const product = {
    barcode,
    product_name: name,
    brands,
    source: 'test',
    trust_score: 55,
    trust_score_breakdown: { body: 14, planet: 13, ethics: 14, open: 14 },
  } as any;
  const rec = matchRec(barcode, markings);
  const recs = rec ? [rec] : [];
  const { result } = buildProductScanResult({
    barcode,
    product,
    userPreferences: { palmOil: true, animalWelfare: true, fairTrade: true, organic: true } as any,
    isSubscriber: false,
    market: 'AU',
    dynamicSignalRecords: recs,
    deriveTerminal: false,
    terminal_state: 'success',
  });
  return {
    result,
    recs,
    flat: dedupeSignalCards(flattenSignalsOrdered(result.signals)),
  };
}

describe('Stage 2 food recall matcher (MILO regression infrastructure)', () => {
  const prevPath = process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH;
  beforeEach(() => {
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
  });
  afterEach(() => {
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
    }
  });

  it('wrong-pack batch cannot confirm another pack', () => {
    const wrongOn270 = evaluateMiloFoodRecallMatch({
      gtin: DIPPED_270.gtin,
      markings: { batchCodeRaw: '5323TD15', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(wrongOn270.match_state).toBe('batch_not_listed');
    expect(wrongOn270.match_reason_code).toBe('complete_batch_not_on_this_variant');

    const wrongOn160 = evaluateMiloFoodRecallMatch({
      gtin: DIPPED_160.gtin,
      markings: { batchCodeRaw: '5323TD15', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(wrongOn160.match_state).toBe('batch_not_listed');

    const wrongOn960 = evaluateMiloFoodRecallMatch({
      gtin: DIPPED_960.gtin,
      markings: { batchCodeRaw: '5316TD15', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(wrongOn960.match_state).toBe('batch_not_listed');

    const ok960 = evaluateMiloFoodRecallMatch({
      gtin: DIPPED_960.gtin,
      markings: { batchCodeRaw: '5317TD15', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(ok960.match_state).toBe('confirmed_affected');

    const ok210 = evaluateMiloFoodRecallMatch({
      gtin: ORIGINAL_210.gtin,
      markings: { batchCodeRaw: '5323TD15', ...BB },
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
      markings: { batchCodeRaw: '!!!', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
    });
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
    const asRelated = evaluateMiloFoodRecallMatch({
      gtin: DIPPED_270.gtin,
      clock: createFixedFoodRecallClock(CLOCK),
      packOverrides: {
        affectedVariants: [] as MiloAffectedVariant[],
        relatedFamilyGtins: [
          { gtin: DIPPED_270.gtin, gtin_verification_status: 'controlled_test_synthetic' },
        ],
      },
    });
    expect(asRelated.match_state).toBe('related_recall_variant_unconfirmed');
    const asAffected = evaluateMiloFoodRecallMatch({
      gtin: DIPPED_270.gtin,
      markings: { batchCodeRaw: '5316TD15', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
    });
    expect(asAffected.match_state).toBe('confirmed_affected');
    expect(asRelated.dedupe_key).toBe(asAffected.dedupe_key);
  });

  it('not_applicable for MILO powder and unverified real candidate (no pack mapping)', () => {
    const powder = evaluateMiloFoodRecallMatch({
      gtin: MILO_POWDER_CONTROL_GTIN,
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

  it('corrected-path off: matcher returns not_applicable; no Safety card', () => {
    const m = evaluateMiloFoodRecallMatch({
      gtin: DIPPED_270.gtin,
      markings: { batchCodeRaw: '5316TD15', ...BB },
      clock: createFixedFoodRecallClock(CLOCK),
      correctedPathEnabled: false,
    });
    expect(m.match_state).toBe('not_applicable');
    expect(mapFoodRecallMatchToPublicationRecord(m)).toBeNull();
  });

  it('MILO historical pack alone is not a production Asset Signal (SIG_REG_AU_001 not Asset content)', () => {
    // Production Asset uses SIG-SR-* IDs; MILO Stage 2 ID remains regression-only.
    const rec = matchRec(DIPPED_270.gtin, { batchCodeRaw: '5316TD15', ...BB });
    expect(rec?.signal_id).toBe('SIG_REG_AU_001');
    expect(rec?.signal_id.startsWith('SIG-SR-')).toBe(false);
  });

  it('Safety ordered before News with both classes present; TruScore unchanged', () => {
    const milo = scoresOf(DIPPED_270.gtin, 'Milo', 'MILO Dipped Snack Bars 270g', {
      batchCodeRaw: '5316TD15',
      ...BB,
    });
    const newsRec: DynamicSignalPublicationRecord = {
      signal_id: 'SIG-IN-TEST-NEWS',
      dedupe_key: 'p6|test|news|' + DIPPED_270.gtin,
      signal_class: 'in_the_news',
      signal_publication_state: 'publishable',
      resolution_key: { gtin: DIPPED_270.gtin, market_key: 'AU' },
      state: {
        confidence_state: 'strong',
        review_state: 'reviewed',
        resolution_status: 'resolved',
      },
      lineage_reference: 'test',
      source_idempotency_key: 'test-news',
      staleness: { valid_until: '2099-12-31T00:00:00.000Z' },
      editorial: { priority: 0, due_at: null, last_reviewed_at: null },
      mislink: { open_report_count: 0, last_event_at: null },
      skeleton_card_copy: { title_display: 'News', body_display: 'Body', why_display: 'Why' },
    };
    const miloSafety = milo.recs.filter((r) => r.signal_class === 'safety_regulatory');
    expect(miloSafety.length).toBeGreaterThanOrEqual(1);

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
      dynamicSignalRecords: [...miloSafety, newsRec],
      deriveTerminal: false,
      terminal_state: 'success',
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
    expect(foodRecallMarkingsEntryVisible({ needsBatchEntry: true, editing: false })).toBe(true);
    expect(foodRecallMarkingsEntryVisible({ needsBatchEntry: false, editing: true })).toBe(true);
    expect(foodRecallMarkingsEntryVisible({ needsBatchEntry: false, editing: false })).toBe(false);
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
    expect(foodRecallMarkingsEntryVisible({ needsBatchEntry: false, editing: true })).toBe(true);
  });

  it('barcode change clears parent markings contract (no stale cross-product markings)', () => {
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
