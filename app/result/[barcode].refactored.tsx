// Refactored Result Screen using Modular Cards
// This version uses the new modular architecture while preserving all functionality

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
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ResultScreenRouteProp, ResultScreenNavigationProp } from '../../src/navigation/tabStackParamLists';
import { ProductWithTrustScore } from '../../src/types/product';
import { useScanStore } from '../../src/store/useScanStore';
import { useFavoritesStore } from '../../src/store/useFavoritesStore';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useValuesStore } from '../../src/store/useValuesStore';
import { useTheme } from '../../src/theme';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import { sanitizeText } from '../../src/utils/validation';
import { logger } from '../../src/utils/logger';
import { generateBarcodeShareUrl, generateBarcodeDeepLink } from '../../src/utils/linking';
import { getManualProduct, isManualProduct } from '../../src/services/manualProductService';
import { saveManualProduct } from '../../src/services/manualProductService';
import { cacheProduct } from '../../src/services/cacheService';
import ErrorBoundary from '../../src/components/ErrorBoundary';

// Modular Cards
import { TruScoreCard } from '../../src/features/product/cards/TruScoreCard';
import { EcoScoreCard } from '../../src/features/product/cards/EcoScoreCard';
import { NutritionCard } from '../../src/features/product/cards/NutritionCard';
import { PalmOilCard } from '../../src/features/product/cards/PalmOilCard';
import { PackagingCard } from '../../src/features/product/cards/PackagingCard';
import CarbonFootprintCard from '../../src/features/product/cards/CarbonFootprintCard/CarbonFootprintCard';
import { AllergensCard } from '../../src/features/product/cards/AllergensCard';
import { ProcessingCard } from '../../src/features/product/cards/ProcessingCard';
import { RecallsCard } from '../../src/features/product/cards/RecallsCard';
import { CountryCard } from '../../src/features/product/cards/CountryCard';
import { CertificationsCard } from '../../src/features/product/cards/CertificationsCard';
import { PricingCard } from '../../src/features/product/cards/PricingCard';

// Hooks
import { useProductData } from '../../src/features/product/hooks/useProductData';

// Sharing
import { ShareService, ShareableItem } from '../../src/features/sharing';

// Modals (keep existing modals for now)
import TruScoreInfoModal from '../../src/components/TrustScoreInfoModal';
import EcoScoreInfoModal from '../../src/components/EcoScoreInfoModal';
import AllergensAdditivesModal from '../../src/components/AllergensAdditivesModal';
import ProcessingLevelModal from '../../src/components/ProcessingLevelModal';
import CameraCaptureModal from '../../src/components/CameraCaptureModal';
import ManufacturingCountryModal from '../../src/components/ManufacturingCountryModal';
import RecallAlertModal from '../../src/components/RecallAlertModal';
import PackagingInfoModal from '../../src/components/PackagingInfoModal';
import ManualProductEntryModal from '../../src/components/ManualProductEntryModal';
import InsightsCarousel from '../../src/components/InsightsCarousel';
import { getProductPageValuesInsights } from '../../src/utils/productInfoCardVisibility';

function ResultScreenContent() {
  const route = useRoute<ResultScreenRouteProp>();
  const navigation = useNavigation<ResultScreenNavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { barcode } = route.params;
  const { addScan } = useScanStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { subscriptionInfo } = useSubscriptionStore();
  const { isOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const valuesPreferences = useValuesStore();

  const hasValuesMasterEnabled =
    valuesPreferences.geopoliticalEnabled ||
    valuesPreferences.ethicalEnabled ||
    valuesPreferences.environmentalEnabled;

  const isPremium = subscriptionInfo.isPremium &&
    (subscriptionInfo.status === 'active' || subscriptionInfo.status === 'trial' || subscriptionInfo.status === 'grace_period');

  const tabBarHeight = 60 + insets.bottom;

  // Use modular product data hook
  const { product, truScore, loading, error, refresh, reload } = useProductData({
    barcode,
    useCache: true,
    isPremium,
    isOffline,
  });

  // State for modals and UI
  const [refreshing, setRefreshing] = useState(false);
  const [truScoreModalVisible, setTruScoreModalVisible] = useState(false);
  const [ecoScoreModalVisible, setEcoScoreModalVisible] = useState(false);
  const [allergensAdditivesModalVisible, setAllergensAdditivesModalVisible] = useState(false);
  const [processingLevelModalVisible, setProcessingLevelModalVisible] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [manufacturingCountryModalVisible, setManufacturingCountryModalVisible] = useState(false);
  const [recallAlertModalVisible, setRecallAlertModalVisible] = useState(false);
  const [palmOilInfoModalVisible, setPalmOilInfoModalVisible] = useState(false);
  const [packagingInfoModalVisible, setPackagingInfoModalVisible] = useState(false);
  const [manualProductModalVisible, setManualProductModalVisible] = useState(false);
  const [insightsExpanded, setInsightsExpanded] = useState(false);
  const [isUserContributed, setIsUserContributed] = useState(false);

  // Track scan history
  useEffect(() => {
    if (product) {
      addScan({
        barcode,
        timestamp: Date.now(),
        productName: product.product_name || product.product_name_en || null,
      });
    }
  }, [product, barcode, addScan]);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch (err) {
      logger.error('Error refreshing:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleShare = async (item: ShareableItem = 'productInfo') => {
    if (!product) return;

    try {
      const result = await ShareService.share({
        product,
        truScore: truScore || undefined,
        item,
        platform: 'native', // Use native share sheet for now
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: t('common.shared', 'Shared successfully'),
        });
      }
    } catch (err) {
      logger.error('Error sharing:', err);
      Alert.alert(t('common.error'), 'Failed to share product');
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

  const handleCaptureImage = async (imageUri: string) => {
    if (!product) return;

    try {
      const updatedProduct: ProductWithTrustScore = {
        ...product,
        image_url: imageUri,
      };

      // Save to manual product service
      await saveManualProduct({
        barcode,
        product_name: product.product_name || '',
        image_url: imageUri,
        timestamp: Date.now(),
      });

      // Cache updated product
      await cacheProduct(updatedProduct, isPremium);
    } catch (error) {
      logger.error('Error caching product with image:', error);
    }
  };

  // Loading state
  if (loading && !product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('result.loading', 'Loading product...')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error || '#ff6b6b'} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            {t('result.error', 'Error Loading Product')}
          </Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {error.message || t('result.errorMessage', 'Failed to load product data')}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={reload}
          >
            <Text style={styles.retryButtonText}>{t('common.retry', 'Retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // No product state
  if (!product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="barcode-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            {t('result.productNotFound', 'Product Not Found')}
          </Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {t('result.productNotFoundMessage', 'We couldn\'t find this product in our databases.')}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={reload}
          >
            <Text style={styles.retryButtonText}>{t('common.retry', 'Retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const imageUrl = product.image_url;
  const productPageValuesInsights = getProductPageValuesInsights(hasValuesMasterEnabled, truScore);
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
        </View>

        {/* Food Recall Alert Banner - Using RecallsCard */}
        <RecallsCard
          product={product}
          onShare={() => handleShare('recall')}
          premiumFeatures={[]}
        />

        {/* Modular Cards */}
        <TruScoreCard
          barcode={barcode}
          product={product}
          onShare={() => handleShare('truScore')}
          premiumFeatures={[]}
        />

        {/* Values / insights — same visibility as main result screen */}
        {productPageValuesInsights && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.insightsHeader, { borderBottomColor: colors.border }]}
              onPress={() => setInsightsExpanded(!insightsExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.insightsHeaderLeft}>
                <Ionicons name="bulb" size={20} color={colors.primary} />
                <Text style={[styles.insightsHeaderTitle, { color: colors.text }]}>Insights</Text>
                <Text style={[styles.insightsHeaderCount, { color: colors.textSecondary }]}>
                  ({productPageValuesInsights.length})
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
                insights={productPageValuesInsights}
                productName={product?.product_name || product?.product_name_en}
                onRequestProductShare={() => handleShare('insights')}
              />
            )}
          </View>
        )}

        {/* EcoScore Card */}
        <EcoScoreCard
          product={product}
          onShare={() => handleShare('productInfo')}
          premiumFeatures={[]}
        />

        {/* Nutrition Card */}
        <NutritionCard
          product={product}
          onShare={() => handleShare('productInfo')}
          premiumFeatures={[]}
        />

        {/* Palm Oil Card */}
        <PalmOilCard
          product={product}
          onShare={() => handleShare('productInfo')}
          premiumFeatures={[]}
        />

        {/* Packaging Card */}
        <PackagingCard
          product={product}
          onShare={() => handleShare('productInfo')}
          premiumFeatures={[]}
        />

        <CarbonFootprintCard product={product} premiumFeatures={[]} />

        {/* Allergens & Additives Card */}
        <AllergensCard
          product={product}
          onShare={() => handleShare('productInfo')}
          premiumFeatures={[]}
        />

        {/* Processing Level Card */}
        <ProcessingCard
          product={product}
          onShare={() => handleShare('productInfo')}
          premiumFeatures={[]}
        />

        {/* Country of Manufacture Card */}
        <CountryCard
          barcode={barcode}
          product={product}
          onShare={() => handleShare('countryOfManufacture')}
          premiumFeatures={[]}
        />

        {/* Certifications Card */}
        <CertificationsCard
          product={product}
          onShare={() => handleShare('productInfo')}
          premiumFeatures={[]}
        />

        {/* Pricing Card */}
        <PricingCard
          barcode={barcode}
          productName={product?.product_name || product?.product_name_en}
          onShare={() => handleShare('productInfo')}
          premiumFeatures={[]}
        />

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modals */}
      {product && product.trust_score !== null && product.trust_score_breakdown && (
        <TruScoreInfoModal
          visible={truScoreModalVisible}
          onClose={() => setTruScoreModalVisible(false)}
          product={product}
        />
      )}

      <EcoScoreInfoModal
        visible={ecoScoreModalVisible}
        onClose={() => setEcoScoreModalVisible(false)}
      />

      <AllergensAdditivesModal
        visible={allergensAdditivesModalVisible}
        onClose={() => setAllergensAdditivesModalVisible(false)}
        product={product}
      />

      <ProcessingLevelModal
        visible={processingLevelModalVisible}
        onClose={() => setProcessingLevelModalVisible(false)}
        novaGroup={product?.nova_group}
      />

      <CameraCaptureModal
        visible={cameraModalVisible}
        onClose={() => setCameraModalVisible(false)}
        onCapture={handleCaptureImage}
        barcode={barcode}
      />

      <RecallAlertModal
        visible={recallAlertModalVisible}
        onClose={() => setRecallAlertModalVisible(false)}
        recalls={product?.recalls || []}
      />

      <PackagingInfoModal
        visible={packagingInfoModalVisible}
        onClose={() => setPackagingInfoModalVisible(false)}
        product={product}
      />

      <ManualProductEntryModal
        visible={manualProductModalVisible}
        onClose={() => setManualProductModalVisible(false)}
        onSave={async (productData) => {
          await saveManualProduct(productData);
          setManualProductModalVisible(false);
          // Reload product
          await reload();
        }}
        barcode={barcode}
      />
    </SafeAreaView>
  );
}

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
    padding: 32,
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
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hero: {
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  productImage: {
    width: SCREEN_WIDTH - 32,
    height: 200,
    marginBottom: 12,
  },
  placeholderImage: {
    width: SCREEN_WIDTH - 32,
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  captureImageText: {
    marginTop: 8,
    fontSize: 14,
  },
  productNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userContributedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  userContributedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  brand: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    margin: 16,
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
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
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
  bottomSpacer: {
    height: 32,
  },
});


