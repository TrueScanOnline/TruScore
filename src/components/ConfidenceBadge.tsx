/**
 * W3-S11 Confidence badge — bound to Wave 3 Overall Confidence state.
 * Legacy source-reliability High/Medium/Low derivation is disconnected.
 * Rated only: High / Moderate / Limited. Checking/NR: no label.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product, ProductWithTrustScore } from '../types/product';
import { overallConfidenceLabel } from '../lib/rateability';
import { useTheme } from '../theme';

interface ConfidenceBadgeProps {
  product: Product | ProductWithTrustScore;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showDescription?: boolean;
  onPress?: () => void;
  /**
   * When false (enrichment still in progress), suppress Confidence even if
   * an internal publication snapshot exists — first-paint contract (§12).
   */
  publicationSettled?: boolean;
}

export default function ConfidenceBadge({
  product,
  size = 'small',
  showLabel = true,
  showDescription = false,
  onPress,
  publicationSettled = true,
}: ConfidenceBadgeProps) {
  const { colors } = useTheme();
  const publication = (product as ProductWithTrustScore)._publication;

  if (!publicationSettled || !publication) {
    return null;
  }

  const label = overallConfidenceLabel(publication.overall);
  if (!label) {
    return null;
  }

  const confidence = publication.overall.confidence;
  const getBadgeColor = () => {
    switch (confidence) {
      case 'high':
        return '#16a085';
      case 'moderate':
        return '#ffd93d';
      case 'limited':
        return '#ffa500';
      default:
        return colors.textSecondary;
    }
  };

  const getIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (confidence) {
      case 'high':
        return 'checkmark-circle';
      case 'moderate':
        return 'information-circle';
      case 'limited':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const description =
    publication.overall.s26?.explanation ??
    (confidence === 'high'
      ? 'All four pillars rated with High confidence'
      : confidence === 'moderate'
        ? 'All four pillars rated; overall confidence is Moderate'
        : 'All four pillars rated; overall confidence is Limited');

  const badgeColor = getBadgeColor();
  const iconName = getIcon();

  const sizeStyles = {
    small: {
      container: styles.smallContainer,
      icon: 14,
      text: styles.smallText,
      description: styles.smallDescription,
    },
    medium: {
      container: styles.mediumContainer,
      icon: 16,
      text: styles.mediumText,
      description: styles.mediumDescription,
    },
    large: {
      container: styles.largeContainer,
      icon: 18,
      text: styles.largeText,
      description: styles.largeDescription,
    },
  };

  const currentSize = sizeStyles[size];

  const badgeContent = (
    <View
      style={[
        styles.badge,
        currentSize.container,
        { backgroundColor: badgeColor + '20', borderColor: badgeColor },
      ]}
    >
      <Ionicons name={iconName} size={currentSize.icon} color={badgeColor} />
      {showLabel && (
        <Text style={[currentSize.text, { color: badgeColor }]}>{label}</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {badgeContent}
        {showDescription && (
          <Text style={[currentSize.description, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View>
      {badgeContent}
      {showDescription && (
        <Text style={[currentSize.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 120,
  },
  smallContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    minWidth: 110,
  },
  mediumContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 120,
  },
  largeContainer: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 22,
    minWidth: 130,
  },
  smallText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  mediumText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  largeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 7,
    letterSpacing: 0.3,
  },
  smallDescription: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  mediumDescription: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  largeDescription: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
});
