import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import InfoModal from './InfoModal';
import { useTheme } from '../theme';
import { Product } from '../types/product';

interface AllergensAdditivesModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
}

// Common E-number additives database
const E_NUMBER_DATABASE: Record<string, { name: string; category: string; description: string; safety: 'safe' | 'caution' | 'avoid' }> = {
  'e100': { name: 'Curcumin (Turmeric)', category: 'Color', description: 'Natural yellow-orange color derived from turmeric. Generally safe.', safety: 'safe' },
  'e101': { name: 'Riboflavin (Vitamin B2)', category: 'Color', description: 'Yellow color and vitamin supplement. Natural and safe.', safety: 'safe' },
  'e102': { name: 'Tartrazine', category: 'Color', description: 'Artificial yellow color. May cause allergic reactions in sensitive individuals.', safety: 'caution' },
  'e104': { name: 'Quinoline Yellow', category: 'Color', description: 'Yellow-green artificial color. May cause hyperactivity in children.', safety: 'caution' },
  'e110': { name: 'Sunset Yellow FCF', category: 'Color', description: 'Orange artificial color. May cause allergic reactions and hyperactivity.', safety: 'caution' },
  'e120': { name: 'Cochineal / Carmine', category: 'Color', description: 'Red color from insects. May cause allergic reactions, especially in asthmatics.', safety: 'caution' },
  'e122': { name: 'Azorubine / Carmoisine', category: 'Color', description: 'Red artificial color. May cause allergic reactions and hyperactivity.', safety: 'caution' },
  'e124': { name: 'Ponceau 4R', category: 'Color', description: 'Red artificial color. May cause allergic reactions and hyperactivity in children.', safety: 'caution' },
  'e129': { name: 'Allura Red AC', category: 'Color', description: 'Red artificial color. May cause hyperactivity in children and allergic reactions.', safety: 'caution' },
  'e200': { name: 'Sorbic Acid', category: 'Preservative', description: 'Natural preservative from berries. Generally safe in small amounts.', safety: 'safe' },
  'e202': { name: 'Potassium Sorbate', category: 'Preservative', description: 'Salt of sorbic acid. Prevents mold and yeast growth. Generally safe.', safety: 'safe' },
  'e211': { name: 'Sodium Benzoate', category: 'Preservative', description: 'Common preservative. May cause hyperactivity in children when combined with colors.', safety: 'caution' },
  'e220': { name: 'Sulfur Dioxide', category: 'Preservative', description: 'Preservative that may trigger asthma in sensitive individuals.', safety: 'caution' },
  'e250': { name: 'Sodium Nitrite', category: 'Preservative', description: 'Prevents botulism in cured meats. May form carcinogens when heated. Use in moderation.', safety: 'caution' },
  'e251': { name: 'Sodium Nitrate', category: 'Preservative', description: 'Used in cured meats. Similar concerns to nitrites.', safety: 'caution' },
  'e300': { name: 'Ascorbic Acid (Vitamin C)', category: 'Antioxidant', description: 'Natural vitamin and antioxidant. Completely safe.', safety: 'safe' },
  'e330': { name: 'Citric Acid', category: 'Acid / Antioxidant', description: 'Natural acid from citrus fruits. Very common and safe.', safety: 'safe' },
  'e400': { name: 'Alginic Acid', category: 'Thickener', description: 'Natural thickener from seaweed. Generally safe.', safety: 'safe' },
  'e407': { name: 'Carrageenan', category: 'Thickener', description: 'Thickener from seaweed. Some concerns about inflammation, but generally considered safe.', safety: 'caution' },
  'e410': { name: 'Locust Bean Gum', category: 'Thickener', description: 'Natural thickener from carob seeds. Generally safe.', safety: 'safe' },
  'e415': { name: 'Xanthan Gum', category: 'Thickener', description: 'Fermented sugar thickener. Generally safe in normal amounts.', safety: 'safe' },
  'e420': { name: 'Sorbitol', category: 'Sweetener / Humectant', description: 'Sugar alcohol. May cause digestive issues in large amounts.', safety: 'caution' },
  'e421': { name: 'Mannitol', category: 'Sweetener', description: 'Sugar alcohol. May cause digestive issues in large amounts.', safety: 'caution' },
  'e422': { name: 'Glycerol / Glycerin', category: 'Humectant', description: 'Natural compound that retains moisture. Generally safe.', safety: 'safe' },
  'e432': { name: 'Polysorbate 20', category: 'Emulsifier', description: 'Emulsifier that helps mix ingredients. Generally safe in small amounts.', safety: 'safe' },
  'e500': { name: 'Sodium Carbonate', category: 'Acid Regulator', description: 'Natural compound used as raising agent. Generally safe.', safety: 'safe' },
  'e551': { name: 'Silicon Dioxide', category: 'Anti-caking Agent', description: 'Natural anti-caking agent (sand). Prevents clumping. Generally safe and inert.', safety: 'safe' },
  'e621': { name: 'Monosodium Glutamate (MSG)', category: 'Flavor Enhancer', description: 'Enhances flavor. Some people may be sensitive, causing headaches. Generally safe for most people.', safety: 'caution' },
  'e627': { name: 'Disodium Guanylate', category: 'Flavor Enhancer', description: 'Flavor enhancer, often used with MSG. Generally safe.', safety: 'safe' },
  'e631': { name: 'Disodium Inosinate', category: 'Flavor Enhancer', description: 'Flavor enhancer, often used with MSG. Generally safe.', safety: 'safe' },
  'e635': { name: 'Disodium 5-Ribonucleotides', category: 'Flavor Enhancer', description: 'Flavor enhancer combination. Generally safe.', safety: 'safe' },
  'e900': { name: 'Dimethylpolysiloxane', category: 'Anti-foaming Agent', description: 'Prevents foam formation. Generally considered safe.', safety: 'safe' },
  'e950': { name: 'Acesulfame K / Acesulfame Potassium', category: 'Sweetener', description: 'Artificial sweetener. Very sweet, used in small amounts. Generally safe.', safety: 'safe' },
  'e951': { name: 'Aspartame', category: 'Sweetener', description: 'Artificial sweetener. Safe for most people, but avoid if you have phenylketonuria (PKU).', safety: 'caution' },
  'e952': { name: 'Cyclamic Acid / Cyclamate', category: 'Sweetener', description: 'Artificial sweetener. Banned in some countries. Use in moderation.', safety: 'caution' },
  'e955': { name: 'Sucralose', category: 'Sweetener', description: 'Artificial sweetener derived from sugar. Generally safe.', safety: 'safe' },
  'e960': { name: 'Steviol Glycosides (Stevia)', category: 'Sweetener', description: 'Natural sweetener from stevia plant. Generally safe.', safety: 'safe' },
  'e967': { name: 'Xylitol', category: 'Sweetener', description: 'Natural sugar alcohol. Safe for humans but toxic to dogs. May cause digestive issues in large amounts.', safety: 'caution' },
  'e999': { name: 'Quillaia Extract', category: 'Foaming Agent', description: 'Natural foaming agent from tree bark. Generally safe in small amounts.', safety: 'safe' },
};

export default function AllergensAdditivesModal({ visible, onClose, product }: AllergensAdditivesModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (!product) return null;

  const allergens = product.allergens_tags || [];
  const additives = product.additives_tags || [];

  // Extract E-numbers from additives tags
  const eNumbers = additives
    .map(tag => tag.replace(/^en:/, '').toLowerCase())
    .filter(tag => tag.match(/^e\d+$/));

  const getAdditiveInfo = (eNumber: string) => {
    const key = eNumber.toLowerCase();
    return E_NUMBER_DATABASE[key] || null;
  };

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
                    {allergenName.charAt(0).toUpperCase() + allergenName.slice(1)}
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
                  </>
                ) : (
                  <>
                    <Text style={[styles.additiveName, { color: colors.text }]}>
                      {eNumber.toUpperCase()}
                    </Text>
                    <Text style={[styles.additiveDescription, { color: colors.textSecondary }]}>
                      {t('additive.noInformation')}
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
});

