/**
 * SJ-06 — Result fetch isolation helpers (AMBER orchestration).
 *
 * Fetch-driven UI must only apply when the response belongs to the active
 * product-load generation AND the product barcode matches the route barcode.
 *
 * Evidence Authority admission / reassessment stay generation-agnostic and use
 * barcode + snapshot ordering separately.
 */

import { getPrimaryBarcode } from './barcodeNormalization';

/** Bump the active load generation; returns the new generation id. */
export function bumpProductLoadGeneration(current: number): number {
  return current + 1;
}

/** True when a captured generation is still the active one. */
export function isActiveProductLoadGeneration(
  activeGeneration: number,
  capturedGeneration: number
): boolean {
  return activeGeneration === capturedGeneration;
}

/**
 * Route vs product identity using the existing canonical primary-barcode contract.
 * Preserves string barcodes; does not strip leading zeros beyond getPrimaryBarcode variants.
 */
export function productBarcodesMatch(
  routeBarcode: string | null | undefined,
  productBarcode: string | null | undefined
): boolean {
  if (typeof routeBarcode !== 'string' || typeof productBarcode !== 'string') return false;
  if (!routeBarcode.length || !productBarcode.length) return false;
  return getPrimaryBarcode(routeBarcode) === getPrimaryBarcode(productBarcode);
}

/**
 * Whether a fetch-driven product update may mutate Result UI.
 * Pass loadGeneration for fetch/refresh paths; omit for generation-agnostic callers.
 */
export function shouldAcceptFetchedProductUpdate(params: {
  routeBarcode: string;
  productBarcode: string;
  activeGeneration: number;
  capturedGeneration?: number;
}): boolean {
  if (!productBarcodesMatch(params.routeBarcode, params.productBarcode)) {
    return false;
  }
  if (params.capturedGeneration === undefined) {
    return true;
  }
  return isActiveProductLoadGeneration(params.activeGeneration, params.capturedGeneration);
}

/**
 * Normalize React Navigation path for barcode deep links.
 * - empty `barcode` / `barcode/` → `barcode/` (empty token; Result treats as invalid/missing input)
 * - `barcode/{token}/extra...` → `barcode/` (rejected; do NOT silently accept first segment)
 * - `barcode/{token}` → unchanged token (existing digit-length contract applies in Result)
 * - otherwise unchanged
 */
export function normalizeBarcodeDeepLinkPath(path: string): string {
  const qIndex = path.indexOf('?');
  const pathname = qIndex >= 0 ? path.slice(0, qIndex) : path;
  const query = qIndex >= 0 ? path.slice(qIndex) : '';
  const parts = pathname.replace(/^\/+/, '').split('/').filter((p) => p.length > 0);

  if (parts[0] !== 'barcode') {
    return path;
  }

  // Empty path, or unsupported extra segments: reject as missing/invalid input.
  // Never interpret extras as an approved barcode (SJ-07).
  if (parts.length === 1 || parts.length > 2) {
    return `barcode/${query}`;
  }

  return `barcode/${parts[1]}${query}`;
}

/**
 * Pure E4-style decision table for tests and documentation.
 * Models whether a completing request may write Result UI.
 */
export function shouldApplyProductRequestCompletion(params: {
  activeRouteBarcode: string;
  activeGeneration: number;
  requestBarcode: string;
  requestGeneration: number;
  outcome: 'success' | 'error';
}): { apply: boolean; reason: 'accept' | 'stale_generation' | 'barcode_mismatch' } {
  if (params.requestGeneration !== params.activeGeneration) {
    return { apply: false, reason: 'stale_generation' };
  }
  if (!productBarcodesMatch(params.activeRouteBarcode, params.requestBarcode)) {
    return { apply: false, reason: 'barcode_mismatch' };
  }
  return { apply: true, reason: 'accept' };
}
