/**
 * Planet Pillar — Planet_Scoring_Specification_v19 + Packaging Jurisdiction Annex v2.
 *
 * Base 15. Eco-Score: A +7, B +3, C −1, D −3, E −7 (only when `ecoscore_grade` is a–e).
 * If Eco-Score applies, packaging is not scored separately.
 * Packaging Fallback (+2 / +1 / 0) runs only when Eco-Score grade is absent.
 * Palm oil: display only in MVP — 0 Planet adjustment (per spec).
 * Final score clamped 0–25.
 */

import { Product } from '../../../types/product';
import { logger } from '../../../utils/logger';
import { powershellLogger } from '../../../utils/powershellLogger';
import { computePackagingFallback, packagingConsumerDispositionKey } from './planetPackagingFallback';
import {
  PLANET_V19_ADJUSTMENT_REGISTRY,
  planetV19EnvironmentalGradeAdjustmentId,
  planetV19PackagingFallbackAdjustmentId,
  type PlanetV19AdjustmentFamily,
  type PlanetV19AdjustmentId,
} from './planetPillarV19Registry';

const SPEC_LABEL = 'Planet_Scoring_Specification_v19';
const ANNEX_LABEL = 'Planet_v19_Packaging_Jurisdiction_Rules_Annex_v2';

/** Structured, non-arithmetic context carried alongside a fired adjustment (S12/S28 commentary binding). */
export type PlanetPillarAdjustmentMetadata = Record<string, string | number | boolean>;

export interface PlanetPillarAdjustment {
  id: PlanetV19AdjustmentId;
  description: string;
  value: number;
  type: 'positive' | 'negative' | 'neutral';
  highlightEligible: boolean;
  family: PlanetV19AdjustmentFamily;
  metadata?: PlanetPillarAdjustmentMetadata;
}

export interface PlanetPillarResult {
  score: number;
  base: number;
  adjustments: PlanetPillarAdjustment[];
  details: {
    specVersion: typeof SPEC_LABEL;
    annexVersion: typeof ANNEX_LABEL;
    hasEcoScoreGrade: boolean;
    ecoscoreGrade?: string;
    ecoscoreAdjustment?: number;
    packagingFallbackPoints?: number;
    packagingJurisdiction?: string;
    palmOilPlanetAdjustment: 0;
  };
}

function isValidEcoScoreGrade(g: unknown): g is 'a' | 'b' | 'c' | 'd' | 'e' {
  if (typeof g !== 'string') return false;
  const x = g.toLowerCase();
  return x === 'a' || x === 'b' || x === 'c' || x === 'd' || x === 'e';
}

function ecoScoreAdjustmentFromGrade(grade: 'a' | 'b' | 'c' | 'd' | 'e'): number {
  const m: Record<string, number> = { a: 7, b: 3, c: -1, d: -3, e: -7 };
  return m[grade] ?? 0;
}

function adjustmentType(value: number): 'positive' | 'negative' | 'neutral' {
  return value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
}

/**
 * Push a fired row carrying its locked Planet v19 ID and registry-governed Highlight eligibility.
 * Jurisdiction stays in metadata/description; it is never part of the stable ID.
 */
function pushAdjustment(
  adjustments: PlanetPillarAdjustment[],
  id: PlanetV19AdjustmentId,
  value: number,
  description: string,
  metadata?: PlanetPillarAdjustmentMetadata
): void {
  const meta = PLANET_V19_ADJUSTMENT_REGISTRY[id];
  adjustments.push({
    id,
    description,
    value,
    type: adjustmentType(value),
    highlightEligible: meta.highlightEligible,
    family: meta.family,
    ...(metadata && { metadata }),
  });
}

export function calculatePlanetPillar(product: Product): PlanetPillarResult {
  const base = 15;

  try {
    let score = base;
    const adjustments: PlanetPillarAdjustment[] = [];
    const grade = product.ecoscore_grade;
    const hasEcoScoreGrade = isValidEcoScoreGrade(grade);

    pushAdjustment(adjustments, 'planet-v19-base', 0, `Base score (${base}) — ${SPEC_LABEL}`);

    let ecoscoreAdjustment: number | undefined;
    let packagingFallbackPoints: number | undefined;
    let packagingJurisdiction: string | undefined;

    if (hasEcoScoreGrade) {
      const g = grade.toLowerCase() as 'a' | 'b' | 'c' | 'd' | 'e';
      ecoscoreAdjustment = ecoScoreAdjustmentFromGrade(g);
      score += ecoscoreAdjustment;
      const gradeId = planetV19EnvironmentalGradeAdjustmentId(g);
      pushAdjustment(
        adjustments,
        gradeId ?? 'planet-v19-environmental-no-usable-grade',
        ecoscoreAdjustment,
        `Eco-Score grade ${g.toUpperCase()} (${ecoscoreAdjustment >= 0 ? '+' : ''}${ecoscoreAdjustment}) — Open Food Facts / Eco-Score`,
        { environmentalGrade: g.toUpperCase() }
      );
    } else {
      pushAdjustment(
        adjustments,
        'planet-v19-environmental-no-usable-grade',
        0,
        'No Eco-Score grade on record — no Eco-Score adjustment (per spec)'
      );

      const fb = computePackagingFallback(product);
      packagingFallbackPoints = fb.points;
      packagingJurisdiction = fb.jurisdiction;

      if (fb.points > 0) {
        score += fb.points;
        const packagingMeta: PlanetPillarAdjustmentMetadata = {
          jurisdiction: fb.jurisdiction,
          packagingComponentLabels: fb.componentLabels.join('|'),
          packagingComponentDispositions: fb.dispositions
            .map((d) => packagingConsumerDispositionKey(d))
            .join('|'),
        };
        pushAdjustment(
          adjustments,
          planetV19PackagingFallbackAdjustmentId(fb.points as 1 | 2),
          fb.points,
          fb.points === 2
            ? `Packaging fallback +2 (${fb.jurisdiction}): packagings_complete and all primary components kerbside-recyclable — ${ANNEX_LABEL}`
            : `Packaging fallback +1 (${fb.jurisdiction}): at least one kerbside-recyclable component, none not-recyclable — ${ANNEX_LABEL}`,
          packagingMeta
        );
      } else if (
        fb.structuredPackagingPresent ||
        (product.packaging_text_in_languages && typeof product.packaging_text_in_languages === 'object')
      ) {
        pushAdjustment(
          adjustments,
          'planet-v19-packaging-neutral-evidence',
          0,
          `Packaging fallback 0 (${fb.jurisdiction}): insufficient kerbside evidence, conditional-only, incomplete, or non-approved market — ${ANNEX_LABEL}`,
          { jurisdiction: fb.jurisdiction }
        );
      } else {
        pushAdjustment(
          adjustments,
          'planet-v19-packaging-no-evidence',
          0,
          `Packaging fallback 0 (${fb.jurisdiction}): no structured packaging evidence — ${ANNEX_LABEL}`,
          { jurisdiction: fb.jurisdiction }
        );
      }
    }

    score = Math.max(0, Math.min(25, Math.round(score)));

    const result: PlanetPillarResult = {
      score,
      base,
      adjustments,
      details: {
        specVersion: SPEC_LABEL,
        annexVersion: ANNEX_LABEL,
        hasEcoScoreGrade,
        ecoscoreGrade: typeof grade === 'string' ? grade : undefined,
        ecoscoreAdjustment,
        packagingFallbackPoints,
        packagingJurisdiction,
        palmOilPlanetAdjustment: 0,
      },
    };

    powershellLogger.pillarCalculation(
      product.barcode || 'unknown',
      'Planet',
      base,
      result.score,
      adjustments.map((adj) => ({
        description: adj.description,
        value: adj.value,
        type: adj.type,
        dataSource: adj.description.includes('Eco-Score') ? 'OFF' : undefined,
      })),
      result.details
    );

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[PlanetPillar] Technical calculation failure — must not return baseline Planet 15:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      barcode: product?.barcode || 'unknown',
    });
    // Propagate so TruScore outer wrapper resolves to unavailable/non-assessment
    // (never an indistinguishable genuine Planet 15).
    throw error instanceof Error ? error : new Error(errorMessage);
  }
}
