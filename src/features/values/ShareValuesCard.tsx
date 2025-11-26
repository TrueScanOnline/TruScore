// ShareValuesCard.tsx - Generate and share values preferences card
import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme';
import { useValuesStore, TOP_BOYCOUTS } from '../../store/useValuesStore';
import { RootStackParamList } from '../../../app/_layout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ShareValuesCardProps {
  truScore?: number;
}

export default function ShareValuesCard({ truScore }: ShareValuesCardProps = {}) {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [sharing, setSharing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const preferences = useValuesStore();

  // Initialize store on mount and ensure it's loaded
  useEffect(() => {
    const init = async () => {
      await preferences.initializeStore();
      setInitialized(true);
    };
    init();
  }, []);

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
    // Ensure store is initialized first
    if (!initialized) {
      await preferences.initializeStore();
      setInitialized(true);
    }

    setSharing(true);
    try {
      const activeToggles = getActiveToggles();
      
      if (activeToggles.length === 0) {
        setSharing(false);
        Alert.alert(
          'No Active Preferences',
          'Enable at least one value preference to share. Set up preferences now?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Set Preferences',
              onPress: () => {
                navigation.navigate('Values');
              },
            },
          ]
        );
        return;
      }

      // Build share message - v1.3 spec: objective "TruScore 78 + insights" format
      const score = truScore || 0;
      const hasInsights = activeToggles.length > 0;
      
      let message = '';
      if (hasInsights) {
        const insightTypes = activeToggles.filter(t => t.includes('cruelty') || t.includes('Cruelty')).length > 0 ? 'cruelty' : '';
        const bdsTypes = activeToggles.filter(t => t.includes('Israel') || t.includes('Palestine')).length > 0 ? 'BDS' : '';
        const flags = [insightTypes, bdsTypes].filter(Boolean).join(' & ');
        message = `TruScore ${score} + insights flagged ${flags}\n\n`;
      } else {
        message = `TruScore ${score} – independent breakdown\n\n`;
      }
      
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
        title: 'TruScore Choices',
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
          <Text style={styles.shareButtonText}>Share Choices</Text>
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

