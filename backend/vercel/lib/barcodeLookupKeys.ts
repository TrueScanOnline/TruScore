/**
 * GTIN lookup keys for DB queries (UPC-A vs EAN-13 leading zero).
 * Scanners often return 12-digit UPC-A; Open Food Facts and the app use 13-digit EAN-13.
 */

export function barcodeLookupKeys(raw: string): string[] {
  const cleaned = String(raw || '').replace(/\D/g, '');
  if (!cleaned) return [];

  const keys = new Set<string>();
  keys.add(cleaned);
  if (cleaned.length === 12) {
    keys.add(`0${cleaned}`);
  }
  if (cleaned.length === 13 && cleaned.startsWith('0')) {
    keys.add(cleaned.slice(1));
  }

  const primary =
    cleaned.length === 12
      ? `0${cleaned}`
      : cleaned.length === 13 && cleaned.startsWith('0')
        ? cleaned
        : cleaned;

  const ordered: string[] = [];
  ordered.push(primary);
  for (const k of keys) {
    if (k !== primary) ordered.push(k);
  }
  return ordered;
}

/** Single canonical row key for writes (EAN-13 when UPC-A was scanned). */
export function canonicalBarcodeForStorage(raw: string): string {
  const keys = barcodeLookupKeys(raw);
  return keys[0] || String(raw || '').replace(/\D/g, '');
}
