import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from './_layout';
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';
import { getAvailableProducts, formatPrice, calculateAnnualSavings, getPeriodLabel } from '../src/services/subscriptionService';
import { QonversionProduct } from '../src/services/subscriptionService';
import { PremiumFeature, PremiumFeatureDescriptions } from '../src/utils/premiumFeatures';
import { useTheme } from '../src/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SubscriptionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60 + insets.bottom;
  const { subscriptionInfo, purchaseSubscription, restorePurchases, checkSubscriptionStatus } = useSubscriptionStore();
  const [products, setProducts] = useState<QonversionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (retryCount = 0) => {
    setLoading(true);
    try {
      const availableProducts = await getAvailableProducts();
      
      if (availableProducts.length === 0 && retryCount < 2) {
        // Retry if no products found (might be network issue)
        await new Promise(resolve => setTimeout(resolve, 1000));
        return loadProducts(retryCount + 1);
      }
      
      // Sort: annual first (best value), then monthly
      const sorted = availableProducts.sort((a, b) => {
        if (a.duration === 'annual' && b.duration === 'monthly') return -1;
        if (a.duration === 'monthly' && b.duration === 'annual') return 1;
        return 0;
      });
      setProducts(sorted);
    } catch (error) {
      console.error('Failed to load products:', error);
      if (retryCount < 2) {
        // Retry on error
        await new Promise(resolve => setTimeout(resolve, 1000));
        return loadProducts(retryCount + 1);
      }
      Alert.alert(
        t('subscription.noProducts'),
        t('subscription.noProductsMessage')
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (product: QonversionProduct) => {
    setPurchasing(product.qonversionId);
    try {
      const result = await purchaseSubscription(product.qonversionId);
      
      if (result.success) {
        Alert.alert(
          t('subscription.purchaseSuccess'),
          t('subscription.purchaseSuccessMessage'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                checkSubscriptionStatus();
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        if (result.error !== 'Purchase cancelled by user') {
          // Provide more specific error messages
          const errorMessage = getPurchaseErrorMessage(result.error || '');
          Alert.alert(
            t('subscription.purchaseError'),
            errorMessage,
            [
              { text: t('common.ok') },
              { 
                text: t('profile.manageSubscription'), 
                onPress: handleManageSubscription,
                style: 'default'
              }
            ]
          );
        }
      }
    } catch (error: any) {
      Alert.alert(
        t('subscription.purchaseError'),
        error.message || t('subscription.purchaseErrorMessage')
      );
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const result = await restorePurchases();
      
      if (result.success) {
        Alert.alert(
          t('subscription.restoreSuccess'),
          t('subscription.restoreSuccessMessage'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                checkSubscriptionStatus();
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          t('subscription.restoreError'),
          result.error || t('subscription.restoreErrorMessage')
        );
      }
    } catch (error: any) {
      Alert.alert(
        t('subscription.restoreError'),
        error.message || t('subscription.restoreErrorMessage')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = () => {
    // Open platform-specific subscription management
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';
    Linking.openURL(url).catch(() => {
      Alert.alert(t('common.error'), 'Unable to open subscription settings');
    });
  };

  const getPurchaseErrorMessage = (error: string): string => {
    const errorLower = error.toLowerCase();
    if (errorLower.includes('network') || errorLower.includes('connection') || errorLower.includes('timeout')) {
      return t('subscription.error.network') || 'Network error. Please check your connection and try again.';
    }
    if (errorLower.includes('declined') || errorLower.includes('payment') || errorLower.includes('card')) {
      return t('subscription.error.paymentDeclined') || 'Payment was declined. Please check your payment method.';
    }
    if (errorLower.includes('cancelled') || errorLower.includes('canceled')) {
      return t('subscription.error.cancelled') || 'Purchase was cancelled.';
    }
    if (errorLower.includes('already') || errorLower.includes('purchased')) {
      return t('subscription.error.alreadyPurchased') || 'You already have an active subscription.';
    }
    return error || t('subscription.purchaseErrorMessage') || 'Failed to complete purchase. Please try again.';
  };

  const monthlyProduct = products.find(p => p.duration === 'monthly');
  const annualProduct = products.find(p => p.duration === 'annual');

  const savings = monthlyProduct && annualProduct
    ? calculateAnnualSavings(monthlyProduct.price, annualProduct.price)
    : null;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('subscription.loading')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t('subscription.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('subscription.subtitle')}
          </Text>
        </View>

        {/* Current Status */}
        {subscriptionInfo.isPremium && (
          <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
            <View style={styles.statusHeader}>
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                {t('profile.premium')} {subscriptionInfo.status === 'trial' ? `(${t('subscription.trial')})` : ''}
              </Text>
            </View>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {subscriptionInfo.status === 'trial'
                ? t('subscription.trialPeriod', { days: 7 })
                : subscriptionInfo.period === 'annual'
                ? t('subscription.annual')
                : t('subscription.monthly')}
            </Text>
            {subscriptionInfo.expiresDate && (
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                Expires: {subscriptionInfo.expiresDate.toLocaleDateString()}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.manageButton, { borderColor: colors.primary }]}
              onPress={handleManageSubscription}
            >
              <Text style={[styles.manageButtonText, { color: colors.primary }]}>
                {t('profile.manageSubscription')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Products */}
        {products.length > 0 ? (
          <View style={styles.productsContainer}>
            {/* Annual Plan */}
            {annualProduct && (
              <View
                style={[
                  styles.productCard,
                  { backgroundColor: colors.card },
                  savings && styles.bestValueCard,
                ]}
              >
                {savings && savings.percentage > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.badgeText}>{t('subscription.bestValue')}</Text>
                  </View>
                )}
                <View style={styles.productHeader}>
                  <Text style={[styles.productTitle, { color: colors.text }]}>
                    {t('subscription.annual')}
                  </Text>
                  {savings && savings.percentage > 0 && (
                    <View style={[styles.savingsBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.savingsText, { color: colors.primary }]}>
                        {t('subscription.save', { percentage: savings.percentage })}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.priceContainer}>
                  <Text style={[styles.price, { color: colors.text }]}>
                    {formatPrice(annualProduct.price, annualProduct.currencyCode)}
                  </Text>
                  <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>
                    {t('subscription.perYear')}
                  </Text>
                </View>
                <View style={styles.priceBreakdown}>
                  <Text style={[styles.priceBreakdownText, { color: colors.textSecondary }]}>
                    {formatPrice(annualProduct.price / 12, annualProduct.currencyCode)} {t('subscription.perMonth')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    { backgroundColor: colors.primary },
                    purchasing === annualProduct.qonversionId && styles.subscribeButtonDisabled,
                  ]}
                  onPress={() => handlePurchase(annualProduct)}
                  disabled={purchasing !== null}
                >
                  {purchasing === annualProduct.qonversionId ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.subscribeButtonText}>
                      {subscriptionInfo.isPremium ? t('subscription.continue') : t('subscription.subscribe')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Monthly Plan */}
            {monthlyProduct && (
              <View
                style={[styles.productCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.productHeader}>
                  <Text style={[styles.productTitle, { color: colors.text }]}>
                    {t('subscription.monthly')}
                  </Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={[styles.price, { color: colors.text }]}>
                    {formatPrice(monthlyProduct.price, monthlyProduct.currencyCode)}
                  </Text>
                  <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>
                    {t('subscription.perMonth')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    { backgroundColor: colors.primary },
                    purchasing === monthlyProduct.qonversionId && styles.subscribeButtonDisabled,
                  ]}
                  onPress={() => handlePurchase(monthlyProduct)}
                  disabled={purchasing !== null}
                >
                  {purchasing === monthlyProduct.qonversionId ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.subscribeButtonText}>
                      {subscriptionInfo.isPremium ? t('subscription.continue') : t('subscription.subscribe')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Ionicons name="card-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {t('subscription.noProducts')}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {t('subscription.noProductsMessage')}
            </Text>
          </View>
        )}

        {/* Features List */}
        <View style={[styles.featuresCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>
            {t('subscription.features.title')}
          </Text>
          {[
            { feature: 'OFFLINE_MODE', icon: 'cloud-offline-outline' },
            { feature: 'UNLIMITED_HISTORY', icon: 'infinite-outline' },
            { feature: 'ADVANCED_SEARCH', icon: 'search-outline' },
            { feature: 'EXPORT_DATA', icon: 'download-outline' },
            { feature: 'ENHANCED_INSIGHTS', icon: 'analytics-outline' },
            { feature: 'AD_FREE', icon: 'close-circle-outline' },
          ].map((item) => {
            const featureDesc = PremiumFeatureDescriptions[PremiumFeature[item.feature as keyof typeof PremiumFeature]];
            return (
              <View key={item.feature} style={styles.featureItem}>
                <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>
                    {featureDesc.title}
                  </Text>
                  <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                    {featureDesc.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
            <Text style={[styles.restoreButtonText, { color: colors.primary }]}>
              {t('subscription.restore')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            {t('subscription.cancel')}
          </Text>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            {t('subscription.cancelMessage')}
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://truescan.app/terms')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                {t('subscription.terms')}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.footerText, { color: colors.textTertiary }]}> • </Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://truescan.app/privacy')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                {t('subscription.privacy')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 50,
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
  header: {
    marginBottom: 24,
    alignItems: 'center',
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
  },
  manageButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  productsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  productCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  bestValueCard: {
    borderWidth: 2,
    borderColor: '#16a085',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  savingsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    marginRight: 8,
  },
  pricePeriod: {
    fontSize: 16,
  },
  priceBreakdown: {
    marginBottom: 16,
  },
  priceBreakdownText: {
    fontSize: 14,
  },
  subscribeButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  restoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '500',
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
});

