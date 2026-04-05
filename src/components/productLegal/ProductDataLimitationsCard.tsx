/**
 * Product page — Data limitations teaser card + full legal modal (standalone module).
 * Edit copy in i18n: result.legalDataLimitations*
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import InfoModal from '../InfoModal';
import { useTheme } from '../../theme';
import { Product } from '../../types/product';

/** Match disclaimer / alert emphasis red */
const INCOMPLETE_DATA_CARD_BORDER_RED = '#d32f2f';

type Props = {
  product: Product | null | undefined;
  /** Opens manual product entry (edit) from the modal — wired on the result screen. */
  onOpenManualEdit?: () => void;
};

function ManualEditActionRow({
  onPress,
  label,
  accessibilityLabel,
  primaryColor,
}: {
  onPress: () => void;
  label: string;
  accessibilityLabel: string;
  primaryColor: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.editLinkRow, { borderColor: primaryColor, backgroundColor: primaryColor + '12' }]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name="create-outline" size={22} color={primaryColor} />
      <Text style={[styles.editLinkText, { color: primaryColor }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={primaryColor} />
    </TouchableOpacity>
  );
}

export default function ProductDataLimitationsCard({ product, onOpenManualEdit }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const open = useCallback(() => setModalVisible(true), []);
  const close = useCallback(() => setModalVisible(false), []);

  const handleManualEditPress = useCallback(() => {
    close();
    onOpenManualEdit?.();
  }, [close, onOpenManualEdit]);

  const editLabel = t('result.legalDataLimitationsModalEditLink');
  const editA11y = t('result.legalDataLimitationsModalEditLinkA11y');

  if (!product) {
    return null;
  }

  const missingIngredients = !product.ingredients_text?.trim();
  const missingCountries = !product.countries?.trim();
  if (!missingIngredients && !missingCountries) {
    return null;
  }

  const showEdit = onOpenManualEdit != null;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: INCOMPLETE_DATA_CARD_BORDER_RED },
        ]}
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
        {showEdit ? (
          <View style={styles.editButtonTopWrap}>
            <ManualEditActionRow
              onPress={handleManualEditPress}
              label={editLabel}
              accessibilityLabel={editA11y}
              primaryColor={colors.primary}
            />
          </View>
        ) : null}

        <LegalParagraph text={t('result.legalDataLimitationsModalP1')} colors={colors} />
        <LegalParagraph text={t('result.legalDataLimitationsModalP2')} colors={colors} />
        <LegalParagraph text={t('result.legalDataLimitationsModalP3')} colors={colors} />
        <LegalParagraph text={t('result.legalDataLimitationsModalP4')} colors={colors} />
        <LegalParagraph text={t('result.legalDataLimitationsModalP5')} colors={colors} />

        {showEdit ? (
          <View style={styles.editButtonBottomWrap}>
            <ManualEditActionRow
              onPress={handleManualEditPress}
              label={editLabel}
              accessibilityLabel={editA11y}
              primaryColor={colors.primary}
            />
          </View>
        ) : null}
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
    marginTop: 20,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    gap: 10,
  },
  editButtonTopWrap: {
    marginBottom: 16,
  },
  editButtonBottomWrap: {
    marginTop: 4,
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
  editLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  editLinkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
});
