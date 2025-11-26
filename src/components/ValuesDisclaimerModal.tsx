// ValuesDisclaimerModal.tsx - Disclaimer modal for first-time Values users (v1.3)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ValuesDisclaimerModalProps {
  visible: boolean;
  onAccept: () => void;
  onDismiss?: () => void;
}

export default function ValuesDisclaimerModal({
  visible,
  onAccept,
  onDismiss,
}: ValuesDisclaimerModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={styles.modalOverlay} edges={['top', 'bottom']}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              User Choice Only
            </Text>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={[styles.disclaimerText, { color: colors.text }]}>
              The Values feature provides optional, personalized insights based on preferences. These insights are for informational purposes only and do not affect the TruScore.
            </Text>

            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Important Information:
              </Text>
              <View style={styles.bulletList}>
                <Text style={[styles.bulletPoint, { color: colors.text }]}>
                  • Insights are based on publicly available information
                </Text>
                <Text style={[styles.bulletPoint, { color: colors.text }]}>
                  • All preferences are optional and user-controlled
                </Text>
                <Text style={[styles.bulletPoint, { color: colors.text }]}>
                  • TruScore remains objective and unaffected by Values preferences
                </Text>
                <Text style={[styles.bulletPoint, { color: colors.text }]}>
                  • Sources are provided for transparency
                </Text>
              </View>
            </View>

            <Text style={[styles.disclaimerText, { color: colors.textSecondary, marginTop: 16 }]}>
              By continuing, you acknowledge that these are optional insights and that you understand the Values feature is separate from the core TruScore calculation.
            </Text>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            {onDismiss && (
              <TouchableOpacity
                style={[styles.footerButton, styles.cancelButton, { backgroundColor: colors.surface }]}
                onPress={onDismiss}
              >
                <Text style={[styles.footerButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.footerButton, styles.acceptButton, { backgroundColor: colors.primary }]}
              onPress={onAccept}
            >
              <Text style={[styles.footerButtonText, { color: '#fff' }]}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  disclaimerText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  bulletList: {
    gap: 8,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    // Styled dynamically
  },
  acceptButton: {
    // Styled dynamically
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

