import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../app/_layout';
import { useSubscriptionStore } from '../store/useSubscriptionStore';
import { PremiumFeature, PremiumFeatureDescriptions, isPremiumFeatureEnabled, getPremiumFeatureMessage } from '../utils/premiumFeatures';
import { useTheme } from '../theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeButton?: boolean;
}

export default function PremiumGate({ feature, children, fallback, showUpgradeButton = true }: PremiumGateProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { subscriptionInfo } = useSubscriptionStore();

  const isEnabled = isPremiumFeatureEnabled(feature, subscriptionInfo);
  const featureDesc = PremiumFeatureDescriptions[feature];

  // If feature is enabled (either not premium or user has subscription), show content
  if (isEnabled) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const handleUpgrade = () => {
    navigation.navigate('Subscription');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name={featureDesc.icon as any} size={32} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{featureDesc.title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {featureDesc.description}
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

