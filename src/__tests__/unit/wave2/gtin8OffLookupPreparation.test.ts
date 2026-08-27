/**
 * Wave 2 P1 — GTIN-8 double-normalisation fix.
 * Asserts the production retrieval preparation path that feeds World OFF.
 */

import {
  normalizeBarcode,
  getPrimaryBarcode,
  toWorldOffLookupBarcode,
} from '../../../utils/barcodeNormalization';

describe('Wave 2 GTIN OFF lookup preparation (production path)', () => {
  describe('toWorldOffLookupBarcode', () => {
    it('preserves valid GTIN-8 for OFF lookup (no pad-to-EAN-13)', () => {
      expect(toWorldOffLookupBarcode('63523614')).toBe('63523614');
      expect(toWorldOffLookupBarcode('94152210')).toBe('94152210');
      expect(toWorldOffLookupBarcode('94008241')).toBe('94008241');
    });

    it('preserves GTIN-12 digits for OFF lookup', () => {
      expect(toWorldOffLookupBarcode('040000422068')).toBe('040000422068');
      expect(toWorldOffLookupBarcode('0012000161011'.slice(1))).toBe('012000161011');
    });

    it('preserves GTIN-13 for OFF lookup', () => {
      expect(toWorldOffLookupBarcode('9300675001113')).toBe('9300675001113');
      expect(toWorldOffLookupBarcode('9310055105850')).toBe('9310055105850');
    });

    it('preserves GTIN-14 for OFF lookup', () => {
      const gtin14 = '09300675001113';
      expect(toWorldOffLookupBarcode(gtin14)).toBe(gtin14);
    });

    it('strips non-digits only', () => {
      expect(toWorldOffLookupBarcode('9415-2210')).toBe('94152210');
    });
  });

  describe('double-normalisation defect (documented)', () => {
    it('getPrimaryBarcode(GTIN-8) must not be what is passed to OFF', () => {
      for (const gtin8 of ['63523614', '94152210', '94008241']) {
        const primary = getPrimaryBarcode(gtin8);
        const offLookup = toWorldOffLookupBarcode(gtin8);
        expect(offLookup).toBe(gtin8);
        // Pre-normalising then re-normalising loses the exact GTIN-8 World OFF key
        expect(primary).not.toBe(gtin8);
        const variantsFromPrimary = normalizeBarcode(primary);
        expect(variantsFromPrimary).not.toContain(gtin8);
      }
    });

    it('OFF-layer normalizeBarcode on request GTIN-8 still includes the exact GTIN-8', () => {
      for (const gtin8 of ['63523614', '94152210', '94008241']) {
        const variants = normalizeBarcode(toWorldOffLookupBarcode(gtin8));
        expect(variants[0]).toBe(gtin8);
        expect(variants).toContain(gtin8);
      }
    });
  });

  describe('GTIN-12 / 13 / 14 preparation remains safe', () => {
    it('GTIN-13: OFF lookup equals request; primary is unchanged', () => {
      const gtin13 = '9300675001113';
      expect(toWorldOffLookupBarcode(gtin13)).toBe(gtin13);
      expect(getPrimaryBarcode(gtin13)).toBe(gtin13);
      expect(normalizeBarcode(toWorldOffLookupBarcode(gtin13))).toContain(gtin13);
    });

    it('GTIN-12: OFF lookup keeps 12 digits; normalizeBarcode still offers leading-zero EAN-13', () => {
      const gtin12 = '040000422068';
      const offLookup = toWorldOffLookupBarcode(gtin12);
      expect(offLookup).toBe(gtin12);
      const variants = normalizeBarcode(offLookup);
      expect(variants).toContain(gtin12);
      expect(variants).toContain('0' + gtin12);
    });

    it('GTIN-14: OFF lookup keeps 14 digits; normalizeBarcode still offers truncations', () => {
      const gtin14 = '09300675001113';
      const offLookup = toWorldOffLookupBarcode(gtin14);
      expect(offLookup).toBe(gtin14);
      const variants = normalizeBarcode(offLookup);
      expect(variants).toContain(gtin14);
      expect(variants).toContain(gtin14.substring(0, 13));
      expect(variants).toContain(gtin14.substring(1, 14));
    });
  });
});
