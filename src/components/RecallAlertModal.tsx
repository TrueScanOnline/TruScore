import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { FoodRecall } from '../types/product';
import { useTheme } from '../theme';

interface RecallAlertModalProps {
  visible: boolean;
  onClose: () => void;
  recalls: FoodRecall[];
}

export default function RecallAlertModal({ visible, onClose, recalls }: RecallAlertModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (!recalls || recalls.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.modalHeaderLeft}>
            <View style={[styles.iconContainer, { backgroundColor: '#ff6b6b' + '20' }]}>
              <Ionicons name="warning" size={24} color="#ff6b6b" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('result.foodRecall', 'Food Recall Alert')}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.modalBody}
          contentContainerStyle={styles.modalBodyContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
            {t('result.recallDescription', 'This product has been recalled. Please review the details below:')}
          </Text>

          {recalls.map((recall, index) => (
            <View key={recall.recallId || index} style={[styles.recallCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Recall Header */}
              <View style={styles.recallCardHeader}>
                <Text style={[styles.recallProductName, { color: colors.text }]}>
                  {recall.productName}
                </Text>
                {recall.isActive && (
                  <View style={[styles.activeBadge, { backgroundColor: '#ff6b6b' }]}>
                    <Text style={styles.activeBadgeText}>{t('result.activeRecall', 'ACTIVE')}</Text>
                  </View>
                )}
              </View>

              {/* Brand (if available) */}
              {recall.brand && (
                <Text style={[styles.recallBrand, { color: colors.textSecondary }]}>
                  {t('result.brand', 'Brand')}: {recall.brand}
                </Text>
              )}

              {/* Recall Reason */}
              <View style={styles.recallSection}>
              <View style={styles.recallSectionHeader}>
                <Ionicons name="information-circle" size={18} color="#ff6b6b" />
                <Text style={[styles.recallSectionTitle, { color: colors.text, marginLeft: 8 }]}>
                  {t('result.recallReason', 'Recall Reason')}:
                </Text>
              </View>
                <Text style={[styles.recallSectionText, { color: colors.textSecondary }]}>
                  {recall.reason}
                </Text>
              </View>

              {/* Recall Date */}
              <View style={styles.recallSection}>
              <View style={styles.recallSectionHeader}>
                <Ionicons name="calendar" size={18} color={colors.textSecondary} />
                <Text style={[styles.recallSectionTitle, { color: colors.text, marginLeft: 8 }]}>
                  {t('result.recallDate', 'Recall Date')}:
                </Text>
              </View>
                <Text style={[styles.recallSectionText, { color: colors.textSecondary }]}>
                  {new Date(recall.recallDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              {/* Distribution */}
              {recall.distribution && recall.distribution.length > 0 && (
                <View style={styles.recallSection}>
                  <View style={styles.recallSectionHeader}>
                    <Ionicons name="location" size={18} color={colors.textSecondary} />
                    <Text style={[styles.recallSectionTitle, { color: colors.text, marginLeft: 8 }]}>
                      {t('result.distribution', 'Distribution')}:
                    </Text>
                  </View>
                  <Text style={[styles.recallSectionText, { color: colors.textSecondary }]}>
                    {recall.distribution.join(', ')}
                  </Text>
                </View>
              )}

              {/* View Details Link */}
              {recall.url && (
                <TouchableOpacity
                  style={[styles.recallLink, { borderTopColor: colors.border }]}
                  onPress={() => Linking.openURL(recall.url!).catch(console.error)}
                >
                  <Text style={[styles.recallLinkText, { color: colors.primary }]}>
                    {t('result.viewRecallDetails', 'View Official Recall Details')}
                  </Text>
                  <Ionicons name="open-outline" size={18} color={colors.primary} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: 400,
    backgroundColor: 'transparent',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: '80%',
  },
  modalBodyContent: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 20,
    minHeight: 300,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  recallCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  recallCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  recallProductName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  recallBrand: {
    fontSize: 14,
    marginTop: -4,
  },
  recallSection: {
    marginTop: 8,
  },
  recallSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  recallSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  recallSectionText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 26, // Align with icon
  },
  recallLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    marginRight: 8,
  },
  recallLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

