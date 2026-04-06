/**
 * Produces a short country label for UI (card, flag) from raw OFF or API strings.
 * Strips test suffixes, extra lines (e.g. barcodes), and trailing numeric IDs.
 */
export function sanitizeCountryForDisplay(raw: string): string {
  if (!raw || typeof raw !== 'string') {
    return '';
  }

  let s = raw.trim();
  if (!s) {
    return '';
  }

  // First line only (drops barcode / timestamps on following lines)
  s = s.split(/\r?\n/)[0].trim();

  // Trailing long numeric token (GTIN-style or test id)
  s = s.replace(/\s+\d{10,20}\s*$/, '').trim();

  // "Country – note" / "Country - test" → country only (spaced dash variants)
  const dashParts = s.split(/\s+[–—-]\s+/);
  if (dashParts.length > 1) {
    s = dashParts[0].trim();
  }

  return s;
}
