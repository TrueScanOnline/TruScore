// Additives Risk Card — Body Pillar MVP registry (exact tiers) + EWG for cosmetics/household when present

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { Product } from '../types/product';
import { scoreBodyMvpAdditives } from '../lib/truscoreEngine/pillars/bodyAdditiveScoring';

interface AdditivesRiskCardProps {
  product: Product | null;
  onPress?: () => void;
}

export default function AdditivesRiskCard({ product, onPress }: AdditivesRiskCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const risks = useMemo(() => {
    if (!product) return { mvp: [], ewg: null, hasRisks: false };

    const mvp = scoreBodyMvpAdditives(product);
    const mvpRisks = mvp.matches.map((m) => ({
      name: m.name,
      tier: m.tier,
      deduction: m.deduction,
    }));

    const ewgData = (product as any).ewg_skin_deep;
    const categories = (product.categories || '').toLowerCase();
    const categoriesTags = (product.categories_tags || []).map((x) => String(x).toLowerCase());
    const source = String((product as any).source || '');

    const isHousehold =
      categories.includes('cosmetic') ||
      categories.includes('beauty') ||
      categories.includes('personal care') ||
      categories.includes('household') ||
      categoriesTags.some(
        (tag) =>
          tag.includes('cosmetic') ||
          tag.includes('beauty') ||
          tag.includes('personal-care') ||
          tag.includes('household')
      ) ||
      source === 'openbeautyfacts' ||
      source === 'openproductsfacts' ||
      !!ewgData;

    const hasRisks = mvpRisks.length > 0 || (ewgData && ewgData.hazardScore !== undefined && isHousehold);

    return {
      mvp: mvpRisks,
      ewg: ewgData && ewgData.hazardScore !== undefined && isHousehold ? ewgData : null,
      hasRisks,
    };
  }, [product]);

  if (!product || !risks.hasRisks) {
    return null;
  }

  const getTierColor = (tier: string) => {
    if (tier === 'red') return '#ff6b6b';
    if (tier === 'orange') return '#ff9500';
    return '#ffa500';
  };

  const getRiskColor = () => {
    if (risks.mvp.some((r) => r.tier === 'red')) return '#ff6b6b';
    if (risks.mvp.some((r) => r.tier === 'orange')) return '#ff9500';
    if (risks.mvp.length > 0) return '#ffa500';
    if (risks.ewg && risks.ewg.hazardScore >= 8) return '#ff6b6b';
    if (risks.ewg && risks.ewg.hazardScore >= 6) return '#ff9500';
    return '#ffa500';
  };

  const riskColor = getRiskColor();
  const totalRisks = risks.mvp.length + (risks.ewg ? 1 : 0);

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
        {risks.mvp.length > 0 && (
          <View style={styles.risksSection}>
            {risks.mvp.slice(0, 5).map((risk, index) => {
              const tc = getTierColor(risk.tier);
              return (
                <View
                  key={index}
                  style={[styles.riskItem, { backgroundColor: tc + '15', borderLeftColor: tc }]}
                >
                  <Ionicons name="alert-circle" size={18} color={tc} />
                  <View style={styles.riskItemContent}>
                    <Text style={[styles.riskName, { color: colors.text }]}>{risk.name}</Text>
                    <Text style={[styles.riskGroup, { color: colors.textSecondary }]}>
                      {t('result.bodyAdditiveTier', 'Body concern tier')}: {risk.tier} (−{risk.deduction})
                    </Text>
                  </View>
                </View>
              );
            })}
            {risks.mvp.length > 5 && (
              <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                +{risks.mvp.length - 5} {t('result.moreAdditives', 'more')}
              </Text>
            )}
          </View>
        )}

        {risks.ewg && (
          <View style={styles.risksSection}>
            <View
              style={[
                styles.riskItem,
                {
                  backgroundColor:
                    risks.ewg.hazardScore && risks.ewg.hazardScore >= 8 ? '#ff6b6b15' : '#ff950015',
                  borderLeftColor:
                    risks.ewg.hazardScore && risks.ewg.hazardScore >= 8 ? '#ff6b6b' : '#ff9500',
                },
              ]}
            >
              <Ionicons name="shield" size={18} color="#ff9500" />
              <View style={styles.riskItemContent}>
                <Text style={[styles.riskName, { color: colors.text }]}>
                  EWG Hazard Score: {risks.ewg.hazardScore ?? 'N/A'}
                </Text>
                <Text style={[styles.riskGroup, { color: colors.textSecondary }]}>
                  {risks.ewg.hazardScore && risks.ewg.hazardScore <= 2
                    ? 'Rating: A'
                    : risks.ewg.hazardScore && risks.ewg.hazardScore <= 4
                      ? 'Rating: B'
                      : risks.ewg.hazardScore && risks.ewg.hazardScore <= 6
                        ? 'Rating: C'
                        : risks.ewg.hazardScore && risks.ewg.hazardScore <= 8
                          ? 'Rating: D'
                          : 'Rating: F'}
                </Text>
              </View>
            </View>
          </View>
        )}

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
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    gap: 10,
  },
  riskItemContent: {
    flex: 1,
  },
  riskName: {
    fontSize: 15,
    fontWeight: '600',
  },
  riskGroup: {
    fontSize: 13,
    marginTop: 2,
  },
  moreText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  summary: {
    padding: 10,
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
