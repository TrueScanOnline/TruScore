/**
 * Legal acknowledgement gate helpers.
 *
 * Binding Terms/Privacy acceptance is only allowed when destinations are ready
 * (or a segregated non-store test entitlement is set).
 */

import Constants from 'expo-constants';
import { isLegalDestinationReady } from './legalDestinations';

/** Bump when published Terms/Privacy materially change after readiness. */
export const LEGAL_DOCUMENTS_VERSION = '2026-11-16-unpublished';

function isStoreReleaseForLegalGate(): boolean {
  const raw = Constants.expoConfig?.extra?.storeRelease;
  return raw === '1' || raw === 1 || raw === true;
}

export function arePublishedLegalDocumentsReady(): boolean {
  if (isLegalDestinationReady('privacy') && isLegalDestinationReady('terms')) {
    return true;
  }
  // Segregated UAT/dev test path — never available in store releases.
  if (isStoreReleaseForLegalGate()) return false;
  const raw = Constants.expoConfig?.extra?.legalDocumentsTestReady;
  return raw === '1' || raw === 1 || raw === true;
}

export function requiresPublishedLegalDocumentAcceptance(): boolean {
  return arePublishedLegalDocumentsReady();
}

/**
 * Prior disclaimer acknowledgement alone is never enough once published Terms/Privacy are ready.
 * Binding acceptance must match the current LEGAL_DOCUMENTS_VERSION.
 */
export function hasCurrentPublishedLegalAcceptance(
  acceptedVersion: string | null | undefined
): boolean {
  if (!requiresPublishedLegalDocumentAcceptance()) {
    // Drafts unpublished — version stamp must remain unset / non-binding.
    return true;
  }
  return (
    typeof acceptedVersion === 'string' &&
    acceptedVersion.length > 0 &&
    acceptedVersion === LEGAL_DOCUMENTS_VERSION
  );
}
