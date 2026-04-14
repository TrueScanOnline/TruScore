/**
 * Phase 5B — derives ProductScanResult.terminal_state from fetch phase + product state.
 * @see docs/phase4/phase5b-deferred-edge-cases.md
 */

import type { ScanTerminalState } from '../types/scanOutputContract';
import type { Product, ProductWithTrustScore } from '../types/product';

const SUCCESS_PHASES = new Set(['complete', 'not_found', 'product_enhanced']);

function hasScorableIdentity(product: Product): boolean {
  const n = product.product_name?.trim() ?? '';
  return n.length > 3 && !n.startsWith('Product ');
}

export interface DeriveScanTerminalStateInput {
  loadError: string | null;
  product: Product | ProductWithTrustScore | null;
  isOffline: boolean;
  /** Latest fetch progress phase from productServiceOptimized onProgress */
  fetchPhase: string;
  /** True while loadProduct is awaiting the main fetch */
  isFetchLoading: boolean;
}

export function deriveScanTerminalState(input: DeriveScanTerminalStateInput): ScanTerminalState {
  const { loadError, product, isOffline, fetchPhase, isFetchLoading } = input;

  if (loadError && !product) {
    return isOffline ? 'offline' : 'error';
  }
  if (!product) {
    return loadError ? (isOffline ? 'offline' : 'error') : 'error';
  }

  if (isFetchLoading) {
    return 'partial';
  }

  if (!SUCCESS_PHASES.has(fetchPhase)) {
    return 'partial';
  }

  const tw = product as ProductWithTrustScore;
  if (tw.trust_score === null && hasScorableIdentity(product)) {
    return 'partial';
  }

  return 'success';
}
