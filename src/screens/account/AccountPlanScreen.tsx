import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AccountScreenShell from '../../components/account/AccountScreenShell';
import { resultEmeraldCard, resultEmeraldTone } from '../../theme/resultPresentation';
import { useTheme } from '../../theme';
import { isMvpSubscriptionAndPaywallEnabled } from '../../config/mvpRuntimeGates';

/**
 * Permanent future entry for Premium — Stage 1 shows Free plan only.
 * Must not initialise the payments SDK, show purchase CTAs, or label Premium from stale cache.
 */
export default function AccountPlanScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);
  const paywallLive = isMvpSubscriptionAndPaywallEnabled();

  return (
    <AccountScreenShell
      title={t('account.planTitle')}
      onBack={() => navigation.goBack()}
      testID="account-plan-screen"
    >
      <View style={[styles.card, resultEmeraldCard(!!darkMode)]}>
        <View style={[styles.badge, { backgroundColor: darkMode ? '#243832' : '#E8F5F1' }]}>
          <Ionicons name="leaf" size={22} color={emerald.action} />
        </View>
        <Text style={[styles.heading, { color: emerald.ink }]}>{t('account.planFreeName')}</Text>
        <Text style={[styles.body, { color: emerald.muted }]}>{t('account.planFreeBody')}</Text>
      </View>

      <View style={[styles.card, resultEmeraldCard(!!darkMode), styles.features]}>
        <Text style={[styles.sectionLabel, { color: emerald.muted }]}>
          {t('account.planIncludes')}
        </Text>
        {(
          [
            t('account.planFeatureScan'),
            t('account.planFeatureSearch'),
            t('account.planFeatureHistory'),
            t('account.planFeatureScore'),
          ] as string[]
        ).map((line) => (
          <View key={line} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={18} color={emerald.action} />
            <Text style={[styles.featureText, { color: emerald.ink }]}>{line}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.futureNote, { color: emerald.muted }]} testID="account-plan-future-note">
        {t('account.planPaidUnavailableNote')}
      </Text>

      {/* Explicit guard: purchase UI stays off while the MVP gate is false. */}
      {paywallLive ? null : (
        <Text style={styles.hiddenGate} testID="account-plan-no-purchase">
          {''}
        </Text>
      )}
    </AccountScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 14,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  features: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 15,
    flex: 1,
  },
  futureNote: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  hiddenGate: {
    height: 0,
    width: 0,
    opacity: 0,
  },
});
