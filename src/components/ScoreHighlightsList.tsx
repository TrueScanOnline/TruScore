/**
 * "What we found" — the single continuous governed Score Highlights list.
 *
 * Shared by overall S12 on the Result screen and by the S12a pillar look-through so both
 * entry paths render identical L1 rows and resolve to identical L2 content.
 *
 * Presentation: one surface, the existing finding text in selection order, a pillar cue,
 * and a chevron for the existing row destination. Selection and wording are unchanged.
 */

import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import {
  resultEmeraldPillar,
  resultEmeraldTone,
  resultPillarSurface,
  resultPresentation,
  type ResultPillarKey,
} from '../theme/resultPresentation';
import {
  SCORE_HIGHLIGHTS_HEADING,
  consumerPillarLabel,
  type ScoreHighlightStory,
} from '../lib/scoreHighlights';

interface ScoreHighlightsListProps {
  stories: ScoreHighlightStory[];
  onSelectStory: (story: ScoreHighlightStory) => void;
  /** Omit the locked heading when the host already renders it (e.g. a sheet header). */
  showHeading?: boolean;
  /** Result card treatment. Look-through overlays keep the default rows. */
  appearance?: 'emerald' | 'default';
}

export default function ScoreHighlightsList({
  stories,
  onSelectStory,
  showHeading = true,
  appearance = 'default',
}: ScoreHighlightsListProps) {
  const { colors, darkMode } = useTheme();
  const emerald = appearance === 'emerald';
  const tone = resultEmeraldTone(!!darkMode);

  // Fail closed: with no eligible Highlight there is nothing governed to say, so the list renders
  // nothing at all rather than manufacturing generic commentary or an empty heading.
  if (stories.length === 0) return null;

  return (
    <View style={styles.container}>
      {showHeading && (
        <Text style={[emerald ? styles.emeraldHeading : styles.heading, { color: emerald ? tone.ink : colors.text }]}>
          {SCORE_HIGHLIGHTS_HEADING}
        </Text>
      )}

      {stories.map((story, index) => {
        const role = emerald
          ? resultEmeraldPillar(story.pillar as ResultPillarKey, !!darkMode)
          : resultPillarSurface(story.pillar as ResultPillarKey, !!darkMode);
        const pillar = consumerPillarLabel(story.pillar);
        return (
          <TouchableOpacity
            key={`${story.pillar}-${story.storyKey}`}
            onPress={() => onSelectStory(story)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${pillar}. ${story.l1}`}
            style={[
              emerald ? styles.emeraldRow : styles.row,
              index > 0 ? { borderTopColor: emerald ? tone.line : colors.border, borderTopWidth: StyleSheet.hairlineWidth } : null,
            ]}
          >
            <MaterialCommunityIcons name={role.glyph} size={emerald ? 22 : 22} color={role.icon} />
            <Text
              style={[emerald ? styles.emeraldRowTitle : styles.rowTitle, { color: emerald ? tone.ink : colors.text }]}
              {...(Platform.OS === 'android' ? { textBreakStrategy: 'highQuality' as const } : {})}
            >
              {story.l1}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={emerald ? tone.action : colors.primary} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    marginHorizontal: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: resultPresentation.tap.min,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  rowTitle: {
    flex: 1,
    flexShrink: 1,
    fontSize: resultPresentation.type.body,
    lineHeight: 21,
    fontWeight: '500',
  },
  emeraldHeading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  emeraldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingVertical: 8,
  },
  emeraldRowTitle: {
    flex: 1,
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
});
