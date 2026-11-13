/**
 * WEB-01A — Public share identity gate (AMBER, founder-approved, bounded).
 *
 * Accepts OFF catalogue identity only when the returned product code matches the
 * requested barcode under the app's existing normalizeBarcode equivalence rules.
 * Used exclusively by the public product-preview / share landing path.
 */

import { normalizeBarcode } from '../truescan-src/utils/barcodeNormalization';

export function digitsOnlyBarcode(raw: string): string {
  return String(raw || '').replace(/\D/g, '');
}

/**
 * True when OFF `product.code` (or top-level `code`) is an allowed representation
 * of the requested barcode (exact digits, or UPC-A/EAN-13 / short-code variants
 * already produced by normalizeBarcode).
 */
export function publicShareCodesMatch(
  requestedBarcode: string,
  returnedCode: string | null | undefined
): boolean {
  if (returnedCode == null) return false;
  const req = digitsOnlyBarcode(requestedBarcode);
  const got = digitsOnlyBarcode(String(returnedCode));
  if (!req || !got) return false;
  if (req === got) return true;

  const reqVariants = new Set(normalizeBarcode(req));
  const gotVariants = new Set(normalizeBarcode(got));
  for (const v of reqVariants) {
    if (gotVariants.has(v)) return true;
  }
  // Direct containment: OFF may return a variant that is in the request set
  if (reqVariants.has(got) || gotVariants.has(req)) return true;
  return false;
}

export function extractOffProductCode(
  offPayload: { code?: unknown; product?: Record<string, unknown> | null },
  product: Record<string, unknown>
): string | undefined {
  const fromProduct = product.code;
  if (typeof fromProduct === 'string' && fromProduct.trim()) return fromProduct.trim();
  if (typeof fromProduct === 'number' && Number.isFinite(fromProduct)) {
    return String(fromProduct);
  }
  if (typeof offPayload.code === 'string' && offPayload.code.trim()) return offPayload.code.trim();
  if (typeof offPayload.code === 'number' && Number.isFinite(offPayload.code)) {
    return String(offPayload.code);
  }
  const id = product._id;
  if (typeof id === 'string' && /^\d{8,14}$/.test(id)) return id;
  return undefined;
}
