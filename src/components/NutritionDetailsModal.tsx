/**
 * Nutrition Details — canonical standalone look-through for governed H/M/L,
 * large-portion triggers, sodium context and per-serve explanation.
 * Reuses the existing in-app Modal pattern (InfoModal / NutritionBurnInfoModal).
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import type { ProductNutriments } from '../types/product';
import { getNutrientValue100g, resolveKcalPer100g } from '../utils/nutritionPer100g';
import { formatWeight } from '../utils/units';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  UK_GOV_FOP_MTL_REFERENCE,
  formatHighReason,
  type GovernedNutrientAssessment,
  type GovernedNutrientKey,
} from '../nutrition';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type NutritionDetailsFocusTarget = GovernedNutrientKey | null;

interface NutritionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  assessment: GovernedNutrientAssessment;
  nutriments: ProductNutriments;
  servingSize?: string;
  focusTarget?: NutritionDetailsFocusTarget;
}

function fmtG(n: number): string {
  return `${Number.isInteger(n) ? String(n) : n.toFixed(2)} g`;
}

function fmtMg(n: number): string {
  return `${Number.isInteger(n) ? String(Math.round(n)) : n.toFixed(1)} mg`;
}

export default function NutritionDetailsModal({
  visible,
  onClose,
  assessment,
  nutriments,
  servingSize,
  focusTarget = null,
}: NutritionDetailsModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { units } = useSettingsStore();
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Partial<Record<GovernedNutrientKey, number>>>({});

  useEffect(() => {
    if (!visible || !focusTarget) return;
    const y = sectionY.current[focusTarget];
    if (y != null) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
      });
    }
  }, [visible, focusTarget]);

  const showPerServe = assessment.serving.usable === true;
  const per100Label =
    assessment.per100Basis === '100ml'
      ? '100 mL'
      : assessment.per100Basis === '100g'
        ? '100 g'
        : '100 g/mL';

  const band =
    assessment.productClass === 'drink'
      ? UK_GOV_FOP_MTL_REFERENCE.thresholds.drink
      : UK_GOV_FOP_MTL_REFERENCE.thresholds.food;
  const portion =
    assessment.productClass === 'drink'
      ? UK_GOV_FOP_MTL_REFERENCE.largePortion.drink
      : UK_GOV_FOP_MTL_REFERENCE.largePortion.food;

  const servingLabel = assessment.serving.usable
    ? `${assessment.serving.quantity} ${assessment.serving.unit}`
    : servingSize || '';

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const levelLabel = (level: string) => {
    if (level === 'low') return t('nutrition.levelBadgeLow', 'Low');
    if (level === 'moderate') return t('nutrition.levelBadgeModerate', 'Moderate');
    if (level === 'high') return t('nutrition.levelBadgeHigh', 'High');
    return '—';
  };

  const rows: Array<{
    label: string;
    per100?: number;
    perServe?: number;
    unit: 'g' | 'mg' | 'kcal';
    level?: string;
    key: string;
  }> = [
    {
      key: 'energy',
      label: t('nutrition.energy'),
      per100: getNutrientValue100g(nutriments, 'energy-kcal') ?? resolveKcalPer100g(nutriments),
      perServe:
        showPerServe && assessment.serving.usable
          ? ((getNutrientValue100g(nutriments, 'energy-kcal') ?? resolveKcalPer100g(nutriments) ?? 0) *
              assessment.serving.quantity) /
            100
          : undefined,
      unit: 'kcal',
    },
    {
      key: 'fat',
      label: t('nutrition.fat'),
      per100: getNutrientValue100g(nutriments, 'fat'),
      perServe:
        showPerServe && assessment.serving.usable && getNutrientValue100g(nutriments, 'fat') !== undefined
          ? (getNutrientValue100g(nutriments, 'fat')! * assessment.serving.quantity) / 100
          : undefined,
      unit: 'g',
    },
    {
      key: 'saturatedFat',
      label: t('nutrition.saturatedFat'),
      per100: assessment.nutrients.saturatedFat.rawPer100,
      perServe: assessment.nutrients.saturatedFat.perServe,
      unit: 'g',
      level: assessment.nutrients.saturatedFat.level,
    },
    {
      key: 'carbs',
      label: t('nutrition.carbohydrates'),
      per100: getNutrientValue100g(nutriments, 'carbohydrates'),
      unit: 'g',
      perServe:
        showPerServe &&
        assessment.serving.usable &&
        getNutrientValue100g(nutriments, 'carbohydrates') !== undefined
          ? (getNutrientValue100g(nutriments, 'carbohydrates')! * assessment.serving.quantity) / 100
          : undefined,
    },
    {
      key: 'sugars',
      label: t('nutrition.sugars'),
      per100: assessment.nutrients.totalSugars.rawPer100,
      perServe: assessment.nutrients.totalSugars.perServe,
      unit: 'g',
      level: assessment.nutrients.totalSugars.level,
    },
    {
      key: 'fiber',
      label: t('nutrition.fiber'),
      per100: getNutrientValue100g(nutriments, 'fiber'),
      unit: 'g',
      perServe:
        showPerServe && assessment.serving.usable && getNutrientValue100g(nutriments, 'fiber') !== undefined
          ? (getNutrientValue100g(nutriments, 'fiber')! * assessment.serving.quantity) / 100
          : undefined,
    },
    {
      key: 'protein',
      label: t('nutrition.protein'),
      per100: getNutrientValue100g(nutriments, 'proteins'),
      unit: 'g',
      perServe:
        showPerServe &&
        assessment.serving.usable &&
        getNutrientValue100g(nutriments, 'proteins') !== undefined
          ? (getNutrientValue100g(nutriments, 'proteins')! * assessment.serving.quantity) / 100
          : undefined,
    },
    {
      key: 'sodium',
      label: t('nutrition.sodium'),
      per100: assessment.nutrients.sodium.rawPer100,
      perServe: assessment.nutrients.sodium.perServe,
      unit: 'mg',
      level: assessment.nutrients.sodium.level,
    },
  ];

  const formatCell = (value: number | undefined, unit: 'g' | 'mg' | 'kcal') => {
    if (value === undefined || !Number.isFinite(value)) return '—';
    if (unit === 'kcal') {
      return Number.isInteger(value) ? `${Math.round(value)} kcal` : `${value.toFixed(1)} kcal`;
    }
    if (unit === 'mg') return fmtMg(value);
    return formatWeight(value, units);
  };

  const sodiumServe = assessment.nutrients.sodium.perServe;
  const adultPercent =
    sodiumServe !== undefined && Number.isFinite(sodiumServe)
      ? Math.round((sodiumServe / UK_GOV_FOP_MTL_REFERENCE.intakeContext.adult_sodium_sdt_mg) * 100)
      : undefined;

  const nutrientSection = (
    key: GovernedNutrientKey,
    title: string,
    body: React.ReactNode
  ) => (
    <View
      key={key}
      nativeID={`nutrition-details-${key}`}
      onLayout={(e) => {
        sectionY.current[key] = e.nativeEvent.layout.y;
      }}
      style={[
        styles.section,
        focusTarget === key && { borderColor: colors.primary, borderWidth: 1.5, borderRadius: 10, padding: 10 },
      ]}
      accessibilityLabel={`${title} section`}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {body}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Ionicons name="nutrition-outline" size={24} color={colors.primary} style={styles.icon} />
              <Text style={[styles.title, { color: colors.text }]}>
                {t('nutrition.detailsTitle', 'Nutrition details')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.surface }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', 'Close')}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator
          >
            {/* Full table */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('result.nutritionFacts')}
            </Text>
            <View style={[styles.table, { borderColor: colors.border }]}>
              <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.th, styles.thLabel, { color: colors.textSecondary }]} />
                <Text style={[styles.th, { color: colors.textSecondary }]}>
                  {assessment.per100Basis === '100ml'
                    ? t('nutrition.per100ml', 'Per 100 mL')
                    : assessment.per100Basis === '100g'
                      ? t('nutrition.per100g', 'Per 100g')
                      : t('nutrition.per100gOrMl', 'Per 100 g/mL')}
                </Text>
                {showPerServe ? (
                  <Text style={[styles.th, { color: colors.textSecondary }]}>
                    {t('nutrition.perServe', 'Per serve')}
                  </Text>
                ) : null}
                <Text style={[styles.th, { color: colors.textSecondary }]}>{t('nutrition.level')}</Text>
              </View>
              {rows.map((row) => (
                <View key={row.key} style={[styles.tr, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.td, styles.tdLabel, { color: colors.text }]}>{row.label}</Text>
                  <Text style={[styles.td, { color: colors.text }]}>{formatCell(row.per100, row.unit)}</Text>
                  {showPerServe ? (
                    <Text style={[styles.td, { color: colors.text }]}>
                      {formatCell(row.perServe, row.unit)}
                    </Text>
                  ) : null}
                  <Text style={[styles.td, { color: colors.text }]}>
                    {row.level && row.level !== 'unavailable' ? levelLabel(row.level) : '—'}
                  </Text>
                </View>
              ))}
            </View>

            {/* How these ratings work — exact copy */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
              {t('nutrition.howRatingsWorkTitle', 'How these ratings work')}
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              These ratings compare saturated fat, total sugars and sodium with the UK Government’s
              front-of-pack traffic-light thresholds. They provide a consistent product-composition
              comparison; a large declared serving can also make a nutrient High. The ratings do not
              determine whether a food is healthy or unhealthy overall.
            </Text>

            <Text style={[styles.subhead, { color: colors.text }]}>Concentration</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Concentration — Is this food High under the standardised per-100 g or 100 mL test?
            </Text>
            <Text style={[styles.subhead, { color: colors.text }]}>Consumption context</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Consumption context — How much does the stated serve actually contribute to an
              appropriate daily intake or reference?
            </Text>

            {showPerServe ? (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
                  {t('nutrition.perServeContextTitle', 'Per serve context')}
                </Text>
                <Text style={[styles.body, { color: colors.textSecondary }]}>
                  Per serve shows the amount in the declared serving size when reliable serving
                  information is available. It puts the standardised per-100 comparison into everyday
                  consumption context.
                </Text>
              </>
            ) : null}

            {assessment.limitations.includes('preparation_basis_unclear') ||
            assessment.limitations.includes('per_serve_basis_unclear') ? (
              <Text style={[styles.body, { color: colors.textSecondary, marginTop: 12 }]}>
                The available nutrition information does not give us a reliable prepared or
                as-consumed basis for this comparison, so we have not estimated one.
              </Text>
            ) : null}

            {nutrientSection(
              'saturatedFat',
              t('nutrition.saturatedFat'),
              <>
                <Text style={[styles.body, { color: colors.textSecondary }]}>
                  Rating: {levelLabel(assessment.nutrients.saturatedFat.level)}
                </Text>
                {assessment.nutrients.saturatedFat.level === 'high' ? (
                  <Text style={[styles.body, { color: colors.textSecondary, marginTop: 6 }]}>
                    {formatHighReason({
                      nutrientLabel: 'Saturated fat',
                      item: assessment.nutrients.saturatedFat,
                      per100BasisLabel: per100Label,
                      highThresholdPer100: band.saturatedFat_g_per_100.highMinExclusive,
                      highThresholdPortion: portion.saturatedFat_g,
                      servingLabel,
                      formatValue: fmtG,
                    })}
                  </Text>
                ) : null}
                <Text style={[styles.body, { color: colors.textSecondary, marginTop: 8 }]}>
                  WHO recommends that saturated fat provide less than 10% of total energy for adults
                  and children aged 2 years and over. Because energy needs vary, we do not turn this
                  product’s grams into a universal daily percentage.
                </Text>
                <TouchableOpacity
                  onPress={() => openUrl(UK_GOV_FOP_MTL_REFERENCE.relatedSources.who_saturated_fat.url)}
                >
                  <Text style={[styles.link, { color: colors.primary }]}>
                    {UK_GOV_FOP_MTL_REFERENCE.relatedSources.who_saturated_fat.title}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {nutrientSection(
              'totalSugars',
              t('nutrition.sugars'),
              <>
                <Text style={[styles.body, { color: colors.textSecondary }]}>
                  Rating: {levelLabel(assessment.nutrients.totalSugars.level)}
                </Text>
                {assessment.nutrients.totalSugars.level === 'high' ? (
                  <Text style={[styles.body, { color: colors.textSecondary, marginTop: 6 }]}>
                    {formatHighReason({
                      nutrientLabel: 'Total sugars',
                      item: assessment.nutrients.totalSugars,
                      per100BasisLabel: per100Label,
                      highThresholdPer100: band.totalSugars_g_per_100.highMinExclusive,
                      highThresholdPortion: portion.totalSugars_g,
                      servingLabel,
                      formatValue: fmtG,
                    })}
                  </Text>
                ) : null}
                <Text style={[styles.body, { color: colors.textSecondary, marginTop: 8 }]}>
                  This table reports total sugars. WHO guidance is based on free sugars, so we do not
                  convert this total-sugars value into a WHO daily percentage.
                </Text>
                <TouchableOpacity
                  onPress={() => openUrl(UK_GOV_FOP_MTL_REFERENCE.relatedSources.who_free_sugars.url)}
                >
                  <Text style={[styles.link, { color: colors.primary }]}>
                    {UK_GOV_FOP_MTL_REFERENCE.relatedSources.who_free_sugars.title}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {nutrientSection(
              'sodium',
              t('nutrition.sodium'),
              <>
                <Text style={[styles.body, { color: colors.textSecondary }]}>
                  Rating: {levelLabel(assessment.nutrients.sodium.level)}
                  {assessment.nutrients.sodium.valueBasis === 'salt_derived'
                    ? ' (derived from salt)'
                    : ''}
                </Text>
                {assessment.nutrients.sodium.level === 'high' ? (
                  <Text style={[styles.body, { color: colors.textSecondary, marginTop: 6 }]}>
                    {formatHighReason({
                      nutrientLabel: 'Sodium',
                      item: assessment.nutrients.sodium,
                      per100BasisLabel: per100Label,
                      highThresholdPer100: band.sodium_mg_per_100.highMinExclusive,
                      highThresholdPortion: portion.sodium_mg,
                      servingLabel,
                      formatValue: fmtMg,
                    })}
                  </Text>
                ) : null}
                <Text style={[styles.body, { color: colors.textSecondary, marginTop: 8 }]}>
                  Australia and New Zealand nutrition panels report sodium. The UK traffic-light
                  method expresses its thresholds as salt, so we use the equivalent sodium amount
                  using salt = sodium × 2.5.
                </Text>
                {adultPercent !== undefined && sodiumServe !== undefined ? (
                  <Text style={[styles.body, { color: colors.textSecondary, marginTop: 8 }]}>
                    The current Australia/New Zealand adult Suggested Dietary Target for sodium is
                    2,000 mg a day. This serving provides {fmtMg(sodiumServe)}, or {adultPercent}% of
                    that amount. The target is population guidance, not a personal maximum.
                  </Text>
                ) : null}
                {assessment.nutrients.sodium.level === 'high' &&
                sodiumServe !== undefined &&
                Number.isFinite(sodiumServe) ? (
                  <Text style={[styles.body, { color: colors.textSecondary, marginTop: 8 }]}>
                    Children’s and teenagers’ sodium upper levels are age-specific. Current
                    Australia/New Zealand upper levels are 1,000 mg/day for ages 1–3, 1,400 mg/day for
                    ages 4–8, 2,000 mg/day for ages 9–13, and 2,300 mg/day for ages 14–18. These are
                    upper levels, not intake targets.
                  </Text>
                ) : null}
                <TouchableOpacity
                  onPress={() => openUrl(UK_GOV_FOP_MTL_REFERENCE.relatedSources.au_nz_nrv_sodium.url)}
                >
                  <Text style={[styles.link, { color: colors.primary }]}>
                    {UK_GOV_FOP_MTL_REFERENCE.relatedSources.au_nz_nrv_sodium.title}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openUrl(UK_GOV_FOP_MTL_REFERENCE.relatedSources.fsanz_nip_sodium.url)}
                >
                  <Text style={[styles.link, { color: colors.primary }]}>
                    {UK_GOV_FOP_MTL_REFERENCE.relatedSources.fsanz_nip_sodium.title}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
              {t('nutrition.sourcesMethodTitle', 'Sources & method')}
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Standard: {assessment.standardId}
            </Text>
            <TouchableOpacity onPress={() => openUrl(UK_GOV_FOP_MTL_REFERENCE.source.url)}>
              <Text style={[styles.link, { color: colors.primary }]}>
                {UK_GOV_FOP_MTL_REFERENCE.source.title}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.caption, { color: colors.textTertiary }]}>
              Open Food Facts may supply product nutrition data where applicable; it is not the
              H/M/L rating authority.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 520,
    maxHeight: SCREEN_HEIGHT * 0.88,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  icon: { marginRight: 8 },
  title: { fontSize: 18, fontWeight: '700', flexShrink: 1 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexGrow: 0 },
  contentContainer: { padding: 16, paddingBottom: 28 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  subhead: { fontSize: 14, fontWeight: '700', marginTop: 10, marginBottom: 4 },
  body: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12, lineHeight: 16, marginTop: 8 },
  link: { fontSize: 13, fontWeight: '600', marginTop: 6, textDecorationLine: 'underline' },
  section: { marginTop: 14 },
  table: { borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 6, paddingHorizontal: 6 },
  th: { flex: 1, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  thLabel: { flex: 1.2, textAlign: 'left' },
  tr: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 6, paddingHorizontal: 6 },
  td: { flex: 1, fontSize: 12, textAlign: 'right' },
  tdLabel: { flex: 1.2, textAlign: 'left', fontWeight: '500' },
});
