import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from './_layout';
import { useScanStore } from '../src/store/useScanStore';
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';
import { isPremiumFeatureEnabled, PremiumFeature } from '../src/utils/premiumFeatures';
import { fetchProduct } from '../src/services/productService';
import { searchProducts } from '../src/services/productSearchService';
import AdvancedSearchFilters, { SearchFilters } from '../src/components/AdvancedSearchFilters';
import { useTheme } from '../src/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    trustScoreMin: null,
    trustScoreMax: null,
    ecoscoreGrade: null,
    country: null,
    certification: [],
    allergenFree: false,
    novaMax: null,
    vegan: false,
    organic: false,
    local: false,
  });
  const { recentScans } = useScanStore();
  const { subscriptionInfo } = useSubscriptionStore();
  const canUseAdvancedSearch = isPremiumFeatureEnabled(PremiumFeature.ADVANCED_SEARCH, subscriptionInfo);

  const applyFilters = useCallback((results: any[], currentFilters: SearchFilters): any[] => {
    if (!canUseAdvancedSearch) {
      return results; // No filtering if not premium
    }

    return results.filter((item) => {
      const product = item.product;
      if (!product) return true; // Keep items without product data

      // Trust Score filter
      if (currentFilters.trustScoreMin !== null && (product.trust_score || 0) < currentFilters.trustScoreMin) {
        return false;
      }
      if (currentFilters.trustScoreMax !== null && (product.trust_score || 0) > currentFilters.trustScoreMax) {
        return false;
      }

      // Eco-Score filter
      if (currentFilters.ecoscoreGrade && product.ecoscore_grade?.toLowerCase() !== currentFilters.ecoscoreGrade.toLowerCase()) {
        return false;
      }

      // NOVA filter
      if (currentFilters.novaMax !== null && (product.nova_group || 0) > currentFilters.novaMax) {
        return false;
      }

      // Allergen free filter
      if (currentFilters.allergenFree && product.allergens_tags && product.allergens_tags.length > 0) {
        return false;
      }

      // Certification filters
      if (currentFilters.certification && currentFilters.certification.length > 0) {
        const productCerts = product.certifications?.map((c: any) => c.id?.toLowerCase()) || [];
        const hasAnyCert = currentFilters.certification.some(cert => 
          productCerts.includes(cert.toLowerCase())
        );
        if (!hasAnyCert) {
          // If organic filter is on, check labels
          if (currentFilters.organic && !product.labels_tags?.some((tag: string) => tag.toLowerCase().includes('organic'))) {
            return false;
          }
          if (!currentFilters.organic && !hasAnyCert) {
            return false;
          }
        }
      }

      // Quick filters
      if (currentFilters.organic) {
        const hasOrganic = product.labels_tags?.some((tag: string) => 
          tag.toLowerCase().includes('organic') || tag.toLowerCase().includes('bio')
        ) || product.certifications?.some((c: any) => c.id?.toLowerCase().includes('organic'));
        if (!hasOrganic) return false;
      }

      if (currentFilters.vegan) {
        const hasVegan = product.labels_tags?.some((tag: string) => 
          tag.toLowerCase().includes('vegan')
        ) || product.categories_tags?.some((tag: string) => 
          tag.toLowerCase().includes('vegan')
        );
        if (!hasVegan) return false;
      }

      return true;
    });
  }, [canUseAdvancedSearch]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setLoading(true);
    setSearchError(null);
    // Don't dismiss keyboard here - let user continue typing

    try {
      const trimmedQuery = query.trim();
      const results: any[] = [];

      // Search in recent scans first (local)
      const localResults = recentScans.filter(
        (scan) =>
          scan.barcode.includes(trimmedQuery) ||
          (scan.productName && scan.productName.toLowerCase().includes(trimmedQuery.toLowerCase()))
      );

      // Convert local results to search format
      localResults.forEach((scan) => {
        results.push({
          barcode: scan.barcode,
          product: { barcode: scan.barcode, product_name: scan.productName },
          source: 'local',
          isLocal: true,
        });
      });

      // If query looks like a barcode, try to fetch product
      if (/^\d{8,14}$/.test(trimmedQuery)) {
        try {
          const product = await fetchProduct(trimmedQuery, false, false, false);
          if (product) {
            // Check if already in results
            const exists = results.find(r => r.barcode === trimmedQuery);
            if (!exists) {
              results.unshift({ barcode: trimmedQuery, product, isDirect: true });
            }
          }
        } catch {
          // Continue with search
        }
      }

      // Search across all databases (Open Food Facts, Open Beauty Facts, Open Products Facts, Open Pet Food Facts, USDA, UPCitemdb)
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

        // Merge database results (avoid duplicates)
        databaseResults.forEach((dbResult) => {
          const exists = results.find(r => r.barcode === dbResult.barcode);
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
        // Continue with local results even if database search fails
      }

      // Apply filters if premium
      const filteredResults = applyFilters(results, filters);
      
      // Sort by relevance if available, otherwise keep order
      const sortedResults = filteredResults.sort((a, b) => {
        if (a.relevance && b.relevance) {
          return b.relevance - a.relevance;
        }
        if (a.isDirect || a.isLocal) return -1;
        if (b.isDirect || b.isLocal) return 1;
        return 0;
      });

      setSearchResults(sortedResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(t('search.error'));
    } finally {
      setLoading(false);
    }
  }, [recentScans, filters, applyFilters, t]);

  const handleResultPress = (barcode: string) => {
    navigation.navigate('Result', { barcode });
  };

  const handleSubmit = () => {
    // Dismiss keyboard when user explicitly submits
    Keyboard.dismiss();
    handleSearch(searchQuery);
  };

  // Debounce search to avoid too many requests
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't search if query is empty
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    // Set up debounced search (wait 300ms after user stops typing)
    debounceTimerRef.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    // Cleanup timer on unmount or when query changes
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]); // Only depend on searchQuery, handleSearch is stable via useCallback

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="search-outline" size={24} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              // Don't call handleSearch here - useEffect will handle debounced search
            }}
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
                setSearchResults([]);
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
        {/* Advanced Filters Button */}
        {canUseAdvancedSearch && (
          <TouchableOpacity
            style={[styles.filtersButton, { backgroundColor: colors.surface }]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options-outline" size={20} color={colors.primary} />
            <Text style={[styles.filtersButtonText, { color: colors.primary }]}>
              {t('search.advancedFilters')}
            </Text>
            {(filters.trustScoreMin !== null || 
              filters.trustScoreMax !== null || 
              filters.ecoscoreGrade !== null || 
              filters.novaMax !== null || 
              filters.vegan || 
              filters.organic || 
              filters.local || 
              filters.allergenFree || 
              (filters.certification && filters.certification.length > 0)) && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.filterBadgeText}>●</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results */}
      <View style={styles.content}>
        {loading && searchResults.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t('search.searching')}
            </Text>
          </View>
        ) : searchError ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.text }]}>{searchError}</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
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
                    {item.product?.trust_score !== undefined && (
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
        ) : searchQuery.length > 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>{t('search.noResults')}</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {t('search.noResultsMessage')}
            </Text>
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>{t('search.startSearch')}</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {t('search.startSearchMessage')}
            </Text>
          </View>
        )}
      </View>

      {/* Advanced Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <AdvancedSearchFilters
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            // Re-apply search with new filters
            if (searchQuery.trim()) {
              handleSearch(searchQuery);
            }
          }}
          onClose={() => setShowFilters(false)}
        />
      </Modal>
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

