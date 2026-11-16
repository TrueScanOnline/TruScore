import Constants from 'expo-constants';
import { isOffPublicContributionEnabled } from '../../../config/offContributionGate';
import {
  isLocalShareAnalyticsEnabled,
  isShareEventTelemetryEnabled,
} from '../../../config/shareTelemetryGate';
import {
  LEGAL_DOCUMENTS_VERSION,
  arePublishedLegalDocumentsReady,
  requiresPublishedLegalDocumentAcceptance,
} from '../../../config/legalGate';
import { buildAssessmentReportMailto } from '../../../utils/reportAssessmentMailto';
import { shouldWithholdConsumerPublication } from '../../../services/publicationHold';
import { buildOffUserAgent, isOffApiContactConfigured } from '../../../config/offApiIdentity';

describe('MVP launch hardening gates', () => {
  const originalEnv = process.env;
  const extra = Constants.expoConfig!.extra as Record<string, unknown>;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_STORE_RELEASE;
    extra.supportEmail = '';
    extra.offApiContactEmail = '';
    extra.offPublicContribution = '0';
    extra.shareEventTelemetry = '0';
    extra.localShareAnalytics = '0';
    extra.legalDocumentsTestReady = '0';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('defaults OFF public contribution and share telemetry to disabled', () => {
    expect(isOffPublicContributionEnabled()).toBe(false);
    expect(isShareEventTelemetryEnabled()).toBe(false);
    expect(isLocalShareAnalyticsEnabled()).toBe(false);
  });

  it('enables gates only with explicit =1', () => {
    extra.offPublicContribution = '1';
    extra.shareEventTelemetry = '1';
    extra.localShareAnalytics = '1';
    expect(isOffPublicContributionEnabled()).toBe(true);
    expect(isShareEventTelemetryEnabled()).toBe(true);
    expect(isLocalShareAnalyticsEnabled()).toBe(true);
  });

  it('never uses the retired placeholder mailbox in User-Agent', () => {
    expect(buildOffUserAgent()).not.toContain('truescan@example.com');
    expect(isOffApiContactConfigured()).toBe(false);
    expect(buildOffUserAgent()).toBe('Rveel/1.0.0');
  });

  it('includes configured contact in User-Agent when present', () => {
    extra.offApiContactEmail = 'ops@rveel.test';
    expect(isOffApiContactConfigured()).toBe(true);
    expect(buildOffUserAgent()).toBe('Rveel/1.0.0 (ops@rveel.test)');
  });

  it('builds assessment mailto only with a real support address', () => {
    expect(buildAssessmentReportMailto('', 'subj', { barcode: '123' })).toBeNull();
    const url = buildAssessmentReportMailto('help@rveel.test', 'subj', {
      barcode: '9421901234567',
      productName: 'Test',
      errorType: 'identity',
    });
    expect(url).toContain('mailto:');
    expect(url).toContain('9421901234567');
    expect(url).not.toContain('example.com');
  });

  it('withholds for held and unavailable hold states only', () => {
    expect(shouldWithholdConsumerPublication({ status: 'none', barcode: '1' })).toBe(false);
    expect(
      shouldWithholdConsumerPublication({ status: 'held', barcode: '1', kind: 'administrative_hold' })
    ).toBe(true);
    expect(
      shouldWithholdConsumerPublication({
        status: 'unavailable',
        barcode: '1',
        kind: 'hold_state_unavailable',
      })
    ).toBe(true);
  });

  it('does not treat unpublished legal destinations as binding-ready in store runtime', () => {
    extra.storeRelease = '1';
    extra.legalDocumentsTestReady = '1';
    expect(arePublishedLegalDocumentsReady()).toBe(false);
    expect(requiresPublishedLegalDocumentAcceptance()).toBe(false);
    expect(LEGAL_DOCUMENTS_VERSION).toContain('unpublished');
  });
});
