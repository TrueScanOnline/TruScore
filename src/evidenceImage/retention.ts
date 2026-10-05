export const ABANDONED_LOCAL_EVIDENCE_MS = 14 * 24 * 60 * 60 * 1000;
export const PENDING_REMOTE_EVIDENCE_MS = 24 * 60 * 60 * 1000;
export const UNCITED_REMOTE_EVIDENCE_MS = 30 * 24 * 60 * 60 * 1000;

export function localEvidenceAbandoned(updatedAt: number, now: number, heldForRetry: boolean): boolean {
  if (heldForRetry) return false;
  return now - updatedAt >= ABANDONED_LOCAL_EVIDENCE_MS;
}
