/**
 * CF-01/CF-02: dual thumbs; Agree≠Change; Correct unavailable stays honest (no hide).
 */

import {
  CORRECT_STRUCTURED_UNAVAILABLE_BODY,
  CORRECT_STRUCTURED_UNAVAILABLE_TITLE,
} from '../../../communityAgreement/correctUnavailableCopy';
import { agreementSurfaceGate } from '../../../communityAgreement/surfaceGate';
import { eligibleAgreementChangeJourney } from '../../../communityAgreement/changeJourney';
import type { Product } from '../../../types/product';

function ratedProduct(barcode: string): Product {
  return {
    barcode,
    rveelGovernedPacketClaims: [{ exactWording: 'High Fibre', evidenceId: 'e1' }],
    _publication: {
      settled: true,
      body: {
        publicationStatus: 'rated',
        publishedScore: 12,
        assessmentLanes: { nutrition: 'resolved', processing: 'resolved' },
      },
      planet: {
        publicationStatus: 'rated',
        publishedScore: 12,
        assessmentLanes: { broad_environment: 'resolved', packaging_fallback: 'resolved' },
      },
      claims: {
        publicationStatus: 'rated',
        publishedScore: 12,
        assessmentLanes: { packet: 'assessed', benchmark: 'assessed' },
      },
      transparency: {
        publicationStatus: 'rated',
        publishedScore: 12,
        assessmentLanes: { ingredient_clarity: 'resolved', origins: 'resolved' },
      },
      overall: { publicationStatus: 'rated', publishedScore: 12 },
    },
  } as Product;
}

describe('WP09 dual thumbs Correct unavailable contract', () => {
  const barcode = '9300652817232';

  it('exposes honest non-submitting Correct copy constants', () => {
    expect(CORRECT_STRUCTURED_UNAVAILABLE_TITLE.length).toBeGreaterThan(0);
    expect(CORRECT_STRUCTURED_UNAVAILABLE_BODY).toMatch(/does not change/i);
    expect(CORRECT_STRUCTURED_UNAVAILABLE_BODY).toMatch(/structured correction/i);
  });

  it('keeps Agree open when packet Change is ineligible', () => {
    const product = ratedProduct(barcode);
    const gate = agreementSurfaceGate('packet_information', product, {
      publicationSettled: true,
      settledBarcode: barcode,
      currentBarcode: barcode,
    });
    expect(gate.ok).toBe(true);
    if (gate.ok) {
      expect(gate.destination).toBeNull();
    }
    expect(
      eligibleAgreementChangeJourney('packet_information', product, { publicationSettled: true }).ok
    ).toBe(false);
  });

  it('CommunityAgreementBar keeps Correct control when correctEnabled is false', () => {
    const source = require('fs').readFileSync(
      require('path').join(
        __dirname,
        '../../../components/communityAgreement/CommunityAgreementBar.tsx'
      ),
      'utf8'
    );
    expect(source).toContain('onCorrectUnavailable');
    expect(source).toContain('thumbs-down-outline');
    expect(source).not.toMatch(/correctEnabled \? \([\s\S]*thumbs-down-outline[\s\S]*\) : null/);
  });
});
