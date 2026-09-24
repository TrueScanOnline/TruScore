/**
 * Planet publication / Confidence (§5).
 * Packaging is a narrow fallback; Green-Score does not require packaging coexistence.
 */

import type { Product } from '../../types/product';
import type { PlanetPillarResult } from '../truscoreEngine/pillars/planetPillar';
import { formatS26Explanation } from './s26Copy';
import { defaultProductSourceQuality } from './sourceQuality';
import type {
  AuthoritativeLaneOverrides,
  ConfidenceLevel,
  PlanetLaneState,
  PlanetPublicationResult,
  PlanetS26Code,
} from './types';

function hasUsableGreenScore(product: Product, planet: PlanetPillarResult): boolean {
  if (planet.details.hasEcoScoreGrade) {
    const g = (planet.details.ecoscoreGrade || product.ecoscore_grade || '').toLowerCase();
    return g === 'a' || g === 'b' || g === 'c' || g === 'd' || g === 'e';
  }
  const g = (product.ecoscore_grade || '').toLowerCase();
  return g === 'a' || g === 'b' || g === 'c' || g === 'd' || g === 'e';
}

function packagingFallbackScored(planet: PlanetPillarResult): boolean {
  const pts = planet.details.packagingFallbackPoints;
  return pts === 1 || pts === 2;
}

export function publishPlanetPillar(args: {
  product: Product;
  planet: PlanetPillarResult;
  checking?: boolean;
  authoritative?: AuthoritativeLaneOverrides;
}): PlanetPublicationResult {
  const { product, planet, checking, authoritative } = args;
  const sourceQuality = defaultProductSourceQuality(product);
  const broad: PlanetLaneState = hasUsableGreenScore(product, planet) ? 'resolved' : 'unassessed';
  const packaging: PlanetLaneState = packagingFallbackScored(planet) ? 'resolved' : 'unassessed';

  if (checking) {
    return {
      publicationStatus: 'checking',
      internalScore: planet.score,
      publishedScore: null,
      confidence: null,
      sourceQuality,
      s26: null,
      confidenceReasonCode: 'checking',
      assessmentLanes: { broad_environment: broad, packaging_fallback: packaging },
      diagnostic: { broad, packaging },
    };
  }

  if (broad === 'unassessed' && packaging === 'unassessed') {
    return {
      publicationStatus: 'nr',
      internalScore: planet.score,
      publishedScore: null,
      confidence: null,
      sourceQuality,
      s26: {
        code: 'PLANET_NR',
        copyStatus: 'provisional_awaiting_founder_approval',
        explanation: formatS26Explanation('PLANET_NR'),
        // Planet gaps: no contribution CTA (§10)
        contributionOpportunity: {
          material: false,
          domain: null,
          routeStatus: 'none',
        },
      },
      confidenceReasonCode: 'planet_nr',
      assessmentLanes: { broad_environment: broad, packaging_fallback: packaging },
      diagnostic: { broad, packaging },
    };
  }

  let confidence: ConfidenceLevel;
  let code: PlanetS26Code;
  let reason: string;

  if (broad === 'resolved') {
    if (authoritative?.planetBroadEnvironment) {
      confidence = 'high';
      code = 'PLANET_HIGH';
      reason = 'planet_broad_authoritative';
    } else {
      // Current OFF Green-Score route resolves Moderate from evidence/method profile (§5)
      confidence = 'moderate';
      code = 'PLANET_MODERATE';
      reason = 'planet_off_green_score_moderate';
    }
  } else {
    confidence = 'limited';
    code = 'PLANET_LIMITED_PACKAGING';
    reason = 'planet_packaging_fallback_only';
  }

  return {
    publicationStatus: 'rated',
    internalScore: planet.score,
    publishedScore: planet.score,
    confidence,
    sourceQuality,
    s26: {
      code,
      copyStatus: 'provisional_awaiting_founder_approval',
      explanation: formatS26Explanation(code),
      contributionOpportunity: {
        material: false,
        domain: null,
        routeStatus: 'none',
      },
    },
    confidenceReasonCode: reason,
    assessmentLanes: { broad_environment: broad, packaging_fallback: packaging },
    diagnostic: {
      broad,
      packaging,
      packagingFallbackPoints: planet.details.packagingFallbackPoints ?? null,
      ecoscoreGrade: planet.details.ecoscoreGrade ?? product.ecoscore_grade ?? null,
    },
  };
}
