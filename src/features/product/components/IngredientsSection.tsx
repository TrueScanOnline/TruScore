/**
 * Ingredients Section Component
 * 
 * Displays product ingredients with share/edit functionality.
 * Optimized with React.memo for performance.
 * 
 * @module IngredientsSection
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ProductWithTrustScore } from '../../../types/product';
import { useTheme } from '../../../theme';

interface IngredientsSectionProps {
  product: ProductWithTrustScore;
  onShare?: () => void;
  onEdit?: () => void;
}

const IngredientsSection = React.memo(function IngredientsSection({ 
  product, 
  onShare, 
  onEdit 
}: IngredientsSectionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  if (!product.ingredients_text || product.ingredients_text.trim().length === 0) {
    return null;
  }
  
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="flask-outline" size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            {t('ingredients.title')}
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
      
      <ScrollView style={styles.ingredientsContainer} nestedScrollEnabled>
        <Text style={[styles.ingredientsText, { color: colors.text }]}>
          {product.ingredients_text}
        </Text>
      </ScrollView>
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
  ingredientsContainer: {
    maxHeight: 200,
  },
  ingredientsText: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default IngredientsSection;

