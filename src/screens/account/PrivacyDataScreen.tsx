import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AccountScreenShell from '../../components/account/AccountScreenShell';
import AccountSection from '../../components/account/AccountSection';
import AccountRow from '../../components/account/AccountRow';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { useScanStore } from '../../store/useScanStore';
import { clearCache, getCacheSize } from '../../services/cacheService';
import { isLegalDestinationReady, legalDestinations } from '../../config/legalDestinations';
import { openLegalDestination } from '../../utils/openLegalDestination';
import { productIdentity } from '../../config/productIdentity';
import { resultEmeraldTone } from '../../theme/resultPresentation';
import { useTheme } from '../../theme';
import { openAssessmentReport } from '../../utils/openAssessmentReport';

/**
 * Privacy & Data — targeted local clears only.
 * Must not broad-clear AsyncStorage or touch contribution credentials.
 */
export default function PrivacyDataScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);
  const { clearFavorites, favorites } = useFavoritesStore();
  const { clearHistory, recentScans } = useScanStore();
  const [cacheSize, setCacheSize] = useState(0);
  const supportConfigured = productIdentity.supportEmail.trim().length > 0;

  const refreshCacheSize = useCallback(async () => {
    try {
      const size = await getCacheSize();
      setCacheSize(size);
    } catch {
      setCacheSize(0);
    }
  }, []);

  useEffect(() => {
    void refreshCacheSize();
  }, [refreshCacheSize]);

  const handleClearHistory = () => {
    Alert.alert(t('settings.clearHistory'), t('history.clearHistoryMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.clear'),
        style: 'destructive',
        onPress: async () => {
          try {
            await clearHistory();
            Alert.alert(t('common.success'), t('account.clearHistorySuccess'));
          } catch {
            Alert.alert(t('common.error'), t('account.clearFailed'));
          }
        },
      },
    ]);
  };

  const handleClearFavorites = () => {
    Alert.alert(t('favorites.clearAllTitle'), t('favorites.clearAllMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.clear'),
        style: 'destructive',
        onPress: async () => {
          try {
            await clearFavorites();
            Alert.alert(t('common.success'), t('account.clearFavoritesSuccess'));
          } catch {
            Alert.alert(t('common.error'), t('account.clearFailed'));
          }
        },
      },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert(
      t('settings.clearCache'),
      t('settings.clearCacheMessage', { count: cacheSize }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.clear'),
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCache();
              await refreshCacheSize();
              Alert.alert(t('common.success'), t('account.clearCacheSuccess'));
            } catch {
              Alert.alert(t('common.error'), t('account.clearFailed'));
            }
          },
        },
      ]
    );
  };

  const handleHowDataUsed = async () => {
    const result = await openLegalDestination('privacy');
    if (result === 'blocked') {
      Alert.alert(
        t('account.howDataUsed'),
        t('account.privacyUrlUnavailable', { url: legalDestinations.privacy.url })
      );
      return;
    }
    if (result === 'failed') {
      Alert.alert(t('common.error'), t('account.legalOpenFailed'));
    }
  };

  const handleDataRequest = () => {
    if (!supportConfigured) {
      Alert.alert(t('account.privacyData'), t('account.supportEmailMissing'));
      return;
    }
    void openAssessmentReport({
      subject: t('account.supportSubjectDataRequest'),
      fields: {
        errorType: 'other',
      },
      missingMessage: t('account.supportEmailMissing'),
      failedMessage: t('account.supportEmailFailed', {
        email: productIdentity.supportEmail.trim(),
      }),
    });
  };

  return (
    <AccountScreenShell
      title={t('account.privacyData')}
      onBack={() => navigation.goBack()}
      testID="account-privacy-screen"
    >
      <Text style={[styles.intro, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
        {t('account.privacyIntro')}
      </Text>

      <AccountSection title={t('account.localData')}>
        <AccountRow
          icon="time-outline"
          label={t('settings.clearHistory')}
          value={t('settings.scans', { count: recentScans.length })}
          onPress={handleClearHistory}
          destructive
          accessibilityHint={t('account.a11yClearHistory')}
          testID="account-clear-history"
        />
        <AccountRow
          icon="heart-outline"
          label={t('account.clearFavourites')}
          value={t('favorites.count', { count: favorites.length })}
          onPress={handleClearFavorites}
          destructive
          accessibilityHint={t('account.a11yClearFavourites')}
          testID="account-clear-favorites"
        />
        <AccountRow
          icon="folder-outline"
          label={t('settings.clearCache')}
          value={t('settings.products', { count: cacheSize })}
          onPress={handleClearCache}
          destructive
          accessibilityHint={t('account.a11yClearCache')}
          testID="account-clear-cache"
          isLast
        />
      </AccountSection>

      <AccountSection title={t('settings.privacy')}>
        <AccountRow
          icon="information-circle-outline"
          label={t('account.howDataUsed')}
          value={
            isLegalDestinationReady('privacy')
              ? undefined
              : t('account.documentUnavailableShort')
          }
          onPress={() => {
            void handleHowDataUsed();
          }}
          testID="account-how-data-used"
        />
        <AccountRow
          icon="mail-outline"
          label={t('account.requestDataHelp')}
          value={
            supportConfigured
              ? undefined
              : t('account.supportNotConfiguredShort')
          }
          onPress={handleDataRequest}
          accessibilityHint={t('account.a11yRequestDataHelp')}
          testID="account-data-request"
          isLast
        />
      </AccountSection>

      <Text style={[styles.footnote, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
        {t('account.privacyFootnote')}
      </Text>
    </AccountScreenShell>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});
