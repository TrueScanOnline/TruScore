import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import AccountScreenShell from '../../components/account/AccountScreenShell';
import AccountProfileCard from '../../components/account/AccountProfileCard';
import AccountSection from '../../components/account/AccountSection';
import AccountRow from '../../components/account/AccountRow';
import type { AccountStackParamList } from '../../navigation/tabStackParamLists';
import { useSettingsStore } from '../../store/useSettingsStore';
import { resultEmeraldTone } from '../../theme/resultPresentation';
import { useTheme } from '../../theme';
import { getInstalledAppVersion } from '../../utils/appVersion';

type Nav = NativeStackNavigationProp<AccountStackParamList, 'AccountHome'>;

/**
 * Consumer Account Home — MVP Free / Guest.
 * Future authenticated identity and Premium entitlements replace guest/plan copy only;
 * this screen must not invent login or payment actions.
 */
export default function AccountHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);
  const { darkMode: storedDarkMode, setDarkMode } = useSettingsStore();
  const version = getInstalledAppVersion();

  return (
    <AccountScreenShell title={t('account.title')} testID="account-home-screen">
      <AccountProfileCard
        displayName={t('account.guestProfile')}
        supportingText={t('account.guestSupporting')}
        planLabel={t('account.planSummaryFree')}
      />

      <AccountSection title={t('account.sectionPersonal')}>
        <AccountRow
          icon="person-outline"
          label={t('account.profile')}
          value={t('account.guest')}
          onPress={() => navigation.navigate('AccountProfile')}
          testID="account-row-profile"
        />
        <AccountRow
          icon="card-outline"
          label={t('account.subscription')}
          value={t('account.planFreeShort')}
          onPress={() => navigation.navigate('AccountPlan')}
          testID="account-row-subscription"
          isLast
        />
      </AccountSection>

      <AccountSection title={t('account.sectionAppSettings')}>
        <AccountRow
          icon="moon-outline"
          label={t('settings.darkMode')}
          switchValue={!!storedDarkMode}
          onSwitchChange={setDarkMode}
          testID="account-row-dark-mode"
        />
        <AccountRow
          icon="language-outline"
          label={t('settings.language')}
          value={t('account.languageEnglish')}
          testID="account-row-language"
        />
        <AccountRow
          icon="options-outline"
          label={t('account.preferences')}
          value={t('account.comingSoon')}
          disabled
          testID="account-row-preferences"
          isLast
        />
      </AccountSection>

      <AccountSection title={t('account.sectionPrivacySupport')}>
        <AccountRow
          icon="shield-checkmark-outline"
          label={t('account.privacyData')}
          onPress={() => navigation.navigate('PrivacyData')}
          testID="account-row-privacy"
        />
        <AccountRow
          icon="headset-outline"
          label={t('settings.helpSupport')}
          onPress={() => navigation.navigate('HelpSupport')}
          testID="account-row-help"
        />
        <AccountRow
          icon="document-text-outline"
          label={t('account.legalMethodology')}
          onPress={() => navigation.navigate('LegalMethodology')}
          testID="account-row-legal"
          isLast
        />
      </AccountSection>

      <View style={styles.footer}>
        <Text style={[styles.version, { color: emerald.muted }]} testID="account-app-version">
          {t('account.versionLabel', { version })}
        </Text>
      </View>
    </AccountScreenShell>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  version: {
    fontSize: 13,
  },
});
