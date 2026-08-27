/**
 * Unit tests for barcode normalization
 */

import { normalizeBarcode, getPrimaryBarcode, toWorldOffLookupBarcode } from '../../../utils/barcodeNormalization';

describe('Barcode Normalization', () => {
  describe('normalizeBarcode', () => {
    it('should return EAN-13 variants for EAN-8', () => {
      const variants = normalizeBarcode('12345670');
      expect(variants.length).toBeGreaterThan(0);
      expect(variants).toContain('12345670');
    });

    it('should return same barcode for valid EAN-13', () => {
      const variants = normalizeBarcode('1234567890128');
      expect(variants).toContain('1234567890128');
    });

    it('should handle UPC-A codes', () => {
      const variants = normalizeBarcode('012345678905');
      expect(variants.length).toBeGreaterThan(0);
    });
  });

  describe('getPrimaryBarcode', () => {
    it('should return a longer padded variant for EAN-8 (cache/primary key helper)', () => {
      const primary = getPrimaryBarcode('12345670');
      expect(primary.length).toBeGreaterThan(8);
    });

    it('should return same barcode for EAN-13', () => {
      const primary = getPrimaryBarcode('1234567890128');
      expect(primary).toBe('1234567890128');
    });

    it('should handle UPC-A codes', () => {
      const primary = getPrimaryBarcode('012345678905');
      expect(primary.length).toBeGreaterThanOrEqual(12);
    });
  });

  describe('toWorldOffLookupBarcode', () => {
    it('keeps GTIN-8 exact for World OFF retrieval preparation', () => {
      expect(toWorldOffLookupBarcode('63523614')).toBe('63523614');
    });
  });
});

