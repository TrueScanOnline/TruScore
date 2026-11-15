import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AccountScreenShell from '../../components/account/AccountScreenShell';
import AccountSection from '../../components/account/AccountSection';
import AccountRow from '../../components/account/AccountRow';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { useScanStore } from '../../store/useScanStore';
import { clearCache, getCacheSize } from '../../services/cacheService';
import { isLegalDestinationReady } from '../../config/legalDestinations';
import { productIdentity } from '../../config/productIdentity';

/**
 * Privacy & Data — targeted local clears only.
 * Must not broad-clear AsyncStorage or touch contribution credentials.
 */
export default function PrivacyDataScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { clearFavorites, favorites } = useFavoritesStore();
  const { clearHistory, recentScans } = useScanStore();
  const [cacheSize, setCacheSize] = useState(0);

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

  const handleHowDataUsed = () => {
    if (!isLegalDestinationReady('privacy')) {
      Alert.alert(
        t('account.howDataUsed'),
        t('account.privacyUrlUnavailable', { url: productIdentity.privacyPolicyUrl })
      );
      return;
    }
  };

  return (
    <AccountScreenShell
      title={t('account.privacyData')}
      onBack={() => navigation.goBack()}
      testID="account-privacy-screen"
    >
      <AccountSection title={t('account.localData')}>
        <AccountRow
          icon="time-outline"
          label={t('settings.clearHistory')}
          value={t('settings.scans', { count: recentScans.length })}
          onPress={handleClearHistory}
          destructive
          testID="account-clear-history"
        />
        <AccountRow
          icon="heart-outline"
          label={t('account.clearFavourites')}
          value={t('favorites.count', { count: favorites.length })}
          onPress={handleClearFavorites}
          destructive
          testID="account-clear-favorites"
        />
        <AccountRow
          icon="folder-outline"
          label={t('settings.clearCache')}
          value={t('settings.products', { count: cacheSize })}
          onPress={handleClearCache}
          destructive
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
          onPress={handleHowDataUsed}
          testID="account-how-data-used"
          isLast
        />
      </AccountSection>
    </AccountScreenShell>
  );
}
