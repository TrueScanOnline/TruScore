/**
 * Governed Open Food Facts API identification.
 * Never invent a contact address. Prefer configured support/OFF contact.
 */

import Constants from 'expo-constants';
import { productIdentity } from './productIdentity';

export const OFF_APP_NAME = 'Rveel';
export const OFF_APP_VERSION = '1.0.0';

/** Optional dedicated OFF contact; falls back to public support email when set. */
export function getOffApiContactEmail(): string {
  const dedicated = String(Constants.expoConfig?.extra?.offApiContactEmail || '').trim();
  if (dedicated) return dedicated;
  return productIdentity.supportEmail.trim();
}

/**
 * Official OFF form: AppName/Version (ContactEmail).
 * When contact is missing, returns AppName/Version only — never a fabricated mailbox.
 */
export function buildOffUserAgent(): string {
  const contact = getOffApiContactEmail();
  if (contact) {
    return `${OFF_APP_NAME}/${OFF_APP_VERSION} (${contact})`;
  }
  return `${OFF_APP_NAME}/${OFF_APP_VERSION}`;
}

export function isOffApiContactConfigured(): boolean {
  return getOffApiContactEmail().length > 0;
}
