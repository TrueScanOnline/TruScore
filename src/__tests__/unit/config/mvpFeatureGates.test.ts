/**
 * @jest-environment node
 */
import {
  assertMvpFeatureGatesReleaseSafe,
  isCommunityAgreementsEnabled,
  isGuidedContributionSubmitEnabled,
} from '../../../config/mvpFeatureGates';

describe('mvpFeatureGates', () => {
  const prevContribution = process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION;
  const prevAgreements = process.env.EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS;
  const prevAuthority = process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV;
  const prevStore = process.env.EXPO_PUBLIC_STORE_RELEASE;

  afterEach(() => {
    if (prevContribution === undefined) delete process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION;
    else process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION = prevContribution;
    if (prevAgreements === undefined) delete process.env.EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS;
    else process.env.EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS = prevAgreements;
    if (prevAuthority === undefined) delete process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV;
    else process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = prevAuthority;
    if (prevStore === undefined) delete process.env.EXPO_PUBLIC_STORE_RELEASE;
    else process.env.EXPO_PUBLIC_STORE_RELEASE = prevStore;
  });

  it('defaults guided contribution and community agreements OFF', () => {
    delete process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION;
    delete process.env.EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS;
    delete process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV;
    expect(isGuidedContributionSubmitEnabled()).toBe(false);
    expect(isCommunityAgreementsEnabled()).toBe(false);
  });

  it('requires both contribution flag and authority env', () => {
    process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION = '1';
    delete process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV;
    expect(isGuidedContributionSubmitEnabled()).toBe(false);
    process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = 'uat';
    expect(isGuidedContributionSubmitEnabled()).toBe(true);
  });

  it('fails closed for community agreements unless explicitly entitled', () => {
    delete process.env.EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS;
    expect(isCommunityAgreementsEnabled()).toBe(false);
    process.env.EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS = '1';
    expect(isCommunityAgreementsEnabled()).toBe(true);
  });

  it('rejects store releases that entitle Community Agreements', () => {
    process.env.EXPO_PUBLIC_STORE_RELEASE = '1';
    process.env.EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS = '1';
    expect(() => assertMvpFeatureGatesReleaseSafe()).toThrow(/Community Agreements/);
    process.env.EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS = '0';
    expect(() => assertMvpFeatureGatesReleaseSafe()).not.toThrow();
  });
});
