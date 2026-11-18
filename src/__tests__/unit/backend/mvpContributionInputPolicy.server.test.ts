/**
 * Server policy module — proves prohibited writes are rejected before storage
 * when preselected-only is explicitly active (opt-in after 2026-11-18 restore).
 *
 * @jest-environment node
 */
import {
  MVP_CONTRIBUTION_INPUT_POLICY_VERSION,
  isMvpPreselectedOnlyPolicyActiveServer,
  rejectConsumerManualProductWriteIfPolicyActive,
  rejectConsumerPhotoUploadIfPolicyActive,
  rejectEvidenceAuthorityActionIfPolicyActive,
  submitPayloadUsesProhibitedMvpSource,
} from '../../../../backend/vercel/lib/mvpContributionInputPolicy';

describe('server mvpContributionInputPolicy', () => {
  const prev = process.env.RVEEL_MVP_PRESELECTED_ONLY;

  afterEach(() => {
    if (prev === undefined) delete process.env.RVEEL_MVP_PRESELECTED_ONLY;
    else process.env.RVEEL_MVP_PRESELECTED_ONLY = prev;
  });

  it('is inactive by default (founder 2026-11-18 restore — opt-in)', () => {
    delete process.env.RVEEL_MVP_PRESELECTED_ONLY;
    expect(isMvpPreselectedOnlyPolicyActiveServer()).toBe(false);
    expect(rejectConsumerPhotoUploadIfPolicyActive({}).ok).toBe(true);
    expect(rejectConsumerManualProductWriteIfPolicyActive({}).ok).toBe(true);
  });

  it('rejects consumer photo uploads before storage when active', () => {
    process.env.RVEEL_MVP_PRESELECTED_ONLY = '1';
    const denied = rejectConsumerPhotoUploadIfPolicyActive({});
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.status).toBe(403);
      expect(denied.error).toBe('mvp_preselected_only_photo_upload_forbidden');
      expect(denied.policyVersion).toBe(MVP_CONTRIBUTION_INPUT_POLICY_VERSION);
    }
  });

  it('rejects consumer manual-product POSTs when active', () => {
    process.env.RVEEL_MVP_PRESELECTED_ONLY = '1';
    const denied = rejectConsumerManualProductWriteIfPolicyActive({});
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.error).toBe('mvp_preselected_only_manual_product_write_forbidden');
    }
  });

  it('rejects EA photo and manual-text finalisation actions when active', () => {
    process.env.RVEEL_MVP_PRESELECTED_ONLY = '1';
    for (const action of [
      'authorize-evidence-image',
      'finalize-evidence-image',
      'finalize-manual-text',
    ]) {
      const denied = rejectEvidenceAuthorityActionIfPolicyActive({ action });
      expect(denied.ok).toBe(false);
    }
  });

  it('allows FM-03R attestation finalise and attestation-only submit when active', () => {
    process.env.RVEEL_MVP_PRESELECTED_ONLY = '1';
    expect(
      rejectEvidenceAuthorityActionIfPolicyActive({
        action: 'finalize-packet-absence-attestation',
      }).ok
    ).toBe(true);
    expect(
      submitPayloadUsesProhibitedMvpSource({
        facts: [{ domain: 'packet_claims', packetAbsence: true, finalizedAssetId: 'a1' }],
      })
    ).toBe(false);
    expect(
      rejectEvidenceAuthorityActionIfPolicyActive({
        action: 'submit',
        submitUsesProhibitedSource: false,
      }).ok
    ).toBe(true);
  });

  it('flags photo bytes and free-text facts as prohibited submit sources', () => {
    expect(submitPayloadUsesProhibitedMvpSource({ sourceBase64: 'abc' })).toBe(true);
    expect(
      submitPayloadUsesProhibitedMvpSource({
        facts: [{ domain: 'packet_claims', exactWording: 'Gluten Free' }],
      })
    ).toBe(true);
    expect(
      submitPayloadUsesProhibitedMvpSource({
        facts: [{ domain: 'packet_claims', packetAbsence: true, exactWording: 'sneaky' }],
      })
    ).toBe(true);
  });

  it('allows founder-admin bypass only with matching token when policy active', () => {
    process.env.RVEEL_MVP_PRESELECTED_ONLY = '1';
    const denied = rejectConsumerPhotoUploadIfPolicyActive({
      adminHeader: 'wrong',
      founderAdminToken: 'founder-secret-token',
    });
    expect(denied.ok).toBe(false);
    const allowed = rejectConsumerPhotoUploadIfPolicyActive({
      adminHeader: 'founder-secret-token',
      founderAdminToken: 'founder-secret-token',
    });
    expect(allowed.ok).toBe(true);
  });
});
