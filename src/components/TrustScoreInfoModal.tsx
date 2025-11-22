import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import InfoModal from './InfoModal';
import { useTheme } from '../theme';
import { ProductWithTrustScore } from '../types/product';
import { generateProductFlags } from '../utils/productFlags';

interface TrustScoreInfoModalProps {
  visible: boolean;
  onClose: () => void;
  product?: ProductWithTrustScore | null;
}

// Helper function to get icon name for flag category
function getFlagIcon(category: string): any {
  const iconMap: Record<string, any> = {
    'geopolitics': 'globe-outline',
    'news': 'newspaper-outline',
    'boycott': 'people-outline',
    'sustainability': 'leaf-outline',
    'ethics': 'heart-outline',
    'nutrition': 'shield-outline',
    'processing': 'build-outline',
  };
  return iconMap[category] || 'information-circle-outline';
}

export default function TrustScoreInfoModal({ visible, onClose, product }: TrustScoreInfoModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  // Generate flags if product is provided
  const productFlags = product ? generateProductFlags(product) : [];
  const greenFlags = productFlags.filter(f => f.type === 'green');
  const redFlags = productFlags.filter(f => f.type === 'red');

  return (
    <InfoModal
      visible={visible}
      onClose={onClose}
      title={t('infoModal.trustScore.title')}
      icon="shield-checkmark"
      iconColor={colors.primary}
    >
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {t('infoModal.trustScore.description') || 'TruScore is a comprehensive rating (0-100) based entirely on recognized public systems. Four equal pillars (25 points each): Body, Planet, Care, and Open.'}
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
              {t('infoModal.trustScore.formula') || 'TruScore = Body (25) + Planet (25) + Care (25) + Open (25) = 0-100'}
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
                  {t('result.body')} - Nutri-Score + NOVA + additives
                </Text>
              </View>
              <View style={styles.formulaRow}>
                <View style={[styles.formulaFlag, { backgroundColor: '#16a085' }]}>
                  <Ionicons name="leaf" size={14} color="#fff" />
                  <Text style={styles.formulaFlagText}>25</Text>
                </View>
                <Text style={[styles.formulaLabel, { color: colors.textSecondary }]}>
                  {t('result.planet')} - Eco-Score + packaging + palm oil
                </Text>
              </View>
              <View style={styles.formulaRow}>
                <View style={[styles.formulaFlag, { backgroundColor: '#ff6b6b' }]}>
                  <Ionicons name="heart" size={14} color="#fff" />
                  <Text style={styles.formulaFlagText}>25</Text>
                </View>
                <Text style={[styles.formulaLabel, { color: colors.textSecondary }]}>
                  {t('result.care')} - Certifications + ethical labels
                </Text>
              </View>
              <View style={styles.formulaRow}>
                <View style={[styles.formulaFlag, { backgroundColor: '#9b59b6' }]}>
                  <Ionicons name="eye" size={14} color="#fff" />
                  <Text style={styles.formulaFlagText}>25</Text>
                </View>
                <Text style={[styles.formulaLabel, { color: colors.textSecondary }]}>
                  {t('result.open')} - Ingredient disclosure transparency
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Calculation Steps - TruScore Methodology */}
        <View style={[styles.stepsBox, { backgroundColor: colors.surface }]}>
          <Text style={[styles.stepsTitle, { color: colors.text }]}>
            {t('infoModal.trustScore.calculationSteps') || 'How TruScore is Calculated'}
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
              {t('infoModal.trustScore.step2') || 'Calculate Planet score (0-25) using Eco-Score, packaging recyclability, and palm oil detection'}
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: '#ff6b6b' }]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.step3') || 'Calculate Care score (0-25) using certifications (Fairtrade, Organic, MSC, etc.) with explicit bonuses'}
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: '#9b59b6' }]}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.step4') || 'Calculate Open score (0-25) by detecting hidden ingredient terms (parfum, fragrance, proprietary blend)'}
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>5</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.step5') || 'Sum all four pillars: TruScore = Body + Planet + Care + Open (0-100 total)'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('infoModal.trustScore.categories')}
        </Text>

        {/* Planet - TruScore Pillar #2 */}
        <View style={[styles.categoryItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.categoryIconContainer, { backgroundColor: '#16a085' + '30' }]}>
            <Ionicons name="leaf" size={24} color="#16a085" />
          </View>
          <View style={styles.categoryContent}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {t('result.planet')}
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
                  Eco-Score (A=25, B=20, C=15, D=10, E=5)
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#16a085" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  Packaging Recyclability (+5 if fully recyclable)
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#16a085" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  Palm Oil Detection (-8 if non-sustainable)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Care - TruScore Pillar #3 */}
        <View style={[styles.categoryItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.categoryIconContainer, { backgroundColor: '#ff6b6b' + '30' }]}>
            <Ionicons name="heart" size={24} color="#ff6b6b" />
          </View>
          <View style={styles.categoryContent}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {t('result.care')}
              </Text>
              <View style={[styles.categoryWeight, { backgroundColor: '#ff6b6b' }]}>
                <Text style={styles.categoryWeightText}>25</Text>
              </View>
            </View>
            <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
              {t('infoModal.trustScore.careDesc')}
            </Text>
            <View style={styles.categoryFactors}>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#ff6b6b" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  Fairtrade (+8), EU Organic (+7), MSC/ASC (+6)
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#ff6b6b" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  Rainforest Alliance (+6), RSPCA Assured (+5)
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#ff6b6b" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  Multiple labels stack up to +25 max
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Body - TruScore Pillar #1 */}
        <View style={[styles.categoryItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.categoryIconContainer, { backgroundColor: '#4dd09f' + '30' }]}>
            <Ionicons name="shield" size={24} color="#4dd09f" />
          </View>
          <View style={styles.categoryContent}>
            <View style={styles.categoryHeader}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {t('result.body')}
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
                  {t('infoModal.trustScore.nutriScore')} (A=25, B=20, C=15, D=10, E=5)
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#4dd09f" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  NOVA Classification (1=+3, 3=-5, 4=-10)
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#4dd09f" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  Additives (weighted: safe -0.5, caution -1.5, avoid -3, cap 15)
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#4dd09f" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  {t('infoModal.trustScore.allergens')} (up to -5)
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
                {t('result.open')}
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
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#9b59b6" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  {t('infoModal.trustScore.hiddenTerms')}
                </Text>
              </View>
              <View style={styles.factorTag}>
                <Ionicons name="checkmark-circle" size={12} color="#9b59b6" />
                <Text style={[styles.factorTagText, { color: colors.textSecondary }]}>
                  {t('infoModal.trustScore.percentageDisclosure')}
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
            • Nutri-Score (official EU/UK/FR/BE/ES system) - Direct conversion: A=25, B=20, C=15, D=10, E=5{'\n'}
            • NOVA Classification (São Paulo University system) - Merged into Body: NOVA 1=+3, NOVA 3=-5, NOVA 4=-10{'\n'}
            • Additives (weighted by safety rating) - Safe: -0.5 each, Caution: -1.5 each, Avoid: -3 each (cap 15 total){'\n'}
            • Comprehensive E-number database (400+ additives) with detailed safety ratings{'\n'}
            • Risky tags (carcinogenic, endocrine, palm, allergen, irritant): -4 each{'\n'}
            • Irritants (parabens, phthalates, sulfates, etc.): -10 block penalty{'\n'}
            • Fragrance/Parfum: -10 penalty{'\n'}
            • Source: Open Food Facts API + Comprehensive additive database
          </Text>
        </View>

        <View style={[styles.sourceBox, { backgroundColor: '#16a085' + '15', borderColor: '#16a085', marginTop: 12 }]}>
          <Text style={[styles.sourceTitle, { color: colors.text }]}>
            {t('infoModal.trustScore.planetSource')}
          </Text>
          <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
            • Eco-Score (French Agence de la Transition Écologique system) - Direct conversion: A=25, B=20, C=15, D=10, E=5{'\n'}
            • Packaging Recyclability (Open Food Facts) - Fully recyclable: +5 bonus{'\n'}
            • Palm Oil Detection (Open Food Facts) - Non-sustainable palm: -8 penalty{'\n'}
            • Source: Open Food Facts API with Agribalyse LCA database
          </Text>
        </View>

        <View style={[styles.sourceBox, { backgroundColor: '#ff6b6b' + '15', borderColor: '#ff6b6b', marginTop: 12 }]}>
          <Text style={[styles.sourceTitle, { color: colors.text }]}>
            {t('infoModal.trustScore.careSource')}
          </Text>
          <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
            • Certifications (Open Food Facts labels_tags) - 1,000+ recognized certifications{'\n'}
            • Bonus Structure: Fairtrade +8, Organic +8, Rainforest Alliance +7, MSC/ASC +8, RSPCA +6, Vegan/Cruelty-free +10, UTZ +7{'\n'}
            • Multiple labels can stack up to +25 points maximum{'\n'}
            • Cruel Parent Detection: -30 penalty for products from companies known for animal testing{'\n'}
            • Comprehensive brand database (500+ companies) with parent-subsidiary relationships{'\n'}
            • Source: Open Food Facts API + Brand database with ethical ratings
          </Text>
        </View>

        <View style={[styles.sourceBox, { backgroundColor: '#9b59b6' + '15', borderColor: '#9b59b6', marginTop: 12 }]}>
          <Text style={[styles.sourceTitle, { color: colors.text }]}>
            {t('infoModal.trustScore.openSource')}
          </Text>
          <Text style={[styles.sourceText, { color: colors.textSecondary }]}>
            • Ingredient Text Analysis (Open Food Facts) - Hidden term detection{'\n'}
            • Hidden Terms: "parfum", "fragrance", "natural flavor", "proprietary blend" - -10 to -20 points{'\n'}
            • Percentage Disclosure - Bonus for full ingredient percentages{'\n'}
            • Source: Open Food Facts API ingredients_text field
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
          {t('infoModal.trustScore.scoring') || 'TruScore Ranges'}
        </Text>
        <Text style={[styles.sectionText, { color: colors.textSecondary, marginBottom: 16 }]}>
          {t('infoModal.trustScore.scoringDescription') || 'TruScore ranges from 0-100, with each of the 4 pillars contributing 0-25 points. Higher scores indicate better overall product quality across all dimensions.'}
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
              {t('infoModal.trustScore.excellentDesc') || 'Outstanding quality across all 4 pillars (Body, Planet, Care, Open). These products excel in nutrition, sustainability, ethics, and transparency.'}
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
              {t('infoModal.trustScore.poorDesc') || 'Below-average quality. These products may have significant issues in Body safety, Planet sustainability, Care ethics, or Open transparency.'}
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
          {product 
            ? t('infoModal.trustScore.flagsDescriptionForProduct')
            : t('infoModal.trustScore.flagsDescription')}
        </Text>

        {/* Show actual product flags if product is provided */}
        {product && (greenFlags.length > 0 || redFlags.length > 0) ? (
          <>
            {/* Red Flags */}
            {redFlags.length > 0 && (
              <View style={[styles.flagsContainer, { backgroundColor: '#ff6b6b' + '15', borderColor: '#ff6b6b', marginTop: 12 }]}>
                <View style={styles.flagsHeader}>
                  <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
                  <Text style={[styles.flagsTitle, { color: colors.text }]}>
                    {t('infoModal.trustScore.redFlags')} ({redFlags.length})
                  </Text>
                </View>
                {redFlags.map((flag, index) => (
                  <View key={`red-${index}`} style={styles.flagItem}>
                    <Ionicons name={getFlagIcon(flag.category)} size={16} color="#ff6b6b" />
                    <View style={styles.flagContent}>
                      <Text style={[styles.flagTitle, { color: colors.text }]}>
                        {flag.title}
                      </Text>
                      <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                        {flag.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Green Flags */}
            {greenFlags.length > 0 && (
              <View style={[styles.flagsContainer, { backgroundColor: '#16a085' + '15', borderColor: '#16a085', marginTop: 16 }]}>
                <View style={styles.flagsHeader}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a085" />
                  <Text style={[styles.flagsTitle, { color: colors.text }]}>
                    {t('infoModal.trustScore.greenFlags')} ({greenFlags.length})
                  </Text>
                </View>
                {greenFlags.map((flag, index) => (
                  <View key={`green-${index}`} style={styles.flagItem}>
                    <Ionicons name={getFlagIcon(flag.category)} size={16} color="#16a085" />
                    <View style={styles.flagContent}>
                      <Text style={[styles.flagTitle, { color: colors.text }]}>
                        {flag.title}
                      </Text>
                      <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
                        {flag.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          /* Generic flag descriptions (educational) */
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
        )}
      </View>

      {/* Full Transparency Note */}
      <View style={[styles.note, { backgroundColor: colors.primary + '20', marginTop: 16 }]}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <View style={styles.noteContent}>
          <Text style={[styles.noteTitle, { color: colors.text }]}>
            {t('infoModal.trustScore.transparencyTitle') || '100% Transparent Methodology'}
          </Text>
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            {t('infoModal.trustScore.note') || 'TruScore v1.4 is calculated based on available product data from Open Food Facts, Open Beauty Facts, and UPCitemdb. The score uses recognized public systems (Nutri-Score, Eco-Score, NOVA, OFF labels) combined with comprehensive databases (400+ E-number additives, 500+ brand/company database). Additive penalties are weighted by safety rating (safe: -0.5, caution: -1.5, avoid: -3). Brand detection uses parent-subsidiary relationships for accurate cruel parent identification. When Nutri-Score or Eco-Score are missing, scores are calculated from available data with appropriate baselines (25 points base).'}
          </Text>
          <Text style={[styles.noteText, { color: colors.textSecondary, marginTop: 8 }]}>
            {t('infoModal.trustScore.dataSourceNote') || 'Data Sources: Open Food Facts (world.openfoodfacts.org), Open Beauty Facts (world.openbeautyfacts.org), UPCitemdb (api.upcitemdb.com), Barcode Spider, FDA Food Recall API (fda.gov/food/recalls). All calculations are transparent and verifiable.'}
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

