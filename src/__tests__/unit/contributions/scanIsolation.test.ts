import { calculateTruScore } from '../../../lib/truscoreEngine';
import { persistEvidenceRemote } from '../../../contributions/evidenceStore';
import { createPendingEvidence } from '../../../contributions/lifecycle';
import { markPendingContributionFields } from '../../../contributions/eligibilityBoundary';
import type { Product } from '../../../types/product';
import type { ContributionEvidence } from '../../../contributions/types';

const BARCODE = '9415000000123';

function evidence(): ContributionEvidence {
  return createPendingEvidence({
    evidenceId: `${BARCODE}|origins|australia|v1`,
    barcode: BARCODE,
    domain: 'origins',
    evidenceVersion: 1,
    claimKey: 'australia',
    claimValue: 'Australia',
    submitterId: 'user_submitter',
    createdAt: 1,
  });
}

describe('SCAN — evidence failure must not block scoring', () => {
  it('SCAN-01 persistEvidenceRemote returns false on network failure and does not throw', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network down'));
    await expect(persistEvidenceRemote(evidence())).resolves.toBe(false);
  });

  it('SCAN-02 persistEvidenceRemote returns false on HTTP error and does not throw', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(persistEvidenceRemote(evidence())).resolves.toBe(false);
  });

  it('SCAN-03 calculateTruScore still returns a result when pending contribution fields are present', () => {
    const product = markPendingContributionFields(
      {
        barcode: BARCODE,
        product_name: 'Scan isolation fixture',
        source: 'openfoodfacts',
        manufacturing_places: 'Australia',
        labels_tags: ['en:fair-trade'],
      } as Product,
      { origin: true, labels: true }
    );
    const result = calculateTruScore(product);
    expect(typeof result.truscore).toBe('number');
    expect(result.breakdown).toEqual(
      expect.objectContaining({
        Body: expect.any(Number),
        Planet: expect.any(Number),
        Ethics: expect.any(Number),
        Open: expect.any(Number),
      })
    );
  });
});

describe('W1 — existing trusted fields remain scoring-authoritative', () => {
  it('W1-01 OFF product with origin + Fairtrade + Nutri-Score is unchanged by empty evidence list', () => {
    const trusted: Product = {
      barcode: BARCODE,
      product_name: 'Trusted OFF fixture',
      brands: 'Totally Unknown Indie Brand',
      source: 'openfoodfacts',
      nutriscore_grade: 'a',
      labels_tags: ['en:fair-trade'],
      manufacturing_places: 'New Zealand',
      manufacturing_places_tags: ['en:new-zealand'],
      ingredients_text: 'Water, organic cane sugar, sea salt.',
    };
    const result = calculateTruScore(trusted);
    expect(result.breakdown.Body).toBe(22);
    expect(result.breakdown.Ethics).toBe(21);
    expect(result.hasNutriScore).toBe(true);
  });
});
