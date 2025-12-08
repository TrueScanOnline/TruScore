import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../../theme';

export function RecallsCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.content, { backgroundColor: colors.surface }]} />
      <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    margin: 16,
    borderWidth: 2,
    minHeight: 80,
  },
  content: {
    height: 50,
    borderRadius: 8,
  },
  loader: {
    marginTop: 12,
  },
});


