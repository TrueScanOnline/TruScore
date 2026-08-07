/**
 * Food Recall Matcher → Safety publication for Dynamic Signals / Result path.
 * Used when Asset is the active producer (Skeleton path embeds this inside its runtime builder).
 * Generic Asset exact_only matching must never publish these recalls independently.
 */

import type { DynamicSignalPublicationRecord } from '../../dynamicSignals/publish/types';
import {
  createFixedFoodRecallClock,
  evaluateMiloFoodRecallMatch,
  isFoodRecallCorrectedPathEnabled,
  mapFoodRecallMatchToPublicationRecord,
  type FoodRecallSubmittedMarkings,
} from '../../workstreamC/recall';

/**
 * Emits at most one Safety publication record per applicable recall notice (MILO Stage 2 today).
 * Chickadees / Allen's / Pams Lasagne remain non-public until structured recall packs exist.
 */
export function buildFoodRecallSafetyPublicationRecords(input: {
  barcode: string;
  foodRecallMarkings?: FoodRecallSubmittedMarkings | null;
  evaluationClockIso?: string;
  logLines?: string[];
}): DynamicSignalPublicationRecord[] {
  const corrected = isFoodRecallCorrectedPathEnabled();
  input.logLines?.push(`food_recall_corrected_path=${corrected ? '1' : '0'}`);
  if (!corrected) return [];

  const clock = createFixedFoodRecallClock(
    input.evaluationClockIso ?? '2026-08-05T00:00:00.000Z'
  );
  const miloMatch = evaluateMiloFoodRecallMatch({
    gtin: input.barcode,
    markings: input.foodRecallMarkings,
    clock,
    correctedPathEnabled: true,
  });
  input.logLines?.push(
    `food_recall_milo: state=${miloMatch.match_state} reason=${miloMatch.match_reason_code}`
  );
  const rec = mapFoodRecallMatchToPublicationRecord(miloMatch);
  return rec ? [rec] : [];
}
