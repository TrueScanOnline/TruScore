/**
 * Consumer-facing pillar names.
 *
 * Post-document founder naming disposition (5 September 2026): Ethics is presented as "Claims"
 * and Open as "Transparency". Body and Planet are unchanged. Internal pillar keys, stable
 * adjustment IDs, scoring registries, S28 diagnostics and persisted analysis all keep the
 * Ethics/Open names — this module is presentation only.
 */

import type { ScoreHighlightPillar } from './types';

const CONSUMER_PILLAR_LABEL: Record<ScoreHighlightPillar, string> = {
  Body: 'Body',
  Planet: 'Planet',
  Ethics: 'Claims',
  Open: 'Transparency',
};

/** Consumer label for an internal pillar key. */
export function consumerPillarLabel(pillar: ScoreHighlightPillar): string {
  return CONSUMER_PILLAR_LABEL[pillar] ?? pillar;
}

/** Every consumer pillar label currently active in-app, in locked render order. */
export const ACTIVE_CONSUMER_PILLAR_LABELS: readonly string[] = [
  CONSUMER_PILLAR_LABEL.Body,
  CONSUMER_PILLAR_LABEL.Planet,
  CONSUMER_PILLAR_LABEL.Ethics,
  CONSUMER_PILLAR_LABEL.Open,
] as const;
