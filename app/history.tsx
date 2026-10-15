import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { TabParamList } from '../src/navigation/AppTabs';
import type { HistoryStackParamList } from '../src/navigation/tabStackParamLists';
import { useScanStore, ScanHistoryItem } from '../src/store/useScanStore';
import { useTheme } from '../src/theme';
import { resultEmeraldCard, resultEmeraldTone, resultPresentation } from '../src/theme/resultPresentation';

type NavigationProp = NativeStackNavigationProp<HistoryStackParamList>;

export default function HistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { colors, darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);
  const page = resultPresentation.canvas[darkMode ? 'dark' : 'light'];
  const filled = resultPresentation.emerald.action.light;
  const { recentScans, clearHistory } = useScanStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');

  const filteredAndSortedScans = useMemo(() => {
    let filtered = recentScans;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (scan) =>
          scan.barcode.includes(query) ||
          (scan.productName && scan.productName.toLowerCase().includes(query))
      );
    }

    // Sort
    if (sortBy === 'recent') {
      filtered = [...filtered].sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortBy === 'name') {
      filtered = [...filtered].sort((a, b) => {
        const nameA = a.productName || a.barcode;
        const nameB = b.productName || b.barcode;
        return nameA.localeCompare(nameB);
      });
    }

    return filtered;
  }, [recentScans, searchQuery, sortBy]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleClearHistory = () => {
    Alert.alert(
      t('history.clearHistory'),
      t('history.clearHistoryMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.clear'),
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
          },
        },
      ]
    );
  };

  const renderScanItem = ({ item }: { item: ScanHistoryItem }) => (
    <TouchableOpacity
      style={[styles.scanItem, resultEmeraldCard(!!darkMode)]}
      onPress={() => navigation.navigate('Result', { barcode: item.barcode })}
    >
      <View style={styles.scanItemLeft}>
        <View style={[styles.barcodeIconContainer, { backgroundColor: emerald.chevronCircle }]}>
          <Ionicons name="barcode-outline" size={24} color={emerald.action} />
        </View>
        <View style={styles.scanItemInfo}>
          {item.productName ? (
            <Text style={[styles.productName, { color: emerald.ink }]} numberOfLines={2}>
              {item.productName}
            </Text>
          ) : (
            <Text style={[styles.productNamePlaceholder, { color: emerald.muted }]} numberOfLines={1}>
              {t('common.loading')}
            </Text>
          )}
          <Text style={[styles.barcode, { color: emerald.muted }]}>{item.barcode}</Text>
          <Text style={[styles.timestamp, { color: emerald.muted }]}>{formatDate(item.timestamp)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={emerald.muted} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
      <View style={styles.emptyState}>
        <Ionicons name="time-outline" size={64} color={emerald.muted} />
        <Text style={[styles.emptyTitle, { color: emerald.ink }]}>{t('history.empty')}</Text>
        <Text style={[styles.emptyText, { color: emerald.muted }]}>
          {t('history.emptyMessage')}
        </Text>
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: filled }]}
          onPress={() => {
            const tabNav = navigation.getParent() as BottomTabNavigationProp<TabParamList>;
            tabNav.navigate('Scan', { screen: 'ScanHome' });
          }}
        >
          <Ionicons name="camera-outline" size={20} color="#fff" />
          <Text style={styles.scanButtonText}>{t('history.startScanning')}</Text>
        </TouchableOpacity>
      </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: page }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: page, borderBottomColor: emerald.line }]}>
        <Text style={[styles.title, { color: emerald.ink }]}>{t('history.title')}</Text>
        {recentScans.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory} style={styles.clearButton}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={[styles.clearButtonText, { color: colors.error }]}>{t('common.clear')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search and Filter */}
      {recentScans.length > 0 && (
        <View style={[styles.searchContainer, { backgroundColor: page, borderBottomColor: emerald.line }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: emerald.card, borderColor: emerald.line }]}>
            <Ionicons name="search-outline" size={20} color={emerald.muted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: emerald.ink }]}
              placeholder={t('history.searchPlaceholder')}
              placeholderTextColor={emerald.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={emerald.muted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={[
                styles.sortButton,
                { backgroundColor: sortBy === 'recent' ? filled : emerald.card, borderColor: sortBy === 'recent' ? filled : emerald.line },
              ]}
              onPress={() => setSortBy('recent')}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={sortBy === 'recent' ? '#fff' : emerald.muted}
              />
              <Text
                style={[
                  styles.sortButtonText,
                  { color: sortBy === 'recent' ? '#fff' : emerald.muted },
                ]}
              >
                {t('history.recent')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortButton,
                { backgroundColor: sortBy === 'name' ? filled : emerald.card, borderColor: sortBy === 'name' ? filled : emerald.line },
              ]}
              onPress={() => setSortBy('name')}
            >
              <Ionicons
                name="text-outline"
                size={16}
                color={sortBy === 'name' ? '#fff' : emerald.muted}
              />
              <Text
                style={[
                  styles.sortButtonText,
                  { color: sortBy === 'name' ? '#fff' : emerald.muted },
                ]}
              >
                {t('history.name')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* List */}
      {recentScans.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredAndSortedScans}
          renderItem={renderScanItem}
          keyExtractor={(item) => `${item.barcode}-${item.timestamp}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color={emerald.muted} />
              <Text style={[styles.noResultsText, { color: emerald.ink }]}>
                {t('history.noResults')}
              </Text>
              <Text style={[styles.noResultsSubtext, { color: emerald.muted }]}>
                {t('history.noResultsSubtext')}
              </Text>
            </View>
          }
        />
      )}

      {/* Stats Footer */}
      {recentScans.length > 0 && (
        <View style={[styles.footer, { backgroundColor: page, borderTopColor: emerald.line }]}>
          <Text style={[styles.footerText, { color: emerald.muted }]}>
            {t('history.stats', { count: filteredAndSortedScans.length, total: recentScans.length })}
          </Text>
        </View>
      )}
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
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    minHeight: 48,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
    gap: 6,
  },
  sortButtonActive: {},
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sortButtonTextActive: {},
  listContent: {
    padding: 16,
  },
  scanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
  },
  scanItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  barcodeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scanItemInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productNamePlaceholder: {
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  barcode: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
    minHeight: 44,
    gap: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noResults: {
    alignItems: 'center',
    padding: 48,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
