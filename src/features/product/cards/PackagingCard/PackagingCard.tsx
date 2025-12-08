// Modular Packaging Card Component

import React, { useState, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import { ProductWithTrustScore } from '../../../../types/product';
import PackagingInfoModal from '../../../../components/PackagingInfoModal';
import { meetsLocalRecyclingRequirements } from '../../../../utils/packagingRecyclability';
import { useTheme } from '../../../../theme';
import { CardPremiumGate } from '../../../premium/CardPremiumGate';
import { PremiumFeature } from '../../../../utils/premiumFeatures';
import { PackagingCardSkeleton } from './PackagingCardSkeleton';
import { PackagingCardError } from './PackagingCardError';

interface PackagingCardProps {
  product?: ProductWithTrustScore;
  onShare?: () => void;
  premiumFeatures?: PremiumFeature[];
}

function PackagingCardContent({ product, onShare, premiumFeatures }: PackagingCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  if (!product || !product.packaging_data || product.packaging_data.items.length === 0) {
    return null;
  }

  const meetsLocalRequirements = meetsLocalRecyclingRequirements(product.packaging_data.items);
  const borderColor = meetsLocalRequirements ? '#16a085' : '#ff6b6b';

  return (
    <>
      <CardPremiumGate features={premiumFeatures || []}>
        <TouchableOpacity
          style={[styles.card, {
            backgroundColor: colors.card,
            borderWidth: 2,
            borderColor,
          }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="cube-outline" size={24} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
                {t('result.packaging')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.content}>
            <View style={styles.badgesRow}>
              {product.packaging_data.isRecyclable && (
                <View style={[styles.badge, { backgroundColor: '#16a085' + '20' }]}>
                  <Ionicons name="reload-circle" size={16} color="#16a085" />
                  <Text style={[styles.badgeText, { color: colors.text }]}>
                    {t('result.recyclable')}
                  </Text>
                </View>
              )}
              {product.packaging_data.isReusable && (
                <View style={[styles.badge, { backgroundColor: '#4dd09f' + '20' }]}>
                  <Ionicons name="refresh-circle" size={16} color="#4dd09f" />
                  <Text style={[styles.badgeText, { color: colors.text }]}>
                    {t('result.reusable')}
                  </Text>
                </View>
              )}
              {product.packaging_data.isBiodegradable && (
                <View style={[styles.badge, { backgroundColor: '#16a085' + '20' }]}>
                  <Ionicons name="leaf" size={16} color="#16a085" />
                  <Text style={[styles.badgeText, { color: colors.text }]}>
                    {t('result.biodegradable')}
                  </Text>
                </View>
              )}
            </View>
            {product.packaging_data.recyclabilityScore > 0 && (
              <View style={styles.scoreRow}>
                <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
                  {t('result.recyclabilityScore')}:
                </Text>
                <Text style={[styles.scoreValue, { color: colors.primary }]}>
                  {product.packaging_data.recyclabilityScore}/100
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </CardPremiumGate>

      <PackagingInfoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        product={product}
      />
    </>
  );
}

export default function PackagingCard(props: PackagingCardProps) {
  return (
    <ErrorBoundary feature="PackagingCard">
      <Suspense fallback={<PackagingCardSkeleton />}>
        <PackagingCardContent {...props} />
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
  content: {
    marginTop: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});


