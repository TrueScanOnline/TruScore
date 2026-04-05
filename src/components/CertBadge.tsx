import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Certification } from '../types/product';
import { CERT_BADGE_ICONS } from '../constants/certDisplay';
import { formatCertificationTagForPicker } from '../services/ethicsCertificationsService';

function displayCertificationName(cert: Certification): string {
  const name = (cert.name || '').trim();
  if (name && !/^[a-z]{2}:/i.test(name)) {
    return cert.name!;
  }
  return formatCertificationTagForPicker(cert.tag || cert.id || name);
}

interface CertBadgeProps {
  certification: Certification;
  onPress?: () => void;
}

export { CERT_BADGE_ICONS } from '../constants/certDisplay';

export default function CertBadge({ certification, onPress }: CertBadgeProps) {
  const icon = CERT_BADGE_ICONS[certification.tag] || 'star-outline';
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Ionicons name={icon as any} size={20} color="#16a085" />
      <Text style={styles.name} numberOfLines={2}>
        {displayCertificationName(certification)}
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

