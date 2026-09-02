/**
 * Shared Score diagnostics Settings control (UAT-entitled builds only).
 */

import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { useSettingsStore } from '../store/useSettingsStore';
import { isScoreDiagnosticsBuildEntitled } from '../config/scoreDiagnostics';

export default function ScoreDiagnosticsSettingRow() {
  const { colors } = useTheme();
  const { scoreDiagnosticsEnabled, setScoreDiagnosticsEnabled } = useSettingsStore();

  if (!isScoreDiagnosticsBuildEntitled()) {
    return null;
  }

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.copy}>
        <Text style={[styles.label, { color: colors.text }]}>Score diagnostics</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          When On, Result shows “How was this scored?” for founder/UAT review. Off keeps near-consumer
          parity.
        </Text>
      </View>
      <Switch
        value={scoreDiagnosticsEnabled}
        onValueChange={setScoreDiagnosticsEnabled}
        trackColor={{ false: colors.border, true: colors.primary }}
        accessibilityLabel="Score diagnostics"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  copy: {
    flex: 1,
    paddingRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
});
