// src/components/PricingCard.tsx

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNZPricesStore } from '../store/useNZPricesStore';
import { ProductPrice } from '../types/pricing';
import { useTheme } from '../theme';

interface PricingCardProps {
  barcode: string;
}

// Simple date formatting function (lightweight alternative to date-fns)
function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export default function PricingCard({ barcode }: PricingCardProps) {
  const { prices, loading, error, fetchPrices } = useNZPricesStore();
  const { colors } = useTheme();

  // Auto-fetch on mount
  useEffect(() => {
    if (barcode) {
      fetchPrices(barcode);
    }
  }, [barcode]);

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
            Local Prices (NZ)
          </Text>
        </View>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {error || 'No prices found yet. Be the first to add this price!'}
        </Text>
      </View>
    );
  }

  const cheapest = prices[0];

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <Ionicons name="pricetag" size={24} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
          Best Prices Near You 🇳🇿
        </Text>
      </View>

      {/* Cheapest Price Highlight */}
      <View style={[styles.cheapestContainer, { backgroundColor: '#10b98115', borderColor: '#10b981' }]}>
        <Text style={[styles.cheapestPrice, { color: '#10b981' }]}>
          ${cheapest.price.toFixed(2)}
        </Text>
        <Text style={[styles.cheapestStore, { color: colors.text }]}>
          {cheapest.store} • Cheapest right now!
        </Text>
        {cheapest.special && (
          <View style={styles.specialBadge}>
            <Ionicons name="flame" size={16} color="#f97316" />
            <Text style={styles.specialText}>On Special</Text>
          </View>
        )}
      </View>

      {/* Other Prices */}
      {prices.slice(1, 4).map((p: ProductPrice, i: number) => (
        <View key={i} style={[styles.priceRow, { borderBottomColor: colors.border }]}>
          <View style={styles.priceRowLeft}>
            <Text style={[styles.storeName, { color: colors.text }]}>{p.store}</Text>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {formatDistanceToNow(new Date(p.updatedAt))}
            </Text>
          </View>
          <View style={styles.priceRowRight}>
            {p.special && <Ionicons name="flame" size={16} color="#f97316" style={{ marginRight: 4 }} />}
            <Text style={[styles.priceText, { color: p.special ? '#f97316' : colors.text }]}>
              ${p.price.toFixed(2)}
            </Text>
          </View>
        </View>
      ))}

      {/* Shop Button */}
      <TouchableOpacity
        style={[styles.shopButton, { backgroundColor: colors.primary }]}
        onPress={() => Linking.openURL(cheapest.url)}
      >
        <Ionicons name="cart" size={20} color="#fff" />
        <Text style={styles.shopButtonText}>Shop at {cheapest.store}</Text>
      </TouchableOpacity>
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
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
