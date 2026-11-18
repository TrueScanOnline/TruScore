/**
 * @jest-environment node
 */
import {
  MVP_CONTRIBUTION_INPUT_POLICY_VERSION,
  MVP_PACKET_CERTIFICATION_INPUT_RESTRICTION,
  isConsumerFreeFormGuidedContributionAllowed,
  isConsumerManualProductContributionAllowed,
  isConsumerPhotoEvidenceContributionAllowed,
  isConsumerVlmOcrContributionAllowed,
  isMvpConsumerInputClassPermitted,
  isMvpPreselectedOnlyConsumerPolicyActive,
} from '../../../config/mvpContributionInputPolicy';
import {
  discoveryFreeTextConsumerSubmissionAvailable,
  mvpDiscoveryInputRestriction,
} from '../../../certifications/discoveryCatalogue';
import {
  isClaimsAbsenceAttestationContributionEnabled,
  isGuidedContributionSubmitEnabled,
} from '../../../config/mvpFeatureGates';

describe('mvpContributionInputPolicy', () => {
  const prev = process.env.EXPO_PUBLIC_MVP_PRESELECTED_ONLY;
  const prevAuth = process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV;
  const prevGuided = process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION;

  afterEach(() => {
    if (prev === undefined) delete process.env.EXPO_PUBLIC_MVP_PRESELECTED_ONLY;
    else process.env.EXPO_PUBLIC_MVP_PRESELECTED_ONLY = prev;
    if (prevAuth === undefined) delete process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV;
    else process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = prevAuth;
    if (prevGuided === undefined) delete process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION;
    else process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION = prevGuided;
  });

  it('is active by default (founder 2026-11-18 corrective — default-deny)', () => {
    delete process.env.EXPO_PUBLIC_MVP_PRESELECTED_ONLY;
    expect(isMvpPreselectedOnlyConsumerPolicyActive()).toBe(true);
    expect(isConsumerPhotoEvidenceContributionAllowed()).toBe(false);
    expect(isConsumerManualProductContributionAllowed()).toBe(false);
    expect(isConsumerFreeFormGuidedContributionAllowed()).toBe(false);
    expect(isConsumerVlmOcrContributionAllowed()).toBe(false);
    expect(MVP_CONTRIBUTION_INPUT_POLICY_VERSION).toBe('mvp_preselected_only_v1_20261118');
  });

  it('denies photos, free text, manual product and VLM while active', () => {
    process.env.EXPO_PUBLIC_MVP_PRESELECTED_ONLY = '1';
    expect(isMvpPreselectedOnlyConsumerPolicyActive()).toBe(true);
    expect(isConsumerPhotoEvidenceContributionAllowed()).toBe(false);
    expect(isConsumerManualProductContributionAllowed()).toBe(false);
    expect(isConsumerFreeFormGuidedContributionAllowed()).toBe(false);
    expect(isConsumerVlmOcrContributionAllowed()).toBe(false);
    expect(isMvpConsumerInputClassPermitted('packet_absence_user_attestation')).toBe(true);
    expect(isMvpConsumerInputClassPermitted('photo_camera')).toBe(false);
  });

  it('overlays discovery free-text as unavailable under preselected-only', () => {
    delete process.env.EXPO_PUBLIC_MVP_PRESELECTED_ONLY;
    expect(MVP_PACKET_CERTIFICATION_INPUT_RESTRICTION.free_text_is_always_available).toBe(false);
    expect(discoveryFreeTextConsumerSubmissionAvailable()).toBe(false);
    expect(mvpDiscoveryInputRestriction().unmatched_action).toContain('unavailable');
  });

  it('keeps FM-03R available while free-form guided stays off under active policy', () => {
    process.env.EXPO_PUBLIC_MVP_PRESELECTED_ONLY = '1';
    process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION = '1';
    process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = 'uat';
    expect(isGuidedContributionSubmitEnabled()).toBe(false);
    expect(isClaimsAbsenceAttestationContributionEnabled()).toBe(true);
  });

  it('deactivates only with explicit PRESELECTED_ONLY=0 (post-MVP)', () => {
    process.env.EXPO_PUBLIC_MVP_PRESELECTED_ONLY = '0';
    expect(isMvpPreselectedOnlyConsumerPolicyActive()).toBe(false);
    expect(isConsumerPhotoEvidenceContributionAllowed()).toBe(true);
  });

  it('contains VLM/OCR activation in extraction.ts under the policy helper', () => {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const src = fs.readFileSync(
      path.join(__dirname, '../../../packetContribution/extraction.ts'),
      'utf8'
    );
    expect(src).toContain('isConsumerVlmOcrContributionAllowed');
    expect(src).toContain("producer.kind !== 'abstaining'");
  });
});
