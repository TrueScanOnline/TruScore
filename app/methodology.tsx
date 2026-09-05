import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../src/theme';
import { consumerPillarLabel } from '../src/lib/scoreHighlights';
import { RootStackParamList } from './_layout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * High-level methodology explainer for Rveel / Rveel Score.
 * Text is intentionally verbose so legal counsel can red-line and adjust.
 */
export default function MethodologyScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('methodology.title') || 'How Rveel Score works'}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          {t('methodology.intro') ||
            'Rveel calculates a 0–100 Rveel Score for each product based on public data sources and a ' +
              'transparent, rule-based scoring framework. The score is an interpretive opinion intended to help ' +
              'you think critically about products. It is not a medical, nutritional, or regulatory certification.'}
        </Text>

        {/* Body pillar */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('methodology.bodyTitle') || `${consumerPillarLabel('Body')} pillar (0–25)`}
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            {t('methodology.bodyText') ||
              `The ${consumerPillarLabel('Body')} pillar estimates how well the product aligns with widely-accepted nutrition guidance. ` +
                'Inputs may include energy density, saturated fat, sugar, salt, fibre and other nutrients, as well ' +
                'as the presence of certain additives or allergens. Rveel uses public frameworks and regulatory ' +
                'thresholds as references, but does not claim to be an official Nutri-Score or any government rating.'}
          </Text>
        </View>

        {/* Planet pillar */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('methodology.planetTitle') || `${consumerPillarLabel('Planet')} pillar (0–25)`}
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            {t('methodology.planetText') ||
              `${consumerPillarLabel('Planet')} pillar (Rveel v19): starts at 15. When Open Food Facts provides an Eco-Score letter (A–E), ` +
                'the pillar applies the official v19 mapping (+7, +3, −1, −3, −7). Packaging is not scored separately ' +
                'when Eco-Score is present. If Eco-Score is missing, a conservative packaging fallback (+2, +1, or 0) ' +
                'may apply using structured packaging data and AU/NZ kerbside recycling rules (Annex v2). Palm oil ' +
                'may appear in product details but does not change the Planet score in MVP.'}
          </Text>
        </View>

        {/* Ethics pillar — presented to consumers as Claims */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('methodology.ethicsTitle') || `${consumerPillarLabel('Ethics')} pillar (0–25)`}
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            {t('methodology.ethicsText') ||
              `The ${consumerPillarLabel('Ethics')} pillar reflects signals about company and brand behaviour. This may include public ` +
                'information about recalls, labour controversies, animal welfare certifications, and other ' +
                'documented issues or recognitions. Rveel does not conduct its own investigations; it organises ' +
                'and weights information from public, cited sources and applies precautionary penalties where there ' +
                'are credible concerns.'}
          </Text>
        </View>

        {/* Open pillar — presented to consumers as Transparency */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('methodology.openTitle') || `${consumerPillarLabel('Open')} pillar (0–25)`}
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            {t('methodology.openText') ||
              `The ${consumerPillarLabel('Open')} pillar estimates how transparent the product and label appear to be. It looks for signals ` +
                'such as clearly disclosed ingredient lists, absence of vague umbrella terms, availability of ' +
                'origin information, and other indicators of openness. Hidden or vague labelling terms may reduce ' +
                'this score.'}
          </Text>
        </View>

        {/* Combination and limitations */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('methodology.combinedTitle') || 'Combining the pillars (0–100)'}
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            {t('methodology.combinedText') ||
              'Rveel Score is calculated by combining the four pillars into a single 0–100 score. If data is missing ' +
                'or incomplete for one or more pillars, the score may be reduced or marked as having insufficient ' +
                'data. Scores may change over time as new studies, databases, or regulatory information become ' +
                'available.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('methodology.limitationsTitle') || 'Important limitations & disclaimers'}
          </Text>
          <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
            {t('methodology.limitationsText') ||
              'Rveel does not provide medical, nutritional, or legal advice and is not a substitute for a doctor, ' +
                'dietitian, or other qualified professional. Data may be incomplete, delayed, or incorrect despite ' +
                'best efforts. Users should always read official product labelling and consult appropriate ' +
                'professionals when making health or dietary decisions. The methodology may evolve, and any changes ' +
                'will be documented here.'}
          </Text>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

