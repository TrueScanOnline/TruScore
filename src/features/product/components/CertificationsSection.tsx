/**
 * Certifications Section Component
 * 
 * Displays product certifications and ethical badges.
 * Optimized with React.memo for performance.
 * 
 * @module CertificationsSection
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ProductWithTrustScore } from '../../../types/product';
import { useTheme } from '../../../theme';
import CertBadge from '../../../components/CertBadge';

interface CertificationsSectionProps {
  product: ProductWithTrustScore;
}

const CertificationsSection = React.memo(function CertificationsSection({ 
  product 
}: CertificationsSectionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  if (!product.certifications || product.certifications.length === 0) {
    return null;
  }
  
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          {t('result.certifications')}
        </Text>
      </View>
      
      <View style={styles.certificationsContainer}>
        {product.certifications.map((cert) => (
          <CertBadge key={cert.id} certification={cert} />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

export default CertificationsSection;

