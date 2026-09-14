/**
 * Shared governed Score Highlights L3 look-through (Addendum v1.0).
 * Renders founder-locked prose with metadata binding; sources sit beneath the explanation.
 */

import React, { useMemo } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import InfoModal from './InfoModal';
import { resolveGovernedL3Content } from '../lib/scoreHighlights/l3/content';
import type { ScoreHighlightL3InAppTarget } from '../lib/scoreHighlights/l3/targets';
import type { ScoreHighlightStory } from '../lib/scoreHighlights';
import { useTheme } from '../theme';

export interface ScoreHighlightsGovernedL3Request {
  target: ScoreHighlightL3InAppTarget;
  story: ScoreHighlightStory;
}

interface ScoreHighlightsGovernedL3ModalProps {
  visible: boolean;
  request: ScoreHighlightsGovernedL3Request | null;
  onClose: () => void;
  /** Optional Back when this L3 was reached from another look-through (reserved). */
  onBack?: () => void;
  /** S25 — canonical rendered additive IDs for Open coded-term deep-links. */
  renderedAdditiveIds?: readonly string[];
  /** S25 — Open coded-term deep-link into About these Additives. */
  onOpenAboutAdditive?: (additiveId: string) => void;
}

export default function ScoreHighlightsGovernedL3Modal({
  visible,
  request,
  onClose,
  onBack,
  renderedAdditiveIds,
  onOpenAboutAdditive,
}: ScoreHighlightsGovernedL3ModalProps) {
  const { colors } = useTheme();

  const content = useMemo(() => {
    if (!request) return null;
    return resolveGovernedL3Content(request.target, request.story.storyKey, request.story.metadata, {
      renderedAdditiveIds,
    });
  }, [request, renderedAdditiveIds]);

  if (!request || !content) return null;

  return (
    <InfoModal
      visible={visible}
      onClose={onClose}
      onBack={onBack}
      title={content.title}
      icon="information-circle-outline"
      iconColor={colors.primary}
    >
      {content.highlightLine ? (
        <Text style={[styles.highlightLine, { color: colors.text }]}>{content.highlightLine}</Text>
      ) : null}

      {content.intro ? (
        <Text style={[styles.body, { color: colors.textSecondary }]}>{content.intro}</Text>
      ) : null}

      {content.sections.map((section, idx) => (
        <View key={`${section.heading ?? 's'}-${idx}`} style={styles.section}>
          {section.heading ? (
            <Text style={[styles.sectionHeading, { color: colors.text }]}>{section.heading}</Text>
          ) : null}
          <Text style={[styles.body, { color: colors.textSecondary }]}>{section.body}</Text>
        </View>
      ))}

      {content.termRouteActions && content.termRouteActions.length > 0 ? (
        <View style={styles.section}>
          {content.termRouteActions.map((action) => (
            <TouchableOpacity
              key={action.additiveId}
              style={[styles.termAction, { borderColor: colors.border }]}
              onPress={() => onOpenAboutAdditive?.(action.additiveId)}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Text style={[styles.termActionTerm, { color: colors.textSecondary }]}>
                {action.term}
              </Text>
              <Text style={[styles.termActionLabel, { color: colors.primary }]}>{action.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {content.action ? (
        <Text style={[styles.body, { color: colors.textSecondary, marginTop: 12 }]}>
          {content.action.textBefore}
          <Text style={{ color: colors.primary, fontWeight: '600' }}>
            {content.action.anchorLabel}
          </Text>
          {content.action.textAfter}
        </Text>
      ) : null}

      {content.componentRows && content.componentRows.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Primary packaging components</Text>
          {content.componentRows.map((row) => (
            <View
              key={row.label}
              style={[styles.componentRow, { borderColor: colors.border, backgroundColor: colors.background }]}
            >
              <Text style={[styles.componentLabel, { color: colors.text }]}>{row.label}</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>{row.dispositionLabel}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {content.sources.length > 0 ? (
        <View style={[styles.sources, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Sources</Text>
          {content.sources.map((source) => (
            <TouchableOpacity
              key={source.url}
              style={styles.sourceLink}
              onPress={() => Linking.openURL(source.url)}
              accessibilityRole="link"
            >
              <Ionicons name="open-outline" size={16} color={colors.primary} />
              <Text style={[styles.sourceLinkText, { color: colors.primary }]}>{source.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  highlightLine: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  section: {
    marginTop: 12,
    gap: 6,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  termAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  termActionTerm: {
    fontSize: 13,
    flexShrink: 1,
  },
  termActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  componentRow: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    gap: 4,
  },
  componentLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  sources: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  sourceLinkText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
