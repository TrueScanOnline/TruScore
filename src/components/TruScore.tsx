// src/components/TruScore.tsx – Rveel Score v1.4 display component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TruScoreResult } from '../lib/truscoreEngine';
import { productIdentity } from '../config/productIdentity';
import { useTheme } from '../theme';
import {
  getTruScoreConsumerPresentation,
} from '../utils/truScorePresentation';

type TruScorePillar = 'Body' | 'Planet' | 'Ethics' | 'Open';

interface TruScoreProps {
  truScore: TruScoreResult;
  size?: 'small' | 'medium' | 'large';
  /** When provided, pillar rows become the W3-S12a pillar look-through entry point. */
  onPillarPress?: (pillar: TruScorePillar) => void;
}

const TruScore = React.memo(function TruScore({ truScore, size = 'medium', onPillarPress }: TruScoreProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { truscore, breakdown } = truScore;
  const presentation = getTruScoreConsumerPresentation(truScore);

  // Color based on score (scored path only; never call with null)
  const getScoreColor = (s: number) => {
    if (s >= 80) return '#16a085'; // Green (excellent)
    if (s >= 60) return '#4dd09f'; // Light green (good)
    if (s >= 40) return '#ffd93d'; // Yellow (fair)
    return '#ff6b6b'; // Red (poor)
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return t('trust.excellent') || 'Excellent';
    if (s >= 60) return t('trust.good') || 'Good';
    if (s >= 40) return t('trust.fair') || 'Fair';
    return t('trust.poor') || 'Poor';
  };

  const getPillarColor = (pillar: string, value: number) => {
    if (value >= 20) return '#16a085';
    if (value >= 15) return '#4dd09f';
    if (value >= 10) return '#ffd93d';
    return '#ff6b6b';
  };

  const sizeStyles = {
    small: { container: styles.smallContainer, score: styles.smallScore, label: styles.smallLabel },
    medium: { container: styles.mediumContainer, score: styles.mediumScore, label: styles.mediumLabel },
    large: { container: styles.largeContainer, score: styles.largeScore, label: styles.largeLabel },
  };

  const currentStyles = sizeStyles[size];

  if (presentation.kind === 'unavailable') {
    return (
      <View style={[styles.container, currentStyles.container]}>
        <Text
          style={[styles.label, currentStyles.label, { color: colors.text, textAlign: 'center' }]}
        >
          {presentation.title}
        </Text>
        <Text
          style={[
            styles.subLabel,
            styles.unavailableExplanation,
            { color: colors.textSecondary, textAlign: 'center' },
          ]}
        >
          {presentation.explanation}
        </Text>
      </View>
    );
  }

  const scored = presentation.score;

  return (
    <View style={[styles.container, currentStyles.container]}>
      {/* Main Score */}
      <View style={[styles.scoreCircle, { borderColor: getScoreColor(scored), backgroundColor: colors.card }]}>
        <Text style={[styles.scoreText, currentStyles.score, { color: getScoreColor(scored) }]}>
          {scored}
        </Text>
      </View>
      <Text style={[styles.label, currentStyles.label, { color: colors.text }]}>
        {getScoreLabel(scored)}
      </Text>
      <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{productIdentity.publicScoreName}</Text>

      {/* Pillar Bars - Display in consistent order: Body, Planet, Ethics, Open */}
      <View style={styles.pillarsContainer}>
        {(['Body', 'Planet', 'Ethics', 'Open'] as const).map((pillar) => {
          const value = breakdown[pillar];
          // Never coerce null/missing pillar to 0 for display
          if (typeof value !== 'number' || Number.isNaN(value)) {
            return (
              <View key={pillar} style={styles.pillarRow}>
                <Text style={[styles.pillarLabel, { color: colors.text }]}>{pillar}</Text>
                <View style={[styles.pillarBarContainer, { backgroundColor: colors.surface }]} />
                <Text style={[styles.pillarValue, { color: colors.textSecondary }]}>—</Text>
              </View>
            );
          }
          const rowContent = (
            <>
              <Text style={[styles.pillarLabel, { color: colors.text }]}>{pillar}</Text>
              <View style={[styles.pillarBarContainer, { backgroundColor: colors.surface }]}>
                <View
                  style={[
                    styles.pillarBar,
                    {
                      width: `${(value / 25) * 100}%`,
                      backgroundColor: getPillarColor(pillar, value),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.pillarValue, { color: colors.text }]}>{value}/25</Text>
            </>
          );
          return onPillarPress ? (
            <TouchableOpacity
              key={pillar}
              style={styles.pillarRow}
              onPress={() => onPillarPress(pillar)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={pillar}
            >
              {rowContent}
            </TouchableOpacity>
          ) : (
            <View key={pillar} style={styles.pillarRow}>
              {rowContent}
            </View>
          );
        })}
      </View>
    </View>
  );
});

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
    // backgroundColor will be set dynamically via style prop
  },
  scoreText: {
    fontWeight: 'bold',
  },
  label: {
    fontWeight: '600',
    marginTop: 8,
  },
  subLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  unavailableExplanation: {
    marginTop: 8,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  pillarsContainer: {
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillarLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 60,
  },
  pillarBarContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  pillarBar: {
    height: '100%',
    borderRadius: 4,
  },
  pillarValue: {
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
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
    fontSize: 64,
  },
  largeLabel: {
    fontSize: 22,
  },
});

export default TruScore;
