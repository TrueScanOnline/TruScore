/**
 * Structural mutual exclusion: Skeleton (historical UAT) vs Dynamic Signals Asset (production successor).
 * Reads env flags directly to avoid circular imports with runtime builders.
 */

export type ActiveSignalsProducer = 'asset' | 'skeleton' | 'none';

function assetFlagOn(): boolean {
  return process.env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET === '1';
}

function skeletonFlagOn(): boolean {
  return process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT === '1';
}

/**
 * When both env flags are on, Asset wins and Skeleton is structurally suppressed.
 * Callers must not merge both producer outputs.
 */
export function resolveActiveSignalsProducer(logLines?: string[]): ActiveSignalsProducer {
  const asset = assetFlagOn();
  const skeleton = skeletonFlagOn();
  if (asset && skeleton) {
    logLines?.push(
      'signals_producer_guard: BOTH Asset and Skeleton flags enabled — Asset path only; Skeleton suppressed'
    );
    return 'asset';
  }
  if (asset) return 'asset';
  if (skeleton) return 'skeleton';
  return 'none';
}

export function assertSingleSignalsProducerActive(logLines?: string[]): ActiveSignalsProducer {
  return resolveActiveSignalsProducer(logLines);
}
