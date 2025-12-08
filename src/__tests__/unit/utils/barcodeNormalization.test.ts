/**
 * Unit tests for barcode normalization
 */

import { normalizeBarcode, getPrimaryBarcode } from '../../../utils/barcodeNormalization';

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
    it('should return EAN-13 for EAN-8', () => {
      const primary = getPrimaryBarcode('12345670');
      expect(primary.length).toBe(13);
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
});

