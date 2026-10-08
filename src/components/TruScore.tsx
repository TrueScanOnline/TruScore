// src/components/TruScore.tsx – Rveel Score display. Values come from the consumption contract.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TruScoreResult } from '../lib/truscoreEngine';
import { consumerPillarLabel } from '../lib/scoreHighlights';
import { useTheme } from '../theme';
import { resultPresentation, type ResultPillarKey } from '../theme/resultPresentation';
import {
  getTruScoreConsumerPresentation,
  publishedHighlightPillarScores,
  publishedPillarValueLabel,
  RVEEL_SCORE_UNAVAILABLE_NEUTRAL_COLOR,
} from '../utils/truScorePresentation';

type TruScorePillar = 'Body' | 'Planet' | 'Ethics' | 'Open';

interface TruScoreProps {
  truScore: TruScoreResult;
  size?: 'small' | 'medium' | 'large';
  /** When provided, pillar tiles open the existing pillar look-through. */
  onPillarPress?: (pillar: TruScorePillar) => void;
  /** First-paint barrier: until settled, all scores remain unrevealed (§12). */
  publicationSettled?: boolean;
}

function scoreBandColor(score: number, trust: { excellent: string; good: string; fair: string; poor: string }) {
  if (score >= 80) return trust.excellent;
  if (score >= 60) return trust.good;
  if (score >= 40) return trust.fair;
  return trust.poor;
}

function ScoreRing({
  value,
  color,
  compact,
  caption,
}: {
  value: string;
  color: string;
  compact: boolean;
  caption?: string;
}) {
  const size = compact ? resultPresentation.ring.neutral : resultPresentation.ring.rated;
  const stroke = compact ? 6 : resultPresentation.ring.stroke;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = caption != null ? Math.max(0, Math.min(100, Number(value))) : 100;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {caption != null ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={resultPresentation.track}
            strokeWidth={stroke}
            fill="transparent"
          />
        ) : null}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress / 100)}
          strokeLinecap="round"
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={styles.ringLabel}>
        <Text
          style={[
            styles.ringValue,
            { color, fontSize: compact ? 22 : resultPresentation.type.display },
          ]}
          maxFontSizeMultiplier={1.3}
        >
          {value}
        </Text>
        {caption ? (
          <Text style={[styles.ringCaption, { color }]} maxFontSizeMultiplier={1.3}>
            {caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const TruScore = React.memo(function TruScore({
  truScore,
  size = 'medium',
  onPillarPress,
  publicationSettled = true,
}: TruScoreProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const presentation = getTruScoreConsumerPresentation(truScore, { publicationSettled });

  const getScoreLabel = (s: number) => {
    if (s >= 80) return t('trust.excellent') || 'Excellent';
    if (s >= 60) return t('trust.good') || 'Good';
    if (s >= 40) return t('trust.fair') || 'Fair';
    return t('trust.poor') || 'Poor';
  };

  const publishedPillars = publishedHighlightPillarScores(truScore, { publicationSettled });

  if (presentation.kind === 'unavailable') {
    return (
      <View style={styles.container}>
        <Text style={[styles.unrevealedTitle, { color: colors.text }]}>{presentation.title}</Text>
        <Text style={[styles.explanation, { color: colors.text }]}>{presentation.explanation}</Text>
      </View>
    );
  }

  const scored = presentation.kind === 'scored';
  const band = scored ? scoreBandColor(presentation.score, colors.trust) : RVEEL_SCORE_UNAVAILABLE_NEUTRAL_COLOR;

  return (
    <View style={styles.container}>
      <View style={styles.resultRow}>
        <ScoreRing
          value={scored ? String(presentation.score) : presentation.overallDisplay}
          color={band}
          compact={!scored}
          caption={scored ? '/100' : undefined}
        />
        {scored ? (
          <Text
            style={[styles.band, { color: band, fontSize: size === 'large' ? 26 : 22 }]}
            maxFontSizeMultiplier={1.6}
          >
            {getScoreLabel(presentation.score)}
          </Text>
        ) : null}
      </View>
      {!scored ? (
        <View style={styles.explainBlock}>
          <Text style={[styles.unrevealedTitle, { color: colors.text }]}>{presentation.title}</Text>
          <Text style={[styles.explanation, { color: colors.text }]}>{presentation.explanation}</Text>
        </View>
      ) : null}

      {presentation.showPillarBars ? (
        <View style={styles.tiles}>
          {(['Body', 'Planet', 'Ethics', 'Open'] as const).map((pillar) => {
            const label = consumerPillarLabel(pillar);
            const value = publishedPillars[pillar];
            const shown = publishedPillarValueLabel(value);
            const role = resultPresentation.pillars[pillar as ResultPillarKey];
            const tile = (
              <>
                <MaterialCommunityIcons name={role.glyph} size={18} color={role.icon} />
                <Text style={[styles.tileName, { color: colors.text }]} maxFontSizeMultiplier={1.6}>
                  {label}
                </Text>
                <Text
                  style={[styles.tileValue, { color: value == null ? resultPresentation.neutral : colors.text }]}
                  maxFontSizeMultiplier={1.4}
                >
                  {shown}
                </Text>
              </>
            );
            const a11y = `${label} ${shown}`;
            return onPillarPress ? (
              <TouchableOpacity
                key={pillar}
                style={[styles.tile, { backgroundColor: role.tint }]}
                onPress={() => onPillarPress(pillar)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={a11y}
              >
                {tile}
              </TouchableOpacity>
            ) : (
              <View key={pillar} style={[styles.tile, { backgroundColor: role.tint }]} accessibilityLabel={a11y}>
                {tile}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    width: '100%',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ringLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontWeight: '700',
    lineHeight: 36,
  },
  ringCaption: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: -2,
  },
  band: {
    flex: 1,
    fontWeight: '700',
  },
  explainBlock: {
    marginTop: resultPresentation.space.gap,
  },
  unrevealedTitle: {
    fontSize: resultPresentation.type.title,
    fontWeight: '700',
  },
  explanation: {
    marginTop: 6,
    fontSize: resultPresentation.type.body,
    lineHeight: 21,
  },
  tiles: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    minHeight: 72,
    borderRadius: resultPresentation.radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  tileName: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  tileValue: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default TruScore;
