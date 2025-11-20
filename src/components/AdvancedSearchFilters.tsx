import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import PremiumGate from './PremiumGate';
import { PremiumFeature } from '../utils/premiumFeatures';

export interface SearchFilters {
  trustScoreMin: number | null;
  trustScoreMax: number | null;
  ecoscoreGrade: string | null; // 'a' | 'b' | 'c' | 'd' | 'e' | null
  country: string | null;
  certification: string[]; // Array of certification IDs
  allergenFree: boolean;
  novaMax: number | null; // Max NOVA level (1-4)
  vegan: boolean;
  organic: boolean;
  local: boolean;
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClose: () => void;
}

export default function AdvancedSearchFilters({ filters, onFiltersChange, onClose }: AdvancedSearchFiltersProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const toggleCertification = (certId: string) => {
    const current = filters.certification || [];
    const updated = current.includes(certId)
      ? current.filter(id => id !== certId)
      : [...current, certId];
    updateFilter('certification', updated);
  };

  const resetFilters = () => {
    onFiltersChange({
      trustScoreMin: null,
      trustScoreMax: null,
      ecoscoreGrade: null,
      country: null,
      certification: [],
      allergenFree: false,
      novaMax: null,
      vegan: false,
      organic: false,
      local: false,
    });
  };

  const hasActiveFilters = 
    filters.trustScoreMin !== null ||
    filters.trustScoreMax !== null ||
    filters.ecoscoreGrade !== null ||
    filters.country !== null ||
    (filters.certification && filters.certification.length > 0) ||
    filters.allergenFree ||
    filters.novaMax !== null ||
    filters.vegan ||
    filters.organic ||
    filters.local;

  return (
    <PremiumGate feature={PremiumFeature.ADVANCED_SEARCH}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('search.advancedFilters')}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Trust Score Range */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('result.trustScore')}
            </Text>
            <View style={styles.rangeContainer}>
              <TouchableOpacity
                style={[styles.rangeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => {
                  // TODO: Open number picker for min
                  Alert.alert(t('search.minTrustScore'), t('search.selectValue'));
                }}
              >
                <Text style={[styles.rangeLabel, { color: colors.textSecondary }]}>
                  {t('search.min')}
                </Text>
                <Text style={[styles.rangeValue, { color: colors.text }]}>
                  {filters.trustScoreMin !== null ? filters.trustScoreMin : '--'}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.rangeSeparator, { color: colors.textSecondary }]}>-</Text>
              <TouchableOpacity
                style={[styles.rangeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => {
                  // TODO: Open number picker for max
                  Alert.alert(t('search.maxTrustScore'), t('search.selectValue'));
                }}
              >
                <Text style={[styles.rangeLabel, { color: colors.textSecondary }]}>
                  {t('search.max')}
                </Text>
                <Text style={[styles.rangeValue, { color: colors.text }]}>
                  {filters.trustScoreMax !== null ? filters.trustScoreMax : '--'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Eco-Score Grade */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('ecoscore.title')}
            </Text>
            <View style={styles.gradeContainer}>
              {(['a', 'b', 'c', 'd', 'e'] as const).map((grade) => (
                <TouchableOpacity
                  key={grade}
                  style={[
                    styles.gradeButton,
                    {
                      backgroundColor: filters.ecoscoreGrade === grade ? colors.primary : colors.surface,
                      borderColor: filters.ecoscoreGrade === grade ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    updateFilter('ecoscoreGrade', filters.ecoscoreGrade === grade ? null : grade);
                  }}
                >
                  <Text
                    style={[
                      styles.gradeText,
                      {
                        color: filters.ecoscoreGrade === grade ? '#fff' : colors.text,
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

          {/* Quick Filters */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('search.quickFilters')}
            </Text>
            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <Ionicons name="leaf" size={20} color="#16a085" />
                <Text style={[styles.switchLabel, { color: colors.text }]}>
                  {t('search.vegan')}
                </Text>
              </View>
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
                ios_backgroundColor={colors.border}
                value={filters.vegan}
                onValueChange={(value) => updateFilter('vegan', value)}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <Ionicons name="flower" size={20} color="#16a085" />
                <Text style={[styles.switchLabel, { color: colors.text }]}>
                  {t('search.organic')}
                </Text>
              </View>
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
                ios_backgroundColor={colors.border}
                value={filters.organic}
                onValueChange={(value) => updateFilter('organic', value)}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={[styles.switchLabel, { color: colors.text }]}>
                  {t('search.local')}
                </Text>
              </View>
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
                ios_backgroundColor={colors.border}
                value={filters.local}
                onValueChange={(value) => updateFilter('local', value)}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchContent}>
                <Ionicons name="warning" size={20} color="#ff6b6b" />
                <Text style={[styles.switchLabel, { color: colors.text }]}>
                  {t('search.allergenFree')}
                </Text>
              </View>
              <Switch
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
                ios_backgroundColor={colors.border}
                value={filters.allergenFree}
                onValueChange={(value) => updateFilter('allergenFree', value)}
              />
            </View>
          </View>

          {/* NOVA Processing Level */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('result.processingLevel')}
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              {t('search.novaFilterDescription')}
            </Text>
            <View style={styles.novaContainer}>
              {([1, 2, 3, 4] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.novaButton,
                    {
                      backgroundColor: filters.novaMax !== null && filters.novaMax >= level ? colors.primary : colors.surface,
                      borderColor: filters.novaMax !== null && filters.novaMax >= level ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    updateFilter('novaMax', filters.novaMax === level ? null : level);
                  }}
                >
                  <Text
                    style={[
                      styles.novaText,
                      {
                        color: filters.novaMax !== null && filters.novaMax >= level ? '#fff' : colors.text,
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
                        color: filters.novaMax !== null && filters.novaMax >= level ? '#fff' : colors.textSecondary,
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
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('result.certifications')}
            </Text>
            <View style={styles.certContainer}>
              {['organic', 'fair-trade', 'rainforest-alliance', 'b-corp', 'non-gmo'].map((cert) => (
                <TouchableOpacity
                  key={cert}
                  style={[
                    styles.certButton,
                    {
                      backgroundColor: filters.certification?.includes(cert) ? colors.primary : colors.surface,
                      borderColor: filters.certification?.includes(cert) ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => toggleCertification(cert)}
                >
                  <Text
                    style={[
                      styles.certText,
                      {
                        color: filters.certification?.includes(cert) ? '#fff' : colors.text,
                      },
                    ]}
                  >
                    {t(`search.cert.${cert}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reset Button */}
          {hasActiveFilters && (
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: colors.surface }]}
              onPress={resetFilters}
            >
              <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>
                {t('search.resetFilters')}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    alignItems: 'center',
    gap: 12,
  },
  rangeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  rangeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  rangeSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
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
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
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
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
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
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

