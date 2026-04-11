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
import { computePackagingFallback } from './planetPackagingFallback';

const SPEC_LABEL = 'Planet_Scoring_Specification_v19';
const ANNEX_LABEL = 'Planet_v19_Packaging_Jurisdiction_Rules_Annex_v2';

export interface PlanetPillarResult {
  score: number;
  base: number;
  adjustments: Array<{
    description: string;
    value: number;
    type: 'positive' | 'negative' | 'neutral';
  }>;
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

export function calculatePlanetPillar(product: Product): PlanetPillarResult {
  const base = 15;

  try {
    let score = base;
    const adjustments: PlanetPillarResult['adjustments'] = [];
    const grade = product.ecoscore_grade;
    const hasEcoScoreGrade = isValidEcoScoreGrade(grade);

    adjustments.push({
      description: `Base score (${base}) — ${SPEC_LABEL}`,
      value: 0,
      type: 'neutral',
    });

    let ecoscoreAdjustment: number | undefined;
    let packagingFallbackPoints: number | undefined;
    let packagingJurisdiction: string | undefined;

    if (hasEcoScoreGrade) {
      const g = grade.toLowerCase() as 'a' | 'b' | 'c' | 'd' | 'e';
      ecoscoreAdjustment = ecoScoreAdjustmentFromGrade(g);
      score += ecoscoreAdjustment;
      const type: 'positive' | 'negative' | 'neutral' =
        ecoscoreAdjustment > 0 ? 'positive' : ecoscoreAdjustment < 0 ? 'negative' : 'neutral';
      adjustments.push({
        description: `Eco-Score grade ${g.toUpperCase()} (${ecoscoreAdjustment >= 0 ? '+' : ''}${ecoscoreAdjustment}) — Open Food Facts / Eco-Score`,
        value: ecoscoreAdjustment,
        type,
      });
    } else {
      adjustments.push({
        description: 'No Eco-Score grade on record — no Eco-Score adjustment (per spec)',
        value: 0,
        type: 'neutral',
      });

      const fb = computePackagingFallback(product);
      packagingFallbackPoints = fb.points;
      packagingJurisdiction = fb.jurisdiction;

      if (fb.points > 0) {
        score += fb.points;
        adjustments.push({
          description:
            fb.points === 2
              ? `Packaging fallback +2 (${fb.jurisdiction}): packagings_complete and all primary components kerbside-recyclable — ${ANNEX_LABEL}`
              : `Packaging fallback +1 (${fb.jurisdiction}): at least one kerbside-recyclable component, none not-recyclable — ${ANNEX_LABEL}`,
          value: fb.points,
          type: 'positive',
        });
      } else if (
        fb.structuredPackagingPresent ||
        (product.packaging_text_in_languages && typeof product.packaging_text_in_languages === 'object')
      ) {
        adjustments.push({
          description: `Packaging fallback 0 (${fb.jurisdiction}): insufficient kerbside evidence, conditional-only, incomplete, or non-approved market — ${ANNEX_LABEL}`,
          value: 0,
          type: 'neutral',
        });
      } else {
        adjustments.push({
          description: `Packaging fallback 0 (${fb.jurisdiction}): no structured packaging evidence — ${ANNEX_LABEL}`,
          value: 0,
          type: 'neutral',
        });
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
        ...adj,
        dataSource: adj.description.includes('Eco-Score') ? 'OFF' : undefined,
      })),
      result.details
    );

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[PlanetPillar] Error calculating Planet pillar score:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      barcode: product?.barcode || 'unknown',
    });

    return {
      score: base,
      base,
      adjustments: [
        {
          description: 'Planet pillar calculation error — baseline only',
          value: 0,
          type: 'neutral',
        },
      ],
      details: {
        specVersion: SPEC_LABEL,
        annexVersion: ANNEX_LABEL,
        hasEcoScoreGrade: false,
        palmOilPlanetAdjustment: 0,
      },
    };
  }
}
