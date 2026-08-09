// Card-level premium gate component
// Allows cards to have multiple premium features

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../app/_layout';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import { PremiumFeature, PremiumFeatureDescriptions, isPremiumFeatureEnabled } from '../../utils/premiumFeatures';
import { isMvpSubscriptionAndPaywallEnabled } from '../../config/mvpRuntimeGates';
import { useTheme } from '../../theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CardPremiumGateProps {
  features: PremiumFeature[]; // Array of premium features for this card
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeButton?: boolean;
}

export function CardPremiumGate({
  features,
  children,
  fallback,
  showUpgradeButton = true,
}: CardPremiumGateProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { subscriptionInfo } = useSubscriptionStore();

  // MVP: subscription/paywall deferred — no upgrade CTAs
  if (!isMvpSubscriptionAndPaywallEnabled()) {
    return <>{children}</>;
  }

  // Check if all features are enabled
  const allEnabled = features.every((feature) =>
    isPremiumFeatureEnabled(feature, subscriptionInfo)
  );

  // If all features enabled, show content
  if (allEnabled) {
    return <>{children}</>;
  }

  // If fallback provided, show it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Get first premium feature for display
  const firstFeature = features[0];
  const featureDesc = PremiumFeatureDescriptions[firstFeature];

  const handleUpgrade = () => {
    navigation.navigate('Subscription');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name={featureDesc.icon as any} size={32} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        {features.length === 1
          ? featureDesc.title
          : t('premium.multipleFeatures', 'Premium Features')}
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {features.length === 1
          ? featureDesc.description
          : t('premium.multipleFeaturesDescription', 'This card includes premium features. Upgrade to unlock.')}
      </Text>
      {showUpgradeButton && (
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
          onPress={handleUpgrade}
        >
          <Ionicons name="star" size={20} color="#fff" />
          <Text style={styles.upgradeButtonText}>{t('profile.upgradeToPremium')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


