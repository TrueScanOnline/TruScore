// Modular Certifications Card Component

import React, { Suspense } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import { ProductWithTrustScore } from '../../../../types/product';
import CertBadge from '../../../../components/CertBadge';
import { useTheme } from '../../../../theme';
import { CardPremiumGate } from '../../../premium/CardPremiumGate';
import { PremiumFeature } from '../../../../utils/premiumFeatures';
import { CertificationsCardSkeleton } from './CertificationsCardSkeleton';
import { CertificationsCardError } from './CertificationsCardError';

interface CertificationsCardProps {
  product?: ProductWithTrustScore;
  onShare?: () => void;
  premiumFeatures?: PremiumFeature[];
}

function CertificationsCardContent({ product, onShare, premiumFeatures }: CertificationsCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (!product || !product.certifications || product.certifications.length === 0) {
    return null;
  }

  return (
    <CardPremiumGate features={premiumFeatures || []}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
            {t('result.certifications')}
          </Text>
        </View>
        <View style={styles.certificationsContainer}>
          {product.certifications.map((cert) => (
            <CertBadge key={cert.id} certification={cert} />
          ))}
        </View>
      </View>
    </CardPremiumGate>
  );
}

export default function CertificationsCard(props: CertificationsCardProps) {
  return (
    <ErrorBoundary feature="CertificationsCard">
      <Suspense fallback={<CertificationsCardSkeleton />}>
        <CertificationsCardContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
});


