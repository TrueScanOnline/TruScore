import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import type { Product } from '../types/product';
import {
  getOffPackagingItems,
  collectUniquePackagingShapes,
  collectUniquePackagingMaterials,
  isPackagingItemRecyclablePerOff,
  describePackagingItem,
  formatOffPackagingField,
} from '../utils/packagingOffDisplay';

type Props = {
  product: Product;
};

/** Card preview only; Eco-Score packaging adjustment explanations live in PackagingInfoModal. */
export default function PackagingOffCardContent({ product }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const items = getOffPackagingItems(product);
  const recyclableItems = items.filter(isPackagingItemRecyclablePerOff);
  const partLabels = collectUniquePackagingShapes(items);
  const materialLabels = collectUniquePackagingMaterials(items);

  return (
    <View style={styles.wrap}>
      {product.packaging_data &&
      (product.packaging_data.isRecyclable ||
        product.packaging_data.isReusable ||
        product.packaging_data.isBiodegradable) ? (
        <View style={styles.badgesRow}>
          {product.packaging_data.isRecyclable ? (
            <View style={[styles.badge, { backgroundColor: '#16a085' + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.text }]}>{t('result.recyclable')}</Text>
            </View>
          ) : null}
          {product.packaging_data.isReusable ? (
            <View style={[styles.badge, { backgroundColor: '#4dd09f' + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.text }]}>{t('result.reusable')}</Text>
            </View>
          ) : null}
          {product.packaging_data.isBiodegradable ? (
            <View style={[styles.badge, { backgroundColor: '#16a085' + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.text }]}>{t('result.biodegradable')}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {partLabels.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('result.packagingOffPartsTitle')}
          </Text>
          {partLabels.map((label) => (
            <View key={label} style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>{label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {materialLabels.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('result.packagingOffMaterialsTitle')}
          </Text>
          {materialLabels.map((label) => (
            <View key={label} style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>{label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {recyclableItems.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('result.packagingOffRecyclableParts')}
          </Text>
          {recyclableItems.map((item, index) => (
            <View key={`r-${index}`} style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: colors.primary }]}>•</Text>
              <Text style={[styles.bulletText, { color: colors.text }]}>
                {describePackagingItem(item)}
              </Text>
            </View>
          ))}
        </View>
      ) : items.length > 0 ? (
        <Text style={[styles.muted, { color: colors.textSecondary }]}>
          {t('result.packagingOffNoRecyclableListed')}
        </Text>
      ) : null}

      {items.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('result.packagingOffAllComponents')}
          </Text>
          {items.map((item, index) => (
            <View key={`a-${index}`} style={[styles.itemCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.itemLine, { color: colors.text }]}>{describePackagingItem(item)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {items.length === 0 && product.packaging_tags && product.packaging_tags.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('result.packagingOffTags')}</Text>
          <View style={styles.tagsWrap}>
            {product.packaging_tags.map((tag) => (
              <View
                key={tag}
                style={[styles.tagChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.tagText, { color: colors.text }]}>{formatOffPackagingField(tag)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    width: '100%',
    alignSelf: 'stretch',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginTop: 4,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  muted: {
    fontSize: 13,
    lineHeight: 18,
  },
  itemCard: {
    padding: 10,
    borderRadius: 8,
  },
  itemLine: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
