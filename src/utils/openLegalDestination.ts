import { Alert, Linking } from 'react-native';
import {
  isLegalDestinationReady,
  legalDestinations,
  type LegalDestinationKey,
} from '../config/legalDestinations';

export type OpenLegalDestinationResult = 'opened' | 'blocked' | 'failed';

/**
 * Opens a configured legal URL only when explicitly marked ready.
 * Fail-closed when not ready; surfaces open failures without inventing alternate URLs.
 */
export async function openLegalDestination(
  key: LegalDestinationKey
): Promise<OpenLegalDestinationResult> {
  const dest = legalDestinations[key];
  if (!isLegalDestinationReady(key)) {
    return 'blocked';
  }

  try {
    const can = await Linking.canOpenURL(dest.url);
    if (!can) return 'failed';
    await Linking.openURL(dest.url);
    return 'opened';
  } catch {
    return 'failed';
  }
}

export function alertLegalDestinationUnavailable(
  title: string,
  message: string
): void {
  Alert.alert(title, message);
}
