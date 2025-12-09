// Additives Risk Card Component
// Displays IARC and EWG classified ingredients/additives

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { Product } from '../types/product';
import { matchIngredientsAgainstIARC, getIARCPenalty, MatchedIARCAgent } from '../utils/ingredientMatcher';
import { getAdditiveInfo } from '../services/additiveDatabase';

interface AdditivesRiskCardProps {
  product: Product | null;
  onPress?: () => void;
}

export default function AdditivesRiskCard({ product, onPress }: AdditivesRiskCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  // Extract IARC and EWG risks
  const risks = useMemo(() => {
    if (!product) return { iarc: [], ewg: null, hasRisks: false };

    const iarcRisks: Array<{
      name: string;
      group: string;
      penalty: number;
      source: 'ingredient' | 'additive';
      confidence?: string;
    }> = [];

    // Check IARC-classified ingredients
    if (product.ingredients_text) {
      try {
        const matchedAgents = matchIngredientsAgainstIARC(product.ingredients_text);
        matchedAgents.forEach(agent => {
          // Only include high confidence matches
          if (agent.confidence === 'exact' || agent.confidence === 'high') {
            const penalty = getIARCPenalty(agent);
            if (penalty > 0) {
              iarcRisks.push({
                name: agent.agent,
                group: agent.group,
                penalty,
                source: 'ingredient',
                confidence: agent.confidence,
              });
            }
          }
        });
      } catch (error) {
        console.debug('Error matching IARC ingredients:', error);
      }
    }

    // Check IARC-classified additives (E-numbers)
    if (product.additives_tags) {
      product.additives_tags.forEach(tag => {
        const eNumMatch = tag.toLowerCase().match(/^en:?(e\d+[a-z]?)$/);
        if (eNumMatch) {
          const eNum = eNumMatch[1];
          const additiveInfo = getAdditiveInfo(eNum);
          if (additiveInfo?.iarcGroup) {
            // Check if not already added from ingredient matching
            const alreadyAdded = iarcRisks.some(
              risk => risk.name.toLowerCase() === additiveInfo.name.toLowerCase()
            );
            if (!alreadyAdded) {
              let penalty = 0;
              if (additiveInfo.iarcGroup === '1') penalty = 10;
              else if (additiveInfo.iarcGroup === '2A') penalty = 5;
              else if (additiveInfo.iarcGroup === '2B') penalty = 3;
              
              if (penalty > 0) {
                iarcRisks.push({
                  name: additiveInfo.name,
                  group: additiveInfo.iarcGroup,
                  penalty,
                  source: 'additive',
                });
              }
            }
          }
        }
      });
    }

    // Check EWG data
    const ewgData = (product as any).ewg_skin_deep;
    
    // More robust category detection for cosmetics/household
    // If EWG data exists, it means the product was already identified as cosmetic/household
    // So we should trust the EWG enhancement's detection
    const categories = (product.categories || '').toLowerCase();
    const categoriesTags = (product.categories_tags || []).map(t => t.toLowerCase());
    const source = (product as any).source || '';
    
    const isHousehold = 
      categories.includes('cosmetic') || 
      categories.includes('beauty') ||
      categories.includes('personal care') ||
      categories.includes('household') ||
      categoriesTags.some(tag => 
        tag.includes('cosmetic') || 
        tag.includes('beauty') ||
        tag.includes('personal-care') ||
        tag.includes('household')
      ) ||
      source === 'openbeautyfacts' ||
      source === 'openproductsfacts' ||
      !!ewgData; // If EWG data exists, treat as household/cosmetic

    // Debug logging (can be removed in production)
    if (__DEV__) {
      console.log('[AdditivesRiskCard] Product analysis:', {
        barcode: product.barcode,
        hasIngredients: !!product.ingredients_text,
        ingredientsLength: product.ingredients_text?.length || 0,
        hasAdditives: !!product.additives_tags,
        additivesCount: product.additives_tags?.length || 0,
        iarcRisksCount: iarcRisks.length,
        hasEwgData: !!ewgData,
        ewgHazardScore: ewgData?.hazardScore,
        isHousehold,
        categories: product.categories,
        categoriesTags: product.categories_tags,
        source,
      });
    }

    // Show card if there are IARC risks OR if EWG data exists (regardless of category)
    // EWG enhancement only runs for cosmetics, so if data exists, it's valid
    const hasRisks = iarcRisks.length > 0 || (ewgData && ewgData.hazardScore !== undefined);

    return {
      iarc: iarcRisks,
      ewg: ewgData && ewgData.hazardScore !== undefined ? ewgData : null,
      hasRisks,
    };
  }, [product]);

  if (!product || !risks.hasRisks) {
    return null;
  }

  // Determine card border color based on highest risk
  const getRiskColor = () => {
    if (risks.iarc.some(r => r.group === '1')) return '#ff6b6b'; // Red: Group 1
    if (risks.iarc.some(r => r.group === '2A')) return '#ff9500'; // Orange: Group 2A
    if (risks.iarc.some(r => r.group === '2B')) return '#ffa500'; // Yellow: Group 2B
    if (risks.ewg && risks.ewg.hazardScore && risks.ewg.hazardScore >= 8) return '#ff6b6b'; // Red: EWG F
    if (risks.ewg && risks.ewg.hazardScore && risks.ewg.hazardScore >= 6) return '#ff9500'; // Orange: EWG D
    return '#ffa500'; // Yellow: Default
  };

  const riskColor = getRiskColor();
  const totalRisks = risks.iarc.length + (risks.ewg ? 1 : 0);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderWidth: 2,
          borderColor: riskColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderTop}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="warning" size={24} color={riskColor} />
          </View>
          <View style={styles.cardHeaderRight}>
            {onPress && <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />}
          </View>
        </View>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {t('result.additivesRisk', 'Additives Risk')}
        </Text>
      </View>

      <View style={styles.content}>
        {/* IARC Risks */}
        {risks.iarc.length > 0 && (
          <View style={styles.risksSection}>
            {risks.iarc.slice(0, 3).map((risk, index) => {
              const groupColor = 
                risk.group === '1' ? '#ff6b6b' :
                risk.group === '2A' ? '#ff9500' :
                risk.group === '2B' ? '#ffa500' :
                '#999999';

              return (
                <View
                  key={index}
                  style={[
                    styles.riskItem,
                    { backgroundColor: groupColor + '15', borderLeftColor: groupColor },
                  ]}
                >
                  <Ionicons name="alert-circle" size={18} color={groupColor} />
                  <View style={styles.riskItemContent}>
                    <Text style={[styles.riskName, { color: colors.text }]}>
                      {risk.name}
                    </Text>
                    <Text style={[styles.riskGroup, { color: colors.textSecondary }]}>
                      IARC Group {risk.group}
                    </Text>
                  </View>
                </View>
              );
            })}
            {risks.iarc.length > 3 && (
              <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                +{risks.iarc.length - 3} more IARC-classified ingredient(s)
              </Text>
            )}
          </View>
        )}

        {/* EWG Risk */}
        {risks.ewg && (
          <View style={styles.risksSection}>
            <View
              style={[
                styles.riskItem,
                {
                  backgroundColor: risks.ewg.hazardScore && risks.ewg.hazardScore >= 8 ? '#ff6b6b15' :
                                   risks.ewg.hazardScore && risks.ewg.hazardScore >= 6 ? '#ff950015' :
                                   '#ffa50015',
                  borderLeftColor: risks.ewg.hazardScore && risks.ewg.hazardScore >= 8 ? '#ff6b6b' :
                                  risks.ewg.hazardScore && risks.ewg.hazardScore >= 6 ? '#ff9500' :
                                  '#ffa500',
                },
              ]}
            >
              <Ionicons
                name="shield"
                size={18}
                color={risks.ewg.hazardScore && risks.ewg.hazardScore >= 8 ? '#ff6b6b' :
                       risks.ewg.hazardScore && risks.ewg.hazardScore >= 6 ? '#ff9500' :
                       '#ffa500'}
              />
              <View style={styles.riskItemContent}>
                <Text style={[styles.riskName, { color: colors.text }]}>
                  EWG Hazard Score: {risks.ewg.hazardScore || 'N/A'}
                </Text>
                <Text style={[styles.riskGroup, { color: colors.textSecondary }]}>
                  {risks.ewg.hazardScore && risks.ewg.hazardScore <= 2 ? 'Rating: A' :
                   risks.ewg.hazardScore && risks.ewg.hazardScore <= 4 ? 'Rating: B' :
                   risks.ewg.hazardScore && risks.ewg.hazardScore <= 6 ? 'Rating: C' :
                   risks.ewg.hazardScore && risks.ewg.hazardScore <= 8 ? 'Rating: D' :
                   'Rating: F'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Summary */}
        <View style={[styles.summary, { backgroundColor: riskColor + '10' }]}>
          <Text style={[styles.summaryText, { color: colors.text }]}>
            {totalRisks === 1
              ? t('result.oneRiskDetected', '1 risk detected')
              : t('result.multipleRisksDetected', '{{count}} risks detected', { count: totalRisks })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  content: {
    gap: 12,
  },
  risksSection: {
    gap: 8,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    gap: 12,
  },
  riskItemContent: {
    flex: 1,
  },
  riskName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  riskGroup: {
    fontSize: 12,
  },
  moreText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  summary: {
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});

