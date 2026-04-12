// InsightsCarousel — user alert preference matches (full-width, no horizontal scroll)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { Insight } from '../lib/truscoreEngine';

interface InsightsCarouselProps {
  insights: Insight[];
  productName?: string;
  /** Opens the main product Share modal (insights template) instead of a raw system share. */
  onRequestProductShare?: () => void;
}

interface InsightDetailModalProps {
  visible: boolean;
  insight: Insight | null;
  productName?: string;
  onClose: () => void;
  onIgnore: () => void;
  onShare: () => void;
}

function openReference(url: string) {
  Linking.openURL(url).catch(() => {});
}

function InsightDetailModal({
  visible,
  insight,
  productName,
  onClose,
  onIgnore,
  onShare,
}: InsightDetailModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (!insight) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={2}>
              {t('result.alertsPreference')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalBody}>
            <View style={[styles.insightBadge, { backgroundColor: insight.color + '20' }]}>
              <Text style={[styles.insightType, { color: insight.color }]}>
                {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
              </Text>
            </View>

            <Text style={[styles.insightReason, { color: colors.text }]}>{insight.reason}</Text>

            {insight.source && (
              <View style={styles.sourceContainer}>
                <Text style={[styles.sourceLabel, { color: colors.textSecondary }]}>Source:</Text>
                <Text style={[styles.sourceText, { color: colors.text }]}>{insight.source}</Text>
              </View>
            )}

            {insight.referenceUrl ? (
              <Pressable
                onPress={() => openReference(insight.referenceUrl!)}
                style={({ pressed }) => [styles.modalReferencePress, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Text style={[styles.modalReferenceLink, { color: colors.primary }]}>
                  {insight.referenceLabel ?? t('result.alertsPreferenceOpenReference')}
                </Text>
                <Ionicons name="open-outline" size={18} color={colors.primary} />
              </Pressable>
            ) : null}

            {productName ? (
              <Text style={[styles.productName, { color: colors.textSecondary }]} numberOfLines={3}>
                Product: {productName}
              </Text>
            ) : null}
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: colors.surface }]}
              onPress={onIgnore}
            >
              <Ionicons name="eye-off-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.footerButtonText, { color: colors.textSecondary }]}>Ignore</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: colors.primary }]}
              onPress={onShare}
            >
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={[styles.footerButtonText, { color: '#fff' }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function InsightsCarousel({ insights, productName, onRequestProductShare }: InsightsCarouselProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState<Set<number>>(new Set());

  if (insights.length === 0) return null;

  const displayedInsights = showAll ? insights : insights.slice(0, 3);

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedInsights(newExpanded);
  };

  const handleInsightPress = (insight: Insight) => {
    setSelectedInsight(insight);
    setModalVisible(true);
  };

  const handleShare = () => {
    if (!selectedInsight) return;
    setModalVisible(false);
    if (onRequestProductShare) {
      onRequestProductShare();
      return;
    }
  };

  const handleIgnore = () => {
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.list}>
        {displayedInsights.map((insight, index) => {
          const isExpanded = expandedInsights.has(index);
          const shouldTruncate = insight.reason.length > 80;

          return (
            <View
              key={index}
              style={[styles.insightBanner, { backgroundColor: insight.color + '20', borderColor: insight.color }]}
            >
              <TouchableOpacity onPress={() => handleInsightPress(insight)} activeOpacity={0.7}>
                <View style={styles.insightContent}>
                  <View style={[styles.insightIcon, { backgroundColor: insight.color }]}>
                    <Ionicons
                      name={
                        insight.type === 'geopolitical'
                          ? 'globe-outline'
                          : insight.type === 'ethical'
                            ? 'heart-outline'
                            : 'leaf-outline'
                      }
                      size={16}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.insightTextContainer}>
                    <Text style={[styles.insightTypeLabel, { color: insight.color }]} numberOfLines={2}>
                      {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                    </Text>
                    <Text
                      style={[styles.insightReasonText, { color: colors.text }]}
                      numberOfLines={isExpanded ? undefined : shouldTruncate ? 3 : undefined}
                      ellipsizeMode="tail"
                    >
                      {insight.reason}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={insight.color} style={styles.chevron} />
                </View>
              </TouchableOpacity>

              {insight.referenceUrl ? (
                <TouchableOpacity
                  onPress={() => openReference(insight.referenceUrl!)}
                  style={styles.referenceRow}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.referenceLinkText, { color: colors.primary }]}
                    numberOfLines={2}
                  >
                    {insight.referenceLabel ?? t('result.alertsPreferenceOpenReference')}
                  </Text>
                  <Ionicons name="open-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
              ) : null}

              {shouldTruncate ? (
                <TouchableOpacity
                  onPress={() => toggleExpand(index)}
                  style={styles.expandButton}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.expandText, { color: insight.color }]}>
                    {isExpanded ? 'Show less' : 'Show more'}
                  </Text>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={insight.color} />
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}
      </View>

      {insights.length > 3 && !showAll ? (
        <TouchableOpacity
          style={[styles.showAllButton, { backgroundColor: colors.surface }]}
          onPress={() => setShowAll(true)}
        >
          <Text style={[styles.showAllText, { color: colors.primary }]}>
            Show all ({insights.length})
          </Text>
        </TouchableOpacity>
      ) : null}

      <InsightDetailModal
        visible={modalVisible}
        insight={selectedInsight}
        productName={productName}
        onClose={() => setModalVisible(false)}
        onIgnore={handleIgnore}
        onShare={handleShare}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 8,
    width: '100%',
    alignSelf: 'stretch',
  },
  list: {
    width: '100%',
    gap: 12,
  },
  insightBanner: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  insightContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  chevron: {
    marginTop: 2,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  insightTypeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  insightReasonText: {
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    gap: 6,
  },
  referenceLinkText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  showAllButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  showAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '88%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalScroll: {
    maxHeight: 360,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    gap: 8,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    paddingBottom: 8,
  },
  modalReferencePress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 8,
  },
  modalReferenceLink: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  insightBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  insightType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  insightReason: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  sourceContainer: {
    marginBottom: 12,
  },
  sourceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 14,
    flexWrap: 'wrap',
  },
  productName: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 8,
    gap: 4,
  },
  expandText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
