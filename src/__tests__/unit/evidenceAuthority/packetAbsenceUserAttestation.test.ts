/**
 * FM-03R — MVP User-Attested Packet Absence (photo-free).
 * Admits only through the dedicated attestation source kind.
 */

import {
  EvidenceAuthority,
  liveOffNetworkWriteAllowed,
} from '../../../evidenceAuthority/authority';
import { MemoryAuthorityStore } from '../../../evidenceAuthority/memoryStore';
import {
  PACKET_ABSENCE_USER_ATTESTATION_CONTENT_TYPE,
  claimsAbsenceAttestationIdempotencyKey,
  packetAbsenceAttestationSha256,
} from '../../../evidenceAuthority/packetAbsenceAttestationAsset';
import { MANUAL_TEXT_CONTENT_TYPE } from '../../../evidenceAuthority/manualTextAsset';
import {
  selectAdmittedPacketAbsence,
  selectPrevailingPacketClaims,
} from '../../../claims/packetClaimReceiver';
import { projectSnapshotForAssessment } from '../../../evidenceAuthority/assessment';
import { calculateEthicsPillar } from '../../../lib/truscoreEngine/pillars/ethicsPillar';
import { publishClaimsPillar } from '../../../lib/rateability/claimsPublication';
import type { Product } from '../../../types/product';
import { sha256Hex } from '../../../packetContribution/sha256';

const BARCODE = '9300673999999';

function service(env: 'uat' | 'production' = 'uat') {
  return new EvidenceAuthority(new MemoryAuthorityStore(), {
    authorityEnv: env,
    founderAdminToken: 'founder-uat',
  });
}

describe('FM-03R packet_absence_user_attestation_v1', () => {
  it('admits photo-free attestation and publishes assessed-neutral 15/25 with Limited confidence dependence', async () => {
    const authority = service('production');
    const contributor = await authority.issueCredential();
    const finalized = await authority.finalizePacketAbsenceAttestation({
      contributorId: contributor.contributorId,
      barcode: BARCODE,
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(finalized.contentType).toBe(PACKET_ABSENCE_USER_ATTESTATION_CONTENT_TYPE);

    const outcome = await authority.submit(contributor.contributorId, {
      idempotencyKey: claimsAbsenceAttestationIdempotencyKey(BARCODE, contributor.contributorId),
      barcode: BARCODE,
      facts: [
        {
          domain: 'packet_claims',
          packetAbsence: true,
          finalizedAssetId: finalized.assetId,
          unitId: 'attestation-unit',
        },
      ],
    });
    expect(outcome.status).toBe('admitted');
    const projected = projectSnapshotForAssessment(outcome.snapshot, 'production');
    expect(selectAdmittedPacketAbsence(projected)).toBe(true);
    expect(selectPrevailingPacketClaims(projected)).toHaveLength(0);
    expect(outcome.snapshot?.offDispatch ?? []).toHaveLength(0);

    const ethics = calculateEthicsPillar(
      { barcode: BARCODE, product_name: 'Plain oats', labels_tags: [], nutriments: {} } as Product,
      { admittedPacketAbsence: true }
    );
    expect(ethics.score).toBe(15);
    expect(ethics.details.primaryUserClaimsDependence).toBe(true);
    const published = publishClaimsPillar({
      product: { barcode: BARCODE, product_name: 'Plain oats' } as Product,
      ethics,
    });
    expect(published.publicationStatus).toBe('rated');
    expect(published.publishedScore).toBe(15);
    expect(published.confidence).toBe('limited');
  });

  it('rejects duplicate logical submission via idempotency and preserves one absence', async () => {
    const authority = service();
    const contributor = await authority.issueCredential();
    const finalized = await authority.finalizePacketAbsenceAttestation({
      contributorId: contributor.contributorId,
      barcode: BARCODE,
    });
    if (!finalized.ok) throw new Error('finalize failed');
    const key = claimsAbsenceAttestationIdempotencyKey(BARCODE, contributor.contributorId);
    const first = await authority.submit(contributor.contributorId, {
      idempotencyKey: key,
      barcode: BARCODE,
      facts: [{ domain: 'packet_claims', packetAbsence: true, finalizedAssetId: finalized.assetId }],
    });
    const second = await authority.submit(contributor.contributorId, {
      idempotencyKey: key,
      barcode: BARCODE,
      facts: [{ domain: 'packet_claims', packetAbsence: true, finalizedAssetId: finalized.assetId }],
    });
    expect(first.status).toBe('admitted');
    expect(second.status).toBe('admitted');
    expect(second.versionIds).toEqual(first.versionIds);
    expect(
      (await authority.history(BARCODE)).filter((row) => row.domain === 'packet_claims')
    ).toHaveLength(1);
  });

  it('rejects packet absence on manual_text and keeps that safeguard', async () => {
    const authority = service();
    const contributor = await authority.issueCredential();
    const denied = await authority.finalizeManualTextAsset({
      contributorId: contributor.contributorId,
      barcode: BARCODE,
      sessionId: 'sess',
      unitId: 'unit',
      domain: 'packet_claims',
      statement: 'No claims',
      packetAbsence: true,
    });
    expect(denied).toEqual({ ok: false, reason: 'packet_absence_requires_packet_evidence' });

    const claim = await authority.finalizeManualTextAsset({
      contributorId: contributor.contributorId,
      barcode: BARCODE,
      sessionId: 'sess-claim',
      unitId: 'unit-claim',
      domain: 'packet_claims',
      statement: 'High protein',
    });
    expect(claim.ok).toBe(true);
    if (!claim.ok) return;
    const outcome = await authority.submit(contributor.contributorId, {
      idempotencyKey: 'abuse-manual-absence',
      barcode: BARCODE,
      facts: [
        {
          domain: 'packet_claims',
          packetAbsence: true,
          finalizedAssetId: claim.assetId,
        },
      ],
    });
    expect(outcome.status).not.toBe('admitted');
  });

  it('rejects attestation asset used for a positive claim fact', async () => {
    const authority = service();
    const contributor = await authority.issueCredential();
    const finalized = await authority.finalizePacketAbsenceAttestation({
      contributorId: contributor.contributorId,
      barcode: BARCODE,
    });
    if (!finalized.ok) throw new Error('finalize failed');
    const outcome = await authority.submit(contributor.contributorId, {
      idempotencyKey: 'wrong-fact-on-attestation',
      barcode: BARCODE,
      facts: [
        {
          domain: 'packet_claims',
          exactWording: 'High protein',
          claimValue: 'High protein',
          finalizedAssetId: finalized.assetId,
        },
      ],
    });
    expect(outcome.status).not.toBe('admitted');
  });

  it('rejects attestation bound to a different barcode', async () => {
    const authority = service();
    const contributor = await authority.issueCredential();
    const finalized = await authority.finalizePacketAbsenceAttestation({
      contributorId: contributor.contributorId,
      barcode: BARCODE,
    });
    if (!finalized.ok) throw new Error('finalize failed');
    const outcome = await authority.submit(contributor.contributorId, {
      idempotencyKey: 'wrong-barcode',
      barcode: '9300673000000',
      facts: [
        {
          domain: 'packet_claims',
          packetAbsence: true,
          finalizedAssetId: finalized.assetId,
        },
      ],
    });
    expect(outcome.status).toBe('source_not_owned');
  });

  it('does not schedule OFF write-back for admitted packet absence attestation', async () => {
    expect(liveOffNetworkWriteAllowed()).toBe(false);
    const authority = service('uat');
    const contributor = await authority.issueCredential();
    const finalized = await authority.finalizePacketAbsenceAttestation({
      contributorId: contributor.contributorId,
      barcode: BARCODE,
    });
    if (!finalized.ok) throw new Error('finalize failed');
    const outcome = await authority.submit(contributor.contributorId, {
      idempotencyKey: 'off-check',
      barcode: BARCODE,
      facts: [
        {
          domain: 'packet_claims',
          packetAbsence: true,
          finalizedAssetId: finalized.assetId,
        },
      ],
    });
    expect(outcome.status).toBe('admitted');
    expect(outcome.snapshot?.offDispatch ?? []).toEqual([]);
  });

  it('builds a distinguishable attestation document hash', () => {
    const left = packetAbsenceAttestationSha256({ barcode: BARCODE });
    const right = packetAbsenceAttestationSha256({ barcode: BARCODE, variantKey: 'v2' });
    expect(left?.document.sourceKind).toBe(PACKET_ABSENCE_USER_ATTESTATION_CONTENT_TYPE);
    expect(left?.sha256).not.toBe(right?.sha256);
    expect(left?.document.declaration).toBe('no_relevant_claims_or_certifications_on_packet');
    expect(MANUAL_TEXT_CONTENT_TYPE).not.toBe(PACKET_ABSENCE_USER_ATTESTATION_CONTENT_TYPE);
    expect(sha256Hex(left!.bytes)).toBe(left!.sha256);
  });

  it('later positive packet claim restores prevailing positive evidence', async () => {
    let now = 1_900_000_000_000;
    const authority = new EvidenceAuthority(new MemoryAuthorityStore(), {
      authorityEnv: 'production',
      founderAdminToken: 'founder-uat',
      now: () => now,
    });
    const contributor = await authority.issueCredential();
    const finalized = await authority.finalizePacketAbsenceAttestation({
      contributorId: contributor.contributorId,
      barcode: BARCODE,
    });
    if (!finalized.ok) throw new Error('finalize failed');
    await authority.submit(contributor.contributorId, {
      idempotencyKey: 'absence-first',
      barcode: BARCODE,
      facts: [{ domain: 'packet_claims', packetAbsence: true, finalizedAssetId: finalized.assetId }],
    });
    now += 60_000;
    const bytes = new TextEncoder().encode('packet-source');
    const restored = await authority.submit(contributor.contributorId, {
      idempotencyKey: 'positive-after',
      barcode: BARCODE,
      sourceBytes: bytes,
      declaredSha256: sha256Hex(bytes),
      facts: [{ domain: 'packet_claims', exactWording: 'Source of fibre', claimValue: 'Source of fibre' }],
    });
    const after = projectSnapshotForAssessment(restored.snapshot, 'production');
    expect(selectAdmittedPacketAbsence(after)).toBe(false);
    expect(selectPrevailingPacketClaims(after).map((row) => row.exactWording)).toEqual(['Source of fibre']);
  });
});
