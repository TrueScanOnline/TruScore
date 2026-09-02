/**
 * NOVA 1 provenance lifecycle — Wave 3 Score Highlights P1-B.
 * Scoring arithmetic is unchanged (+3 for all NOVA 1); only Highlight eligibility differs.
 */

import type { Product } from '../types/product';

export type Nova1Provenance = 'off' | 'inferred' | 'unknown';

/** Affirmative external/OFF NOVA 1. */
export function markNova1ProvenanceOff(product: Product): void {
  if (product.nova_group === 1) {
    product.nova1Provenance = 'off';
    delete (product as Product & { _nova_estimated?: boolean })._nova_estimated;
  }
}

/** Affirmative internal Rveel NOVA 1 rescue. */
export function markNova1ProvenanceInferred(product: Product): void {
  product.nova_group = 1;
  product.nova1Provenance = 'inferred';
  (product as Product & { _nova_estimated?: boolean })._nova_estimated = true;
}

/**
 * Resolve durable provenance for scoring/highlights.
 * Legacy nova_group=1 without established provenance → unknown (never upgrade to off).
 */
export function resolveNova1Provenance(product: Product): Nova1Provenance | undefined {
  if (product.nova_group !== 1) return undefined;

  if (product.nova1Provenance === 'off' || product.nova1Provenance === 'inferred' || product.nova1Provenance === 'unknown') {
    return product.nova1Provenance;
  }

  // Legacy bridge: pre-typed estimated flag
  if ((product as Product & { _nova_estimated?: boolean })._nova_estimated === true) {
    return 'inferred';
  }

  return 'unknown';
}

/**
 * Ensure Product carries typed provenance when nova_group is 1.
 * Safe on cache/SQLite read-back; never promotes unknown → off.
 */
export function ensureNova1ProvenanceOnProduct(product: Product): Product {
  if (product.nova_group !== 1) {
    return product;
  }
  const resolved = resolveNova1Provenance(product);
  if (resolved) {
    product.nova1Provenance = resolved;
  }
  return product;
}

/** Stable Body adjustment ID for NOVA 1 given provenance. */
export function bodyNova1AdjustmentId(
  provenance: Nova1Provenance
): 'body-v12-nova-1-off' | 'body-v12-nova-1-inferred' | 'body-v12-nova-1-unknown' {
  if (provenance === 'off') return 'body-v12-nova-1-off';
  if (provenance === 'inferred') return 'body-v12-nova-1-inferred';
  return 'body-v12-nova-1-unknown';
}
