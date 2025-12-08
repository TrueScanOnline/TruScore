// Modular Processing Level (NOVA) Card Component

import React, { useState, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import { ProductWithTrustScore } from '../../../../types/product';
import ProcessingLevelModal from '../../../../components/ProcessingLevelModal';
import { useTheme } from '../../../../theme';
import { CardPremiumGate } from '../../../premium/CardPremiumGate';
import { PremiumFeature } from '../../../../utils/premiumFeatures';
import { ProcessingCardSkeleton } from './ProcessingCardSkeleton';
import { ProcessingCardError } from './ProcessingCardError';

interface ProcessingCardProps {
  product?: ProductWithTrustScore;
  onShare?: () => void;
  premiumFeatures?: PremiumFeature[];
}

function ProcessingCardContent({ product, onShare, premiumFeatures }: ProcessingCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  if (!product || !product.nova_group) {
    return null;
  }

  const novaColor = product.nova_group === 1 || product.nova_group === 2
    ? '#16a085'
    : product.nova_group === 3
    ? '#ff9500'
    : '#ff6b6b';

  return (
    <>
      <CardPremiumGate features={premiumFeatures || []}>
        <TouchableOpacity
          style={[styles.card, {
            backgroundColor: colors.card,
            borderLeftWidth: 4,
            borderLeftColor: novaColor,
          }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="build-outline" size={24} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
                {t('result.processingLevel')}
              </Text>
            </View>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.novaValue, { color: novaColor }]}>
            NOVA {product.nova_group} ({t(`nova.${product.nova_group}`)})
          </Text>
        </TouchableOpacity>
      </CardPremiumGate>

      <ProcessingLevelModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        novaGroup={product.nova_group}
      />
    </>
  );
}

export default function ProcessingCard(props: ProcessingCardProps) {
  return (
    <ErrorBoundary feature="ProcessingCard">
      <Suspense fallback={<ProcessingCardSkeleton />}>
        <ProcessingCardContent {...props} />
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  novaValue: {
    fontSize: 18,
    fontWeight: '600',
  },
});


