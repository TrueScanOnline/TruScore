/**
 * ETHICS PILLAR
 *
 * SPEC: Database files/ETHICS Pillar/ETHICS SPEC sheet.xlsx (Ethics_Scoring_Spec tab).
 *
 * Logic:
 * - Base Score: 15 (uniform)
 * - BBFAW (Animal Welfare): product → brand → parent chaining; if match apply Tier + Impact; else nil.
 * - KTC (Human Welfare): product → brand → parent chaining; if match apply adjustment from Total Benchmark Score band; else nil.
 * - Certifications: highest eligible scheme only (+2..+5); see ethicsCertificationsService (MVP: no stacking).
 * - Cap: Min 0, Max 25 (applied after all adjustments).
 *
 * BBFAW: Tier 1=+6, 2=+4, 3=+2, 4=+1, 5=-4, 6=-6; Impact A/B=+3, C/D=+1, E/F=-3.
 * KTC Total Benchmark Score: 0–10=-10, 11–20=-8, 21–30=-6, 31–50=-3, 51–70=+3, 71–80=+6, 81–90=+8, 91–100=+10.
 * Certifications: Fairtrade +5, Rainforest Alliance +4, ASC +4, MSC +4, RSPO +3, Organic +2.
 */

import { Product } from '../../../types/product';
import { logger } from '../../../utils/logger';
import {
  checkBBFAWTier,
  getBBFAWTierScore,
  getBBFAWImpactScore,
  type BBFAWTier,
} from '../../../services/bbfawService';
import {
  resolveBrandToParent,
  type ResolvedParent,
} from '../../../services/bbfawBrandResolutionService';
import {
  checkKTCParent,
  getKTCScoreAdjustment,
  type KTCParentData,
} from '../../../services/ktcService';
import { resolveBrandToKTCParent } from '../../../services/ktcBrandResolutionService';
import { evaluateEthicsCertifications } from '../../../services/ethicsCertificationsService';
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
    ktcScore: number;
    ktcMatchedCompany: string | null;
    certificationsAdjustment: number;
    certificationsWinningScheme: string | null;
    certificationsEligibleSchemes: string[];
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
    // Resolved mapping has tier/impact; otherwise need BBFAW lookup
    if (resolved && resolved.tier_2024 >= 1 && resolved.tier_2024 <= 6) {
      companyName = name;
      break;
    }
    if (checkBBFAWTier(name)) {
      companyName = name;
      break;
    }
  }

  // Use tier/impact from resolved mapping (spec-aligned) when available; else from bbfaw2024Data
  let bbfawData = companyName ? checkBBFAWTier(companyName) : null;
  const useResolvedTier =
    resolved &&
    resolved.tier_2024 >= 1 &&
    resolved.tier_2024 <= 6 &&
    resolved.parent_entity_exact === companyName;

  let bbfawTierScore = 0;
  let bbfawImpactScore = 0;
  const tier: BBFAWTier | null = useResolvedTier
    ? (resolved!.tier_2024 as BBFAWTier)
    : bbfawData?.tier ?? null;
  const impactRating = useResolvedTier
    ? (resolved!.impact_2024 as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | undefined)
    : bbfawData?.impactRating;

  if (tier || impactRating) {
    bbfawTierScore = getBBFAWTierScore(tier);
    bbfawImpactScore = getBBFAWImpactScore(impactRating);

    if (bbfawTierScore !== 0 && tier) {
      adjustments.push({
        description: `BBFAW Tier ${tier} (animal welfare governance)`,
        value: bbfawTierScore,
        type: bbfawTierScore > 0 ? 'positive' : 'negative',
        // Prefer Food Companies page for user context; PDF remains available in BBFAW docs
        referenceUrl: 'https://www.bbfaw.com/food-companies/',
      });
      score += bbfawTierScore;
    }

    if (bbfawImpactScore !== 0 && impactRating) {
      adjustments.push({
        description: `BBFAW Impact Rating ${impactRating} (welfare outcomes)`,
        value: bbfawImpactScore,
        type: bbfawImpactScore > 0 ? 'positive' : 'negative',
        referenceUrl: 'https://www.bbfaw.com/food-companies/',
      });
      score += bbfawImpactScore;
    }

    logger.debug('[EthicsPillar] BBFAW match:', {
      companyName,
      tier,
      impactRating,
      tierScore: bbfawTierScore,
      impactScore: bbfawImpactScore,
      source: useResolvedTier ? 'brandAliasMap' : 'bbfaw2024Canonical',
    });
  } else {
    logger.debug('[EthicsPillar] BBFAW not found - nil return (no adjustment)', {
      companyName: companyName || 'none',
    });
  }

  // KTC (KnowTheChain) 2026 – apply in addition to BBFAW, using same brand candidates
  let ktcMatched: KTCParentData | null = null;
  let ktcScoreAdjustment = 0;
  for (const raw of candidates) {
    const resolvedKTC = resolveBrandToKTCParent(raw);
    const ktcName = resolvedKTC?.parentName ?? raw;
    const ktcData = checkKTCParent(ktcName);
    if (ktcData) {
      ktcMatched = ktcData;
      ktcScoreAdjustment = getKTCScoreAdjustment(ktcData.totalBenchmarkScore);
      break;
    }
  }

  if (ktcMatched && ktcScoreAdjustment !== 0) {
    adjustments.push({
      description: `KTC 2026 benchmark score ${ktcMatched.totalBenchmarkScore} (labour rights in supply chains)`,
      value: ktcScoreAdjustment,
      type: ktcScoreAdjustment > 0 ? 'positive' : 'negative',
      referenceUrl: 'https://www.business-humanrights.org/en/companies/',
    });
    score += ktcScoreAdjustment;

    logger.debug('[EthicsPillar] KTC match:', {
      companyName: ktcMatched.parentName,
      totalBenchmarkScore: ktcMatched.totalBenchmarkScore,
      ktcScoreAdjustment,
    });
  } else {
    logger.debug('[EthicsPillar] KTC not found - nil return (no adjustment)');
  }

  // Certifications (ETHICS SPEC — max single scheme for MVP)
  const certEval = evaluateEthicsCertifications(product);
  let certificationsAdjustment = 0;
  if (certEval.adjustment !== 0 && certEval.winningScheme) {
    certificationsAdjustment = certEval.adjustment;
    const labelPretty = certEval.winningScheme
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    adjustments.push({
      description: `Ethics certifications – ${labelPretty} (+${certificationsAdjustment}, highest eligible scheme; MVP no stacking)`,
      value: certificationsAdjustment,
      type: 'positive',
      referenceUrl: certEval.referenceUrl,
    });
    score += certificationsAdjustment;
    logger.debug('[EthicsPillar] Certifications:', {
      winningScheme: certEval.winningScheme,
      adjustment: certificationsAdjustment,
      eligible: certEval.eligibleSchemes,
    });
  }

  // Global cap after Base + BBFAW + KTC + certifications
  score = Math.max(0, Math.min(25, Math.round(score)));

  const result: EthicsPillarResult = {
    score,
    base,
    adjustments,
    details: {
      bbfawTierScore,
      bbfawImpactScore,
      bbfawMatchedCompany: companyName && (tier || impactRating) ? companyName : null,
      bbfawTier: tier ?? null,
      bbfawImpactRating: impactRating ?? null,
      ktcScore: ktcScoreAdjustment,
      ktcMatchedCompany: ktcMatched ? ktcMatched.parentName : null,
      certificationsAdjustment,
      certificationsWinningScheme: certEval.winningScheme,
      certificationsEligibleSchemes: certEval.eligibleSchemes,
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
