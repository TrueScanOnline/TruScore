import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Certification } from '../types/product';

interface CertBadgeProps {
  certification: Certification;
  onPress?: () => void;
}

const certIcons: Record<string, string> = {
  'en:organic': 'leaf-outline',
  'en:fair-trade': 'hand-right-outline',
  'en:rainforest-alliance': 'water-outline',
  'en:utz': 'checkmark-circle-outline',
  'en:free-range': 'paw-outline',
  'en:cage-free': 'egg-outline',
  'en:marine-stewardship-council': 'fish-outline',
};

export default function CertBadge({ certification, onPress }: CertBadgeProps) {
  const icon = certIcons[certification.tag] || 'star-outline';
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Ionicons name={icon as any} size={20} color="#16a085" />
      <Text style={styles.name} numberOfLines={2}>
        {certification.name}
      </Text>
    </Component>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    flexShrink: 1,
  },
});

