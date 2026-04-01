/**
 * Product page — Data limitations teaser card + full legal modal (standalone module).
 * Shown when key product fields are missing from databases. Edit copy in i18n: result.legalDataLimitations*
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import InfoModal from '../InfoModal';
import { useTheme } from '../../theme';
import { Product } from '../../types/product';

type Props = {
  product: Product | null | undefined;
};

export default function ProductDataLimitationsCard({ product }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const open = useCallback(() => setModalVisible(true), []);
  const close = useCallback(() => setModalVisible(false), []);

  if (!product) {
    return null;
  }

  const missingIngredients = !product.ingredients_text?.trim();
  const missingCountries = !product.countries?.trim();
  if (!missingIngredients && !missingCountries) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={open}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={t('result.legalDataLimitationsTeaserA11y')}
      >
        <Ionicons
          name="warning-outline"
          size={20}
          color={colors.warning || '#ff9800'}
          style={styles.cardIcon}
        />
        <View style={styles.cardTextWrap}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t('result.legalDataLimitationsTeaserTitle')}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {t('result.legalDataLimitationsTeaserBody')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>

      <InfoModal
        visible={modalVisible}
        onClose={close}
        title={t('result.legalDataLimitationsModalTitle')}
        icon="cloud-offline-outline"
        iconColor={colors.warning || '#ff9800'}
      >
        <LegalParagraph text={t('result.legalDataLimitationsModalP1')} colors={colors} />
        <LegalParagraph text={t('result.legalDataLimitationsModalP2')} colors={colors} />
        <LegalParagraph text={t('result.legalDataLimitationsModalP3')} colors={colors} />
        <LegalParagraph text={t('result.legalDataLimitationsModalP4')} colors={colors} />
        <LegalParagraph text={t('result.legalDataLimitationsModalP5')} colors={colors} />
      </InfoModal>
    </>
  );
}

function LegalParagraph({
  text,
  colors,
}: {
  text: string;
  colors: { text: string; textSecondary: string };
}) {
  return (
    <Text style={[styles.modalParagraph, { color: colors.textSecondary }]}>{text}</Text>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  cardIcon: {
    marginTop: 2,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalParagraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
});
