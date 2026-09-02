/**
 * "What we found" — the single continuous governed Score Highlights list.
 *
 * Shared by overall S12 on the Result screen and by the S12a pillar look-through so both
 * entry paths render identical L1 rows and resolve to identical L2 content.
 *
 * Locked presentation (v0.4 §4.0.1):
 *  - one continuous list, no positive/negative buckets and no counts
 *  - five-band muted materiality tint, no public legend and no points
 *  - subtle directional glyph only, treated as decorative so no scoring-direction narration
 *    reaches assistive technology
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import {
  SCORE_HIGHLIGHTS_HEADING,
  scoreHighlightBandStyle,
  scoreHighlightDirectionGlyph,
  type ScoreHighlightStory,
} from '../lib/scoreHighlights';

interface ScoreHighlightsListProps {
  stories: ScoreHighlightStory[];
  onSelectStory: (story: ScoreHighlightStory) => void;
  /** Omit the locked heading when the host already renders it (e.g. a sheet header). */
  showHeading?: boolean;
  /** Neutral empty state. Never manufacture a story when nothing eligible fired. */
  emptyText?: string;
}

export default function ScoreHighlightsList({
  stories,
  onSelectStory,
  showHeading = true,
  emptyText,
}: ScoreHighlightsListProps) {
  const { colors, darkMode } = useTheme();

  return (
    <View style={styles.container}>
      {showHeading && (
        <Text style={[styles.heading, { color: colors.text }]}>{SCORE_HIGHLIGHTS_HEADING}</Text>
      )}

      {stories.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          {emptyText ?? 'Nothing stood out for this product yet.'}
        </Text>
      ) : (
        stories.map((story) => {
          const bandStyle = scoreHighlightBandStyle(story.band, darkMode);
          return (
            <TouchableOpacity
              key={`${story.pillar}-${story.storyKey}`}
              onPress={() => onSelectStory(story)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={story.l1}
              style={[
                styles.row,
                { backgroundColor: bandStyle.background, borderLeftColor: bandStyle.accent },
              ]}
            >
              <Text style={[styles.rowTitle, { color: colors.text }]}>{story.l1}</Text>
              <Ionicons
                name={scoreHighlightDirectionGlyph(story.sign)}
                size={16}
                color={bandStyle.accent}
                accessible={false}
                importantForAccessibility="no"
                style={styles.glyph}
              />
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  glyph: {
    opacity: 0.75,
  },
});
