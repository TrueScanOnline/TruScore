import Constants from 'expo-constants';
import {
  LEGAL_DOCUMENTS_VERSION,
  hasCurrentPublishedLegalAcceptance,
  requiresPublishedLegalDocumentAcceptance,
} from '../../../config/legalGate';

describe('legal version gate', () => {
  const extra = Constants.expoConfig!.extra as Record<string, unknown>;

  beforeEach(() => {
    extra.storeRelease = '0';
    extra.legalDocumentsTestReady = '0';
  });

  it('does not require published acceptance while drafts are unpublished', () => {
    expect(requiresPublishedLegalDocumentAcceptance()).toBe(false);
    expect(hasCurrentPublishedLegalAcceptance(null)).toBe(true);
  });

  it('requires matching version once published docs are ready (non-store test path)', () => {
    extra.legalDocumentsTestReady = '1';
    expect(requiresPublishedLegalDocumentAcceptance()).toBe(true);
    expect(hasCurrentPublishedLegalAcceptance(null)).toBe(false);
    expect(hasCurrentPublishedLegalAcceptance('old-version')).toBe(false);
    expect(hasCurrentPublishedLegalAcceptance(LEGAL_DOCUMENTS_VERSION)).toBe(true);
  });

  it('blocks test-ready entitlement on store releases', () => {
    extra.storeRelease = '1';
    extra.legalDocumentsTestReady = '1';
    expect(requiresPublishedLegalDocumentAcceptance()).toBe(false);
  });
});
