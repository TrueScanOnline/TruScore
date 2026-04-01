import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ProductNutriments, ProductNutrientLevels } from '../types/product';
import { useSettingsStore } from '../store/useSettingsStore';
import { formatWeight, formatVolume, formatServingSize } from '../utils/units';
import { useTheme } from '../theme';

interface NutritionTableProps {
  nutriments?: ProductNutriments;
  nutrientLevels?: ProductNutrientLevels;
  servingSize?: string;
  onShare?: () => void;
  onEdit?: () => void;
}

const NutritionTable = React.memo(function NutritionTable({
  nutriments,
  nutrientLevels,
  servingSize,
  onShare,
  onEdit,
}: NutritionTableProps) {
  const { t } = useTranslation();
  const { units } = useSettingsStore();
  const { colors } = useTheme();

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

  const getLevelIcon = (level?: string) => {
    if (level === 'low') return '✓';
    if (level === 'moderate') return '○';
    if (level === 'high') return '!';
    return '';
  };

  const toFiniteNumber = (value: unknown): number | undefined => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    if (typeof value === 'string') {
      const normalized = value.replace(',', '.').trim();
      if (!normalized) return undefined;
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  };

  const formatValue = (value: unknown, unit = 'g') => {
    const numericValue = toFiniteNumber(value);
    if (numericValue === undefined) return '-';
    
    // Convert units based on settings
    if (unit === 'g') {
      return formatWeight(numericValue, units);
    }
    if (unit === 'ml' || unit === 'L') {
      const mlValue = unit === 'L' ? numericValue * 1000 : numericValue;
      return formatVolume(mlValue, units);
    }
    // For other units (kcal, etc.), keep original format
    return `${numericValue.toFixed(1)} ${unit}`;
  };

  const getValue100g = (key: string) => {
    // Accept both OFF-style hyphen keys and source-specific underscore keys.
    const canonical100g = `${key}_100g`;
    const underscoreKey = key.replace(/-/g, '_');
    const underscore100g = `${underscoreKey}_100g`;
    const singularProteinKey = key === 'proteins' ? 'protein' : key;
    const singularProtein100g = `${singularProteinKey}_100g`;

    const candidates = [
      canonical100g,
      key,
      underscore100g,
      underscoreKey,
      singularProtein100g,
      singularProteinKey,
    ];

    for (const candidate of candidates) {
      const rawValue = nutriments?.[candidate as keyof ProductNutriments] as unknown;
      const numericValue = toFiniteNumber(rawValue);
      if (numericValue !== undefined) {
        return numericValue;
      }
    }

    return undefined;
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

  // Determine border color based on nutrient levels
  // Red if high levels of negative nutrients (sugar, salt, saturated fat)
  const hasHighNegativeNutrients = 
    nutrientLevels?.sugars === 'high' ||
    nutrientLevels?.salt === 'high' ||
    nutrientLevels?.saturated_fat === 'high';
  
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
          <View style={styles.headerSpacer} />
          <Text style={[styles.headerText, styles.headerTextValue, { color: colors.textSecondary }]}>{t('nutrition.per100g')}</Text>
          <Text style={[styles.headerText, styles.headerTextLevel, { color: colors.textSecondary }]}>{t('nutrition.level')}</Text>
        </View>

        {nutritionRows.map((row) => {
          const value = getValue100g(row.key);
          const level = row.levelKey ? nutrientLevels?.[row.levelKey as keyof ProductNutrientLevels] : undefined;
          const levelColor = getLevelColor(level);
          const levelIcon = getLevelIcon(level);

          return (
            <View key={row.key} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <View style={styles.labelCell}>
                <Text style={[styles.labelText, { color: colors.text }]}>{row.label}</Text>
              </View>
              <View style={styles.valueCell}>
                <Text style={[styles.valueText, { color: colors.text }]}>
                  {formatValue(value, row.unit)}
                </Text>
              </View>
              <View style={styles.levelCell}>
              {level && (
                <Text style={[styles.levelText, { color: levelColor }]}>
                  {levelIcon} {t(`nutrition.${level}`)}
                </Text>
              )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
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
  headerSpacer: {
    flex: 2,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerTextValue: {
    flex: 1,
    textAlign: 'right',
  },
  headerTextLevel: {
    flex: 1,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  labelCell: {
    flex: 2,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  valueCell: {
    flex: 1,
    alignItems: 'flex-end',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
  },
  levelCell: {
    flex: 1,
    alignItems: 'flex-end',
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
});

export default NutritionTable;

