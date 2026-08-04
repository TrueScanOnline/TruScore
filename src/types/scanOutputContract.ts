/**
 * Phase 4/5 scan output contract — single authoritative shape for result + golden tests.
 * @see docs/phase4/scan-output-contract.md
 */

import type { Product, ProductWithTrustScore } from './product';

export type ScanTerminalState = 'success' | 'partial' | 'error' | 'offline';

/** Phase 4 signal taxonomy: A safety/reg, B transparency/methodology, C preference, D premium insight */
export type SignalClass = 'A' | 'B' | 'C' | 'D';

export interface SignalLink {
  url: string;
  label_key?: string;
}

export interface SignalCard {
  id: string;
  class: SignalClass;
  title_key: string;
  body_key: string;
  severity: 'high' | 'medium' | 'low';
  why_key: string;
  links: SignalLink[];
  dedupe_key: string;
  /** Until all copy moves to i18n keys */
  title_display?: string;
  body_display?: string;
  /** Optional skeleton / pack-supplied “why” line (Phase 6 Workstream C Option A). */
  why_display?: string;
  /** Stage 2 food-recall: show manual batch / best-before entry under the alert. */
  food_recall_needs_batch_entry?: boolean;
  /** Stage 2 food-recall match state (for edit/re-check UI). */
  food_recall_match_state?: string;
}

export interface ProductScanResult {
  terminal_state: ScanTerminalState;
  barcode: string;
  market: 'AU' | 'NZ' | 'UNKNOWN';
  product: Product | ProductWithTrustScore | null;
  scores: {
    trust?: number;
    pillars?: Record<string, number | null>;
    methodology_version: string;
  } | null;
  signals: {
    safety_regulatory: SignalCard[];
    transparency: SignalCard[];
    user_preference: SignalCard[];
    premium_insight: SignalCard[];
  };
  confidence: { value: number; label: 'high' | 'medium' | 'low' };
  coverage: { completeness: number; flags: string[] };
  sources_trace: { id: string; status: string }[];
  premium: { subscriber: boolean };
  errors?: { code: string; message_key: string }[];
}
