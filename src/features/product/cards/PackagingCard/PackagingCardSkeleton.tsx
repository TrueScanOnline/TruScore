import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../../theme';

export function PackagingCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: '#16a085' }]}>
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
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 2,
    maxHeight: 300,
    minHeight: 100,
  },
  header: {
    marginBottom: 12,
  },
  headerLeft: {
    width: 120,
    height: 24,
    borderRadius: 4,
  },
  content: {
    height: 60,
    borderRadius: 8,
  },
  loader: {
    marginTop: 12,
  },
});


