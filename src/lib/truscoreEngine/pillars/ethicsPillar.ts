/**
 * ETHICS PILLAR
 *
 * SPEC: Database files/ETHICS Pillar/Ethics_Scoring_Specification_37_Cursor_Submit.xlsx (v37).
 *
 * Shipped logic (no YoY BBFAW modifiers):
 * - Base: 15 (uniform).
 * - BBFAW: same candidate brands as KTC (`brand_owner` first, then comma-split `brands`); each candidate is
 *   resolved product → brand → parent (alias map), then canonical BBFAW lookup; apply Tier + Impact when matched,
 *   else no BBFAW adjustment.
 * - KTC: same candidate list; resolve product → brand → KTC parent, then benchmark bands; first match wins.
 * - Certifications: single highest eligible scheme only (no stacking); see ethicsCertificationsService.
 * - Cap: 0–25 after all adjustments.
 *
 * BBFAW: Tier 1=+6, 2=+4, 3=+2, 4=+1, 5=-4, 6=-6; Impact A/B=+3, C/D=+1, E/F=-3.
 * KTC Total Benchmark Score: 0–10=-10, 11–20=-8, 21–30=-6, 31–50=-3, 51–70=+3, 71–80=+6, 81–90=+8, 91–100=+10.
 * Certifications: Fairtrade +6, Rainforest Alliance/UTZ +6, ASC +4, MSC +4, Organic +2.
 * RSPO does not contribute Ethics points (Currency Note / founder disposition 2026-08-04).
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
import { resolveEthicsBenchmarkContext } from './ethicsBenchmarkAdapter';

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
    /** How organic was detected when organic rules matched (diagnostics / UI). */
    certificationsOrganicMatchSource?: 'off_tags_or_hierarchy' | 'label_or_cert_text' | 'product_name' | null;
  };
}

const SKIP_BRANDS = new Set(['unknown', 'generic', 'no brand', 'sans marque']);

/**
 * Brand strings used for BBFAW and KTC resolution (shared candidate list).
 * Order: `brand_owner` first, then each comma-separated value from `brands`.
 * Deduped; skips useless placeholder brand names.
 */
function getEthicsCompanyCandidates(product: Product): string[] {
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
 * ETHICS pillar score: Base 15 + BBFAW + KTC + max one certification, clamped 0–25.
 */
export function calculateEthicsPillar(product: Product): EthicsPillarResult {
  const adjustments: EthicsPillarResult['adjustments'] = [];
  let score = 15;
  const base = 15;

  const benchmarkCtx = resolveEthicsBenchmarkContext(product);
  const candidates = benchmarkCtx.benchmarkOwnerHint
    ? [benchmarkCtx.benchmarkOwnerHint, ...getEthicsCompanyCandidates(product)]
    : getEthicsCompanyCandidates(product);

  adjustments.push({
    description: 'Base score (assumes ethical until poor ratings)',
    value: 0,
    type: 'neutral',
  });

  // Try each candidate: resolve via mapping, then BBFAW lookup; use first match.
  // If frozen benchmark eligibility is false, benchmark adjustments are deterministically disabled.
  let companyName: string | null = null;
  let resolved: ResolvedParent | null = null;
  let bbfawData = null as ReturnType<typeof checkBBFAWTier>;
  let bbfawTierScore = 0;
  let bbfawImpactScore = 0;
  let tier: BBFAWTier | null = null;
  let impactRating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | undefined;
  if (benchmarkCtx.benchmarkEligible) {
    for (const raw of candidates) {
      resolved = resolveBrandToParent(raw);
      const name = resolved?.parent_entity_exact ?? raw;
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
    bbfawData = companyName ? checkBBFAWTier(companyName) : null;
    const useResolvedTier =
      resolved &&
      resolved.tier_2024 >= 1 &&
      resolved.tier_2024 <= 6 &&
      resolved.parent_entity_exact === companyName;
    tier = useResolvedTier ? (resolved!.tier_2024 as BBFAWTier) : bbfawData?.tier ?? null;
    impactRating = useResolvedTier
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
    }
  } else {
    adjustments.push({
      description: 'Frozen benchmark not eligible for ethics scoring (deterministic zero benchmark movement)',
      value: 0,
      type: 'neutral',
    });
  }

  // KTC (KnowTheChain) 2026 – apply in addition to BBFAW, using same brand candidates
  let ktcMatched: KTCParentData | null = null;
  let ktcScoreAdjustment = 0;
  if (benchmarkCtx.benchmarkEligible) {
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
    const organicHint =
      certEval.winningScheme === 'organic' && certEval.organicMatchSource
        ? ` [${certEval.organicMatchSource.replace(/_/g, ' ')}]`
        : '';
    adjustments.push({
      description: `Ethics certifications – ${labelPretty} (+${certificationsAdjustment}, highest eligible scheme; MVP no stacking)${organicHint}`,
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
      certificationsOrganicMatchSource: certEval.organicMatchSource ?? null,
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
    benchmarkEligible: benchmarkCtx.benchmarkEligible,
  });

  return result;
}
