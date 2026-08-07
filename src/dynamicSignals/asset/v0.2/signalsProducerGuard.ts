/**
 * Signals producer selection for production.
 * Dynamic Signals Asset is the sole production Signal-content authority.
 * Workstream C Skeleton runtime producer is retired.
 */

export type ActiveSignalsProducer = 'asset' | 'none';

function assetFlagOn(): boolean {
  return process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET === '1';
}

/**
 * Returns `asset` when EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET=1, else `none`.
 * Legacy EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT is ignored (logged if set).
 */
export function resolveActiveSignalsProducer(logLines?: string[]): ActiveSignalsProducer {
  if (process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT === '1') {
    logLines?.push(
      'signals_producer_guard: EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT is retired — Skeleton runtime ignored; Asset-only production path'
    );
  }
  if (assetFlagOn()) return 'asset';
  return 'none';
}

export function assertSingleSignalsProducerActive(logLines?: string[]): ActiveSignalsProducer {
  return resolveActiveSignalsProducer(logLines);
}
