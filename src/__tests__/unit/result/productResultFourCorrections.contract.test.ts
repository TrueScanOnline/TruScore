/**
 * Founder Product Result four corrections — presentation contracts.
 * Does not change scoring, Confidence derivation, or Evidence Authority admission.
 */

import fs from 'fs';
import path from 'path';
import {
  packetClaimsCardShowsAddAction,
  packetClaimsCardShowsLimitedConfidenceBadge,
} from '../../../components/packetClaimsCardCopy';
import { PACKET_INFORMATION_ADD } from '../../../contribution/resultContributionActions';
import { voluntaryContributionOffer } from '../../../contribution/voluntaryContributionOffer';
import { eligibleAgreementChangeJourney } from '../../../communityAgreement/changeJourney';
import type { Product } from '../../../types/product';

const REPO = path.join(__dirname, '../../../..');
const RESULT = path.join(REPO, 'app/result/[barcode].tsx');

function settledPacketProduct(extra: Partial<Product> = {}): Product {
  return {
    barcode: '9414732208565',
    product_name: 'Fixture',
    brands: 'Test',
    rveelPacketAbsenceEstablished: true,
    rveelGovernedPacketClaims: [],
    rveelGovernedCertifications: [],
    certifications: [],
    _publication: {
      settled: true,
      overall: { publicationStatus: 'rated' },
      body: {
        publicationStatus: 'rated',
        assessmentLanes: { nutrition: 'resolved', processing: 'resolved' },
      },
      planet: { publicationStatus: 'rated' },
      claims: {
        publicationStatus: 'rated',
        confidence: 'limited',
        confidenceReasonCode: 'claims_primary_contribution_limited',
        assessmentLanes: { packet: 'assessed' },
      },
      transparency: {
        publicationStatus: 'rated',
        assessmentLanes: { ingredient: 'resolved', origins: 'resolved' },
      },
    },
    ...extra,
  } as Product;
}

describe('Product Result four corrections contracts', () => {
  const result = fs.readFileSync(RESULT, 'utf8');

  it('places Report Incorrect Assessment once after Disclaimer, including hold context', () => {
    const disclaimerIdx = result.indexOf('<ProductDisclaimerCard');
    const reportIdx = result.indexOf('testID="result-report-assessment"');
    const holdIdx = result.indexOf('testID="result-report-assessment-hold"');
    const scanIdx = result.indexOf('testID="result-scan-another"');
    expect(disclaimerIdx).toBeGreaterThan(0);
    expect(reportIdx).toBeGreaterThan(disclaimerIdx);
    expect(holdIdx).toBeGreaterThan(disclaimerIdx);
    expect(scanIdx).toBeGreaterThan(0);
    expect(scanIdx).toBeLessThan(disclaimerIdx);
    expect(result.split('testID="result-report-assessment"').length - 1).toBe(1);
    expect(result.split('testID="result-report-assessment-hold"').length - 1).toBe(1);
    expect(result).toContain('fixedConcern="administrative_hold_or_review"');
    expect(result).toContain('navigateToScanHome(navigation)');
  });

  it('keeps Scan Another as a prominent primary footer action', () => {
    expect(result).toContain('minHeight: 56');
    expect(result).toContain('testID="result-scan-another"');
    expect(result).toContain('scanAnotherFooter');
  });

  it('aligns empty Packet Claims Add with Origins-style empty-state gating', () => {
    expect(PACKET_INFORMATION_ADD).toBe('Add packet claims');
    expect(result).toContain('packetClaimsCardShowsAddAction');
    expect(result).toContain('testID="result-add-packet-claims"');
    expect(result).toContain("openContribution('packetClaims', 'add'");
    expect(
      packetClaimsCardShowsAddAction({ showEmptyState: true, hasAddPacketMenuRow: true })
    ).toBe(true);
  });

  it('suppresses Packet Claims Limited confidence only after admitted absence', () => {
    expect(result).toContain('packetClaimsCardShowsLimitedConfidenceBadge');
    expect(
      packetClaimsCardShowsLimitedConfidenceBadge({
        absenceEstablished: true,
        confidenceReasonCode: 'claims_primary_contribution_limited',
      })
    ).toBe(false);
    const product = settledPacketProduct();
    expect(product._publication?.claims.confidence).toBe('limited');
    expect(product._publication?.claims.confidenceReasonCode).toBe(
      'claims_primary_contribution_limited'
    );
  });

  it('keeps Change / WP09 correction eligible after admitted packet absence', () => {
    const product = settledPacketProduct();
    const offer = voluntaryContributionOffer(product, { publicationSettled: true });
    expect(offer.some((row) => row.destination === 'packetClaims' && row.journey === 'change')).toBe(
      true
    );
    expect(eligibleAgreementChangeJourney('packet_information', product, { publicationSettled: true })).toEqual(
      { ok: true, destination: 'packetClaims' }
    );
  });
});
