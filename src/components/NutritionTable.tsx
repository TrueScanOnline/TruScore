import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ProductNutriments, ProductNutrientLevels } from '../types/product';
import { useSettingsStore } from '../store/useSettingsStore';
import { formatWeight, formatVolume, formatServingSize } from '../utils/units';
import { useTheme } from '../theme';
import { getNutrientValue100g, toFiniteNumber, resolveKcalPer100g } from '../utils/nutritionPer100g';
import { resolveNutrientLevels } from '../utils/resolveNutrientLevels';
import { computeBurnMinutesFromKcal } from '../utils/nutritionBurnTime';
import NutritionBurnInfoModal from './NutritionBurnInfoModal';

export interface NutritionTableShareContext {
  productName: string;
  barcode?: string;
}

interface NutritionTableProps {
  nutriments?: ProductNutriments;
  nutrientLevels?: ProductNutrientLevels;
  /** For beverage traffic-light halving (OFF `en:beverages`); optional second-line resolver with nutriments. */
  categoriesTags?: string[];
  servingSize?: string;
  onShare?: () => void;
  onEdit?: () => void;
  shareContext?: NutritionTableShareContext;
  onRequestNutritionSharePrefill?: (prefill: string) => void;
}

const NutritionTable = React.memo(function NutritionTable({
  nutriments,
  nutrientLevels,
  categoriesTags,
  servingSize,
  onShare,
  onEdit,
  shareContext,
  onRequestNutritionSharePrefill,
}: NutritionTableProps) {
  const { t } = useTranslation();
  const { units } = useSettingsStore();
  const { colors } = useTheme();
  const [burnModalVisible, setBurnModalVisible] = useState(false);

  const kcalPer100g = useMemo(() => resolveKcalPer100g(nutriments), [nutriments]);
  const burnMinutes = useMemo(
    () => (kcalPer100g !== undefined ? computeBurnMinutesFromKcal(kcalPer100g) : null),
    [kcalPer100g]
  );
  const showBurnStrip = burnMinutes !== null && kcalPer100g !== undefined;

  /** UI second hook: same OFF-aligned merge as TruScore, so levels show even if upstream omitted them. */
  const effectiveNutrientLevels = useMemo(
    () => resolveNutrientLevels(nutriments, nutrientLevels, categoriesTags),
    [nutriments, nutrientLevels, categoriesTags]
  );

  const handleBurnSharePrefill = useCallback(
    (prefill: string) => {
      setBurnModalVisible(false);
      if (onRequestNutritionSharePrefill) {
        onRequestNutritionSharePrefill(prefill);
        return;
      }
      Share.share({ message: prefill }).catch(() => {});
    },
    [onRequestNutritionSharePrefill]
  );

  if (!nutriments) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card, borderWidth: 2, borderColor: '#16a085' }]}>
        <View style={styles.titleContainer}>
          <View style={styles.titleLeft}>
            <Ionicons name="nutrition" size={24} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text, marginLeft: 8 }]}>{t('result.nutritionFacts')}</Text>
          </View>
          <View style={styles.headerButtons}>
            {onEdit && (
              <TouchableOpacity
                onPress={onEdit}
                style={styles.editButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="create-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
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
        <Text style={[styles.noDataText, { color: colors.textTertiary }]}>{t('nutrition.notAvailable')}</Text>
      </View>
    );
  }

  const getLevelColor = (level?: string) => {
    if (level === 'low') return '#16a085';
    if (level === 'moderate') return '#ffd93d';
    if (level === 'high') return '#ff6b6b';
    return '#666';
  };

  /** Dot/border use traffic-light hues; moderate label uses a darker tone for contrast on light cards. */
  const getLevelLabelColor = (level?: string) => {
    if (level === 'moderate') return '#b8860b';
    return getLevelColor(level);
  };

  const formatValue = (value: unknown, unit = 'g') => {
    const numericValue = toFiniteNumber(value);
    if (numericValue === undefined) return '-';

    if (unit === 'g') {
      return formatWeight(numericValue, units);
    }
    if (unit === 'ml' || unit === 'L') {
      const mlValue = unit === 'L' ? numericValue * 1000 : numericValue;
      return formatVolume(mlValue, units);
    }
    if (unit === 'kcal') {
      // Non-breaking space keeps "value + unit" on one line in narrow columns
      const n = Number.isInteger(numericValue) ? String(Math.round(numericValue)) : numericValue.toFixed(1);
      return `${n}\u00A0kcal`;
    }
    return `${numericValue.toFixed(1)} ${unit}`;
  };

  const levelBadgeLabel = (level: 'low' | 'moderate' | 'high') => {
    if (level === 'low') return t('nutrition.levelBadgeLow');
    if (level === 'moderate') return t('nutrition.levelBadgeMed');
    return t('nutrition.levelBadgeHigh');
  };

  const getNutritionRows = () => [
    { label: t('nutrition.energy'), key: 'energy-kcal', unit: 'kcal', levelKey: undefined },
    { label: t('nutrition.fat'), key: 'fat', unit: 'g', levelKey: 'fat' },
    { label: t('nutrition.saturatedFat'), key: 'saturated-fat', unit: 'g', levelKey: 'saturated_fat' },
    { label: t('nutrition.carbohydrates'), key: 'carbohydrates', unit: 'g', levelKey: undefined },
    { label: t('nutrition.sugars'), key: 'sugars', unit: 'g', levelKey: 'sugars' },
    { label: t('nutrition.fiber'), key: 'fiber', unit: 'g', levelKey: undefined },
    { label: t('nutrition.protein'), key: 'proteins', unit: 'g', levelKey: undefined },
    { label: t('nutrition.salt'), key: 'salt', unit: 'g', levelKey: 'salt' },
  ];

  const nutritionRows = getNutritionRows();

  const hasHighNegativeNutrients =
    effectiveNutrientLevels.sugars === 'high' ||
    effectiveNutrientLevels.salt === 'high' ||
    effectiveNutrientLevels.saturated_fat === 'high';

  const borderColor = hasHighNegativeNutrients ? '#ff6b6b' : '#16a085';

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderWidth: 2, borderColor }]}>
      <View style={styles.titleContainer}>
        <View style={styles.titleLeft}>
          <Ionicons name="nutrition" size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text, marginLeft: 8 }]}>{t('result.nutritionFacts')}</Text>
        </View>
        <View style={styles.headerButtons}>
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              style={styles.editButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
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
      {servingSize && (
        <Text style={[styles.servingSize, { color: colors.textSecondary }]}>
          {t('result.servingSize')}: {formatServingSize(servingSize, units)}
        </Text>
      )}

      <View style={[styles.table, { borderTopColor: colors.border }]}>
        <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLabelCol} />
          <Text style={[styles.headerText, styles.headerValueCol, { color: colors.textSecondary }]}>
            {t('nutrition.per100g')}
          </Text>
          <Text style={[styles.headerText, styles.headerLevelCol, { color: colors.textSecondary }]}>
            {t('nutrition.level')}
          </Text>
        </View>

        {nutritionRows.map((row) => {
          const value =
            row.key === 'energy-kcal'
              ? (getNutrientValue100g(nutriments, 'energy-kcal') ?? resolveKcalPer100g(nutriments))
              : getNutrientValue100g(nutriments, row.key);
          const level = row.levelKey
            ? effectiveNutrientLevels[row.levelKey as keyof ProductNutrientLevels]
            : undefined;
          const levelColor = getLevelColor(level);
          const levelLabelColor = getLevelLabelColor(level);

          return (
            <View key={row.key} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <View style={styles.labelCell}>
                <Text
                  style={[styles.labelText, { color: colors.text }]}
                  {...(Platform.OS === 'android' ? { textBreakStrategy: 'highQuality' as const } : {})}
                  {...(Platform.OS === 'ios' ? { lineBreakStrategyIOS: 'standard' as const } : {})}
                >
                  {row.label}
                </Text>
              </View>
              <View style={styles.valueCell}>
                <Text
                  style={[styles.valueText, { color: colors.text }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit={row.unit === 'kcal'}
                  minimumFontScale={row.unit === 'kcal' ? 0.82 : 1}
                >
                  {formatValue(value, row.unit)}
                </Text>
              </View>
              <View style={styles.levelCell}>
                {level ? (
                  <View
                    style={[
                      styles.levelBadge,
                      {
                        backgroundColor: colors.surface,
                        borderColor: levelColor,
                      },
                    ]}
                    accessibilityRole="text"
                    accessibilityLabel={`${row.label}: ${levelBadgeLabel(level)}`}
                  >
                    <View style={[styles.levelDot, { backgroundColor: levelColor }]} />
                    <Text style={[styles.levelBadgeText, { color: levelLabelColor }]} numberOfLines={1}>
                      {levelBadgeLabel(level)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.levelPlaceholder} />
                )}
              </View>
            </View>
          );
        })}
      </View>

      {showBurnStrip && burnMinutes && (
        <View
          style={[styles.burnStrip, { backgroundColor: colors.surface, borderColor: colors.border }]}
          accessibilityRole="summary"
          accessibilityLabel={t('nutrition.burnStripA11y', {
            walk: burnMinutes.walking,
            run: burnMinutes.running,
            cycle: burnMinutes.cycling,
          })}
        >
          <View style={styles.burnStripHeader}>
            <Ionicons name="flame" size={20} color={colors.primary} accessibilityIgnoresInvertColors />
            <Text style={[styles.burnStripTitle, { color: colors.text }]}>{t('nutrition.burnStripTitle')}</Text>
          </View>
          <Text style={[styles.burnStripSubtitle, { color: colors.textSecondary }]}>
            {t('nutrition.burnStripSubtitle')}
          </Text>
          <View style={styles.burnIconsRow}>
            <View style={styles.burnChip}>
              <Ionicons name="walk-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.burnChipText, { color: colors.text }]}>
                {t('nutrition.burnWalkShort', { min: burnMinutes.walking })}
              </Text>
            </View>
            <View style={styles.burnChip}>
              <Ionicons name="fitness-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.burnChipText, { color: colors.text }]}>
                {t('nutrition.burnRunShort', { min: burnMinutes.running })}
              </Text>
            </View>
            <View style={styles.burnChip}>
              <Ionicons name="bicycle-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.burnChipText, { color: colors.text }]}>
                {t('nutrition.burnCycleShort', { min: burnMinutes.cycling })}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setBurnModalVisible(true)}
            style={styles.learnMoreButton}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={t('nutrition.burnLearnMore')}
          >
            <Text style={[styles.learnMoreText, { color: colors.primary }]}>{t('nutrition.burnLearnMore')}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {showBurnStrip && burnMinutes && kcalPer100g !== undefined && (
        <NutritionBurnInfoModal
          visible={burnModalVisible}
          onClose={() => setBurnModalVisible(false)}
          kcalPer100g={kcalPer100g}
          burn={burnMinutes}
          productName={shareContext?.productName}
          onSharePrefill={handleBurnSharePrefill}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editButton: {
    padding: 4,
  },
  shareButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  servingSize: {
    fontSize: 14,
    marginBottom: 16,
  },
  table: {
    borderTopWidth: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  /**
   * Header mirrors row layout: label takes remaining width; value + level use fixed
   * widths so nutrient names are never squeezed by proportional flex when badges appear.
   */
  headerLabelCol: {
    flex: 1,
    minWidth: 0,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  headerValueCol: {
    width: 100,
    flexBasis: 100,
    flexGrow: 0,
    flexShrink: 0,
    textAlign: 'right',
    paddingLeft: 4,
  },
  headerLevelCol: {
    width: 60,
    flexBasis: 60,
    flexGrow: 0,
    flexShrink: 0,
    textAlign: 'right',
    paddingLeft: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
    minHeight: 44,
  },
  labelCell: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  valueCell: {
    width: 100,
    flexBasis: 100,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '100%',
  },
  levelCell: {
    width: 60,
    flexBasis: 60,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    maxWidth: '100%',
  },
  levelDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  levelPlaceholder: {
    minWidth: 1,
    minHeight: 1,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  burnStrip: {
    marginTop: 16,
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  burnStripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  burnStripTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  burnStripSubtitle: {
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  burnIconsRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
    marginBottom: 8,
  },
  burnChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  burnChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    paddingVertical: 6,
  },
  learnMoreText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default NutritionTable;
