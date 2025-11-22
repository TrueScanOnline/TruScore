// Values screen - accessible from navigation
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ValuesHome from '../src/features/values/ValuesHome';
import ShareValuesCard from '../src/features/values/ShareValuesCard';
import { useTheme } from '../src/theme';

export default function ValuesScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ValuesHome />
      <View style={styles.shareContainer}>
        <ShareValuesCard />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shareContainer: {
    padding: 16,
    paddingBottom: 32,
  },
});

