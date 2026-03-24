import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
  Dimensions,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../_layout';
import { fetchProduct, refreshProduct } from '../../src/services/productService';
import { fetchProductOptimized } from '../../src/services/productServiceOptimized';
import { Product, ProductWithTrustScore } from '../../src/types/product';
import { useScanStore } from '../../src/store/useScanStore';
import { useFavoritesStore } from '../../src/store/useFavoritesStore';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import TruScore from '../../src/components/TruScore';
import ConfidenceBadge from '../../src/components/ConfidenceBadge';
import CountryFlag from '../../src/components/CountryFlag';
import CertBadge from '../../src/components/CertBadge';
import EcoScore from '../../src/components/EcoScore';
import UniversalPricingCard from '../../src/components/UniversalPricingCard';
import NutritionTable from '../../src/components/NutritionTable';
import { calculateTruScore, TruScoreResult } from '../../src/lib/truscoreEngine';
import { useValuesStore } from '../../src/store/useValuesStore';
import BannerAlertsCard from '../../src/components/BannerAlertsCard';
import { generateBannerAlerts } from '../../src/services/bannerAlertsService';
import { BannerAlertsData } from '../../src/types/bannerAlerts';
import InsightsCarousel from '../../src/components/InsightsCarousel';
import TruScoreInfoModal from '../../src/components/TrustScoreInfoModal';
import TruScoreAnalysisModal from '../../src/components/TruScoreAnalysisModal';
import EcoScoreInfoModal from '../../src/components/EcoScoreInfoModal';
import AllergensAdditivesModal from '../../src/components/AllergensAdditivesModal';
import AdditivesRiskCard from '../../src/components/AdditivesRiskCard';
import ProcessingLevelModal from '../../src/components/ProcessingLevelModal';
import CameraCaptureModal from '../../src/components/CameraCaptureModal';
import { extractManufacturingCountry, calculateEcoScore } from '../../src/services/openFoodFacts';
import { generateProductFlags } from '../../src/utils/productFlags';
import { generateBarcodeShareUrl, generateBarcodeDeepLink } from '../../src/utils/linking';
import { isWebSearchFallback } from '../../src/services/webSearchFallback';
import { useTheme } from '../../src/theme';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import { submitManufacturingCountry, getManufacturingCountry, hasUserSubmitted } from '../../src/services/manufacturingCountryService';
import { uploadProductPhoto } from '../../src/services/photoUploadService';
import ManufacturingCountryModal from '../../src/components/ManufacturingCountryModal';
import RecallAlertModal from '../../src/components/RecallAlertModal';
import PalmOilInfoModal from '../../src/components/PalmOilInfoModal';
import PackagingInfoModal from '../../src/components/PackagingInfoModal';
import ErrorBoundary from '../../src/components/ErrorBoundary';
import { sanitizeText } from '../../src/utils/validation';
import { logger } from '../../src/utils/logger';
import ManualProductEntryModal from '../../src/components/ManualProductEntryModal';
// import PendingContributionsBanner from '../../src/components/PendingContributionsBanner'; // Temporarily disabled
import { getManualProduct, isManualProduct, saveManualProduct } from '../../src/services/manualProductService';
import { ManualProductData } from '../../src/types/manualProduct';
import { cacheProduct } from '../../src/services/cacheService';
import { meetsLocalRecyclingRequirements } from '../../src/utils/packagingRecyclability';
import { getPalmOilStatus, getPalmOilFlagColor } from '../../src/utils/palmOilUtils';
import { crashReporter } from '../../src/utils/crashReporter';
import ShareModal from '../../src/components/ShareModal';
import PremiumGate from '../../src/components/PremiumGate';
import { PremiumFeature, isPremiumFeatureEnabled } from '../../src/utils/premiumFeatures';

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function ResultScreenContent() {
  const route = useRoute<ResultScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { barcode } = route.params;
  const { addScan } = useScanStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { subscriptionInfo } = useSubscriptionStore();
  const { isOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const valuesPreferences = useValuesStore();
  
  const isPremium = subscriptionInfo.isPremium && 
    (subscriptionInfo.status === 'active' || subscriptionInfo.status === 'trial' || subscriptionInfo.status === 'grace_period');
  
  // Tab bar height (60px + safe area bottom)
  const tabBarHeight = 60 + insets.bottom;

  // Helper function to get TruScore color
  const getTruScoreColor = (score: number | null) => {
    if (score === null) return '#95a5a6'; // Gray for insufficient data
    if (score >= 80) return '#16a085'; // Green (excellent)
    if (score >= 60) return '#4dd09f'; // Light green (good)
    if (score >= 40) return '#ffd93d'; // Yellow (fair)
    return '#ff6b6b'; // Red (poor)
  };

  // Helper function to get TruScore label
  const getTruScoreLabel = (score: number | null) => {
    if (score === null) return t('trust.insufficientData');
    if (score >= 80) return t('trust.excellent');
    if (score >= 60) return t('trust.good');
    if (score >= 40) return t('trust.fair');
    return t('trust.poor');
  };

  const [product, setProduct] = useState<ProductWithTrustScore | null>(null);
  const [truScore, setTruScore] = useState<TruScoreResult | null>(null);
  const [bannerAlerts, setBannerAlerts] = useState<BannerAlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState<string>('initializing');
  const [progressiveProduct, setProgressiveProduct] = useState<ProductWithTrustScore | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [truScoreModalVisible, setTruScoreModalVisible] = useState(false);
  const [truScoreAnalysisModalVisible, setTruScoreAnalysisModalVisible] = useState(false);
  const [ecoScoreModalVisible, setEcoScoreModalVisible] = useState(false);
  const [allergensAdditivesModalVisible, setAllergensAdditivesModalVisible] = useState(false);
  const [processingLevelModalVisible, setProcessingLevelModalVisible] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [manufacturingCountryModalVisible, setManufacturingCountryModalVisible] = useState(false);
  const [recallAlertModalVisible, setRecallAlertModalVisible] = useState(false);
  const [palmOilInfoModalVisible, setPalmOilInfoModalVisible] = useState(false);
  const [packagingInfoModalVisible, setPackagingInfoModalVisible] = useState(false);
  const [manualProductModalVisible, setManualProductModalVisible] = useState(false);
  const [editProductData, setEditProductData] = useState<Product | null>(null); // Product data for edit mode
  const [editMode, setEditMode] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareType, setShareType] = useState<'truScore' | 'recall' | 'countryOfManufacture' | 'negativeTruScore' | 'productInfo' | 'insights' | 'palmOil' | 'nutrition' | 'ingredients' | 'processing' | 'allergens' | 'ecoscore'>('truScore');
  const [userContributedCountry, setUserContributedCountry] = useState<{ country: string; confidence: string; verifiedCount: number; hasImportedIngredients?: boolean } | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isUserContributed, setIsUserContributed] = useState(false);
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const [communityCountryStats, setCommunityCountryStats] = useState<Array<{ country: string; count: number }>>([]);

  useEffect(() => {
    // Log screen entry (not a crash - just diagnostics)
    console.log('[ResultScreen] Screen mounted with barcode:', barcode, 'Platform:', Platform.OS);
    // Don't log screen mounts as crashes - only log actual errors
    
    // Load product with error boundary
    loadProduct().catch((error) => {
      console.error('[ResultScreen] Unhandled error in loadProduct:', error);
      crashReporter.logCrash({
        screen: 'Result',
        action: 'loadProduct',
        barcode,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    });
  }, [barcode, isPremium, isOffline]);

  // Check for user-contributed manufacturing country (must be before early returns)
  useEffect(() => {
    const checkUserContributedCountry = async () => {
      if (product) {
        try {
          const offCountry = extractManufacturingCountry(product);
          
          // Always load user-contributed data to check for imported ingredients flag
          const contributed = await getManufacturingCountry(barcode);
          
          console.log('[ResultScreen] Loaded country data:', {
            offCountry,
            contributedCountry: contributed.country,
            hasImportedIngredients: contributed.hasImportedIngredients,
            confidence: contributed.confidence,
          });
          
          if (!offCountry) {
            // No Open Food Facts country - use user-contributed data if available
            if (contributed.country) {
              setUserContributedCountry({
                country: contributed.country,
                confidence: contributed.confidence as 'verified' | 'community' | 'unverified' | 'disputed',
                verifiedCount: contributed.verifiedCount || 0,
                hasImportedIngredients: contributed.hasImportedIngredients || false,
              });
              
              // Get community country statistics (top countries by submission count)
              try {
                const { getCommunityCountryStats } = await import('../../src/services/manufacturingCountryService');
                const stats = await getCommunityCountryStats(barcode);
                setCommunityCountryStats(stats);
              } catch (statsError) {
                console.warn('[ResultScreen] Error loading community country stats:', statsError);
                setCommunityCountryStats([]);
              }
            } else {
              setUserContributedCountry(null);
              setCommunityCountryStats([]);
            }

            // Check if current user has already submitted
            try {
              const userHasSubmitted = await hasUserSubmitted(barcode);
              setHasSubmitted(userHasSubmitted);
            } catch (submitError) {
              console.warn('[ResultScreen] Error checking user submission:', submitError);
              setHasSubmitted(false);
            }
          } else {
            // We have Open Food Facts country - check if user has overridden it
            if (contributed.country && contributed.country.toUpperCase() !== offCountry.toUpperCase()) {
              // User has submitted a different country than default - prioritize user's country
              setUserContributedCountry({
                country: contributed.country,
                confidence: contributed.confidence as 'verified' | 'community' | 'unverified' | 'disputed',
                verifiedCount: contributed.verifiedCount || 0,
                hasImportedIngredients: contributed.hasImportedIngredients || false,
              });
              
              // Get community country statistics
              try {
                const { getCommunityCountryStats } = await import('../../src/services/manufacturingCountryService');
                const stats = await getCommunityCountryStats(barcode);
                setCommunityCountryStats(stats);
              } catch (statsError) {
                console.warn('[ResultScreen] Error loading community country stats:', statsError);
                setCommunityCountryStats([]);
              }
              
              // Check if current user has already submitted
              try {
                const userHasSubmitted = await hasUserSubmitted(barcode);
                setHasSubmitted(userHasSubmitted);
              } catch (submitError) {
                console.warn('[ResultScreen] Error checking user submission:', submitError);
                setHasSubmitted(false);
              }
            } else if (contributed.hasImportedIngredients) {
              // Same country as default, but has imported ingredients flag
              setUserContributedCountry({
                country: '', // Empty since we use Open Food Facts country
                confidence: 'verified' as const,
                verifiedCount: 0,
                hasImportedIngredients: true,
              });
              setHasSubmitted(false);
              setCommunityCountryStats([]);
            } else {
              // No user override and no imported ingredients flag
              setUserContributedCountry(null);
              setHasSubmitted(false);
              setCommunityCountryStats([]);
            }
          }
        } catch (error) {
          // Non-critical error - log but don't break the UI
          console.warn('[ResultScreen] Error checking user-contributed country:', error);
          setUserContributedCountry(null);
          setCommunityCountryStats([]);
          setHasSubmitted(false);
        }
      }
    };
    
    if (product) {
      checkUserContributedCountry();
    }
  }, [barcode, product]);

  // Check if product is user-contributed (manual entry)
  useEffect(() => {
    const checkUserContributed = async () => {
      if (product) {
        try {
          const isManual = await isManualProduct(barcode);
          setIsUserContributed(isManual);
        } catch (error) {
          console.warn('[ResultScreen] Error checking manual product:', error);
          setIsUserContributed(false);
        }
      } else {
        setIsUserContributed(false);
      }
    };
    checkUserContributed();
  }, [barcode, product]);

  // Initialize values store
  useEffect(() => {
    valuesPreferences.initializeStore();
  }, []);

  // Use TruScore from product object (already calculated in productService.ts using truscoreEngine.ts)
  // Always use product object score for consistency with logs - no fallback recalculation
  useEffect(() => {
    if (product) {
      // Use score from product if available (from productService.ts - consistent with logs)
      if (product.trust_score !== null && product.trust_score_breakdown) {
        // Generate insights if values preferences are enabled
        let insights: TruScoreResult['insights'] = undefined;
        if (valuesPreferences && (
          valuesPreferences.geopoliticalEnabled ||
          valuesPreferences.ethicalEnabled ||
          valuesPreferences.environmentalEnabled
        )) {
          try {
            const { generateInsights } = require('../../src/lib/valuesInsights');
            const generatedInsights = generateInsights(product, valuesPreferences);
            if (generatedInsights && generatedInsights.length > 0) {
              insights = generatedInsights;
            }
          } catch (error) {
            console.warn('[ResultScreen] Error generating insights:', error);
          }
        }
        
        const score: TruScoreResult = {
          truscore: product.trust_score,
          breakdown: {
            Body: product.trust_score_breakdown.body ?? 0,
            Planet: product.trust_score_breakdown.planet ?? 0,
            Ethics: product.trust_score_breakdown.ethics ?? 0,
            Open: product.trust_score_breakdown.open ?? 0,
          },
          hasNutriScore: product._truscore_metadata?.hasNutriScore,
          hasEcoScore: product._truscore_metadata?.hasEcoScore,
          hasOrigin: product._truscore_metadata?.hasOrigin,
          insights,
        };
        setTruScore(score);
      } else {
        // If score is missing, set to null (don't recalculate - ensures consistency)
        setTruScore(null);
      }
    } else {
      setTruScore(null);
    }
  }, [product, valuesPreferences]);

  // Load banner alerts ASYNCHRONOUSLY after product is displayed (non-blocking)
  // This ensures banner alerts don't slow down the Product Information page display
  useEffect(() => {
    if (!product) {
      setBannerAlerts(null);
      return;
    }

    // Generate banner alerts asynchronously (non-blocking)
    // Use setTimeout to ensure this runs after the render cycle
    const loadBannerAlerts = async () => {
      try {
        // Small delay to ensure product is already displayed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Generate alerts (this is fast, but we do it async to not block)
        const alerts = generateBannerAlerts(product, valuesPreferences);
        setBannerAlerts(alerts);
      } catch (error) {
        console.warn('[ResultScreen] Error generating banner alerts:', error);
        setBannerAlerts(null);
      }
    };

    loadBannerAlerts();
  }, [product, valuesPreferences]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[ResultScreen] Loading product for barcode:', barcode, 'Platform:', Platform.OS);
      
      // Validate barcode
      if (!barcode || typeof barcode !== 'string' || !/^\d{8,14}$/.test(barcode)) {
        console.error('[ResultScreen] Invalid barcode:', barcode);
        setError('Invalid barcode format');
        setLoading(false);
        return;
      }
      
      // First check if this is a manually added product
      try {
        const manualProduct = await getManualProduct(barcode);
        if (manualProduct) {
          console.log('[ResultScreen] Found manual product');
          setProduct(manualProduct);
          try {
            addScan({
              barcode,
              timestamp: Date.now(),
              productName: manualProduct.product_name || manualProduct.product_name_en || null,
            });
          } catch (scanError) {
            console.warn('[ResultScreen] Error adding to scan history:', scanError);
            // Continue - not critical
          }
          setLoading(false);
          return;
        }
      } catch (manualError) {
        console.warn('[ResultScreen] Error checking manual product:', manualError);
        // Continue to API fetch
      }

      // OPTIMIZED: Use optimized product service with progressive loading
      console.log('[ResultScreen] Fetching product from APIs (optimized)...');
      let productData: ProductWithTrustScore | null = null;
      
      // ULTRA-FAST: Progress callback for instant product display
      // Product displays immediately (< 100ms) even before TruScore is calculated
      const onProgress = (progress: { phase: string; product?: Product }) => {
        setLoadingPhase(progress.phase);
        if (progress.product) {
          // Convert Product to ProductWithTrustScore if needed
          const productWithScore = progress.product as ProductWithTrustScore;
          
          // CRITICAL: Update product IMMEDIATELY - don't wait for anything
          // This enables instant display (< 100ms) instead of waiting for TruScore
          setProgressiveProduct(productWithScore);
          setProduct(productWithScore); // Update main product immediately
          setLoading(false); // Stop loading spinner - show product immediately
          
          console.log(`[ResultScreen] ⚡ INSTANT display: ${progress.phase}`, productWithScore.product_name, 
            `TruScore: ${productWithScore.trust_score || 'calculating...'}`);
          
          // Background merge complete: product now has extended _fetchTrace (all DBs that contributed)
          if (progress.phase === 'product_enhanced') {
            const traceLen = productWithScore._truscore_analysis?.fetchTrace?.length ?? 0;
            console.log(`[ResultScreen] ✅ Product enhanced (merge complete): TruScore ${productWithScore.trust_score}, fetch trace: ${traceLen} source(s) – Score breakdown reflects all DBs used`);
          }
          if (progress.phase === 'complete') {
            console.log(`[ResultScreen] ✅ Product complete with TruScore: ${productWithScore.trust_score}`);
          }
        }
      };
      
      try {
        // Use optimized service with progressive loading
        productData = await fetchProductOptimized(barcode, true, isPremium, isOffline, onProgress);
      } catch (fetchError) {
        console.error('[ResultScreen] Error fetching product:', fetchError);
        // Enhanced error logging for iOS
        if (Platform.OS === 'ios') {
          logger.error('[ResultScreen] iOS product fetch error', {
            barcode,
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
            stack: fetchError instanceof Error ? fetchError.stack : undefined,
          });
        }
        
        // Try fallback with graceful degradation
        try {
          const { fetchProductWithFallback, createMinimalProduct } = await import('../../src/services/errorHandlingService');
          productData = await fetchProductWithFallback(
            barcode,
            () => fetchProduct(barcode, true, isPremium, isOffline), // Fallback to original service
            isPremium
          );
          
          if (!productData) {
            // Last resort: minimal product
            productData = createMinimalProduct(barcode);
          }
        } catch (fallbackError) {
          console.error('[ResultScreen] Fallback also failed:', fallbackError);
          productData = null;
        }
      }
      
      if (productData) {
        console.log('[ResultScreen] Product fetched successfully');
        setProduct(productData);
        setProgressiveProduct(productData);
        // Update scan history with product name
        try {
          addScan({
            barcode,
            timestamp: Date.now(),
            productName: productData.product_name || productData.product_name_en || null,
          });
        } catch (scanError) {
          console.warn('[ResultScreen] Error adding to scan history:', scanError);
          // Continue - not critical
        }
      } else {
        console.warn('[ResultScreen] Product not found');
        // CRITICAL FIX: Better error message for product not found
        setError('Product not found in our databases. You can help by adding this product manually.');
      }
    } catch (err) {
      console.error('[ResultScreen] Fatal error loading product:', err);
      console.error('[ResultScreen] Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : 'No stack trace',
        barcode,
        platform: Platform.OS,
      });
      setError('Failed to load product data');
      
      // On iOS, log additional context
      if (Platform.OS === 'ios') {
        logger.error('[ResultScreen] iOS crash context', {
          barcode,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const productData = await refreshProduct(barcode);
      if (productData) {
        setProduct(productData);
      }
    } catch (err) {
      console.error('Error refreshing product:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!product) return;
    
    if (isFavorite(barcode)) {
      await removeFavorite(barcode);
    } else {
      await addFavorite(barcode, product);
    }
  };

  // Handle sharing for specific card types
  const handleShare = (cardType: 'truScore' | 'recall' | 'countryOfManufacture' | 'negativeTruScore' | 'productInfo' | 'insights' | 'palmOil' | 'nutrition' | 'ingredients' | 'processing' | 'allergens' | 'ecoscore') => {
    if (!product) return;
    
    setShareType(cardType);
    setShareModalVisible(true);
  };

  // Handle editing product data - opens modal in edit mode
  const handleEditProduct = () => {
    if (!product) return;
    setEditProductData(product);
    setEditMode(true);
    setManualProductModalVisible(true);
  };

  const handleContribute = () => {
    // Open Open Food Facts with barcode pre-filled for adding/editing product
    const offUrl = `https://world.openfoodfacts.org/cgi/product.pl?type=edit&code=${barcode}`;
    
    Linking.openURL(offUrl).catch((error) => {
      console.error('Error opening Open Food Facts:', error);
      Alert.alert(
        t('common.error'),
        t('result.contributeError'),
        [{ text: t('common.ok') }]
      );
    });
  };

  // OPTIMIZED: Progressive loading - show product as soon as available
  // Only show full loading spinner if we don't have any product data yet
  if (loading && !product && !progressiveProduct) {
    const loadingMessages: Record<string, string> = {
      'initializing': t('result.loading', 'Initializing...'),
      'fast_sources': t('result.loading', 'Searching databases...'),
      'enhancement': t('result.loading', 'Enhancing data...'),
      'fallbacks': t('result.loading', 'Searching additional sources...'),
    };
    
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {loadingMessages[loadingPhase] || t('result.loading')}
        </Text>
        {loadingPhase !== 'initializing' && (
          <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
            {loadingPhase === 'fast_sources' && 'Checking cache and fast sources...'}
            {loadingPhase === 'enhancement' && 'Gathering additional information...'}
            {loadingPhase === 'fallbacks' && 'Trying alternative sources...'}
          </Text>
        )}
      </View>
    );
  }
  
  // If we have progressive product but still loading, show it with loading indicators
  // This provides immediate feedback while data continues to load

  // Helper function for manual product save
  const handleManualProductSave = async (productData: ManualProductData) => {
    // Reload product data - it should now be available from cache
    await loadProduct();
    setManualProductModalVisible(false);
    Toast.show({ type: 'success', text1: 'Updated', text2: 'Product information saved' });
  };

  // Check if product has minimal/no useful data (only if product exists)
  // Show unknown product page for: no product, errors, minimal data, web search products with minimal data
  // IMPORTANT: SQLite products are cached products - always show them (they have real data)
  // IMPORTANT: Products from real databases (OFF, OBF, etc.) should always be shown even if merged with web search
  let shouldShowUnknownProductPage = false;
  if (product) {
    // Check if product came from a real database (not web search only)
    const isRealDatabaseProduct = product.source === 'sqlite' || 
                                  product.source === 'openfoodfacts' ||
                                  product.source === 'openbeautyfacts' ||
                                  product.source === 'openpetfoodfacts' ||
                                  product.source === 'openproductsfacts' ||
                                  product.source === 'usda_fooddata' ||
                                  product.source === 'fsanz_au' ||
                                  product.source === 'fsanz_nz' ||
                                  product.source === 'health_canada_cnf' ||
                                  product.source === 'uk_fsa' ||
                                  product.source === 'efsa' ||
                                  product.source === 'tesco_labs' ||
                                  product.source === 'walmart_open' ||
                                  product.source === 'foodrepo' ||
                                  product.source?.includes('+'); // Merged products (e.g., 'openfoodfacts+web_search')
    
    // If it's a real database product, check if it has meaningful data
    if (isRealDatabaseProduct) {
      // CRITICAL: Real database products (OFF, OBF, etc.) should ALWAYS be shown if they have ANY real data
      // Even if quality is low or merged with web search, real database products are valid
      
      // Check if product has a valid name (not generic placeholder)
      const hasValidName = product.product_name && 
                          product.product_name !== 'Unknown Product' &&
                          product.product_name.trim().length > 0 &&
                          !product.product_name.match(/^Product \d+$/); // Exclude "Product 123456" but allow "Product (cream)"
      
      // Check for ANY meaningful data - real database products just need one indicator
      const hasAnyRealData = (
                         (product.ingredients_text && product.ingredients_text.trim().length > 10) ||
                         (product.image_url || product.image_front_url || product.image_front_small_url) ||
                         (product.nutriments && Object.keys(product.nutriments).length > 0) ||
                         (product.categories && product.categories.trim().length > 0) ||
                         (product.certifications && Array.isArray(product.certifications) && product.certifications.length > 0) ||
                         (product.labels_tags && Array.isArray(product.labels_tags) && product.labels_tags.length > 0) ||
                         product.ecoscore_grade ||
                         product.nutriscore_grade ||
                         product.nova_group !== undefined ||
                         (product.brands && product.brands.trim().length > 0 && product.brands !== 'N/A' && product.brands.toLowerCase() !== 'n/a')
                         );
      
      // CRITICAL FIX: Show product if it has EITHER a valid name OR any real data
      // This matches Yuka's behavior of showing products with minimal data
      // Real database products should be shown even if they only have a name OR only have data
      const shouldShowProduct = hasValidName || hasAnyRealData;
      shouldShowUnknownProductPage = !shouldShowProduct;
    } else {
      // CRITICAL FIX: For web search products, accept if they have ANY useful data
      // This matches Yuka's behavior of showing products even with minimal data
      const isWebSearchProduct = isWebSearchFallback(product);
      
      if (isWebSearchProduct) {
        // Accept web search products if they have:
        // - A valid product name (not "Product 123" or "Unknown Product")
        // - OR any data (image, nutrition, ingredients, brand, generic name)
        const hasValidName = product.product_name && 
                            product.product_name !== 'Unknown Product' &&
                            !product.product_name.startsWith('Product ') &&
                            product.product_name.trim().length > 0;
        
        const imageUrl = product.image_url || product.image_front_url || product.image_front_small_url;
        const hasAnyData = imageUrl || 
                          (product.nutriments && Object.keys(product.nutriments).length > 0) ||
                          (product.ingredients_text && product.ingredients_text.trim().length > 10) ||
                          (product.brands && product.brands.trim().length > 0) ||
                          (product.generic_name && product.generic_name.length > 20);
        
        // Show product if it has valid name OR any data (matches Yuka behavior)
        // Only show "Unknown Product" if truly empty
        shouldShowUnknownProductPage = !(hasValidName || hasAnyData);
      } else {
        // For non-web-search products, use existing logic
        const imageUrl = product.image_url || product.image_front_url || product.image_front_small_url;
        const hasMinimalData = !imageUrl && 
                               (!product.nutriments || Object.keys(product.nutriments).length === 0) &&
                               !product.ingredients_text &&
                               (!product.product_name || product.product_name.startsWith('Product ') || product.product_name === 'Unknown Product') &&
                               (!product.generic_name || product.generic_name.length < 20) &&
                               (!product.brands || product.brands.trim().length === 0);
        
        shouldShowUnknownProductPage = hasMinimalData ||
                                       (product.product_name === 'Unknown Product') ||
                                       !!(product.product_name && product.product_name.startsWith('Product '));
      }
    }
  }

  // Show "Unknown Product" page if product not found OR has minimal/no useful data
  if (error || !product || shouldShowUnknownProductPage) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.unknownProductContainer}
        >
          <View style={styles.unknownProductContent}>
            <Ionicons name="barcode-outline" size={80} color={colors.textTertiary} />
            <Text style={[styles.errorTitle, { color: colors.text, marginTop: 24 }]}>
              {t('result.productUnknown') || 'Unknown Product'}
            </Text>
            <Text style={[styles.errorText, { color: colors.textSecondary, marginTop: 12, marginBottom: 8 }]}>
              {t('result.unknownProductMessage') || 'We couldn\'t find detailed information about this product in our databases.'}
            </Text>
            <Text style={[styles.barcodeText, { color: colors.textTertiary, marginBottom: 32 }]}>
              Barcode: {barcode}
            </Text>
            
            {/* Primary Action: Add Product Information */}
            <TouchableOpacity
              style={[styles.primaryActionButton, { backgroundColor: colors.primary }]}
              onPress={() => setManualProductModalVisible(true)}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.primaryActionButtonText}>
                {t('manualProduct.addProductInformation') || 'Add Product Information'}
              </Text>
              <Text style={styles.primaryActionButtonSubtext}>
                {t('manualProduct.addProductSubtext') || 'Enter details from the product label'}
              </Text>
            </TouchableOpacity>
            
            {/* Secondary Action: View Open Food Facts website */}
            <TouchableOpacity
              style={[styles.secondaryActionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleContribute}
            >
              <Ionicons name="globe-outline" size={20} color={colors.primary} />
              <Text style={[styles.secondaryActionButtonText, { color: colors.primary }]}>
                View Open Food Facts website
              </Text>
            </TouchableOpacity>
            
            {/* Help Text */}
            <View style={[styles.helpSection, { backgroundColor: colors.surface }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                {t('result.unknownProductHelp') || 'You can add product information manually, or contribute it to the Open Food Facts database to help others.'}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => {
                // Navigate to Scan tab - use reset to ensure proper navigation on iOS
                try {
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [
                        {
                          name: 'Main',
                          state: {
                            routes: [{ name: 'Scan' }],
                            index: 0,
                          },
                        },
                      ],
                    })
                  );
                } catch (error) {
                  // Fallback: try simple navigate
                  try {
                    navigation.navigate('Main', { screen: 'Scan' });
                  } catch (navError) {
                    // Last resort: go back and navigate
                    navigation.goBack();
                    setTimeout(() => {
                      navigation.navigate('Main', { screen: 'Scan' });
                    }, 100);
                  }
                }
              }}
            >
              <Text style={[styles.backButtonText, { color: colors.primary }]}>
                {t('result.scanAnother') || 'Scan Another Product'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* Manual Product Entry Modal */}
        <ManualProductEntryModal
          visible={manualProductModalVisible}
          onClose={() => setManualProductModalVisible(false)}
          onSave={handleManualProductSave}
          barcode={barcode}
        />
      </SafeAreaView>
    );
  }

  const manufacturingCountry = extractManufacturingCountry(product);
  const imageUrl = product.image_url || product.image_front_url || product.image_front_small_url;
  const isWebSearchProduct = isWebSearchFallback(product);

  // Combine Open Food Facts data with user contributions
  // CRITICAL: If user has overridden default country, prioritize user-contributed country
  // This ensures when user changes default country, their entry is displayed with verification status
  const displayManufacturingCountry = (userContributedCountry?.country && 
                                      manufacturingCountry && 
                                      userContributedCountry.country.toUpperCase() !== manufacturingCountry.toUpperCase())
    ? userContributedCountry.country  // User overrode default - show user's country
    : (manufacturingCountry || userContributedCountry?.country || null); // Otherwise use default or user-contributed
  
  // Calculate Eco-Score using the proper function to ensure grade is calculated from score if missing
  const calculatedEcoScore = product ? calculateEcoScore(product) : null;
  

  const handleCaptureImage = async (imageUri: string) => {
    if (!product) return;
    
    // Update product with captured image
    const updatedProduct = {
      ...product,
      image_url: imageUri,
    };
    setProduct(updatedProduct);
    
    // Save to cache
    try {
      await cacheProduct(updatedProduct as Product, isPremium);
    } catch (error) {
      console.error('Error caching product with image:', error);
    }
    
    // Submit photo to backend for global sharing
    try {
      console.log('[ResultScreen] 🎯 handleCaptureImage CALLED - Starting photo upload and submission');
      
      // Upload photo to get public URL
      const photoResult = await uploadProductPhoto(barcode, imageUri, 'front');
      const uploadedPhotoUrl = photoResult.success 
        ? (photoResult.openFoodFactsUrl || photoResult.vercelUrl || imageUri)
        : imageUri;
      
      console.log('[ResultScreen] ✅ Photo uploaded:', {
        success: photoResult.success,
        url: uploadedPhotoUrl,
        openFoodFactsUrl: photoResult.openFoodFactsUrl,
        vercelUrl: photoResult.vercelUrl,
      });
      
      // Create product data with uploaded photo
      const productData: ManualProductData = {
        barcode,
        product_name: product.product_name || product.product_name_en || 'Unknown Product',
        brands: product.brands,
        ingredients_text: product.ingredients_text,
        image_url: uploadedPhotoUrl,
        nutriments: product.nutriments,
        serving_size: product.serving_size,
        quantity: product.quantity,
        manufacturing_places: product.manufacturing_places,
        countries: product.countries,
        categories: product.categories,
        allergens_tags: product.allergens_tags,
        additives_tags: product.additives_tags,
        packaging_data: product.packaging_data,
        timestamp: Date.now(),
      };
      
      // Submit to backend for global sharing
      console.log('[ResultScreen] 📦 Submitting product data to backend...');
      const saveResult = await saveManualProduct(productData);
      
      if (saveResult) {
        console.log('[ResultScreen] ✅✅✅ Product data submitted successfully');
        Toast.show({
          type: 'success',
          text1: t('result.photoSubmitted') || 'Photo Submitted',
          text2: t('result.photoSubmittedMessage') || 'Your photo will be available to all users',
          position: 'bottom',
        });
      } else {
        console.warn('[ResultScreen] ⚠️ Product data submission returned false');
        Toast.show({
          type: 'info',
          text1: t('result.photoSaved') || 'Photo Saved',
          text2: t('result.photoSavedLocally') || 'Photo saved locally',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('[ResultScreen] ❌ Error submitting photo:', error);
      Toast.show({
        type: 'error',
        text1: t('result.photoError') || 'Error',
        text2: t('result.photoErrorMessage') || 'Failed to submit photo. Please try again.',
        position: 'bottom',
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Legal disclaimer banner (for lawyer review) */}
        <View style={[styles.disclaimerBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.textSecondary}
            style={styles.disclaimerIcon}
          />
          <View style={styles.disclaimerTextContainer}>
            <Text style={[styles.disclaimerTitle, { color: colors.textSecondary }]}>
              {t('result.disclaimerTitle') || 'Important information'}
            </Text>
            <Text style={[styles.disclaimerText, { color: colors.textTertiary }]}>
              {t('result.disclaimerBody') ||
                'TruScan scores and insights are informational opinions based on public data. They may be ' +
                  'incomplete or inaccurate and are not medical, nutritional, or legal advice. Always read the ' +
                  'product label and consult a qualified professional for personal health or dietary decisions.'}
            </Text>
          </View>
        </View>

        {/* Data limitations note when key fields are missing (for lawyer review) */}
        {product && (!product.ingredients_text || !product.ingredients_text.trim() || !product.countries || !product.countries.trim()) && (
          <View style={[styles.dataLimitationsBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons
              name="warning-outline"
              size={16}
              color={colors.textSecondary}
              style={styles.dataLimitationsIcon}
            />
            <Text style={[styles.dataLimitationsText, { color: colors.textTertiary }]}>
              {t('result.dataLimitations') ||
                'Some information such as full ingredients or origin may be missing from public databases. ' +
                  'When data is incomplete, TruScan reduces the score rather than assuming the product is safe or unsafe.'}
            </Text>
          </View>
        )}
        {/* Legal disclaimer banner (for lawyer review) */}
        <View style={[styles.disclaimerBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.textSecondary}
            style={styles.disclaimerIcon}
          />
          <View style={styles.disclaimerTextContainer}>
            <Text style={[styles.disclaimerTitle, { color: colors.textSecondary }]}>
              {t('result.disclaimerTitle') || 'Important information'}
            </Text>
            <Text style={[styles.disclaimerText, { color: colors.textTertiary }]}>
              {t('result.disclaimerBody') ||
                'TruScan scores and insights are informational opinions based on public data. They may be ' +
                  'incomplete or inaccurate and are not medical, nutritional, or legal advice. Always read the ' +
                  'product label and consult a qualified professional for personal health or dietary decisions.'}
            </Text>
          </View>
        </View>
        {/* Pending Contributions Banner - Shows when user has unsubmitted contributions */}
        {/* <PendingContributionsBanner 
          barcode={barcode}
          onSubmitted={() => {
            // Refresh product data after submission
            handleRefresh();
          }}
        /> */}
        
        {/* Hero Section */}
        <View style={[styles.hero, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="contain" />
          ) : (
            <TouchableOpacity
              style={[styles.placeholderImage, { backgroundColor: colors.surface }]}
              onPress={() => setCameraModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.captureImageText, { color: colors.textSecondary }]}>
                {t('result.takePhoto')}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.productNameContainer}>
            <Text 
              style={[styles.productName, { color: colors.text }]} 
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {product.product_name || product.product_name_en || 'Unknown Product'}
            </Text>
            {isUserContributed && (
              <View style={[styles.userContributedBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                <Ionicons name="person-circle-outline" size={14} color={colors.primary} />
                <Text style={[styles.userContributedText, { color: colors.primary }]}>
                  {t('manualProduct.userContributed') || 'User Contributed'}
                </Text>
              </View>
            )}
          </View>
          {product.brands && (
            <Text style={[styles.brand, { color: colors.textSecondary }]}>
              {sanitizeText(product.brands, 200)}
            </Text>
          )}
          
          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            {/* Scan Another Product Button */}
            <TouchableOpacity
              style={[styles.scanAnotherButton, { backgroundColor: colors.primary, flex: 1 }]}
              onPress={() => {
                // Navigate to Scan tab - use reset to ensure proper navigation on iOS
                // This ensures we go back to Main and select the Scan tab
                try {
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [
                        {
                          name: 'Main',
                          state: {
                            routes: [{ name: 'Scan' }],
                            index: 0,
                          },
                        },
                      ],
                    })
                  );
                } catch (error) {
                  // Fallback: try simple navigate
                  console.warn('[ResultScreen] Navigation reset failed, trying navigate:', error);
                  try {
                    navigation.navigate('Main', { screen: 'Scan' });
                  } catch (navError) {
                    // Last resort: go back and navigate
                    console.warn('[ResultScreen] Navigation navigate failed, trying goBack:', navError);
                    navigation.goBack();
                    setTimeout(() => {
                      navigation.navigate('Main', { screen: 'Scan' });
                    }, 100);
                  }
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="barcode-outline" size={20} color="#fff" />
              <Text style={styles.scanAnotherButtonText}>
                {t('result.scanAnother') || 'Scan Another Product'}
              </Text>
            </TouchableOpacity>

            {/* Share button removed - share icons now appear on individual cards */}
          </View>
        </View>

        {/* Food Recall Alert - Compact banner that opens modal */}
        {product.recalls && product.recalls.length > 0 && (
          <TouchableOpacity
            style={[styles.recallAlertBanner, { backgroundColor: '#ff6b6b' + '20', borderColor: '#ff6b6b' }]}
            onPress={() => setRecallAlertModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.recallBannerContent}>
              <View style={styles.recallBannerLeft}>
                <View style={[styles.recallBannerIconContainer, { backgroundColor: '#ff6b6b' + '30' }]}>
                  <Ionicons name="warning" size={20} color="#ff6b6b" />
                </View>
                <View style={styles.recallBannerText}>
                  <Text style={[styles.recallBannerTitle, { color: colors.text }]}>
                    {t('result.foodRecall', 'Food Recall Alert')}
                  </Text>
                  <Text style={[styles.recallBannerSubtitle, { color: colors.textSecondary }]}>
                    {product.recalls.length === 1 
                      ? t('result.recallCountSingle', '1 recall found - Tap for details')
                      : t('result.recallCountMultiple', `${product.recalls.length} recalls found - Tap for details`)
                    }
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Banner Alerts Card - Above TruScore */}
        {/* Loaded asynchronously to not block product display */}
        {bannerAlerts && bannerAlerts.hasAlerts && (
          <BannerAlertsCard 
            alertsData={bannerAlerts}
          />
        )}

        {/* TruScore Card - v1.4 */}
        {truScore ? (
          <TouchableOpacity
            style={[styles.card, { 
              backgroundColor: colors.card,
              borderColor: getTruScoreColor(truScore.truscore),
              borderWidth: 2,
            }]}
            onPress={() => setTruScoreModalVisible(true)}
            activeOpacity={0.7}
          >
          <View style={styles.cardHeader}>
            {/* Top line: Icons */}
            <View style={styles.cardHeaderTop}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="shield" size={24} color={colors.primary} />
                <TouchableOpacity
                  onPress={() => {
                    setTruScoreModalVisible(true);
                  }}
                  style={styles.infoButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.cardHeaderRight}>
                <TouchableOpacity
                  onPress={handleToggleFavorite}
                  style={styles.favoriteButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={isFavorite(barcode) ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isFavorite(barcode) ? '#ff6b6b' : colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    // Determine share type for TruScore card
                    const cardShareType = product.trust_score !== null && product.trust_score < 40 
                      ? 'negativeTruScore' 
                      : 'truScore';
                    handleShare(cardShareType);
                  }}
                  style={styles.shareButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="share-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            {/* Second line: Heading */}
            <Text style={[styles.cardTitle, { color: colors.text }]}>TruScore</Text>
          </View>
          
          {/* TruScore Display - v1.4 */}
          <TruScore truScore={truScore} size="medium" />

          {/* Score breakdown - opens analysis modal (DBs, pillars, adjustments) */}
          <TouchableOpacity
            onPress={() => setTruScoreAnalysisModalVisible(true)}
            style={[styles.analysisButton, { borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Ionicons name="analytics-outline" size={18} color={colors.primary} />
            <Text style={[styles.analysisButtonText, { color: colors.primary }]}>
              How was this scored?
            </Text>
          </TouchableOpacity>
          
          {/* Confidence Badge - Data Quality Indicator */}
          {product && product.confidence !== undefined && (
            <View style={styles.confidenceBadgeContainer}>
              <ConfidenceBadge product={product} size="small" />
            </View>
          )}

          {/* Why this score - Green/Red Flags */}
          {(() => {
            // Ensure palm_oil_analysis exists before generating flags
            // This ensures consistency with Palm Oil card and Values Insights
            if (product.ingredients_text && !product.palm_oil_analysis) {
              // Re-extract palm oil analysis if missing (shouldn't happen, but safety check)
              const { extractPalmOilAnalysis } = require('../../src/services/openFoodFacts');
              try {
                product.palm_oil_analysis = extractPalmOilAnalysis(product);
              } catch (error) {
                console.warn('[ResultScreen] Failed to extract palm oil analysis:', error);
              }
            }
            
            const flags = generateProductFlags(product);
            const greenFlags = flags.filter(f => f.type === 'green');
            const redFlags = flags.filter(f => f.type === 'red');
            
            if (greenFlags.length === 0 && redFlags.length === 0) return null;
            
            return (
              <View style={[styles.reasonsContainer, { borderTopColor: colors.border }]}>
                <View style={styles.reasonsHeader}>
                  <Text style={[styles.reasonsTitle, { color: colors.text }]}>Score highlights:</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const cardShareType = product.trust_score !== null && product.trust_score < 40 
                        ? 'negativeTruScore' 
                        : 'truScore';
                      handleShare(cardShareType);
                    }}
                    style={styles.shareButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="share-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                
                {/* Green Flags (Positive) */}
                {greenFlags.length > 0 && (
                  <View style={styles.flagsSection}>
                    <View style={styles.flagsHeader}>
                      <Ionicons name="checkmark-circle" size={18} color="#4caf50" />
                      <Text style={[styles.flagsSectionTitle, { color: colors.text }]}>
                        {t('result.positivePoints')} ({greenFlags.length})
                      </Text>
                    </View>
                    {greenFlags.map((flag, index) => (
                      <View key={`green-${index}`} style={styles.flagItem}>
                        <View style={[styles.flagIndicator, { backgroundColor: '#4caf50' + '20' }]}>
                          <Ionicons name="checkmark-circle" size={14} color="#4caf50" />
                        </View>
                        <View style={styles.flagContent}>
                          <Text style={[styles.flagTitle, { color: colors.text }]}>{flag.title}</Text>
                          <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                            {flag.description}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                
                {/* Red Flags (Negative) */}
                {redFlags.length > 0 && (
                  <View style={[styles.flagsSection, greenFlags.length > 0 && styles.flagsSectionWithMargin]}>
                    <View style={styles.flagsHeader}>
                      <Ionicons name="alert-circle" size={18} color="#f44336" />
                      <Text style={[styles.flagsSectionTitle, { color: colors.text }]}>
                        {t('result.negativePoints')} ({redFlags.length})
                      </Text>
                    </View>
                    {redFlags.map((flag, index) => (
                      <View key={`red-${index}`} style={styles.flagItem}>
                        <View style={[styles.flagIndicator, { backgroundColor: '#f44336' + '20' }]}>
                          <Ionicons name="alert-circle" size={14} color="#f44336" />
                        </View>
                        <View style={styles.flagContent}>
                          <Text style={[styles.flagTitle, { color: colors.text }]}>{flag.title}</Text>
                          <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                            {flag.description}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })()}
        </TouchableOpacity>
        ) : (
          /* Insufficient Data Card */
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              {/* Top line: Icons */}
              <View style={styles.cardHeaderTop}>
                <View style={styles.cardHeaderLeft}>
                  <Ionicons name="information-circle-outline" size={24} color={colors.warning || '#ff9800'} />
                </View>
                <View style={styles.cardHeaderRight}>
                  <TouchableOpacity
                    onPress={handleToggleFavorite}
                    style={styles.favoriteButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={isFavorite(barcode) ? 'heart' : 'heart-outline'}
                      size={20}
                      color={isFavorite(barcode) ? '#ff6b6b' : colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      handleShare('productInfo');
                    }}
                    style={styles.shareButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="share-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              {/* Second line: Heading */}
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('result.insufficientData')}
              </Text>
            </View>
            <Text style={[styles.insufficientDataText, { color: colors.textSecondary }]}>
              {t('result.insufficientDataMessage')}
            </Text>
          </View>
        )}

        {/* Insights Carousel - Values v1.1 (Collapsible) */}
        {truScore && truScore.insights && truScore.insights.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={[styles.insightsHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.insightsHeaderLeft}
                onPress={() => setInsightsExpanded(!insightsExpanded)}
                activeOpacity={0.7}
              >
                <Ionicons name="bulb" size={20} color={colors.primary} />
                <Text style={[styles.insightsHeaderTitle, { color: colors.text }]}>
                  Insights
                </Text>
                <Text style={[styles.insightsHeaderCount, { color: colors.textSecondary }]}>
                  ({truScore.insights.length})
                </Text>
              </TouchableOpacity>
              <View style={styles.insightsHeaderRight}>
                <TouchableOpacity
                  onPress={() => handleShare('insights')}
                  style={styles.shareButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="share-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
                <Ionicons
                  name={insightsExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </View>
            </View>
            {insightsExpanded && (
              <InsightsCarousel
                insights={truScore.insights}
                productName={product?.product_name || product?.product_name_en}
              />
            )}
          </View>
        )}

        {/* Values Preferences Card - Link to Values Screen */}
        {(() => {
          // Determine border color based on insights
          // Red if there are negative insights (geopolitical, ethical, environmental concerns)
          const hasNegativeInsights = truScore?.insights && truScore.insights.length > 0 && 
            truScore.insights.some(insight => 
              insight.type === 'geopolitical' || 
              insight.type === 'ethical' || 
              insight.type === 'environmental'
            );
          
          const borderColor = hasNegativeInsights ? '#ff6b6b' : '#16a085';
          
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, borderWidth: 2, borderColor }]}
              onPress={() => navigation.navigate('Values')}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                {/* Top line: Icons */}
                <View style={styles.cardHeaderTop}>
                  <View style={styles.cardHeaderLeft}>
                    <Ionicons name="heart-outline" size={24} color={colors.primary} />
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
                {/* Second line: Heading */}
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Values Preferences
                </Text>
              </View>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                Set preferences for geopolitical, ethical, and environmental insights – These insights do not affect TruScore
              </Text>
              {(() => {
                const activeCount = [
                  valuesPreferences.geopoliticalEnabled,
                  valuesPreferences.ethicalEnabled,
                  valuesPreferences.environmentalEnabled,
                ].filter(Boolean).length;
                if (activeCount > 0) {
                  return (
                    <View style={[styles.activeBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                      <Text style={[styles.activeBadgeText, { color: colors.primary }]}>
                        {activeCount} preference{activeCount !== 1 ? 's' : ''} active
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}
            </TouchableOpacity>
          );
        })()}

        {/* Country of Manufacture */}
        {(() => {
          // Helper function to determine if verify button should be shown
          const shouldShowVerifyButton = () => {
            // Show button if country exists but needs verification
            if (displayManufacturingCountry) {
              // Don't show if from Open Food Facts (always verified)
              if (manufacturingCountry) return false;
              
              // Show if user hasn't submitted yet, OR if submitted but not verified
              if (!hasSubmitted) return true;
              
              // Show if user-contributed but not fully verified
              if (userContributedCountry && userContributedCountry.confidence !== 'verified') {
                return true;
              }
            }
            return false;
          };

          // Helper function to get button text based on status
          const getVerifyButtonText = () => {
            if (!displayManufacturingCountry) {
              return t('manufacturingCountry.contributeTitle', 'Enter Manufacturing Country');
            }
            if (userContributedCountry?.confidence === 'unverified') {
              return t('manufacturingCountry.unverified', 'Help Verify This Country');
            }
            if (userContributedCountry?.confidence === 'disputed') {
              return t('manufacturingCountry.disputed', 'Resolve Dispute - Verify Country');
            }
            return t('manufacturingCountry.reportDifferent', 'Verify or Update Country');
          };

          return (
            <>
              {displayManufacturingCountry ? (
                <>
                  <View style={[styles.card, { 
                    backgroundColor: colors.card, 
                    borderColor: (() => {
                      // Check if user has overridden the default country
                      const hasOverriddenDefault = manufacturingCountry && 
                                                   userContributedCountry?.country && 
                                                   userContributedCountry.country.toUpperCase() !== manufacturingCountry.toUpperCase();
                      
                      if (hasOverriddenDefault) {
                        // User overrode - show status-based border color
                        if ((userContributedCountry.verifiedCount || 0) >= 3) {
                          return '#16a085'; // Green when verified
                        } else if (userContributedCountry.confidence === 'disputed') {
                          return '#ff9800'; // Orange when disputed
                        } else {
                          return '#ffd93d'; // Yellow when in verification
                        }
                      }
                      return '#16a085'; // Green for default or verified
                    })(),
                    borderWidth: 2 
                  }]}>
                  <View style={styles.cardHeader}>
                    {/* Top line: Icons */}
                    <View style={styles.cardHeaderTop}>
                      <View style={styles.cardHeaderLeft}>
                        <Ionicons name="globe-outline" size={24} color={colors.text} />
                      </View>
                      <View style={styles.cardHeaderRight}>
                      <View style={styles.confidenceBadge}>
                      {(() => {
                        // Check if user has overridden the default country
                        const hasOverriddenDefault = manufacturingCountry && 
                                                     userContributedCountry?.country && 
                                                     userContributedCountry.country.toUpperCase() !== manufacturingCountry.toUpperCase();
                        
                        if (hasOverriddenDefault) {
                          // User overrode default - show user-contributed confidence level
                          if (userContributedCountry.confidence === 'verified') {
                            return <Ionicons name="checkmark-circle" size={16} color="#16a085" />;
                          } else if (userContributedCountry.confidence === 'community') {
                            return <Ionicons name="people" size={16} color="#4dd09f" />;
                          } else if (userContributedCountry.confidence === 'unverified') {
                            return <Ionicons name="help-circle" size={16} color="#ffd93d" />;
                          } else if (userContributedCountry.confidence === 'disputed') {
                            return <Ionicons name="warning" size={16} color="#ff9800" />;
                          }
                          return <Ionicons name="help-circle" size={16} color="#ffd93d" />;
                        } else if (manufacturingCountry) {
                          // Open Food Facts data - verified source (no override)
                          return <Ionicons name="checkmark-circle" size={16} color="#16a085" />;
                        } else if (userContributedCountry) {
                          // User-contributed data (no default) - show confidence level
                          if (userContributedCountry.confidence === 'verified') {
                            return <Ionicons name="checkmark-circle" size={16} color="#16a085" />;
                          } else if (userContributedCountry.confidence === 'community') {
                            return <Ionicons name="people" size={16} color="#4dd09f" />;
                          } else if (userContributedCountry.confidence === 'unverified') {
                            return <Ionicons name="help-circle" size={16} color="#ffd93d" />;
                          } else if (userContributedCountry.confidence === 'disputed') {
                            return <Ionicons name="warning" size={16} color="#ff9800" />;
                          }
                          return null;
                        }
                        return null;
                      })()}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleShare('countryOfManufacture')}
                        style={styles.shareButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="share-outline" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {/* Second line: Heading */}
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{t('result.countryOfManufacture', 'Country of Manufacture')}</Text>
                </View>
                  <View style={styles.originContainer}>
                    <CountryFlag country={displayManufacturingCountry} />
                    {(() => {
                      const shouldShow = userContributedCountry?.hasImportedIngredients === true;
                      console.log('[ResultScreen] Badge display check:', {
                        userContributedCountry: userContributedCountry ? 'exists' : 'null',
                        hasImportedIngredients: userContributedCountry?.hasImportedIngredients,
                        shouldShow,
                        displayManufacturingCountry,
                      });
                      return shouldShow ? (
                        <View style={[styles.importedIngredientsBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
                          <Ionicons name="globe" size={16} color={colors.primary} />
                          <Text style={[styles.importedIngredientsText, { color: colors.primary }]}>
                            {t('manufacturingCountry.withImportedIngredients', 'With some imported ingredients')}
                          </Text>
                        </View>
                      ) : null;
                    })()}
                  </View>
                  
                  {/* Community Country Statistics - Show after 3+ submissions */}
                  {communityCountryStats.length >= 3 && (
                    <View style={[styles.communityStatsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.communityStatsHeader}>
                        <Ionicons name="people" size={20} color={colors.primary} />
                        <Text style={[styles.communityStatsTitle, { color: colors.text }]}>
                          {t('manufacturingCountry.communitySelected', 'Community Selected Countries')}
                        </Text>
                      </View>
                      <View style={styles.communityStatsList}>
                        {communityCountryStats.slice(0, 5).map((stat, index) => (
                          <View key={index} style={styles.communityStatItem}>
                            <View style={styles.communityStatLeft}>
                              <View style={[styles.communityStatRank, { backgroundColor: index === 0 ? colors.primary : colors.border }]}>
                                <Text style={[styles.communityStatRankText, { color: index === 0 ? '#fff' : colors.text }]}>
                                  {index + 1}
                                </Text>
                              </View>
                              <Text style={[styles.communityStatCountry, { color: colors.text }]}>
                                {stat.country}
                              </Text>
                            </View>
                            <Text style={[styles.communityStatCount, { color: colors.textSecondary }]}>
                              {stat.count} {stat.count === 1 ? 'user' : 'users'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Validation Status Message and Progress Indicators */}
                  {/* Show validation status when:
                      1. No default country AND user has contributed, OR
                      2. User has overridden default country with a different country */}
                  {((!manufacturingCountry && userContributedCountry) ||
                    (manufacturingCountry && userContributedCountry?.country && 
                     userContributedCountry.country.toUpperCase() !== manufacturingCountry.toUpperCase())) && (
                    <View style={styles.validationStatusContainer}>
                      {/* Always show authentication status until verified by 3 users */}
                      {(userContributedCountry.verifiedCount || 0) >= 3 ? (
                        /* Show authenticated message when verified by 3+ users */
                        <View style={[styles.validationMessageContainer, { backgroundColor: '#16a085' + '20', borderColor: '#16a085', borderWidth: 1 }]}>
                          <Ionicons name="shield-checkmark" size={24} color="#16a085" />
                          <View style={styles.validationMessageContent}>
                            <Text style={[styles.validationMessage, { color: '#16a085', fontWeight: '600' }]}>
                              {t('manufacturingCountry.authenticated', 'Country of origin authenticated by 3 independent users')}
                            </Text>
                            <View style={styles.verificationBadgeContainer}>
                              {[1, 2, 3].map((index) => (
                                <View key={index} style={[styles.verificationBadge, { backgroundColor: '#16a085' }]}>
                                  <Ionicons name="checkmark" size={12} color="#fff" />
                                </View>
                              ))}
                            </View>
                          </View>
                        </View>
                      ) : (
                        <>
                          {/* Show "not authenticated" message until verified by 3 users */}
                          <View style={[
                            styles.validationMessageContainer,
                            {
                              backgroundColor: userContributedCountry.confidence === 'disputed' 
                                ? '#ff9800' + '15' 
                                : '#ffd93d' + '15',
                              borderColor: userContributedCountry.confidence === 'disputed' ? '#ff9800' : '#ffd93d',
                              borderWidth: 1,
                            }
                          ]}>
                            <Ionicons 
                              name={userContributedCountry.confidence === 'disputed' ? "warning" : "shield-outline"} 
                              size={24} 
                              color={userContributedCountry.confidence === 'disputed' ? '#ff9800' : '#ffd93d'} 
                            />
                            <View style={styles.validationMessageContent}>
                              <Text style={[
                                styles.validationMessage,
                                {
                                  color: userContributedCountry.confidence === 'disputed' ? '#ff9800' : colors.text,
                                  fontWeight: '500',
                                }
                              ]}>
                                {t('manufacturingCountry.notAuthenticated', 'The country of origin has not been authenticated yet')}
                              </Text>
                              {userContributedCountry.confidence === 'disputed' && (
                                <Text style={[styles.disputedNote, { color: '#ff9800' }]}>
                                  {t('manufacturingCountry.disputedNote', 'Conflicting submissions detected')}
                                </Text>
                              )}
                            </View>
                          </View>
                          
                          {/* Visual validation progress indicators showing degree of validation */}
                          <View style={styles.validationProgressContainer}>
                            <Text style={[styles.validationProgressLabel, { color: colors.textSecondary, marginBottom: 12 }]}>
                              {t('manufacturingCountry.communityVerification', 'Community Verification Progress')}:
                            </Text>
                            
                            {/* Visual validation icons with better design */}
                            <View style={styles.validationIconsContainer}>
                              {[1, 2, 3].map((index) => {
                                const verifiedCount = userContributedCountry.verifiedCount || 0;
                                const isFilled = verifiedCount >= index;
                                const isActive = verifiedCount === index && index < 3; // Highlight current progress
                                
                                // Determine icon and color based on validation level
                                let iconName: keyof typeof Ionicons.glyphMap = "person-outline";
                                let iconColor = '#d0d0d0';
                                let backgroundColor = colors.background;
                                
                                if (isFilled) {
                                  iconName = "person";
                                  if (verifiedCount >= 3) {
                                    iconColor = '#16a085'; // Green when fully verified
                                    backgroundColor = '#16a085' + '20';
                                  } else {
                                    iconColor = '#4dd09f'; // Light green for partial
                                    backgroundColor = '#4dd09f' + '20';
                                  }
                                } else if (isActive && index === verifiedCount + 1) {
                                  iconColor = '#ffd93d'; // Yellow for next needed
                                  backgroundColor = '#ffd93d' + '15';
                                }
                                
                                return (
                                  <View 
                                    key={index}
                                    style={[
                                      styles.validationIcon,
                                      { 
                                        backgroundColor,
                                        borderColor: iconColor,
                                        borderWidth: isFilled || isActive ? 2 : 1,
                                      }
                                    ]}
                                  >
                                    <Ionicons 
                                      name={iconName} 
                                      size={20} 
                                      color={iconColor} 
                                    />
                                    {isFilled && (
                                      <View style={[styles.checkmarkBadge, { backgroundColor: iconColor }]}>
                                        <Ionicons name="checkmark" size={10} color="#fff" />
                                      </View>
                                    )}
                                  </View>
                                );
                              })}
                            </View>
                            
                            {/* Progress text with clear status */}
                            <View style={styles.validationProgressTextContainer}>
                              <Text style={[styles.validationProgressText, { color: colors.text, fontWeight: '600' }]}>
                                {t('manufacturingCountry.communityVerificationInProgress', 'COMMUNITY VERIFICATION IN PROGRESS...')}
                              </Text>
                            </View>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                
                  {/* ALWAYS show "Update Country" button - moved inside card at bottom */}
                <TouchableOpacity
                    style={[styles.updateCountryButton, { backgroundColor: colors.primary, marginTop: 16 }]}
                  onPress={() => setManufacturingCountryModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={18} color="#fff" />
                  <Text style={styles.updateCountryButtonText}>
                    {t('manufacturingCountry.updateCountry', 'Update Country')}
                  </Text>
                </TouchableOpacity>
                </View>
              </>
              ) : (
                <TouchableOpacity
                  style={[styles.card, { backgroundColor: colors.card, borderWidth: 2, borderColor: '#ff6b6b' }]}
                  onPress={() => setManufacturingCountryModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeaderLeft}>
                    <Ionicons name="globe-outline" size={24} color={colors.text} />
                    <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
                      {t('result.countryOfManufacture', 'Country of Manufacture')}
                    </Text>
                  </View>
                  <View style={styles.contributeContainer}>
                    <Text style={[styles.countryNotDisclosedTitle, { color: '#d32f2f', marginTop: 0 }]}>
                      {t('manufacturingCountry.notDisclosed', 'Country of manufacture is not disclosed by the brand!')}
                    </Text>
                    <View>
                      <Text style={[styles.countryNotDisclosedSubtitle, { color: '#16a085' }]}>
                        {t('manufacturingCountry.contributeDescriptionLine1', 'Is it on the packaging?')}
                      </Text>
                      <Text style={[styles.countryNotDisclosedSubtitle, { color: '#16a085' }]}>
                        {t('manufacturingCountry.contributeDescriptionLine2', 'Click here to add ...')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </>
          );
        })()}

        {/* Sustainability Card - Only display if Eco-Score data is available */}
        {calculatedEcoScore && calculatedEcoScore.score !== undefined && calculatedEcoScore.score > 0 && (() => {
          // Calculate grade from score if missing
          const grade = calculatedEcoScore.grade || 
            (calculatedEcoScore.score >= 80 ? 'a' :
             calculatedEcoScore.score >= 70 ? 'b' :
             calculatedEcoScore.score >= 55 ? 'c' :
             calculatedEcoScore.score >= 40 ? 'd' : 'e');
          
          // Get border color matching grade
          const gradeColors: Record<string, string> = {
            a: '#16a085', // Green
            b: '#4dd09f', // Light green
            c: '#ffd93d', // Yellow
            d: '#ff9800', // Orange
            e: '#ff6b6b', // Red
          };
          const borderColor = gradeColors[grade] || '#95a5a6';
          
          return (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderWidth: 2, borderColor }]}
            onPress={() => setEcoScoreModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.ecoScoreHeader}>
              <View style={styles.ecoScoreHeaderLeft}>
                <Ionicons name="leaf" size={24} color={colors.primary} />
                <Text style={[styles.ecoScoreTitle, { color: colors.text, marginLeft: 8 }]}>
                  {t('result.ecoScore', 'Eco-Score')}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setEcoScoreModalVisible(true);
                  }}
                  style={styles.infoButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.cardHeaderRight}>
                <TouchableOpacity
                  onPress={() => handleShare('ecoscore')}
                  style={styles.shareButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="share-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.ecoScoreContent}>
              <EcoScore ecoScore={calculatedEcoScore} />
            </View>
          </TouchableOpacity>
          );
        })(        )}

        {/* Palm Oil Analysis */}
        {product.palm_oil_analysis && (() => {
          // Use shared utility function to ensure consistency with modal
          const palmOilStatus = getPalmOilStatus(product.palm_oil_analysis);
          if (!palmOilStatus) return null;
          
          const { flag, isPalmOilFree, containsPalmOil, isNonSustainable, isUnknown } = palmOilStatus;
          const palmOilFlagColor = getPalmOilFlagColor(flag);
          return (
            <TouchableOpacity
              style={[
                styles.card, 
                { 
                  backgroundColor: colors.card,
                  borderWidth: 2,
                  borderColor: palmOilFlagColor,
                  marginBottom: 16
                }
              ]}
              onPress={() => setPalmOilInfoModalVisible(true)}
              activeOpacity={0.7}
            >
            <View style={styles.cardHeader}>
              {/* Top line: Icons */}
              <View style={styles.cardHeaderTop}>
                <View style={styles.cardHeaderLeft}>
                  <Ionicons 
                    name="flag" 
                    size={24} 
                    color={palmOilFlagColor} 
                  />
                </View>
                <View style={styles.cardHeaderRight}>
                  <TouchableOpacity
                    onPress={() => handleShare('palmOil')}
                    style={styles.shareButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="share-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              {/* Second line: Heading */}
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('result.palmOil')}
              </Text>
            </View>
            <View style={styles.palmOilContent}>
              {isPalmOilFree ? (
                <View style={[styles.palmOilStatus, { backgroundColor: palmOilFlagColor + '20', borderLeftWidth: 4, borderLeftColor: palmOilFlagColor }]}>
                  <Text style={[styles.palmOilFlag, { color: palmOilFlagColor }]}>🟢</Text>
                  <Text style={[styles.palmOilText, { color: colors.text }]}>
                    {t('result.greenFlag')} - {t('result.palmOilFree')}
                  </Text>
                </View>
              ) : isNonSustainable ? (
                <View style={[styles.palmOilStatus, { backgroundColor: palmOilFlagColor + '20', borderLeftWidth: 4, borderLeftColor: palmOilFlagColor }]}>
                  <Text style={[styles.palmOilFlag, { color: palmOilFlagColor }]}>🔴</Text>
                  <Text style={[styles.palmOilText, { color: colors.text }]}>
                    {t('result.redFlag')} - {t('result.nonSustainablePalmOil')}
                  </Text>
                </View>
              ) : containsPalmOil ? (
                <View style={[styles.palmOilStatus, { backgroundColor: palmOilFlagColor + '20', borderLeftWidth: 4, borderLeftColor: palmOilFlagColor }]}>
                  <Text style={[styles.palmOilFlag, { color: palmOilFlagColor }]}>🟠</Text>
                  <Text style={[styles.palmOilText, { color: colors.text }]}>
                    {t('result.orangeFlag')} - {t('result.containsPalmOil')}
                  </Text>
                  {product.palm_oil_analysis?.detectedFromIngredientsText && (
                    <Text style={[styles.palmOilNote, { color: colors.textSecondary }]}>
                      {t('result.detectedFromIngredients', 'Detected from ingredients list')}
                    </Text>
                  )}
                </View>
              ) : isUnknown ? (
                <View style={[styles.palmOilStatus, { backgroundColor: palmOilFlagColor + '20', borderLeftWidth: 4, borderLeftColor: palmOilFlagColor }]}>
                  <Text style={[styles.palmOilFlag, { color: palmOilFlagColor }]}>🟢</Text>
                  <Text style={[styles.palmOilText, { color: colors.text }]}>
                    {t('result.palmOilUnknown', 'Palm Oil Status Unknown')}
                  </Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
          );
        })()}

        {/* Packaging Sustainability */}
        {product.packaging_data && product.packaging_data.items.length > 0 && (() => {
          // Determine border color based on local recycling requirements
          // Check if packaging meets local recycling laws (country-specific)
          const meetsLocalRequirements = meetsLocalRecyclingRequirements(
            product.packaging_data.items
          );
          
          // Green if recyclable according to local laws, Red if not recyclable
          const packagingBorderColor = meetsLocalRequirements
            ? '#16a085' // Green: Meets local recycling requirements
            : '#ff6b6b'; // Red: Does not meet local recycling requirements
          
          return (
            <TouchableOpacity 
              style={[
                styles.card, 
                { 
                  backgroundColor: colors.card,
                  borderWidth: 2,
                  borderColor: packagingBorderColor,
                  marginTop: 16,
                  marginBottom: 16,
                }
              ]}
              onPress={() => setPackagingInfoModalVisible(true)}
              activeOpacity={0.7}
            >
            <View style={styles.cardHeader}>
              {/* Top line: Icons */}
              <View style={styles.cardHeaderTop}>
                <View style={styles.cardHeaderLeft}>
                  <Ionicons name="cube-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.cardHeaderRight}>
                  <TouchableOpacity
                    onPress={handleEditProduct}
                    style={styles.shareButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="create-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </View>
              {/* Second line: Heading */}
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('result.packaging')}
              </Text>
            </View>
            <View style={styles.packagingContent}>
              <View style={styles.packagingStatusRow}>
                {product.packaging_data.isRecyclable && (
                  <View style={[styles.packagingBadge, { backgroundColor: '#16a085' + '20' }]}>
                    <Ionicons name="reload-circle" size={16} color="#16a085" />
                    <Text style={[styles.packagingBadgeText, { color: colors.text }]}>
                      {t('result.recyclable')}
                    </Text>
                  </View>
                )}
                {product.packaging_data.isReusable && (
                  <View style={[styles.packagingBadge, { backgroundColor: '#4dd09f' + '20' }]}>
                    <Ionicons name="refresh-circle" size={16} color="#4dd09f" />
                    <Text style={[styles.packagingBadgeText, { color: colors.text }]}>
                      {t('result.reusable')}
                    </Text>
                  </View>
                )}
                {product.packaging_data.isBiodegradable && (
                  <View style={[styles.packagingBadge, { backgroundColor: '#16a085' + '20' }]}>
                    <Ionicons name="leaf" size={16} color="#16a085" />
                    <Text style={[styles.packagingBadgeText, { color: colors.text }]}>
                      {t('result.biodegradable')}
                    </Text>
                  </View>
                )}
              </View>
              {product.packaging_data.recyclabilityScore > 0 && (
                <View style={styles.recyclabilityScore}>
                  <Text style={[styles.recyclabilityLabel, { color: colors.textSecondary }]}>
                    {t('result.recyclabilityScore')}:
                  </Text>
                  <Text style={[styles.recyclabilityValue, { color: colors.primary }]}>
                    {product.packaging_data.recyclabilityScore}/100
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          );
        })()}

        {/* Ethics / Certifications */}
        {product.certifications && product.certifications.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              {/* Top line: Icons */}
              <View style={styles.cardHeaderTop}>
                <View style={styles.cardHeaderLeft}>
                  <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
                </View>
              </View>
              {/* Second line: Heading */}
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('result.certifications')}</Text>
            </View>
            <View style={styles.certificationsContainer}>
              {product.certifications.map((cert) => (
                <CertBadge key={cert.id} certification={cert} />
              ))}
            </View>
          </View>
        )}

        {/* Price Information */}
        <UniversalPricingCard 
          barcode={barcode} 
          productName={product?.product_name || product?.product_name_en || undefined}
          product={product}
        />

        {/* Nutrition Facts */}
        <NutritionTable
          nutriments={product.nutriments}
          nutrientLevels={product.nutrient_levels}
          servingSize={product.serving_size}
          onShare={() => handleShare('nutrition')}
          onEdit={handleEditProduct}
        />

        {/* Ingredients */}
        {product.ingredients_text && (() => {
          // Filter out barcode patterns (8-14 digits) from ingredients_text
          let ingredientsText = product.ingredients_text.trim();
          
          // Check if entire text is just a barcode pattern
          const isBarcodePattern = /^\d{8,14}$/.test(ingredientsText.replace(/\s/g, ''));
          if (isBarcodePattern) {
            return null; // Don't display barcode as ingredients
          }
          
          // CRITICAL: Strip HTML tags from ingredients_text (e.g., <span class="allergen">)
          // This handles cases where ingredients contain HTML markup
          ingredientsText = ingredientsText.replace(/<[^>]*>/g, '').trim();
          
          // CRITICAL: Remove barcode from ingredients text if it appears within the text
          // This handles cases where barcode is embedded in ingredients_text
          const barcodePattern = new RegExp(`\\b${barcode}\\b`, 'gi');
          ingredientsText = ingredientsText.replace(barcodePattern, '').trim();
          
          // Also remove any standalone 8-14 digit sequences that might be barcodes
          ingredientsText = ingredientsText.replace(/\b\d{8,14}\b/g, '').trim();
          
          // Clean up extra spaces and commas
          ingredientsText = ingredientsText.replace(/[,\s]+/g, ' ').trim();
          
          // If after filtering, we have no meaningful content, don't display
          if (!ingredientsText || ingredientsText.length < 3) {
            return null;
          }
          
          // Determine border color based on negative indicators
          // Red if: many additives, hidden ingredients, ultra-processed (NOVA 4)
          const hasManyAdditives = product.additives_tags && product.additives_tags.length > 5;
          const hiddenTerms = ['parfum', 'fragrance', 'aroma', 'natural flavor', 'proprietary blend'];
          const hasHiddenIngredients = hiddenTerms.some(term => 
            ingredientsText.toLowerCase().includes(term)
          );
          const isUltraProcessed = product.nova_group === 4;
          
          const hasNegativeIndicators = hasManyAdditives || hasHiddenIngredients || isUltraProcessed;
          const borderColor = hasNegativeIndicators ? '#ff6b6b' : '#16a085';
          
          return (
            <View style={[styles.card, { backgroundColor: colors.card, borderWidth: 2, borderColor }]}>
              <View style={styles.cardHeader}>
                {/* Top line: Icons */}
                <View style={styles.cardHeaderTop}>
                  <View style={styles.cardHeaderLeft}>
                    <Ionicons name="flask" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <TouchableOpacity
                      onPress={handleEditProduct}
                      style={styles.shareButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleShare('ingredients')}
                      style={styles.shareButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="share-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Second line: Heading */}
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('result.ingredients')}</Text>
              </View>
              <Text style={[styles.ingredientsText, { color: colors.text }]}>{ingredientsText}</Text>
            {product.nova_group && (() => {
              // Determine color based on NOVA score
              const novaColor = product.nova_group === 1 || product.nova_group === 2
                ? '#16a085'  // Green for NOVA 1 or 2
                : product.nova_group === 3
                ? '#ff9500'  // Orange for NOVA 3
                : '#ff6b6b'; // Red for NOVA 4
              
              return (
                <View style={[styles.novaContainer, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.novaHeader}
                    onPress={() => setProcessingLevelModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.novaLabel, { color: colors.text }]}>{t('result.processingLevel')}:</Text>
                    <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <View style={styles.novaContent}>
                    <Text style={[styles.novaValue, { color: novaColor }]}>
                      NOVA {product.nova_group} ({t(`nova.${product.nova_group}`)})
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleShare('processing')}
                      style={styles.shareButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="share-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })()}
          </View>
          );
        })()}

        {/* Allergens & Additives - Premium Feature */}
        {(product.allergens_tags || product.additives_tags) && (
          <PremiumGate feature={PremiumFeature.ALLERGENS_ADDITIVES}>
            {(() => {
              const hasAllergens = product.allergens_tags && product.allergens_tags.length > 0;
              const hasAdditives = product.additives_tags && product.additives_tags.length > 0;
              const hasDetected = hasAllergens || hasAdditives;
              const redColor = '#ff6b6b';
              
              return (
                <TouchableOpacity
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderWidth: hasDetected ? 2 : 0,
                      borderColor: hasDetected ? redColor : 'transparent',
                    }
                  ]}
                  onPress={() => {
                    // Check premium status before opening modal
                    if (isPremiumFeatureEnabled(PremiumFeature.ALLERGENS_ADDITIVES, subscriptionInfo)) {
                      setAllergensAdditivesModalVisible(true);
                    } else {
                      navigation.navigate('Subscription');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    {/* Top line: Icons */}
                    <View style={styles.cardHeaderTop}>
                      <View style={styles.cardHeaderLeft}>
                        <Ionicons name="warning" size={24} color={hasDetected ? redColor : colors.primary} />
                      </View>
                      <View style={styles.cardHeaderRight}>
                        <TouchableOpacity
                          onPress={handleEditProduct}
                          style={styles.shareButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="create-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleShare('allergens')}
                          style={styles.shareButton}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="share-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                        <Ionicons name="information-circle-outline" size={20} color={hasDetected ? redColor : colors.primary} />
                      </View>
                    </View>
                    {/* Second line: Heading */}
                    <Text style={[styles.cardTitle, { color: colors.text, marginTop: 8 }]}>{t('result.allergensAdditives')}</Text>
                  </View>
                {product.allergens_tags && product.allergens_tags.length > 0 && (
                  <View style={[styles.warningSection, { backgroundColor: colors.error + '20' }]}>
                    <Ionicons name="warning" size={20} color={colors.error} />
                    <Text style={[styles.warningTitle, { color: colors.error }]}>{t('result.containsAllergens')}</Text>
                    <Text style={[styles.warningText, { color: colors.error }]}>
                      {product.allergens_tags
                        .map((tag) => tag.replace(/^en:/, '').replace(/-/g, ' '))
                        .join(', ')}
                    </Text>
                  </View>
                )}
                {product.additives_tags && product.additives_tags.length > 0 && (
                  <View style={styles.additivesSection}>
                    <Text style={[styles.additivesLabel, { color: colors.text }]}>
                      {t('result.additives')} ({product.additives_tags.length}):
                    </Text>
                    <Text style={[styles.additivesText, { color: colors.textSecondary }]}>
                      {product.additives_tags
                        .map((tag) => tag.replace(/^en:/, '').toUpperCase())
                        .join(', ')}
                    </Text>
                  </View>
                )}
                </TouchableOpacity>
              );
            })()}
          </PremiumGate>
        )}

        {/* Additives Risk Card - IARC & EWG Risks */}
        <AdditivesRiskCard
          product={product}
          onPress={() => {
            // Could open a detailed modal in the future
            console.log('Additives Risk card pressed');
          }}
        />

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>


      {/* TruScore Info Modal - Only show if we have data */}
      {product && product.trust_score !== null && product.trust_score_breakdown && (
        <TruScoreInfoModal
          visible={truScoreModalVisible}
          onClose={() => setTruScoreModalVisible(false)}
          product={product}
        />
      )}

      {/* TruScore Analysis Modal - Pillar breakdown & data source trace */}
      <TruScoreAnalysisModal
        visible={truScoreAnalysisModalVisible}
        onClose={() => setTruScoreAnalysisModalVisible(false)}
        analysis={product?._truscore_analysis}
      />

      {/* Eco-Score Info Modal */}
      <EcoScoreInfoModal
        visible={ecoScoreModalVisible}
        onClose={() => setEcoScoreModalVisible(false)}
      />

      {/* Allergens & Additives Modal - Premium Feature */}
      {isPremiumFeatureEnabled(PremiumFeature.ALLERGENS_ADDITIVES, subscriptionInfo) && (
        <AllergensAdditivesModal
          visible={allergensAdditivesModalVisible}
          onClose={() => setAllergensAdditivesModalVisible(false)}
          product={product}
        />
      )}

      {/* Processing Level Modal */}
      <ProcessingLevelModal
        visible={processingLevelModalVisible}
        onClose={() => setProcessingLevelModalVisible(false)}
        novaGroup={product?.nova_group}
      />

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        visible={cameraModalVisible}
        onClose={() => setCameraModalVisible(false)}
        onCapture={handleCaptureImage}
        barcode={barcode}
      />

      {/* Manufacturing Country Contribution Modal */}
      <ManufacturingCountryModal
        visible={manufacturingCountryModalVisible}
        onClose={() => {
          // Only close if modal is actually visible (prevent rapid state changes)
          if (manufacturingCountryModalVisible) {
            setManufacturingCountryModalVisible(false);
          }
        }}
        onSubmit={async (country: string, hasImportedIngredients?: boolean) => {
          const result = await submitManufacturingCountry(barcode, country, undefined, hasImportedIngredients);
          if (result.success) {
            // Check if this is a repeat submission
            if (result.alreadySubmitted) {
              // Show friendly message for repeat submissions
              Alert.alert(
                'Thank You!',
                result.message || 'Thank you for your previous submission, we can only allow one submission from each user.',
                [{ text: t('common.ok') || 'OK' }]
              );
              // Close modal after showing message
              setManufacturingCountryModalVisible(false);
            } else {
              // New submission - show success message
              Alert.alert(
                'Thank You!',
                "Thank you for submitting the 'country of manufacture' information, this helps us spread the word to keep everyone informed.",
                [{ text: t('common.ok') || 'OK' }]
              );
              // Refresh user-contributed country and community stats
              // Add a small delay to ensure data is saved before reloading
              await new Promise(resolve => setTimeout(resolve, 100));
              const offCountry = extractManufacturingCountry(product);
              const contributed = await getManufacturingCountry(barcode);
              
              console.log('[ResultScreen] Reloaded country data after submission:', {
                offCountry,
                contributedCountry: contributed.country,
                hasImportedIngredients: contributed.hasImportedIngredients,
              });
              
              if (!offCountry) {
                // No Open Food Facts country - use user-contributed data if available
                if (contributed.country) {
                  setUserContributedCountry({
                    country: contributed.country,
                    confidence: contributed.confidence as 'verified' | 'community' | 'unverified' | 'disputed',
                    verifiedCount: contributed.verifiedCount || 0,
                    hasImportedIngredients: contributed.hasImportedIngredients || false,
                  });
                } else {
                  setUserContributedCountry(null);
                }
              } else {
                // We have Open Food Facts country - check if user has overridden it
                if (contributed.country && contributed.country.toUpperCase() !== offCountry.toUpperCase()) {
                  // User has submitted a different country than default - prioritize user's country
                  setUserContributedCountry({
                    country: contributed.country,
                    confidence: contributed.confidence as 'verified' | 'community' | 'unverified' | 'disputed',
                    verifiedCount: contributed.verifiedCount || 0,
                    hasImportedIngredients: contributed.hasImportedIngredients || false,
                  });
                  
                  // Get community country statistics
                  const { getCommunityCountryStats } = await import('../../src/services/manufacturingCountryService');
                  const stats = await getCommunityCountryStats(barcode);
                  setCommunityCountryStats(stats);
                } else if (contributed.hasImportedIngredients) {
                  // Same country as default, but has imported ingredients flag
                  setUserContributedCountry({
                    country: '', // Empty since we use Open Food Facts country
                    confidence: 'verified' as const,
                    verifiedCount: 0,
                    hasImportedIngredients: true,
                  });
                } else {
                  setUserContributedCountry(null);
                }
              }
              
              // Refresh community country statistics
              const { getCommunityCountryStats } = await import('../../src/services/manufacturingCountryService');
              const stats = await getCommunityCountryStats(barcode);
              setCommunityCountryStats(stats);
              
              setHasSubmitted(true);
              // Close modal after successful submission
              setManufacturingCountryModalVisible(false);
              // Refresh product to show new country
              await loadProduct();
            }
          } else {
            throw new Error(result.message);
          }
        }}
        barcode={barcode}
        productName={product?.product_name}
      />

      {/* Recall Alert Modal */}
      {product && product.recalls && product.recalls.length > 0 && (
        <RecallAlertModal
          visible={recallAlertModalVisible}
          onClose={() => setRecallAlertModalVisible(false)}
          recalls={product.recalls}
        />
      )}

      {/* Palm Oil Info Modal */}
      {product && product.palm_oil_analysis && (
        <PalmOilInfoModal
          visible={palmOilInfoModalVisible}
          onClose={() => setPalmOilInfoModalVisible(false)}
          product={product}
        />
      )}

      {/* Packaging Info Modal */}
      {product && product.packaging_data && (
        <PackagingInfoModal
          visible={packagingInfoModalVisible}
          onClose={() => setPackagingInfoModalVisible(false)}
          product={product}
        />
      )}

      {/* Manual Product Entry Modal */}
      <ManualProductEntryModal
        visible={manualProductModalVisible}
        onClose={() => {
          setManualProductModalVisible(false);
          setEditProductData(null);
          setEditMode(false);
        }}
        onSave={handleManualProductSave}
        barcode={barcode}
        initialProduct={editProductData}
        editMode={editMode}
      />

      {/* Share Modal */}
      {product && (
        <ShareModal
          visible={shareModalVisible}
          onClose={() => setShareModalVisible(false)}
          product={product}
          truScore={truScore || undefined}
          shareType={shareType}
          country={shareType === 'countryOfManufacture' ? (displayManufacturingCountry || userContributedCountry?.country || undefined) : undefined}
        />
      )}
    </SafeAreaView>
  );
}

// Export with Error Boundary wrapper
export default function ResultScreen() {
  return (
    <ErrorBoundary feature="ResultScreen">
      <ResultScreenContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  unknownProductContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 32,
  },
  unknownProductContent: {
    alignItems: 'center',
    width: '100%',
  },
  primaryActionButton: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    gap: 8,
  },
  primaryActionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  primaryActionButtonSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    textAlign: 'center',
  },
  secondaryActionButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 24,
  },
  secondaryActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  helpSection: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  barcodeText: {
    fontSize: 14,
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scanAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 16,
    marginHorizontal: 16,
    gap: 8,
  },
  scanAnotherButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginHorizontal: 16,
  },
  shareButtonHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    gap: 8,
  },
  shareButtonHeroText: {
    fontSize: 16,
    fontWeight: '600',
  },
  updateCountryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    marginHorizontal: 16,
    gap: 8,
  },
  updateCountryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  communityStatsContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
  },
  communityStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  communityStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  communityStatsList: {
    gap: 8,
  },
  communityStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  communityStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  communityStatRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityStatRankText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  communityStatCountry: {
    fontSize: 15,
    fontWeight: '500',
  },
  communityStatCount: {
    fontSize: 14,
  },
  hero: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
  },
  productImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  placeholderImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  captureImageText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  productNameContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  confidenceBadgeContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  analysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  analysisButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  userContributedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    marginTop: 4,
  },
  userContributedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  brand: {
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  infoButton: {
    padding: 4,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  shareButton: {
    padding: 4,
  },
  ecoScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  ecoScoreHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ecoScoreTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  ecoScoreContent: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ecoScorePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  ecoScorePlaceholderText: {
    fontSize: 14,
    textAlign: 'center',
  },
  infoButtonAbsolute: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  trustScoreContainer: {
    width: '100%',
    marginVertical: 16,
    paddingVertical: 8,
  },
  quadrantContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -50,
    marginLeft: -50,
    zIndex: 10,
  },
  centerScoreContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerScoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 36,
  },
  centerScoreDenominator: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
    marginTop: 2,
    lineHeight: 14,
  },
  scoreLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: 60,
    marginLeft: -40,
    width: 80,
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
    textAlign: 'center',
    zIndex: 10,
  },
  dividerVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 5,
  },
  dashSegmentVertical: {
    width: 1,
    height: 8,
    backgroundColor: '#d0d0d0',
    marginVertical: 4,
  },
  dividerHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  dashSegmentHorizontal: {
    width: 8,
    height: 1,
    backgroundColor: '#d0d0d0',
    marginHorizontal: 4,
  },
  quadrant: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  quadrantTopLeft: {
    top: 0,
    left: 0,
    paddingRight: 60,
    paddingBottom: 60,
  },
  quadrantTopRight: {
    top: 0,
    right: 0,
    paddingLeft: 60,
    paddingBottom: 60,
  },
  quadrantBottomLeft: {
    bottom: 0,
    left: 0,
    paddingRight: 60,
    paddingTop: 60,
  },
  quadrantBottomRight: {
    bottom: 0,
    right: 0,
    paddingLeft: 60,
    paddingTop: 60,
  },
  quadrantIcon: {
    marginBottom: 4,
  },
  quadrantLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quadrantValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  quadrantValue: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  },
  quadrantValueDenominator: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.6,
    marginLeft: 1,
    lineHeight: 10,
  },
  dimensionItem: {
    flex: 1,
    minWidth: '18%',
    maxWidth: '20%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  dimensionIcon: {
    marginBottom: 6,
  },
  dimensionLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dimensionValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  dimensionWeight: {
    fontSize: 8,
    fontWeight: '500',
    marginTop: 2,
  },
  breakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    marginBottom: 16,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  reasonsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reasonsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  reasonsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  flagsSection: {
    marginBottom: 12,
  },
  flagsSectionWithMargin: {
    marginTop: 16,
  },
  flagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  flagsSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  flagIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  flagContent: {
    flex: 1,
  },
  flagTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  flagDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Keep old styles for backward compatibility
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  originContainer: {
    marginTop: 12,
    gap: 8,
    alignItems: 'center',
  },
  importedIngredientsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  importedIngredientsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  validationStatusContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  validationMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  validationMessageContent: {
    flex: 1,
  },
  validationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  disputedNote: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  validationProgressContainer: {
    gap: 12,
  },
  validationProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  validationIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 8,
  },
  validationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  validationProgressTextContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  validationProgressText: {
    fontSize: 13,
  },
  validationRemainingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  verificationBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  verificationBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryInfo: {
    marginTop: 4,
  },
  sourceText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
    marginLeft: 8,
  },
  contributeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 12,
    minHeight: 120,
  },
  contributeTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  contributeDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 16,
    color: '#4dd09f',
    fontWeight: '500',
    marginBottom: 12,
  },
  countryNotDisclosedTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    lineHeight: 22,
  },
  countryNotDisclosedSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginTop: 8,
    marginHorizontal: 16,
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  ingredientsText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  novaContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  novaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  novaContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  novaLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  novaValue: {
    fontSize: 14,
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    flex: 1,
  },
  transparencyWarning: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  additivesSection: {
    marginTop: 12,
  },
  additivesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  additivesText: {
    fontSize: 12,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 32,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  insightsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightsHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  insightsHeaderCount: {
    fontSize: 14,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  insufficientDataText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  palmOilContent: {
    marginTop: 12,
  },
  palmOilStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  palmOilFlag: {
    fontSize: 18,
  },
  palmOilText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  palmOilNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  packagingContent: {
    marginTop: 12,
  },
  packagingStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  packagingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  packagingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recyclabilityScore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  recyclabilityLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  recyclabilityValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  disclaimerIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  disclaimerTextContainer: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
  },
  dataLimitationsBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dataLimitationsIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  dataLimitationsText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  recallAlertBanner: {
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  recallBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recallBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  recallBannerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recallBannerText: {
    flex: 1,
  },
  recallBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recallBannerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
