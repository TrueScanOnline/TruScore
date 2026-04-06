/**
 * Nutrition Section Component
 * 
 * Displays nutrition facts table with share/edit functionality.
 * Optimized with React.memo for performance.
 * 
 * @module NutritionSection
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ProductWithTrustScore, ProductNutriments, ProductNutrientLevels } from '../../../types/product';
import { useTheme } from '../../../theme';
import NutritionTable from '../../../components/NutritionTable';

interface NutritionSectionProps {
  product: ProductWithTrustScore;
  onShare?: () => void;
  onEdit?: () => void;
}

const NutritionSection = React.memo(function NutritionSection({ 
  product, 
  onShare, 
  onEdit 
}: NutritionSectionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  if (!product.nutriments || Object.keys(product.nutriments).length === 0) {
    return null;
  }
  
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="nutrition-outline" size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            {t('nutrition.title')}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {onShare && (
            <TouchableOpacity
              onPress={onShare}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="share-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <NutritionTable
        nutriments={product.nutriments}
        nutrientLevels={product.nutrient_levels}
        categoriesTags={product.categories_tags}
        servingSize={product.serving_size}
        onShare={onShare}
        onEdit={onEdit}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionButton: {
    padding: 4,
  },
});

export default NutritionSection;

