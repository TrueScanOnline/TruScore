import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../../theme';

export function NutritionCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.headerLeft, { backgroundColor: colors.surface }]} />
      </View>
      <View style={styles.content}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.row, { backgroundColor: colors.surface }]} />
        ))}
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
    borderWidth: 1,
    minHeight: 200,
  },
  header: {
    marginBottom: 16,
  },
  headerLeft: {
    width: 150,
    height: 24,
    borderRadius: 4,
  },
  content: {
    gap: 8,
  },
  row: {
    height: 20,
    borderRadius: 4,
  },
  loader: {
    marginTop: 16,
  },
});


