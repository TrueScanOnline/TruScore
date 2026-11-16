import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AccountScreenShell from '../../components/account/AccountScreenShell';
import AccountSection from '../../components/account/AccountSection';
import AccountRow from '../../components/account/AccountRow';
import { productIdentity } from '../../config/productIdentity';
import { getInstalledAppVersion } from '../../utils/appVersion';
import { resultEmeraldCard, resultEmeraldTone } from '../../theme/resultPresentation';
import { useTheme } from '../../theme';
import { openAssessmentReport } from '../../utils/openAssessmentReport';

async function openSupportEmail(subject: string): Promise<'opened' | 'missing' | 'failed'> {
  const email = productIdentity.supportEmail.trim();
  if (!email) return 'missing';
  const url = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}`;
  try {
    const can = await Linking.canOpenURL(url);
    if (!can) return 'failed';
    await Linking.openURL(url);
    return 'opened';
  } catch {
    return 'failed';
  }
}

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);
  const supportEmail = productIdentity.supportEmail.trim();
  const supportConfigured = supportEmail.length > 0;
  const [aboutOpen, setAboutOpen] = useState(false);
  const version = getInstalledAppVersion();

  const contact = useCallback(
    async (subject: string) => {
      const result = await openSupportEmail(subject);
      if (result === 'missing') {
        Alert.alert(t('settings.helpSupport'), t('account.supportEmailMissing'));
        return;
      }
      if (result === 'failed') {
        Alert.alert(t('settings.helpSupport'), t('account.supportEmailFailed', { email: supportEmail }));
      }
    },
    [supportEmail, t]
  );

  return (
    <AccountScreenShell
      title={t('settings.helpSupport')}
      onBack={() => navigation.goBack()}
      testID="account-help-screen"
    >
      <Text style={[styles.intro, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
        {t('account.helpIntro')}
      </Text>

      <AccountSection title={t('account.contactRveel')}>
        <AccountRow
          icon="mail-outline"
          label={t('account.contactRveel')}
          value={
            supportConfigured ? supportEmail : t('account.supportNotConfiguredShort')
          }
          onPress={
            supportConfigured
              ? () => {
                  void contact(t('account.supportSubjectContact'));
                }
              : () => {
                  Alert.alert(t('settings.helpSupport'), t('account.supportEmailMissing'));
                }
          }
          accessibilityHint={t('account.a11yContactSupport')}
          testID="account-contact-email"
        />
        <AccountRow
          icon="warning-outline"
          label={t('account.reportProblem')}
          value={
            supportConfigured ? undefined : t('account.supportNotConfiguredShort')
          }
          onPress={
            supportConfigured
              ? () => {
                  void openAssessmentReport({
                    subject: t('account.supportSubjectReport'),
                    fields: {
                      errorType: 'other',
                    },
                    missingMessage: t('account.supportEmailMissing'),
                    failedMessage: t('account.supportEmailFailed', { email: supportEmail }),
                  });
                }
              : () => {
                  Alert.alert(t('settings.helpSupport'), t('account.supportEmailMissing'));
                }
          }
          accessibilityHint={t('account.a11yReportProblem')}
          testID="account-report-problem"
          isLast
        />
      </AccountSection>

      <AccountSection title={t('settings.about')}>
        <AccountRow
          icon="information-circle-outline"
          label={t('account.aboutRveel')}
          onPress={() => setAboutOpen((v) => !v)}
          testID="account-about-rveel"
          isLast
        />
      </AccountSection>

      {aboutOpen ? (
        <View style={[styles.aboutCard, resultEmeraldCard(!!darkMode)]} testID="account-about-body">
          <Text style={[styles.aboutTitle, { color: emerald.ink }]} maxFontSizeMultiplier={1.35}>
            {productIdentity.displayName}
          </Text>
          <Text style={[styles.aboutBody, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
            {t('account.aboutBody', { version })}
          </Text>
          <Text
            style={[styles.aboutBody, { color: emerald.muted, marginTop: 10 }]}
            maxFontSizeMultiplier={1.35}
          >
            {t('account.helpEmailOpensOnly')}
          </Text>
        </View>
      ) : null}
    </AccountScreenShell>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  aboutCard: {
    padding: 16,
    marginTop: 4,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  aboutBody: {
    fontSize: 14,
    lineHeight: 21,
  },
});
