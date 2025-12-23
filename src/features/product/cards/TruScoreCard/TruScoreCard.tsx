// Modular TruScore Card Component
// Props-first with fallback fetching, progressive loading, error boundaries

import React, { useState, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import { ProductWithTrustScore } from '../../../../types/product';
import { useTruScoreData } from './hooks/useTruScoreData';
import { TruScoreCardSkeleton } from './TruScoreCardSkeleton';
import { TruScoreCardError } from './TruScoreCardError';
import TruScore from '../../../../components/TruScore';
import ConfidenceBadge from '../../../../components/ConfidenceBadge';
import TruScoreInfoModal from '../../../../components/TrustScoreInfoModal';
import ExplainerModal from '../../../../components/ExplainerModal';
import { generateProductFlags, ProductFlag } from '../../../../utils/productFlags';
import { useTheme } from '../../../../theme';
import { useFavoritesStore } from '../../../../store/useFavoritesStore';
import { CardPremiumGate } from '../../../premium/CardPremiumGate';
import { PremiumFeature } from '../../../../utils/premiumFeatures';

interface TruScoreCardProps {
  barcode: string;
  product?: ProductWithTrustScore; // Props-first: prefer provided product
  onShare?: () => void; // Share handler
  premiumFeatures?: PremiumFeature[]; // Card-level premium features
}

// Helper function to get TruScore color
const getTruScoreColor = (score: number | null) => {
  if (score === null) return '#95a5a6'; // Gray for insufficient data
  if (score >= 80) return '#16a085'; // Green (excellent)
  if (score >= 60) return '#4dd09f'; // Light green (good)
  if (score >= 40) return '#ffd93d'; // Yellow (fair)
  return '#ff6b6b'; // Red (poor)
};

function TruScoreCardContent({ barcode, product, onShare, premiumFeatures }: TruScoreCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { truScore, loading, error } = useTruScoreData({ barcode, product });
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [explainerModalVisible, setExplainerModalVisible] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState<ProductFlag | null>(null);

  const handleToggleFavorite = () => {
    if (isFavorite(barcode)) {
      removeFavorite(barcode);
    } else if (product) {
      addFavorite(barcode, product);
    }
  };

  if (loading) {
    return <TruScoreCardSkeleton />;
  }

  if (error) {
    return (
      <TruScoreCardError
        error={error}
        onRetry={() => {
          // Retry by refetching
          window.location.reload();
        }}
      />
    );
  }

  if (!truScore) {
    // Insufficient Data Card
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="information-circle-outline" size={24} color={colors.warning || '#ff9800'} />
            <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>
              {t('result.insufficientData')}
            </Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <TouchableOpacity
              onPress={handleToggleFavorite}
              style={styles.favoriteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isFavorite(barcode) ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite(barcode) ? '#ff6b6b' : colors.primary}
              />
            </TouchableOpacity>
            {onShare && (
              <TouchableOpacity
                onPress={onShare}
                style={styles.shareButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="share-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={[styles.insufficientDataText, { color: colors.textSecondary }]}>
          {t('result.insufficientDataMessage')}
        </Text>
      </View>
    );
  }

  // Ensure palm_oil_analysis exists for flag generation
  const productForFlags = product ? {
    ...product,
    palm_oil_analysis: product.palm_oil_analysis || (product.ingredients_text ? 
      require('../../../../services/openFoodFacts').extractPalmOilAnalysis(product) : undefined),
  } : undefined;

  const flags = productForFlags ? generateProductFlags(productForFlags) : [];
  
  // Sort flags: green first, then by severity (high > medium > low)
  const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
  const sortedFlags = [...flags].sort((a, b) => {
    // Green first
    if (a.type !== b.type) {
      return a.type === 'green' ? -1 : 1;
    }
    // Then by severity (high > medium > low)
    const severityA = severityOrder[a.severity || 'low'] || 0;
    const severityB = severityOrder[b.severity || 'low'] || 0;
    return severityB - severityA;
  });
  
  const greenFlags = sortedFlags.filter(f => f.type === 'green');
  const redFlags = sortedFlags.filter(f => f.type === 'red');
  
  const handleHighlightPress = (flag: ProductFlag) => {
    setSelectedHighlight(flag);
    setExplainerModalVisible(true);
  };

  return (
    <>
      <CardPremiumGate features={premiumFeatures || []}>
        <TouchableOpacity
          style={[styles.card, {
            backgroundColor: colors.card,
            borderColor: getTruScoreColor(truScore.truscore),
            borderWidth: 2,
          }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="shield" size={24} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 8 }]}>TruScore</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={styles.infoButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.cardHeaderRight}>
              <TouchableOpacity
                onPress={handleToggleFavorite}
                style={styles.favoriteButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={isFavorite(barcode) ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavorite(barcode) ? '#ff6b6b' : colors.primary}
                />
              </TouchableOpacity>
              {onShare && (
                <TouchableOpacity
                  onPress={onShare}
                  style={styles.shareButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="share-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* TruScore Display */}
          <TruScore truScore={truScore} size="medium" />

          {/* Confidence Badge */}
          {product && product.confidence !== undefined && (
            <View style={styles.confidenceBadgeContainer}>
              <ConfidenceBadge product={product} size="small" />
            </View>
          )}

          {/* Score Highlights */}
          {(greenFlags.length > 0 || redFlags.length > 0) && (
            <View style={[styles.reasonsContainer, { borderTopColor: colors.border }]}>
              <Text style={[styles.reasonsTitle, { color: colors.text }]}>Score highlights:</Text>

              {/* Green Flags */}
              {greenFlags.length > 0 && (
                <View style={styles.flagsSection}>
                  <View style={styles.flagsHeader}>
                    <Ionicons name="checkmark-circle" size={18} color="#4caf50" />
                    <Text style={[styles.flagsSectionTitle, { color: colors.text }]}>
                      {t('result.positivePoints')} ({greenFlags.length})
                    </Text>
                  </View>
                  {greenFlags.map((flag, index) => (
                    <TouchableOpacity
                      key={`green-${index}`}
                      style={styles.flagItem}
                      onPress={() => handleHighlightPress(flag)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.flagIndicator, { backgroundColor: '#4caf50' + '20' }]}>
                        <Ionicons name="checkmark-circle" size={14} color="#4caf50" />
                      </View>
                      <View style={styles.flagContent}>
                        <Text style={[styles.flagTitle, { color: colors.text }]}>{flag.title}</Text>
                        <Text style={[styles.flagDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                          {flag.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Red Flags */}
              {redFlags.length > 0 && (
                <View style={[styles.flagsSection, greenFlags.length > 0 && styles.flagsSectionWithMargin]}>
                  <View style={styles.flagsHeader}>
                    <Ionicons name="alert-circle" size={18} color="#f44336" />
                    <Text style={[styles.flagsSectionTitle, { color: colors.text }]}>
                      {t('result.negativePoints')} ({redFlags.length})
                    </Text>
                  </View>
                  {redFlags.map((flag, index) => (
                    <TouchableOpacity
                      key={`red-${index}`}
                      style={styles.flagItem}
                      onPress={() => handleHighlightPress(flag)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.flagIndicator, { backgroundColor: '#f44336' + '20' }]}>
                        <Ionicons name="alert-circle" size={14} color="#f44336" />
                      </View>
                      <View style={styles.flagContent}>
                        <Text style={[styles.flagTitle, { color: colors.text }]}>{flag.title}</Text>
                        <Text style={[styles.flagDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                          {flag.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </CardPremiumGate>

      {/* TruScore Info Modal */}
      <TruScoreInfoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        product={product}
      />
      
      {/* Explainer Modal for highlights */}
      {selectedHighlight && (
        <ExplainerModal
          visible={explainerModalVisible}
          onClose={() => {
            setExplainerModalVisible(false);
            setSelectedHighlight(null);
          }}
          highlight={selectedHighlight}
        />
      )}
    </>
  );
}

export default function TruScoreCard(props: TruScoreCardProps) {
  return (
    <ErrorBoundary
      feature="TruScoreCard"
      onError={(error) => {
        // Error logged by ErrorBoundary
      }}
    >
      <Suspense fallback={<TruScoreCardSkeleton />}>
        <TruScoreCardContent {...props} />
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoButton: {
    marginLeft: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  shareButton: {
    padding: 4,
  },
  confidenceBadgeContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  reasonsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  reasonsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  flagsSection: {
    marginBottom: 12,
  },
  flagsSectionWithMargin: {
    marginTop: 12,
  },
  flagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  flagsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  flagIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  flagContent: {
    flex: 1,
  },
  flagTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  flagDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  insufficientDataText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    paddingHorizontal: 4,
  },
});


