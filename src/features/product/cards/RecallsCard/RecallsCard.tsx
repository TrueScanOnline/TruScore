// Modular Recalls Card Component

import React, { useState, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import { ProductWithTrustScore } from '../../../../types/product';
import RecallAlertModal from '../../../../components/RecallAlertModal';
import { useTheme } from '../../../../theme';
import { CardPremiumGate } from '../../../premium/CardPremiumGate';
import { PremiumFeature } from '../../../../utils/premiumFeatures';
import { RecallsCardSkeleton } from './RecallsCardSkeleton';
import { RecallsCardError } from './RecallsCardError';

interface RecallsCardProps {
  product?: ProductWithTrustScore;
  onShare?: () => void;
  premiumFeatures?: PremiumFeature[];
}

function RecallsCardContent({ product, onShare, premiumFeatures }: RecallsCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  if (!product || !product.recalls || product.recalls.length === 0) {
    return null;
  }

  const recallCount = product.recalls.length;

  return (
    <>
      <CardPremiumGate features={premiumFeatures || []}>
        <TouchableOpacity
          style={[styles.banner, {
            backgroundColor: '#ff6b6b' + '20',
            borderColor: '#ff6b6b',
          }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.content}>
            <View style={styles.left}>
              <View style={[styles.iconContainer, { backgroundColor: '#ff6b6b' + '30' }]}>
                <Ionicons name="warning" size={20} color="#ff6b6b" />
              </View>
              <View style={styles.text}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t('result.foodRecall', 'Food Recall Alert')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {recallCount === 1
                    ? t('result.recallCountSingle', '1 recall found - Tap for details')
                    : t('result.recallCountMultiple', `${recallCount} recalls found - Tap for details`)
                  }
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </CardPremiumGate>

      <RecallAlertModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        recalls={product.recalls}
      />
    </>
  );
}

export default function RecallsCard(props: RecallsCardProps) {
  return (
    <ErrorBoundary feature="RecallsCard">
      <Suspense fallback={<RecallsCardSkeleton />}>
        <RecallsCardContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  banner: {
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});


