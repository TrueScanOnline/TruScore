/**
 * TruScore Card Component
 * 
 * Displays TruScore with breakdown and info modal.
 * Optimized with React.memo for performance.
 * 
 * @module TruScoreCard
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TruScoreResult } from '../../../lib/truscoreEngine';
import { ProductWithTrustScore } from '../../../types/product';
import { useTheme } from '../../../theme';
import TruScore from '../../../components/TruScore';
import TruScoreInfoModal from '../../../components/TrustScoreInfoModal';
import {
  isOverallTruScoreUnavailable,
  RVEEL_SCORE_UNAVAILABLE_NEUTRAL_COLOR,
} from '../../../utils/truScorePresentation';

interface TruScoreCardProps {
  truScore: TruScoreResult | null;
  product: ProductWithTrustScore | null;
  onShare?: () => void;
}

const TruScoreCard = React.memo(function TruScoreCard({ truScore, product, onShare }: TruScoreCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  
  if (!truScore) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
          {t('trust.insufficientData')}
        </Text>
      </View>
    );
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#16a085';
    if (score >= 60) return '#4dd09f';
    if (score >= 40) return '#ffd93d';
    return '#ff6b6b';
  };

  const unavailable = isOverallTruScoreUnavailable(truScore.truscore);
  // Null overall → neutral chrome; never coerce null → 0 for colour banding
  const chromeColor = unavailable
    ? RVEEL_SCORE_UNAVAILABLE_NEUTRAL_COLOR
    : getScoreColor(truScore.truscore as number);
  
  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: chromeColor }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="shield-checkmark" size={24} color={chromeColor} />
            <Text style={[styles.title, { color: colors.text }]}>{t('trust.title')}</Text>
          </View>
          <View style={styles.headerRight}>
            {onShare && (
              <TouchableOpacity
                onPress={onShare}
                style={styles.shareButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="share-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setInfoModalVisible(true)}
              style={styles.infoButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <TruScore truScore={truScore} size="large" />
      </View>
      
      <TruScoreInfoModal
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
        product={product}
      />
    </>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  shareButton: {
    padding: 4,
  },
  infoButton: {
    padding: 4,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});

export default TruScoreCard;
