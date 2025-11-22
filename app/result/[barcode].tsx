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
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../_layout';
import { fetchProduct, refreshProduct } from '../../src/services/productService';
import { ProductWithTrustScore } from '../../src/types/product';
import { useScanStore } from '../../src/store/useScanStore';
import { useFavoritesStore } from '../../src/store/useFavoritesStore';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrustScore from '../../src/components/TrustScore';
import TruScore from '../../src/components/TruScore';
import CountryFlag from '../../src/components/CountryFlag';
import CertBadge from '../../src/components/CertBadge';
import EcoScore from '../../src/components/EcoScore';
import NutritionTable from '../../src/components/NutritionTable';
import { calculateTruScore, TruScoreResult } from '../../src/lib/truscoreEngine';
import { useValuesStore } from '../../src/store/useValuesStore';
import InsightsCarousel from '../../src/components/InsightsCarousel';
import ShareValuesCard from '../../src/features/values/ShareValuesCard';
import TrustScoreInfoModal from '../../src/components/TrustScoreInfoModal';
import EcoScoreInfoModal from '../../src/components/EcoScoreInfoModal';
import AllergensAdditivesModal from '../../src/components/AllergensAdditivesModal';
import ProcessingLevelModal from '../../src/components/ProcessingLevelModal';
import CameraCaptureModal from '../../src/components/CameraCaptureModal';
import { extractManufacturingCountry, calculateEcoScore } from '../../src/services/openFoodFacts';
import { generateProductFlags } from '../../src/utils/productFlags';
import { generateBarcodeShareUrl, generateBarcodeDeepLink } from '../../src/utils/linking';
import { isWebSearchFallback } from '../../src/services/webSearchFallback';
import { useTheme } from '../../src/theme';
import * as Linking from 'expo-linking';
import { submitManufacturingCountry, getManufacturingCountry, hasUserSubmitted } from '../../src/services/manufacturingCountryService';
import ManufacturingCountryModal from '../../src/components/ManufacturingCountryModal';
import RecallAlertModal from '../../src/components/RecallAlertModal';
import PalmOilInfoModal from '../../src/components/PalmOilInfoModal';
import ErrorBoundary from '../../src/components/ErrorBoundary';
import ManualProductEntryModal from '../../src/components/ManualProductEntryModal';
import { saveManualProduct, ManualProductData, getManualProduct, isManualProduct } from '../../src/services/manualProductService';

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

  // Helper function to get Trust Score color
  const getTrustScoreColor = (score: number | null) => {
    if (score === null) return '#95a5a6'; // Gray for insufficient data
    if (score >= 80) return '#16a085'; // Green (excellent)
    if (score >= 60) return '#4dd09f'; // Light green (good)
    if (score >= 40) return '#ffd93d'; // Yellow (fair)
    return '#ff6b6b'; // Red (poor)
  };

  // Helper function to get Trust Score label
  const getTrustScoreLabel = (score: number | null) => {
    if (score === null) return t('trust.insufficientData');
    if (score >= 80) return t('trust.excellent');
    if (score >= 60) return t('trust.good');
    if (score >= 40) return t('trust.fair');
    return t('trust.poor');
  };

  const [product, setProduct] = useState<ProductWithTrustScore | null>(null);
  const [truScore, setTruScore] = useState<TruScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trustScoreModalVisible, setTrustScoreModalVisible] = useState(false);
  const [ecoScoreModalVisible, setEcoScoreModalVisible] = useState(false);
  const [allergensAdditivesModalVisible, setAllergensAdditivesModalVisible] = useState(false);
  const [processingLevelModalVisible, setProcessingLevelModalVisible] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [manufacturingCountryModalVisible, setManufacturingCountryModalVisible] = useState(false);
  const [recallAlertModalVisible, setRecallAlertModalVisible] = useState(false);
  const [palmOilInfoModalVisible, setPalmOilInfoModalVisible] = useState(false);
  const [manualProductModalVisible, setManualProductModalVisible] = useState(false);
  const [userContributedCountry, setUserContributedCountry] = useState<{ country: string; confidence: string; verifiedCount: number } | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isUserContributed, setIsUserContributed] = useState(false);
  const [insightsExpanded, setInsightsExpanded] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [barcode, isPremium, isOffline]);

  // Check for user-contributed manufacturing country (must be before early returns)
  useEffect(() => {
    const checkUserContributedCountry = async () => {
      if (product) {
        const offCountry = extractManufacturingCountry(product);
        if (!offCountry) {
          // Only check user contributions if we don't have manufacturing country from Open Food Facts
          const contributed = await getManufacturingCountry(barcode);
          if (contributed.country) {
            setUserContributedCountry({
              country: contributed.country,
              confidence: contributed.confidence as 'verified' | 'community' | 'unverified' | 'disputed',
              verifiedCount: contributed.verifiedCount || 0,
            });
          } else {
            setUserContributedCountry(null);
          }

          // Check if current user has already submitted
          const userHasSubmitted = await hasUserSubmitted(barcode);
          setHasSubmitted(userHasSubmitted);
        } else {
          // We have Open Food Facts data, clear user contributions
          setUserContributedCountry(null);
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
        const isManual = await isManualProduct(barcode);
        setIsUserContributed(isManual);
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

  // Calculate TruScore when product data is available
  useEffect(() => {
    if (product) {
      try {
        // Get current preferences for insights generation
        const prefs = {
          israelPalestine: valuesPreferences.israelPalestine,
          indiaChina: valuesPreferences.indiaChina,
          avoidAnimalTesting: valuesPreferences.avoidAnimalTesting,
          avoidForcedLabour: valuesPreferences.avoidForcedLabour,
          avoidPalmOil: valuesPreferences.avoidPalmOil,
          geopoliticalEnabled: valuesPreferences.geopoliticalEnabled,
          ethicalEnabled: valuesPreferences.ethicalEnabled,
          environmentalEnabled: valuesPreferences.environmentalEnabled,
        };
        const score = calculateTruScore(product, prefs);
        setTruScore(score);
        console.log('[TruScore] Calculated:', score);
      } catch (error) {
        console.error('[TruScore] Calculation error:', error);
        // Still set a default score even on error
        setTruScore({
          truscore: 0,
          breakdown: { Body: 0, Planet: 0, Care: 0, Open: 0 },
        });
      }
    } else {
      setTruScore(null);
    }
  }, [product, valuesPreferences]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      // First check if this is a manually added product
      const manualProduct = await getManualProduct(barcode);
      if (manualProduct) {
        setProduct(manualProduct);
        addScan({
          barcode,
          timestamp: Date.now(),
          productName: manualProduct.product_name || manualProduct.product_name_en || null,
        });
        setLoading(false);
        return;
      }

      // If not manual, try fetching from APIs
      const productData = await fetchProduct(barcode, true, isPremium, isOffline);
      if (productData) {
        setProduct(productData);
        // Update scan history with product name
        addScan({
          barcode,
          timestamp: Date.now(),
          productName: productData.product_name || productData.product_name_en || null,
        });
      } else {
        setError('Product not found');
      }
    } catch (err) {
      console.error('Error loading product:', err);
      setError('Failed to load product data');
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

  const handleShare = async () => {
    if (!product) return;

    try {
      const shareUrl = generateBarcodeShareUrl(barcode);
      const deepLink = generateBarcodeDeepLink(barcode);
      const message = `Check out "${product.product_name || 'this product'}" on TrueScan!\n\n` +
        `Trust Score: ${product.trust_score}/100\n` +
        `Barcode: ${barcode}\n\n` +
        `${shareUrl}\n\n` +
        `Or scan with TrueScan app: ${deepLink}`;

      const result = await Share.share({
        message,
        title: product.product_name || 'Product on TrueScan',
        url: shareUrl,
      });

      if (result.action === Share.sharedAction) {
        console.log('Shared successfully');
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      Alert.alert(t('common.error'), 'Failed to share product');
    }
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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('result.loading')}
        </Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="barcode-outline" size={64} color={colors.textTertiary} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>{t('result.notFound')}</Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {t('result.notFoundMessage')}
        </Text>
        <Text style={[styles.barcodeText, { color: colors.textTertiary }]}>
          Barcode: {barcode}
        </Text>
        <TouchableOpacity
          style={[styles.contributeButton, { backgroundColor: colors.primary }]}
          onPress={() => setManualProductModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.contributeButtonText}>
            {t('manualProduct.addProduct') || 'Add Product Information'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.contributeButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, marginTop: 12 }]}
          onPress={handleContribute}
        >
          <Ionicons name="globe-outline" size={20} color={colors.primary} />
          <Text style={[styles.contributeButtonText, { color: colors.primary }]}>
            {t('result.contributeToOpenFoodFacts') || 'Contribute to Open Food Facts'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            {t('result.scanAnother')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const manufacturingCountry = extractManufacturingCountry(product);
  const imageUrl = product.image_url || product.image_front_url || product.image_front_small_url;
  const isWebSearchProduct = isWebSearchFallback(product);

  // Combine Open Food Facts data with user contributions (user contributions as fallback)
  const displayManufacturingCountry = manufacturingCountry || userContributedCountry?.country || null;
  
  // Calculate Eco-Score using the proper function to ensure grade is calculated from score if missing
  const calculatedEcoScore = product ? calculateEcoScore(product) : null;
  
  // Check if product has minimal/no useful data
  const hasMinimalData = !imageUrl && 
                         (!product.nutriments || Object.keys(product.nutriments).length === 0) &&
                         !product.ingredients_text &&
                         (!product.product_name || product.product_name.startsWith('Product ')) &&
                         (!product.generic_name || product.generic_name.length < 20);

  const handleSearchWeb = () => {
    if (!product) return;
    
    // Use product name if available, otherwise use barcode
    const searchQuery = product.product_name || product.product_name_en || product.brands || barcode;
    
    // Try multiple shopping sites in order of preference
    const shoppingUrls = [
      `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`,
      `https://www.walmart.com/search?q=${encodeURIComponent(searchQuery)}`,
      `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(searchQuery)}`,
      `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
    ];
    
    // Open the first URL (Amazon search with product name)
    Linking.openURL(shoppingUrls[0]).catch((error) => {
      console.error('Error opening search URL:', error);
      // Fallback to Google search
      Linking.openURL(shoppingUrls[shoppingUrls.length - 1]).catch(console.error);
    });
  };

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
      const { cacheProduct } = await import('../../src/services/cacheService');
      await cacheProduct(updatedProduct, isPremium);
    } catch (error) {
      console.error('Error caching product with image:', error);
    }
  };

  const handleManualProductSave = async (productData: ManualProductData) => {
    // Reload product data - it should now be available from cache
    await loadProduct();
    setManualProductModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
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
            <Text style={[styles.brand, { color: colors.textSecondary }]}>{product.brands}</Text>
          )}
          
          {/* Web Search Notice & Button (shown when product is from web search fallback or has minimal data) */}
          {(isWebSearchProduct || hasMinimalData) && (
            <View style={[styles.webSearchNotice, { backgroundColor: hasMinimalData ? '#ff6b6b' + '20' : '#ffa500' + '20', borderColor: hasMinimalData ? '#ff6b6b' : '#ffa500' }]}>
              <View style={styles.webSearchNoticeHeader}>
                <Ionicons name={hasMinimalData ? "warning" : "information-circle"} size={20} color={hasMinimalData ? '#ff6b6b' : '#ffa500'} />
                <Text style={[styles.webSearchNoticeTitle, { color: colors.text }]}>
                  {hasMinimalData ? t('result.minimalDataNotice') : t('result.webSearchNotice')}
                </Text>
              </View>
              <Text style={[styles.webSearchNoticeText, { color: colors.textSecondary }]}>
                {hasMinimalData 
                  ? t('result.minimalDataNoticeText')
                  : t('result.webSearchNoticeText')}
              </Text>
              <View style={styles.webSearchButtonContainer}>
                <TouchableOpacity
                  style={[styles.webSearchButton, { backgroundColor: hasMinimalData ? '#ff6b6b' : '#ffa500', flex: 1 }]}
                  onPress={handleSearchWeb}
                >
                  <Ionicons name="search" size={20} color="#fff" />
                  <Text style={styles.webSearchButtonText}>
                    {t('result.searchWeb')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contributeButton, { backgroundColor: colors.primary, flex: 1, marginLeft: 8 }]}
                  onPress={() => setManualProductModalVisible(true)}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.contributeButtonText}>
                    {t('manualProduct.addProduct') || 'Add Product'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.contributeButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, marginTop: 8 }]}
                onPress={handleContribute}
              >
                <Ionicons name="globe-outline" size={20} color={colors.primary} />
                <Text style={[styles.contributeButtonText, { color: colors.primary }]}>
                  {t('result.contributeToOpenFoodFacts') || 'Contribute to Open Food Facts'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
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

        {/* TruScore Card - v1.4 */}
        {truScore ? (
          <TouchableOpacity
            style={[styles.card, { 
              backgroundColor: colors.card,
              borderColor: getTrustScoreColor(truScore.truscore),
              borderWidth: 2,
            }]}
            onPress={() => setTrustScoreModalVisible(true)}
            activeOpacity={0.7}
          >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="shield" size={24} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>TruScore</Text>
              <TouchableOpacity
                onPress={() => {
                  setTrustScoreModalVisible(true);
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
                  handleShare();
                }}
                style={styles.shareButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="share-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* TruScore Display - v1.4 */}
          <TruScore truScore={truScore} size="medium" />

          {/* Why this score - Green/Red Flags */}
          {(() => {
            const flags = generateProductFlags(product);
            const greenFlags = flags.filter(f => f.type === 'green');
            const redFlags = flags.filter(f => f.type === 'red');
            
            if (greenFlags.length === 0 && redFlags.length === 0) return null;
            
            return (
              <View style={[styles.reasonsContainer, { borderTopColor: colors.border }]}>
                <Text style={[styles.reasonsTitle, { color: colors.text }]}>Score highlights:</Text>
                
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
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="information-circle-outline" size={24} color={colors.warning || '#ff9800'} />
                <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
                  {t('result.insufficientData')}
                </Text>
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
                    handleShare();
                  }}
                  style={styles.shareButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="share-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.insufficientDataText, { color: colors.textSecondary }]}>
              {t('result.insufficientDataMessage')}
            </Text>
          </View>
        )}

        {/* Insights Carousel - Values v1.1 (Collapsible) */}
        {truScore && truScore.insights && truScore.insights.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.insightsHeader, { borderBottomColor: colors.border }]}
              onPress={() => setInsightsExpanded(!insightsExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.insightsHeaderLeft}>
                <Ionicons name="bulb" size={20} color={colors.primary} />
                <Text style={[styles.insightsHeaderTitle, { color: colors.text }]}>
                  Insights
                </Text>
                <Text style={[styles.insightsHeaderCount, { color: colors.textSecondary }]}>
                  ({truScore.insights.length})
                </Text>
              </View>
              <Ionicons
                name={insightsExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {insightsExpanded && (
              <InsightsCarousel
                insights={truScore.insights}
                productName={product?.product_name || product?.product_name_en}
              />
            )}
          </View>
        )}

        {/* Values Preferences Card - Link to Values Screen */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('Values')}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="heart-outline" size={24} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
                Your Values
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
            Set your preferences for geopolitical, ethical, and environmental insights
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
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <Ionicons name="globe-outline" size={24} color={colors.text} />
                      <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>{t('result.countryOfManufacture', 'Country of Manufacture')}</Text>
                    </View>
                    <View style={styles.confidenceBadge}>
                      {manufacturingCountry ? (
                        // Open Food Facts data - verified source
                        <Ionicons name="checkmark-circle" size={16} color="#16a085" />
                      ) : userContributedCountry ? (
                        // User-contributed data - show confidence level
                        <>
                          {userContributedCountry.confidence === 'verified' && (
                            <Ionicons name="checkmark-circle" size={16} color="#16a085" />
                          )}
                          {userContributedCountry.confidence === 'community' && (
                            <Ionicons name="people" size={16} color="#4dd09f" />
                          )}
                          {userContributedCountry.confidence === 'unverified' && (
                            <Ionicons name="help-circle" size={16} color="#ffd93d" />
                          )}
                          {userContributedCountry.confidence === 'disputed' && (
                            <Ionicons name="warning" size={16} color="#ff9800" />
                          )}
                        </>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.originContainer}>
                    <CountryFlag country={displayManufacturingCountry} />
                  </View>
                  
                  {/* Validation Status Message and Progress Indicators */}
                  {!manufacturingCountry && userContributedCountry && (
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
                                {userContributedCountry.verifiedCount || 0}/3 {t('manufacturingCountry.verifiedUsers', 'independent users verified')}
                              </Text>
                              {(userContributedCountry.verifiedCount || 0) < 3 && (
                                <Text style={[styles.validationRemainingText, { color: colors.textSecondary }]}>
                                  {3 - (userContributedCountry.verifiedCount || 0)} {t('manufacturingCountry.moreNeeded', 'more needed for authentication')}
                                </Text>
                              )}
                            </View>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.card, { backgroundColor: colors.card, borderWidth: 2, borderColor: '#d32f2f' }]}
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
              
              {/* Verify/Update button - shown only when appropriate */}
              {shouldShowVerifyButton() && (
                <TouchableOpacity
                  style={[styles.reportButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setManufacturingCountryModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil-outline" size={16} color={colors.primary} />
                  <Text style={[styles.reportButtonText, { color: colors.primary }]}>
                    {getVerifyButtonText()}
                  </Text>
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
              </View>
              <TouchableOpacity
                onPress={() => {
                  setEcoScoreModalVisible(true);
                }}
                style={[styles.infoButtonAbsolute, { backgroundColor: colors.background }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.ecoScoreContent}>
              <EcoScore ecoScore={calculatedEcoScore} />
            </View>
          </TouchableOpacity>
          );
        })(        )}

        {/* Palm Oil Analysis */}
        {product.palm_oil_analysis && (() => {
          const palmOilFlagColor = product.palm_oil_analysis.isPalmOilFree 
            ? '#16a085' 
            : product.palm_oil_analysis.isNonSustainable 
            ? '#ff6b6b' 
            : '#ff9500';
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
            <View style={styles.cardHeaderLeft}>
              <Ionicons 
                name={product.palm_oil_analysis.isPalmOilFree ? "flag" : product.palm_oil_analysis.isNonSustainable ? "flag" : "flag"} 
                size={24} 
                color={product.palm_oil_analysis.isPalmOilFree ? '#16a085' : product.palm_oil_analysis.isNonSustainable ? '#ff6b6b' : '#ff9500'} 
              />
              <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
                {t('result.palmOil')}
              </Text>
            </View>
            <View style={styles.palmOilContent}>
              {product.palm_oil_analysis.isPalmOilFree ? (
                <View style={[styles.palmOilStatus, { backgroundColor: '#16a085' + '20', borderLeftWidth: 4, borderLeftColor: '#16a085' }]}>
                  <Text style={[styles.palmOilFlag, { color: '#16a085' }]}>🟢</Text>
                  <Text style={[styles.palmOilText, { color: colors.text }]}>
                    {t('result.greenFlag')} - {t('result.palmOilFree')}
                  </Text>
                </View>
              ) : product.palm_oil_analysis.isNonSustainable ? (
                <View style={[styles.palmOilStatus, { backgroundColor: '#ff6b6b' + '20', borderLeftWidth: 4, borderLeftColor: '#ff6b6b' }]}>
                  <Text style={[styles.palmOilFlag, { color: '#ff6b6b' }]}>🔴</Text>
                  <Text style={[styles.palmOilText, { color: colors.text }]}>
                    {t('result.redFlag')} - {t('result.nonSustainablePalmOil')}
                  </Text>
                </View>
              ) : product.palm_oil_analysis.containsPalmOil ? (
                <View style={[styles.palmOilStatus, { backgroundColor: '#ff9500' + '20', borderLeftWidth: 4, borderLeftColor: '#ff9500' }]}>
                  <Text style={[styles.palmOilFlag, { color: '#ff9500' }]}>🟠</Text>
                  <Text style={[styles.palmOilText, { color: colors.text }]}>
                    {t('result.orangeFlag')} - {t('result.containsPalmOil')}
                  </Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
          );
        })()}

        {/* Packaging Sustainability */}
        {product.packaging_data && product.packaging_data.items.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="cube-outline" size={24} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
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
          </View>
        )}

        {/* Ethics / Certifications */}
        {product.certifications && product.certifications.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>{t('result.certifications')}</Text>
            </View>
            <View style={styles.certificationsContainer}>
              {product.certifications.map((cert) => (
                <CertBadge key={cert.id} certification={cert} />
              ))}
            </View>
          </View>
        )}

        {/* Nutrition Facts */}
        <NutritionTable
          nutriments={product.nutriments}
          nutrientLevels={product.nutrient_levels}
          servingSize={product.serving_size}
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
          
          return (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="flask" size={24} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>{t('result.ingredients')}</Text>
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
                <TouchableOpacity
                  style={[styles.novaContainer, { borderTopColor: colors.border }]}
                  onPress={() => setProcessingLevelModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.novaHeader}>
                    <Text style={[styles.novaLabel, { color: colors.text }]}>{t('result.processingLevel')}:</Text>
                    <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.novaValue, { color: novaColor }]}>
                    NOVA {product.nova_group} ({t(`nova.${product.nova_group}`)})
                  </Text>
                </TouchableOpacity>
              );
            })()}
          </View>
          );
        })()}

        {/* Allergens & Additives */}
        {(product.allergens_tags || product.additives_tags) && (() => {
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
              onPress={() => setAllergensAdditivesModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Ionicons name="warning" size={24} color={hasDetected ? redColor : colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>{t('result.allergensAdditives')}</Text>
                </View>
                <Ionicons name="information-circle-outline" size={20} color={hasDetected ? redColor : colors.primary} />
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

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Share My Choices FAB */}
      <View style={[styles.fabContainer, { bottom: tabBarHeight + 16 }]}>
        <ShareValuesCard />
      </View>

      {/* Trust Score Info Modal - Only show if we have data */}
      {product && product.trust_score !== null && product.trust_score_breakdown && (
        <TrustScoreInfoModal
          visible={trustScoreModalVisible}
          onClose={() => setTrustScoreModalVisible(false)}
          product={product}
        />
      )}

      {/* Eco-Score Info Modal */}
      <EcoScoreInfoModal
        visible={ecoScoreModalVisible}
        onClose={() => setEcoScoreModalVisible(false)}
      />

      {/* Allergens & Additives Modal */}
      <AllergensAdditivesModal
        visible={allergensAdditivesModalVisible}
        onClose={() => setAllergensAdditivesModalVisible(false)}
        product={product}
      />

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
        onSubmit={async (country: string) => {
          const result = await submitManufacturingCountry(barcode, country);
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
              // Refresh user-contributed country
              const contributed = await getManufacturingCountry(barcode);
              if (contributed.country) {
                setUserContributedCountry({
                  country: contributed.country,
                  confidence: contributed.confidence as 'verified' | 'community' | 'unverified' | 'disputed',
                  verifiedCount: contributed.verifiedCount || 0,
                });
              }
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

      {/* Manual Product Entry Modal */}
      <ManualProductEntryModal
        visible={manualProductModalVisible}
        onClose={() => setManualProductModalVisible(false)}
        onSave={handleManualProductSave}
        barcode={barcode}
      />
    </View>
  );
}

// Export with Error Boundary wrapper
export default function ResultScreen() {
  return (
    <ErrorBoundary>
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  contributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    marginBottom: 16,
  },
  contributeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  reasonsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  reasonsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
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
  fabContainer: {
    position: 'absolute',
    right: 16,
    left: 16,
    zIndex: 1000,
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
  webSearchNotice: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  webSearchNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webSearchNoticeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  webSearchNoticeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  webSearchButtonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  webSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  webSearchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
