/**
 * Product page — Disclaimer teaser card + full legal modal (standalone module).
 * Edit copy in i18n: result.legalDisclaimer*
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import InfoModal from '../InfoModal';
import { useTheme } from '../../theme';

/** Product page disclaimer frame — high-visibility red (aligned with alert banner emphasis). */
const DISCLAIMER_CARD_BORDER_RED = '#d32f2f';

export default function ProductDisclaimerCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const open = useCallback(() => setModalVisible(true), []);
  const close = useCallback(() => setModalVisible(false), []);

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: DISCLAIMER_CARD_BORDER_RED }]}
        onPress={open}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={t('result.legalDisclaimerTeaserA11y')}
      >
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={colors.primary}
          style={styles.cardIcon}
        />
        <View style={styles.cardTextWrap}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t('result.legalDisclaimerTeaserTitle')}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {t('result.legalDisclaimerTeaserBody')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>

      <InfoModal
        visible={modalVisible}
        onClose={close}
        title={t('result.legalDisclaimerModalTitle')}
        icon="document-text-outline"
        iconColor={colors.primary}
      >
        <LegalParagraph text={t('result.legalDisclaimerModalP1')} colors={colors} />
        <LegalParagraph text={t('result.legalDisclaimerModalP2')} colors={colors} />
        <LegalParagraph text={t('result.legalDisclaimerModalP3')} colors={colors} />
        <LegalParagraph text={t('result.legalDisclaimerModalP4')} colors={colors} />
        <LegalParagraph text={t('result.legalDisclaimerModalP5')} colors={colors} />
        <LegalParagraph text={t('result.legalDisclaimerModalP6')} colors={colors} />
        <LegalParagraph text={t('result.legalDisclaimerModalP7')} colors={colors} />
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
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
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
