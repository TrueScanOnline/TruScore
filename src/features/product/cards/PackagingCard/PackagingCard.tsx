// Modular Packaging Card — Open Food Facts packaging data only; external links in PackagingSourcesModal.

import React, { useState, Suspense } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import { ProductWithTrustScore } from '../../../../types/product';
import PackagingInfoModal from '../../../../components/PackagingInfoModal';
import PackagingOffCardContent from '../../../../components/PackagingOffCardContent';
import { hasOffPackagingDisplay } from '../../../../utils/packagingOffDisplay';
import { useTheme } from '../../../../theme';
import { CardPremiumGate } from '../../../premium/CardPremiumGate';
import { PremiumFeature } from '../../../../utils/premiumFeatures';
import { PackagingCardSkeleton } from './PackagingCardSkeleton';
import { PackagingCardError } from './PackagingCardError';

/** Matches sustainability / recycling green used elsewhere in the app */
const PACKAGING_CARD_BORDER_GREEN = '#16a085';

interface PackagingCardProps {
  product?: ProductWithTrustScore;
  onShare?: () => void;
  premiumFeatures?: PremiumFeature[];
}

function PackagingCardContent({ product, onShare, premiumFeatures }: PackagingCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  if (!product || !hasOffPackagingDisplay(product)) {
    return null;
  }

  return (
    <>
      <CardPremiumGate features={premiumFeatures || []}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderWidth: 2,
              borderColor: PACKAGING_CARD_BORDER_GREEN,
            },
          ]}
        >
          <Pressable
            onPress={() => setInfoModalVisible(true)}
            style={({ pressed }) => [styles.cardHeaderPressable, { opacity: pressed ? 0.92 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={t('result.packaging')}
            accessibilityHint={t('result.packagingCardOpenModalA11y')}
          >
            <View style={styles.cardHeader}>
              <Ionicons
                name="cube-outline"
                size={22}
                color={PACKAGING_CARD_BORDER_GREEN}
                style={styles.cardHeaderIcon}
              />
              <View style={styles.cardTitleWrap}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('result.packaging')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </Pressable>
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollBodyContent}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            <PackagingOffCardContent product={product} />
          </ScrollView>
        </View>
      </CardPremiumGate>

      <PackagingInfoModal
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
        product={product}
      />
    </>
  );
}

export default function PackagingCard(props: PackagingCardProps) {
  return (
    <ErrorBoundary feature="PackagingCard">
      <Suspense fallback={<PackagingCardSkeleton />}>
        <PackagingCardContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 12,
    paddingTop: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    maxHeight: 288,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeaderPressable: {
    marginBottom: 10,
    flexShrink: 0,
  },
  scrollBody: {
    flexGrow: 1,
    minHeight: 72,
    maxHeight: 188,
  },
  scrollBodyContent: {
    paddingTop: 2,
    paddingBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  cardHeaderIcon: {
    flexShrink: 0,
    marginTop: 2,
  },
  cardTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 0,
    marginBottom: 0,
    paddingVertical: 2,
  },
});
