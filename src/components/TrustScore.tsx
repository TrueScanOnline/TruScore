import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProductWithTrustScore } from '../types/product';

interface TrustScoreProps {
  product: ProductWithTrustScore;
  size?: 'small' | 'medium' | 'large';
}

export default function TrustScore({ product, size = 'medium' }: TrustScoreProps) {
  const { t } = useTranslation();
  const score = product.trust_score;
  
  // Color based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return '#16a085'; // Green (excellent)
    if (s >= 60) return '#4dd09f'; // Light green (good)
    if (s >= 40) return '#ffd93d'; // Yellow (fair)
    return '#ff6b6b'; // Red (poor)
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return t('trust.excellent');
    if (s >= 60) return t('trust.good');
    if (s >= 40) return t('trust.fair');
    return t('trust.poor');
  };

  const sizeStyles = {
    small: { container: styles.smallContainer, score: styles.smallScore, label: styles.smallLabel },
    medium: { container: styles.mediumContainer, score: styles.mediumScore, label: styles.mediumLabel },
    large: { container: styles.largeContainer, score: styles.largeScore, label: styles.largeLabel },
  };

  const currentStyles = sizeStyles[size];

  if (score === null) {
    return null;
  }

  return (
    <View style={[styles.container, currentStyles.container]}>
      <View style={[styles.scoreCircle, { borderColor: getScoreColor(score) }]}>
        <Text style={[styles.scoreText, currentStyles.score, { color: getScoreColor(score) }]}>
          {score}
        </Text>
      </View>
      <Text style={[styles.label, currentStyles.label]}>
        {getScoreLabel(score)}
      </Text>
      <Text style={styles.subLabel}>{t('result.trustScore')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircle: {
    borderWidth: 4,
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  scoreText: {
    fontWeight: 'bold',
  },
  label: {
    fontWeight: '600',
    marginTop: 8,
    color: '#1a1a1a',
  },
  subLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  // Small
  smallContainer: {
    padding: 8,
  },
  smallScore: {
    fontSize: 24,
  },
  smallLabel: {
    fontSize: 14,
  },
  // Medium
  mediumContainer: {
    padding: 16,
  },
  mediumScore: {
    fontSize: 48,
  },
  mediumLabel: {
    fontSize: 18,
  },
  // Large
  largeContainer: {
    padding: 24,
  },
  largeScore: {
    fontSize: 72,
  },
  largeLabel: {
    fontSize: 24,
  },
});

