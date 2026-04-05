// Open Food Facts carbon / CO₂ footprint — card opens detail modal (sources + OFF link).

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import CarbonFootprintInfoModal from '../../../../components/CarbonFootprintInfoModal';
import { ProductWithTrustScore } from '../../../../types/product';
import { useTheme } from '../../../../theme';
import { CardPremiumGate } from '../../../premium/CardPremiumGate';
import { PremiumFeature } from '../../../../utils/premiumFeatures';
import {
  getOffCarbonFootprintRows,
  getOffPetrolCarDrivingKmPer100g,
  hasOffCarbonFootprintDisplay,
} from '../../../../utils/carbonOffDisplay';

/** Orange / amber frame for climate / CO₂ emphasis */
const CARBON_CARD_BORDER = '#e67e22';

export interface CarbonFootprintCardProps {
  product?: ProductWithTrustScore;
  premiumFeatures?: PremiumFeature[];
  /** `result` matches the main product screen packaging block (compact + scroll). */
  layout?: 'module' | 'result';
  containerStyle?: StyleProp<ViewStyle>;
}

function CarbonFootprintCardContent({
  product,
  premiumFeatures,
  layout = 'module',
  containerStyle,
}: CarbonFootprintCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  if (!product || !hasOffCarbonFootprintDisplay(product)) {
    return null;
  }

  const rows = getOffCarbonFootprintRows(product, { includeHints: false });
  const drivingKm = getOffPetrolCarDrivingKmPer100g(product);
  const isResultLayout = layout === 'result';

  return (
    <CardPremiumGate features={premiumFeatures || []}>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [
          styles.card,
          isResultLayout && styles.cardResult,
          {
            backgroundColor: colors.card,
            borderColor: CARBON_CARD_BORDER,
            opacity: pressed ? 0.92 : 1,
          },
          containerStyle,
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('result.carbonFootprint')}
        accessibilityHint={t('result.carbonFootprintCardOpenModalA11y')}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="leaf-outline" size={22} color={CARBON_CARD_BORDER} />
            <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
              {t('result.carbonFootprint')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={CARBON_CARD_BORDER} />
        </View>

        <ScrollView
          style={isResultLayout ? styles.scrollResult : styles.scrollModule}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          {rows.map((row, index) => (
            <View
              key={`${row.labelKey}-${index}`}
              style={[styles.rowBlock, index > 0 && styles.rowBlockSpaced, { borderColor: colors.border }]}
            >
              <Text style={[styles.rowValue, { color: colors.text }]}>
                {t(row.labelKey, row.labelParams)}
              </Text>
            </View>
          ))}
          {drivingKm != null ? (
            <Text style={[styles.drivingEquiv, { color: colors.textSecondary }]}>
              {t('result.carbonOffDrivingEquivalence', { km: String(drivingKm) })}
            </Text>
          ) : null}
        </ScrollView>
      </Pressable>

      <CarbonFootprintInfoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        product={product}
      />
    </CardPremiumGate>
  );
}

export default function CarbonFootprintCard(props: CarbonFootprintCardProps) {
  return (
    <ErrorBoundary feature="CarbonFootprintCard">
      <CarbonFootprintCardContent {...props} />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardResult: {
    maxHeight: 320,
    marginTop: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  scrollModule: {
    maxHeight: 260,
  },
  scrollResult: {
    maxHeight: 270,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  rowBlock: {
    padding: 10,
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
  drivingEquiv: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
    fontWeight: '500',
  },
});
