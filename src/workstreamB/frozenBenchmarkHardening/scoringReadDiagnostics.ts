/**
 * Proves the **existing** ethics scoring path honors frozen benchmark eligibility.
 * Does not recalculate or alter BBFAW/KTC methodology.
 */

import { calculateEthicsPillar } from '../../lib/truscoreEngine/pillars/ethicsPillar';
import type { ProductWithTrustScore } from '../../types/product';
import { resolveEthicsBenchmarkContext } from '../../lib/truscoreEngine/pillars/ethicsBenchmarkAdapter';
import type { SharedIdentityContext } from '../../identity/types';

const FROZEN_GATE_MESSAGE = 'Frozen benchmark not eligible for ethics scoring';

export interface ScoringReadSample {
  label: string;
  product: ProductWithTrustScore;
}

export interface ScoringReadCaseResult {
  label: string;
  benchmark_eligible_from_adapter: boolean;
  score: number;
  frozen_gate_adjustment_applied: boolean;
}

export interface ScoringReadDiagnosticsResult {
  cases: ScoringReadCaseResult[];
  all_deterministic_when_ineligible: boolean;
}

function hasFrozenGateAdjustment(adjustments: { description: string }[]): boolean {
  return adjustments.some((a) => a.description.includes(FROZEN_GATE_MESSAGE));
}

/**
 * Run narrow scoring-read checks: `resolveEthicsBenchmarkContext` + `calculateEthicsPillar`.
 */
export function runScoringReadDiagnostics(samples: ScoringReadSample[]): ScoringReadDiagnosticsResult {
  const cases: ScoringReadCaseResult[] = [];
  for (const s of samples) {
    const ctx = resolveEthicsBenchmarkContext(s.product);
    const result = calculateEthicsPillar(s.product);
    const frozenGate = hasFrozenGateAdjustment(result.adjustments);
    cases.push({
      label: s.label,
      benchmark_eligible_from_adapter: ctx.benchmarkEligible,
      score: result.score,
      frozen_gate_adjustment_applied: frozenGate,
    });
  }

  const ineligible = samples.filter((s) => {
    const p = s.product;
    const bbf = p._frozen_benchmark_attribution;
    if (bbf && bbf.eligibility.ethics_scoring_eligible === false) return true;
    return false;
  });

  const all_deterministic_when_ineligible = ineligible.every((s) => {
    const r = calculateEthicsPillar(s.product);
    return r.score === 15 && hasFrozenGateAdjustment(r.adjustments);
  });

  return { cases, all_deterministic_when_ineligible };
}

/** Structural carrier for scoring-read diagnostics — benchmark eligibility comes from frozen attribution attachment. */
export function minimalSharedIdentityStub(productId: string): SharedIdentityContext {
  return {
    resolution_key: { gtin: productId.replace(/\D/g, '').slice(0, 14) || '0000000000000', market_key: 'AU' },
    canonical: {
      product_id: productId,
      brand_id: 'brand:stub',
      current_owner_entity_id: 'owner:stub_current',
    },
    operational_entities: {},
    quality: {
      confidence_state: 'strong',
      review_state: 'reviewed',
      resolution_status: 'resolved',
      ambiguity_flags: [],
    },
    lineage: { source_refs: ['workstream_b_scaffold'], alias_hits: [], normalizer_version: 'v1' },
  };
}
