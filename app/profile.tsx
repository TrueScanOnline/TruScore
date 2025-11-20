import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../src/navigation/AppTabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from './_layout';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useTheme } from '../src/theme';
import { useFavoritesStore } from '../src/store/useFavoritesStore';
import { useScanStore } from '../src/store/useScanStore';
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';
import { getSubscriptionStatusMessage, isPremium as checkPremium } from '../src/utils/premiumFeatures';
import { getCacheSize, clearCache } from '../src/services/cacheService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList> & BottomTabNavigationProp<TabParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    darkMode,
    language,
    units,
    analyticsEnabled,
    setDarkMode,
    setLanguage,
    setUnits,
    setAnalyticsEnabled,
    setHasCompletedOnboarding,
  } = useSettingsStore();
  const { favorites, clearFavorites } = useFavoritesStore();
  const { recentScans, clearHistory } = useScanStore();
  const { subscriptionInfo, checkSubscriptionStatus } = useSubscriptionStore();
  const [cacheSize, setCacheSize] = useState<number>(0);
  const isPremium = checkPremium(subscriptionInfo);

  React.useEffect(() => {
    loadCacheSize();
  }, []);

  const loadCacheSize = async () => {
    const size = await getCacheSize();
    setCacheSize(size);
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
            await clearCache();
            await loadCacheSize();
            Alert.alert(t('common.success'), t('common.success'));
          },
        },
      ]
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      t('settings.clearHistory'),
      t('history.clearHistoryMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.clear'),
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            Alert.alert(t('common.success'), t('common.success'));
          },
        },
      ]
    );
  };

  const handleClearFavorites = () => {
    Alert.alert(
      t('favorites.clearAllTitle'),
      t('favorites.clearAllMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.clear'),
          style: 'destructive',
          onPress: async () => {
            await clearFavorites();
            Alert.alert(t('common.success'), t('common.success'));
          },
        },
      ]
    );
  };

  const handleLanguageSelect = () => {
    Alert.alert(
      t('settings.language'),
      t('settings.language'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: 'English', onPress: () => setLanguage('en') },
        { text: 'Español', onPress: () => setLanguage('es') },
        { text: 'Français', onPress: () => setLanguage('fr') },
      ]
    );
  };

  const handleUnitsSelect = () => {
    Alert.alert(
      t('settings.units'),
      t('settings.units'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.metric'), onPress: () => setUnits('metric') },
        { text: t('settings.imperial'), onPress: () => setUnits('imperial') },
      ]
    );
  };

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'en':
        return 'English';
      case 'es':
        return 'Español';
      case 'fr':
        return 'Français';
      default:
        return 'English';
    }
  };

  const getUnitsLabel = (units: string) => {
    return units === 'metric' ? t('settings.metric') : t('settings.imperial');
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>{title}</Text>
      {children}
    </View>
  );

  const SettingRow = ({
    icon,
    label,
    value,
    onPress,
    rightComponent,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={[styles.settingRow, { backgroundColor: colors.card }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingRowLeft}>
        <Ionicons name={icon as any} size={24} color={colors.primary} style={styles.settingIcon} />
        <View style={styles.settingRowInfo}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
          {value && <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{value}</Text>}
        </View>
      </View>
      {rightComponent || (onPress && <Ionicons name="chevron-forward" size={20} color={colors.border} />)}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('profile.title')}</Text>
        {isPremium && (
          <View style={[styles.premiumBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="star" size={16} color="#fff" />
            <Text style={styles.premiumBadgeText}>{t('profile.premium')}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Account */}
        <SettingSection title={t('profile.account')}>
          <SettingRow
            icon="person-outline"
            label={t('profile.accountInfo')}
            onPress={() => {
              // TODO: Navigate to account info screen
              Alert.alert(t('profile.comingSoon'), t('profile.comingSoonMessage'));
            }}
          />
          <SettingRow
            icon={isPremium ? "star" : "star-outline"}
            label={isPremium ? getSubscriptionStatusMessage(subscriptionInfo) : t('profile.upgradeToPremium')}
            value={isPremium ? undefined : t('subscription.title')}
            onPress={() => {
              navigation.navigate('Subscription');
            }}
          />
          {isPremium && (
            <SettingRow
              icon="refresh-outline"
              label={t('profile.restorePurchases')}
              onPress={async () => {
                const result = await useSubscriptionStore.getState().restorePurchases();
                if (result.success) {
                  await checkSubscriptionStatus();
                  Alert.alert(t('subscription.restoreSuccess'), t('subscription.restoreSuccessMessage'));
                } else {
                  Alert.alert(t('subscription.restoreError'), result.error || t('subscription.restoreErrorMessage'));
                }
              }}
            />
          )}
        </SettingSection>

        {/* Appearance */}
        <SettingSection title={t('settings.appearance')}>
          <SettingRow
            icon="moon-outline"
            label={t('settings.darkMode')}
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            }
          />
        </SettingSection>

        {/* Language & Region */}
        <SettingSection title={t('settings.languageRegion')}>
          <SettingRow
            icon="language-outline"
            label={t('settings.language')}
            value={getLanguageLabel(language)}
            onPress={handleLanguageSelect}
          />
          <SettingRow
            icon="resize-outline"
            label={t('settings.units')}
            value={getUnitsLabel(units)}
            onPress={handleUnitsSelect}
          />
        </SettingSection>

        {/* Privacy */}
        <SettingSection title={t('settings.privacy')}>
          <SettingRow
            icon="analytics-outline"
            label={t('settings.analytics')}
            rightComponent={
              <Switch
                value={analyticsEnabled}
                onValueChange={setAnalyticsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            }
          />
        </SettingSection>

        {/* Data */}
        <SettingSection title={t('settings.data')}>
          <SettingRow
            icon="time-outline"
            label={t('settings.scanHistory')}
            value={t('settings.scans', { count: recentScans.length })}
            onPress={() => navigation.navigate('History')}
          />
          <SettingRow
            icon="heart-outline"
            label={t('favorites.title')}
            value={t('favorites.count', { count: favorites.length })}
            onPress={() => navigation.navigate('Favourites')}
          />
          <SettingRow
            icon="folder-outline"
            label={t('settings.cachedProducts')}
            value={t('settings.products', { count: cacheSize })}
          />
          <SettingRow
            icon="trash-outline"
            label={t('settings.clearHistory')}
            onPress={handleClearHistory}
          />
          <SettingRow
            icon="heart-outline"
            label={t('favorites.clearAll')}
            onPress={handleClearFavorites}
          />
          <SettingRow
            icon="refresh-outline"
            label={t('settings.clearCache')}
            onPress={handleClearCache}
          />
        </SettingSection>

        {/* About */}
        <SettingSection title={t('settings.about')}>
          <SettingRow
            icon="information-circle-outline"
            label={t('settings.version')}
            value="1.0.0"
          />
          <SettingRow
            icon="code-outline"
            label={t('settings.openSource')}
            onPress={() => {
              Alert.alert(t('settings.openSource'), t('settings.openSourceMessage'));
            }}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            label={t('settings.privacyPolicy')}
            onPress={() => {
              Alert.alert(t('settings.privacyPolicy'), t('settings.privacyPolicyMessage'));
            }}
          />
          <SettingRow
            icon="help-circle-outline"
            label={t('settings.helpSupport')}
            onPress={() => {
              Alert.alert(t('settings.helpSupport'), t('settings.helpSupportMessage'));
            }}
          />
        </SettingSection>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('settings.footer')}</Text>
          <Text style={[styles.footerSubtext, { color: colors.textTertiary }]}>{t('settings.footerSubtext')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingRowInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 14,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
  },
});

