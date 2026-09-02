/**
 * Shared Score Highlights look-through — one modal, one internal view stack.
 *
 * Locked interaction contract (v0.4 §4.0):
 *  - tapping a pillar on the Rveel Score opens S12a for that pillar
 *  - tapping a promoted overall L1 opens that story's L2 directly, with no forced pillar detour
 *  - an L1 inside S12a opens the same L2
 *  - X always closes back to the Result
 *  - Back returns only to a frame actually visited in this journey
 *  - L2 may continue to the governed L3 destination
 *
 * No carousel, no legacy quadrant layout and no stacked modal-on-modal experience.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import ScoreHighlightsList from './ScoreHighlightsList';
import {
  SCORE_HIGHLIGHTS_HEADING,
  type ScoreHighlightL3Route,
  type ScoreHighlightPillar,
  type ScoreHighlightSelection,
  type ScoreHighlightStory,
} from '../lib/scoreHighlights';
import { logger } from '../utils/logger';

/** Where the consumer entered the look-through from. */
export type ScoreHighlightsLookThroughRequest =
  | { mode: 'pillar'; pillar: ScoreHighlightPillar }
  | { mode: 'detail'; story: ScoreHighlightStory };

type Frame =
  | { kind: 'pillar'; pillar: ScoreHighlightPillar }
  | { kind: 'detail'; story: ScoreHighlightStory };

interface ScoreHighlightsLookThroughModalProps {
  visible: boolean;
  /** The entry point for this journey. Changing it starts a fresh stack. */
  request: ScoreHighlightsLookThroughRequest | null;
  selection: ScoreHighlightSelection | null;
  /** Pillar score shown in the S12a header, when known. */
  pillarScores?: Partial<Record<ScoreHighlightPillar, number | null>>;
  onClose: () => void;
  /**
   * Host handler for governed in-app L3 destinations. External sources are opened here.
   * When omitted, in-app L3 affordances are not offered.
   */
  onOpenInAppL3?: (route: Extract<ScoreHighlightL3Route, { kind: 'in_app' }>, story: ScoreHighlightStory) => void;
}

function frameFromRequest(request: ScoreHighlightsLookThroughRequest): Frame {
  return request.mode === 'pillar'
    ? { kind: 'pillar', pillar: request.pillar }
    : { kind: 'detail', story: request.story };
}

function requestKey(request: ScoreHighlightsLookThroughRequest | null): string {
  if (!request) return '';
  return request.mode === 'pillar'
    ? `pillar:${request.pillar}`
    : `detail:${request.story.pillar}:${request.story.storyKey}`;
}

export default function ScoreHighlightsLookThroughModal({
  visible,
  request,
  selection,
  pillarScores,
  onClose,
  onOpenInAppL3,
}: ScoreHighlightsLookThroughModalProps) {
  const { colors } = useTheme();
  const [stack, setStack] = useState<Frame[]>([]);

  const entryKey = requestKey(request);

  // A new entry point starts a fresh journey; Back can then only reach frames visited here.
  useEffect(() => {
    if (visible && request) {
      setStack([frameFromRequest(request)]);
    } else if (!visible) {
      setStack([]);
    }
  }, [visible, entryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = stack.length > 0 ? stack[stack.length - 1] : null;
  const canGoBack = stack.length > 1;

  const handleBack = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const handleSelectStory = useCallback((story: ScoreHighlightStory) => {
    setStack((prev) => [...prev, { kind: 'detail', story }]);
  }, []);

  const handleOpenL3 = useCallback(
    async (route: ScoreHighlightL3Route, story: ScoreHighlightStory) => {
      if (route.kind === 'in_app') {
        onOpenInAppL3?.(route, story);
        return;
      }
      try {
        const supported = await Linking.canOpenURL(route.url);
        if (!supported) {
          Alert.alert('Unable to open this link');
          return;
        }
        await Linking.openURL(route.url);
      } catch (error) {
        logger.warn('[ScoreHighlights] Failed to open governed L3 source', error);
        Alert.alert('Unable to open this link');
      }
    },
    [onOpenInAppL3]
  );

  const pillarStories = useMemo(() => {
    if (!current || current.kind !== 'pillar' || !selection) return [];
    return selection.byPillar[current.pillar];
  }, [current, selection]);

  if (!visible || !current) return null;

  const pillarScore =
    current.kind === 'pillar' ? pillarScores?.[current.pillar] ?? null : null;
  const headerTitle =
    current.kind === 'pillar' ? current.pillar : current.story.pillar;
  const headerSubtitle =
    current.kind === 'pillar'
      ? pillarScore != null
        ? `${SCORE_HIGHLIGHTS_HEADING} · ${pillarScore}/25`
        : SCORE_HIGHLIGHTS_HEADING
      : SCORE_HIGHLIGHTS_HEADING;

  const l3Route = current.kind === 'detail' ? current.story.l3Route : undefined;
  const l3Offered = l3Route && (l3Route.kind === 'external_source' || onOpenInAppL3 != null);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              {canGoBack ? (
                <TouchableOpacity
                  onPress={handleBack}
                  style={styles.headerButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                >
                  <Ionicons name="chevron-back" size={22} color={colors.text} />
                </TouchableOpacity>
              ) : (
                <View style={styles.headerButton} />
              )}
              <View style={styles.headerTitles}>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                  {headerTitle}
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {headerSubtitle}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.headerButton, styles.closeButton, { backgroundColor: colors.surface }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {current.kind === 'pillar' ? (
              <ScoreHighlightsList
                stories={pillarStories}
                onSelectStory={handleSelectStory}
                showHeading={false}
                emptyText={`Nothing stood out for ${current.pillar} on this product.`}
              />
            ) : (
              <View style={styles.detail}>
                <Text style={[styles.detailTitle, { color: colors.text }]}>{current.story.l1}</Text>
                <Text style={[styles.detailBody, { color: colors.textSecondary }]}>
                  {current.story.l2}
                </Text>
                {l3Offered && l3Route && (
                  <TouchableOpacity
                    onPress={() => handleOpenL3(l3Route, current.story)}
                    style={[styles.l3Button, { borderColor: colors.border }]}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={l3Route.label}
                  >
                    <Text style={[styles.l3ButtonText, { color: colors.primary }]}>
                      {l3Route.label}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  headerButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    borderRadius: 17,
  },
  headerTitles: {
    flex: 1,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: 16,
  },
  detail: {
    gap: 12,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 25,
  },
  detailBody: {
    fontSize: 15,
    lineHeight: 23,
  },
  l3Button: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  l3ButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
