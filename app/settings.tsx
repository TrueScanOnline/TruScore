import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from './_layout';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useTheme } from '../src/theme';
import { useScanStore } from '../src/store/useScanStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearCache, getCacheSize } from '../src/services/cacheService';
import FSANZDatabaseImportModal from '../src/components/FSANZDatabaseImportModal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60 + insets.bottom;
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
  const { recentScans, clearHistory } = useScanStore();
  const [cacheSize, setCacheSize] = React.useState<number>(0);
  const [showFSANZModal, setShowFSANZModal] = React.useState(false);

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

  const handleLanguageSelect = () => {
    Alert.alert(
      t('settings.language'),
      t('settings.language'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'English',
          onPress: () => setLanguage('en'),
        },
        {
          text: 'Español',
          onPress: () => setLanguage('es'),
        },
        {
          text: 'Français',
          onPress: () => setLanguage('fr'),
        },
      ]
    );
  };

  const handleUnitsSelect = () => {
    Alert.alert(
      t('settings.units'),
      t('settings.units'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.metric'),
          onPress: () => setUnits('metric'),
        },
        {
          text: t('settings.imperial'),
          onPress: () => setUnits('imperial'),
        },
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
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 20 }]}
      >
        {/* Appearance */}
        <SettingSection title={t('settings.appearance')}>
          <SettingRow
            icon="moon-outline"
            label={t('settings.darkMode')}
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={(value) => {
                  setDarkMode(value);
                  // Force re-render of theme
                }}
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
          <Text style={[styles.privacyNote, { color: colors.textTertiary }]}>
            {t('settings.privacyNote')}
          </Text>
        </SettingSection>

        {/* Data */}
        <SettingSection title={t('settings.data')}>
          <SettingRow
            icon="time-outline"
            label={t('settings.scanHistory')}
            value={t('settings.scans', { count: recentScans.length })}
            onPress={() => {
              // Navigate to Main tab first, then to History tab
              navigation.navigate('Main' as any, { screen: 'History' });
            }}
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
            icon="refresh-outline"
            label={t('settings.clearCache')}
            onPress={handleClearCache}
          />
          <SettingRow
            icon="cloud-download-outline"
            label="FSANZ Database Import"
            value="Improve product recognition"
            onPress={() => setShowFSANZModal(true)}
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
              Alert.alert(
                t('settings.openSource'),
                t('settings.openSourceMessage')
              );
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
              Alert.alert(
                t('settings.helpSupport'),
                t('settings.helpSupportMessage')
              );
            }}
          />
          <SettingRow
            icon="refresh-outline"
            label={t('settings.showOnboarding')}
            onPress={() => {
              Alert.alert(
                t('settings.showOnboarding'),
                t('settings.showOnboardingMessage'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('common.ok'),
                    onPress: async () => {
                      console.log('[Settings] Resetting onboarding - clearing all onboarding data');
                      try {
                        // Clear the onboarding flag in settings
                        await setHasCompletedOnboarding(false);
                        
                        // Also clear first launch flag to allow re-testing first launch behavior
                        await AsyncStorage.removeItem('@truescan_first_launch');
                        console.log('[Settings] Cleared first launch flag');
                        
                        // Also clear the entire settings to ensure clean state
                        await AsyncStorage.removeItem('@truescan_settings');
                        console.log('[Settings] Cleared settings to force fresh start');
                        
                        // Force reload by resetting store
                        const { initializeStore } = useSettingsStore.getState();
                        await initializeStore();
                        console.log('[Settings] Reinitialized store with defaults');
                        
                        // Navigate to onboarding immediately
                        navigation.navigate('Onboarding' as any);
                      } catch (error) {
                        console.error('[Settings] Error resetting onboarding:', error);
                        // Still try to navigate
                        navigation.navigate('Onboarding' as any);
                      }
                    },
                  },
                ]
              );
            }}
          />
        </SettingSection>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('settings.footer')}</Text>
          <Text style={[styles.footerSubtext, { color: colors.textTertiary }]}>{t('settings.footerSubtext')}</Text>
        </View>
      </ScrollView>

      {/* FSANZ Database Import Modal */}
      <FSANZDatabaseImportModal
        visible={showFSANZModal}
        onClose={() => setShowFSANZModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 32,
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
  privacyNote: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    marginLeft: 4,
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
