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
  // Determine current flag: priority order - green (palm oil free) > red (non-sustainable) > orange (contains palm oil)
  const currentFlag = isPalmOilFree ? 'green' : isNonSustainable ? 'red' : containsPalmOil ? 'orange' : 'orange'; // Default to orange if unclear

  return (
    <InfoModal
      visible={visible}
      onClose={onClose}
      title={t('result.palmOil')}
      icon="flag"
      iconColor={isPalmOilFree ? '#16a085' : isNonSustainable ? '#ff6b6b' : '#ff9500'}
    >
      <View>
        {/* Current Status Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('result.currentStatus', 'Current Status')}
          </Text>
          <View style={[styles.currentStatusCard, { 
            backgroundColor: currentFlag === 'green' ? '#16a085' + '20' : currentFlag === 'orange' ? '#ff9500' + '20' : '#ff6b6b' + '20',
            borderColor: currentFlag === 'green' ? '#16a085' : currentFlag === 'orange' ? '#ff9500' : '#ff6b6b',
            borderWidth: 2
          }]}>
            {currentFlag === 'green' && (
              <Text style={[styles.currentStatusText, { color: '#16a085' }]}>
                🟢 <Text style={[styles.currentStatusBold, { color: '#16a085' }]}>
                  {t('result.palmOilFree', 'Palm Oil Free')}
                </Text>
              </Text>
            )}
            {currentFlag === 'orange' && (
              <Text style={[styles.currentStatusText, { color: '#ff9500' }]}>
                🟠 <Text style={[styles.currentStatusBold, { color: '#ff9500' }]}>
                  {t('result.containsPalmOil', 'Contains Palm Oil')}
                </Text>
              </Text>
            )}
            {currentFlag === 'red' && (
              <Text style={[styles.currentStatusText, { color: '#ff6b6b' }]}>
                🔴 <Text style={[styles.currentStatusBold, { color: '#ff6b6b' }]}>
                  {t('result.nonSustainablePalmOil', 'Non-Sustainable Palm Oil')}
                </Text>
              </Text>
            )}
          </View>
          
          {/* Show all flags summary */}
          <View style={styles.allFlagsSummary}>
            <Text style={[styles.summaryText, { color: colors.textSecondary, marginBottom: 12 }]}>
              {t('result.allFlagsSummary', 'All Palm Oil Flags:')}
            </Text>
            <View style={styles.flagSummaryItem}>
              <Text style={[styles.summaryFlag, { color: '#16a085' }]}>
                🟢 <Text style={[styles.summaryFlagText, { color: colors.text }]}>
                  {t('result.greenFlag')} ({t('result.priority1', 'Priority 1')}): {t('result.palmOilFree')}
                </Text>
              </Text>
              <Text style={[styles.summaryDescription, { color: colors.textSecondary }]}>
                {t('result.greenFlagSummary', 'Benefits and why it\'s the best choice')}
              </Text>
            </View>
            <View style={styles.flagSummaryItem}>
              <Text style={[styles.summaryFlag, { color: '#ff9500' }]}>
                🟠 <Text style={[styles.summaryFlagText, { color: colors.text }]}>
                  {t('result.orangeFlag')} ({t('result.priority2', 'Priority 2')}): {t('result.containsPalmOil')}
                </Text>
              </Text>
              <Text style={[styles.summaryDescription, { color: colors.textSecondary }]}>
                {t('result.orangeFlagSummary', 'Guidance on what to look for (RSPO certification, etc.)')}
              </Text>
            </View>
            <View style={styles.flagSummaryItem}>
              <Text style={[styles.summaryFlag, { color: '#ff6b6b' }]}>
                🔴 <Text style={[styles.summaryFlagText, { color: colors.text }]}>
                  {t('result.redFlag')} ({t('result.priority3', 'Priority 3')}): {t('result.nonSustainablePalmOil')}
                </Text>
              </Text>
              <Text style={[styles.summaryDescription, { color: colors.textSecondary }]}>
                {t('result.redFlagSummary', 'Environmental impacts and warnings')}
              </Text>
            </View>
          </View>
        </View>

        {/* All Flags Section - Educational */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('result.palmOilFlags', 'Palm Oil Flags Explained')}
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary, marginBottom: 16 }]}>
            {t('result.palmOilFlagsDescription', 'Understanding palm oil flags helps you make informed choices. Each flag represents a different level of environmental impact and sustainability.')}
          </Text>

          {/* Green Flag (Priority 1) */}
          <View style={[styles.flagCard, { 
            backgroundColor: '#16a085' + '15', 
            borderColor: '#16a085',
            borderWidth: currentFlag === 'green' ? 2 : 1
          }]}>
            <View style={styles.flagHeader}>
              <Text style={[styles.flagEmoji, { fontSize: 28 }]}>🟢</Text>
              <View style={styles.flagTitleContainer}>
                <Text style={[styles.flagTitle, { color: '#16a085' }]}>
                  {t('result.greenFlag')} - {t('result.palmOilFree')}
                </Text>
                <Text style={[styles.flagPriority, { color: colors.textSecondary }]}>
                  {t('result.priority1', 'Priority 1: Best Choice')}
                </Text>
              </View>
            </View>
            <Text style={[styles.flagDescription, { color: colors.textSecondary, marginTop: 12 }]}>
              {t('result.greenFlagDescription', 'This product does not contain palm oil or palm oil derivatives. Products with a green flag have no palm oil content, making them the most environmentally friendly option. By choosing palm oil-free products, you help reduce the demand for palm oil plantations, which are a leading cause of deforestation, biodiversity loss, and climate change. This is the best choice for environmental sustainability.')}
            </Text>
            <View style={styles.flagBenefits}>
              <Text style={[styles.flagBenefitsTitle, { color: colors.text }]}>
                {t('result.benefits', 'Benefits:')}
              </Text>
              <Text style={[styles.flagBenefitsText, { color: colors.textSecondary }]}>
                • {t('result.benefitNoDeforestation', 'No contribution to deforestation')}
              </Text>
              <Text style={[styles.flagBenefitsText, { color: colors.textSecondary }]}>
                • {t('result.benefitNoHabitatLoss', 'No habitat destruction for endangered species')}
              </Text>
              <Text style={[styles.flagBenefitsText, { color: colors.textSecondary }]}>
                • {t('result.benefitLowerCarbon', 'Lower carbon footprint')}
              </Text>
              <Text style={[styles.flagBenefitsText, { color: colors.textSecondary }]}>
                • {t('result.benefitBiodiversity', 'Supports biodiversity conservation')}
              </Text>
            </View>
          </View>

          {/* Orange Flag (Priority 2) */}
          <View style={[styles.flagCard, { 
            backgroundColor: '#ff9500' + '15', 
            borderColor: '#ff9500',
            borderWidth: currentFlag === 'orange' ? 2 : 1,
            marginTop: 16
          }]}>
            <View style={styles.flagHeader}>
              <Text style={[styles.flagEmoji, { fontSize: 28 }]}>🟠</Text>
              <View style={styles.flagTitleContainer}>
                <Text style={[styles.flagTitle, { color: '#ff9500' }]}>
                  {t('result.orangeFlag')} - {t('result.containsPalmOil')}
                </Text>
                <Text style={[styles.flagPriority, { color: colors.textSecondary }]}>
                  {t('result.priority2', 'Priority 2: Moderate Concern')}
                </Text>
              </View>
            </View>
            <Text style={[styles.flagDescription, { color: colors.textSecondary, marginTop: 12 }]}>
              {t('result.orangeFlagDescription', 'This product contains palm oil, but its sustainability status is unknown or not verified. Palm oil itself is not inherently bad - when produced sustainably, it can be an efficient crop. However, the majority of palm oil comes from unsustainable sources. The orange flag indicates that the product contains palm oil, and you should look for additional information such as RSPO (Roundtable on Sustainable Palm Oil) certification to ensure it comes from responsible sources.')}
            </Text>
            <View style={styles.flagBenefits}>
              <Text style={[styles.flagBenefitsTitle, { color: colors.text }]}>
                {t('result.whatToLookFor', 'What to Look For:')}
              </Text>
              <Text style={[styles.flagBenefitsText, { color: colors.textSecondary }]}>
                • {t('result.lookRSPOCert', 'RSPO (Roundtable on Sustainable Palm Oil) certification')}
              </Text>
              <Text style={[styles.flagBenefitsText, { color: colors.textSecondary }]}>
                • {t('result.lookOrganicCert', 'Organic or Fair Trade certifications')}
              </Text>
              <Text style={[styles.flagBenefitsText, { color: colors.textSecondary }]}>
                • {t('result.lookCompanyCommitment', 'Company commitment to sustainable sourcing')}
              </Text>
              <Text style={[styles.flagBenefitsText, { color: colors.textSecondary }]}>
                • {t('result.lookTransparentSupply', 'Transparent supply chain information')}
              </Text>
            </View>
            <View style={[styles.rspoBadge, { backgroundColor: '#16a085' + '20', borderColor: '#16a085', marginTop: 12 }]}>
              <Ionicons name="leaf" size={18} color="#16a085" />
              <Text style={[styles.rspoText, { color: '#16a085' }]}>
                {t('result.rspoInfo', 'RSPO Certified palm oil ensures no deforestation, no peat development, and fair labor practices.')}
              </Text>
            </View>
          </View>

          {/* Red Flag (Priority 3) */}
          <View style={[styles.flagCard, { 
            backgroundColor: '#ff6b6b' + '15', 
            borderColor: '#ff6b6b',
            borderWidth: currentFlag === 'red' ? 2 : 1,
            marginTop: 16
          }]}>
            <View style={styles.flagHeader}>
              <Text style={[styles.flagEmoji, { fontSize: 28 }]}>🔴</Text>
              <View style={styles.flagTitleContainer}>
                <Text style={[styles.flagTitle, { color: '#ff6b6b' }]}>
                  {t('result.redFlag')} - {t('result.nonSustainablePalmOil')}
                </Text>
                <Text style={[styles.flagPriority, { color: colors.textSecondary }]}>
                  {t('result.priority3', 'Priority 3: High Concern')}
                </Text>
              </View>
            </View>
            <Text style={[styles.flagDescription, { color: colors.textSecondary, marginTop: 12 }]}>
              {t('result.redFlagDescription', 'This product contains palm oil that is likely from non-sustainable sources. Products with a red flag have been identified as containing palm oil that may contribute to deforestation, habitat destruction, and environmental degradation. This is the most concerning category, as non-sustainable palm oil production is one of the leading causes of rainforest destruction, particularly in Indonesia and Malaysia. Purchasing these products directly supports practices that threaten endangered species like orangutans, tigers, and elephants, while also contributing significantly to climate change.')}
            </Text>
            <View style={styles.flagBenefits}>
              <Text style={[styles.flagBenefitsTitle, { color: colors.text }]}>
                {t('result.environmentalImpacts', 'Environmental Impacts:')}
              </Text>
              <Text style={[styles.flagBenefitsText, { color: colors.textSecondary }]}>
                • {t('result.impactDeforestation', 'Massive deforestation in tropical regions')}
              </Text>
              <Text style={[styles.flagBenefitsText, { color: colors.textSecondary }]}>
                • {t('result.impactSpeciesExtinction', 'Threatens endangered species (orangutans, tigers, elephants)')}
              </Text>
              <Text style={[styles.flagBenefitsText, { color: colors.textSecondary }]}>
                • {t('result.impactCarbonRelease', 'Releases massive amounts of stored carbon dioxide')}
              </Text>
              <Text style={[styles.flagBenefitsText, { color: colors.textSecondary }]}>
                • {t('result.impactWaterPollution', 'Water pollution and soil erosion')}
              </Text>
              <Text style={[styles.flagBenefitsText, { color: colors.textSecondary }]}>
                • {t('result.impactSocialIssues', 'Associated with labor rights violations')}
              </Text>
            </View>
            <View style={[styles.warningBox, { backgroundColor: '#ff6b6b' + '20', marginTop: 12 }]}>
              <Ionicons name="warning" size={20} color="#ff6b6b" />
              <Text style={[styles.warningText, { color: '#ff6b6b' }]}>
                {t('result.redFlagWarning', 'Consider choosing palm oil-free alternatives or products with verified sustainable palm oil (RSPO certified) to minimize environmental impact.')}
              </Text>
            </View>
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('result.aboutPalmOil', 'About Palm Oil')}
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {t('result.palmOilInfo', 'Palm oil is a vegetable oil derived from the fruit of oil palm trees. It is widely used in processed foods, cosmetics, and cleaning products due to its versatility and low cost. However, its production has significant environmental and social impacts when not managed sustainably.')}
          </Text>
        </View>

        {/* Note */}
        <View style={[styles.note, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.noteText, { color: colors.text }]}>
            {t('result.palmOilNote', 'Making informed choices about palm oil can help protect our planet and its wildlife. When possible, choose products with sustainable palm oil or palm oil-free alternatives. Your choices matter in the fight against deforestation and climate change.')}
          </Text>
        </View>
      </View>
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  currentStatusCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  currentStatusText: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  currentStatusBold: {
    fontWeight: 'bold',
  },
  allFlagsSummary: {
    gap: 12,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  flagSummaryItem: {
    marginBottom: 12,
  },
  summaryFlag: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  summaryFlagText: {
    fontWeight: '600',
  },
  summaryDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 24,
    marginTop: 2,
  },
  flagEmoji: {
    fontSize: 28,
  },
  flagCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  flagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagTitleContainer: {
    flex: 1,
  },
  flagTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  flagPriority: {
    fontSize: 12,
    marginTop: 4,
  },
  flagDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  flagBenefits: {
    marginTop: 12,
  },
  flagBenefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  flagBenefitsText: {
    fontSize: 13,
    lineHeight: 20,
    marginLeft: 8,
    marginTop: 4,
  },
  rspoBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  rspoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
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


