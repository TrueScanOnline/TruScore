import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import InfoModal from './InfoModal';
import { useTheme } from '../theme';
import { Product } from '../types/product';

interface PalmOilInfoModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
}

export default function PalmOilInfoModal({ visible, onClose, product }: PalmOilInfoModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (!product || !product.palm_oil_analysis) return null;

  const analysis = product.palm_oil_analysis;
  const isPalmOilFree = analysis.isPalmOilFree;
  const containsPalmOil = analysis.containsPalmOil;
  const isNonSustainable = analysis.isNonSustainable;

  return (
    <InfoModal
      visible={visible}
      onClose={onClose}
      title={t('result.palmOil')}
      icon={isPalmOilFree ? "checkmark-circle" : isNonSustainable ? "warning" : "information-circle"}
      iconColor={isPalmOilFree ? '#16a085' : isNonSustainable ? '#ff6b6b' : '#ffd93d'}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Section */}
        <View style={styles.section}>
          {isPalmOilFree ? (
            <View style={[styles.statusCard, { backgroundColor: '#16a085' + '20', borderColor: '#16a085' }]}>
              <Ionicons name="checkmark-circle" size={32} color="#16a085" />
              <Text style={[styles.statusTitle, { color: '#16a085' }]}>
                {t('result.palmOilFree')}
              </Text>
              <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
                {t('result.palmOilFreeDescription', 'This product does not contain palm oil. Great choice for environmental sustainability!')}
              </Text>
            </View>
          ) : isNonSustainable ? (
            <View style={[styles.statusCard, { backgroundColor: '#ff6b6b' + '20', borderColor: '#ff6b6b' }]}>
              <Ionicons name="warning" size={32} color="#ff6b6b" />
              <Text style={[styles.statusTitle, { color: '#ff6b6b' }]}>
                {t('result.nonSustainablePalmOil')}
              </Text>
              <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
                {t('result.nonSustainablePalmOilDescription', 'This product contains palm oil that may not be from sustainable sources. Palm oil production is a leading cause of deforestation and habitat loss for endangered species.')}
              </Text>
            </View>
          ) : containsPalmOil ? (
            <View style={[styles.statusCard, { backgroundColor: '#ffd93d' + '20', borderColor: '#ffd93d' }]}>
              <Ionicons name="information-circle" size={32} color="#ffd93d" />
              <Text style={[styles.statusTitle, { color: '#ffd93d' }]}>
                {t('result.containsPalmOil')}
              </Text>
              <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
                {t('result.containsPalmOilDescription', 'This product contains palm oil. Look for RSPO (Roundtable on Sustainable Palm Oil) certification to ensure it comes from sustainable sources.')}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Information Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('result.aboutPalmOil', 'About Palm Oil')}
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {t('result.palmOilInfo', 'Palm oil is a vegetable oil derived from the fruit of oil palm trees. It is widely used in processed foods, cosmetics, and cleaning products due to its versatility and low cost.')}
          </Text>
        </View>

        {/* Environmental Impact */}
        <View style={styles.section}>
          <View style={styles.impactHeader}>
            <Ionicons name="leaf-outline" size={24} color="#ff6b6b" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('result.environmentalImpact', 'Environmental Impact')}
            </Text>
          </View>
          <View style={styles.impactList}>
            <View style={styles.impactItem}>
              <Ionicons name="remove-circle" size={20} color="#ff6b6b" />
              <Text style={[styles.impactText, { color: colors.textSecondary }]}>
                {t('result.palmOilImpact1', 'Deforestation: Palm oil plantations are a leading cause of deforestation in tropical regions, particularly in Indonesia and Malaysia.')}
              </Text>
            </View>
            <View style={styles.impactItem}>
              <Ionicons name="remove-circle" size={20} color="#ff6b6b" />
              <Text style={[styles.impactText, { color: colors.textSecondary }]}>
                {t('result.palmOilImpact2', 'Biodiversity Loss: Deforestation destroys critical habitats for endangered species like orangutans, tigers, and elephants.')}
              </Text>
            </View>
            <View style={styles.impactItem}>
              <Ionicons name="remove-circle" size={20} color="#ff6b6b" />
              <Text style={[styles.impactText, { color: colors.textSecondary }]}>
                {t('result.palmOilImpact3', 'Climate Change: Deforestation releases significant amounts of carbon dioxide and destroys carbon-sequestering forests.')}
              </Text>
            </View>
            <View style={styles.impactItem}>
              <Ionicons name="remove-circle" size={20} color="#ff6b6b" />
              <Text style={[styles.impactText, { color: colors.textSecondary }]}>
                {t('result.palmOilImpact4', 'Soil Erosion and Water Pollution: Palm oil cultivation can lead to soil degradation and water contamination.')}
              </Text>
            </View>
          </View>
        </View>

        {/* Sustainable Alternatives */}
        {containsPalmOil && (
          <View style={styles.section}>
            <View style={styles.alternativesHeader}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#16a085" />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('result.sustainableAlternatives', 'Sustainable Alternatives')}
              </Text>
            </View>
            <Text style={[styles.infoText, { color: colors.textSecondary, marginBottom: 12 }]}>
              {t('result.lookForRSPO', 'Look for products with RSPO (Roundtable on Sustainable Palm Oil) certification, which ensures palm oil is produced in an environmentally and socially responsible manner.')}
            </Text>
            <View style={[styles.certBadge, { backgroundColor: '#16a085' + '20', borderColor: '#16a085' }]}>
              <Ionicons name="leaf" size={20} color="#16a085" />
              <Text style={[styles.certText, { color: '#16a085' }]}>
                {t('result.rspoCertified', 'RSPO Certified')}
              </Text>
            </View>
          </View>
        )}

        {/* Note */}
        <View style={[styles.note, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.noteText, { color: colors.text }]}>
            {t('result.palmOilNote', 'Making informed choices about palm oil can help protect our planet and its wildlife. When possible, choose products with sustainable palm oil or palm oil-free alternatives.')}
          </Text>
        </View>
      </ScrollView>
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  content: {
    maxHeight: 500,
  },
  section: {
    marginBottom: 24,
  },
  statusCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    alignItems: 'center',
    gap: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  impactList: {
    gap: 12,
  },
  impactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  impactText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  alternativesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    alignSelf: 'flex-start',
  },
  certText: {
    fontSize: 14,
    fontWeight: '600',
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

