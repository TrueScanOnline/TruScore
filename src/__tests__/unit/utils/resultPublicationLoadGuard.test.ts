/**
 * Result publication latch — late network/offline miss must not unsettle a published scan.
 */

import { shouldPreserveSettledResultOnLoadMiss } from '../../../utils/resultPublicationLoadGuard';

describe('shouldPreserveSettledResultOnLoadMiss', () => {
  const barcode = '9415559040031';

  it('preserves settled success when late offline/unreachable miss is for the same barcode', () => {
    expect(
      shouldPreserveSettledResultOnLoadMiss({
        publicationSettled: true,
        settledBarcode: barcode,
        requestBarcode: barcode,
      })
    ).toBe(true);
  });

  it('does not preserve when publication has not settled yet', () => {
    expect(
      shouldPreserveSettledResultOnLoadMiss({
        publicationSettled: false,
        settledBarcode: barcode,
        requestBarcode: barcode,
      })
    ).toBe(false);
  });

  it('does not preserve across barcode change', () => {
    expect(
      shouldPreserveSettledResultOnLoadMiss({
        publicationSettled: true,
        settledBarcode: barcode,
        requestBarcode: '9310645318080',
      })
    ).toBe(false);
  });

  /**
   * Production sequence mirror (Result loadProduct):
   * 1) success settles publication for barcode
   * 2) NetInfo offline rerun returns retrieval_error
   * 3) preserve latch → skip unsettle + skip miss UI; score/Confidence stay published
   */
  it('sequence: settled → offline retrieval_error miss keeps published consumer state', () => {
    let publicationSettled = false;
    let settledBarcode: string | null = null;
    let product: { name: string; score: number } | null = null;
    let confidenceVisible = false;
    let scoreChecking = true;

    // Step 1–2: successful load settles
    product = { name: 'Real Mayonnaise', score: 40 };
    publicationSettled = true;
    settledBarcode = barcode;
    confidenceVisible = publicationSettled;
    scoreChecking = !publicationSettled;

    expect(confidenceVisible).toBe(true);
    expect(scoreChecking).toBe(false);

    // Step 3–4: late offline rerun → retrieval_error (no product from fetch)
    const preserve = shouldPreserveSettledResultOnLoadMiss({
      publicationSettled,
      settledBarcode,
      requestBarcode: barcode,
    });
    expect(preserve).toBe(true);

    if (!preserve) {
      publicationSettled = false;
      confidenceVisible = false;
      scoreChecking = true;
    }
    // Miss ignored — product + latch unchanged
    expect(product?.name).toBe('Real Mayonnaise');
    expect(publicationSettled).toBe(true);
    expect(confidenceVisible).toBe(true);
    expect(scoreChecking).toBe(false);
  });

  it('contrast: without preserve latch, late miss would flip Checking and hide Confidence', () => {
    let publicationSettled = true;
    let confidenceVisible = true;
    let scoreChecking = false;

    // Legacy loadProduct start always unsettled:
    publicationSettled = false;
    confidenceVisible = publicationSettled;
    scoreChecking = !publicationSettled;

    expect(confidenceVisible).toBe(false);
    expect(scoreChecking).toBe(true);
  });
});
