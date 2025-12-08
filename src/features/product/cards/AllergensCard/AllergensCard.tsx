// Modular Allergens & Additives Card Component

import React, { useState, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import { ProductWithTrustScore } from '../../../../types/product';
import AllergensAdditivesModal from '../../../../components/AllergensAdditivesModal';
import { useTheme } from '../../../../theme';
import { CardPremiumGate } from '../../../premium/CardPremiumGate';
import { PremiumFeature } from '../../../../utils/premiumFeatures';
import { AllergensCardSkeleton } from './AllergensCardSkeleton';
import { AllergensCardError } from './AllergensCardError';

interface AllergensCardProps {
  product?: ProductWithTrustScore;
  onShare?: () => void;
  premiumFeatures?: PremiumFeature[];
}

function AllergensCardContent({ product, onShare, premiumFeatures }: AllergensCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  if (!product || (!product.allergens_tags && !product.additives_tags)) {
    return null;
  }

  const hasAllergens = product.allergens_tags && product.allergens_tags.length > 0;
  const hasAdditives = product.additives_tags && product.additives_tags.length > 0;
  const hasDetected = hasAllergens || hasAdditives;
  const redColor = '#ff6b6b';

  return (
    <>
      <CardPremiumGate features={premiumFeatures || []}>
        <TouchableOpacity
          style={[styles.card, {
            backgroundColor: colors.card,
            borderWidth: hasDetected ? 2 : 0,
            borderColor: hasDetected ? redColor : 'transparent',
          }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="warning" size={24} color={hasDetected ? redColor : colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
                {t('result.allergensAdditives')}
              </Text>
            </View>
            <Ionicons name="information-circle-outline" size={20} color={hasDetected ? redColor : colors.primary} />
          </View>
          {hasAllergens && product.allergens_tags && (
            <View style={[styles.warningSection, { backgroundColor: colors.error + '20' }]}>
              <Ionicons name="warning" size={20} color={colors.error} />
              <Text style={[styles.warningTitle, { color: colors.error }]}>
                {t('result.containsAllergens')}
              </Text>
              <Text style={[styles.warningText, { color: colors.error }]}>
                {product.allergens_tags
                  .map((tag) => tag.replace(/^en:/, '').replace(/-/g, ' '))
                  .join(', ')}
              </Text>
            </View>
          )}
          {hasAdditives && product.additives_tags && (
            <View style={styles.additivesSection}>
              <Text style={[styles.additivesLabel, { color: colors.text }]}>
                {t('result.additives')} ({product.additives_tags.length}):
              </Text>
              <Text style={[styles.additivesText, { color: colors.textSecondary }]}>
                {product.additives_tags
                  .map((tag) => tag.replace(/^en:/, '').toUpperCase())
                  .join(', ')}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </CardPremiumGate>

      <AllergensAdditivesModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        product={product}
      />
    </>
  );
}

export default function AllergensCard(props: AllergensCardProps) {
  return (
    <ErrorBoundary feature="AllergensCard">
      <Suspense fallback={<AllergensCardSkeleton />}>
        <AllergensCardContent {...props} />
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
  warningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  warningText: {
    fontSize: 12,
    flex: 1,
  },
  additivesSection: {
    marginTop: 8,
  },
  additivesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  additivesText: {
    fontSize: 12,
    lineHeight: 18,
  },
});


