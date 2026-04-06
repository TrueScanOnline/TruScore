import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';

export interface SearchPaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgradePress: () => void;
}

export default function SearchPaywallModal({ visible, onClose, onUpgradePress }: SearchPaywallModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const features = [
    t('search.paywall.feature1'),
    t('search.paywall.feature2'),
    t('search.paywall.feature3'),
    t('search.paywall.feature4'),
    t('search.paywall.feature5'),
    t('search.paywall.feature6'),
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle={Platform.OS === 'web' ? 'overFullScreen' : undefined}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button">
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name="lock-closed" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{t('search.paywall.title')}</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{t('search.paywall.body')}</Text>
            <View style={styles.featureList}>
              {features.map((line) => (
                <View key={line} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.featureIcon} />
                  <Text style={[styles.featureText, { color: colors.text }]}>{line}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.primaryCta, { backgroundColor: colors.primary }]}
              onPress={onUpgradePress}
              accessibilityRole="button"
              accessibilityLabel={t('search.paywall.ctaPrimary')}
            >
              <Text style={styles.primaryCtaText}>{t('search.paywall.ctaPrimary')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" style={styles.secondaryWrap}>
              <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
                {t('search.paywall.ctaSecondary')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
    paddingBottom: 28,
  },
  sheetContent: {
    padding: 20,
    paddingTop: 24,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },
  featureList: {
    marginBottom: 22,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minHeight: 44,
    paddingVertical: 4,
  },
  featureIcon: {
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryCta: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryCtaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryWrap: {
    marginTop: 16,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
