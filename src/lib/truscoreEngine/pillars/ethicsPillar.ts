/**
 * ETHICS PILLAR - Rebuilt from ground up (no fuzzy logic)
 *
 * SPEC: Ethics_Scoring_Specification.xlsx + Ethics_Score_and Commentary_Table_20260307.docx
 * SOURCE: BBFAW 2024 Report ONLY (single database source)
 *
 * Logic:
 * - Base Score: 15 (uniform)
 * - Animal Welfare (BBFAW): DIRECT link only - product.brand_owner or product.brands
 *   → exact match against BBFAW 2024 company names (no fuzzy, no brand→parent chaining)
 * - If no match: nil (no adjustment), score stays 15
 * - Cap: Min 0, Max 25
 *
 * BBFAW Tier: 1=+6, 2=+4, 3=+2, 4=+1, 5=-4, 6=-6
 * BBFAW Impact: A/B=+3, C/D=+1, E/F=-3
 */

import { Product } from '../../../types/product';
import { logger } from '../../../utils/logger';
import {
  checkBBFAWTier,
  getBBFAWTierScore,
  getBBFAWImpactScore,
} from '../../../services/bbfawService';
import {
  resolveBrandToParent,
  type ResolvedParent,
} from '../../../services/bbfawBrandResolutionService';
import { powershellLogger } from '../../../utils/powershellLogger';

function getPerformanceNow(): number {
  return typeof performance !== 'undefined' && performance?.now
    ? performance.now()
    : Date.now();
}

export interface EthicsPillarResult {
  score: number;
  base: number;
  adjustments: Array<{
    description: string;
    value: number;
    type: 'positive' | 'negative' | 'neutral';
    referenceUrl?: string;
  }>;
  details: {
    bbfawTierScore: number;
    bbfawImpactScore: number;
    bbfawMatchedCompany: string | null;
    bbfawTier: number | null;
    bbfawImpactRating: string | null;
  };
}

const SKIP_BRANDS = new Set(['unknown', 'generic', 'no brand', 'sans marque']);

/**
 * Get all candidate company/brand strings from product for BBFAW lookup.
 * Order: brand_owner first, then each value from brands (comma-separated).
 * Tries multiple candidates to maximize match rate when brand_owner is wrong/missing.
 */
function getCompanyCandidatesForBBFAW(product: Product): string[] {
  const candidates: string[] = [];
  if (product.brand_owner && typeof product.brand_owner === 'string') {
    const t = product.brand_owner.trim();
    if (t.length >= 2) candidates.push(t);
  }
  if (product.brands && typeof product.brands === 'string') {
    const parts = product.brands.split(',').map((p) => p.trim()).filter(Boolean);
    for (const p of parts) {
      if (p.length >= 2 && !SKIP_BRANDS.has(p.toLowerCase())) {
        candidates.push(p);
      }
    }
  }
  // Dedupe preserving order
  return [...new Set(candidates)];
}

/**
 * Calculate ETHICS Pillar - BBFAW 2024 only, direct match only
 * 1. Base 15
 * 2. BBFAW lookup via product.brand_owner or product.brands (exact match)
 * 3. If found: apply Tier + Impact scores. If not found: nil return.
 * 4. Cap 0-25
 */
export function calculateEthicsPillar(product: Product): EthicsPillarResult {
  const startTime = getPerformanceNow();
  const adjustments: EthicsPillarResult['adjustments'] = [];
  let score = 15;
  const base = 15;

  const candidates = getCompanyCandidatesForBBFAW(product);

  adjustments.push({
    description: 'Base score (assumes ethical until poor ratings)',
    value: 0,
    type: 'neutral',
  });

  // Try each candidate: resolve via mapping, then BBFAW lookup; use first match
  let companyName: string | null = null;
  let resolved: ResolvedParent | null = null;
  for (const raw of candidates) {
    resolved = resolveBrandToParent(raw);
    const name = resolved?.parent_entity_exact ?? raw;
    if (checkBBFAWTier(name)) {
      companyName = name;
      break;
    }
  }

  let bbfawData = null;
  if (companyName) {
    bbfawData = checkBBFAWTier(companyName);
  }

  let bbfawTierScore = 0;
  let bbfawImpactScore = 0;

  if (bbfawData) {
    bbfawTierScore = getBBFAWTierScore(bbfawData.tier);
    bbfawImpactScore = getBBFAWImpactScore(bbfawData.impactRating);

    if (bbfawTierScore !== 0) {
      adjustments.push({
        description: `BBFAW Tier ${bbfawData.tier} (animal welfare governance)`,
        value: bbfawTierScore,
        type: bbfawTierScore > 0 ? 'positive' : 'negative',
        ...(bbfawData.referenceUrl && { referenceUrl: bbfawData.referenceUrl }),
      });
      score += bbfawTierScore;
    }

    if (bbfawImpactScore !== 0) {
      const ir = bbfawData.impactRating || '—';
      adjustments.push({
        description: `BBFAW Impact Rating ${ir} (welfare outcomes)`,
        value: bbfawImpactScore,
        type: bbfawImpactScore > 0 ? 'positive' : 'negative',
        ...(bbfawData.referenceUrl && { referenceUrl: bbfawData.referenceUrl }),
      });
      score += bbfawImpactScore;
    }

    logger.debug('[EthicsPillar] BBFAW match (direct):', {
      companyName,
      tier: bbfawData.tier,
      impactRating: bbfawData.impactRating,
      tierScore: bbfawTierScore,
      impactScore: bbfawImpactScore,
    });
  } else {
    logger.debug('[EthicsPillar] BBFAW not found - nil return (no adjustment)', {
      companyName: companyName || 'none',
    });
  }

  score = Math.max(0, Math.min(25, Math.round(score)));

  const result: EthicsPillarResult = {
    score,
    base,
    adjustments,
    details: {
      bbfawTierScore,
      bbfawImpactScore,
      bbfawMatchedCompany: bbfawData ? companyName : null,
      bbfawTier: bbfawData?.tier ?? null,
      bbfawImpactRating: bbfawData?.impactRating ?? null,
    },
  };

  powershellLogger.pillarCalculation(
    product.barcode || 'unknown',
    'Ethics',
    base,
    score,
    adjustments,
    result.details as any
  );

  logger.info('[EthicsPillar] Calculation complete:', {
    barcode: product.barcode,
    score,
    bbfawMatched: !!bbfawData,
  });

  return result;
}
