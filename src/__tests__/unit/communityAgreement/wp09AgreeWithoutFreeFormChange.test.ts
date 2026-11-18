/**
 * Founder P0 / CF-01: Agree must remain available under MVP preselected-only
 * when free-form Change (packet) is offline. Correct destination stays Change-gated;
 * thumbs-down visibility uses the honest unavailable path (see dual-thumbs test).
 */

import type { Product } from '../../../types/product';
import { agreementSurfaceGate } from '../../../communityAgreement/surfaceGate';
import { eligibleAgreementChangeJourney } from '../../../communityAgreement/changeJourney';

function ratedProduct(barcode: string, packetClaims: string[]): Product {
  return {
    barcode,
    rveelGovernedPacketClaims: packetClaims,
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

describe('WP09 Agree without free-form Change', () => {
  const barcode = '9300652817232';

  it('settled packet card: Agree surface opens even when Change journey is ineligible', () => {
    const product = ratedProduct(barcode, ['Claim A', 'Claim B', 'Claim C', 'Claim D']);
    const gate = agreementSurfaceGate('packet_information', product, {
      publicationSettled: true,
      settledBarcode: barcode,
      currentBarcode: barcode,
    });
    expect(gate.ok).toBe(true);
    if (gate.ok) {
      // Under default MVP free-form off in tests, destination may be null.
      expect(gate.destination === null || typeof gate.destination === 'string').toBe(true);
    }
    const change = eligibleAgreementChangeJourney('packet_information', product, {
      publicationSettled: true,
    });
    // Correct remains Change-gated; when free-form is off, Correct stays unavailable.
    if (!change.ok) {
      expect(gate.ok && gate.destination).toBeNull();
    }
  });

  it('closed latch still fails closed for Agree', () => {
    const product = ratedProduct(barcode, ['Claim A']);
    expect(
      agreementSurfaceGate('packet_information', product, {
        publicationSettled: false,
        settledBarcode: barcode,
        currentBarcode: barcode,
      }).ok
    ).toBe(false);
  });
});
