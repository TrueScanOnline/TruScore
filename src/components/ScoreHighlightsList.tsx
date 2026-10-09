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
import { resultPillarSurface, resultPresentation, type ResultPillarKey } from '../theme/resultPresentation';
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
}

export default function ScoreHighlightsList({
  stories,
  onSelectStory,
  showHeading = true,
}: ScoreHighlightsListProps) {
  const { colors, darkMode } = useTheme();

  // Fail closed: with no eligible Highlight there is nothing governed to say, so the list renders
  // nothing at all rather than manufacturing generic commentary or an empty heading.
  if (stories.length === 0) return null;

  return (
    <View style={styles.container}>
      {showHeading && (
        <Text style={[styles.heading, { color: colors.text }]}>{SCORE_HIGHLIGHTS_HEADING}</Text>
      )}

      {stories.map((story, index) => {
        const role = resultPillarSurface(story.pillar as ResultPillarKey, !!darkMode);
        const pillar = consumerPillarLabel(story.pillar);
        return (
          <TouchableOpacity
            key={`${story.pillar}-${story.storyKey}`}
            onPress={() => onSelectStory(story)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${pillar}. ${story.l1}`}
            style={[
              styles.row,
              index > 0 ? { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth } : null,
            ]}
          >
            <MaterialCommunityIcons name={role.glyph} size={22} color={role.icon} />
            <Text
              style={[styles.rowTitle, { color: colors.text }]}
              {...(Platform.OS === 'android' ? { textBreakStrategy: 'highQuality' as const } : {})}
            >
              {story.l1}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
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
});
