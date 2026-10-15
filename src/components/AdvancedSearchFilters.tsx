import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { resultEmeraldTone, resultPresentation } from '../theme/resultPresentation';
import {
  SearchFilters,
  DEFAULT_SEARCH_FILTERS,
  hasActiveSearchFilters,
} from '../utils/searchFilterUtils';

export type { SearchFilters } from '../utils/searchFilterUtils';

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClose: () => void;
  canUseAdvancedSearch: boolean;
  onRequestUpgrade: () => void;
}

function parseTrustInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '');
  if (digits === '') return null;
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, n));
}

export default function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  onClose,
  canUseAdvancedSearch,
  onRequestUpgrade,
}: AdvancedSearchFiltersProps) {
  const { t } = useTranslation();
  const { colors, darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);
  const page = resultPresentation.canvas[darkMode ? 'dark' : 'light'];

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleCertification = (certId: string) => {
    const current = filters.certification || [];
    const updated = current.includes(certId)
      ? current.filter((id) => id !== certId)
      : [...current, certId];
    updateFilter('certification', updated);
  };

  const resetFilters = () => {
    onFiltersChange({ ...DEFAULT_SEARCH_FILTERS });
  };

  const active = hasActiveSearchFilters(filters);

  return (
    <View style={[styles.container, { backgroundColor: page }]}>
      <View style={[styles.header, { backgroundColor: emerald.card, borderBottomColor: emerald.line }]}>
        <View style={styles.headerTextBlock}>
          <Text style={[styles.headerTitle, { color: emerald.ink }]}>{t('search.advancedFilters')}</Text>
          {!canUseAdvancedSearch && (
            <Text style={[styles.headerHint, { color: emerald.muted }]}>{t('search.teaser.modalHint')}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        >
          <Ionicons name="close" size={24} color={emerald.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!canUseAdvancedSearch && (
          <TouchableOpacity
            style={[styles.unlockBanner, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '44' }]}
            onPress={onRequestUpgrade}
            accessibilityRole="button"
          >
            <Ionicons name="star" size={20} color={emerald.action} />
            <Text style={[styles.unlockBannerText, { color: colors.primary }]}>{t('search.teaser.unlockBanner')}</Text>
            <Ionicons name="chevron-forward" size={18} color={emerald.action} />
          </TouchableOpacity>
        )}

        {/* TruScore */}
        <View style={[styles.section, { backgroundColor: emerald.card, borderColor: emerald.line }]}>
          <Text style={[styles.sectionTitle, { color: emerald.ink }]}>{t('result.trustScore')}</Text>
          <View style={styles.rangeContainer}>
            <View style={styles.trustInputCol}>
              <Text style={[styles.rangeLabel, { color: emerald.muted }]}>{t('search.min')}</Text>
              <TextInput
                style={[
                  styles.trustInput,
                  { color: emerald.ink, borderColor: emerald.line, backgroundColor: page },
                ]}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="—"
                placeholderTextColor={emerald.muted}
                value={filters.trustScoreMin != null ? String(filters.trustScoreMin) : ''}
                onChangeText={(txt) => updateFilter('trustScoreMin', parseTrustInput(txt))}
              />
            </View>
            <Text style={[styles.rangeSeparator, { color: emerald.muted }]}>–</Text>
            <View style={styles.trustInputCol}>
              <Text style={[styles.rangeLabel, { color: emerald.muted }]}>{t('search.max')}</Text>
              <TextInput
                style={[
                  styles.trustInput,
                  { color: emerald.ink, borderColor: emerald.line, backgroundColor: page },
                ]}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="—"
                placeholderTextColor={emerald.muted}
                value={filters.trustScoreMax != null ? String(filters.trustScoreMax) : ''}
                onChangeText={(txt) => updateFilter('trustScoreMax', parseTrustInput(txt))}
              />
            </View>
          </View>
        </View>

        {/* Nutri-Score */}
        <View style={[styles.section, { backgroundColor: emerald.card, borderColor: emerald.line }]}>
          <Text style={[styles.sectionTitle, { color: emerald.ink }]}>{t('search.nutriscoreTitle')}</Text>
          <View style={styles.gradeContainer}>
            {(['a', 'b', 'c', 'd', 'e'] as const).map((grade) => (
              <TouchableOpacity
                key={grade}
                style={[
                  styles.gradeButton,
                  {
                    backgroundColor:
                      filters.nutriscoreGrade === grade ? colors.primary : page,
                    borderColor: filters.nutriscoreGrade === grade ? colors.primary : emerald.line,
                  },
                ]}
                onPress={() =>
                  updateFilter('nutriscoreGrade', filters.nutriscoreGrade === grade ? null : grade)
                }
              >
                <Text
                  style={[
                    styles.gradeText,
                    {
                      color: filters.nutriscoreGrade === grade ? '#fff' : emerald.ink,
                      fontWeight: filters.nutriscoreGrade === grade ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {grade.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Eco-Score */}
        <View style={[styles.section, { backgroundColor: emerald.card, borderColor: emerald.line }]}>
          <Text style={[styles.sectionTitle, { color: emerald.ink }]}>{t('ecoscore.title')}</Text>
          <View style={styles.gradeContainer}>
            {(['a', 'b', 'c', 'd', 'e'] as const).map((grade) => (
              <TouchableOpacity
                key={grade}
                style={[
                  styles.gradeButton,
                  {
                    backgroundColor:
                      filters.ecoscoreGrade === grade ? colors.primary : page,
                    borderColor: filters.ecoscoreGrade === grade ? colors.primary : emerald.line,
                  },
                ]}
                onPress={() =>
                  updateFilter('ecoscoreGrade', filters.ecoscoreGrade === grade ? null : grade)
                }
              >
                <Text
                  style={[
                    styles.gradeText,
                    {
                      color: filters.ecoscoreGrade === grade ? '#fff' : emerald.ink,
                      fontWeight: filters.ecoscoreGrade === grade ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {grade.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Country tag (OFF-style e.g. en:nz) */}
        <View style={[styles.section, { backgroundColor: emerald.card, borderColor: emerald.line }]}>
          <Text style={[styles.sectionTitle, { color: emerald.ink }]}>{t('search.countryFilter')}</Text>
          <Text style={[styles.sectionDescription, { color: emerald.muted }]}>
            {t('search.countryFilterHint')}
          </Text>
          <TextInput
            style={[
              styles.countryInput,
              { color: emerald.ink, borderColor: emerald.line, backgroundColor: page },
            ]}
            placeholder={t('search.countryPlaceholder')}
            placeholderTextColor={emerald.muted}
            autoCapitalize="none"
            value={filters.country || ''}
            onChangeText={(txt) => updateFilter('country', txt.trim() === '' ? null : txt.trim())}
          />
        </View>

        {/* Quick diet */}
        <View style={[styles.section, { backgroundColor: emerald.card, borderColor: emerald.line }]}>
          <Text style={[styles.sectionTitle, { color: emerald.ink }]}>{t('search.quickFilters')}</Text>
          {(
            [
              ['leaf', 'vegan', filters.vegan, () => updateFilter('vegan', !filters.vegan)] as const,
              ['flower', 'organic', filters.organic, () => updateFilter('organic', !filters.organic)] as const,
              ['location', 'local', filters.local, () => updateFilter('local', !filters.local)] as const,
              ['warning', 'allergenFree', filters.allergenFree, () => updateFilter('allergenFree', !filters.allergenFree)] as const,
              [
                'nutrition',
                'glutenFree',
                filters.glutenFree,
                () => updateFilter('glutenFree', !filters.glutenFree),
              ] as const,
              ['water', 'dairyFree', filters.dairyFree, () => updateFilter('dairyFree', !filters.dairyFree)] as const,
              [
                'leaf-outline',
                'palmOilFree',
                filters.palmOilFree,
                () => updateFilter('palmOilFree', !filters.palmOilFree),
              ] as const,
            ] as const
          ).map(([icon, labelKey, value, onToggle]) => (
            <View key={labelKey} style={[styles.switchRow, { borderBottomColor: emerald.line + '33' }]}>
              <View style={styles.switchContent}>
                <Ionicons name={icon as any} size={20} color={emerald.action} />
                <Text style={[styles.switchLabel, { color: emerald.ink }]}>
                  {t(`search.filterLabels.${labelKey}`)}
                </Text>
              </View>
              <Switch
                trackColor={{ false: emerald.line, true: emerald.action }}
                thumbColor={emerald.card}
                ios_backgroundColor={emerald.line}
                value={value}
                onValueChange={onToggle}
                accessibilityLabel={t(`search.filterLabels.${labelKey}`)}
              />
            </View>
          ))}
        </View>

        {/* My products */}
        <View style={[styles.section, { backgroundColor: emerald.card, borderColor: emerald.line }]}>
          <Text style={[styles.sectionTitle, { color: emerald.ink }]}>{t('search.myProductsSection')}</Text>
          <View style={[styles.switchRow, { borderBottomColor: emerald.line + '33' }]}>
            <View style={styles.switchContent}>
              <Ionicons name="time-outline" size={20} color={emerald.action} />
              <Text style={[styles.switchLabel, { color: emerald.ink }]}>
                {t('search.filterLabels.previouslyScannedOnly')}
              </Text>
            </View>
            <Switch
              trackColor={{ false: emerald.line, true: emerald.action }}
              thumbColor={emerald.card}
              ios_backgroundColor={emerald.line}
              value={filters.previouslyScannedOnly}
              onValueChange={(v) => updateFilter('previouslyScannedOnly', v)}
            />
          </View>
          <View style={styles.switchRow}>
            <View style={styles.switchContent}>
              <Ionicons name="heart-outline" size={20} color={emerald.action} />
              <Text style={[styles.switchLabel, { color: emerald.ink }]}>
                {t('search.filterLabels.favoritesOnly')}
              </Text>
            </View>
            <Switch
              trackColor={{ false: emerald.line, true: emerald.action }}
              thumbColor={emerald.card}
              ios_backgroundColor={emerald.line}
              value={filters.favoritesOnly}
              onValueChange={(v) => updateFilter('favoritesOnly', v)}
            />
          </View>
        </View>

        {/* NOVA */}
        <View style={[styles.section, { backgroundColor: emerald.card, borderColor: emerald.line }]}>
          <Text style={[styles.sectionTitle, { color: emerald.ink }]}>{t('result.processingLevel')}</Text>
          <Text style={[styles.sectionDescription, { color: emerald.muted }]}>
            {t('search.novaFilterDescription')}
          </Text>
          <View style={styles.novaContainer}>
            {([1, 2, 3, 4] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.novaButton,
                  {
                    backgroundColor:
                      filters.novaMax !== null && filters.novaMax >= level ? colors.primary : page,
                    borderColor:
                      filters.novaMax !== null && filters.novaMax >= level ? colors.primary : emerald.line,
                  },
                ]}
                onPress={() => updateFilter('novaMax', filters.novaMax === level ? null : level)}
              >
                <Text
                  style={[
                    styles.novaText,
                    {
                      color: filters.novaMax !== null && filters.novaMax >= level ? '#fff' : emerald.ink,
                      fontWeight: filters.novaMax !== null && filters.novaMax >= level ? 'bold' : 'normal',
                    },
                  ]}
                >
                  NOVA {level}
                </Text>
                <Text
                  style={[
                    styles.novaLabel,
                    {
                      color:
                        filters.novaMax !== null && filters.novaMax >= level ? '#fff' : emerald.muted,
                    },
                  ]}
                >
                  {t(`nova.${level}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Certifications */}
        <View style={[styles.section, { backgroundColor: emerald.card, borderColor: emerald.line }]}>
          <Text style={[styles.sectionTitle, { color: emerald.ink }]}>{t('result.certifications')}</Text>
          <View style={styles.certContainer}>
            {['organic', 'fair-trade', 'rainforest-alliance', 'b-corp', 'non-gmo'].map((cert) => (
              <TouchableOpacity
                key={cert}
                style={[
                  styles.certButton,
                  {
                    backgroundColor: filters.certification?.includes(cert) ? colors.primary : page,
                    borderColor: filters.certification?.includes(cert) ? colors.primary : emerald.line,
                  },
                ]}
                onPress={() => toggleCertification(cert)}
              >
                <Text
                  style={[
                    styles.certText,
                    {
                      color: filters.certification?.includes(cert) ? '#fff' : emerald.ink,
                    },
                  ]}
                >
                  {t(`search.cert.${cert}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {active && (
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: page }]}
            onPress={resetFilters}
            accessibilityRole="button"
          >
            <Ionicons name="refresh-outline" size={20} color={emerald.muted} />
            <Text style={[styles.resetButtonText, { color: emerald.muted }]}>
              {t('search.resetFilters')}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTextBlock: {
    flex: 1,
    paddingRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerHint: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    minHeight: 48,
  },
  unlockBannerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  trustInputCol: {
    flex: 1,
  },
  trustInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  rangeLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  rangeSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingBottom: 10,
  },
  countryInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 48,
  },
  gradeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  gradeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  gradeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    minHeight: 48,
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  switchLabel: {
    fontSize: 15,
    flex: 1,
  },
  novaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  novaButton: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minHeight: 44,
  },
  novaText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  novaLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  certContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  certText: {
    fontSize: 13,
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    minHeight: 48,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
