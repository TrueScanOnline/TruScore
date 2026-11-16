import { Alert, Linking } from 'react-native';
import { productIdentity } from '../config/productIdentity';
import {
  AssessmentReportFields,
  buildAssessmentReportMailto,
} from './reportAssessmentMailto';

export async function openAssessmentReport(options: {
  subject: string;
  fields?: AssessmentReportFields;
  missingMessage: string;
  failedMessage: string;
}): Promise<'opened' | 'missing' | 'failed'> {
  const email = productIdentity.supportEmail.trim();
  if (!email) {
    Alert.alert(productIdentity.displayName, options.missingMessage);
    return 'missing';
  }
  const url = buildAssessmentReportMailto(email, options.subject, options.fields);
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
