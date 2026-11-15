import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resultEmeraldCard, resultEmeraldTone } from '../../theme/resultPresentation';
import { useTheme } from '../../theme';

type Props = {
  /** Future: authenticated display name. Stage 1 is always Guest. */
  displayName?: string;
  planLabel: string;
  supportingText: string;
};

export default function AccountProfileCard({
  displayName = 'Guest profile',
  planLabel,
  supportingText,
}: Props) {
  const { darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);

  return (
    <View style={[styles.card, resultEmeraldCard(!!darkMode)]} testID="account-profile-card">
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: darkMode ? '#243832' : '#E8F5F1' }]}>
          <Ionicons name="person" size={28} color={emerald.action} />
        </View>
        <View style={styles.identity}>
          <Text style={[styles.name, { color: emerald.ink }]}>{displayName}</Text>
          <Text style={[styles.supporting, { color: emerald.muted }]}>{supportingText}</Text>
        </View>
      </View>
      <View style={[styles.planStrip, { borderTopColor: emerald.line }]}>
        <Ionicons name="leaf-outline" size={16} color={emerald.action} />
        <Text style={[styles.planText, { color: emerald.ink }]}>{planLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  identity: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  supporting: {
    fontSize: 13,
    lineHeight: 18,
  },
  planStrip: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
