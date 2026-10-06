import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sanitizeCountryForDisplay } from '../utils/countryDisplayName';
import { countryFlagEmoji } from '../utils/countryFlagEmoji';

interface CountryFlagProps {
  country: string;
  showFlag?: boolean;
}

function formatCountryName(country: string): string {
  // Convert common formats to readable names
  if (!country || typeof country !== 'string') {
    return 'Unknown';
  }
  return country
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function CountryFlag({ country, showFlag = true }: CountryFlagProps) {
  const displayCountry = country ? sanitizeCountryForDisplay(country) : '';

  if (!displayCountry) {
    return (
      <View style={styles.container}>
        <Ionicons name="help-circle-outline" size={24} color="#95a5a6" />
        <Text style={styles.countryName}>Unknown</Text>
      </View>
    );
  }

  const flag = countryFlagEmoji(displayCountry);
  const formattedName = formatCountryName(displayCountry);

  return (
    <View style={styles.container}>
      {showFlag && <Text style={styles.flag}>{flag}</Text>}
      <Text style={styles.countryName}>{formattedName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flag: {
    fontSize: 24,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});

