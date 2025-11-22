// ShareValuesCard.tsx - Generate and share values preferences card
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useValuesStore, TOP_BOYCOUTS } from '../../store/useValuesStore';

export default function ShareValuesCard() {
  const { colors } = useTheme();
  const [sharing, setSharing] = useState(false);
  const preferences = useValuesStore();

  const getActiveToggles = (): string[] => {
    const active: string[] = [];
    
    if (preferences.geopoliticalEnabled) {
      if (preferences.israelPalestine === 'avoid_israel') {
        active.push('Avoid Israel-linked products');
      } else if (preferences.israelPalestine === 'avoid_palestine') {
        active.push('Avoid Palestine-linked products');
      }
      if (preferences.indiaChina === 'avoid_china') {
        active.push('Avoid China-linked products');
      } else if (preferences.indiaChina === 'avoid_india') {
        active.push('Avoid India-linked products');
      }
    }
    
    if (preferences.ethicalEnabled) {
      if (preferences.avoidAnimalTesting) {
        active.push('Avoid Animal Testing/Cruelty');
      }
      if (preferences.avoidForcedLabour) {
        active.push('Avoid Forced/Child Labour');
      }
    }
    
    if (preferences.environmentalEnabled && preferences.avoidPalmOil) {
      active.push('Avoid Unsustainable Palm Oil');
    }
    
    return active;
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const activeToggles = getActiveToggles();
      
      if (activeToggles.length === 0) {
        Alert.alert('No Active Preferences', 'Please enable at least one value preference to share.');
        setSharing(false);
        return;
      }

      // Build share message
      let message = 'My TruScore choices – scanning smarter\n\n';
      message += 'Active Preferences:\n';
      activeToggles.forEach((toggle, index) => {
        message += `${index + 1}. ${toggle}\n`;
      });

      // Add top 5 boycotts if 3+ active preferences
      if (activeToggles.length >= 3) {
        message += '\nTop Boycotts by Market Cap:\n';
        TOP_BOYCOUTS.slice(0, 5).forEach((company, index) => {
          message += `${index + 1}. ${company}\n`;
        });
      }

      message += '\n#TruScore #EthicalShopping #ValuesBasedShopping';

      await Share.share({
        message,
        title: 'My TruScore Choices',
      });
    } catch (error) {
      console.error('Error sharing values:', error);
      Alert.alert('Error', 'Failed to share values. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.shareButton, { backgroundColor: colors.primary }]}
      onPress={handleShare}
      disabled={sharing}
      activeOpacity={0.8}
    >
      {sharing ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Ionicons name="share-outline" size={20} color="#fff" />
          <Text style={styles.shareButtonText}>Share My Choices</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 28,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

