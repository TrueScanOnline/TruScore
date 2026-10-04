import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  Alert,
  Share,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { useRoute, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { TabParamList } from '../../src/navigation/AppTabs';
import type { ResultScreenRouteProp, ResultScreenNavigationProp } from '../../src/navigation/tabStackParamLists';
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
import UniversalPricingCard from '../../src/components/UniversalPricingCard';
import NutritionTable from '../../src/components/NutritionTable';
import type { NutritionDetailsFocusTarget } from '../../src/components/NutritionDetailsModal';
import { Image as ExpoImage } from 'expo-image';
import { PRODUCT_ORIGINS_EXPLAINER_HOOK } from '../../src/origins/governedFacts';
import {
  PACKET_CLAIMS_CARD_TITLE,
  PACKET_CLAIMS_EXPLAINER_HOOK,
} from '../../src/claims/packetClaimReceiver';
import { useAlertsStore } from '../../src/store/useAlertsStore';
import BannerAlertsCard from '../../src/components/BannerAlertsCard';
import { BannerAlertsData } from '../../src/types/bannerAlerts';
import {
  attachDynamicSignalRecordsToScanResult,
  buildProductScanResult,
} from '../../src/services/buildProductScanResult';
import { buildBannerAlertsDataFromScanResult } from '../../src/utils/scanResultPresentation';
import {
  dynamicSignalsEvaluationKey,
  evaluateDynamicSignalsAssetProgressive,
  productNameForSignalsIdentity,
  resolveMaterialRetailIdentityStateForAsset,
  shouldCommitDynamicSignalsEvaluation,
  type SignalsReadyOutcome,
} from '../../src/dynamicSignals/asset/v0.2/evaluateDynamicSignalsAssetProgressive';
import { resolveActiveSignalsProducer } from '../../src/dynamicSignals/asset/v0.2/signalsProducerGuard';
import type { DynamicSignalPublicationRecord } from '../../src/dynamicSignals/publish/types';
import { resolveSharedIdentityContext } from '../../src/identity/resolveSharedIdentityContext';
import { logScanObs, generateScanId } from '../../src/services/scanObservability';
import { getUserCountryCode } from '../../src/utils/countryDetection';
import InsightsCarousel from '../../src/components/InsightsCarousel';
import TruScoreInfoModal from '../../src/components/TrustScoreInfoModal';
import TruScoreAnalysisModal from '../../src/components/TruScoreAnalysisModal';
import { productIdentity } from '../../src/config/productIdentity';
import AllergensAdditivesModal from '../../src/components/AllergensAdditivesModal';
import AboutTheseAdditivesCard from '../../src/components/AboutTheseAdditivesCard';
import ProcessingLevelModal from '../../src/components/ProcessingLevelModal';
import CameraCaptureModal from '../../src/components/CameraCaptureModal';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { shouldShowScoreDiagnosticsEntry } from '../../src/config/scoreDiagnostics';
import ScoreHighlightsList from '../../src/components/ScoreHighlightsList';
import { resultPillarBreakdown } from '../../src/utils/resultPillarBreakdown';
import ScoreHighlightsLookThroughModal, {
  type ScoreHighlightsLookThroughRequest,
} from '../../src/components/ScoreHighlightsLookThroughModal';
import AboutTheseAdditivesModal, {
  type AboutTheseAdditivesCaller,
} from '../../src/components/AboutTheseAdditivesModal';
import ScoreHighlightsGovernedL3Modal, {
  type ScoreHighlightsGovernedL3Request,
} from '../../src/components/ScoreHighlightsGovernedL3Modal';
import {
  firedLedgerFromTruScoreResult,
  selectScoreHighlights,
  type ScoreHighlightL3Route,
  type ScoreHighlightPillar,
  type ScoreHighlightStory,
} from '../../src/lib/scoreHighlights';
import type { ScoreHighlightL3InAppTarget } from '../../src/lib/scoreHighlights/l3/targets';
import { planInAppL3HostPresentation } from '../../src/lib/scoreHighlights/l3/hostPresentation';
import { mapBodyLedgerIdToCanonical, mergeRenderedAdditives } from '../../src/s25';
import { generateInsights } from '../../src/lib/alertsInsights';
import { generateBarcodeShareUrl, generateBarcodeDeepLink } from '../../src/utils/linking';
import { isWebSearchFallback } from '../../src/services/webSearchFallback';
import { useTheme } from '../../src/theme';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import { uploadProductPhoto } from '../../src/services/photoUploadService';
import { PalmOilCard } from '../../src/features/product/cards/PalmOilCard';
import { formatGovernedOriginFactLine, productOriginsCardPresentation } from '../../src/origins/productOriginsCard';
import ErrorBoundary from '../../src/components/ErrorBoundary';
import { sanitizeText } from '../../src/utils/validation';
import { sanitizeCountryForDisplay } from '../../src/utils/countryDisplayName';
import { logger } from '../../src/utils/logger';
import ManualProductEntryModal from '../../src/components/ManualProductEntryModal';
import PacketContributionModal from '../../src/components/PacketContributionModal';
import {
  CONTRIBUTION_NOTICE_ADDED,
  CONTRIBUTION_NOTICE_SAVED,
  PACKET_ABSENCE_PRODUCT_STATE,
  PACKET_INFORMATION_ADD,
  PACKET_INFORMATION_UPDATE,
  resultContributionActions,
  type ContributionEntryContext,
} from '../../src/contribution/resultContributionActions';
import {
  nutritionPrefillFromSource,
  originDraftsFromGovernedFacts,
} from '../../src/contribution/governedDisplayProjection';
import { subscribeEvidenceAdmission } from '../../src/evidenceAuthority/device';
import { currentModalTrace } from '../../src/evidenceAuthority/contributionTrace';
import {
  authoritativeStateSupersedes,
  rememberedAuthoritativeSnapshot,
} from '../../src/evidenceAuthority/assessment';
import { calculateTrustScore } from '../../src/utils/trustScore';
import { getManualProduct, isManualProduct, saveManualProduct } from '../../src/services/manualProductService';
import { ManualProductData } from '../../src/types/manualProduct';
import { cacheProduct } from '../../src/services/cacheService';
import { getProductPageAlertsInsights } from '../../src/utils/productInfoCardVisibility';
import { crashReporter } from '../../src/utils/crashReporter';
import { getPrimaryBarcode } from '../../src/utils/barcodeNormalization';
import { shouldPreserveSettledResultOnLoadMiss } from '../../src/utils/resultPublicationLoadGuard';
import ShareModal from '../../src/components/ShareModal';
import ProductHeroSection from '../../src/components/product/ProductHeroSection';
import ProductDisclaimerCard from '../../src/components/productLegal/ProductDisclaimerCard';
import ProductDataLimitationsCard from '../../src/components/productLegal/ProductDataLimitationsCard';
import PremiumGate from '../../src/components/PremiumGate';
import { PremiumFeature, isPremiumFeatureEnabled } from '../../src/utils/premiumFeatures';
import {
  isMvpAllergensUiEnabled,
  isMvpLegacyAlertsInsightsEnabled,
  isMvpPricingUiEnabled,
} from '../../src/config/mvpRuntimeGates';
import { hasCoreTruthAuthority } from '../../src/config/coreTruthProductCacheAuthority';
import type { RootStackParamList } from '../_layout';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

function getRootStackNavigation(
  navigation: ResultScreenNavigationProp
): NativeStackNavigationProp<RootStackParamList> | undefined {
  return navigation.getParent()?.getParent() as NativeStackNavigationProp<RootStackParamList> | undefined;
}

function navigateToScanHome(navigation: ResultScreenNavigationProp) {
  const tabNav = navigation.getParent() as BottomTabNavigationProp<TabParamList> | undefined;
  try {
    tabNav?.navigate('Scan', { screen: 'ScanHome' });
  } catch {
    navigation.goBack();
  }
}

/**
 * NA-003 Candidate 2 defence-in-depth: authoritative interpretation (identity / Chaining /
 * ownership / Dynamic Signals) requires barcode match AND Core Truth authority stamp.
 */
function authoritativeProductForScan(
  product: ProductWithTrustScore | null | undefined,
  routeBarcode: string
): ProductWithTrustScore | null {
  if (!product) return null;
  if (getPrimaryBarcode(product.barcode) !== getPrimaryBarcode(routeBarcode)) return null;
  if (!hasCoreTruthAuthority(product)) return null;
  return product;
}

function ResultIngredientsSection({
  barcode,
  ingredientsText,
  novaGroup,
  showAddIngredients,
  showUpdateIngredients,
  onAddIngredients,
  onUpdateIngredients,
  onShareIngredients,
  onShareProcessing,
  onOpenProcessingLevel,
}: {
  barcode: string;
  ingredientsText?: string | null;
  novaGroup?: number | null;
  showAddIngredients: boolean;
  showUpdateIngredients: boolean;
  onAddIngredients: () => void;
  onUpdateIngredients: () => void;
  onShareIngredients: () => void;
  onShareProcessing: () => void;
  onOpenProcessingLevel: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const sectionStyle = [
    styles.ingredientsSection,
    { borderTopColor: colors.border },
  ];

  const filled = (() => {
    if (!ingredientsText) return null;
    let text = ingredientsText.trim();
    const isBarcodePattern = /^\d{8,14}$/.test(text.replace(/\s/g, ''));
    if (isBarcodePattern) return null;
    text = text.replace(/<[^>]*>/g, '').trim();
    const barcodePattern = new RegExp(`\\b${barcode}\\b`, 'gi');
    text = text.replace(barcodePattern, '').trim();
    text = text.replace(/\b\d{8,14}\b/g, '').trim();
    text = text.replace(/[,\s]+/g, ' ').trim();
    if (!text || text.length < 3) return null;
    return text;
  })();

  if (filled) {
    const novaColor =
      novaGroup === 1 || novaGroup === 2
        ? '#16a085'
        : novaGroup === 3
          ? '#ff9500'
          : '#ff6b6b';
    return (
      <View style={sectionStyle}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderTop}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="flask" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardHeaderRight}>
              <TouchableOpacity
                onPress={onShareIngredients}
                style={styles.shareButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="share-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('result.ingredients')}</Text>
        </View>
        <Text style={[styles.ingredientsText, { color: colors.text }]}>{filled}</Text>
        {novaGroup ? (
          <View style={[styles.novaContainer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={styles.novaHeader}
              onPress={onOpenProcessingLevel}
              activeOpacity={0.7}
            >
              <Text style={[styles.novaLabel, { color: colors.text }]}>{t('result.processingLevel')}:</Text>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.novaContent}>
              <Text style={[styles.novaValue, { color: novaColor }]}>
                NOVA {novaGroup} ({t(`nova.${novaGroup}`)})
              </Text>
              <TouchableOpacity
                onPress={onShareProcessing}
                style={styles.shareButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="share-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        {showAddIngredients ? (
          <TouchableOpacity
            onPress={onAddIngredients}
            activeOpacity={0.7}
            style={[styles.certificationsUpdateButton, { borderColor: '#16a085' }]}
            accessibilityRole="button"
            accessibilityLabel="Add ingredients"
          >
            <Ionicons name="add-circle-outline" size={20} color="#16a085" />
            <Text style={[styles.certificationsUpdateButtonText, { color: '#16a085' }]}>Add ingredients</Text>
          </TouchableOpacity>
        ) : null}
        {showUpdateIngredients ? (
          <TouchableOpacity
            onPress={onUpdateIngredients}
            activeOpacity={0.7}
            style={[styles.certificationsUpdateButton, { borderColor: '#16a085' }]}
            accessibilityRole="button"
            accessibilityLabel="Update ingredients"
          >
            <Ionicons name="create-outline" size={20} color="#16a085" />
            <Text style={[styles.certificationsUpdateButtonText, { color: '#16a085' }]}>Update ingredients</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (!ingredientsText || !ingredientsText.trim()) {
    return (
      <View style={sectionStyle}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderTop}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="flask" size={24} color={colors.primary} />
            </View>
            <View style={styles.cardHeaderRight}>
              <TouchableOpacity
                onPress={onShareIngredients}
                style={styles.shareButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="share-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('result.ingredients')}</Text>
        </View>
        <Text style={[styles.insufficientDataText, { color: colors.textSecondary }]}>
          {t('result.ingredientsEmpty', 'No ingredients on file.')}
        </Text>
        {showAddIngredients ? (
          <TouchableOpacity
            onPress={onAddIngredients}
            activeOpacity={0.7}
            style={[styles.certificationsUpdateButton, { borderColor: '#16a085' }]}
            accessibilityRole="button"
            accessibilityLabel="Add ingredients"
          >
            <Ionicons name="add-circle-outline" size={20} color="#16a085" />
            <Text style={[styles.certificationsUpdateButtonText, { color: '#16a085' }]}>Add ingredients</Text>
          </TouchableOpacity>
        ) : null}
        {showUpdateIngredients ? (
          <TouchableOpacity
            onPress={onUpdateIngredients}
            activeOpacity={0.7}
            style={[styles.certificationsUpdateButton, { borderColor: '#16a085' }]}
            accessibilityRole="button"
            accessibilityLabel="Update ingredients"
          >
            <Ionicons name="create-outline" size={20} color="#16a085" />
            <Text style={[styles.certificationsUpdateButtonText, { color: '#16a085' }]}>Update ingredients</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return null;
}

function ResultScreenContent() {
  const route = useRoute<ResultScreenRouteProp>();
  const navigation = useNavigation<ResultScreenNavigationProp>();
  const { t } = useTranslation();
  const { colors, darkMode } = useTheme();
  const { barcode } = route.params;
  const { addScan, removeLegacyProvisionalScan } = useScanStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const { subscriptionInfo } = useSubscriptionStore();
  const scoreDiagnosticsEnabled = useSettingsStore((s) => s.scoreDiagnosticsEnabled);
  const showScoreDiagnostics = shouldShowScoreDiagnosticsEntry(scoreDiagnosticsEnabled);
  const { isOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const alertsPreferences = useAlertsStore();
  const scanIdRef = useRef<string>(generateScanId());
  const lastBarcodeForScan = useRef<string | null>(null);
  const resultScrollRef = useRef<ScrollView>(null);
  const productOriginsOffsetYRef = useRef(0);

  const isPremium = subscriptionInfo.isPremium && 
    (subscriptionInfo.status === 'active' || subscriptionInfo.status === 'trial' || subscriptionInfo.status === 'grace_period');
  
  // Tab bar height (60px + safe area bottom)
  const tabBarHeight = 60 + insets.bottom;

  const hasAlertsMasterEnabled =
    alertsPreferences.geopoliticalEnabled ||
    alertsPreferences.ethicalEnabled ||
    alertsPreferences.environmentalEnabled;

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
  const productRef = useRef<ProductWithTrustScore | null>(null);
  productRef.current = product;
  const [truScore, setTruScore] = useState<TruScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState<string>('initializing');
  /**
   * Wave 3: score/Confidence/S26 publication latch. Once the initial assessment cycle
   * settles, never flip consumer publication back to Checking for the same barcode load.
   */
  const [publicationSettled, setPublicationSettled] = useState(false);
  const publicationSettledRef = useRef(false);
  /** Barcode for which publicationSettled is latched — used to ignore late network reruns. */
  const settledForBarcodeRef = useRef<string | null>(null);
  const [progressiveProduct, setProgressiveProduct] = useState<ProductWithTrustScore | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [truScoreModalVisible, setTruScoreModalVisible] = useState(false);
  /** Bump to open W3-S26 from the Overall Confidence badge (not W3-S27). */
  const [s26OpenRequestKey, setS26OpenRequestKey] = useState(0);
  const [truScoreAnalysisModalVisible, setTruScoreAnalysisModalVisible] = useState(false);
  const [scoreHighlightsRequest, setScoreHighlightsRequest] =
    useState<ScoreHighlightsLookThroughRequest | null>(null);
  /** Saved Body L2 look-through so About-these-additives Back can restore it. */
  const [aboutAdditivesBodyRestore, setAboutAdditivesBodyRestore] =
    useState<ScoreHighlightsLookThroughRequest | null>(null);
  /** Saved Open L3 so About-these-additives Back can restore it. */
  const [aboutAdditivesOpenRestore, setAboutAdditivesOpenRestore] =
    useState<ScoreHighlightsGovernedL3Request | null>(null);
  const [aboutAdditivesSession, setAboutAdditivesSession] = useState<{
    visible: boolean;
    caller: AboutTheseAdditivesCaller;
    focusAdditiveIds: string[];
  }>({ visible: false, caller: 'result', focusAdditiveIds: [] });
  const [governedL3Request, setGovernedL3Request] = useState<ScoreHighlightsGovernedL3Request | null>(
    null
  );
  const [nutritionDetailsVisible, setNutritionDetailsVisible] = useState(false);
  const [nutritionDetailsFocus, setNutritionDetailsFocus] =
    useState<NutritionDetailsFocusTarget>(null);
  const [allergensAdditivesModalVisible, setAllergensAdditivesModalVisible] = useState(false);
  const [processingLevelModalVisible, setProcessingLevelModalVisible] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [productOriginsExplainerVisible, setProductOriginsExplainerVisible] = useState(false);
  const [packetClaimsExplainerVisible, setPacketClaimsExplainerVisible] = useState(false);
  const [manualProductModalVisible, setManualProductModalVisible] = useState(false);
  const [packetContributionVisible, setPacketContributionVisible] = useState(false);
  const [contributionEntry, setContributionEntry] = useState<ContributionEntryContext>('ingredients');
  const [ingredientNutritionSheetVisible, setIngredientNutritionSheetVisible] = useState(false);
  const [contributionNotice, setContributionNotice] = useState<string | null>(null);
  const [editProductData, setEditProductData] = useState<Product | null>(null); // Product data for edit mode
  const [editMode, setEditMode] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareType, setShareType] = useState<
    | 'truScore'
    | 'countryOfManufacture'
    | 'negativeTruScore'
    | 'productInfo'
    | 'insights'
    | 'palmOil'
    | 'nutrition'
    | 'ingredients'
    | 'processing'
    | 'allergens'
    | 'ecoscore'
  >('truScore');
  const [shareInitialMessage, setShareInitialMessage] = useState('');
  /** Progressive Signals — attached after primary product/TruScore is ready. */
  const [dynamicSignalRecords, setDynamicSignalRecords] = useState<DynamicSignalPublicationRecord[]>([]);
  const [signalsReadyOutcome, setSignalsReadyOutcome] = useState<SignalsReadyOutcome | null>(null);
  const signalsEvalKeyRef = useRef<string | null>(null);
  const signalsInFlightKeyRef = useRef<string | null>(null);
  const latestSignalsEvalKeyRef = useRef<string | null>(null);
  const signalsEvalContextRef = useRef<null | {
    evalKey: string;
    barcode: string;
    product: ProductWithTrustScore;
    productName: string;
    scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN';
    producerLogs: string[];
  }>(null);
  const productResultReadyLoggedRef = useRef<string | null>(null);
  const appliedSnapshotAtRef = useRef(0);
  const [isUserContributed, setIsUserContributed] = useState(false);
  const [insightsExpanded, setInsightsExpanded] = useState(true);

  if (lastBarcodeForScan.current !== barcode) {
    lastBarcodeForScan.current = barcode;
    scanIdRef.current = generateScanId();
    logScanObs({ event: 'scan_started', scan_id: scanIdRef.current, barcode });
  }

  useEffect(() => {
    setDynamicSignalRecords([]);
    setSignalsReadyOutcome(null);
    signalsEvalKeyRef.current = null;
    signalsInFlightKeyRef.current = null;
    latestSignalsEvalKeyRef.current = null;
    signalsEvalContextRef.current = null;
    productResultReadyLoggedRef.current = null;
    // New barcode — drop prior publication latch so Checking can run for this scan.
    settledForBarcodeRef.current = null;
    publicationSettledRef.current = false;
    appliedSnapshotAtRef.current = 0;
    setPublicationSettled(false);
  }, [barcode]);

  useEffect(() => {
    return subscribeEvidenceAdmission((admittedBarcode, snapshot) => {
      const current = productRef.current;
      if (!current || getPrimaryBarcode(admittedBarcode) !== getPrimaryBarcode(barcode)) return;
      appliedSnapshotAtRef.current = Math.max(appliedSnapshotAtRef.current, snapshot.generatedAt);
      currentModalTrace()?.mark('reassessment_listener_begin');
      void calculateTrustScore(current, { authoritativeSnapshot: snapshot }).then((next) => {
        if (!authoritativeStateSupersedes(appliedSnapshotAtRef.current, snapshot.generatedAt)) {
          currentModalTrace()?.mark('reassessment_listener_end', 'stale');
          return;
        }
        if (getPrimaryBarcode(next.barcode) !== getPrimaryBarcode(barcode)) {
          currentModalTrace()?.mark('reassessment_listener_end', 'stale');
          return;
        }
        appliedSnapshotAtRef.current = Math.max(appliedSnapshotAtRef.current, snapshot.generatedAt);
        setProduct(next);
        currentModalTrace()?.mark('reassessment_listener_end', 'ok');
      });
    });
  }, [barcode]);

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

  // Initialize values store (parked for MVP — preferences must not revive legacy insights cards)
  useEffect(() => {
    if (isMvpLegacyAlertsInsightsEnabled()) {
      alertsPreferences.initializeStore();
    }
  }, []);

  // Use TruScore from product object (already calculated in productService.ts using truscoreEngine.ts)
  // Always use product object score for consistency with logs - no fallback recalculation
  // Candidate 3: persisted trust_score fields render only with current Core Truth authority
  // (prevents unstamped manual/legacy objects from presenting as authoritative assessment).
  useEffect(() => {
    if (product) {
      // Use score from product if available (from productService.ts - consistent with logs)
      if (
        hasCoreTruthAuthority(product) &&
        product.trust_score !== null &&
        product.trust_score_breakdown
      ) {
        // S-02: legacy Alerts/MyChoices insights parked for MVP
        let insights: TruScoreResult['insights'] = undefined;
        if (
          isMvpLegacyAlertsInsightsEnabled() &&
          alertsPreferences &&
          (alertsPreferences.geopoliticalEnabled ||
            alertsPreferences.ethicalEnabled ||
            alertsPreferences.environmentalEnabled)
        ) {
          try {
            const generatedInsights = generateInsights(product, alertsPreferences);
            if (generatedInsights && generatedInsights.length > 0) {
              insights = generatedInsights;
            }
          } catch (error) {
            console.warn('[ResultScreen] Error generating insights:', error);
          }
        }
        
        const score: TruScoreResult = {
          truscore: product.trust_score,
          // Null-score integrity: an unavailable pillar stays null end-to-end into TruScore.
          // A genuine 0 stays 0; nothing is coerced, so no pillar can surface as a fabricated 0/25.
          breakdown: resultPillarBreakdown(product.trust_score_breakdown),
          hasNutriScore: product._truscore_metadata?.hasNutriScore,
          hasEcoScore: product._truscore_metadata?.hasEcoScore,
          hasOrigin: product._truscore_metadata?.hasOrigin,
          insights,
          // Governed fired-adjustment ledger from the same scoring run — the only input the
          // Score Highlights selection engine reads (W3-S12/S12a).
          analysis: product._truscore_analysis,
          // Wave 3 Rateability / Confidence / NR — consumer reveal uses publishedScore.
          publication: product._publication ?? product._truscore_analysis?.publication,
        };
        setTruScore(score);
      } else {
        // If score is missing or product lacks Core Truth authority, do not render assessment UI
        setTruScore(null);
      }
    } else {
      setTruScore(null);
    }
  }, [product, alertsPreferences]);

  /**
   * W3-S12 / W3-S12a governed Score Highlights.
   *
   * Derived only from the fired adjustment ledger produced by the scoring run that set this
   * product's score. No raw-field re-evaluation and no adjustment-description matching.
   */
  const scoreHighlightsLedger = useMemo(
    () => firedLedgerFromTruScoreResult(truScore),
    [truScore]
  );

  const scoreHighlights = useMemo(() => {
    if (!scoreHighlightsLedger) return null;
    return selectScoreHighlights(scoreHighlightsLedger, {
      additivesL3Available: true,
      productOriginsL3Available: true,
    });
  }, [scoreHighlightsLedger]);

  const detectedBodyAdditiveIds = useMemo(() => {
    if (!scoreHighlightsLedger) return [];
    return scoreHighlightsLedger
      .filter(
        (row) =>
          row.pillar === 'Body' &&
          typeof row.id === 'string' &&
          row.id.startsWith('body-v12-additive-')
      )
      .map((row) => row.id as string);
  }, [scoreHighlightsLedger]);

  const s25Merged = useMemo(() => {
    return mergeRenderedAdditives({
      firedBodyLedgerIds: detectedBodyAdditiveIds,
      ingredientsText: product?.ingredients_text ?? null,
      additivesTags: product?.additives_tags ?? null,
    });
  }, [detectedBodyAdditiveIds, product?.ingredients_text, product?.additives_tags]);

  const openScoreHighlightsPillar = useCallback((pillar: ScoreHighlightPillar) => {
    setScoreHighlightsRequest({ mode: 'pillar', pillar });
  }, []);

  const openScoreHighlightStory = useCallback((story: ScoreHighlightStory) => {
    setScoreHighlightsRequest({ mode: 'detail', story });
  }, []);

  const closeAboutAdditivesToResult = useCallback(() => {
    setAboutAdditivesSession({ visible: false, caller: 'result', focusAdditiveIds: [] });
    setAboutAdditivesBodyRestore(null);
    setAboutAdditivesOpenRestore(null);
  }, []);

  const backFromAboutAdditives = useCallback(() => {
    const caller = aboutAdditivesSession.caller;
    setAboutAdditivesSession({ visible: false, caller: 'result', focusAdditiveIds: [] });
    if (caller === 'body' && aboutAdditivesBodyRestore) {
      const restore = aboutAdditivesBodyRestore;
      setAboutAdditivesBodyRestore(null);
      requestAnimationFrame(() => setScoreHighlightsRequest(restore));
      return;
    }
    if (caller === 'open' && aboutAdditivesOpenRestore) {
      const restore = aboutAdditivesOpenRestore;
      setAboutAdditivesOpenRestore(null);
      requestAnimationFrame(() => setGovernedL3Request(restore));
    }
  }, [aboutAdditivesSession.caller, aboutAdditivesBodyRestore, aboutAdditivesOpenRestore]);

  const openAboutAdditivesFromResult = useCallback(() => {
    setAboutAdditivesBodyRestore(null);
    setAboutAdditivesOpenRestore(null);
    setAboutAdditivesSession({
      visible: true,
      caller: 'result',
      focusAdditiveIds: [],
    });
  }, []);

  const openAboutAdditivesFromOpen = useCallback(
    (additiveId?: string) => {
      if (governedL3Request) {
        setAboutAdditivesOpenRestore(governedL3Request);
        setGovernedL3Request(null);
      }
      requestAnimationFrame(() => {
        setAboutAdditivesSession({
          visible: true,
          caller: 'open',
          focusAdditiveIds: additiveId ? [additiveId] : [],
        });
      });
    },
    [governedL3Request]
  );

  const mapClaimsHighNutrientsToFocus = useCallback(
    (metadata?: Record<string, string | number | boolean>): NutritionDetailsFocusTarget => {
      const raw = metadata?.high_nutrients;
      if (typeof raw !== 'string' || !raw.trim()) return null;
      const labels = raw.split('|').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const map: Record<string, 'totalSugars' | 'saturatedFat' | 'sodium'> = {
        'total sugars': 'totalSugars',
        'saturated fat': 'saturatedFat',
        sodium: 'sodium',
      };
      const keys: Array<'totalSugars' | 'saturatedFat' | 'sodium'> = [];
      for (const label of labels) {
        const key = map[label];
        if (key && !keys.includes(key)) keys.push(key);
      }
      if (keys.length === 0) return null;
      return keys.length === 1 ? keys[0] : keys;
    },
    []
  );

  const openInAppScoreHighlightL3 = useCallback(
    (route: Extract<ScoreHighlightL3Route, { kind: 'in_app' }>, story: ScoreHighlightStory) => {
      const plan = planInAppL3HostPresentation(route.target as ScoreHighlightL3InAppTarget);
      // Dismiss look-through first so L3 never stacks a second native Modal underneath it.
      if (plan.dismissLookThrough) {
        if (plan.present === 'additives') {
          // Preserve Body L2 so Back can restore the exact launching story.
          setAboutAdditivesBodyRestore({ mode: 'detail', story });
        }
        setScoreHighlightsRequest(null);
      }
      requestAnimationFrame(() => {
        if (plan.present === 'additives') {
          const focusAdditiveIds = (story.boundAdjustmentIds || [])
            .map((id) => mapBodyLedgerIdToCanonical(id))
            .filter((id): id is string => Boolean(id));
          setAboutAdditivesSession({
            visible: true,
            caller: 'body',
            focusAdditiveIds,
          });
          return;
        }
        if (plan.present === 'product_origins') {
          resultScrollRef.current?.scrollTo({
            y: Math.max(0, productOriginsOffsetYRef.current - 12),
            animated: true,
          });
          return;
        }
        if (plan.present === 'nutrition_details') {
          setNutritionDetailsFocus(mapClaimsHighNutrientsToFocus(story.metadata));
          setNutritionDetailsVisible(true);
          return;
        }
        setGovernedL3Request({
          target: route.target as ScoreHighlightL3InAppTarget,
          story,
        });
      });
    },
    [mapClaimsHighNutrientsToFocus]
  );

  // Primary product/TruScore result — never gated on Dynamic Signals evaluation.
  // NA-003 Candidate 2: productForScan requires Core Truth authority (defence-in-depth).
  const primaryScanResult = useMemo(() => {
    const primaryBc = getPrimaryBarcode(barcode);
    const productForScan = authoritativeProductForScan(product, barcode);
    if (!productForScan && !error) {
      return null;
    }
    const country = getUserCountryCode();
    return buildProductScanResult({
      barcode: primaryBc,
      product: productForScan,
      userPreferences: alertsPreferences,
      isSubscriber: isPremium,
      market: country,
      dynamicSignalRecords: [],
      deriveTerminal: true,
      fetchPhase: loadingPhase,
      isFetchLoading: loading,
      isOffline,
      loadError: error,
      errors: error ? [{ code: 'product_load', message_key: 'errors.product_load' }] : undefined,
      scan_id: scanIdRef.current,
    }).result;
  }, [
    product,
    barcode,
    error,
    isOffline,
    isPremium,
    alertsPreferences,
    loading,
    loadingPhase,
  ]);

  // Attach Signals when progressive evaluation completes — TruScore preserved by reference.
  const scanResult = useMemo(() => {
    if (!primaryScanResult) return null;
    if (!dynamicSignalRecords.length) return primaryScanResult;
    return attachDynamicSignalRecordsToScanResult(primaryScanResult, dynamicSignalRecords);
  }, [primaryScanResult, dynamicSignalRecords]);

  useEffect(() => {
    const sid = scanIdRef.current;
    if (!sid || !primaryScanResult || !product) return;
    if (getPrimaryBarcode(product.barcode) !== getPrimaryBarcode(barcode)) return;
    const readyKey = `${sid}|${getPrimaryBarcode(barcode)}`;
    if (productResultReadyLoggedRef.current === readyKey) return;
    productResultReadyLoggedRef.current = readyKey;
    logScanObs({
      event: 'product_result_ready',
      scan_id: sid,
      barcode,
      trust_score: product.trust_score ?? null,
      terminal_state: primaryScanResult.terminal_state,
    });
  }, [primaryScanResult, product, barcode]);

  // Progressive Signals — after primary is available. Re-run only when material
  // reviewed identity (or market / producer) changes — not on harmless
  // product_enhanced completeness merges.
  // NA-003 Candidate 2: Signals / identity / Chaining inputs require Core Truth authority.
  const signalsEvalContext = useMemo(() => {
    const primaryBc = getPrimaryBarcode(barcode);
    const productForScan = authoritativeProductForScan(product, barcode);
    if (!productForScan) return null;
    const country = getUserCountryCode();
    const scanMarketPublic = resolveSharedIdentityContext({
      gtin: primaryBc,
      product: productForScan,
      marketHint: country,
    }).public_market;
    const producerLogs: string[] = [];
    const producer = resolveActiveSignalsProducer(producerLogs);
    const identityState = resolveMaterialRetailIdentityStateForAsset({
      barcode: primaryBc,
      product: productForScan,
    });
    const evalKey = dynamicSignalsEvaluationKey({
      barcode: primaryBc,
      scanMarketPublic,
      foodRecallMarkings: null,
      producerActive: producer === 'asset',
      identityState,
    });
    return {
      evalKey,
      barcode: primaryBc,
      product: productForScan,
      productName: productNameForSignalsIdentity(productForScan),
      scanMarketPublic,
      producerLogs,
    };
  }, [product, barcode]);

  latestSignalsEvalKeyRef.current = signalsEvalContext?.evalKey ?? null;
  signalsEvalContextRef.current = signalsEvalContext;

  useEffect(() => {
    const ctx = signalsEvalContextRef.current;
    if (!ctx) {
      // NA-022: Core Truth authority loss collapses eval context — clear stale Signal cards.
      setDynamicSignalRecords([]);
      setSignalsReadyOutcome(null);
      signalsEvalKeyRef.current = null;
      return;
    }

    const evalKey = ctx.evalKey;
    if (signalsEvalKeyRef.current === evalKey) return;
    if (signalsInFlightKeyRef.current === evalKey) return;
    signalsInFlightKeyRef.current = evalKey;

    let cancelled = false;
    const {
      barcode: primaryBc,
      product: productForScan,
      productName,
      scanMarketPublic,
      producerLogs,
    } = ctx;
    const assetLogs: string[] = [...producerLogs];

    void (async () => {
      const evaluated = await evaluateDynamicSignalsAssetProgressive({
        barcode: primaryBc,
        productName,
        product: productForScan,
        scanMarketPublic,
        logLines: assetLogs,
      });
      const stale = !shouldCommitDynamicSignalsEvaluation({
        evaluationKey: evalKey,
        currentEvaluationKey: latestSignalsEvalKeyRef.current,
        cancelled,
      });
      if (stale) {
        if (signalsInFlightKeyRef.current === evalKey) {
          signalsInFlightKeyRef.current = null;
        }
        return;
      }
      signalsEvalKeyRef.current = evalKey;
      signalsInFlightKeyRef.current = null;
      if (assetLogs.length > 0) {
        console.log('[Dynamic Signals Asset v0.2]', { barcode: primaryBc, logs: assetLogs });
      }
      setDynamicSignalRecords(evaluated.records);
      setSignalsReadyOutcome(evaluated.outcome);
      const sid = scanIdRef.current;
      if (sid) {
        logScanObs({
          event: 'signals_ready',
          scan_id: sid,
          barcode: primaryBc,
          trust_score: productForScan.trust_score ?? null,
          signals_outcome: evaluated.outcome,
          signal_counts: {
            publication_records: evaluated.records.length,
            safety_regulatory: evaluated.records.filter((r) => r.signal_class === 'safety_regulatory')
              .length,
            in_the_news: evaluated.records.filter((r) => r.signal_class === 'in_the_news').length,
          },
        });
      }
      if (evaluated.outcome === 'failed') {
        console.warn('[Dynamic Signals Asset v0.2] evaluation failed (contained)', {
          barcode: primaryBc,
          error: evaluated.error_message,
        });
      }
    })();

    return () => {
      cancelled = true;
      if (signalsInFlightKeyRef.current === evalKey) {
        signalsInFlightKeyRef.current = null;
      }
    };
  }, [signalsEvalContext?.evalKey]);

  // Silence unused-state lint until UI surfaces progressive outcome.
  void signalsReadyOutcome;

  const bannerAlerts: BannerAlertsData | null = useMemo(() => {
    if (!scanResult) return null;
    return buildBannerAlertsDataFromScanResult(scanResult, t);
  }, [scanResult, t]);

  useEffect(() => {
    const sid = scanIdRef.current;
    if (!sid || !product) return;
    if (getPrimaryBarcode(product.barcode) !== getPrimaryBarcode(barcode)) return;
    logScanObs({
      event: 'score_ready',
      scan_id: sid,
      barcode,
      trust_score: product.trust_score ?? null,
      terminal_state: scanResult?.terminal_state,
    });
  }, [product?.trust_score, product?.barcode, barcode, product, scanResult?.terminal_state]);

  // Must stay above loading/error early returns — otherwise product-ready renders call one more hook.
  const heroImageUrl =
    product?.image_front_small_url || product?.image_front_url || product?.image_url || null;
  useEffect(() => {
    const url = heroImageUrl?.trim();
    if (!url) return;
    ExpoImage.prefetch(url).catch(() => {
      // Prefetch is best-effort; hero still loads on mount with existing fallbacks.
    });
  }, [heroImageUrl]);

  const acceptProductUpdate = async (next: ProductWithTrustScore): Promise<boolean> => {
    const remembered = await rememberedAuthoritativeSnapshot(barcode);
    const incomingAt = remembered?.generatedAt ?? 0;
    if (!authoritativeStateSupersedes(appliedSnapshotAtRef.current, incomingAt)) {
      return false;
    }
    const projected = remembered
      ? await calculateTrustScore(next, { authoritativeSnapshot: remembered })
      : next;
    const latest = await rememberedAuthoritativeSnapshot(barcode);
    if (latest && latest.generatedAt !== remembered?.generatedAt) {
      if (!authoritativeStateSupersedes(appliedSnapshotAtRef.current, latest.generatedAt)) return false;
      const refreshed = await calculateTrustScore(next, { authoritativeSnapshot: latest });
      if (!authoritativeStateSupersedes(appliedSnapshotAtRef.current, latest.generatedAt)) return false;
      appliedSnapshotAtRef.current = Math.max(appliedSnapshotAtRef.current, latest.generatedAt);
      if (publicationSettledRef.current && refreshed._assessmentCycleSettled === false) return false;
      if (refreshed._assessmentCycleSettled === true) {
        publicationSettledRef.current = true;
        setPublicationSettled(true);
        settledForBarcodeRef.current = barcode;
      }
      setProgressiveProduct(refreshed);
      setProduct(refreshed);
      return true;
    }
    if (!authoritativeStateSupersedes(appliedSnapshotAtRef.current, incomingAt)) return false;
    if (remembered) appliedSnapshotAtRef.current = Math.max(appliedSnapshotAtRef.current, remembered.generatedAt);
    if (publicationSettledRef.current && projected._assessmentCycleSettled === false) {
      return false;
    }
    if (projected._assessmentCycleSettled === true) {
      publicationSettledRef.current = true;
      setPublicationSettled(true);
      settledForBarcodeRef.current = barcode;
    }
    setProgressiveProduct(projected);
    setProduct(projected);
    return true;
  };

  const loadProduct = async () => {
    const preserveSettledPublication = shouldPreserveSettledResultOnLoadMiss({
      publicationSettled: publicationSettledRef.current,
      settledBarcode: settledForBarcodeRef.current,
      requestBarcode: barcode,
    });

    setLoading(true);
    setError(null);
    // Network/offline reruns for an already settled barcode must not flip Checking.
    if (!preserveSettledPublication) {
      publicationSettledRef.current = false;
      setPublicationSettled(false);
    }

    try {
      console.log('[ResultScreen] Loading product for barcode:', barcode, 'Platform:', Platform.OS);
      
      // Validate barcode
      if (!barcode || typeof barcode !== 'string' || !/^\d{8,14}$/.test(barcode)) {
        console.error('[ResultScreen] Invalid barcode:', barcode);
        setError('Invalid barcode format');
        setLoadingPhase('not_found');
        setLoading(false);
        return;
      }
      
      // First check if this is a manually added product
      try {
        const manualProduct = await getManualProduct(barcode);
        if (manualProduct) {
          console.log('[ResultScreen] Found manual product');
          if (scanIdRef.current) {
            logScanObs({
              event: 'fetch_complete',
              scan_id: scanIdRef.current,
              barcode,
              trust_score: manualProduct.trust_score ?? null,
            });
          }
          setProduct(manualProduct);
          setLoadingPhase('complete');
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
      let lastFetchPhase = 'initializing';
      
      // ULTRA-FAST: Progress callback for instant product display
      // Product displays immediately (< 100ms) even before TruScore is calculated
      const onProgress = (progress: { phase: string; product?: Product }) => {
        lastFetchPhase = progress.phase;
        setLoadingPhase(progress.phase);
        if (scanIdRef.current) {
          logScanObs({
            event: 'fetch_phase',
            scan_id: scanIdRef.current,
            barcode,
            phase: progress.phase,
          });
        }
        if (progress.product) {
          // Convert Product to ProductWithTrustScore if needed
          const productWithScore = progress.product as ProductWithTrustScore;

          // NA-003 Candidate 2: never promote unstamped progressive payloads into Result state.
          if (!hasCoreTruthAuthority(productWithScore)) {
            console.warn(
              '[ResultScreen] Ignoring unstamped progressive product (Core Truth authority required)'
            );
            return;
          }
          
          void (async () => {
            if (!(await acceptProductUpdate(productWithScore))) {
              return;
            }
            setLoading(false);
            console.log(`[ResultScreen] ⚡ INSTANT display: ${progress.phase}`, productWithScore.product_name,
              `TruScore: ${productWithScore.trust_score || 'calculating...'}`,
              `settled=${productWithScore._assessmentCycleSettled === true}`);
            if (progress.phase === 'product_enhanced') {
              const traceLen = productWithScore._truscore_analysis?.fetchTrace?.length ?? 0;
              console.log(`[ResultScreen] ✅ Product enhanced (merge complete): TruScore ${productWithScore.trust_score}, fetch trace: ${traceLen} source(s) – Score breakdown reflects all DBs used`);
            }
            if (progress.phase === 'product_refined') {
              console.log(
                `[ResultScreen] ✅ Assessment cycle settled: ${productWithScore._assessmentCycleSettleReason ?? 'unknown'}`
              );
            }
            if (progress.phase === 'complete') {
              console.log(`[ResultScreen] ✅ Product complete with TruScore: ${productWithScore.trust_score}`);
            }
          })();
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
            // NA-003 Candidate 2: createMinimalProduct no longer releases a Product object.
            productData = createMinimalProduct(barcode);
          }
          // Defence: never accept unstamped fallback as Result product state.
          if (productData && !hasCoreTruthAuthority(productData)) {
            console.warn(
              '[ResultScreen] Fallback product lacks Core Truth authority — treating as unavailable'
            );
            productData = null;
          }
        } catch (fallbackError) {
          console.error('[ResultScreen] Fallback also failed:', fallbackError);
          productData = null;
        }
      }
      
      if (productData) {
        if (!hasCoreTruthAuthority(productData)) {
          console.warn(
            '[ResultScreen] Fetched product lacks Core Truth authority — treating as unavailable'
          );
          productData = null;
        }
      }

      if (productData) {
        console.log('[ResultScreen] Product fetched successfully');
        if (scanIdRef.current) {
          logScanObs({
            event: 'fetch_complete',
            scan_id: scanIdRef.current,
            barcode,
            trust_score: productData.trust_score ?? null,
          });
        }
        // Prefer acceptProductUpdate so a late unsettled return cannot overwrite a settled refine.
        await acceptProductUpdate(productData);
        setLoadingPhase('complete');
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
        if (preserveSettledPublication) {
          // Late same-barcode network/offline rerun returned no product — keep published Result.
          console.warn(
            '[ResultScreen] Ignoring load miss after settled publication (network rerun)'
          );
          setLoadingPhase('complete');
          setLoading(false);
          return;
        }
        if (lastFetchPhase === 'retrieval_error') {
          console.warn('[ResultScreen] retrieval_error — not conflated with not_found');
          if (scanIdRef.current) {
            logScanObs({
              event: 'retrieval_error',
              scan_id: scanIdRef.current,
              barcode,
              phase: 'retrieval_error',
            });
          }
          try {
            removeLegacyProvisionalScan(barcode);
          } catch (scanError) {
            console.warn('[ResultScreen] Error removing legacy provisional scan from history:', scanError);
          }
          setError(null);
          setLoadingPhase('retrieval_error');
        } else {
          console.warn('[ResultScreen] Product not found');
          try {
            removeLegacyProvisionalScan(barcode);
          } catch (scanError) {
            console.warn('[ResultScreen] Error removing legacy provisional scan from history:', scanError);
          }
          setError('Product not found in our databases. You can help by adding this product manually.');
          setLoadingPhase('not_found');
        }
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
      if (!productData || productData._assessmentCycleSettled !== true) return;
      const accepted = await acceptProductUpdate(productData);
      if (accepted) setLoadingPhase('complete');
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
  const handleShare = (
    cardType:
      | 'truScore'
      | 'countryOfManufacture'
      | 'negativeTruScore'
      | 'productInfo'
      | 'insights'
      | 'palmOil'
      | 'nutrition'
      | 'ingredients'
      | 'processing'
      | 'allergens'
      | 'ecoscore'
  ) => {
    if (!product) return;

    setShareInitialMessage('');
    setShareType(cardType);
    setShareModalVisible(true);
  };

  const openContribution = (entry: ContributionEntryContext) => {
    setContributionEntry(entry);
    setIngredientNutritionSheetVisible(false);
    setPacketContributionVisible(true);
  };

  const showContributionNotice = (message: string) => {
    setContributionNotice(message);
    setTimeout(() => setContributionNotice(null), message.includes('ctr_') ? 30000 : 4000);
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
    const isRetrievalError = loadingPhase === 'retrieval_error';
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.unknownProductContainer}
        >
          <View style={styles.unknownProductContent}>
            <Ionicons name="barcode-outline" size={80} color={colors.textTertiary} />
            <Text style={[styles.errorTitle, { color: colors.text, marginTop: 24 }]}>
              {isRetrievalError
                ? t('result.retrievalErrorTitle')
                : t('result.productUnknown') || 'Unknown Product'}
            </Text>
            <Text style={[styles.errorText, { color: colors.textSecondary, marginTop: 12, marginBottom: 8 }]}>
              {isRetrievalError
                ? t('result.retrievalErrorMessage')
                : t('result.unknownProductMessage') || 'We couldn\'t find detailed information about this product in our databases.'}
            </Text>
            <Text style={[styles.barcodeText, { color: colors.textTertiary, marginBottom: 32 }]}>
              Barcode: {barcode}
            </Text>
            
            {!isRetrievalError && (
            <>
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
              onPress={() => navigateToScanHome(navigation)}
            >
              <Text style={[styles.backButtonText, { color: colors.primary }]}>
                {t('result.scanAnother') || 'Scan Another Product'}
              </Text>
            </TouchableOpacity>
            </>
            )}

            {isRetrievalError && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigateToScanHome(navigation)}
            >
              <Text style={[styles.backButtonText, { color: colors.primary }]}>
                {t('result.scanAnother') || 'Scan Another Product'}
              </Text>
            </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        
        {/* Manual Product Entry Modal */}
        {!isRetrievalError && (
        <ManualProductEntryModal
          visible={manualProductModalVisible}
          onClose={() => setManualProductModalVisible(false)}
          onSave={handleManualProductSave}
          barcode={barcode}
        />
        )}
      </SafeAreaView>
    );
  }

  const originsCard = productOriginsCardPresentation(product);
  // UAT interim mitigation (F): prefer small front image for hero; fall back to full.
  const imageUrl =
    product.image_front_small_url || product.image_front_url || product.image_url || null;
  const isWebSearchProduct = isWebSearchFallback(product);

  const contributionActions = resultContributionActions(product);

  const shareManufacturingCountryLabel = (() => {
    const raw = originsCard.offCountry || originsCard.facts.flatMap((fact) => fact.countries)[0];
    if (!raw) return undefined;
    const cleaned = sanitizeCountryForDisplay(raw);
    return cleaned || undefined;
  })();
  
  const productPageAlertsInsights = getProductPageAlertsInsights(hasAlertsMasterEnabled, truScore);

  const handleCaptureImage = async (imageUri: string) => {
    if (!product) return;

    try {
      console.log('[ResultScreen] handleCaptureImage — upload + Vercel share');

      const contributionBarcode = getPrimaryBarcode(barcode);
      const photoResult = await uploadProductPhoto(contributionBarcode, imageUri, 'front');
      const publicUrl =
        photoResult.vercelUrl ||
        photoResult.openFoodFactsUrl ||
        null;

      if (!publicUrl || !photoResult.success) {
        console.warn('[ResultScreen] Photo upload did not return a public URL', photoResult);
        Toast.show({
          type: 'error',
          text1: t('result.photoError') || 'Upload failed',
          text2:
            t('result.photoUploadNeedNetwork') ||
            'Could not save your photo. Check your connection and try again.',
          position: 'bottom',
        });
        return;
      }

      const updatedProduct = {
        ...product,
        image_url: publicUrl,
        image_front_url: publicUrl,
      };
      setProduct(updatedProduct);

      try {
        await cacheProduct(updatedProduct as Product, isPremium);
      } catch (cacheErr) {
        console.error('[ResultScreen] cache after photo:', cacheErr);
      }

      const productData: ManualProductData = {
        barcode: contributionBarcode,
        product_name: product.product_name || product.product_name_en || 'Unknown Product',
        brands: product.brands,
        ingredients_text: product.ingredients_text,
        image_url: publicUrl,
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

      const saveResult = await saveManualProduct(productData);

      if (saveResult) {
        Toast.show({
          type: 'success',
          text1: t('result.photoSubmitted') || 'Photo submitted',
          text2:
            t('result.photoSubmittedMessage') ||
            'Your photo is stored and will appear for other users who scan this product.',
          position: 'bottom',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: t('result.photoSaved') || 'Photo on device',
          text2:
            t('result.photoSavedNotSynced') ||
            'Image uploaded but product record may not have synced. Pull to refresh later.',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('[ResultScreen] Error submitting photo:', error);
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
        ref={resultScrollRef}
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <ProductDisclaimerCard />
        <ProductHeroSection
          colors={colors}
          darkMode={!!darkMode}
          imageUrl={imageUrl}
          productName={product.product_name || product.product_name_en || t('result.productUnknown')}
          brandText={product.brands ? sanitizeText(product.brands, 200) : null}
          isUserContributed={isUserContributed}
          onTakePhoto={() => setCameraModalVisible(true)}
          takePhotoLabel={t('result.takePhoto')}
          userContributedLabel={t('manualProduct.userContributed')}
          heroImageA11y={t('result.heroImageA11y')}
          expandHint={t('result.heroImageExpandHint')}
          loadErrorLabel={t('result.heroImageLoadError')}
          retryLabel={t('result.heroImageRetry')}
          closeLightboxLabel={t('result.heroImageCloseLightbox')}
        />

        {/* Banner Alerts Card - Above TruScore */}
        {/* Loaded asynchronously to not block product display */}
        {bannerAlerts && bannerAlerts.hasAlerts && (
          <BannerAlertsCard 
            alertsData={bannerAlerts}
          />
        )}

        {scanResult?.terminal_state === 'partial' && (
          <View
            style={[styles.partialScanBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
            accessible
            accessibilityLabel={`${t('result.analysisPartialTitle')}. ${t('result.analysisPartialSubtitle')}`}
          >
            <Ionicons name="time-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.partialScanTitle, { color: colors.text }]}>
                {t('result.analysisPartialTitle')}
              </Text>
              <Text style={[styles.partialScanSubtitle, { color: colors.textSecondary }]}>
                {t('result.analysisPartialSubtitle')}
              </Text>
            </View>
          </View>
        )}

        {/* TruScore Card - v1.4. W3-S27 only via info glyph; Confidence badge opens W3-S26. */}
        {truScore ? (
          <View
            style={[styles.card, { 
              backgroundColor: colors.card,
              borderColor: getTruScoreColor(truScore.truscore),
              borderWidth: 2,
            }]}
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
                  accessibilityRole="button"
                  accessibilityLabel="Understanding Rveel Score"
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
            <Text style={[styles.cardTitle, { color: colors.text }]}>{productIdentity.publicScoreName}</Text>
          </View>
          
          {/* TruScore Display - v1.4. Pillar rows open the W3-S12a look-through. */}
          <TruScore
            truScore={truScore}
            size="medium"
            onPillarPress={scoreHighlights ? openScoreHighlightsPillar : undefined}
            publicationSettled={publicationSettled}
          />

          {/* S28 — founder/UAT only when build-entitled AND Settings Score diagnostics On */}
          {showScoreDiagnostics && (
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
          )}
          
          {/* W3-S11 Confidence — opens Overall W3-S26 (not W3-S27) */}
          {product && product._publication && (
            <View style={styles.confidenceBadgeContainer}>
              <ConfidenceBadge
                product={product}
                size="small"
                publicationSettled={publicationSettled}
                onPress={() => setS26OpenRequestKey((k) => k + 1)}
              />
            </View>
          )}

          {/* W3-S12 "What we found" — governed promoted stories from the fired ledger */}
          {scoreHighlights && scoreHighlights.promoted.length > 0 && (
            <View style={[styles.reasonsContainer, { borderTopColor: colors.border }]}>
              <ScoreHighlightsList
                stories={scoreHighlights.promoted}
                onSelectStory={openScoreHighlightStory}
              />
            </View>
          )}
        </View>
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

        {/* User alerts — only when user enabled alert categories and there is insight content */}
        {productPageAlertsInsights && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderWidth: 2,
                  borderColor: '#ff6b6b',
                },
              ]}
            >
              <View style={[styles.insightsHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.insightsHeaderLeft}
                  onPress={() => setInsightsExpanded(!insightsExpanded)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="heart-outline" size={20} color="#ff6b6b" />
                  <Text
                    style={[styles.insightsHeaderTitle, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {t('result.alertsPreference')}
                  </Text>
                  <Text style={[styles.insightsHeaderCount, { color: colors.textSecondary }]}>
                    ({productPageAlertsInsights.length})
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
              {insightsExpanded ? (
                <View style={styles.alertsPreferenceBody}>
                  <InsightsCarousel
                    insights={productPageAlertsInsights}
                    productName={product?.product_name || product?.product_name_en}
                    onRequestProductShare={() => handleShare('insights')}
                  />
                </View>
              ) : null}
            </View>
          )}

        {contributionNotice ? (
          <Text style={{ marginHorizontal: 16, marginBottom: 12, color: colors.text }}>{contributionNotice}</Text>
        ) : null}

        {/* Nutrition Facts — card body opens Nutrition Details; pencil opens applicable updates */}
          <NutritionTable
            nutriments={product.nutriments}
            categoriesTags={product.categories_tags}
            servingSize={product.serving_size}
            productName={product.product_name || product.product_name_en}
            genericName={product.generic_name}
            quantity={product.quantity}
            productQuantity={product.product_quantity}
            productQuantityUnit={product.product_quantity_unit}
            servingQuantity={product.serving_quantity}
            servingQuantityUnit={product.serving_quantity_unit}
            nutritionDataPer={product.nutrition_data_per}
            nutritionDataPreparedPer={product.nutrition_data_prepared_per}
            onShare={() => handleShare('nutrition')}
            onEdit={
              contributionActions.updateNutrition || contributionActions.updateIngredients
                ? () => setIngredientNutritionSheetVisible(true)
                : undefined
            }
            shareContext={{
              productName: product.product_name || product.product_name_en || '',
              barcode: product.barcode,
            }}
            onRequestNutritionSharePrefill={(prefill) => {
              setShareType('nutrition');
              setShareInitialMessage(prefill);
              setShareModalVisible(true);
            }}
            detailsVisible={nutritionDetailsVisible}
            onDetailsVisibleChange={(v) => {
              setNutritionDetailsVisible(v);
              if (!v) setNutritionDetailsFocus(null);
            }}
            initialDetailsFocus={nutritionDetailsFocus}
            title={t('result.nutritionAndIngredients', 'Nutrition & Ingredients')}
            afterBurn={
              <>
                {product.rveelPacketNutritionStatus ? (
                  <Text style={{ color: colors.text, marginBottom: 8 }}>{product.rveelPacketNutritionStatus}</Text>
                ) : null}
                <ResultIngredientsSection
                  barcode={barcode}
                  ingredientsText={product.rveelGovernedIngredientsText || product.ingredients_text}
                  novaGroup={product.nova_group}
                  showAddIngredients={contributionActions.addIngredients}
                  showUpdateIngredients={contributionActions.updateIngredients}
                  onAddIngredients={() => openContribution('ingredients')}
                  onUpdateIngredients={() => openContribution('ingredients')}
                  onShareIngredients={() => handleShare('ingredients')}
                  onShareProcessing={() => handleShare('processing')}
                  onOpenProcessingLevel={() => setProcessingLevelModalVisible(true)}
                />
                {contributionActions.addNutrition ? (
                  <TouchableOpacity
                    onPress={() => openContribution('nutrition')}
                    style={[styles.certificationsUpdateButton, { borderColor: '#16a085' }]}
                    accessibilityRole="button"
                    accessibilityLabel="Add nutrition"
                  >
                    <Text style={[styles.certificationsUpdateButtonText, { color: '#16a085' }]}>Add nutrition</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            }
          />

        <AboutTheseAdditivesCard
          count={s25Merged.renderedAdditiveIds.length}
          onPress={openAboutAdditivesFromResult}
        />

        {/* Country of Manufacture — governed Product Origins surface (Open Origins L3 deep-link) */}
        <View
          onLayout={(e) => {
            productOriginsOffsetYRef.current = e.nativeEvent.layout.y;
          }}
        >
        <View style={[styles.card, { backgroundColor: colors.card, borderWidth: 2, borderColor: '#16a085' }]}>
          <View style={styles.cardHeaderTop}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="globe-outline" size={24} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
                {t('result.productOrigins', 'Product Origins')}
              </Text>
            </View>
            {originsCard.offCountry || originsCard.facts.length > 0 ? (
              <TouchableOpacity
                onPress={() => handleShare('countryOfManufacture')}
                style={styles.shareButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Share product origins"
              >
                <Ionicons name="share-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => setProductOriginsExplainerVisible(true)}>
            <Text style={{ color: colors.primary }}>L1 / L2 / L3</Text>
          </TouchableOpacity>
          {originsCard.offCountry ? (
            <View style={styles.originContainer}>
              <CountryFlag country={originsCard.offCountry} />
            </View>
          ) : null}
          {originsCard.facts.map((fact) => (
            <View key={fact.evidenceId}>
              <Text style={{ color: colors.text }}>{formatGovernedOriginFactLine(fact)}</Text>
              {fact.countries.map((country) => (
                <View key={`${fact.evidenceId}-${country}`} style={styles.originContainer}>
                  <CountryFlag country={country} />
                </View>
              ))}
            </View>
          ))}
          {product._publication?.transparency.confidence === 'high' ? (
            <Text style={{ color: colors.textSecondary }}>High confidence</Text>
          ) : null}
          {product._publication?.transparency.confidence === 'moderate' ? (
            <Text style={{ color: colors.textSecondary }}>Moderate confidence</Text>
          ) : null}
          {product._publication?.transparency.confidence === 'limited' ? (
            <Text style={{ color: colors.textSecondary }}>Limited confidence</Text>
          ) : null}
          {contributionActions.originsAction === 'add' ? (
            <TouchableOpacity
              onPress={() => openContribution('origins')}
              accessibilityRole="button"
              accessibilityLabel="Add product origins"
            >
              <Text style={{ color: colors.primary }}>Add product origins</Text>
            </TouchableOpacity>
          ) : null}
          {contributionActions.originsAction === 'complete' ? (
            <TouchableOpacity
              onPress={() => openContribution('origins')}
              accessibilityRole="button"
              accessibilityLabel="Complete product origins"
            >
              <Text style={{ color: colors.primary }}>Complete product origins</Text>
            </TouchableOpacity>
          ) : null}
          {contributionActions.originsAction === 'update' ? (
            <TouchableOpacity
              onPress={() => openContribution('origins')}
              accessibilityRole="button"
              accessibilityLabel="Update product origins"
            >
              <Text style={{ color: colors.primary }}>Update product origins</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        </View>

        {/* Packet Claims */}
        <View
          style={[
            styles.card,
            styles.certificationsCardFrame,
            {
              backgroundColor: colors.card,
              borderColor: '#16a085',
            },
          ]}
          accessibilityLabel={PACKET_CLAIMS_CARD_TITLE}
        >
          <View style={styles.certificationsCardHeaderRow}>
            <View style={styles.certificationsCardTitleRow}>
              <Ionicons name="shield-checkmark" size={24} color="#16a085" />
              <Text style={[styles.cardTitle, styles.certificationsCardTitleText, { color: colors.text }]}>
                {PACKET_CLAIMS_CARD_TITLE}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setPacketClaimsExplainerVisible(true)}>
            <Text style={{ color: colors.primary }}>L1 / L2 / L3</Text>
          </TouchableOpacity>
          {(product.rveelGovernedPacketClaims || []).map((claim) => (
            <Text key={claim.evidenceId} style={{ color: colors.text }}>
              {claim.exactWording}
            </Text>
          ))}
          {(product._publication?.claims.confidenceReasonCode === 'claims_primary_contribution_limited') ? (
            <Text style={{ color: colors.textSecondary }}>Limited confidence</Text>
          ) : null}
          {product.certifications && product.certifications.length > 0 ? (
            <View style={styles.certificationsContainer}>
              {product.certifications.map((cert) => (
                <CertBadge key={cert.id} certification={cert} />
              ))}
            </View>
          ) : null}
          {(product.rveelGovernedCertifications || []).map((name) => (
            <Text key={name} style={{ color: colors.text }}>
              {name}
            </Text>
          ))}
          {product.rveelPacketAbsenceEstablished ? (
            <Text style={{ color: colors.text }}>{PACKET_ABSENCE_PRODUCT_STATE}</Text>
          ) : null}
          {contributionActions.packetInformationAction ? (
          <TouchableOpacity
            onPress={() => openContribution('packetClaims')}
            activeOpacity={0.7}
            style={[styles.certificationsUpdateButton, { borderColor: '#16a085' }]}
            accessibilityRole="button"
            accessibilityLabel={
              contributionActions.packetInformationAction === 'update'
                ? PACKET_INFORMATION_UPDATE
                : PACKET_INFORMATION_ADD
            }
          >
            <Ionicons name="add-circle-outline" size={20} color="#16a085" />
            <Text style={[styles.certificationsUpdateButtonText, { color: '#16a085' }]}>
              {contributionActions.packetInformationAction === 'update'
                ? PACKET_INFORMATION_UPDATE
                : PACKET_INFORMATION_ADD}
            </Text>
          </TouchableOpacity>
          ) : null}
        </View>

        {/* Palm oil: scored in Planet/TruScore and insights; product card hidden (PalmOilCard). */}
        <PalmOilCard
          product={product ?? undefined}
          onShare={() => handleShare('palmOil')}
          premiumFeatures={[]}
        />

        {/* Price Information — deferred for MVP */}
        {isMvpPricingUiEnabled() ? (
          <UniversalPricingCard
            barcode={barcode}
            productName={product?.product_name || product.product_name_en || undefined}
            product={product}
          />
        ) : null}

        {/* Allergens & Additives — deferred for MVP */}
        {isMvpAllergensUiEnabled() && (product.allergens_tags || product.additives_tags) && (
          <PremiumGate feature={PremiumFeature.ALLERGENS_ADDITIVES}>
            {(() => {
              const hasAllergens = product.allergens_tags && product.allergens_tags.length > 0;
              const hasAdditives = product.additives_tags && product.additives_tags.length > 0;
              const hasDetected = hasAllergens || hasAdditives;
              const redColor = '#ff6b6b';

              const openAllergensModal = () => {
                if (isPremiumFeatureEnabled(PremiumFeature.ALLERGENS_ADDITIVES, subscriptionInfo)) {
                  setAllergensAdditivesModalVisible(true);
                } else {
                  getRootStackNavigation(navigation)?.navigate('Subscription');
                }
              };

              return (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderWidth: hasDetected ? 2 : 0,
                      borderColor: hasDetected ? redColor : 'transparent',
                    },
                  ]}
                >
                  <TouchableOpacity onPress={openAllergensModal} activeOpacity={0.7}>
                  <View style={styles.cardHeader}>
                    {/* Top line: Icons */}
                    <View style={styles.cardHeaderTop}>
                      <View style={styles.cardHeaderLeft}>
                        <Ionicons name="warning" size={24} color={hasDetected ? redColor : colors.primary} />
                      </View>
                      <View style={styles.cardHeaderRight}>
                        <TouchableOpacity
                          onPress={openAllergensModal}
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
                  <TouchableOpacity
                    onPress={openAllergensModal}
                    style={styles.allergensLearnMoreButton}
                    hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                    accessibilityRole="button"
                    accessibilityLabel={t('nutrition.burnLearnMore')}
                  >
                    <Text style={[styles.allergensLearnMoreText, { color: colors.primary }]}>
                      {t('nutrition.burnLearnMore')}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              );
            })()}
          </PremiumGate>
        )}


        <ProductDataLimitationsCard
          product={product}
          onOpenIngredients={() => openContribution('ingredients')}
          onOpenNutrition={() => openContribution('nutrition')}
          onOpenOrigins={() => openContribution('origins')}
          onOpenPacketClaims={() => openContribution('packetClaims')}
          publicationSettled={publicationSettled}
          openRequestKey={s26OpenRequestKey}
        />

        {/* Scan Another Product — bottom of page */}
        <View style={styles.scanAnotherFooter}>
          <TouchableOpacity
            style={[styles.scanAnotherButton, { backgroundColor: colors.primary }]}
            onPress={() => navigateToScanHome(navigation)}
            activeOpacity={0.8}
          >
            <Ionicons name="barcode-outline" size={20} color="#fff" />
            <Text style={styles.scanAnotherButtonText}>
              {t('result.scanAnother') || 'Scan Another Product'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>


      {/* TruScore Info Modal - Only show if we have data */}
      {product &&
        hasCoreTruthAuthority(product) &&
        product.trust_score !== null &&
        product.trust_score_breakdown && (
        <TruScoreInfoModal
          visible={truScoreModalVisible}
          onClose={() => setTruScoreModalVisible(false)}
          product={product}
        />
      )}

      {/* S28 — route/modal guard: only when entitled + toggle On */}
      <TruScoreAnalysisModal
        visible={showScoreDiagnostics && truScoreAnalysisModalVisible}
        onClose={() => setTruScoreAnalysisModalVisible(false)}
        analysis={product?._truscore_analysis}
        publication={product?._publication}
        assessmentCycleSettled={publicationSettled}
        assessmentCycleSettleReason={product?._assessmentCycleSettleReason}
      />

      {/* W3-S12a / L2 shared Score Highlights look-through */}
      <ScoreHighlightsLookThroughModal
        visible={scoreHighlightsRequest != null}
        request={scoreHighlightsRequest}
        selection={scoreHighlights}
        pillarScores={
          truScore
            ? {
                ...truScore.breakdown,
                Ethics:
                  truScore.publication?.claims.publicationStatus === 'rated'
                    ? truScore.publication.claims.publishedScore
                    : null,
              }
            : undefined
        }
        firedAdjustments={scoreHighlightsLedger ?? undefined}
        onClose={() => setScoreHighlightsRequest(null)}
        onOpenInAppL3={openInAppScoreHighlightL3}
      />

      <AboutTheseAdditivesModal
        visible={aboutAdditivesSession.visible}
        onClose={closeAboutAdditivesToResult}
        onBack={backFromAboutAdditives}
        caller={aboutAdditivesSession.caller}
        merged={s25Merged}
        ingredientsText={product?.ingredients_text ?? null}
        focusAdditiveIds={aboutAdditivesSession.focusAdditiveIds}
      />

      <ScoreHighlightsGovernedL3Modal
        visible={governedL3Request != null}
        request={governedL3Request}
        onClose={() => setGovernedL3Request(null)}
        renderedAdditiveIds={s25Merged.renderedAdditiveIds}
        onOpenAboutAdditive={openAboutAdditivesFromOpen}
      />


      {/* Allergens & Additives Modal — deferred for MVP */}
      {isMvpAllergensUiEnabled() &&
        isPremiumFeatureEnabled(PremiumFeature.ALLERGENS_ADDITIVES, subscriptionInfo) && (
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

      <Modal
        visible={ingredientNutritionSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIngredientNutritionSheetVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}
          activeOpacity={1}
          onPress={() => setIngredientNutritionSheetVisible(false)}
        >
          <View style={{ backgroundColor: colors.card, padding: 20, gap: 16 }}>
            {contributionActions.updateNutrition ? (
              <TouchableOpacity onPress={() => openContribution('nutrition')} accessibilityRole="button">
                <Text style={{ color: colors.text, fontSize: 18 }}>Update nutrition</Text>
              </TouchableOpacity>
            ) : null}
            {contributionActions.updateIngredients ? (
              <TouchableOpacity onPress={() => openContribution('ingredients')} accessibilityRole="button">
                <Text style={{ color: colors.text, fontSize: 18 }}>Update ingredients</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>

      <PacketContributionModal
        visible={packetContributionVisible}
        barcode={barcode}
        entryContext={contributionEntry}
        initialIngredients={product?.rveelGovernedIngredientsText || product?.ingredients_text || ''}
        initialNutrition={nutritionPrefillFromSource(
          product?.nutriments as Record<string, unknown> | undefined,
          product?.nutrition_data_per
        )}
        initialOriginContext={originDraftsFromGovernedFacts(product?.rveelGovernedOrigins)}
        knownOffOrigin={originsCard.offCountry}
        onClose={() => setPacketContributionVisible(false)}
        onSharedEvidenceAdmitted={async (snapshot, complete) => {
          const trace = currentModalTrace();
          const traceId = trace?.traceId;
          if (!product) {
            trace?.mark('result_applied', 'none');
            return;
          }
          trace?.mark('reassessment_begin');
          appliedSnapshotAtRef.current = Math.max(appliedSnapshotAtRef.current, snapshot.generatedAt);
          const next = await calculateTrustScore(product, { authoritativeSnapshot: snapshot });
          trace?.mark('reassessment_end', 'ok');
          if (!authoritativeStateSupersedes(appliedSnapshotAtRef.current, snapshot.generatedAt)) {
            trace?.mark('result_applied', 'stale');
            return;
          }
          appliedSnapshotAtRef.current = Math.max(appliedSnapshotAtRef.current, snapshot.generatedAt);
          if (next._assessmentCycleSettled === true) {
            publicationSettledRef.current = true;
            setPublicationSettled(true);
            settledForBarcodeRef.current = barcode;
          }
          setProduct(next);
          trace?.mark('result_applied', 'ok');
          if (complete) showContributionNotice(traceId ? `${CONTRIBUTION_NOTICE_ADDED} ${traceId}` : CONTRIBUTION_NOTICE_ADDED);
        }}
        onSharedEvidenceFailed={() => {
          const traceId = currentModalTrace()?.traceId;
          showContributionNotice(traceId ? `${CONTRIBUTION_NOTICE_SAVED} ${traceId}` : CONTRIBUTION_NOTICE_SAVED);
        }}
      />

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        visible={cameraModalVisible}
        onClose={() => setCameraModalVisible(false)}
        onCapture={handleCaptureImage}
        barcode={barcode}
      />

      <Modal visible={packetClaimsExplainerVisible} animationType="slide" onRequestClose={() => setPacketClaimsExplainerVisible(false)}>
        <View style={{ flex: 1, padding: 24, backgroundColor: colors.background }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{PACKET_CLAIMS_CARD_TITLE}</Text>
          {PACKET_CLAIMS_EXPLAINER_HOOK.levels.map((level) => (
            <Text key={level} style={{ color: colors.text, marginTop: 12 }}>
              {level}
              {'\n'}
              {PACKET_CLAIMS_EXPLAINER_HOOK.content}
            </Text>
          ))}
          <TouchableOpacity onPress={() => setPacketClaimsExplainerVisible(false)}>
            <Text style={{ color: colors.primary, marginTop: 24 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={productOriginsExplainerVisible} animationType="slide" onRequestClose={() => setProductOriginsExplainerVisible(false)}>
        <View style={{ flex: 1, padding: 24, backgroundColor: colors.background }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Product Origins</Text>
          {PRODUCT_ORIGINS_EXPLAINER_HOOK.levels.map((level) => (
            <Text key={level} style={{ color: colors.text, marginTop: 12 }}>
              {level}: editorial deferred
            </Text>
          ))}
          <TouchableOpacity onPress={() => setProductOriginsExplainerVisible(false)}>
            <Text style={{ color: colors.primary, marginTop: 24 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

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
          onClose={() => {
            setShareModalVisible(false);
            setShareInitialMessage('');
          }}
          product={product}
          truScore={truScore || undefined}
          shareType={shareType}
          country={shareType === 'countryOfManufacture' ? shareManufacturingCountryLabel : undefined}
          initialCustomMessage={shareInitialMessage}
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
  scanAnotherFooter: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  scanAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
    alignSelf: 'stretch',
  },
  scanAnotherButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  /** Product page cards: consistent horizontal inset + vertical gap between sections */
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
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
  certificationsCardFrame: {
    borderWidth: 2,
    marginTop: 16,
    marginBottom: 16,
  },
  certificationsCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  certificationsCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  certificationsCardTitleText: {
    flexShrink: 1,
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  certificationsUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  certificationsUpdateButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  allergensLearnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginTop: 4,
    paddingVertical: 6,
  },
  allergensLearnMoreText: {
    fontSize: 15,
    fontWeight: '600',
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
    flex: 1,
    minWidth: 0,
  },
  insightsHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  alertsPreferenceBody: {
    width: '100%',
    alignSelf: 'stretch',
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
  ingredientsSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  partialScanBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  partialScanTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  partialScanSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
});
