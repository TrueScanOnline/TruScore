import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { SearchStackParamList } from '../src/navigation/tabStackParamLists';
import type { TabParamList } from '../src/navigation/AppTabs';
import type { RootStackParamList } from './_layout';
import { useScanStore } from '../src/store/useScanStore';
import { useFavoritesStore } from '../src/store/useFavoritesStore';
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';
import { canUseAdvancedSearch } from '../src/utils/premiumFeatures';
import { isMvpSubscriptionAndPaywallEnabled } from '../src/config/mvpRuntimeGates';
import { fetchProduct } from '../src/services/productService';
import { searchProducts } from '../src/services/productSearchService';
import AdvancedSearchFilters from '../src/components/AdvancedSearchFilters';
import SearchPaywallModal from '../src/components/SearchPaywallModal';
import BlurredMatchCountTeaser from '../src/components/BlurredMatchCountTeaser';
import {
  SearchFilters,
  DEFAULT_SEARCH_FILTERS,
  hasActiveSearchFilters,
  applySearchFilters,
} from '../src/utils/searchFilterUtils';
import { useTheme } from '../src/theme';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<SearchStackParamList>,
  CompositeNavigationProp<BottomTabNavigationProp<TabParamList>, NativeStackNavigationProp<RootStackParamList>>
>;

export default function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchedResults, setFetchedResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({ ...DEFAULT_SEARCH_FILTERS });

  const { recentScans } = useScanStore();
  const { favorites } = useFavoritesStore();
  const { subscriptionInfo } = useSubscriptionStore();
  // MVP: subscription/paywall deferred — advanced filters available without upgrade CTAs
  const premiumSearch =
    !isMvpSubscriptionAndPaywallEnabled() || canUseAdvancedSearch(subscriptionInfo);

  const filterContext = useMemo(() => {
    const scannedBarcodes = new Set(recentScans.map((s) => s.barcode));
    const favoriteBarcodes = new Set(favorites.map((f) => f.barcode));
    return { scannedBarcodes, favoriteBarcodes };
  }, [recentScans, favorites]);

  const filteredResults = useMemo(
    () => applySearchFilters(fetchedResults, filters, filterContext),
    [fetchedResults, filters, filterContext]
  );

  const filtersActive = hasActiveSearchFilters(filters);
  const showFilterTeaser = !premiumSearch && filtersActive && fetchedResults.length > 0;
  const listData = showFilterTeaser ? [] : premiumSearch ? filteredResults : fetchedResults;

  const openPaywall = useCallback(() => {
    if (!isMvpSubscriptionAndPaywallEnabled()) return;
    setPaywallVisible(true);
  }, []);

  const goToSubscription = useCallback(() => {
    if (!isMvpSubscriptionAndPaywallEnabled()) {
      setPaywallVisible(false);
      return;
    }
    setPaywallVisible(false);
    navigation.navigate('Subscription');
  }, [navigation]);

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setFetchedResults([]);
        setSearchError(null);
        return;
      }

      setLoading(true);
      setSearchError(null);

      try {
        const trimmedQuery = query.trim();
        const results: any[] = [];

        const localResults = recentScans.filter(
          (scan) =>
            scan.barcode.includes(trimmedQuery) ||
            (scan.productName && scan.productName.toLowerCase().includes(trimmedQuery.toLowerCase()))
        );

        localResults.forEach((scan) => {
          results.push({
            barcode: scan.barcode,
            product: { barcode: scan.barcode, product_name: scan.productName },
            source: 'local',
            isLocal: true,
          });
        });

        if (/^\d{8,14}$/.test(trimmedQuery)) {
          try {
            const product = await fetchProduct(trimmedQuery, false, false, false);
            if (product) {
              const exists = results.find((r) => r.barcode === trimmedQuery);
              if (!exists) {
                results.unshift({ barcode: trimmedQuery, product, isDirect: true });
              }
            }
          } catch {
            /* continue */
          }
        }

        try {
          const databaseResults = await searchProducts(trimmedQuery, {
            limit: 20,
            includeOpenFoodFacts: true,
            includeOpenBeautyFacts: true,
            includeOpenProductsFacts: true,
            includeOpenPetFoodFacts: true,
            includeUSDA: true,
            includeUPCitemdb: true,
          });

          databaseResults.forEach((dbResult) => {
            const exists = results.find((r) => r.barcode === dbResult.barcode);
            if (!exists) {
              results.push({
                barcode: dbResult.barcode,
                product: dbResult.product,
                source: dbResult.source,
                relevance: dbResult.relevance,
              });
            }
          });
        } catch (error) {
          console.error('Database search error:', error);
        }

        const sortedResults = results.sort((a, b) => {
          if (a.relevance && b.relevance) {
            return b.relevance - a.relevance;
          }
          if (a.isDirect || a.isLocal) return -1;
          if (b.isDirect || b.isLocal) return 1;
          return 0;
        });

        setFetchedResults(sortedResults);
      } catch (error) {
        console.error('Search error:', error);
        setSearchError(t('search.error'));
      } finally {
        setLoading(false);
      }
    },
    [recentScans, t]
  );

  const handleResultPress = (barcode: string) => {
    navigation.navigate('Result', { barcode });
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    handleSearch(searchQuery);
  };

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchQuery.trim()) {
      setFetchedResults([]);
      setSearchError(null);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const filterBadgeVisible = filtersActive;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="search-outline" size={24} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={false}
            blurOnSubmit={false}
            keyboardType="default"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setFetchedResults([]);
                setSearchError(null);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.searchButton, { backgroundColor: colors.primary }]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {!premiumSearch && (
          <TouchableOpacity
            style={[styles.upgradeTeaserRow, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '40' }]}
            onPress={() => setShowFilters(true)}
            accessibilityRole="button"
          >
            <Ionicons name="sparkles-outline" size={22} color={colors.primary} />
            <View style={styles.upgradeTeaserText}>
              <Text style={[styles.upgradeTeaserTitle, { color: colors.text }]}>{t('search.listTeaser.title')}</Text>
              <Text style={[styles.upgradeTeaserSub, { color: colors.textSecondary }]} numberOfLines={2}>
                {t('search.listTeaser.subtitle')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.filtersButton, { backgroundColor: colors.surface }]}
          onPress={() => setShowFilters(true)}
          accessibilityRole="button"
          accessibilityLabel={t('search.advancedFilters')}
        >
          <Ionicons name="options-outline" size={20} color={colors.primary} />
          <Text style={[styles.filtersButtonText, { color: colors.primary }]}>{t('search.advancedFilters')}</Text>
          {filterBadgeVisible && (
            <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.filterBadgeText}>●</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {showFilterTeaser && (
          <BlurredMatchCountTeaser count={filteredResults.length} onUnlockPress={openPaywall} />
        )}

        {loading && listData.length === 0 && !showFilterTeaser ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('search.searching')}</Text>
          </View>
        ) : searchError ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.text }]}>{searchError}</Text>
          </View>
        ) : listData.length > 0 ? (
          <FlatList
            data={listData}
            keyExtractor={(item, index) => `${item.barcode}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.resultItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
                onPress={() => handleResultPress(item.barcode)}
              >
                <View style={styles.resultContent}>
                  <Ionicons name="barcode-outline" size={24} color={colors.primary} style={styles.resultIcon} />
                  <View style={styles.resultTextContainer}>
                    {item.product?.product_name ? (
                      <Text style={[styles.resultProductName, { color: colors.text }]} numberOfLines={2}>
                        {item.product.product_name}
                      </Text>
                    ) : (
                      <Text style={[styles.resultProductName, { color: colors.textSecondary }]}>
                        {t('search.productUnknown')}
                      </Text>
                    )}
                    <Text style={[styles.resultBarcode, { color: colors.textSecondary }]}>
                      {t('search.barcode')}: {item.barcode}
                    </Text>
                    {item.product?.trust_score !== undefined && item.product?.trust_score !== null && (
                      <View style={styles.resultScore}>
                        <Text style={[styles.resultScoreLabel, { color: colors.textSecondary }]}>
                          {t('result.trustScore')}:
                        </Text>
                        <Text style={[styles.resultScoreValue, { color: colors.primary }]}>
                          {item.product.trust_score}/100
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.border} />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : showFilterTeaser ? (
          <View style={styles.teaserListPlaceholder}>
            <Text style={[styles.teaserListHint, { color: colors.textSecondary }]}>
              {t('search.teaser.listPlaceholder')}
            </Text>
          </View>
        ) : searchQuery.length > 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>{t('search.noResults')}</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>{t('search.noResultsMessage')}</Text>
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>{t('search.startSearch')}</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>{t('search.startSearchMessage')}</Text>
          </View>
        )}
      </View>

      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <AdvancedSearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
          canUseAdvancedSearch={premiumSearch}
          onRequestUpgrade={openPaywall}
        />
      </Modal>

      {isMvpSubscriptionAndPaywallEnabled() ? (
        <SearchPaywallModal
          visible={paywallVisible}
          onClose={() => setPaywallVisible(false)}
          onUpgradePress={goToSubscription}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchIcon: {
    marginRight: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeTeaserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
  },
  upgradeTeaserText: {
    flex: 1,
  },
  upgradeTeaserTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  upgradeTeaserSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  teaserListPlaceholder: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  teaserListHint: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  resultIcon: {
    marginRight: 0,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultProductName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultBarcode: {
    fontSize: 12,
    marginBottom: 4,
  },
  resultScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultScoreLabel: {
    fontSize: 12,
  },
  resultScoreValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
    position: 'relative',
    minHeight: 48,
  },
  filtersButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 8,
  },
});
