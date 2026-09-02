/**
 * Founder-locked S12 promotion priority tables.
 *
 * Priority is the deterministic tie-break for equal absolute materiality. Lower number wins.
 * Array order, code order, discovery order and incidental trigger order must never decide
 * promotion (v0.4 §4). Transcribed from:
 *   Body v0.5 §6              → v0.4 §4.1 "Body S12 promotion"
 *   Planet v0.1               → v0.4 §4.2 "Planet S12 promotion"
 *   Ethics v0.1               → v0.4 §4.3 "Ethics S12 promotion"
 *   Open v0.1                 → v0.4 §4.4 "Open S12 promotion"
 *
 * The Body colour-warning cluster is deliberately absent: its priority depends on how many
 * colours fired and is supplied by `bodyColourSynthesisPriority`.
 */

import type { ScoreHighlightPillar } from './types';

/** Locked priority by stable adjustment ID, within that ID's own sign pool. */
const BODY_PRIORITY: Record<string, number> = {
  // Positive pool
  'body-v12-nutri-a': 1, // +7
  'body-v12-nutri-b': 2, // +3
  'body-v12-nova-1-off': 3, // +3
  'body-v12-nova-2': 4, // +1
  // Negative pool (colour cluster occupies 1 / 4 / 9 by fired-colour count)
  'body-v12-nutri-e': 2, // −7
  'body-v12-additive-e250': 3, // −6
  'body-v12-nova-4': 5, // −6
  'body-v12-nutri-d': 6, // −3
  'body-v12-additive-e951': 7, // −3
  'body-v12-additive-e171': 8, // −3
  'body-v12-nova-3': 10, // −1
  'body-v12-nutri-c': 11, // −1
};

const PLANET_PRIORITY: Record<string, number> = {
  // Positive pool
  'planet-v19-environmental-a': 1, // +7
  'planet-v19-environmental-b': 2, // +3
  'planet-v19-packaging-all-kerbside': 3, // +2
  'planet-v19-packaging-some-kerbside': 4, // +1
  // Negative pool
  'planet-v19-environmental-e': 1, // −7
  'planet-v19-environmental-d': 2, // −3
  'planet-v19-environmental-c': 3, // −1
};

const ETHICS_PRIORITY: Record<string, number> = {
  // Positive pool
  'ethics-v37-ktc-91-100': 1, // +10
  'ethics-v37-ktc-81-90': 2, // +8
  'ethics-v37-ktc-71-80': 3, // +6
  'ethics-v37-bbfaw-tier-1': 4, // +6
  'ethics-v37-cert-fairtrade': 5, // +6
  'ethics-v37-cert-rainforest-alliance': 6, // +6
  'ethics-v37-bbfaw-tier-2': 7, // +4
  'ethics-v37-cert-asc': 8, // +4
  'ethics-v37-cert-msc': 9, // +4
  'ethics-v37-bbfaw-impact-ab': 10, // +3
  'ethics-v37-ktc-51-70': 11, // +3
  'ethics-v37-bbfaw-tier-3': 12, // +2
  'ethics-v37-cert-organic': 13, // +2
  'ethics-v37-bbfaw-impact-cd': 14, // +1
  'ethics-v37-bbfaw-tier-4': 15, // +1
  // Negative pool
  'ethics-v37-ktc-0-10': 1, // −10
  'ethics-v37-ktc-11-20': 2, // −8
  'ethics-v37-ktc-21-30': 3, // −6
  'ethics-v37-bbfaw-tier-6': 4, // −6
  'ethics-v37-bbfaw-tier-5': 5, // −4
  'ethics-v37-bbfaw-impact-ef': 6, // −3
  'ethics-v37-ktc-31-50': 7, // −3
};

const OPEN_PRIORITY: Record<string, number> = {
  // Positive pool
  'open-v15-origins-evidently-complete': 1, // +8
  'open-v15-origins-pct-95-99': 2, // +4
  'open-v15-ing-clarity-zero': 3, // +1
  // Negative pool. At the equal −4 tie, origins qualified/unquantified partial outranks
  // two-term ingredient wording (Open v0.1 closing control note).
  'open-v15-origins-packet-gap': 1, // −8
  'open-v15-origins-pct-1-24': 2, // −7
  'open-v15-ing-clarity-three-plus': 3, // −6
  'open-v15-origins-pct-25-49': 4, // −5
  'open-v15-origins-qualified-partial': 5, // −4
  'open-v15-ing-clarity-two': 6, // −4
  'open-v15-origins-pct-50-75': 7, // −3
  'open-v15-ing-clarity-one': 8, // −2
  'open-v15-origins-pct-76-94': 9, // −1
};

const PRIORITY_BY_PILLAR: Record<ScoreHighlightPillar, Record<string, number>> = {
  Body: BODY_PRIORITY,
  Planet: PLANET_PRIORITY,
  Ethics: ETHICS_PRIORITY,
  Open: OPEN_PRIORITY,
};

/** Locked priority for a fired adjustment ID, or null when the contract registers none. */
export function lockedPromotionPriority(
  pillar: ScoreHighlightPillar,
  adjustmentId: string
): number | null {
  const priority = PRIORITY_BY_PILLAR[pillar][adjustmentId];
  return typeof priority === 'number' ? priority : null;
}
