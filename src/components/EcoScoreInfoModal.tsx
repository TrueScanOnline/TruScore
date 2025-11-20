import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import InfoModal from './InfoModal';
import { useTheme } from '../theme';

interface EcoScoreInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function EcoScoreInfoModal({ visible, onClose }: EcoScoreInfoModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <InfoModal
      visible={visible}
      onClose={onClose}
      title={t('infoModal.ecoscore.title')}
      icon="leaf"
      iconColor="#16a085"
    >
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {t('infoModal.ecoscore.description') || 'The Eco-Score is an environmental impact rating (A to E) that measures a product\'s ecological footprint based on life cycle assessment.'}
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('infoModal.ecoscore.whatItMeasures')}
        </Text>
        <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
          {t('infoModal.ecoscore.whatItMeasuresText')}
        </Text>

        {/* Calculation Formula */}
        <View style={[styles.formulaBox, { backgroundColor: '#16a085' + '15', borderColor: '#16a085' }]}>
          <View style={styles.formulaHeader}>
            <Ionicons name="calculator-outline" size={20} color="#16a085" />
            <Text style={[styles.formulaTitle, { color: colors.text }]}>
              {t('infoModal.ecoscore.calculationMethod')}
            </Text>
          </View>
          <View style={styles.formulaContent}>
            <Text style={[styles.formulaText, { color: colors.text }]}>
              {t('infoModal.ecoscore.formula')}
            </Text>
            <View style={styles.formulaBreakdown}>
              <View style={styles.formulaRow}>
                <View style={[styles.formulaFlag, { backgroundColor: '#16a085' }]}>
                  <Ionicons name="cloud-outline" size={14} color="#fff" />
                  <Text style={styles.formulaFlagText}>40%</Text>
                </View>
                <Text style={[styles.formulaLabel, { color: colors.textSecondary }]}>
                  {t('infoModal.ecoscore.co2Title')}
                </Text>
              </View>
              <View style={styles.formulaRow}>
                <View style={[styles.formulaFlag, { backgroundColor: '#4dd09f' }]}>
                  <Ionicons name="water-outline" size={14} color="#fff" />
                  <Text style={styles.formulaFlagText}>20%</Text>
                </View>
                <Text style={[styles.formulaLabel, { color: colors.textSecondary }]}>
                  {t('infoModal.ecoscore.waterTitle')}
                </Text>
              </View>
              <View style={styles.formulaRow}>
                <View style={[styles.formulaFlag, { backgroundColor: '#ffd93d' }]}>
                  <Ionicons name="warning-outline" size={14} color="#fff" />
                  <Text style={styles.formulaFlagText}>20%</Text>
                </View>
                <Text style={[styles.formulaLabel, { color: colors.textSecondary }]}>
                  {t('infoModal.ecoscore.deforestationTitle')}
                </Text>
              </View>
              <View style={styles.formulaRow}>
                <View style={[styles.formulaFlag, { backgroundColor: '#4dd09f' }]}>
                  <Ionicons name="planet-outline" size={14} color="#fff" />
                  <Text style={styles.formulaFlagText}>20%</Text>
                </View>
                <Text style={[styles.formulaLabel, { color: colors.textSecondary }]}>
                  {t('infoModal.ecoscore.biodiversityTitle')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Calculation Steps */}
        <View style={[styles.stepsBox, { backgroundColor: colors.surface }]}>
          <Text style={[styles.stepsTitle, { color: colors.text }]}>
            {t('infoModal.ecoscore.calculationSteps')}
          </Text>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: '#16a085' }]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              {t('infoModal.ecoscore.step1')}
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: '#16a085' }]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              {t('infoModal.ecoscore.step2')}
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: '#16a085' }]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              {t('infoModal.ecoscore.step3')}
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: '#16a085' }]}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              {t('infoModal.ecoscore.step4')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('infoModal.ecoscore.grades')}
        </Text>

        {/* Large Centered Grade Display */}
        <View style={styles.gradesDisplayContainer}>
          {(['A', 'B', 'C', 'D', 'E'] as const).map((grade) => {
            const gradeColors: Record<string, string> = {
              'A': '#16a085',
              'B': '#4dd09f',
              'C': '#ffd93d',
              'D': '#ff9800',
              'E': '#ff6b6b',
            };
            const color = gradeColors[grade];
            return (
              <View key={grade} style={[styles.largeGradeBadge, { backgroundColor: color }]}>
                <Text style={styles.largeGradeText}>{grade}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.gradeItem}>
          <View style={[styles.gradeBadge, { backgroundColor: '#16a085' }]}>
            <Text style={styles.gradeBadgeText}>A</Text>
          </View>
          <View style={styles.gradeContent}>
            <Text style={[styles.gradeLabel, { color: colors.text }]}>
              {t('ecoscore.excellent')}
            </Text>
            <Text style={[styles.gradeDescription, { color: colors.textSecondary }]}>
              {t('infoModal.ecoscore.gradeADesc')}
            </Text>
          </View>
        </View>

        <View style={styles.gradeItem}>
          <View style={[styles.gradeBadge, { backgroundColor: '#4dd09f' }]}>
            <Text style={styles.gradeBadgeText}>B</Text>
          </View>
          <View style={styles.gradeContent}>
            <Text style={[styles.gradeLabel, { color: colors.text }]}>
              {t('ecoscore.good')}
            </Text>
            <Text style={[styles.gradeDescription, { color: colors.textSecondary }]}>
              {t('infoModal.ecoscore.gradeBDesc')}
            </Text>
          </View>
        </View>

        <View style={styles.gradeItem}>
          <View style={[styles.gradeBadge, { backgroundColor: '#ffd93d' }]}>
            <Text style={styles.gradeBadgeText}>C</Text>
          </View>
          <View style={styles.gradeContent}>
            <Text style={[styles.gradeLabel, { color: colors.text }]}>
              {t('ecoscore.average')}
            </Text>
            <Text style={[styles.gradeDescription, { color: colors.textSecondary }]}>
              {t('infoModal.ecoscore.gradeCDesc')}
            </Text>
          </View>
        </View>

        <View style={styles.gradeItem}>
          <View style={[styles.gradeBadge, { backgroundColor: '#ff9800' }]}>
            <Text style={styles.gradeBadgeText}>D</Text>
          </View>
          <View style={styles.gradeContent}>
            <Text style={[styles.gradeLabel, { color: colors.text }]}>
              {t('ecoscore.poor')}
            </Text>
            <Text style={[styles.gradeDescription, { color: colors.textSecondary }]}>
              {t('infoModal.ecoscore.gradeDDesc')}
            </Text>
          </View>
        </View>

        <View style={styles.gradeItem}>
          <View style={[styles.gradeBadge, { backgroundColor: '#ff6b6b' }]}>
            <Text style={styles.gradeBadgeText}>E</Text>
          </View>
          <View style={styles.gradeContent}>
            <Text style={[styles.gradeLabel, { color: colors.text }]}>
              {t('ecoscore.veryPoor')}
            </Text>
            <Text style={[styles.gradeDescription, { color: colors.textSecondary }]}>
              {t('infoModal.ecoscore.gradeEDesc')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('infoModal.ecoscore.factors')}
        </Text>

        <View style={[styles.factorItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.factorIconContainer, { backgroundColor: '#16a085' + '30' }]}>
            <Ionicons name="cloud-outline" size={24} color="#16a085" />
          </View>
          <View style={styles.factorContent}>
            <View style={styles.factorHeader}>
              <Text style={[styles.factorTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.co2Title')}
              </Text>
              <View style={[styles.factorWeight, { backgroundColor: '#16a085' }]}>
                <Text style={styles.factorWeightText}>40%</Text>
              </View>
            </View>
            <Text style={[styles.factorDescription, { color: colors.textSecondary }]}>
              {t('infoModal.ecoscore.co2Desc')}
            </Text>
            <View style={styles.factorDetails}>
              <View style={styles.factorTag}>
                <Ionicons name="information-circle" size={12} color="#16a085" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  {t('infoModal.ecoscore.lifecycleAssessment')}
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="information-circle" size={12} color="#16a085" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  {t('infoModal.ecoscore.kgCo2e')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.factorItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.factorIconContainer, { backgroundColor: '#4dd09f' + '30' }]}>
            <Ionicons name="water-outline" size={24} color="#4dd09f" />
          </View>
          <View style={styles.factorContent}>
            <View style={styles.factorHeader}>
              <Text style={[styles.factorTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.waterTitle')}
              </Text>
              <View style={[styles.factorWeight, { backgroundColor: '#4dd09f' }]}>
                <Text style={styles.factorWeightText}>20%</Text>
              </View>
            </View>
            <Text style={[styles.factorDescription, { color: colors.textSecondary }]}>
              {t('infoModal.ecoscore.waterDesc')}
            </Text>
            <View style={styles.factorDetails}>
              <View style={styles.factorTag}>
                <Ionicons name="information-circle" size={12} color="#4dd09f" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  {t('infoModal.ecoscore.consumption')}
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="information-circle" size={12} color="#4dd09f" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  {t('infoModal.ecoscore.pollution')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.factorItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.factorIconContainer, { backgroundColor: '#ffd93d' + '30' }]}>
            <Ionicons name="warning-outline" size={24} color="#ffd93d" />
          </View>
          <View style={styles.factorContent}>
            <View style={styles.factorHeader}>
              <Text style={[styles.factorTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.deforestationTitle')}
              </Text>
              <View style={[styles.factorWeight, { backgroundColor: '#ffd93d' }]}>
                <Text style={styles.factorWeightText}>20%</Text>
              </View>
            </View>
            <Text style={[styles.factorDescription, { color: colors.textSecondary }]}>
              {t('infoModal.ecoscore.deforestationDesc')}
            </Text>
            <View style={styles.factorDetails}>
              <View style={styles.factorTag}>
                <Ionicons name="information-circle" size={12} color="#ffd93d" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  {t('infoModal.ecoscore.palmOilRisk')}
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="information-circle" size={12} color="#ffd93d" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  {t('infoModal.ecoscore.soyCocoaRisk')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.factorItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.factorIconContainer, { backgroundColor: '#4dd09f' + '30' }]}>
            <Ionicons name="planet-outline" size={24} color="#4dd09f" />
          </View>
          <View style={styles.factorContent}>
            <View style={styles.factorHeader}>
              <Text style={[styles.factorTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.biodiversityTitle')}
              </Text>
              <View style={[styles.factorWeight, { backgroundColor: '#4dd09f' }]}>
                <Text style={styles.factorWeightText}>20%</Text>
              </View>
            </View>
            <Text style={[styles.factorDescription, { color: colors.textSecondary }]}>
              {t('infoModal.ecoscore.biodiversityDesc')}
            </Text>
            <View style={styles.factorDetails}>
              <View style={styles.factorTag}>
                <Ionicons name="information-circle" size={12} color="#4dd09f" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  {t('infoModal.ecoscore.speciesDiversity')}
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="information-circle" size={12} color="#4dd09f" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  {t('infoModal.ecoscore.habitatImpact')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Red Flags & Green Flags */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('infoModal.ecoscore.flags')}
        </Text>
        <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
          {t('infoModal.ecoscore.flagsDescription')}
        </Text>

        {/* Red Flags */}
        <View style={[styles.flagsContainer, { backgroundColor: '#ff6b6b' + '15', borderColor: '#ff6b6b' }]}>
          <View style={styles.flagsHeader}>
            <Ionicons name="flag" size={20} color="#ff6b6b" />
            <Text style={[styles.flagsTitle, { color: colors.text }]}>
              {t('infoModal.ecoscore.redFlags')}
            </Text>
          </View>
          <Text style={[styles.flagsSubtitle, { color: colors.textSecondary }]}>
            {t('infoModal.ecoscore.redFlagsDesc')}
          </Text>
          
          <View style={styles.flagItem}>
            <Ionicons name="warning" size={16} color="#ff6b6b" />
            <View style={styles.flagContent}>
              <Text style={[styles.flagTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.flagGeopolitics')}
              </Text>
              <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                {t('infoModal.ecoscore.flagGeopoliticsDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.flagItem}>
            <Ionicons name="newspaper-outline" size={16} color="#ff6b6b" />
            <View style={styles.flagContent}>
              <Text style={[styles.flagTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.flagNegativeNews')}
              </Text>
              <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                {t('infoModal.ecoscore.flagNegativeNewsDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.flagItem}>
            <Ionicons name="people-outline" size={16} color="#ff6b6b" />
            <View style={styles.flagContent}>
              <Text style={[styles.flagTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.flagBoycott')}
              </Text>
              <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                {t('infoModal.ecoscore.flagBoycottDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.flagItem}>
            <Ionicons name="leaf-outline" size={16} color="#ff6b6b" />
            <View style={styles.flagContent}>
              <Text style={[styles.flagTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.flagSustainabilityIssues')}
              </Text>
              <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                {t('infoModal.ecoscore.flagSustainabilityIssuesDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.flagItem}>
            <Ionicons name="heart-outline" size={16} color="#ff6b6b" />
            <View style={styles.flagContent}>
              <Text style={[styles.flagTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.flagEthicsIssues')}
              </Text>
              <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                {t('infoModal.ecoscore.flagEthicsIssuesDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.flagItem}>
            <Ionicons name="nutrition-outline" size={16} color="#ff6b6b" />
            <View style={styles.flagContent}>
              <Text style={[styles.flagTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.flagNutritionIssues')}
              </Text>
              <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                {t('infoModal.ecoscore.flagNutritionIssuesDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.flagItem}>
            <Ionicons name="build-outline" size={16} color="#ff6b6b" />
            <View style={styles.flagContent}>
              <Text style={[styles.flagTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.flagProcessingIssues')}
              </Text>
              <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                {t('infoModal.ecoscore.flagProcessingIssuesDesc')}
              </Text>
            </View>
          </View>
        </View>

        {/* Green Flags */}
        <View style={[styles.flagsContainer, { backgroundColor: '#16a085' + '15', borderColor: '#16a085', marginTop: 16 }]}>
          <View style={styles.flagsHeader}>
            <Ionicons name="checkmark-circle" size={20} color="#16a085" />
            <Text style={[styles.flagsTitle, { color: colors.text }]}>
              {t('infoModal.ecoscore.greenFlags')}
            </Text>
          </View>
          <Text style={[styles.flagsSubtitle, { color: colors.textSecondary }]}>
            {t('infoModal.ecoscore.greenFlagsDesc')}
          </Text>
          
          <View style={styles.flagItem}>
            <Ionicons name="leaf" size={16} color="#16a085" />
            <View style={styles.flagContent}>
              <Text style={[styles.flagTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.flagSustainabilityPositive')}
              </Text>
              <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                {t('infoModal.ecoscore.flagSustainabilityPositiveDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.flagItem}>
            <Ionicons name="heart" size={16} color="#16a085" />
            <View style={styles.flagContent}>
              <Text style={[styles.flagTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.flagEthicsPositive')}
              </Text>
              <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                {t('infoModal.ecoscore.flagEthicsPositiveDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.flagItem}>
            <Ionicons name="nutrition" size={16} color="#16a085" />
            <View style={styles.flagContent}>
              <Text style={[styles.flagTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.flagNutritionPositive')}
              </Text>
              <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                {t('infoModal.ecoscore.flagNutritionPositiveDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.flagItem}>
            <Ionicons name="build" size={16} color="#16a085" />
            <View style={styles.flagContent}>
              <Text style={[styles.flagTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.flagProcessingPositive')}
              </Text>
              <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                {t('infoModal.ecoscore.flagProcessingPositiveDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.flagItem}>
            <Ionicons name="star" size={16} color="#16a085" />
            <View style={styles.flagContent}>
              <Text style={[styles.flagTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.flagCertifications')}
              </Text>
              <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                {t('infoModal.ecoscore.flagCertificationsDesc')}
              </Text>
            </View>
          </View>

          <View style={styles.flagItem}>
            <Ionicons name="thumbs-up" size={16} color="#16a085" />
            <View style={styles.flagContent}>
              <Text style={[styles.flagTitle, { color: colors.text }]}>
                {t('infoModal.ecoscore.flagPositiveReviews')}
              </Text>
              <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                {t('infoModal.ecoscore.flagPositiveReviewsDesc')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.note, { backgroundColor: colors.primary + '20' }]}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={[styles.noteText, { color: colors.text }]}>
          {t('infoModal.ecoscore.note')}
        </Text>
      </View>
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  gradeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  gradeBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  gradeContent: {
    flex: 1,
  },
  gradeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  gradeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  factorItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  factorContent: {
    flex: 1,
  },
  factorTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  factorDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  note: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginTop: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  formulaBox: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 2,
  },
  formulaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  formulaTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  formulaContent: {
    marginTop: 8,
  },
  formulaText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  formulaBreakdown: {
    gap: 8,
  },
  formulaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  formulaFlag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
    minWidth: 60,
  },
  formulaFlagText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  formulaLabel: {
    fontSize: 14,
    flex: 1,
  },
  stepsBox: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  stepsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  factorIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  factorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  factorWeight: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  factorWeightText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  factorDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  factorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  factorTagText: {
    fontSize: 12,
  },
  gradesDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingVertical: 16,
  },
  largeGradeBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  largeGradeText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  flagsContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    marginTop: 12,
  },
  flagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  flagsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  flagsSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  flagContent: {
    flex: 1,
  },
  flagTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  flagDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});

