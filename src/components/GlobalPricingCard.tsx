// Quality Pricing Card - Uses Vercel Playwright backend for NZ stores
// Shows only verified prices from known retailers (Woolworths, Pak'nSave, New World)
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Linking, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNZPricesStore } from '../store/useNZPricesStore';
import { ProductPrice } from '../types/pricing';
import { useTheme } from '../theme';
import * as Location from 'expo-location';

interface GlobalPricingCardProps {
  barcode: string;
  productName?: string;
}

export default function GlobalPricingCard({ barcode, productName }: GlobalPricingCardProps) {
  const { colors } = useTheme();
  const { prices, loading, error, fetchPrices } = useNZPricesStore();
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    checkLocationAndLoad();
  }, [barcode]);

  const checkLocationAndLoad = async () => {
    try {
      // Get user location to determine if we should show pricing
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync();
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode && reverseGeocode.length > 0) {
          const code = reverseGeocode[0].isoCountryCode;
          setCountryCode(code || null);
          
          // Only show pricing for NZ (where we have the backend)
          if (code === 'NZ') {
            setShowCard(true);
            fetchPrices(barcode);
          } else {
            setShowCard(false);
          }
        }
      } else {
        // No location permission - don't show pricing
        setShowCard(false);
      }
    } catch (err) {
      console.error('Error checking location:', err);
      setShowCard(false);
    }
  };

  // Don't show card if not in NZ or location unavailable
  if (!showCard || countryCode !== 'NZ') {
    return null; // Don't show pricing for non-NZ countries yet
  }

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>
          Finding best NZ prices...
        </Text>
      </View>
    );
  }

  if (error || prices.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="pricetag-outline" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
            Price Information
          </Text>
        </View>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {error || 'No prices found for this product in NZ stores.'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
          onPress={() => fetchPrices(barcode)}
        >
          <Ionicons name="refresh" size={16} color={colors.primary} />
          <Text style={[styles.retryButtonText, { color: colors.primary }]}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cheapest = prices[0];

  // Calculate price range from actual prices
  const priceValues = prices.map(p => p.price);
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);
  const avgPrice = priceValues.reduce((a, b) => a + b, 0) / priceValues.length;

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="pricetag" size={24} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
          Price Comparison 🇳🇿
        </Text>
      </View>

      {/* Price Range Summary */}
      {prices.length > 1 && (
        <View style={[styles.summaryContainer, { backgroundColor: colors.primary + '10' }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Price Range:</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Average:</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ${avgPrice.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* Cheapest Price Highlight */}
      <View style={[styles.cheapestContainer, { backgroundColor: '#10b98115', borderColor: '#10b981' }]}>
        <Text style={[styles.cheapestPrice, { color: '#10b981' }]}>
          ${cheapest.price.toFixed(2)}
        </Text>
        <Text style={[styles.cheapestStore, { color: colors.text }]}>
          {cheapest.store} • Best price
        </Text>
        {cheapest.special && (
          <View style={styles.specialBadge}>
            <Ionicons name="flame" size={16} color="#f97316" />
            <Text style={styles.specialText}>On Special</Text>
          </View>
        )}
        {cheapest.url && (
          <TouchableOpacity
            style={[styles.shopButton, { backgroundColor: colors.primary }]}
            onPress={() => Linking.openURL(cheapest.url)}
          >
            <Ionicons name="cart" size={16} color="#fff" />
            <Text style={styles.shopButtonText}>Shop at {cheapest.store}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Other Store Prices */}
      {prices.slice(1).map((price: ProductPrice, index: number) => (
        <View key={index} style={[styles.priceRow, { borderBottomColor: colors.border }]}>
          <View style={styles.priceRowLeft}>
            <Text style={[styles.storeName, { color: colors.text }]}>
              {price.store}
            </Text>
            {price.name && (
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                {price.name}
              </Text>
            )}
          </View>
          <View style={styles.priceRowRight}>
            {price.special && <Ionicons name="flame" size={16} color="#f97316" style={{ marginRight: 4 }} />}
            <Text style={[styles.priceText, { color: price.special ? '#f97316' : colors.text }]}>
              ${price.price.toFixed(2)}
            </Text>
            {price.url && (
              <TouchableOpacity
                onPress={() => Linking.openURL(price.url)}
                style={styles.linkButton}
              >
                <Ionicons name="open-outline" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {/* Data Source Indicator */}
      <View style={[styles.qualityIndicator, { backgroundColor: colors.border + '40' }]}>
        <Ionicons name="checkmark-circle" size={14} color={colors.textSecondary} />
        <Text style={[styles.qualityText, { color: colors.textSecondary }]}>
          Verified prices from {prices.length} NZ retailer{prices.length > 1 ? 's' : ''}
        </Text>
      </View>
    </View>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  specialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f9731615',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  specialText: {
    color: '#f97316',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  summaryContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationText: {
    fontSize: 12,
    marginTop: 4,
  },
  cheapestContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  cheapestPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cheapestStore: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  priceRowLeft: {
    flex: 1,
  },
  priceRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  linkButton: {
    padding: 4,
  },
  qualityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  qualityText: {
    fontSize: 11,
    marginLeft: 6,
  },
});

