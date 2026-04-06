import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';

export interface BlurredMatchCountTeaserProps {
  count: number;
  onUnlockPress: () => void;
}

/**
 * Shows approximate match count for non‑premium users with filters active.
 * Uses overlay styling (no native blur dependency) for Android/iOS/Web compatibility.
 */
export default function BlurredMatchCountTeaser({ count, onUnlockPress }: BlurredMatchCountTeaserProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onUnlockPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.primary + '55',
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={t('search.teaser.a11y', { count })}
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>{t('search.teaser.matchingLabel')}</Text>
      <View style={styles.countWrap}>
        <Text
          style={[styles.countHidden, { color: colors.primary }]}
          importantForAccessibility="no-hide-descendants"
        >
          {count}
        </Text>
        <View style={[styles.obscure, { backgroundColor: colors.border + 'CC' }]} pointerEvents="none" />
      </View>
      <Text style={[styles.unit, { color: colors.textSecondary }]}>{t('search.teaser.unit')}</Text>
      <Text style={[styles.cta, { color: colors.primary }]}>{t('search.teaser.cta')}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 16,
    minHeight: 44,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
  },
  countWrap: {
    alignSelf: 'center',
    marginVertical: 6,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  countHidden: {
    fontSize: 34,
    fontWeight: '700',
    opacity: 0.22,
  },
  obscure: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    opacity: 0.85,
  },
  unit: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  cta: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
