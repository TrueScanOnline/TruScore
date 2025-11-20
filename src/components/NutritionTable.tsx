import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProductNutriments, ProductNutrientLevels } from '../types/product';
import { useSettingsStore } from '../store/useSettingsStore';
import { formatWeight, formatVolume, formatServingSize } from '../utils/units';
import { useTheme } from '../theme';

interface NutritionTableProps {
  nutriments?: ProductNutriments;
  nutrientLevels?: ProductNutrientLevels;
  servingSize?: string;
}

export default function NutritionTable({
  nutriments,
  nutrientLevels,
  servingSize,
}: NutritionTableProps) {
  const { t } = useTranslation();
  const { units } = useSettingsStore();
  const { colors } = useTheme();

  if (!nutriments) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
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

  const formatValue = (value?: number, unit = 'g') => {
    if (value === undefined || value === null || isNaN(value)) return '-';
    
    // Convert units based on settings
    if (unit === 'g') {
      return formatWeight(value, units);
    }
    if (unit === 'ml' || unit === 'L') {
      const mlValue = unit === 'L' ? value * 1000 : value;
      return formatVolume(mlValue, units);
    }
    // For other units (kcal, etc.), keep original format
    return `${value.toFixed(1)} ${unit}`;
  };

  const getValue100g = (key: string) => {
    const value100g = nutriments?.[`${key}_100g` as keyof ProductNutriments] as number | undefined;
    const value = nutriments?.[key as keyof ProductNutriments] as number | undefined;
    return value100g ?? value;
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

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('result.nutritionFacts')}</Text>
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
}

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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
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

