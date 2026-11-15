import { productIdentity } from './productIdentity';

/**
 * Consumer-facing legal destination readiness for Account Stage 1.
 *
 * Verified 15 Nov 2026 against the URLs in productIdentity:
 * - https://truescan.app/privacy → HTTP 404 (not ready)
 * - https://truescan.app/terms → HTTP 500 (not ready)
 *
 * Do not open these URLs from Account until founders confirm live, approved content.
 * Interim Vercel hosts may serve draft HTML; productIdentity does not point there.
 */
export type LegalDestinationKey = 'privacy' | 'terms';

export type LegalDestinationStatus = {
  key: LegalDestinationKey;
  url: string;
  ready: boolean;
  verifiedAt: string;
  note: string;
};

export const LEGAL_DESTINATION_VERIFIED_AT = '2026-11-15';

export const legalDestinations: Record<LegalDestinationKey, LegalDestinationStatus> = {
  privacy: {
    key: 'privacy',
    url: productIdentity.privacyPolicyUrl,
    ready: false,
    verifiedAt: LEGAL_DESTINATION_VERIFIED_AT,
    note: 'Configured public privacy URL returned HTTP 404 during Stage 1 verification.',
  },
  terms: {
    key: 'terms',
    url: productIdentity.termsOfServiceUrl,
    ready: false,
    verifiedAt: LEGAL_DESTINATION_VERIFIED_AT,
    note: 'Configured public terms URL returned HTTP 500 during Stage 1 verification.',
  },
};

export function isLegalDestinationReady(key: LegalDestinationKey): boolean {
  return legalDestinations[key].ready === true;
}
