import type { EvidenceResumeMarker, EvidenceResumeStep, InterruptedResumeRecord } from '../packetContribution/types';

/** A second interrupted launch stops automatic resume. */
export const INTERRUPTED_RESUME_ATTEMPT_LIMIT = 2;

export type InterruptedResumeDecision =
  | { resume: true; marker: EvidenceResumeMarker }
  | { resume: false; park: InterruptedResumeRecord };

/**
 * A marker still present at launch means the previous step did not finish.
 * The attempt count increases by one. At the limit, automatic resume stops.
 */
export function classifyInterruptedResume(marker: EvidenceResumeMarker, now: number): InterruptedResumeDecision {
  const attempt = marker.attempt + 1;
  if (attempt >= INTERRUPTED_RESUME_ATTEMPT_LIMIT) {
    return {
      resume: false,
      park: { step: marker.step, attempt, interruptedAt: now },
    };
  }
  return {
    resume: true,
    marker: { step: marker.step, attempt, startedAt: now },
  };
}

export function resumeMarkerFor(step: EvidenceResumeStep, attempt: number, startedAt: number): EvidenceResumeMarker {
  return { step, attempt: attempt > 0 ? attempt : 1, startedAt };
}
