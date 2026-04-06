// Universal Pricing Card — compact web-search CTA (aligned with product page card width + spacing)

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import GoogleSearchPricingModal from './GoogleSearchPricingModal';
import { Product } from '../types/product';

interface UniversalPricingCardProps {
  barcode: string;
  productName?: string;
  product?: Product | null;
}

export default function UniversalPricingCard({ barcode, productName, product }: UniversalPricingCardProps) {
  const { colors } = useTheme();
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: '#16a085' }]}>
        <View style={styles.headerRow}>
          <Ionicons name="pricetag-outline" size={22} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Price Information</Text>
        </View>

        <View style={styles.bodyRow}>
          <Ionicons name="search-outline" size={26} color={colors.textSecondary} style={styles.bodyIcon} />
          <View style={styles.bodyTextCol}>
            <Text style={[styles.subtitle, { color: colors.text }]}>Find local prices</Text>
            <Text style={[styles.caption, { color: colors.textSecondary }]} numberOfLines={2}>
              Search for current prices and availability at stores near you.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.webSearchButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowGoogleModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={18} color="#fff" />
          <Text style={styles.webSearchButtonText}>Web Search</Text>
        </TouchableOpacity>
      </View>

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
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  bodyIcon: {
    marginTop: 2,
  },
  bodyTextCol: {
    flex: 1,
    minWidth: 0,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
  webSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  webSearchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
