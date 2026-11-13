/**
 * SJ-06 — deterministic product-load isolation (E4-A…E4-E mirrors).
 */

import {
  bumpProductLoadGeneration,
  isActiveProductLoadGeneration,
  normalizeBarcodeDeepLinkPath,
  productBarcodesMatch,
  shouldAcceptFetchedProductUpdate,
  shouldApplyProductRequestCompletion,
} from '../../../utils/resultProductLoadGuard';

const CADBURY = '9300617064879';
const NUTELLA = '3017620422003';

describe('resultProductLoadGuard', () => {
  describe('generation', () => {
    it('bumps monotonically', () => {
      expect(bumpProductLoadGeneration(0)).toBe(1);
      expect(bumpProductLoadGeneration(3)).toBe(4);
    });

    it('detects active vs stale generation', () => {
      expect(isActiveProductLoadGeneration(2, 2)).toBe(true);
      expect(isActiveProductLoadGeneration(3, 2)).toBe(false);
    });
  });

  describe('productBarcodesMatch', () => {
    it('matches identical route and product barcodes', () => {
      expect(productBarcodesMatch(CADBURY, CADBURY)).toBe(true);
    });

    it('rejects cross-barcode', () => {
      expect(productBarcodesMatch(CADBURY, NUTELLA)).toBe(false);
    });

    it('rejects empty', () => {
      expect(productBarcodesMatch('', CADBURY)).toBe(false);
      expect(productBarcodesMatch(CADBURY, '')).toBe(false);
    });
  });

  describe('E4-A: A → B, A completes last', () => {
    it('keeps B when stale A success arrives', () => {
      let activeBarcode = CADBURY;
      let activeGen = bumpProductLoadGeneration(0); // gen 1 = A
      const aGen = activeGen;

      activeBarcode = NUTELLA;
      activeGen = bumpProductLoadGeneration(activeGen); // gen 2 = B
      const bGen = activeGen;

      // B succeeds
      expect(
        shouldApplyProductRequestCompletion({
          activeRouteBarcode: activeBarcode,
          activeGeneration: activeGen,
          requestBarcode: NUTELLA,
          requestGeneration: bGen,
          outcome: 'success',
        }).apply
      ).toBe(true);

      // Late A success rejected
      const lateA = shouldApplyProductRequestCompletion({
        activeRouteBarcode: activeBarcode,
        activeGeneration: activeGen,
        requestBarcode: CADBURY,
        requestGeneration: aGen,
        outcome: 'success',
      });
      expect(lateA).toEqual({ apply: false, reason: 'stale_generation' });
    });
  });

  describe('E4-B: A → B, A fails last', () => {
    it('does not apply late A error over B', () => {
      let activeGen = bumpProductLoadGeneration(0);
      const aGen = activeGen;
      activeGen = bumpProductLoadGeneration(activeGen);

      const lateAError = shouldApplyProductRequestCompletion({
        activeRouteBarcode: NUTELLA,
        activeGeneration: activeGen,
        requestBarcode: CADBURY,
        requestGeneration: aGen,
        outcome: 'error',
      });
      expect(lateAError.apply).toBe(false);
      expect(lateAError.reason).toBe('stale_generation');
    });
  });

  describe('E4-C: A → B → A (older A1 must not overwrite A2)', () => {
    it('rejects first A generation after second A is active', () => {
      let activeBarcode = CADBURY;
      let activeGen = bumpProductLoadGeneration(0);
      const a1 = activeGen;

      activeBarcode = NUTELLA;
      activeGen = bumpProductLoadGeneration(activeGen);

      activeBarcode = CADBURY;
      activeGen = bumpProductLoadGeneration(activeGen);
      const a2 = activeGen;

      expect(
        shouldApplyProductRequestCompletion({
          activeRouteBarcode: activeBarcode,
          activeGeneration: activeGen,
          requestBarcode: CADBURY,
          requestGeneration: a2,
          outcome: 'success',
        }).apply
      ).toBe(true);

      const lateA1 = shouldApplyProductRequestCompletion({
        activeRouteBarcode: activeBarcode,
        activeGeneration: activeGen,
        requestBarcode: CADBURY,
        requestGeneration: a1,
        outcome: 'success',
      });
      expect(lateA1).toEqual({ apply: false, reason: 'stale_generation' });
    });
  });

  describe('E4-D: offline failure must not keep prior product via accept guard', () => {
    it('rejects Cadbury payload while route is uncached barcode', () => {
      expect(
        shouldAcceptFetchedProductUpdate({
          routeBarcode: '9999999999999',
          productBarcode: CADBURY,
          activeGeneration: 2,
          capturedGeneration: 2,
        })
      ).toBe(false);
    });
  });

  describe('E4-E: same-barcode legitimate update (generation-agnostic path)', () => {
    it('allows barcode match without captured generation (EA admission style)', () => {
      expect(
        shouldAcceptFetchedProductUpdate({
          routeBarcode: CADBURY,
          productBarcode: CADBURY,
          activeGeneration: 5,
          // no capturedGeneration — EA / reassessment
        })
      ).toBe(true);
    });

    it('allows same-barcode fetch when generation is current', () => {
      expect(
        shouldAcceptFetchedProductUpdate({
          routeBarcode: CADBURY,
          productBarcode: CADBURY,
          activeGeneration: 4,
          capturedGeneration: 4,
        })
      ).toBe(true);
    });
  });

  describe('normalizeBarcodeDeepLinkPath', () => {
    it('rewrites empty barcode path to barcode/', () => {
      expect(normalizeBarcodeDeepLinkPath('barcode')).toBe('barcode/');
      expect(normalizeBarcodeDeepLinkPath('/barcode')).toBe('barcode/');
      expect(normalizeBarcodeDeepLinkPath('barcode/')).toBe('barcode/');
    });

    it('rejects extra path segments instead of accepting the first token', () => {
      expect(normalizeBarcodeDeepLinkPath(`barcode/${CADBURY}/extra/path`)).toBe('barcode/');
      expect(normalizeBarcodeDeepLinkPath(`/barcode/${CADBURY}/extra`)).toBe('barcode/');
    });

    it('preserves query on single-token paths', () => {
      expect(normalizeBarcodeDeepLinkPath(`barcode/${CADBURY}?src=share`)).toBe(
        `barcode/${CADBURY}?src=share`
      );
    });

    it('leaves non-barcode paths alone', () => {
      expect(normalizeBarcodeDeepLinkPath('search')).toBe('search');
    });
  });
});
