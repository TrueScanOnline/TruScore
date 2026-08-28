/**
 * World OFF retrieval outcomes — distinguish authoritative miss from transient failure.
 */

import type { Product } from '../types/product';

export type OffRetrievalFailureReason =
  | 'rate_limit_exhausted'
  | 'server_error_exhausted'
  | 'network_timeout_exhausted'
  | 'malformed_response_exhausted'
  | 'retrieval_other';

export type OffVariantAttemptOutcome =
  | { kind: 'hit'; product: Product }
  | { kind: 'not_found' }
  | { kind: 'transient'; reason: OffRetrievalFailureReason };

export type OffFetchResult =
  | { kind: 'hit'; product: Product }
  | { kind: 'not_found' }
  | { kind: 'retrieval_error'; reason: OffRetrievalFailureReason };

export const OFF_MAX_TRANSIENT_ATTEMPTS = 3;

export function classifyHttpStatus(status: number): 'not_found' | OffRetrievalFailureReason {
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limit_exhausted';
  if (status >= 500 && status <= 599) return 'server_error_exhausted';
  return 'retrieval_other';
}

export function classifyFetchException(error: unknown): OffRetrievalFailureReason {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('429') || msg.includes('rate limit')) return 'rate_limit_exhausted';
    if (msg.includes('timeout')) return 'network_timeout_exhausted';
    if (
      msg.includes('network request failed') ||
      msg.includes('failed to fetch') ||
      msg.includes('networkerror')
    ) {
      return 'network_timeout_exhausted';
    }
  }
  return 'retrieval_other';
}

export function transientReasonForRetry(reason: OffRetrievalFailureReason): OffRetrievalFailureReason {
  return reason;
}

export function backoffDelayMs(attemptIndex: number): number {
  return Math.min(500 * 2 ** attemptIndex, 5000);
}
