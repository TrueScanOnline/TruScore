/**
 * Empty Packet Claims Add reconciles FM-03R (photo-free) and FM-03 (photo-supported).
 * Does not broaden FM-03R eligibility beyond Claims NR gates.
 */

import fs from 'fs';
import path from 'path';
import {
  CLAIMS_PACKET_ABSENCE_PILLAR_LABEL,
  claimsPacketAbsencePillarEligible,
  claimsPacketAbsencePillarIneligibilityReason,
  packetClaimsPhotoAbsenceDiscoverable,
} from '../../../lib/scoreHighlights/highlightContributionLinks';
import { resultContributionActions } from '../../../contribution/resultContributionActions';
import type { Product } from '../../../types/product';
import type { CrossPillarPublicationSnapshot } from '../../../lib/rateability/types';

const REPO = path.join(__dirname, '../../../..');

function publication(input: {
  claimsStatus?: 'nr' | 'rated' | 'checking';
  packet?: 'assessed' | 'unassessed_or_incomplete';
  publishedScore?: number | null;
  opportunityLive?: boolean;
}): CrossPillarPublicationSnapshot {
  const claimsStatus = input.claimsStatus ?? 'nr';
  const packet = input.packet ?? 'unassessed_or_incomplete';
  return {
    settled: true,
    overall: { publicationStatus: claimsStatus === 'rated' ? 'rated' : 'nr' },
    body: {
      publicationStatus: 'rated',
      assessmentLanes: { nutrition: 'resolved', processing: 'resolved' },
    },
    planet: { publicationStatus: 'rated' },
    claims: {
      publicationStatus: claimsStatus,
      publishedScore: input.publishedScore === undefined ? null : input.publishedScore,
      assessmentLanes: { packet },
      s26: {
        contributionOpportunity: {
          material: input.opportunityLive !== false,
          routeStatus: input.opportunityLive === false ? 'closed' : 'live',
          routeKey: 'packet_claims',
        },
      },
    },
    transparency: {
      publicationStatus: 'rated',
      assessmentLanes: { ingredient_clarity: 'resolved', origins: 'resolved' },
    },
  } as CrossPillarPublicationSnapshot;
}

function product(pub: CrossPillarPublicationSnapshot, extra: Partial<Product> = {}): Product {
  return {
    barcode: '9414732208565',
    certifications: [],
    rveelGovernedPacketClaims: [],
    rveelGovernedCertifications: [],
    _publication: pub,
    ...extra,
  } as Product;
}

describe('Packet Claims FM-03 / FM-03R entry reconciliation', () => {
  const prevGuided = process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION;
  const prevEnv = process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV;
  const prevPreselected = process.env.EXPO_PUBLIC_MVP_PRESELECTED_ONLY;

  beforeAll(() => {
    // Preselected-only MVP: free-form/photo guided OFF; FM-03R attestation ON via authority env.
    process.env.EXPO_PUBLIC_MVP_PRESELECTED_ONLY = '1';
    process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION = '0';
    process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = 'uat';
  });

  afterAll(() => {
    if (prevGuided === undefined) delete process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION;
    else process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION = prevGuided;
    if (prevEnv === undefined) delete process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV;
    else process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = prevEnv;
    if (prevPreselected === undefined) delete process.env.EXPO_PUBLIC_MVP_PRESELECTED_ONLY;
    else process.env.EXPO_PUBLIC_MVP_PRESELECTED_ONLY = prevPreselected;
  });

  it('keeps the approved FM-03R label and exposes card Add choice + attestation wire-up', () => {
    expect(CLAIMS_PACKET_ABSENCE_PILLAR_LABEL).toBe('There are no claims on the packet');
    const result = fs.readFileSync(path.join(REPO, 'app/result/[barcode].tsx'), 'utf8');
    expect(result).toContain("setContributionChoice('packetClaimsAdd')");
    expect(result).toContain('result-packet-fm03r-absence');
    expect(result).toContain('CLAIMS_PACKET_ABSENCE_PILLAR_LABEL');
    expect(result).toContain('submitClaimsAbsenceAttestationFromPillar');
    expect(result).toContain("publicationHold?.status === 'held'");
    expect(result).toContain('FM-03 photographed absence retired');
  });

  it('allows FM-03R only for Claims NR with live opportunity and no contradiction', () => {
    const pub = publication({});
    const current = product(pub);
    const actions = resultContributionActions(current);
    expect(claimsPacketAbsencePillarIneligibilityReason(current, pub, actions)).toBeNull();
    expect(claimsPacketAbsencePillarEligible(current, pub, actions)).toBe(true);
    // Photo FM-03 retired from MVP consumer entry under preselected-only.
    expect(packetClaimsPhotoAbsenceDiscoverable(current)).toBe(false);
  });

  it('rejects FM-03R for Claims Rated without broadening gates', () => {
    const pub = publication({ claimsStatus: 'rated', publishedScore: 18, packet: 'assessed' });
    const current = product(pub);
    const actions = resultContributionActions(current);
    expect(claimsPacketAbsencePillarEligible(current, pub, actions)).toBe(false);
    expect(claimsPacketAbsencePillarIneligibilityReason(current, pub, actions)).toMatch(
      /claims_status_rated|packet_lane_assessed|claims_published_score/
    );
  });

  it('rejects FM-03R when absence already admitted or packet evidence contradicts', () => {
    const pub = publication({});
    const admitted = product(pub, { rveelPacketAbsenceEstablished: true });
    expect(
      claimsPacketAbsencePillarIneligibilityReason(
        admitted,
        pub,
        resultContributionActions(admitted)
      )
    ).toBe('absence_already_admitted');
    const contradicted = product(pub, {
      rveelGovernedPacketClaims: [{ exactWording: 'Gluten free', evidenceId: 'e1' } as never],
    });
    expect(
      claimsPacketAbsencePillarIneligibilityReason(
        contradicted,
        pub,
        resultContributionActions(contradicted)
      )
    ).toBe('contradictory_packet_evidence');
    expect(packetClaimsPhotoAbsenceDiscoverable(contradicted)).toBe(false);
  });

  it('does not require a photo for FM-03R eligibility predicates', () => {
    const links = fs.readFileSync(
      path.join(REPO, 'src/lib/scoreHighlights/highlightContributionLinks.ts'),
      'utf8'
    );
    expect(links).toContain('claimsPacketAbsencePillarEligible');
    expect(links).not.toMatch(/claimsPacketAbsencePillarEligible[\s\S]{0,400}targeted/);
    expect(links).toContain('photo-free');
  });
});
