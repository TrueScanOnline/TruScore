/**
 * W5-CD-01 local UAT preview — presentation only.
 * Registered for founder Android inspection; does not submit contributions.
 */

import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ContributionCelebrationOverlay,
  type ContributionCelebrationVariant,
} from '../src/contributionDelight';
import { resultEmeraldTone } from '../src/theme/resultPresentation';
import { useTheme } from '../src/theme';

const VARIANTS: { id: ContributionCelebrationVariant; label: string }[] = [
  { id: 'admitted_visible', label: 'Full celebration (admitted / visible)' },
  { id: 'correction', label: 'Correction acknowledgement' },
  { id: 'agreement_compact', label: 'Community Agreement compact' },
];

export default function ContributionCelebrationPreviewScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { darkMode } = useTheme();
  const emerald = resultEmeraldTone(darkMode);
  const [variant, setVariant] = useState<ContributionCelebrationVariant | null>(null);
  const [reduced, setReduced] = useState(false);

  // Release builds must not expose this presentation harness.
  if (!__DEV__) {
    return null;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, backgroundColor: darkMode ? '#141c1b' : '#eef6f4' }]}>
      <Text style={[styles.heading, { color: emerald.ink }]}>W5-CD-01 Celebration Preview</Text>
      <Text style={[styles.sub, { color: emerald.muted }]}>
        Local presentation preview only. No contribution, scoring, or share side effects.
      </Text>
      <ScrollView contentContainerStyle={styles.list}>
        {VARIANTS.map((row) => (
          <Pressable
            key={row.id}
            onPress={() => {
              setReduced(false);
              setVariant(row.id);
            }}
            style={[styles.button, { backgroundColor: emerald.action }]}
            accessibilityRole="button"
            accessibilityLabel={row.label}
          >
            <Text style={styles.buttonLabel}>{row.label}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => {
            setReduced(true);
            setVariant('admitted_visible');
          }}
          style={[styles.button, { backgroundColor: emerald.muted }]}
          accessibilityRole="button"
          accessibilityLabel="Reduced motion representation"
        >
          <Text style={styles.buttonLabel}>Reduced-motion representation</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.secondary, { borderColor: emerald.line }]}
          accessibilityRole="button"
          accessibilityLabel="Close preview"
        >
          <Text style={[styles.secondaryLabel, { color: emerald.action }]}>Close</Text>
        </Pressable>
      </ScrollView>

      <ContributionCelebrationOverlay
        visible={variant != null}
        variant={variant}
        forceReducedMotion={reduced}
        onDismiss={() => setVariant(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 18 },
  list: { gap: 12, paddingBottom: 40 },
  button: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  buttonLabel: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, textAlign: 'center' },
  secondary: {
    marginTop: 8,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: { fontWeight: '600', fontSize: 15 },
});
