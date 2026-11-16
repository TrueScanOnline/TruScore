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
