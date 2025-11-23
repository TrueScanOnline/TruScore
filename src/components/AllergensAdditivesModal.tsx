import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import InfoModal from './InfoModal';
import { useTheme } from '../theme';
import { Product } from '../types/product';
import { getAdditiveInfo, AdditiveInfo } from '../services/additiveDatabase';
import { sanitizeText } from '../utils/validation';

interface AllergensAdditivesModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
}

export default function AllergensAdditivesModal({ visible, onClose, product }: AllergensAdditivesModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (!product) return null;

  const allergens = product.allergens_tags || [];
  const additives = product.additives_tags || [];

  // Extract E-numbers from additives tags (handles both "en:e412" and "e412" formats)
  const eNumbers = additives
    .map(tag => {
      // Remove "en:" prefix if present and convert to lowercase
      const cleaned = tag.replace(/^en:/, '').toLowerCase();
      // Extract E-number (handles formats like "e412", "e-412", "e 412")
      const match = cleaned.match(/^e-?(\d+[a-z]?)$/i);
      return match ? `e${match[1].toLowerCase()}` : null;
    })
    .filter((eNum): eNum is string => eNum !== null && !!eNum.match(/^e\d+[a-z]?$/));

  const getSafetyColor = (safety: string) => {
    switch (safety) {
      case 'safe':
        return '#16a085';
      case 'caution':
        return '#ffa500';
      case 'avoid':
        return '#ff6b6b';
      default:
        return colors.textSecondary;
    }
  };

  const getSafetyIcon = (safety: string) => {
    switch (safety) {
      case 'safe':
        return 'checkmark-circle';
      case 'caution':
        return 'warning';
      case 'avoid':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  return (
    <InfoModal
      visible={visible}
      onClose={onClose}
      title={t('result.allergensAdditives')}
      icon="warning-outline"
      iconColor="#ff6b6b"
    >
      {/* Allergens Section */}
      {allergens.length > 0 && (
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <Ionicons name="warning" size={24} color="#ff6b6b" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('result.allergens')}
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            {t('result.allergensDescription')}
          </Text>
          <View style={[styles.allergensContainer, { backgroundColor: '#ff6b6b' + '15' }]}>
            {allergens.map((allergen, index) => {
              const allergenName = allergen.replace(/^en:/, '').replace(/-/g, ' ');
              return (
                <View key={index} style={[styles.allergenItem, { borderColor: '#ff6b6b' }]}>
                  <Ionicons name="warning" size={20} color="#ff6b6b" />
                  <Text style={[styles.allergenText, { color: colors.text }]}>
                    {sanitizeText(allergenName.charAt(0).toUpperCase() + allergenName.slice(1), 100)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Additives Section */}
      {eNumbers.length > 0 && (
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <Ionicons name="flask-outline" size={24} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('result.additives')} ({eNumbers.length})
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            {t('result.additivesDescription')}
          </Text>

          {eNumbers.map((eNumber, index) => {
            const info = getAdditiveInfo(eNumber);
            const safety = info?.safety || 'safe';
            const safetyColor = getSafetyColor(safety);
            const safetyIcon = getSafetyIcon(safety) as any;

            return (
              <View
                key={index}
                style={[
                  styles.additiveCard,
                  { backgroundColor: colors.surface, borderLeftColor: safetyColor },
                ]}
              >
                <View style={styles.additiveHeader}>
                  <View style={[styles.additiveBadge, { backgroundColor: safetyColor }]}>
                    <Text style={styles.additiveBadgeText}>{eNumber.toUpperCase()}</Text>
                  </View>
                  <View style={[styles.safetyBadge, { backgroundColor: safetyColor + '20' }]}>
                    <Ionicons name={safetyIcon} size={16} color={safetyColor} />
                    <Text style={[styles.safetyText, { color: safetyColor }]}>
                      {t(`additive.safety.${safety}`)}
                    </Text>
                  </View>
                </View>

                {info ? (
                  <>
                    <Text style={[styles.additiveName, { color: colors.text }]}>
                      {info.name}
                    </Text>
                    <Text style={[styles.additiveCategory, { color: colors.textSecondary }]}>
                      {info.category}
                    </Text>
                    <Text style={[styles.additiveDescription, { color: colors.textSecondary }]}>
                      {info.description}
                    </Text>
                    
                    {/* Uses */}
                    {info.uses && info.uses.length > 0 && (
                      <View style={styles.infoSection}>
                        <View style={styles.infoSectionHeader}>
                          <Ionicons name="restaurant-outline" size={16} color={colors.primary} />
                          <Text style={[styles.infoSectionTitle, { color: colors.text }]}>
                            Common Uses:
                          </Text>
                        </View>
                        <View style={styles.usesList}>
                          {info.uses.map((use, idx) => (
                            <View key={idx} style={styles.useItem}>
                              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                              <Text style={[styles.useText, { color: colors.textSecondary }]}>
                                {use}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    
                    {/* Concerns */}
                    {info.concerns && info.concerns.length > 0 && (
                      <View style={[styles.infoSection, styles.concernsSection]}>
                        <View style={styles.infoSectionHeader}>
                          <Ionicons name="warning-outline" size={16} color="#ff6b6b" />
                          <Text style={[styles.infoSectionTitle, { color: colors.text }]}>
                            Concerns:
                          </Text>
                        </View>
                        <View style={styles.concernsList}>
                          {info.concerns.map((concern, idx) => (
                            <View key={idx} style={styles.concernItem}>
                              <Ionicons name="alert-circle" size={14} color="#ff6b6b" />
                              <Text style={[styles.concernText, { color: colors.textSecondary }]}>
                                {concern}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                    
                    {/* Alternatives */}
                    {info.alternatives && (
                      <View style={[styles.infoSection, styles.alternativesSection]}>
                        <View style={styles.infoSectionHeader}>
                          <Ionicons name="leaf-outline" size={16} color="#16a085" />
                          <Text style={[styles.infoSectionTitle, { color: colors.text }]}>
                            Alternatives:
                          </Text>
                        </View>
                        <Text style={[styles.alternativeText, { color: colors.textSecondary }]}>
                          {info.alternatives}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={[styles.additiveName, { color: colors.text }]}>
                      {eNumber.toUpperCase()}
                    </Text>
                    <Text style={[styles.additiveDescription, { color: colors.textSecondary }]}>
                      {t('additive.noInformation')}
                    </Text>
                    <Text style={[styles.noInfoNote, { color: colors.textSecondary }]}>
                      This additive code is not yet in our database. We're continuously updating our information.
                    </Text>
                  </>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Note */}
      <View style={[styles.note, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={[styles.noteText, { color: colors.text }]}>
          {t('result.additivesNote')}
        </Text>
      </View>
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  allergensContainer: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  allergenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  allergenText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  additiveCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  additiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  additiveBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  additiveBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  safetyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  additiveName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  additiveCategory: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  additiveDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  note: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  infoSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  concernsSection: {
    borderTopColor: '#ff6b6b30',
  },
  alternativesSection: {
    borderTopColor: '#16a08530',
  },
  infoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  usesList: {
    gap: 6,
  },
  useItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  useText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  concernsList: {
    gap: 6,
  },
  concernItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  concernText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  alternativeText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  noInfoNote: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

