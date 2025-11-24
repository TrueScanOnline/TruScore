// Barcode normalization utility
// Handles EAN-8, UPC-A, and other short barcodes by padding to EAN-13 format

/**
 * Calculate EAN-13 check digit
 */
function calculateEAN13CheckDigit(barcode: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i], 10);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

/**
 * Normalize barcode to EAN-13 format
 * EAN-8 (8 digits) -> EAN-13 (13 digits) by padding with zeros
 * UPC-A (12 digits) -> EAN-13 by adding leading zero
 * 
 * @param barcode - Raw barcode string
 * @returns Array of normalized barcode variants to try
 */
export function normalizeBarcode(barcode: string): string[] {
  const cleaned = barcode.replace(/\D/g, ''); // Remove non-digits
  const variants: string[] = [cleaned]; // Always include original
  
  if (cleaned.length === 8) {
    // EAN-8: Pad to EAN-13 by adding 5 zeros at the start
    // Format: 00000 + EAN-8 + check digit
    const padded = '00000' + cleaned;
    const checkDigit = calculateEAN13CheckDigit(padded);
    const ean13 = padded + checkDigit;
    variants.push(ean13);
    
    // Also try with country code prefix (NZ = 94)
    const nzPadded = '94' + '000' + cleaned;
    const nzCheckDigit = calculateEAN13CheckDigit(nzPadded);
    const nzEan13 = nzPadded + nzCheckDigit;
    variants.push(nzEan13);
    
    // Try AU prefix (93)
    const auPadded = '93' + '000' + cleaned;
    const auCheckDigit = calculateEAN13CheckDigit(auPadded);
    const auEan13 = auPadded + auCheckDigit;
    variants.push(auEan13);
  } else if (cleaned.length === 12) {
    // UPC-A: Add leading zero to make EAN-13
    const ean13 = '0' + cleaned;
    variants.push(ean13);
  } else if (cleaned.length < 8) {
    // Very short barcode - pad to EAN-8 first, then to EAN-13
    const paddedTo8 = cleaned.padStart(8, '0');
    variants.push(paddedTo8);
    
    // Then pad to EAN-13
    const padded = '00000' + paddedTo8;
    const checkDigit = calculateEAN13CheckDigit(padded);
    const ean13 = padded + checkDigit;
    variants.push(ean13);
  }
  
  // Remove duplicates and return
  return Array.from(new Set(variants));
}

/**
 * Get primary barcode (longest variant, typically EAN-13)
 */
export function getPrimaryBarcode(barcode: string): string {
  const variants = normalizeBarcode(barcode);
  // Return the longest variant (most likely to be EAN-13)
  return variants.reduce((a, b) => a.length > b.length ? a : b, variants[0]);
}

