// Skeleton loader for TruScore card
// Shows card structure while loading

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../../theme';

export function TruScoreCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.headerLeft, { backgroundColor: colors.surface }]} />
        <View style={[styles.headerRight, { backgroundColor: colors.surface }]} />
      </View>
      <View style={styles.content}>
        <View style={[styles.scoreCircle, { backgroundColor: colors.surface }]} />
        <View style={[styles.label, { backgroundColor: colors.surface }]} />
        <View style={[styles.pillars, { backgroundColor: colors.surface }]} />
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
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    width: 120,
    height: 24,
    borderRadius: 4,
  },
  headerRight: {
    width: 80,
    height: 24,
    borderRadius: 4,
  },
  content: {
    alignItems: 'center',
    marginVertical: 16,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  label: {
    width: 80,
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  pillars: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginTop: 16,
  },
  loader: {
    marginTop: 16,
  },
});


