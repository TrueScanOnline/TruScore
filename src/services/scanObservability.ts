/**
 * Minimum scan → fetch → score → signals observability (structured console + buffer).
 * Extend later to analytics SDK; keep payload PII-safe (no full ingredient text).
 */

import { powershellLogger } from '../utils/powershellLogger';

export type ScanObsEventName =
  | 'scan_started'
  | 'fetch_phase'
  | 'fetch_complete'
  | 'score_ready'
  | 'product_result_ready'
  | 'signals_built'
  | 'signals_ready'
  | 'scan_terminal';

/** Bump when adding/removing payload fields (Phase 5B stability for tooling). */
export const SCAN_OBS_SCHEMA_VERSION = 2 as const;

export type SignalsReadyObsOutcome = 'attached' | 'empty' | 'failed';

export interface ScanObsPayload {
  event: ScanObsEventName;
  /** Set automatically by logScanObs if omitted */
  schema_version?: typeof SCAN_OBS_SCHEMA_VERSION;
  scan_id: string;
  barcode: string;
  /** Optional: trust score when known */
  trust_score?: number | null;
  phase?: string;
  terminal_state?: string;
  signal_counts?: Record<string, number>;
  duration_ms?: number;
  source_trace_len?: number;
  coverage_completeness?: number;
  confidence_label?: string;
  /** Progressive Signals path: attached | empty | failed */
  signals_outcome?: SignalsReadyObsOutcome;
}

export function generateScanId(): string {
  return `scan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function logScanObs(payload: ScanObsPayload): void {
  powershellLogger.log('INFO', 'SCAN_OBS', payload.event, {
    schema_version: SCAN_OBS_SCHEMA_VERSION,
    ...payload,
  });
}
