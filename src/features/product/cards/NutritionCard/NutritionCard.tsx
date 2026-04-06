// Modular Nutrition Card Component

import React, { useState, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import { ProductWithTrustScore } from '../../../../types/product';
import NutritionTable from '../../../../components/NutritionTable';
import { useTheme } from '../../../../theme';
import { CardPremiumGate } from '../../../premium/CardPremiumGate';
import { PremiumFeature } from '../../../../utils/premiumFeatures';
import { NutritionCardSkeleton } from './NutritionCardSkeleton';
import { NutritionCardError } from './NutritionCardError';

interface NutritionCardProps {
  product?: ProductWithTrustScore;
  onShare?: () => void;
  premiumFeatures?: PremiumFeature[];
}

function NutritionCardContent({ product, onShare, premiumFeatures }: NutritionCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (!product || !product.nutriments) {
    return null; // Don't show if no nutrition data
  }

  return (
    <CardPremiumGate features={premiumFeatures || []}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="restaurant-outline" size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
              {t('nutrition.title', 'Nutrition Facts')}
            </Text>
          </View>
          {onShare && (
            <TouchableOpacity
              onPress={onShare}
              style={styles.shareButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="share-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <NutritionTable
          nutriments={product.nutriments}
          nutrientLevels={product.nutrient_levels}
          categoriesTags={product.categories_tags}
          servingSize={product.serving_size}
          shareContext={{
            productName: product.product_name || product.product_name_en || '',
            barcode: product.barcode,
          }}
        />
      </View>
    </CardPremiumGate>
  );
}

export default function NutritionCard(props: NutritionCardProps) {
  return (
    <ErrorBoundary feature="NutritionCard">
      <Suspense fallback={<NutritionCardSkeleton />}>
        <NutritionCardContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
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
  shareButton: {
    padding: 4,
  },
});


