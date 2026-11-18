/**
 * Server policy — default-deny with structured Origins + FM-03R exceptions.
 *
 * @jest-environment node
 */
import {
  MVP_CONTRIBUTION_INPUT_POLICY_VERSION,
  isMvpPreselectedOnlyPolicyActiveServer,
  isStructuredOriginsManualTextBody,
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

  it('is active by default (default-deny)', () => {
    delete process.env.RVEEL_MVP_PRESELECTED_ONLY;
    expect(isMvpPreselectedOnlyPolicyActiveServer()).toBe(true);
    expect(rejectConsumerPhotoUploadIfPolicyActive({}).ok).toBe(false);
    expect(rejectConsumerManualProductWriteIfPolicyActive({}).ok).toBe(false);
  });

  it('rejects free-form finalize-manual-text when active', () => {
    process.env.RVEEL_MVP_PRESELECTED_ONLY = '1';
    const denied = rejectEvidenceAuthorityActionIfPolicyActive({
      action: 'finalize-manual-text',
      body: { domain: 'origins', statement: 'Made in NZ', originClaimType: 'made_in', originCountry: 'New Zealand' },
    });
    expect(denied.ok).toBe(false);
  });

  it('allows structured Origins finalize-manual-text (claim type + country, no statement)', () => {
    process.env.RVEEL_MVP_PRESELECTED_ONLY = '1';
    const body = {
      domain: 'origins',
      originClaimType: 'made_in',
      originCountry: 'New Zealand',
      percentageNotStated: true,
    };
    expect(isStructuredOriginsManualTextBody(body)).toBe(true);
    expect(
      rejectEvidenceAuthorityActionIfPolicyActive({
        action: 'finalize-manual-text',
        body,
      }).ok
    ).toBe(true);
  });

  it('rejects photo and evidence-image finalisation when active', () => {
    process.env.RVEEL_MVP_PRESELECTED_ONLY = '1';
    for (const action of ['authorize-evidence-image', 'finalize-evidence-image']) {
      expect(rejectEvidenceAuthorityActionIfPolicyActive({ action }).ok).toBe(false);
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
  });

  it('allows structured Origins submit facts and rejects free-text origins', () => {
    process.env.RVEEL_MVP_PRESELECTED_ONLY = '1';
    expect(
      submitPayloadUsesProhibitedMvpSource({
        facts: [
          {
            domain: 'origins',
            claimValue: 'New Zealand',
            finalizedAssetId: 'a1',
            originStructured: {
              claimType: 'made_in',
              primaryCountry: 'New Zealand',
              percentageNotStated: true,
            },
          },
        ],
      })
    ).toBe(false);
    expect(
      submitPayloadUsesProhibitedMvpSource({
        facts: [
          {
            domain: 'origins',
            exactWording: 'Made in NZ from local and imported',
            claimValue: 'New Zealand',
            finalizedAssetId: 'a1',
            originStructured: {
              claimType: 'made_in',
              primaryCountry: 'New Zealand',
            },
          },
        ],
      })
    ).toBe(true);
  });

  it('flags photo bytes and free-text packet facts as prohibited', () => {
    expect(submitPayloadUsesProhibitedMvpSource({ sourceBase64: 'abc' })).toBe(true);
    expect(
      submitPayloadUsesProhibitedMvpSource({
        facts: [{ domain: 'packet_claims', exactWording: 'Gluten Free' }],
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
    expect(MVP_CONTRIBUTION_INPUT_POLICY_VERSION).toContain('mvp_preselected_only');
  });
});
