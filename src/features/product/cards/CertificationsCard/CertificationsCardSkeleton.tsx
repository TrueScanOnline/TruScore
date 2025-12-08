import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../../theme';

export function CertificationsCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.headerLeft, { backgroundColor: colors.surface }]} />
      </View>
      <View style={styles.badges}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.badge, { backgroundColor: colors.surface }]} />
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
    minHeight: 100,
  },
  header: {
    marginBottom: 12,
  },
  headerLeft: {
    width: 150,
    height: 24,
    borderRadius: 4,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    width: 100,
    height: 40,
    borderRadius: 20,
  },
  loader: {
    marginTop: 12,
  },
});


