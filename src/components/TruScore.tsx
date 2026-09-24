// src/components/TruScore.tsx – Rveel Score v1.4 display component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TruScoreResult } from '../lib/truscoreEngine';
import { productIdentity } from '../config/productIdentity';
import { consumerPillarLabel } from '../lib/scoreHighlights';
import { useTheme } from '../theme';
import {
  getTruScoreConsumerPresentation,
} from '../utils/truScorePresentation';
import { publishedScoreDisplay } from '../lib/rateability';

type TruScorePillar = 'Body' | 'Planet' | 'Ethics' | 'Open';

interface TruScoreProps {
  truScore: TruScoreResult;
  size?: 'small' | 'medium' | 'large';
  /** When provided, pillar rows become the W3-S12a pillar look-through entry point. */
  onPillarPress?: (pillar: TruScorePillar) => void;
  /** First-paint barrier: until settled, all scores remain unrevealed (§12). */
  publicationSettled?: boolean;
}

const TruScore = React.memo(function TruScore({
  truScore,
  size = 'medium',
  onPillarPress,
  publicationSettled = true,
}: TruScoreProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { breakdown, publication } = truScore;
  const presentation = getTruScoreConsumerPresentation(truScore, { publicationSettled });

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#16a085';
    if (s >= 60) return '#4dd09f';
    if (s >= 40) return '#ffd93d';
    return '#ff6b6b';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return t('trust.excellent') || 'Excellent';
    if (s >= 60) return t('trust.good') || 'Good';
    if (s >= 40) return t('trust.fair') || 'Fair';
    return t('trust.poor') || 'Poor';
  };

  const getPillarColor = (value: number) => {
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

  const pillarPublished = (pillar: TruScorePillar): number | null => {
    if (!publicationSettled || publication?.overall.publicationStatus === 'checking') {
      return null;
    }
    const map = {
      Body: publication?.body,
      Planet: publication?.planet,
      Ethics: publication?.claims,
      Open: publication?.transparency,
    } as const;
    const pub = map[pillar];
    if (pub) {
      return pub.publicationStatus === 'rated' ? pub.publishedScore : null;
    }
    const value = breakdown[pillar];
    return typeof value === 'number' && !Number.isNaN(value) ? value : null;
  };

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

  const scored = presentation.kind === 'scored' ? presentation.score : null;
  const overallDisplay =
    presentation.kind === 'scored'
      ? String(presentation.score)
      : publishedScoreDisplay(null);

  return (
    <View style={[styles.container, currentStyles.container]}>
      {scored != null ? (
        <>
          <View style={[styles.scoreCircle, { borderColor: getScoreColor(scored), backgroundColor: colors.card }]}>
            <Text style={[styles.scoreText, currentStyles.score, { color: getScoreColor(scored) }]}>
              {scored}
            </Text>
          </View>
          <Text style={[styles.label, currentStyles.label, { color: colors.text }]}>
            {getScoreLabel(scored)}
          </Text>
        </>
      ) : (
        <>
          <View style={[styles.scoreCircle, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.scoreText, currentStyles.score, { color: colors.textSecondary }]}>
              {overallDisplay}
            </Text>
          </View>
          <Text style={[styles.label, currentStyles.label, { color: colors.textSecondary }]}>
            {presentation.kind === 'checking' ? presentation.title : 'Unrevealed'}
          </Text>
        </>
      )}
      <Text style={[styles.subLabel, { color: colors.textSecondary }]}>{productIdentity.publicScoreName}</Text>

      <View style={styles.pillarsContainer}>
        {(['Body', 'Planet', 'Ethics', 'Open'] as const).map((pillar) => {
          const label = consumerPillarLabel(pillar);
          const value = pillarPublished(pillar);
          if (value == null) {
            return (
              <View key={pillar} style={styles.pillarRow}>
                <Text style={[styles.pillarLabel, { color: colors.text }]}>{label}</Text>
                <View style={[styles.pillarBarContainer, { backgroundColor: colors.surface }]} />
                <Text style={[styles.pillarValue, { color: colors.textSecondary }]}>—</Text>
              </View>
            );
          }
          const rowContent = (
            <>
              <Text style={[styles.pillarLabel, { color: colors.text }]}>{label}</Text>
              <View style={[styles.pillarBarContainer, { backgroundColor: colors.surface }]}>
                <View
                  style={[
                    styles.pillarBar,
                    {
                      width: `${(value / 25) * 100}%`,
                      backgroundColor: getPillarColor(value),
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
              accessibilityLabel={label}
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
    width: '100%',
  },
  smallContainer: { paddingVertical: 8 },
  mediumContainer: { paddingVertical: 12 },
  largeContainer: { paddingVertical: 16 },
  scoreCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  scoreText: { fontWeight: '700' },
  smallScore: { fontSize: 28 },
  mediumScore: { fontSize: 34 },
  largeScore: { fontSize: 40 },
  label: { fontWeight: '600', marginBottom: 2 },
  smallLabel: { fontSize: 14 },
  mediumLabel: { fontSize: 16 },
  largeLabel: { fontSize: 18 },
  subLabel: { fontSize: 12, marginBottom: 12 },
  unavailableExplanation: { fontSize: 13, lineHeight: 18, paddingHorizontal: 12 },
  pillarsContainer: { width: '100%', marginTop: 4 },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pillarLabel: { width: 100, fontSize: 13, fontWeight: '500' },
  pillarBarContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  pillarBar: { height: '100%', borderRadius: 4 },
  pillarValue: { width: 44, fontSize: 12, textAlign: 'right' },
});

export default TruScore;
