import type { Product } from '../types/product';
import type { SharedIdentityContext } from '../identity/types';
import type { BenchmarkSnapshot, FrozenBenchmarkAttributionObject } from './types';
import { isEthicsScoringEligibleState } from './ethicsScoringEligibility';

function parseIsoDateSafe(v?: string | null): number | null {
  if (!v) return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : null;
}

/**
 * Benchmark owner resolution precedence (locked pack):
 * 1) Explicit `phase6_benchmark_owner_entity_id` when set — takes precedence.
 * 2) Otherwise, ownership cutoff rule: if current ownership effective date is after snapshot cutoff and
 *    a previous owner is supplied, use previous owner as frozen benchmark owner; else use current owner.
 */
function resolveBenchmarkOwner(input: {
  snapshot: BenchmarkSnapshot;
  sharedIdentityContext: SharedIdentityContext;
  product: Product;
}): { benchmarkOwnerEntityId: string; benchmarkOwnerLegalName: string } {
  const { snapshot, sharedIdentityContext, product } = input;
  const currentOwner = sharedIdentityContext.canonical.current_owner_entity_id;
  const explicitBenchmarkOwner = product.phase6_benchmark_owner_entity_id;
  if (explicitBenchmarkOwner) {
    return {
      benchmarkOwnerEntityId: explicitBenchmarkOwner,
      benchmarkOwnerLegalName: product.brand_owner ?? explicitBenchmarkOwner,
    };
  }

  const previousOwner = product.phase6_previous_owner_entity_id;
  const ownershipEffectiveAt = parseIsoDateSafe(product.phase6_current_owner_effective_date);
  const cutoffAt = parseIsoDateSafe(snapshot.ownership_cutoff_date);
  const afterCutoff =
    ownershipEffectiveAt !== null && cutoffAt !== null ? ownershipEffectiveAt > cutoffAt : false;

  // Post-cutoff ownership changes keep previous owner as benchmark owner.
  if (afterCutoff && previousOwner) {
    return {
      benchmarkOwnerEntityId: previousOwner,
      benchmarkOwnerLegalName: previousOwner,
    };
  }

  return {
    benchmarkOwnerEntityId: currentOwner ?? 'owner:unknown',
    benchmarkOwnerLegalName: product.brand_owner ?? currentOwner ?? 'Unknown owner',
  };
}

function computeEligibility(input: {
  freezeStatus: FrozenBenchmarkAttributionObject['freeze']['freeze_status'];
  reviewState: FrozenBenchmarkAttributionObject['state']['review_state'];
  resolutionStatus: FrozenBenchmarkAttributionObject['state']['resolution_status'];
  blockerFlags: string[];
}): boolean {
  return isEthicsScoringEligibleState(input);
}

export function materializeFrozenBenchmarkAttribution(input: {
  snapshot: BenchmarkSnapshot;
  benchmarkName: BenchmarkSnapshot['benchmark_name'];
  product: Product;
  sharedIdentityContext: SharedIdentityContext;
  reviewState?: FrozenBenchmarkAttributionObject['state']['review_state'];
  resolutionStatus?: FrozenBenchmarkAttributionObject['state']['resolution_status'];
  blockerFlags?: string[];
}): FrozenBenchmarkAttributionObject {
  const {
    snapshot,
    benchmarkName,
    product,
    sharedIdentityContext,
    reviewState = 'reviewed',
    resolutionStatus = 'resolved',
    blockerFlags = [],
  } = input;
  const owner = resolveBenchmarkOwner({ snapshot, sharedIdentityContext, product });
  const currentOwner = sharedIdentityContext.canonical.current_owner_entity_id;
  const divergence = currentOwner !== owner.benchmarkOwnerEntityId;

  const out: FrozenBenchmarkAttributionObject = {
    snapshot_ref: {
      benchmark_name: benchmarkName,
      benchmark_cycle: snapshot.benchmark_cycle,
      snapshot_version: snapshot.snapshot_version,
      ownership_cutoff_date: snapshot.ownership_cutoff_date,
    },
    subject_resolution: {
      canonical_brand_id: sharedIdentityContext.canonical.brand_id,
      benchmark_owner_entity_id: owner.benchmarkOwnerEntityId,
      benchmark_owner_legal_name: owner.benchmarkOwnerLegalName,
    },
    comparison_context: {
      current_owner_entity_id: currentOwner,
      ownership_divergence_flag: divergence,
    },
    state: {
      confidence_state: sharedIdentityContext.quality.confidence_state,
      review_state: reviewState,
      resolution_status: resolutionStatus,
    },
    eligibility: {
      ethics_scoring_eligible: computeEligibility({
        freezeStatus: snapshot.freeze_status,
        reviewState,
        resolutionStatus,
        blockerFlags,
      }),
      blocker_flags: blockerFlags,
    },
    freeze: {
      freeze_status: snapshot.freeze_status,
      lineage_reference: `${benchmarkName}:${snapshot.snapshot_version}:${sharedIdentityContext.resolution_key.gtin}`,
    },
  };

  return Object.freeze({
    ...out,
    snapshot_ref: Object.freeze({ ...out.snapshot_ref }),
    subject_resolution: Object.freeze({ ...out.subject_resolution }),
    comparison_context: Object.freeze({ ...out.comparison_context }),
    state: Object.freeze({ ...out.state }),
    eligibility: Object.freeze({ ...out.eligibility }),
    freeze: Object.freeze({ ...out.freeze }),
  });
}

