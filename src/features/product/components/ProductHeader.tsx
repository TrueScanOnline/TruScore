/**
 * Product Header Component
 * 
 * Displays product image, name, brand, confidence and country of origin.
 * Optimized with React.memo for performance.
 * 
 * @module ProductHeader
 */

import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProductWithTrustScore } from '../../../types/product';
import { useTheme } from '../../../theme';
import ConfidenceBadge from '../../../components/ConfidenceBadge';
import CountryFlag from '../../../components/CountryFlag';

interface ProductHeaderProps {
  product: ProductWithTrustScore;
  onImagePress?: () => void;
}

const ProductHeader = React.memo(function ProductHeader({ product, onImagePress }: ProductHeaderProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  const imageUrl = product.image_url || product.image_front_url;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Product Image */}
      {imageUrl && (
        <TouchableOpacity 
          onPress={onImagePress}
          activeOpacity={0.9}
          style={styles.imageContainer}
        >
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.image}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
      
      {/* Product Name */}
      <Text style={[styles.productName, { color: colors.text }]}>
        {product.product_name || product.product_name_en || t('result.unknownProduct')}
      </Text>
      
      {/* Brand */}
      {product.brands && (
        <Text style={[styles.brand, { color: colors.textSecondary }]}>
          {product.brands}
        </Text>
      )}
      
      {/* Flags Row */}
      <View style={styles.flagsRow}>
        <ConfidenceBadge product={product} />
        {product.origins_tags && product.origins_tags.length > 0 && (
          <CountryFlag country={product.origins_tags[0] as string} />
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  brand: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  flagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
});

export default ProductHeader;

