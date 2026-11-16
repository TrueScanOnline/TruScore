/**
 * Administrative publication hold notice.
 * Distinct from Rateability NR / Checking — does not alter engine outputs.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PublicationHoldClientState } from '../../services/publicationHold';
import { shouldWithholdConsumerPublication } from '../../services/publicationHold';

type Props = {
  hold: PublicationHoldClientState | null;
  darkMode?: boolean;
};

export default function PublicationHoldNotice({ hold, darkMode }: Props) {
  const { t } = useTranslation();
  if (!hold || !shouldWithholdConsumerPublication(hold)) return null;

  const title =
    hold.status === 'held'
      ? t(
          'result.publicationHoldTitle',
          'Assessment temporarily unavailable'
        )
      : t(
          'result.publicationHoldUnavailableTitle',
          'Assessment temporarily unavailable'
        );
  const body =
    hold.status === 'held'
      ? t(
          'result.publicationHoldBody',
          'This product assessment is temporarily withheld for review. This is not an UnRevealed or Checking score state.'
        )
      : t(
          'result.publicationHoldUnavailableBody',
          'We could not confirm publication status for this product. Assessment details are withheld until status can be verified.'
        );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: darkMode ? '#1c1c1e' : '#F4F6F5',
          borderColor: darkMode ? '#3a3a3c' : '#D5DDD9',
        },
      ]}
      testID="publication-hold-notice"
      accessibilityRole="summary"
    >
      <Text style={[styles.kind, { color: darkMode ? '#8E8E93' : '#6B7280' }]}>
        {t('result.publicationHoldKind', 'Administrative hold')}
      </Text>
      <Text style={[styles.title, { color: darkMode ? '#F5F5F7' : '#111827' }]}>{title}</Text>
      <Text style={[styles.body, { color: darkMode ? '#C7C7CC' : '#4B5563' }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  kind: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
});
