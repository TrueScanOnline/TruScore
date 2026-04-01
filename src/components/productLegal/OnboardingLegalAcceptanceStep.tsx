/**
 * First-run onboarding: user must scroll, read, and acknowledge Disclaimer + Data limitations
 * before continuing. Copy uses the same i18n keys as the product page (`result.legal*`).
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

type Props = {
  onContinue: () => void;
};

export default function OnboardingLegalAcceptanceStep({ onContinue }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [disclaimerAck, setDisclaimerAck] = useState(false);
  const [dataLimitationsAck, setDataLimitationsAck] = useState(false);
  const canContinue = disclaimerAck && dataLimitationsAck;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.screenTitle, { color: colors.text }]}>
          {t('onboarding.legalStepTitle')}
        </Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
          {t('onboarding.legalStepSubtitle')}
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('result.legalDisclaimerModalTitle')}
        </Text>
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <Text
            key={`d${n}`}
            style={[styles.paragraph, { color: colors.textSecondary }]}
          >
            {t(`result.legalDisclaimerModalP${n}` as const)}
          </Text>
        ))}

        <Pressable
          style={({ pressed }) => [
            styles.checkboxRow,
            { backgroundColor: pressed ? colors.surface : colors.card, borderColor: colors.border },
          ]}
          onPress={() => setDisclaimerAck(!disclaimerAck)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: disclaimerAck }}
          accessibilityLabel={t('onboarding.legalDisclaimerCheckboxA11y')}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: disclaimerAck ? colors.primary : colors.border,
                backgroundColor: disclaimerAck ? colors.primary : 'transparent',
              },
            ]}
          >
            {disclaimerAck ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
          </View>
          <Text style={[styles.checkboxLabel, { color: colors.text }]}>
            {t('onboarding.legalDisclaimerCheckbox')}
          </Text>
        </Pressable>

        <Text style={[styles.sectionTitle, styles.sectionSpacer, { color: colors.text }]}>
          {t('result.legalDataLimitationsModalTitle')}
        </Text>
        {[1, 2, 3, 4, 5].map((n) => (
          <Text
            key={`l${n}`}
            style={[styles.paragraph, { color: colors.textSecondary }]}
          >
            {t(`result.legalDataLimitationsModalP${n}` as const)}
          </Text>
        ))}

        <Pressable
          style={({ pressed }) => [
            styles.checkboxRow,
            { backgroundColor: pressed ? colors.surface : colors.card, borderColor: colors.border },
          ]}
          onPress={() => setDataLimitationsAck(!dataLimitationsAck)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: dataLimitationsAck }}
          accessibilityLabel={t('onboarding.legalDataLimitationsCheckboxA11y')}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: dataLimitationsAck ? colors.primary : colors.border,
                backgroundColor: dataLimitationsAck ? colors.primary : 'transparent',
              },
            ]}
          >
            {dataLimitationsAck ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
          </View>
          <Text style={[styles.checkboxLabel, { color: colors.text }]}>
            {t('onboarding.legalDataLimitationsCheckbox')}
          </Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: canContinue ? colors.primary : colors.border },
          ]}
          onPress={onContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
        >
          <Text style={styles.continueButtonText}>{t('onboarding.legalStepContinue')}</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
        {!canContinue ? (
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            {t('onboarding.legalStepCheckboxHint')}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionSpacer: {
    marginTop: 20,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    gap: 12,
    minHeight: 48,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
});
