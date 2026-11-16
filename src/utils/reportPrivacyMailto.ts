/**
 * Build a mailto URL for personal-information access / correction / deletion requests.
 * Distinct from incorrect-assessment product reports — no GTIN or pack-photo requirement.
 */

import { Platform } from 'react-native';
import { getInstalledAppVersion } from './appVersion';

export type PrivacyDataRequestFields = {
  requestType?: 'access' | 'correction' | 'deletion' | 'other' | string;
  description?: string;
  reporterContact?: string;
};

export function buildPrivacyDataRequestMailto(
  supportEmail: string,
  subject: string,
  fields: PrivacyDataRequestFields = {}
): string | null {
  const email = supportEmail.trim();
  if (!email) return null;

  const lines = [
    'RVEEL personal information request',
    '',
    'I am contacting RVEEL about personal information associated with my use of the app.',
    '',
    `Request type: ${fields.requestType?.trim() || '(access / correction / deletion / other — please specify)'}`,
    `Description: ${fields.description?.trim() || '(please describe the information and what you are requesting)'}`,
    `Contact for reply (optional): ${fields.reporterContact?.trim() || '(optional)'}`,
    '',
    'Notes:',
    '- This is not a product-assessment dispute and does not require a barcode or pack photographs.',
    '- Opening this email draft does not transmit, confirm receipt, delete an account, or complete any server-side deletion.',
    '- Local scan history, favourites and cache can be cleared in Account → Privacy & Data on this device.',
    '',
    `App version: ${getInstalledAppVersion()}`,
    `Platform: ${Platform.OS}`,
    `Generated: ${new Date().toISOString()}`,
  ];

  const body = lines.join('\n');
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
