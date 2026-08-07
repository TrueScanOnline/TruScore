import type { ProductWithTrustScore } from '../../../types/product';
import type { DynamicSignalPublicationRecord } from '../../../dynamicSignals/publish/types';

export type Phase6FixtureSeverity = 'P0' | 'P1';
export type Phase6GateTag = 'A' | 'B' | 'C' | 'D' | 'E';
export type Phase6LayerTag = 'identity' | 'frozen_benchmark' | 'dynamic_signals' | 'cross_layer';
export type Phase6GateLevel = 'merge' | 'release_candidate' | 'public_release';

export interface Phase6FixtureCase {
  id: string;
  title: string;
  severity: Phase6FixtureSeverity;
  layer: Phase6LayerTag;
  gate_tags: Phase6GateTag[];
  clock_iso: string;
  input: {
    barcode: string;
    marketHint: 'AU' | 'NZ' | 'AU+NZ';
    product: ProductWithTrustScore;
    dynamic_records?: DynamicSignalPublicationRecord[];
    frozen_probe?: {
      benchmark_name: 'BBFAW' | 'KTC';
      review_state?: 'seeded' | 'provisional' | 'reviewed' | 'disputed' | 'archived';
      resolution_status?: 'resolved' | 'resolved_with_warning' | 'ambiguous' | 'blocked' | 'needs_review';
      blocker_flags?: string[];
    };
  };
  expected: {
    public_market: 'AU' | 'NZ' | 'UNKNOWN';
    publishable_signal_ids: string[];
    disallowed_signal_ids: string[];
    has_legacy_banner_signals?: boolean;
    frozen_ethics_scoring_eligible?: boolean;
  };
}

