import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../../theme';

export function ProcessingCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.headerLeft, { backgroundColor: colors.surface }]} />
      </View>
      <View style={[styles.content, { backgroundColor: colors.surface }]} />
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
    minHeight: 80,
  },
  header: {
    marginBottom: 12,
  },
  headerLeft: {
    width: 150,
    height: 24,
    borderRadius: 4,
  },
  content: {
    height: 30,
    borderRadius: 4,
  },
  loader: {
    marginTop: 12,
  },
});


