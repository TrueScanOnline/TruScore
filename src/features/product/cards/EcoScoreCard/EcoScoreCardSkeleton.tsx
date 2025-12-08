import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../../theme';

export function EcoScoreCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.headerLeft, { backgroundColor: colors.surface }]} />
      </View>
      <View style={styles.content}>
        <View style={[styles.scoreCircle, { backgroundColor: colors.surface }]} />
      </View>
      <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    margin: 16,
    borderWidth: 2,
    minHeight: 150,
  },
  header: {
    marginBottom: 16,
  },
  headerLeft: {
    width: 120,
    height: 24,
    borderRadius: 4,
  },
  content: {
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  loader: {
    marginTop: 16,
  },
});


