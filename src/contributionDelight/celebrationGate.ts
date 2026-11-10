/**
 * Ensures one logical submission produces at most one celebration.
 * Pure / in-memory — presentation layer only.
 */

import type { ContributionCelebrationRequest, ContributionCelebrationVariant } from './types';

export class ContributionCelebrationGate {
  private readonly seen = new Set<string>();

  /** Returns the variant to show, or null if this submission was already celebrated. */
  admit(request: ContributionCelebrationRequest): ContributionCelebrationVariant | null {
    const key = request.submissionKey.trim();
    if (!key) return null;
    if (this.seen.has(key)) return null;
    this.seen.add(key);
    return request.variant;
  }

  hasCelebrated(submissionKey: string): boolean {
    return this.seen.has(submissionKey.trim());
  }

  /** Test / preview helper only. */
  reset(): void {
    this.seen.clear();
  }
}

export function admissionSubmissionKey(args: {
  barcode: string;
  snapshotGeneratedAt: number;
  journey: 'add' | 'change';
}): string {
  return `ea:${args.barcode}:${args.snapshotGeneratedAt}:${args.journey}`;
}

export function agreementSubmissionKey(args: {
  barcode: string;
  group: string;
  revisionId: string;
}): string {
  return `agree:${args.barcode}:${args.group}:${args.revisionId}`;
}
