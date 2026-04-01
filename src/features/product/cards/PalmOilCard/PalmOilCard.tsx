// Modular Palm Oil Card Component
// Hidden on product page: palm oil still drives Planet/TruScore, values insights, and sharing payloads.

import React, { useState, Suspense } from 'react';

/** When true, renders the card + info modal on the product screen. */
export const PALM_OIL_PRODUCT_CARD_VISIBLE = false;
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import { ProductWithTrustScore } from '../../../../types/product';
import PalmOilInfoModal from '../../../../components/PalmOilInfoModal';
import { getPalmOilStatus, getPalmOilFlagColor } from '../../../../utils/palmOilUtils';
import { useTheme } from '../../../../theme';
import { CardPremiumGate } from '../../../premium/CardPremiumGate';
import { PremiumFeature } from '../../../../utils/premiumFeatures';
import { PalmOilCardSkeleton } from './PalmOilCardSkeleton';
import { PalmOilCardError } from './PalmOilCardError';

interface PalmOilCardProps {
  product?: ProductWithTrustScore;
  onShare?: () => void;
  premiumFeatures?: PremiumFeature[];
}

function PalmOilCardContent({ product, onShare, premiumFeatures }: PalmOilCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  if (!PALM_OIL_PRODUCT_CARD_VISIBLE) {
    return null;
  }

  if (!product || !product.palm_oil_analysis) {
    return null;
  }

  const palmOilStatus = getPalmOilStatus(product.palm_oil_analysis);
  if (!palmOilStatus) return null;

  const { flag, isPalmOilFree, containsPalmOil, isNonSustainable } = palmOilStatus;
  const palmOilFlagColor = getPalmOilFlagColor(flag);

  return (
    <>
      <CardPremiumGate features={premiumFeatures || []}>
        <TouchableOpacity
          style={[styles.card, {
            backgroundColor: colors.card,
            borderWidth: 2,
            borderColor: palmOilFlagColor,
          }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="flag" size={24} color={palmOilFlagColor} />
            <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
              {t('result.palmOil')}
            </Text>
          </View>
          <View style={styles.content}>
            {isPalmOilFree ? (
              <View style={[styles.status, { backgroundColor: palmOilFlagColor + '20', borderLeftWidth: 4, borderLeftColor: palmOilFlagColor }]}>
                <Text style={[styles.flag, { color: palmOilFlagColor }]}>🟢</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                  {t('result.greenFlag')} - {t('result.palmOilFree')}
                </Text>
              </View>
            ) : isNonSustainable ? (
              <View style={[styles.status, { backgroundColor: palmOilFlagColor + '20', borderLeftWidth: 4, borderLeftColor: palmOilFlagColor }]}>
                <Text style={[styles.flag, { color: palmOilFlagColor }]}>🔴</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                  {t('result.redFlag')} - {t('result.nonSustainablePalmOil')}
                </Text>
              </View>
            ) : containsPalmOil ? (
              <View style={[styles.status, { backgroundColor: palmOilFlagColor + '20', borderLeftWidth: 4, borderLeftColor: palmOilFlagColor }]}>
                <Text style={[styles.flag, { color: palmOilFlagColor }]}>🟠</Text>
                <Text style={[styles.text, { color: colors.text }]}>
                  {t('result.orangeFlag')} - {t('result.containsPalmOil')}
                </Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </CardPremiumGate>

      <PalmOilInfoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        product={product}
      />
    </>
  );
}

export default function PalmOilCard(props: PalmOilCardProps) {
  return (
    <ErrorBoundary feature="PalmOilCard">
      <Suspense fallback={<PalmOilCardSkeleton />}>
        <PalmOilCardContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    marginTop: 8,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  flag: {
    fontSize: 18,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});


