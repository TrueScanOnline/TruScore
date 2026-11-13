/**
 * WEB-01A — Public share identity gate (AMBER).
 * Isolated from Gateway V3 presentation tests.
 */

import {
  extractOffProductCode,
  publicShareCodesMatch,
} from '../../../../backend/vercel/lib/publicShareIdentity';

describe('publicShareCodesMatch (WEB-01A)', () => {
  it('accepts exact Cadbury EAN-13', () => {
    expect(publicShareCodesMatch('9300617064879', '9300617064879')).toBe(true);
  });

  it('accepts UPC-A / EAN-13 leading-zero equivalence', () => {
    // UPC-A (12) ↔ EAN-13 (0 + UPC-A) via normalizeBarcode
    expect(publicShareCodesMatch('012345678905', '012345678905')).toBe(true);
    expect(publicShareCodesMatch('123456789012', '0123456789012')).toBe(true);
    expect(publicShareCodesMatch('0123456789012', '123456789012')).toBe(true);
  });

  it('rejects unrelated codes', () => {
    expect(publicShareCodesMatch('9300617064879', '9999999999994')).toBe(false);
    expect(publicShareCodesMatch('0000000000000', '9300617064879')).toBe(false);
  });

  it('rejects missing returned code', () => {
    expect(publicShareCodesMatch('9300617064879', undefined)).toBe(false);
    expect(publicShareCodesMatch('9300617064879', null)).toBe(false);
    expect(publicShareCodesMatch('9300617064879', '')).toBe(false);
  });

  it('accepts OFF payload that stores the same digits as product.code', () => {
    const code = extractOffProductCode(
      { status: 1, code: '9999999999994', product: { code: '9999999999994' } },
      { code: '9999999999994' }
    );
    expect(code).toBe('9999999999994');
    expect(publicShareCodesMatch('9999999999994', code)).toBe(true);
  });
});

describe('WEB-01A policy notes (documentation assertions)', () => {
  it('documents that all-zero must not accept UPCITEMDB identity via this gate alone', () => {
    // OFF returns no match for 0000000000000; without UPCITEMDB fallback the share
    // landing must render barcode-only unknown. The gate itself only compares codes.
    expect(publicShareCodesMatch('0000000000000', '0000000000000')).toBe(true);
  });
});
