import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
  /** When set, shows a Back control that restores the prior surface (does not exit to Result). */
  onBack?: () => void;
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  children: React.ReactNode;
  /** Optional scroll offset after open (focused entry). */
  scrollToY?: number;
}

export default function InfoModal({
  visible,
  onClose,
  onBack,
  title,
  icon,
  iconColor,
  children,
  scrollToY,
}: InfoModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!visible || scrollToY == null) return;
    const tmr = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, scrollToY - 8), animated: true });
    }, 50);
    return () => clearTimeout(tmr);
  }, [visible, scrollToY]);

  // Android hardware back: prefer caller Back when available, else close to Result.
  const handleRequestClose = () => {
    if (onBack) onBack();
    else onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleRequestClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              {onBack ? (
                <TouchableOpacity
                  onPress={onBack}
                  style={[styles.closeButton, { backgroundColor: colors.surface }]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.back', 'Back')}
                >
                  <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
              ) : null}
              {icon && (
                <Ionicons
                  name={icon}
                  size={24}
                  color={iconColor || colors.primary}
                  style={styles.icon}
                />
              )}
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.surface }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', 'Close')}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {children}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.closeButtonBottom, { backgroundColor: colors.primary }]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>{t('common.ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    height: SCREEN_HEIGHT * 0.85,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    minHeight: 70,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  icon: {
    marginRight: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  footer: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    minHeight: 70,
  },
  closeButtonBottom: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
