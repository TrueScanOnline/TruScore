import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ProductNutriments } from '../types/product';
import { useSettingsStore } from '../store/useSettingsStore';
import { formatWeight, formatVolume, formatServingSize } from '../utils/units';
import { useTheme } from '../theme';
import { getNutrientValue100g, toFiniteNumber, resolveKcalPer100g } from '../utils/nutritionPer100g';
import {
  assessGovernedNutrients,
  hasGovernedHighNutrient,
  type GovernedNutrientAssessment,
  type GovernedNutrientKey,
  type GovernedNutrientLevel,
} from '../nutrition';
import { computeBurnMinutesFromKcal } from '../utils/nutritionBurnTime';
import NutritionBurnInfoModal from './NutritionBurnInfoModal';
import NutritionDetailsModal, { type NutritionDetailsFocusTarget } from './NutritionDetailsModal';

export interface NutritionTableShareContext {
  productName: string;
  barcode?: string;
}

interface NutritionTableProps {
  nutriments?: ProductNutriments;
  /** Ignored for ratings — retained for call-site compatibility. Raw OFF levels are not authority. */
  nutrientLevels?: unknown;
  categoriesTags?: string[];
  servingSize?: string;
  /** Identity / quantity evidence for the accepted v0.2 Food/Drink determinant. */
  productName?: string;
  genericName?: string;
  quantity?: string;
  productQuantity?: number;
  productQuantityUnit?: string;
  servingQuantity?: number;
  servingQuantityUnit?: string;
  nutritionDataPer?: string;
  nutritionDataPreparedPer?: string;
  onShare?: () => void;
  onEdit?: () => void;
  shareContext?: NutritionTableShareContext;
  onRequestNutritionSharePrefill?: (prefill: string) => void;
  cardFooter?: React.ReactNode;
  /** Optional external control of Nutrition Details visibility. */
  detailsVisible?: boolean;
  onDetailsVisibleChange?: (visible: boolean) => void;
  initialDetailsFocus?: NutritionDetailsFocusTarget | null;
}

const NutritionTable = React.memo(function NutritionTable({
  nutriments,
  categoriesTags,
  servingSize,
  productName,
  genericName,
  quantity,
  productQuantity,
  productQuantityUnit,
  servingQuantity,
  servingQuantityUnit,
  nutritionDataPer,
  nutritionDataPreparedPer,
  onShare,
  onEdit,
  shareContext,
  onRequestNutritionSharePrefill,
  cardFooter,
  detailsVisible: detailsVisibleProp,
  onDetailsVisibleChange,
  initialDetailsFocus = null,
}: NutritionTableProps) {
  const { t } = useTranslation();
  const { units } = useSettingsStore();
  const { colors } = useTheme();
  const [burnModalVisible, setBurnModalVisible] = useState(false);
  const [internalDetailsVisible, setInternalDetailsVisible] = useState(false);
  const [detailsFocus, setDetailsFocus] = useState<NutritionDetailsFocusTarget | null>(
    initialDetailsFocus
  );

  useEffect(() => {
    if (initialDetailsFocus != null) {
      setDetailsFocus(initialDetailsFocus);
    }
  }, [initialDetailsFocus]);

  const detailsVisible = detailsVisibleProp ?? internalDetailsVisible;
  const setDetailsVisible = useCallback(
    (visible: boolean) => {
      if (onDetailsVisibleChange) onDetailsVisibleChange(visible);
      else setInternalDetailsVisible(visible);
    },
    [onDetailsVisibleChange]
  );

  const assessment: GovernedNutrientAssessment = useMemo(
    () =>
      assessGovernedNutrients({
        nutriments,
        categoriesTags,
        servingSize,
        productName,
        genericName,
        quantity,
        productQuantity,
        productQuantityUnit,
        servingQuantity,
        servingQuantityUnit,
        nutritionDataPer,
        nutritionDataPreparedPer,
      }),
    [
      nutriments,
      categoriesTags,
      servingSize,
      productName,
      genericName,
      quantity,
      productQuantity,
      productQuantityUnit,
      servingQuantity,
      servingQuantityUnit,
      nutritionDataPer,
      nutritionDataPreparedPer,
    ]
  );

  // UAT corrective C1: Per serve is Details-only; primary card is Nutrient | Per 100 | Level.
  const showPerServe = false;
  const kcalPer100g = useMemo(() => resolveKcalPer100g(nutriments), [nutriments]);
  const burnMinutes = useMemo(
    () => (kcalPer100g !== undefined ? computeBurnMinutesFromKcal(kcalPer100g) : null),
    [kcalPer100g]
  );
  const showBurnStrip = burnMinutes !== null && kcalPer100g !== undefined;

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

  const openDetails = useCallback(
    (focus: NutritionDetailsFocusTarget | null = null) => {
      setDetailsFocus(focus);
      setDetailsVisible(true);
    },
    [setDetailsVisible]
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
                accessibilityRole="button"
                accessibilityLabel={t(
                  'nutrition.contributeA11y',
                  'Contribute or correct nutrition information'
                )}
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
        {cardFooter}
      </View>
    );
  }

  const getLevelColor = (level?: GovernedNutrientLevel | string) => {
    if (level === 'low') return '#16a085';
    if (level === 'moderate') return '#ffd93d';
    if (level === 'high') return '#ff6b6b';
    return '#666';
  };

  const getLevelLabelColor = (level?: GovernedNutrientLevel | string) => {
    if (level === 'moderate') return '#b8860b';
    return getLevelColor(level);
  };

  const formatValue = (value: unknown, unit = 'g') => {
    const numericValue = toFiniteNumber(value);
    if (numericValue === undefined) return '-';

    if (unit === 'g') {
      return formatWeight(numericValue, units);
    }
    if (unit === 'mg') {
      const n = Number.isInteger(numericValue) ? String(Math.round(numericValue)) : numericValue.toFixed(1);
      return `${n}\u00A0mg`;
    }
    if (unit === 'ml' || unit === 'L') {
      const mlValue = unit === 'L' ? numericValue * 1000 : numericValue;
      return formatVolume(mlValue, units);
    }
    if (unit === 'kcal') {
      const n = Number.isInteger(numericValue) ? String(Math.round(numericValue)) : numericValue.toFixed(1);
      return `${n}\u00A0kcal`;
    }
    return `${numericValue.toFixed(1)} ${unit}`;
  };

  const levelBadgeLabel = (level: 'low' | 'moderate' | 'high') => {
    if (level === 'low') return t('nutrition.levelBadgeLow', 'Low');
    if (level === 'moderate') return t('nutrition.levelBadgeModerate', 'Moderate');
    return t('nutrition.levelBadgeHigh', 'High');
  };

  const per100Header =
    assessment.per100Basis === '100ml'
      ? t('nutrition.per100ml', 'Per 100 mL')
      : assessment.per100Basis === '100g'
        ? t('nutrition.per100g', 'Per 100g')
        : t('nutrition.per100gOrMl', 'Per 100 g/mL');

  type RowDef = {
    label: string;
    key: string;
    unit: string;
    governedKey?: GovernedNutrientKey;
  };

  const nutritionRows: RowDef[] = [
    { label: t('nutrition.energy'), key: 'energy-kcal', unit: 'kcal' },
    { label: t('nutrition.fat'), key: 'fat', unit: 'g' },
    {
      label: t('nutrition.saturatedFat'),
      key: 'saturated-fat',
      unit: 'g',
      governedKey: 'saturatedFat',
    },
    { label: t('nutrition.carbohydrates'), key: 'carbohydrates', unit: 'g' },
    {
      label: t('nutrition.sugars'),
      key: 'sugars',
      unit: 'g',
      governedKey: 'totalSugars',
    },
    { label: t('nutrition.fiber'), key: 'fiber', unit: 'g' },
    { label: t('nutrition.protein'), key: 'proteins', unit: 'g' },
    {
      label: t('nutrition.sodium'),
      key: 'sodium',
      unit: 'mg',
      governedKey: 'sodium',
    },
  ];

  const borderColor = hasGovernedHighNutrient(assessment) ? '#ff6b6b' : '#16a085';

  const perServeForRow = (row: RowDef): number | undefined => {
    if (!showPerServe || !assessment.serving.usable) return undefined;
    if (row.governedKey) {
      return assessment.nutrients[row.governedKey].perServe;
    }
    const per100 =
      row.key === 'energy-kcal'
        ? (getNutrientValue100g(nutriments, 'energy-kcal') ?? resolveKcalPer100g(nutriments))
        : row.key === 'sodium'
          ? assessment.nutrients.sodium.rawPer100
          : getNutrientValue100g(nutriments, row.key);
    if (per100 === undefined) return undefined;
    return (per100 * assessment.serving.quantity) / 100;
  };

  const per100ForRow = (row: RowDef): number | undefined => {
    if (row.governedKey === 'sodium') return assessment.nutrients.sodium.rawPer100;
    if (row.governedKey === 'saturatedFat') return assessment.nutrients.saturatedFat.rawPer100;
    if (row.governedKey === 'totalSugars') return assessment.nutrients.totalSugars.rawPer100;
    if (row.key === 'energy-kcal') {
      return getNutrientValue100g(nutriments, 'energy-kcal') ?? resolveKcalPer100g(nutriments);
    }
    return getNutrientValue100g(nutriments, row.key);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderWidth: 2, borderColor }]}>
      <View style={styles.titleContainer}>
        <Pressable
          onPress={() => openDetails(null)}
          style={styles.titleLeft}
          accessibilityRole="button"
          accessibilityLabel={t('nutrition.openDetailsA11y', 'Open nutrition details')}
        >
          <Ionicons name="nutrition" size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text, marginLeft: 8 }]}>{t('result.nutritionFacts')}</Text>
        </Pressable>
        <View style={styles.headerButtons}>
          {onEdit && (
            <TouchableOpacity
              onPress={onEdit}
              style={styles.editButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t(
                'nutrition.contributeA11y',
                'Contribute or correct nutrition information'
              )}
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

      <Pressable
        onPress={() => openDetails(null)}
        accessibilityRole="button"
        accessibilityLabel={t('nutrition.openDetailsA11y', 'Open nutrition details')}
      >
        {servingSize ? (
          <Text style={[styles.servingSize, { color: colors.textSecondary }]}>
            {t('result.servingSize')}: {formatServingSize(servingSize, units)}
          </Text>
        ) : null}

        <View style={[styles.table, { borderTopColor: colors.border }]}>
          <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLabelCol} />
            <Text
              style={[
                styles.headerText,
                showPerServe ? styles.headerValueColCompact : styles.headerValueCol,
                { color: colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {per100Header}
            </Text>
            {showPerServe ? (
              <Text
                style={[styles.headerText, styles.headerServeCol, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {t('nutrition.perServe', 'Per serve')}
              </Text>
            ) : null}
            <Text style={[styles.headerText, styles.headerLevelCol, { color: colors.textSecondary }]}>
              {t('nutrition.level')}
            </Text>
          </View>

          {nutritionRows.map((row) => {
            const value = per100ForRow(row);
            const serveValue = perServeForRow(row);
            const governed = row.governedKey ? assessment.nutrients[row.governedKey] : undefined;
            const level =
              governed && governed.level !== 'unavailable' ? governed.level : undefined;
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
                <View style={showPerServe ? styles.valueCellCompact : styles.valueCell}>
                  <Text
                    style={[styles.valueText, { color: colors.text }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={row.unit === 'kcal' || row.unit === 'mg'}
                    minimumFontScale={0.75}
                  >
                    {formatValue(value, row.unit)}
                  </Text>
                </View>
                {showPerServe ? (
                  <View style={styles.serveCell}>
                    <Text
                      style={[styles.valueText, { color: colors.text }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {formatValue(serveValue, row.unit)}
                    </Text>
                  </View>
                ) : null}
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
      </Pressable>

      {cardFooter}

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

      <NutritionDetailsModal
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        assessment={assessment}
        nutriments={nutriments}
        servingSize={servingSize}
        focusTarget={detailsFocus}
      />
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
  headerLabelCol: {
    flex: 1,
    minWidth: 0,
  },
  headerText: {
    fontSize: 12,
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
  headerValueColCompact: {
    width: 72,
    flexBasis: 72,
    flexGrow: 0,
    flexShrink: 0,
    textAlign: 'right',
    paddingLeft: 2,
  },
  headerServeCol: {
    width: 72,
    flexBasis: 72,
    flexGrow: 0,
    flexShrink: 0,
    textAlign: 'right',
    paddingLeft: 2,
  },
  headerLevelCol: {
    width: 78,
    flexBasis: 78,
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
    paddingRight: 6,
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 13,
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
  valueCellCompact: {
    width: 72,
    flexBasis: 72,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  serveCell: {
    width: 72,
    flexBasis: 72,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: '100%',
  },
  levelCell: {
    width: 78,
    flexBasis: 78,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 5,
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
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.1,
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
