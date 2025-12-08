// Modular EcoScore Card Component

import React, { useState, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import { ProductWithTrustScore } from '../../../../types/product';
import EcoScore from '../../../../components/EcoScore';
import EcoScoreInfoModal from '../../../../components/EcoScoreInfoModal';
import { calculateEcoScore } from '../../../../services/openFoodFacts';
import { useTheme } from '../../../../theme';
import { CardPremiumGate } from '../../../premium/CardPremiumGate';
import { PremiumFeature } from '../../../../utils/premiumFeatures';
import { EcoScoreCardSkeleton } from './EcoScoreCardSkeleton';
import { EcoScoreCardError } from './EcoScoreCardError';

interface EcoScoreCardProps {
  product?: ProductWithTrustScore;
  onShare?: () => void;
  premiumFeatures?: PremiumFeature[];
}

const gradeColors: Record<string, string> = {
  a: '#16a085',
  b: '#4dd09f',
  c: '#ffd93d',
  d: '#ff9800',
  e: '#ff6b6b',
};

function EcoScoreCardContent({ product, onShare, premiumFeatures }: EcoScoreCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  if (!product) {
    return null;
  }

  const calculatedEcoScore = calculateEcoScore(product);
  if (!calculatedEcoScore || calculatedEcoScore.score === undefined || calculatedEcoScore.score <= 0) {
    return null; // Don't show card if no Eco-Score data
  }

  const grade = calculatedEcoScore.grade || 
    (calculatedEcoScore.score >= 80 ? 'a' :
     calculatedEcoScore.score >= 70 ? 'b' :
     calculatedEcoScore.score >= 55 ? 'c' :
     calculatedEcoScore.score >= 40 ? 'd' : 'e');
  
  const borderColor = gradeColors[grade] || '#95a5a6';

  return (
    <>
      <CardPremiumGate features={premiumFeatures || []}>
        <TouchableOpacity
          style={[styles.card, {
            backgroundColor: colors.card,
            borderColor,
            borderWidth: 2,
          }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="leaf-outline" size={24} color={borderColor} />
              <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
                {t('ecoscore.title', 'Eco-Score')}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={styles.infoButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            {onShare && (
              <TouchableOpacity
                onPress={onShare}
                style={styles.shareButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="share-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          <EcoScore ecoScore={calculatedEcoScore} />
        </TouchableOpacity>
      </CardPremiumGate>

      <EcoScoreInfoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

export default function EcoScoreCard(props: EcoScoreCardProps) {
  return (
    <ErrorBoundary feature="EcoScoreCard">
      <Suspense fallback={<EcoScoreCardSkeleton />}>
        <EcoScoreCardContent {...props} />
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
    marginBottom: 16,
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
  infoButton: {
    marginLeft: 8,
  },
  shareButton: {
    padding: 4,
  },
});


