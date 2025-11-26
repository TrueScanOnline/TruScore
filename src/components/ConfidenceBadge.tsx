// Confidence badge component - displays data quality indicator
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Product } from '../types/product';
import { getSourceConfidence, getConfidenceLabel, getConfidenceDescription } from '../utils/confidenceScoring';
import { useTheme } from '../theme';

interface ConfidenceBadgeProps {
  product: Product;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showDescription?: boolean;
  onPress?: () => void;
}

export default function ConfidenceBadge({
  product,
  size = 'small',
  showLabel = true,
  showDescription = false,
  onPress,
}: ConfidenceBadgeProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  // Get confidence from product or calculate from source
  const confidence = product.confidence ?? getSourceConfidence(product.source).confidence;
  const reliability = product.sourceReliability ?? getSourceConfidence(product.source).reliability;
  
  // Get label text - use simple, user-friendly labels
  const getReliabilityLabel = () => {
    switch (reliability) {
      case 'high':
        return t('dataQuality.high') || 'High confidence';
      case 'medium':
        return t('dataQuality.medium') || 'Medium confidence';
      case 'low':
        return t('dataQuality.low') || 'Low confidence';
      default:
        return t('dataQuality.unknown') || 'Unknown';
    }
  };
  
  // Get badge color based on reliability
  const getBadgeColor = () => {
    switch (reliability) {
      case 'high':
        return '#16a085'; // Green
      case 'medium':
        return '#ffd93d'; // Yellow
      case 'low':
        return '#ffa500'; // Orange
      default:
        return colors.textSecondary;
    }
  };
  
  // Get icon based on reliability
  const getIcon = () => {
    switch (reliability) {
      case 'high':
        return 'checkmark-circle';
      case 'medium':
        return 'information-circle';
      case 'low':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };
  
  const badgeColor = getBadgeColor();
  const iconName = getIcon();
  const label = getReliabilityLabel();
  const description = getConfidenceDescription(reliability);
  
  // Size styles
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
    <View style={[styles.badge, currentSize.container, { backgroundColor: badgeColor + '20', borderColor: badgeColor }]}>
      <Ionicons name={iconName} size={currentSize.icon} color={badgeColor} />
      {showLabel && (
        <Text style={[currentSize.text, { color: badgeColor }]}>
          {label}
        </Text>
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
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallContainer: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  mediumContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  largeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  smallText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  mediumText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  largeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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



