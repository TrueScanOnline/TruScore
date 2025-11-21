// Pricing Card Component - LOCAL STORES ONLY
// Displays prices from local supermarkets/stores based on user's geo-location
// Shows price comparison from different local stores

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ProductPricing, PriceEntry } from '../types/pricing';
import { pricingService } from '../services/pricingService';
import { currencyService } from '../services/currencyService';
import { useTheme } from '../theme';
import * as Location from 'expo-location';

interface PricingCardProps {
  barcode: string;
  productName?: string;
}

export default function PricingCard({ barcode, productName }: PricingCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [pricing, setPricing] = useState<ProductPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [priceInputVisible, setPriceInputVisible] = useState(false);

  const loadPricing = async () => {
    if (!barcode) {
      setError('No barcode provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setLocationError(null);

    try {
      // Check location permission first
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        setLocationError('Location permission required for local pricing');
        setLoading(false);
        return;
      }

      // Fetch pricing data (now ONLY from local stores)
      const pricingData = await pricingService.getProductPricing(barcode, undefined, false, productName);
      
      if (pricingData) {
        setPricing(pricingData);
        setError(null);
      } else {
        setError('No local prices found. Enable location services to see prices from nearby stores.');
      }
    } catch (err: any) {
      console.error('[PricingCard] Error loading pricing:', err);
      setError(err.message || 'Failed to load pricing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (barcode) {
      loadPricing();
    }
  }, [barcode]);

  if (loading) {
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
            {t('pricing.loading', 'Loading local prices...')}
          </Text>
        </View>
      </View>
    );
  }

  // No location or no pricing data
  if (locationError || error || !pricing) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="pricetag-outline" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
            {t('pricing.title', 'Price Information')}
          </Text>
        </View>
        <View style={styles.noDataContainer}>
          <Ionicons name="location-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.noDataTitle, { color: colors.text, marginTop: 12, marginBottom: 8 }]}>
            {locationError || 'Location Required'}
          </Text>
          <Text style={[styles.noDataText, { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 16 }]}>
            {locationError 
              ? 'Please enable location services in your device settings to see prices from nearby stores.'
              : 'Enable location services to see prices from local supermarkets and stores in your area.'}
          </Text>
          <TouchableOpacity
            style={[styles.enableLocationButton, { backgroundColor: colors.primary }]}
            onPress={loadPricing}
          >
            <Ionicons name="location" size={20} color="#fff" />
            <Text style={[styles.enableLocationButtonText, { marginLeft: 8 }]}>
              {t('pricing.enableLocation', 'Enable Location')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contributeButton, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, marginTop: 12 }]}
            onPress={() => setPriceInputVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.contributeButtonText, { color: colors.primary, marginLeft: 8 }]}>
              {t('pricing.submitPrice', 'Submit Store Price')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Format prices
  const formattedAverage = currencyService.formatPrice(pricing.priceRange.average, pricing.currency);
  const formattedMin = currencyService.formatPrice(pricing.priceRange.min, pricing.currency);
  const formattedMax = currencyService.formatPrice(pricing.priceRange.max, pricing.currency);

  // Group prices by retailer (for comparison view)
  const retailerPrices = new Map<string, { price: number; currency: string; location?: string; count: number }>();
  
  pricing.prices.forEach(price => {
    if (price.retailer) {
      const key = price.retailer.toLowerCase();
      const existing = retailerPrices.get(key);
      if (!existing || price.price < existing.price) {
        retailerPrices.set(key, {
          price: price.price,
          currency: price.currency,
          location: price.location,
          count: (existing?.count || 0) + 1,
        });
      }
    }
  });

  // Sort retailers by price (lowest first)
  const sortedRetailers = Array.from(retailerPrices.entries())
    .map(([retailer, data]) => ({
      retailer,
      ...data,
    }))
    .sort((a, b) => a.price - b.price);

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

        {/* Location Info */}
        {pricing.location && (
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.text, marginLeft: 6, fontWeight: '600' }]}>
              {t('pricing.localPrices', 'Local Prices')}
              {pricing.location.city ? ` - ${pricing.location.city}` : ''}
              {pricing.location.region ? `, ${pricing.location.region}` : ''}
              {pricing.location.country ? ` - ${pricing.location.country}` : ''}
            </Text>
          </View>
        )}

        {/* Average Price */}
        {pricing.priceRange.average > 0 && (
          <View style={[styles.averagePriceContainer, { borderBottomColor: colors.border }]}>
            <Text style={[styles.averagePriceLabel, { color: colors.textSecondary }]}>
              {t('pricing.averagePrice', 'Average Price')}
            </Text>
            <Text style={[styles.averagePriceValue, { color: colors.text }]}>
              {formattedAverage}
            </Text>
          </View>
        )}

        {/* Price Range */}
        {sortedRetailers.length > 1 && (
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
        )}

        {/* Store Price Comparison - Main Feature */}
        {sortedRetailers.length > 0 && (
          <View style={styles.storeComparisonContainer}>
            <Text style={[styles.storeComparisonTitle, { color: colors.text, marginBottom: 12 }]}>
              {t('pricing.compareStores', 'Compare Prices')}
            </Text>
            {sortedRetailers.map((retailer, index) => {
              const isLowest = index === 0 && sortedRetailers.length > 1;
              const isHighest = index === sortedRetailers.length - 1 && sortedRetailers.length > 1;
              
              return (
                <View 
                  key={index} 
                  style={[
                    styles.storeRow, 
                    { 
                      backgroundColor: isLowest ? '#16a08515' : isHighest ? '#ff6b6b15' : colors.background,
                      borderColor: colors.border,
                    },
                    index === sortedRetailers.length - 1 && { borderBottomWidth: 0 }
                  ]}
                >
                  <View style={styles.storeRowLeft}>
                    <Text style={[styles.storeName, { color: colors.text }]}>
                      {retailer.retailer}
                    </Text>
                    {retailer.location && (
                      <Text style={[styles.storeLocation, { color: colors.textSecondary }]}>
                        {retailer.location}
                      </Text>
                    )}
                  </View>
                  <View style={styles.storeRowRight}>
                    {isLowest && (
                      <Ionicons name="checkmark-circle" size={16} color="#16a085" style={{ marginRight: 6 }} />
                    )}
                    <Text style={[
                      styles.storePrice, 
                      { 
                        color: isLowest ? '#16a085' : isHighest ? '#ff6b6b' : colors.text,
                        fontWeight: isLowest || isHighest ? 'bold' : '600',
                      }
                    ]}>
                      {currencyService.formatPrice(retailer.price, retailer.currency)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

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

              {/* Local Stores */}
              {sortedRetailers.length > 0 && (
                <View style={[styles.detailSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                    {t('pricing.localStores', 'Local Stores')}
                  </Text>
                  {sortedRetailers.map((retailer, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.retailerRow, 
                        { borderBottomColor: colors.border },
                        index === sortedRetailers.length - 1 && { borderBottomWidth: 0 }
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.retailerName, { color: colors.text }]}>
                          {retailer.retailer}
                        </Text>
                        {retailer.location && (
                          <Text style={[styles.retailerLocation, { color: colors.textSecondary, fontSize: 11, marginTop: 2 }]}>
                            {retailer.location}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.retailerPrice, { color: colors.text, fontWeight: '600' }]}>
                        {currencyService.formatPrice(retailer.price, retailer.currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Data Sources */}
              <View style={[styles.detailSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                  {t('pricing.dataSources', 'Data Sources')}
                </Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {t('pricing.priceCount', { count: sortedRetailers.length })}
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

      {/* Price Input Modal */}
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
  noDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  enableLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  enableLocationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 14,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
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
  storeComparisonContainer: {
    marginBottom: 16,
  },
  storeComparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  storeRowLeft: {
    flex: 1,
  },
  storeRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 15,
    fontWeight: '600',
  },
  storeLocation: {
    fontSize: 12,
    marginTop: 2,
  },
  storePrice: {
    fontSize: 16,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  retailerName: {
    fontSize: 14,
    flex: 1,
  },
  retailerPrice: {
    fontSize: 14,
  },
  retailerLocation: {
    fontSize: 11,
  },
});
