import type { Product, ProductWithTrustScore } from '../../../types/product';
import type { SharedIdentityContext } from '../../../identity/types';
import { selectBenchmarkSnapshot } from '../../../benchmark/snapshotSelect';
import { materializeFrozenBenchmarkAttribution } from '../../../benchmark/materializeFrozenBenchmarkAttribution';
import type { FrozenBenchmarkAttributionObject } from '../../../benchmark/types';

export interface EthicsBenchmarkAdapterResult {
  bbfawFrozen: FrozenBenchmarkAttributionObject | null;
  ktcFrozen: FrozenBenchmarkAttributionObject | null;
  /** BBFAW-only attribution hint — must never be prepended into KTC candidate resolution. */
  bbfawOwnerHint: string | null;
  /** KTC-only attribution hint — must never be prepended into BBFAW candidate resolution. */
  ktcOwnerHint: string | null;
  /**
   * @deprecated Prefer bbfawOwnerHint. Retained as BBFAW-only alias so callers do not
   * accidentally treat a shared hint as cross-benchmark.
   */
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

function usableBenchmarkCycle(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

/**
 * Display/provenance year for a fired KTC adjustment.
 * Uses only the firing governed record's cycle (frozen attribution and/or score-row year).
 * Never substitutes the snapshot registry / hardcoded '2026' when the firing record lacks a cycle.
 */
export function resolveKtcGovernedBenchmarkYear(
  ktcFrozen: FrozenBenchmarkAttributionObject | null | undefined,
  firingRecordYear?: string | number | null
): string | undefined {
  return (
    usableBenchmarkCycle(ktcFrozen?.snapshot_ref?.benchmark_cycle) ??
    usableBenchmarkCycle(firingRecordYear)
  );
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

  // Benchmark-specific attribution inputs stay benchmark-specific (no cross-prepend).
  const bbfawOwnerHint = bbfawFrozen?.subject_resolution.benchmark_owner_legal_name ?? null;
  const ktcOwnerHint = ktcFrozen?.subject_resolution.benchmark_owner_legal_name ?? null;

  return {
    bbfawFrozen: bbfawFrozen ?? null,
    ktcFrozen: ktcFrozen ?? null,
    bbfawOwnerHint,
    ktcOwnerHint,
    benchmarkOwnerHint: bbfawOwnerHint,
    benchmarkEligible,
  };
}

