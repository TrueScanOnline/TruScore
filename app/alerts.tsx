// User Alerts screen — optional scan insights from preferences (not spec-driven banner alerts)
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AlertsHome from '../src/features/alerts/AlertsHome';

export default function AlertsScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <AlertsHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
