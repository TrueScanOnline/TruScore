// InsightsCarousel.tsx - Carousel for displaying values insights
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Insight } from '../lib/truscoreEngine';

interface InsightsCarouselProps {
  insights: Insight[];
  productName?: string;
}

interface InsightDetailModalProps {
  visible: boolean;
  insight: Insight | null;
  productName?: string;
  onClose: () => void;
  onIgnore: () => void;
  onShare: () => void;
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

  if (!insight) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Insight Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={[styles.insightBadge, { backgroundColor: insight.color + '20' }]}>
              <Text style={[styles.insightType, { color: insight.color }]}>
                {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)} Insight
              </Text>
            </View>

            <Text style={[styles.insightReason, { color: colors.text }]}>{insight.reason}</Text>

            {insight.source && (
              <View style={styles.sourceContainer}>
                <Text style={[styles.sourceLabel, { color: colors.textSecondary }]}>Source:</Text>
                <Text style={[styles.sourceText, { color: colors.text }]}>{insight.source}</Text>
              </View>
            )}

            {productName && (
              <Text style={[styles.productName, { color: colors.textSecondary }]}>
                Product: {productName}
              </Text>
            )}
          </View>

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

export default function InsightsCarousel({ insights, productName }: InsightsCarouselProps) {
  const { colors } = useTheme();
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (insights.length === 0) return null;

  const displayedInsights = showAll ? insights : insights.slice(0, 3);

  const handleInsightPress = (insight: Insight) => {
    setSelectedInsight(insight);
    setModalVisible(true);
  };

  const handleShare = async () => {
    if (!selectedInsight) return;
    try {
      await Share.share({
        message: `${selectedInsight.type.charAt(0).toUpperCase() + selectedInsight.type.slice(1)} Insight: ${selectedInsight.reason}${productName ? ` - ${productName}` : ''}`,
        title: 'TruScore Insight',
      });
    } catch (error) {
      console.error('Error sharing insight:', error);
    }
  };

  const handleIgnore = () => {
    // TODO: Implement ignore functionality (store ignored insights)
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
      >
        {displayedInsights.map((insight, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.insightBanner, { backgroundColor: insight.color + '20', borderColor: insight.color }]}
            onPress={() => handleInsightPress(insight)}
          >
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
                <Text style={[styles.insightTypeLabel, { color: insight.color }]}>
                  {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                </Text>
                <Text style={[styles.insightReasonText, { color: colors.text }]} numberOfLines={2}>
                  {insight.reason}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={insight.color} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {insights.length > 3 && !showAll && (
        <TouchableOpacity
          style={[styles.showAllButton, { backgroundColor: colors.surface }]}
          onPress={() => setShowAll(true)}
        >
          <Text style={[styles.showAllText, { color: colors.primary }]}>Show all ({insights.length})</Text>
        </TouchableOpacity>
      )}

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
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerCount: {
    fontSize: 14,
  },
  carousel: {
    paddingRight: 16,
    gap: 12,
  },
  insightBanner: {
    minWidth: 280,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    marginRight: 12,
  },
  insightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
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
  },
  productName: {
    fontSize: 14,
    fontStyle: 'italic',
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
});

