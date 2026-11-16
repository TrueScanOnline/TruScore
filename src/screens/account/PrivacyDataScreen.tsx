import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AccountScreenShell from '../../components/account/AccountScreenShell';
import AccountSection from '../../components/account/AccountSection';
import AccountRow from '../../components/account/AccountRow';
import AccountExpandable from '../../components/account/AccountExpandable';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { useScanStore } from '../../store/useScanStore';
import { clearCache, getCacheSize } from '../../services/cacheService';
import { isLegalDestinationReady, legalDestinations } from '../../config/legalDestinations';
import { openLegalDestination } from '../../utils/openLegalDestination';
import { productIdentity } from '../../config/productIdentity';
import { resultEmeraldTone } from '../../theme/resultPresentation';
import { useTheme } from '../../theme';
import { openPrivacyDataRequest } from '../../utils/openPrivacyDataRequest';
import type { PrivacyDataRequestFields } from '../../utils/reportPrivacyMailto';

/**
 * Privacy & Data — targeted local clears + factual disclosures.
 * Must not broad-clear AsyncStorage or touch contribution credentials.
 */
export default function PrivacyDataScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);
  const { clearFavorites, favorites } = useFavoritesStore();
  const { clearHistory, recentScans } = useScanStore();
  const [cacheSize, setCacheSize] = useState<number | null>(null);
  const supportConfigured = productIdentity.supportEmail.trim().length > 0;

  const refreshCacheSize = useCallback(async () => {
    try {
      const size = await getCacheSize();
      setCacheSize(size);
    } catch {
      setCacheSize(null);
    }
  }, []);

  useEffect(() => {
    void refreshCacheSize();
  }, [refreshCacheSize]);

  const cacheValue =
    cacheSize === null
      ? t('account.cacheCountUnavailable')
      : t('settings.products', { count: cacheSize });

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
    const clearCacheMessage =
      cacheSize === null
        ? `${t('settings.clearCacheMessage', { count: 0 })} (${t('account.cacheCountUnavailable')})`
        : t('settings.clearCacheMessage', { count: cacheSize });
    Alert.alert(t('settings.clearCache'), clearCacheMessage, [
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
    ]);
  };

  const handlePublishedPrivacy = async () => {
    const result = await openLegalDestination('privacy');
    if (result === 'blocked') {
      Alert.alert(
        t('account.publishedPrivacyPolicy'),
        t('account.privacyUrlUnavailable', { url: legalDestinations.privacy.url })
      );
      return;
    }
    if (result === 'failed') {
      Alert.alert(t('common.error'), t('account.legalOpenFailed'));
    }
  };

  const openPrivacyRequest = (requestType: PrivacyDataRequestFields['requestType']) => {
    if (!supportConfigured) {
      Alert.alert(t('account.privacyData'), t('account.supportEmailMissing'));
      return;
    }
    void openPrivacyDataRequest({
      subject: t('account.supportSubjectDataRequest'),
      fields: { requestType },
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
      <Text style={[styles.sectionLabel, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
        {t('account.dataAtAGlance')}
      </Text>
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
          value={cacheValue}
          onPress={handleClearCache}
          destructive
          accessibilityHint={t('account.a11yClearCache')}
          testID="account-clear-cache"
          isLast
        />
      </AccountSection>

      <Text style={[styles.sectionLabel, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
        {t('account.howDataUsedSection')}
      </Text>
      <AccountExpandable title={t('account.dataUseDevice')} testID="privacy-data-device">
        {t('account.dataUseDeviceBody')}
      </AccountExpandable>
      <AccountExpandable title={t('account.dataUseNetwork')} testID="privacy-data-network">
        {t('account.dataUseNetworkBody')}
      </AccountExpandable>
      <AccountExpandable title={t('account.dataUseSharing')} testID="privacy-data-sharing">
        {t('account.dataUseSharingBody')}
      </AccountExpandable>
      <AccountExpandable title={t('account.dataUseEvidence')} testID="privacy-data-evidence">
        {t('account.dataUseEvidenceBody')}
      </AccountExpandable>
      <AccountExpandable title={t('account.dataUseBackend')} testID="privacy-data-backend">
        {t('account.dataUseBackendBody')}
      </AccountExpandable>
      <AccountExpandable title={t('account.dataUseOff')} testID="privacy-data-off">
        {t('account.dataUseOffBody')}
      </AccountExpandable>
      <AccountExpandable title={t('account.dataUseTelemetry')} testID="privacy-data-telemetry">
        {t('account.dataUseTelemetryBody')}
      </AccountExpandable>

      <AccountSection title={t('account.privacyRequestsSection')}>
        <View style={styles.requestExplainWrap}>
          <Text style={[styles.requestExplain, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
            {t('account.requestDataHelp')}: {t('account.privacyRequestExplain')}
          </Text>
        </View>
        <AccountRow
          icon="download-outline"
          label={t('account.privacyRequestAccess')}
          value={supportConfigured ? undefined : t('account.supportNotConfiguredShort')}
          onPress={() => openPrivacyRequest('access')}
          accessibilityHint={t('account.a11yRequestDataHelp')}
          testID="account-privacy-request-access"
        />
        <AccountRow
          icon="create-outline"
          label={t('account.privacyRequestCorrection')}
          value={supportConfigured ? undefined : t('account.supportNotConfiguredShort')}
          onPress={() => openPrivacyRequest('correction')}
          testID="account-privacy-request-correction"
        />
        <AccountRow
          icon="trash-outline"
          label={t('account.privacyRequestDeletionReview')}
          value={supportConfigured ? undefined : t('account.supportNotConfiguredShort')}
          onPress={() => openPrivacyRequest('deletion_review')}
          testID="account-privacy-request-deletion"
        />
        <AccountRow
          icon="mail-outline"
          label={t('account.privacyRequestComplaint')}
          value={supportConfigured ? undefined : t('account.supportNotConfiguredShort')}
          onPress={() => openPrivacyRequest('complaint_or_question')}
          accessibilityHint={t('account.a11yRequestDataHelp')}
          testID="account-data-request"
          isLast
        />
      </AccountSection>

      <AccountSection title={t('account.permissionsSection')}>
        <View style={styles.requestExplainWrap}>
          <Text style={[styles.requestExplain, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
            {t('account.cameraPermissionNote')}
          </Text>
        </View>
        <AccountRow
          icon="shield-outline"
          label={t('account.publishedPrivacyPolicy')}
          value={
            isLegalDestinationReady('privacy')
              ? undefined
              : t('account.documentUnavailableShort')
          }
          onPress={() => {
            void handlePublishedPrivacy();
          }}
          accessibilityHint={t('account.a11yLegalDocument')}
          testID="account-how-data-used"
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
  requestExplainWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  requestExplain: {
    fontSize: 13,
    lineHeight: 19,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});
