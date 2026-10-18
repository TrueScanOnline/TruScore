import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sanitizeCountryForDisplay } from '../utils/countryDisplayName';
import { countryFlagEmoji } from '../utils/countryFlagEmoji';

interface CountryFlagProps {
  country: string;
  showFlag?: boolean;
  /** Larger flag and name for the Product Origins place panel. */
  appearance?: 'default' | 'hero';
  nameColor?: string;
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

export default function CountryFlag({ country, showFlag = true, appearance = 'default', nameColor }: CountryFlagProps) {
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

  const hero = appearance === 'hero';
  return (
    <View style={styles.container}>
      {showFlag && <Text style={hero ? styles.heroFlag : styles.flag}>{flag}</Text>}
      <Text style={[hero ? styles.heroName : styles.countryName, nameColor ? { color: nameColor } : null]}>
        {formattedName}
      </Text>
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
  heroFlag: {
    fontSize: 40,
    lineHeight: 48,
  },
  heroName: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
});

