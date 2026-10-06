import type { EvidenceResumeMarker, EvidenceResumeStep, InterruptedResumeRecord } from '../packetContribution/types';

/**
 * The first start writes attempt 1. The next launch may retry that step once.
 * A marker whose attempt has already reached this limit is that automatic retry.
 * Finding it again from a different launch parks the item.
 */
export const INTERRUPTED_RESUME_ATTEMPT_LIMIT = 2;

function createLaunchId(): string {
  const bytes = new Uint8Array(8);
  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.getRandomValues) cryptoRef.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  return `ln_${Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')}`;
}

/** One id for this process. Generated when the module loads, not on each resume. */
export const currentResumeLaunchId = createLaunchId();

export type InterruptedResumeDecision =
  | { resume: true; marker: EvidenceResumeMarker }
  | { resume: false; park: InterruptedResumeRecord };

/** A marker belongs to this process when it carries the current launch id. */
export function markerFromCurrentLaunch(marker: EvidenceResumeMarker, launchId = currentResumeLaunchId): boolean {
  return marker.launchId === launchId;
}

/**
 * Same-launch markers are in flight, not crashes.
 * A previous launch's first attempt is retried once.
 * The next consecutive interrupted launch parks.
 */
export function classifyInterruptedResume(
  marker: EvidenceResumeMarker,
  now: number,
  launchId = currentResumeLaunchId
): InterruptedResumeDecision {
  if (markerFromCurrentLaunch(marker, launchId)) {
    return { resume: true, marker };
  }
  if (marker.attempt >= INTERRUPTED_RESUME_ATTEMPT_LIMIT) {
    return {
      resume: false,
      park: { step: marker.step, attempt: marker.attempt, interruptedAt: now },
    };
  }
  return {
    resume: true,
    marker: { step: marker.step, attempt: marker.attempt + 1, startedAt: now, launchId },
  };
}

export function resumeMarkerFor(step: EvidenceResumeStep, attempt: number, startedAt: number): EvidenceResumeMarker {
  return {
    step,
    attempt: attempt > 0 ? attempt : 1,
    startedAt,
    launchId: currentResumeLaunchId,
  };
}
