import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import AccountScreenShell from '../../components/account/AccountScreenShell';
import AccountSection from '../../components/account/AccountSection';
import AccountRow from '../../components/account/AccountRow';
import AccountExpandable from '../../components/account/AccountExpandable';
import { productIdentity } from '../../config/productIdentity';
import { getInstalledAppVersion } from '../../utils/appVersion';
import { resultEmeraldCard, resultEmeraldTone } from '../../theme/resultPresentation';
import { useTheme } from '../../theme';
import { openAssessmentReport } from '../../utils/openAssessmentReport';
import { openConfiguredMailto } from '../../utils/openSupportMailto';
import {
  buildManufacturerReviewMailto,
  buildTechnicalSupportMailto,
} from '../../utils/reportSupportMailto';
import { OFFICIAL_FOOD_RECALL_LINKS, HELP_FAQ_ITEMS } from '../../content/accountTrustContent';
import type { AccountStackParamList } from '../../navigation/tabStackParamLists';

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
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);
  const supportEmail = productIdentity.supportEmail.trim();
  const supportConfigured = supportEmail.length > 0;
  const [aboutOpen, setAboutOpen] = useState(false);
  const version = getInstalledAppVersion();

  const missing = t('account.supportEmailMissing');
  const failed = t('account.supportEmailFailed', { email: supportEmail || '(not configured)' });

  const contact = useCallback(
    async (subject: string) => {
      const result = await openSupportEmail(subject);
      if (result === 'missing') {
        Alert.alert(t('settings.helpSupport'), missing);
        return;
      }
      if (result === 'failed') {
        Alert.alert(t('settings.helpSupport'), failed);
      }
    },
    [failed, missing, t]
  );

  const requireSupport = (action: () => void) => {
    if (!supportConfigured) {
      Alert.alert(t('settings.helpSupport'), missing);
      return;
    }
    action();
  };

  const openRecall = async (url: string) => {
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert(t('settings.helpSupport'), t('account.recallOpenFailed'));
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('settings.helpSupport'), t('account.recallOpenFailed'));
    }
  };

  return (
    <AccountScreenShell
      title={t('settings.helpSupport')}
      onBack={() => navigation.goBack()}
      testID="account-help-screen"
    >
      <Text style={[styles.sectionLabel, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
        {t('account.gettingHelp')}
      </Text>
      <Text style={[styles.intro, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
        {t('account.helpIntro')}
      </Text>

      <Text style={[styles.sectionLabel, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
        {t('account.faqSection')}
      </Text>
      {HELP_FAQ_ITEMS.map((item) => (
        <AccountExpandable key={item.testID} title={t(item.titleKey)} testID={item.testID}>
          {t(item.bodyKey)}
        </AccountExpandable>
      ))}

      <AccountSection title={t('account.reportProductSection')}>
        <View style={styles.explainWrap}>
          <Text style={[styles.explain, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
            {t('account.reportProductExplain')}
          </Text>
        </View>
        <AccountRow
          icon="warning-outline"
          label={t('account.reportProductAction')}
          value={supportConfigured ? undefined : t('account.supportNotConfiguredShort')}
          onPress={() =>
            requireSupport(() => {
              void openAssessmentReport({
                subject: t('account.supportSubjectReport'),
                fields: { errorType: 'other' },
                missingMessage: missing,
                failedMessage: failed,
              });
            })
          }
          accessibilityHint={t('account.a11yReportProblem')}
          testID="account-report-problem"
          isLast
        />
      </AccountSection>

      <AccountSection title={t('account.manufacturerSection')}>
        <View style={styles.explainWrap}>
          <Text style={[styles.explain, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
            {t('account.manufacturerExplain')}
          </Text>
        </View>
        <AccountRow
          icon="business-outline"
          label={t('account.manufacturerAction')}
          value={supportConfigured ? undefined : t('account.supportNotConfiguredShort')}
          onPress={() =>
            requireSupport(() => {
              void openConfiguredMailto(
                buildManufacturerReviewMailto(supportEmail, t('account.supportSubjectManufacturer')),
                { missingMessage: missing, failedMessage: failed }
              );
            })
          }
          testID="account-manufacturer-review"
          isLast
        />
      </AccountSection>

      <AccountSection title={t('account.technicalSection')}>
        <View style={styles.explainWrap}>
          <Text style={[styles.explain, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
            {t('account.technicalExplain')}
          </Text>
        </View>
        <AccountRow
          icon="construct-outline"
          label={t('account.technicalAction')}
          value={supportConfigured ? undefined : t('account.supportNotConfiguredShort')}
          onPress={() =>
            requireSupport(() => {
              void openConfiguredMailto(
                buildTechnicalSupportMailto(supportEmail, t('account.supportSubjectTechnical')),
                { missingMessage: missing, failedMessage: failed }
              );
            })
          }
          testID="account-technical-support"
          isLast
        />
      </AccountSection>

      <AccountSection title={t('account.foodSafetySection')}>
        <View style={styles.explainWrap}>
          <Text style={[styles.explain, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
            {t('account.foodSafetyExplain')}
          </Text>
        </View>
        <AccountRow
          icon="open-outline"
          label={t(OFFICIAL_FOOD_RECALL_LINKS.nz.labelKey)}
          onPress={() => {
            void openRecall(OFFICIAL_FOOD_RECALL_LINKS.nz.url);
          }}
          testID="account-recall-nz"
        />
        <AccountRow
          icon="open-outline"
          label={t(OFFICIAL_FOOD_RECALL_LINKS.au.labelKey)}
          onPress={() => {
            void openRecall(OFFICIAL_FOOD_RECALL_LINKS.au.url);
          }}
          testID="account-recall-au"
          isLast
        />
      </AccountSection>

      <AccountSection title={t('account.privacyFromHelp')}>
        <View style={styles.explainWrap}>
          <Text style={[styles.explain, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
            {t('account.privacyFromHelpBody')}
          </Text>
        </View>
        <AccountRow
          icon="shield-checkmark-outline"
          label={t('account.privacyFromHelpAction')}
          onPress={() => navigation.navigate('PrivacyData')}
          testID="account-help-to-privacy"
          isLast
        />
      </AccountSection>

      <AccountSection title={t('account.contactRveel')}>
        <AccountRow
          icon="mail-outline"
          label={t('account.contactRveel')}
          value={supportConfigured ? supportEmail : t('account.supportNotConfiguredShort')}
          onPress={() =>
            requireSupport(() => {
              void contact(t('account.supportSubjectContact'));
            })
          }
          accessibilityHint={t('account.a11yContactSupport')}
          testID="account-contact-email"
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  explainWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  explain: {
    fontSize: 13,
    lineHeight: 19,
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
