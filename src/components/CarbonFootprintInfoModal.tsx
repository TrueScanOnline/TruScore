import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Linking from 'expo-linking';
import InfoModal from './InfoModal';
import { useTheme } from '../theme';
import type { Product } from '../types/product';
import {
  getOffCarbonFootprintRows,
  hasOffCarbonFootprintDisplay,
  resolveOpenFoodFactsProductPageUrl,
} from '../utils/carbonOffDisplay';

const CARBON_ICON_COLOR = '#e67e22';

type Props = {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
};

export default function CarbonFootprintInfoModal({ visible, onClose, product }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (!product || !hasOffCarbonFootprintDisplay(product)) {
    return null;
  }

  const rows = getOffCarbonFootprintRows(product);
  const offUrl = resolveOpenFoodFactsProductPageUrl(product);

  return (
    <InfoModal
      visible={visible}
      onClose={onClose}
      title={t('result.carbonFootprint')}
      icon="leaf-outline"
      iconColor={CARBON_ICON_COLOR}
    >
      {rows.map((row, index) => (
        <View
          key={`${row.labelKey}-${index}`}
          style={[
            styles.rowBlock,
            index > 0 && styles.rowBlockSpaced,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Text style={[styles.rowValue, { color: colors.text }]}>
            {t(row.labelKey, row.labelParams)}
          </Text>
          {row.hintKey ? (
            <Text style={[styles.rowHint, { color: colors.textSecondary }]}>{t(row.hintKey)}</Text>
          ) : null}
        </View>
      ))}

      <TouchableOpacity
        style={[styles.offProductLink, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => Linking.openURL(offUrl).catch(() => {})}
        activeOpacity={0.7}
        accessibilityRole="link"
      >
        <Ionicons name="open-outline" size={22} color={CARBON_ICON_COLOR} />
        <View style={styles.offProductLinkTextCol}>
          <Text style={[styles.offProductLinkTitle, { color: colors.primary }]}>
            {t('result.packagingSourceOffProduct')}
          </Text>
          <Text style={[styles.offProductUrl, { color: colors.textTertiary }]} selectable numberOfLines={2}>
            {offUrl}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  offProductLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
  },
  offProductLinkTextCol: {
    flex: 1,
    minWidth: 0,
  },
  offProductLinkTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  offProductUrl: {
    fontSize: 12,
    marginTop: 4,
  },
  rowBlock: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  rowBlockSpaced: {
    marginTop: 10,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  rowHint: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
});
