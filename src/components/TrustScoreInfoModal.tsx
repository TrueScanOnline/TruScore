import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import InfoModal from './InfoModal';
import { useTheme } from '../theme';
import { ProductWithTrustScore } from '../types/product';
import { consumerPillarLabel } from '../lib/scoreHighlights';

interface TruScoreInfoModalProps {
  visible: boolean;
  onClose: () => void;
  product?: ProductWithTrustScore | null;
}

export default function TruScoreInfoModal({ visible, onClose, product }: TruScoreInfoModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const s27Prefix = '[Awaiting founder edit]';
  const rawTitle = t('infoModal.trustScore.title') || 'Understanding Rveel Score';
  const title = rawTitle.startsWith(s27Prefix) ? rawTitle : `${s27Prefix} ${rawTitle}`;
  const rawDescription =
    t('infoModal.trustScore.description') ||
    'Rveel Score is a comprehensive rating (0-100) based entirely on recognized public systems. Four equal pillars (25 points each): Body, Planet, Claims, and Transparency.';
  const description = rawDescription.startsWith(s27Prefix)
    ? rawDescription
    : `${s27Prefix} ${rawDescription}`;

  return (
    <InfoModal
      visible={visible}
      onClose={onClose}
      title={title}
      icon="shield-checkmark"
      iconColor={colors.primary}
    >
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {description}
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('infoModal.trustScore.howItWorks')}
        </Text>
        <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
          {t('infoModal.trustScore.howItWorksText')}
        </Text>
        
        {/* Calculation Formula */}
        <View style={[styles.formulaBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
          <View style={styles.formulaHeader}>
            <Ionicons name="calculator-outline" size={20} color={colors.primary} />
            <Text style={[styles.formulaTitle, { color: colors.text }]}>
              {t('infoModal.trustScore.calculationFormula')}
            </Text>
          </View>
          <View style={styles.formulaContent}>
            <Text style={[styles.formulaText, { color: colors.text }]}>
              {t('infoModal.trustScore.formula') || 'Rveel Score = Body (25) + Planet (25) + Claims (25) + Transparency (25) = 0-100'}
            </Text>
            <Text style={[styles.formulaSubtext, { color: colors.textSecondary }]}>
              100% based on recognized public systems (Nutri-Score, Eco-Score, NOVA, OFF labels)
            </Text>
            <View style={styles.formulaBreakdown}>
              <View style={styles.formulaRow}>
                <View style={[styles.formulaFlag, { backgroundColor: '#4dd09f' }]}>
                  <Ionicons name="shield" size={14} color="#fff" />
                  <Text style={styles.formulaFlagText}>25</Text>
                </View>
                <Text style={[styles.formulaLabel, { color: colors.textSecondary }]}>
                  {consumerPillarLabel('Body')} - Nutri-Score + NOVA + additives
                </Text>
              </View>
              <View style={styles.formulaRow}>
                <View style={[styles.formulaFlag, { backgroundColor: '#16a085' }]}>
                  <Ionicons name="leaf" size={14} color="#fff" />
                  <Text style={styles.formulaFlagText}>25</Text>
                </View>
                <Text style={[styles.formulaLabel, { color: colors.textSecondary }]}>
                  {consumerPillarLabel('Planet')} - Eco-Score (v19); packaging fallback only if Eco-Score missing
                </Text>
              </View>
              <View style={styles.formulaRow}>
                <View style={[styles.formulaFlag, { backgroundColor: '#ff6b6b' }]}>
                  <Ionicons name="heart" size={14} color="#fff" />
                  <Text style={styles.formulaFlagText}>25</Text>
                </View>
                <Text style={[styles.formulaLabel, { color: colors.textSecondary }]}>
                  {consumerPillarLabel('Ethics')} - Certifications + ethical labels
                </Text>
              </View>
              <View style={styles.formulaRow}>
                <View style={[styles.formulaFlag, { backgroundColor: '#9b59b6' }]}>
                  <Ionicons name="eye" size={14} color="#fff" />
                  <Text style={styles.formulaFlagText}>25</Text>
                </View>
                <Text style={[styles.formulaLabel, { color: colors.textSecondary }]}>
                  {consumerPillarLabel('Open')} - Ingredient disclosure transparency
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Calculation steps — Rveel Score methodology */}
        <View style={[styles.stepsBox, { backgroundColor: colors.surface }]}>
          <Text style={[styles.stepsTitle, { color: colors.text }]}>
            {t('infoModal.trustScore.calculationSteps') || 'How Rveel Score is calculated'}
          </Text>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: '#4dd09f' }]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.step1') || 'Calculate Body score (0-25) using Nutri-Score, NOVA classification, additives, and allergens'}
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: '#16a085' }]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.step2') || 'Calculate Planet score (0–25): Eco-Score mapping when grade exists; otherwise packaging fallback (+2/+1/0) per Planet v19 Annex v2. Palm is display-only on Planet in MVP.'}
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: '#ff6b6b' }]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.step3') || 'Calculate Claims score (0-25) using certifications, animal cruelty detection, labor violations, and recalls. Base 15, certifications up to +15, penalties for violations.'}
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: '#9b59b6' }]}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.step4') || 'Calculate Transparency score (0-25) from ingredient-list disclosure evidence and origin completeness where available'}
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>5</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.step5') || 'Sum all four pillars: Rveel Score = Body + Planet + Claims + Transparency (0-100 total)'}
            </Text>
          </View>
        </View>
      </View>

      {/* Data Quality / Confidence Section — legacy source-based High/Medium/Low removed.
          Wave 3 governed High/Moderate/Limited publication Confidence is the only consumer model
          (ConfidenceBadge / S26). Unrelated source/provenance elsewhere is unchanged. */}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('infoModal.trustScore.categories')}
        </Text>

        {/* Planet — Rveel Score pillar #2 */}
        <View style={[styles.categoryItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.categoryIconContainer, { backgroundColor: '#16a085' + '30' }]}>
            <Ionicons name="leaf" size={24} color="#16a085" />
          </View>
          <View style={styles.categoryContent}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {consumerPillarLabel('Planet')}
              </Text>
              <View style={[styles.categoryWeight, { backgroundColor: '#16a085' }]}>
                <Text style={styles.categoryWeightText}>25</Text>
              </View>
            </View>
            <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.planetDesc')}
            </Text>
            <View style={styles.categoryFactors}>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#16a085" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  Eco-Score A +7, B +3, C −1, D −3, E −7 (from base 15)
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#16a085" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  Packaging fallback +2 / +1 / 0 only when Eco-Score grade is missing (AU/NZ kerbside rules)
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#16a085" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  Palm oil: shown in product context; 0 Planet points in MVP (v19)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ethics — Rveel Score pillar #3 */}
        <View style={[styles.categoryItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.categoryIconContainer, { backgroundColor: '#ff6b6b' + '30' }]}>
            <Ionicons name="heart" size={24} color="#ff6b6b" />
          </View>
          <View style={styles.categoryContent}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {consumerPillarLabel('Ethics')}
              </Text>
              <View style={[styles.categoryWeight, { backgroundColor: '#ff6b6b' }]}>
                <Text style={styles.categoryWeightText}>25</Text>
              </View>
            </View>
            <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.ethicsDesc')}
            </Text>
            <View style={styles.categoryFactors}>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#ff6b6b" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  Base 15, then BBFAW (animal welfare), KTC (labour / supply chains), certifications
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#ff6b6b" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  Certifications (highest scheme only): Fairtrade +6, Rainforest/UTZ +6, ASC +4, MSC +4, Organic +2 (RSPO does not score)
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#ff6b6b" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  Organic requires a recognised certifier; MSC uses the official API when configured
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="close-circle" size={12} color="#ff6b6b" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  Pillar score capped 0–25 after all adjustments
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Body — Rveel Score pillar #1 */}
        <View style={[styles.categoryItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.categoryIconContainer, { backgroundColor: '#4dd09f' + '30' }]}>
            <Ionicons name="shield" size={24} color="#4dd09f" />
          </View>
          <View style={styles.categoryContent}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {consumerPillarLabel('Body')}
              </Text>
              <View style={[styles.categoryWeight, { backgroundColor: '#4dd09f' }]}>
                <Text style={styles.categoryWeightText}>25</Text>
              </View>
            </View>
            <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.bodyDesc')}
            </Text>
            <View style={styles.categoryFactors}>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#4dd09f" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  {t('infoModal.trustScore.nutriScore')} (when available)
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#4dd09f" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  NOVA classification (when available)
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#4dd09f" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  Food additives of concern (governed MVP registry when evidence is present)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Open - Ingredient Transparency */}
        <View style={[styles.categoryItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.categoryIconContainer, { backgroundColor: '#9b59b6' + '30' }]}>
            <Ionicons name="eye" size={24} color="#9b59b6" />
          </View>
          <View style={styles.categoryContent}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {consumerPillarLabel('Open')}
              </Text>
              <View style={[styles.categoryWeight, { backgroundColor: '#9b59b6' }]}>
                <Text style={styles.categoryWeightText}>25</Text>
              </View>
            </View>
            <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.openDesc')}
            </Text>
            <View style={styles.categoryFactors}>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#9b59b6" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  {t('infoModal.trustScore.ingredientDisclosure')}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Note: Processing Level (NOVA) is now part of Body pillar but displayed separately for education */}
      </View>

      {/* Data Sources & Methodology */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('infoModal.trustScore.dataSources')}
        </Text>
        <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
          {t('infoModal.trustScore.dataSourcesDescription')}
        </Text>
        
        <View style={[styles.sourceBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
          <Text style={[styles.sourceTitle, { color: colors.text }]}>
            {t('infoModal.trustScore.bodySource')}
          </Text>
          <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
            • Body uses Nutri-Score and NOVA classification when those signals are available from Open Food Facts{'\n'}
            • A governed food-additives-of-concern registry may adjust Body when evidence is present{'\n'}
            • Source: Open Food Facts API ingredients and nutrition fields
          </Text>
        </View>

        <View style={[styles.sourceBox, { backgroundColor: '#16a085' + '15', borderColor: '#16a085', marginTop: 12 }]}>
          <Text style={[styles.sourceTitle, { color: colors.text }]}>
            {t('infoModal.trustScore.planetSource') || 'Planet Pillar (0-25 points)'}
          </Text>
          <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
            • Planet_Scoring_Specification_v19: base 15; Eco-Score grades A–E adjust by +7, +3, −1, −3, −7 when ecoscore_grade is present{'\n'}
            • If Eco-Score is applied, packaging is not scored separately on Planet{'\n'}
            • Packaging fallback (Eco-Score absent): +2 / +1 / 0 from OFF packaging fields per Planet_v19_Packaging_Jurisdiction_Rules_Annex_v2 (AU/NZ kerbside; GLOBAL → 0){'\n'}
            • Palm / deforestation: display only in MVP — no Planet pillar adjustment from palm alone (v19){'\n'}
            • Source: Open Food Facts (Eco-Score + packaging components)
          </Text>
        </View>

        <View style={[styles.sourceBox, { backgroundColor: '#ff6b6b' + '15', borderColor: '#ff6b6b', marginTop: 12 }]}>
          <Text style={[styles.sourceTitle, { color: colors.text }]}>
            {t('infoModal.trustScore.ethicsSource')}
          </Text>
          <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
            • Base score: 15 (neutral until data adjusts it){'\n'}
            • BBFAW 2024: tier and impact rating adjustments (animal welfare governance & outcomes){'\n'}
            • KnowTheChain Food & Beverage benchmark: total benchmark score bands (labour / supply chain){'\n'}
            • Certifications (OFF labels + optional MSC API): Fairtrade +6, Rainforest Alliance/UTZ +6, ASC +4, MSC +4, Organic +2 — highest eligible scheme only in MVP (no stacking); RSPO does not contribute Claims points{'\n'}
            • Organic requires a recognised certifier signal; MSC positive credit follows the MSC Data Validation API when enabled{'\n'}
            • Final Claims pillar is floored at 0 and capped at 25{'\n'}
            • Source: Claims Pillar spec sheet + BBFAW report + KnowTheChain + Open Food Facts (+ MSC API when licensed)
          </Text>
        </View>

        <View style={[styles.sourceBox, { backgroundColor: '#9b59b6' + '15', borderColor: '#9b59b6', marginTop: 12 }]}>
          <Text style={[styles.sourceTitle, { color: colors.text }]}>
            {t('infoModal.trustScore.openSource') || 'Transparency Pillar (0-25 points)'}
          </Text>
          <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
            • Ingredient-list disclosure evidence from the product label text{'\n'}
            • Origin completeness where structured origin evidence is available{'\n'}
            • Source: Open Food Facts API ingredients_text and origins fields where present
          </Text>
        </View>

        <View style={[styles.note, { backgroundColor: colors.primary + '20', marginTop: 16 }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.noteText, { color: colors.text }]}>
            {t('infoModal.trustScore.transparencyNote')}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('infoModal.trustScore.scoring') || 'Rveel Score ranges'}
        </Text>
        <Text style={[styles.sectionText, { color: colors.textSecondary, marginBottom: 16 }]}>
          {t('infoModal.trustScore.scoringDescription') || 'Rveel Score ranges from 0-100, with each of the 4 pillars contributing 0-25 points. Higher scores indicate better overall product quality across all dimensions.'}
        </Text>
        
        <View style={styles.scoreItem}>
          <View style={[styles.scoreBadge, { backgroundColor: '#16a085' }]}>
            <Text style={styles.scoreBadgeText}>80-100</Text>
          </View>
          <View style={styles.scoreLabelContainer}>
            <Text style={[styles.scoreLabel, { color: colors.text, fontWeight: '600' }]}>
              {t('trust.excellent') || 'Excellent'} - 80-100 points
            </Text>
            <Text style={[styles.scoreDescription, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.excellentDesc') || 'Outstanding quality across all 4 pillars (Body, Planet, Claims, Transparency). These products excel in nutrition, sustainability, ethical signals, and disclosure.'}
            </Text>
          </View>
        </View>

        <View style={styles.scoreItem}>
          <View style={[styles.scoreBadge, { backgroundColor: '#4dd09f' }]}>
            <Text style={styles.scoreBadgeText}>60-79</Text>
          </View>
          <View style={styles.scoreLabelContainer}>
            <Text style={[styles.scoreLabel, { color: colors.text, fontWeight: '600' }]}>
              {t('trust.good') || 'Good'} - 60-79 points
            </Text>
            <Text style={[styles.scoreDescription, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.goodDesc') || 'Above-average quality with strong performance in most pillars. Good choice for conscious consumers.'}
            </Text>
          </View>
        </View>

        <View style={styles.scoreItem}>
          <View style={[styles.scoreBadge, { backgroundColor: '#ffd93d' }]}>
            <Text style={styles.scoreBadgeText}>40-59</Text>
          </View>
          <View style={styles.scoreLabelContainer}>
            <Text style={[styles.scoreLabel, { color: colors.text, fontWeight: '600' }]}>
              {t('trust.fair') || 'Fair'} - 40-59 points
            </Text>
            <Text style={[styles.scoreDescription, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.fairDesc') || 'Moderate quality with room for improvement. Acceptable but not exceptional in key areas.'}
            </Text>
          </View>
        </View>

        <View style={styles.scoreItem}>
          <View style={[styles.scoreBadge, { backgroundColor: '#ff6b6b' }]}>
            <Text style={styles.scoreBadgeText}>0-39</Text>
          </View>
          <View style={styles.scoreLabelContainer}>
            <Text style={[styles.scoreLabel, { color: colors.text, fontWeight: '600' }]}>
              {t('trust.poor') || 'Poor'} - 0-39 points
            </Text>
            <Text style={[styles.scoreDescription, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.poorDesc') || 'Below-average quality. These products may have significant issues in Body safety, Planet sustainability, Claims, or Transparency.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Red Flags & Green Flags */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('infoModal.trustScore.flags')}
        </Text>
        <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
          {t('infoModal.trustScore.flagsDescription')}
        </Text>

        {/* Generic flag descriptions (educational) */}
        <>
            {/* Red Flags */}
            <View style={[styles.flagsContainer, { backgroundColor: '#ff6b6b' + '15', borderColor: '#ff6b6b', marginTop: 12 }]}>
              <View style={styles.flagsHeader}>
                <Ionicons name="flag" size={20} color="#ff6b6b" />
                <Text style={[styles.flagsTitle, { color: colors.text }]}>
                  {t('infoModal.trustScore.redFlags')}
                </Text>
              </View>
              <Text style={[styles.flagsSubtitle, { color: colors.textSecondary }]}>
                {t('infoModal.trustScore.redFlagsDesc')}
              </Text>
              
              <View style={styles.flagItem}>
                <Ionicons name="warning" size={16} color="#ff6b6b" />
                <View style={styles.flagContent}>
                  <Text style={[styles.flagTitle, { color: colors.text }]}>
                    {t('infoModal.trustScore.flagGeopolitics')}
                  </Text>
                  <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                    {t('infoModal.trustScore.flagGeopoliticsDesc')}
                  </Text>
                </View>
              </View>

              <View style={styles.flagItem}>
                <Ionicons name="newspaper-outline" size={16} color="#ff6b6b" />
                <View style={styles.flagContent}>
                  <Text style={[styles.flagTitle, { color: colors.text }]}>
                    {t('infoModal.trustScore.flagNegativeNews')}
                  </Text>
                  <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                    {t('infoModal.trustScore.flagNegativeNewsDesc')}
                  </Text>
                </View>
              </View>

              <View style={styles.flagItem}>
                <Ionicons name="people-outline" size={16} color="#ff6b6b" />
                <View style={styles.flagContent}>
                  <Text style={[styles.flagTitle, { color: colors.text }]}>
                    {t('infoModal.trustScore.flagBoycott')}
                  </Text>
                  <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                    {t('infoModal.trustScore.flagBoycottDesc')}
                  </Text>
                </View>
              </View>

              <View style={styles.flagItem}>
                <Ionicons name="leaf-outline" size={16} color="#ff6b6b" />
                <View style={styles.flagContent}>
                  <Text style={[styles.flagTitle, { color: colors.text }]}>
                    {t('infoModal.trustScore.flagSustainabilityIssues')}
                  </Text>
                  <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                    {t('infoModal.trustScore.flagSustainabilityIssuesDesc')}
                  </Text>
                </View>
              </View>

              <View style={styles.flagItem}>
                <Ionicons name="heart-outline" size={16} color="#ff6b6b" />
                <View style={styles.flagContent}>
                  <Text style={[styles.flagTitle, { color: colors.text }]}>
                    {t('infoModal.trustScore.flagEthicsIssues')}
                  </Text>
                  <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                    {t('infoModal.trustScore.flagEthicsIssuesDesc')}
                  </Text>
                </View>
              </View>

              <View style={styles.flagItem}>
                <Ionicons name="shield-outline" size={16} color="#ff6b6b" />
                <View style={styles.flagContent}>
                  <Text style={[styles.flagTitle, { color: colors.text }]}>
                    {t('infoModal.trustScore.flagNutritionIssues')}
                  </Text>
                  <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                    {t('infoModal.trustScore.flagNutritionIssuesDesc')}
                  </Text>
                </View>
              </View>

              <View style={styles.flagItem}>
                <Ionicons name="build-outline" size={16} color="#ff6b6b" />
                <View style={styles.flagContent}>
                  <Text style={[styles.flagTitle, { color: colors.text }]}>
                    {t('infoModal.trustScore.flagProcessingIssues')}
                  </Text>
                  <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                    {t('infoModal.trustScore.flagProcessingIssuesDesc')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Green Flags */}
            <View style={[styles.flagsContainer, { backgroundColor: '#16a085' + '15', borderColor: '#16a085', marginTop: 16 }]}>
              <View style={styles.flagsHeader}>
                <Ionicons name="checkmark-circle" size={20} color="#16a085" />
                <Text style={[styles.flagsTitle, { color: colors.text }]}>
                  {t('infoModal.trustScore.greenFlags')}
                </Text>
              </View>
              <Text style={[styles.flagsSubtitle, { color: colors.textSecondary }]}>
                {t('infoModal.trustScore.greenFlagsDesc')}
              </Text>
              
              <View style={styles.flagItem}>
                <Ionicons name="leaf" size={16} color="#16a085" />
                <View style={styles.flagContent}>
                  <Text style={[styles.flagTitle, { color: colors.text }]}>
                    {t('infoModal.trustScore.flagSustainabilityPositive')}
                  </Text>
                  <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                    {t('infoModal.trustScore.flagSustainabilityPositiveDesc')}
                  </Text>
                </View>
              </View>

              <View style={styles.flagItem}>
                <Ionicons name="heart" size={16} color="#16a085" />
                <View style={styles.flagContent}>
                  <Text style={[styles.flagTitle, { color: colors.text }]}>
                    {t('infoModal.trustScore.flagEthicsPositive')}
                  </Text>
                  <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                    {t('infoModal.trustScore.flagEthicsPositiveDesc')}
                  </Text>
                </View>
              </View>

              <View style={styles.flagItem}>
                <Ionicons name="shield" size={16} color="#16a085" />
                <View style={styles.flagContent}>
                  <Text style={[styles.flagTitle, { color: colors.text }]}>
                    {t('infoModal.trustScore.flagNutritionPositive')}
                  </Text>
                  <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                    {t('infoModal.trustScore.flagNutritionPositiveDesc')}
                  </Text>
                </View>
              </View>

              <View style={styles.flagItem}>
                <Ionicons name="build" size={16} color="#16a085" />
                <View style={styles.flagContent}>
                  <Text style={[styles.flagTitle, { color: colors.text }]}>
                    {t('infoModal.trustScore.flagProcessingPositive')}
                  </Text>
                  <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                    {t('infoModal.trustScore.flagProcessingPositiveDesc')}
                  </Text>
                </View>
              </View>

              <View style={styles.flagItem}>
                <Ionicons name="star" size={16} color="#16a085" />
                <View style={styles.flagContent}>
                  <Text style={[styles.flagTitle, { color: colors.text }]}>
                    {t('infoModal.trustScore.flagCertifications')}
                  </Text>
                  <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                    {t('infoModal.trustScore.flagCertificationsDesc')}
                  </Text>
                </View>
              </View>
            </View>
        </>
      </View>

      {/* Full Transparency Note */}
      <View style={[styles.note, { backgroundColor: colors.primary + '20', marginTop: 16 }]}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <View style={styles.noteContent}>
          <Text style={[styles.noteTitle, { color: colors.text }]}>
            {t('infoModal.trustScore.transparencyTitle') || '100% Transparent Methodology'}
          </Text>
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            {t('infoModal.trustScore.note') || 'Rveel Score v1.4 is calculated from available Open Food Facts and other product data using recognized public systems (Nutri-Score, Eco-Score, NOVA, Open Food Facts labels) across Body, Planet, Claims, and Transparency. Scores are shown when sufficient verified data is available.'}
          </Text>
          <Text style={[styles.noteText, { color: colors.textSecondary, marginTop: 8 }]}>
            {t('infoModal.trustScore.dataSourceNote') || 'Data Sources: Open Food Facts (world.openfoodfacts.org), UPCitemdb (api.upcitemdb.com), Barcode Spider, FDA Food Recall API (fda.gov/food/recalls). All calculations are transparent and verifiable.'}
          </Text>
        </View>
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
  categoryItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  scoreBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  scoreLabelContainer: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  scoreDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  note: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginTop: 8,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  noteText: {
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
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  formulaSubtext: {
    fontSize: 13,
    fontStyle: 'italic',
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
  confidenceBox: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  confidenceItem: {
    marginBottom: 12,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginBottom: 6,
  },
  confidenceLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  confidenceDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginLeft: 2,
    flexWrap: 'wrap',
  },
  confidenceScoreRange: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sourceList: {
    marginTop: 8,
    paddingLeft: 8,
  },
  sourceListTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  sourceListItem: {
    fontSize: 13,
    lineHeight: 20,
  },
  noteBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    alignItems: 'flex-start',
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
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryWeight: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryWeightText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  categoryFactors: {
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
  sourceBox: {
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 2,
  },
  sourceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sourceText: {
    fontSize: 13,
    lineHeight: 20,
  },
});

