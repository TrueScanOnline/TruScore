// Pricing Card Component - Displays product pricing information
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ProductPricing } from '../types/pricing';
import { pricingService } from '../services/pricingService';
import { currencyService } from '../services/currencyService';
import { useTheme } from '../theme';

interface PricingCardProps {
  barcode: string;
  productName?: string;
}

export default function PricingCard({ barcode, productName }: PricingCardProps) {
  console.log('[PricingCard] Component rendering with barcode:', barcode);
  
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [pricing, setPricing] = useState<ProductPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [priceInputVisible, setPriceInputVisible] = useState(false);

  const loadPricing = async () => {
    if (!barcode) {
      console.warn('[PricingCard] No barcode provided');
      setError('No barcode provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('[PricingCard] Fetching pricing data...');
      const pricingData = await pricingService.getProductPricing(barcode);
      console.log('[PricingCard] Pricing data received:', pricingData ? 'Yes' : 'No');
      if (pricingData) {
        setPricing(pricingData);
        console.log('[PricingCard] Pricing set successfully');
      } else {
        console.log('[PricingCard] No pricing data available');
        setError('No pricing data available');
      }
    } catch (err) {
      console.error('[PricingCard] Error loading pricing:', err);
      setError('Failed to load pricing');
    } finally {
      setLoading(false);
      console.log('[PricingCard] Loading complete');
    }
  };

  useEffect(() => {
    if (barcode) {
      console.log('[PricingCard] Component mounted, loading pricing for barcode:', barcode);
      loadPricing();
    } else {
      console.warn('[PricingCard] No barcode provided');
      setLoading(false);
      setError('No barcode provided');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcode]);

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return { name: 'trending-up' as const, color: '#ff6b6b' };
      case 'down':
        return { name: 'trending-down' as const, color: '#16a085' };
      default:
        return { name: 'remove' as const, color: colors.textSecondary };
    }
  };

  const getTrendText = (direction: 'up' | 'down' | 'stable', change?: number) => {
    if (!change) return t('pricing.stable', 'Price is stable');
    
    const absChange = Math.abs(change);
    if (direction === 'up') {
      return t('pricing.priceUp', `Price up ${absChange.toFixed(1)}% from last month`);
    } else if (direction === 'down') {
      return t('pricing.priceDown', `Price down ${absChange.toFixed(1)}% from last month`);
    }
    return t('pricing.stable', 'Price is stable');
  };

  const getDataQualityColor = (quality: ProductPricing['dataQuality']) => {
    switch (quality) {
      case 'high':
        return '#16a085';
      case 'medium':
        return '#ffd93d';
      case 'low':
        return '#ff9800';
      default:
        return colors.textSecondary;
    }
  };

  // Always render something - never return null
  console.log('[PricingCard] Rendering - loading:', loading, 'error:', error, 'pricing:', !!pricing);

  if (loading) {
    console.log('[PricingCard] Rendering loading state');
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="pricetag-outline" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
            {t('pricing.title', 'Price Information')}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary, marginLeft: 12 }]}>
            {t('pricing.loading', 'Loading pricing...')}
          </Text>
        </View>
      </View>
    );
  }

  if (error || !pricing) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="pricetag-outline" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
            {t('pricing.title', 'Price Information')}
          </Text>
        </View>
        <View style={styles.noDataContainer}>
          <Ionicons name="information-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.noDataText, { color: colors.textSecondary, marginTop: 12, marginBottom: 8 }]}>
            {t('pricing.notAvailable', 'Pricing not available for this product')}
          </Text>
          <Text style={[styles.noDataText, { color: colors.textSecondary, fontSize: 12, marginBottom: 12 }]}>
            {t('pricing.enableLocation', 'Enable location services to see prices from nearby stores')}
          </Text>
          <TouchableOpacity
            style={[styles.contributeButton, { backgroundColor: colors.primary }]}
            onPress={() => setPriceInputVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={[styles.contributeButtonText, { marginLeft: 8 }]}>
              {t('pricing.submitPrice', 'Submit Store Price')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Format prices using currency service
  const formattedAverage = currencyService.formatPrice(pricing.priceRange.average, pricing.currency);
  const formattedMin = currencyService.formatPrice(pricing.priceRange.min, pricing.currency);
  const formattedMax = currencyService.formatPrice(pricing.priceRange.max, pricing.currency);
  const trend = getTrendIcon(pricing.trends?.priceChangeDirection || 'stable');

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="pricetag" size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
              {t('pricing.title', 'Price Information')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setDetailsModalVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Average Price */}
        <View style={[styles.averagePriceContainer, { borderBottomColor: colors.border }]}>
          <Text style={[styles.averagePriceLabel, { color: colors.textSecondary }]}>
            {t('pricing.averagePrice', 'Average Price')}
          </Text>
          <Text style={[styles.averagePriceValue, { color: colors.text }]}>
            {formattedAverage}
          </Text>
        </View>

        {/* Price Range */}
        <View style={styles.priceRangeContainer}>
          <View style={styles.priceRangeRow}>
            <View style={[styles.priceRangeItem, { marginRight: 8 }]}>
              <Ionicons name="arrow-down-circle" size={16} color="#16a085" />
              <Text style={[styles.priceRangeLabel, { color: colors.textSecondary, marginTop: 4 }]}>
                {t('pricing.lowest', 'Lowest')}
              </Text>
              <Text style={[styles.priceRangeValue, { color: '#16a085', marginTop: 4 }]}>
                {formattedMin}
              </Text>
            </View>
            <View style={[styles.priceRangeItem, { marginLeft: 8 }]}>
              <Ionicons name="arrow-up-circle" size={16} color="#ff6b6b" />
              <Text style={[styles.priceRangeLabel, { color: colors.textSecondary, marginTop: 4 }]}>
                {t('pricing.highest', 'Highest')}
              </Text>
              <Text style={[styles.priceRangeValue, { color: '#ff6b6b', marginTop: 4 }]}>
                {formattedMax}
              </Text>
            </View>
          </View>
        </View>

        {/* Location Info - Always show if location available */}
        {pricing.location && (
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.text, marginLeft: 6, fontWeight: '600' }]}>
              {t('pricing.localPrices', 'Local Prices')}
              {pricing.location.city ? ` - ${pricing.location.city}` : ''}
              {pricing.location.region ? `, ${pricing.location.region}` : ''}
              {!pricing.location.city && pricing.location.country ? ` - ${pricing.location.country}` : ''}
            </Text>
          </View>
        )}
        
        {/* Show warning if no location */}
        {!pricing.location && (
          <View style={[styles.locationInfo, { backgroundColor: colors.warning + '15', borderRadius: 8, padding: 8, marginTop: 8 }]}>
            <Ionicons name="location-outline" size={14} color={colors.warning || '#ffa500'} />
            <Text style={[styles.locationText, { color: colors.warning || '#ffa500', marginLeft: 6, fontSize: 12 }]}>
              {t('pricing.enableLocationForLocal', 'Enable location to see prices from nearby stores (within 20 miles)')}
            </Text>
          </View>
        )}

        {/* Trend Indicator */}
        {pricing.trends && pricing.trends.priceChangeDirection !== 'stable' && (
          <View style={styles.trendContainer}>
            <View style={[styles.trendRow, { backgroundColor: trend.color + '15' }]}>
              <Ionicons name={trend.name} size={20} color={trend.color} />
              <Text style={[styles.trendText, { color: trend.color, marginLeft: 8 }]}>
                {getTrendText(
                  pricing.trends.priceChangeDirection,
                  pricing.trends.priceChange
                )}
              </Text>
            </View>
          </View>
        )}

        {/* Data Quality Indicator */}
        <View style={styles.dataQualityContainer}>
          <View
            style={[
              styles.dataQualityDot,
              { backgroundColor: getDataQualityColor(pricing.dataQuality) },
            ]}
          />
          <Text style={[styles.dataQualityText, { color: colors.textSecondary, marginLeft: 6 }]}>
            {pricing.dataQuality === 'high'
              ? t('pricing.dataQualityHigh', 'High confidence')
              : pricing.dataQuality === 'medium'
              ? t('pricing.dataQualityMedium', 'Medium confidence')
              : pricing.dataQuality === 'low'
              ? t('pricing.dataQualityLow', 'Low confidence')
              : t('pricing.dataQualityInsufficient', 'Limited data')}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background, borderColor: colors.border, marginRight: 6 }]}
            onPress={() => setDetailsModalVisible(true)}
          >
            <Ionicons name="eye-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary, marginLeft: 6 }]}>
              {t('pricing.viewDetails', 'View Details')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary, marginLeft: 6 }]}
            onPress={() => setPriceInputVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={[styles.actionButtonTextWhite, { marginLeft: 6 }]}>
              {t('pricing.submitPrice', 'Submit Price')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('pricing.details', 'Price Details')}
              </Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
              {/* Price Range Details */}
              <View style={[styles.detailSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                  {t('pricing.priceRange', 'Price Range')}
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    {t('pricing.average', 'Average')}:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formattedAverage}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    {t('pricing.minimum', 'Minimum')}:
                  </Text>
                  <Text style={[styles.detailValue, { color: '#16a085' }]}>
                    {formattedMin}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    {t('pricing.maximum', 'Maximum')}:
                  </Text>
                  <Text style={[styles.detailValue, { color: '#ff6b6b' }]}>
                    {formattedMax}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    {t('pricing.median', 'Median')}:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {currencyService.formatPrice(pricing.priceRange.median, pricing.currency)}
                  </Text>
                </View>
              </View>

              {/* Retailer Prices */}
              {pricing.retailers && pricing.retailers.length > 0 && (
                <View style={[styles.detailSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                    {t('pricing.retailerPrices', 'Retailer Prices')}
                  </Text>
                  {pricing.retailers.map((retailer, index) => (
                    <View key={index} style={styles.retailerRow}>
                      <Text style={[styles.retailerName, { color: colors.text }]}>
                        {retailer.retailerName}
                      </Text>
                      <Text style={[styles.retailerPrice, { color: colors.text }]}>
                        {currencyService.formatPrice(retailer.price, retailer.currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Price Count */}
              <View style={[styles.detailSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                  {t('pricing.dataSources', 'Data Sources')}
                </Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {t('pricing.priceCount', `${pricing.prices.length} price${pricing.prices.length !== 1 ? 's' : ''} found`)}
                </Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {t('pricing.lastUpdated', 'Last updated: {{date}}', {
                    date: new Date(pricing.lastUpdated).toLocaleDateString(),
                  })}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Price Input Modal - Placeholder for future implementation */}
      {priceInputVisible && (
        <Modal
          visible={priceInputVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setPriceInputVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t('pricing.submitPrice', 'Submit Store Price')}
                </Text>
                <TouchableOpacity onPress={() => setPriceInputVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                  {t('pricing.submitPriceMessage', 'Price submission feature coming soon!')}
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 14,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  contributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  contributeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  averagePriceContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  averagePriceLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  averagePriceValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  priceRangeContainer: {
    marginBottom: 16,
  },
  priceRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  priceRangeItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceRangeLabel: {
    fontSize: 12,
  },
  priceRangeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
  },
  trendContainer: {
    marginBottom: 16,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  dataQualityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dataQualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dataQualityText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextWhite: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  detailSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailText: {
    fontSize: 13,
    marginBottom: 4,
  },
  retailerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  retailerName: {
    fontSize: 14,
    flex: 1,
  },
  retailerPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
});

