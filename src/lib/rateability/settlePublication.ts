/**
 * Cross-pillar settlement orchestrator (§15).
 */

import type { Product } from '../../types/product';
import type { BodyPillarResult } from '../truscoreEngine/pillars/bodyPillar';
import type { PlanetPillarResult } from '../truscoreEngine/pillars/planetPillar';
import type { EthicsPillarResult } from '../truscoreEngine/pillars/ethicsPillar';
import type { OpenPillarResult } from '../truscoreEngine/pillars/openPillar';
import { publishBodyPillar } from './bodyPublication';
import { publishPlanetPillar } from './planetPublication';
import { publishClaimsPillar } from './claimsPublication';
import { publishTransparencyPillar } from './transparencyPublication';
import { publishOverall } from './overallPublication';
import type {
  AuthoritativeLaneOverrides,
  CrossPillarPublicationSnapshot,
  PillarPublicationResult,
} from './types';

export interface SettlePublicationInput {
  product: Product;
  body: BodyPillarResult;
  planet: PlanetPillarResult;
  ethics: EthicsPillarResult;
  open: OpenPillarResult;
  /** Sum of four pillar scores (existing Overall arithmetic). */
  overallInternalScore: number;
  /**
   * When false, all pillars/Overall remain `checking` (first-paint barrier).
   * When true, Rateability/Confidence/S26 resolve atomically.
   */
  settled: boolean;
  authoritative?: AuthoritativeLaneOverrides;
}

export function settleCrossPillarPublication(
  input: SettlePublicationInput
): CrossPillarPublicationSnapshot {
  const checking = !input.settled;
  const body = publishBodyPillar({
    product: input.product,
    body: input.body,
    checking,
    authoritative: input.authoritative,
  });
  const planet = publishPlanetPillar({
    product: input.product,
    planet: input.planet,
    checking,
    authoritative: input.authoritative,
  });
  const claims = publishClaimsPillar({
    product: input.product,
    ethics: input.ethics,
    checking,
    authoritative: input.authoritative,
  });
  const transparency = publishTransparencyPillar({
    product: input.product,
    open: input.open,
    checking,
    authoritative: input.authoritative,
  });
  const overall = publishOverall({
    body,
    planet,
    claims,
    transparency,
    internalOverallScore: input.overallInternalScore,
    checking,
  });

  return {
    settled: input.settled,
    body,
    planet,
    claims,
    transparency,
    overall,
  };
}

/** Consumer-facing Overall Confidence label for W3-S11 (Rated only). */
export function overallConfidenceLabel(
  overall: Pick<PillarPublicationResult, 'publicationStatus' | 'confidence'>
): 'High confidence' | 'Moderate confidence' | 'Limited confidence' | null {
  if (overall.publicationStatus !== 'rated' || !overall.confidence) return null;
  if (overall.confidence === 'high') return 'High confidence';
  if (overall.confidence === 'moderate') return 'Moderate confidence';
  return 'Limited confidence';
}

/** Display score helper: em dash when not rated. */
export function publishedScoreDisplay(publishedScore: number | null | undefined): string {
  if (typeof publishedScore === 'number' && Number.isFinite(publishedScore)) {
    return String(publishedScore);
  }
  return '—';
}
