// Universal Pricing Card - Simplified Web Search
// Shows a simple "Web Search" button that opens Google/Safari search for product pricing

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import GoogleSearchPricingModal from './GoogleSearchPricingModal';
import { Product } from '../types/product';

interface UniversalPricingCardProps {
  barcode: string;
  productName?: string;
  product?: Product | null;
}

export default function UniversalPricingCard({ 
  barcode, 
  productName,
  product 
}: UniversalPricingCardProps) {
  const { colors } = useTheme();
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.card, borderWidth: 2, borderColor: '#16a085' }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="pricetag-outline" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
            Price Information
          </Text>
        </View>

        <View style={styles.contentContainer}>
          <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Find Local Prices
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Search for current prices and availability at local stores near you.
          </Text>

          <TouchableOpacity
            style={[styles.webSearchButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowGoogleModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.webSearchButtonText}>
              Web Search
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Web Search Modal */}
      <GoogleSearchPricingModal
        visible={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        productName={productName || product?.product_name || product?.product_name_en || `Product ${barcode}`}
        barcode={barcode}
        product={product}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginBottom: 16, // Increased gap between Price Information and Nutrition Facts cards
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
  contentContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  webSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    gap: 8,
  },
  webSearchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
