import { Alert, Linking } from 'react-native';
import { productIdentity } from '../config/productIdentity';

export async function openConfiguredMailto(
  url: string | null,
  options: { missingMessage: string; failedMessage: string }
): Promise<'opened' | 'missing' | 'failed'> {
  if (!url) {
    Alert.alert(productIdentity.displayName, options.missingMessage);
    return 'missing';
  }
  try {
    const can = await Linking.canOpenURL(url);
    if (!can) {
      Alert.alert(productIdentity.displayName, options.failedMessage);
      return 'failed';
    }
    await Linking.openURL(url);
    return 'opened';
  } catch {
    Alert.alert(productIdentity.displayName, options.failedMessage);
    return 'failed';
  }
}
