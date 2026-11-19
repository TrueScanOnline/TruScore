/**
 * Packet Claims WP09: persistence/switch/reset + Correct path acceptance under MVP.
 * Correct without structured destination must stay non-mutating (honest unavailable).
 */

import {
  CommunityAgreementService,
  buildAgreementRevision,
  createMemoryAgreementStore,
  selectAgreementTargets,
  eligibleAgreementChangeJourney,
} from '../../../communityAgreement';
import { agreementSurfaceGate } from '../../../communityAgreement/surfaceGate';
import {
  CORRECT_STRUCTURED_UNAVAILABLE_BODY,
  CORRECT_STRUCTURED_UNAVAILABLE_TITLE,
} from '../../../communityAgreement/correctUnavailableCopy';
import type { SharedEvidenceSnapshot } from '../../../evidenceAuthority/types';
import type { Product } from '../../../types/product';

function packetSnap(versionId: string, author: string): SharedEvidenceSnapshot {
  return {
    barcode: '9300652817232',
    authorityEnv: 'uat',
    epoch: 'wave4a.uat',
    recordClass: 'uat',
    generatedAt: 1,
    withdrawnSubjectKeys: [],
    prevailing: [
      {
        subjectKey: 'packet_claims|statement:high fibre',
        versionId,
        versionNo: 1,
        admissionSeq: 1,
        governance: 'active',
        evidence: {
          domain: 'packet_claims',
          exactWording: 'High Fibre',
          claimValue: 'High Fibre',
          submitterId: author,
          admissionStatus: 'admitted',
        },
      },
    ],
    offDispatch: [],
  } as SharedEvidenceSnapshot;
}

function ratedPacketProduct(): Product {
  return {
    barcode: '9300652817232',
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

describe('WP09 Packet Claims persistence and Correct path', () => {
  it('Agree persists once per credential+revision and resets on new admitted version', async () => {
    const store = createMemoryAgreementStore();
    const service = new CommunityAgreementService({
      authorityEnv: 'uat',
      store,
      newId: () => `agr_${store.rows.length + 1}`,
    });
    const firstSnap = packetSnap('ver_pkt_1', 'rveel_author');
    const firstRevision = buildAgreementRevision({
      authorityEnv: 'uat',
      barcode: '9300652817232',
      variantKey: '',
      cardGroup: 'packet_information',
      pairs: selectAgreementTargets('packet_information', firstSnap),
    });
    const first = await service.agree({
      barcode: '9300652817232',
      cardGroup: 'packet_information',
      expectedRevisionId: firstRevision.revisionId,
      contributorId: 'rveel_reader',
      snapshot: firstSnap,
    });
    expect(first.ok).toBe(true);
    const again = await service.agree({
      barcode: '9300652817232',
      cardGroup: 'packet_information',
      expectedRevisionId: firstRevision.revisionId,
      contributorId: 'rveel_reader',
      snapshot: firstSnap,
    });
    expect(again.ok).toBe(true);
    if (again.ok) expect(again.body.count).toBe(1);

    const secondSnap = packetSnap('ver_pkt_2', 'rveel_corrector');
    const secondGet = await service.get({
      barcode: '9300652817232',
      cardGroup: 'packet_information',
      snapshot: secondSnap,
    });
    expect(secondGet.ok && secondGet.body.count).toBe(0);
    expect(secondGet.ok && secondGet.body.revisionId).not.toBe(firstRevision.revisionId);
  });

  it('Agree surface opens without Change destination; Correct path stays non-mutating unavailable copy', () => {
    const product = ratedPacketProduct();
    const gate = agreementSurfaceGate('packet_information', product, {
      publicationSettled: true,
      settledBarcode: '9300652817232',
      currentBarcode: '9300652817232',
    });
    expect(gate.ok).toBe(true);
    if (gate.ok) expect(gate.destination).toBeNull();
    expect(
      eligibleAgreementChangeJourney('packet_information', product, { publicationSettled: true }).ok
    ).toBe(false);
    expect(CORRECT_STRUCTURED_UNAVAILABLE_TITLE).toMatch(/not available/i);
    expect(CORRECT_STRUCTURED_UNAVAILABLE_BODY).toMatch(/does not change, reject, or withdraw/i);
  });
});
