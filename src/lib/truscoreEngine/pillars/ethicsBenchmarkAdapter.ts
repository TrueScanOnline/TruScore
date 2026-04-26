import type { Product, ProductWithTrustScore } from '../../../types/product';
import type { SharedIdentityContext } from '../../../identity/types';
import { selectBenchmarkSnapshot } from '../../../benchmark/snapshotSelect';
import { materializeFrozenBenchmarkAttribution } from '../../../benchmark/materializeFrozenBenchmarkAttribution';
import type { FrozenBenchmarkAttributionObject } from '../../../benchmark/types';

export interface EthicsBenchmarkAdapterResult {
  bbfawFrozen: FrozenBenchmarkAttributionObject | null;
  ktcFrozen: FrozenBenchmarkAttributionObject | null;
  benchmarkOwnerHint: string | null;
  benchmarkEligible: boolean;
}

function getSharedIdentityContext(product: Product): SharedIdentityContext | null {
  return ((product as ProductWithTrustScore)._shared_identity_context as SharedIdentityContext | undefined) ?? null;
}

function materializeIfPossible(
  product: Product,
  benchmarkName: 'BBFAW' | 'KTC',
  identity: SharedIdentityContext | null
): FrozenBenchmarkAttributionObject | null {
  if (!identity) return null;
  const snapshot = selectBenchmarkSnapshot(benchmarkName);
  return materializeFrozenBenchmarkAttribution({
    snapshot,
    benchmarkName,
    product,
    sharedIdentityContext: identity,
  });
}

export function resolveEthicsBenchmarkContext(product: Product): EthicsBenchmarkAdapterResult {
  const identity = getSharedIdentityContext(product);
  const bbfawFrozen =
    ((product as ProductWithTrustScore)._frozen_benchmark_attribution as FrozenBenchmarkAttributionObject | undefined) ??
    materializeIfPossible(product, 'BBFAW', identity);
  const ktcFrozen = materializeIfPossible(product, 'KTC', identity);

  const bbfawEligible = bbfawFrozen ? bbfawFrozen.eligibility.ethics_scoring_eligible : true;
  const ktcEligible = ktcFrozen ? ktcFrozen.eligibility.ethics_scoring_eligible : true;
  const benchmarkEligible = bbfawEligible && ktcEligible;

  const benchmarkOwnerHint = bbfawFrozen?.subject_resolution.benchmark_owner_legal_name ?? null;

  return {
    bbfawFrozen: bbfawFrozen ?? null,
    ktcFrozen: ktcFrozen ?? null,
    benchmarkOwnerHint,
    benchmarkEligible,
  };
}

