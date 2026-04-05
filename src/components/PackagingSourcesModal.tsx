import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import InfoModal from './InfoModal';
import { useTheme } from '../theme';
import {
  openFoodFactsProductUrl,
  getGovernmentRecyclingPageUrl,
  resolvePackagingCountryCode,
} from '../utils/packagingRecyclingSources';
import { getUserCountryCode } from '../utils/countryDetection';

type Props = {
  visible: boolean;
  onClose: () => void;
  barcode: string;
  /** Defaults to device region via getUserCountryCode */
  countryCode?: string | null;
};

export default function PackagingSourcesModal({ visible, onClose, barcode, countryCode }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const resolvedCountry = countryCode ?? getUserCountryCode();
  const regionCode = resolvePackagingCountryCode(resolvedCountry);
  const offUrl = openFoodFactsProductUrl(barcode);
  const gov = getGovernmentRecyclingPageUrl(resolvedCountry);

  const open = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const regionLabel =
    regionCode === 'GLOBAL'
      ? t('result.packagingSourcesRegionUnknown')
      : t('result.packagingSourcesRegionSet', { code: regionCode });

  return (
    <InfoModal
      visible={visible}
      onClose={onClose}
      title={t('result.packagingSourcesModalTitle')}
      icon="link-outline"
      iconColor={colors.primary}
    >
      <Text style={[styles.regionLine, { color: colors.textSecondary }]}>{regionLabel}</Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t('result.packagingSourcesModalSubtitle')}
      </Text>

      <Text style={[styles.blockHeading, { color: colors.text }]}>{t('result.packagingSourcesOffHeading')}</Text>
      <Text style={[styles.blockBody, { color: colors.textSecondary }]}>
        {t('result.packagingSourcesOffExplain')}
      </Text>

      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => open(offUrl)}
        activeOpacity={0.7}
        accessibilityRole="link"
      >
        <Ionicons name="nutrition-outline" size={22} color={colors.primary} />
        <View style={styles.rowTextCol}>
          <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={3}>
            {t('result.packagingSourceOffProduct')}
          </Text>
          <Text style={[styles.urlLine, { color: colors.textTertiary }]} selectable>
            {offUrl}
          </Text>
        </View>
        <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Text style={[styles.blockHeading, { color: colors.text, marginTop: 8 }]}>
        {t('result.packagingSourcesGovHeading')}
      </Text>
      <Text style={[styles.blockBody, { color: colors.textSecondary }]}>
        {t('result.packagingSourcesGovExplain')}
      </Text>

      {gov ? (
        <TouchableOpacity
          style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => open(gov.url)}
          activeOpacity={0.7}
          accessibilityRole="link"
        >
          <Ionicons name="flag-outline" size={22} color={colors.primary} />
          <View style={styles.rowTextCol}>
            <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={4}>
              {t(gov.labelKey, gov.label)}
            </Text>
            <Text style={[styles.urlLine, { color: colors.textTertiary }]} selectable>
              {gov.url}
            </Text>
          </View>
          <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : (
        <Text style={[styles.hint, { color: colors.textTertiary }]}>{t('result.packagingNoGovLink')}</Text>
      )}
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  regionLine: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  blockHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  blockBody: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  rowTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  urlLine: {
    fontSize: 11,
    lineHeight: 15,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
});
