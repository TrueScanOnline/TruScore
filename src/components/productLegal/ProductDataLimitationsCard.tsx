/**
 * Product information card.
 * One primary contribution action and one secondary explanation link.
 * Eligibility stays in productInformationMenu. This card does not score or admit.
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import InfoModal from '../InfoModal';
import { useTheme } from '../../theme';
import { resultEmeraldTone, resultPresentation } from '../../theme/resultPresentation';
import { Product, ProductWithTrustScore } from '../../types/product';
import {
  ABOUT_THIS_INFORMATION,
  ADD_OR_CORRECT_INFORMATION,
  PRODUCT_INFORMATION_HEADING,
  PRODUCT_INFORMATION_SUPPORT,
} from '../../contribution/productInformationMenu';
import type {
  CrossPillarPublicationSnapshot,
  PillarPublicationResult,
  S26Explanation,
} from '../../lib/rateability';
import { consumerPillarLabel } from '../../lib/scoreHighlights';

type Props = {
  product: Product | ProductWithTrustScore | null | undefined;
  /** When false, the Result latch is closed and this card stays hidden. */
  publicationSettled?: boolean;
  /**
   * Parent bump (score or Confidence) opens the existing explanation.
   * It does not open the contribution menu.
   */
  openRequestKey?: number;
  /** Result has already selected at least one supported action. */
  hasContributionActions?: boolean;
  /** Opens the one contribution menu. Result rechecks eligibility in this handler. */
  onAddOrCorrect?: () => void;
};

type PillarKey = 'body' | 'planet' | 'claims' | 'transparency' | 'overall';

const PILLAR_ROWS: { key: PillarKey; title: string }[] = [
  { key: 'body', title: 'Body' },
  { key: 'planet', title: 'Planet' },
  { key: 'claims', title: consumerPillarLabel('Ethics') },
  { key: 'transparency', title: consumerPillarLabel('Open') },
  { key: 'overall', title: 'Overall' },
];

function getPillarPublication(
  snap: CrossPillarPublicationSnapshot,
  key: PillarKey
): PillarPublicationResult {
  return snap[key];
}

function ExplanationBlock({
  title,
  pub,
  ink,
  muted,
}: {
  title: string;
  pub: PillarPublicationResult;
  ink: string;
  muted: string;
}) {
  const s26: S26Explanation | null = pub.s26;
  if (!s26) return null;
  return (
    <View style={styles.pillarBlock}>
      <Text style={[styles.pillarTitle, { color: ink }]}>
        {title}
        {pub.publicationStatus === 'rated' && pub.confidence
          ? ` · ${pub.confidence.charAt(0).toUpperCase()}${pub.confidence.slice(1)}`
          : pub.publicationStatus === 'nr'
            ? ' · Unrevealed'
            : ''}
      </Text>
      <Text style={[styles.pillarBody, { color: muted }]}>
        {s26.explanation.replace(/^\(Awaiting founder approval\)\s*/, '')}
      </Text>
      {s26.contributionOpportunity?.prefill?.structuredOriginCountry ? (
        <Text style={[styles.futureNote, { color: muted }]}>
          Suggested origin for validation: {s26.contributionOpportunity.prefill.structuredOriginCountry}
          {s26.contributionOpportunity.prefill.conflictingFreeTextOrigins
            ? ` (conflicts with “${s26.contributionOpportunity.prefill.conflictingFreeTextOrigins}”)`
            : ''}
        </Text>
      ) : null}
    </View>
  );
}

export default function ProductDataLimitationsCard({
  product,
  publicationSettled = true,
  openRequestKey = 0,
  hasContributionActions = false,
  onAddOrCorrect,
}: Props) {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const tone = resultEmeraldTone(!!darkMode);
  const [modalVisible, setModalVisible] = useState(false);
  const openExplanation = useCallback(() => setModalVisible(true), []);
  const closeExplanation = useCallback(() => setModalVisible(false), []);

  useEffect(() => {
    if (openRequestKey > 0) setModalVisible(true);
  }, [openRequestKey]);

  const publication = (product as ProductWithTrustScore | null | undefined)?._publication;
  const hasExplanation = useMemo(() => {
    if (!product || !publicationSettled || !publication) return false;
    return PILLAR_ROWS.some((row) => !!getPillarPublication(publication, row.key).s26);
  }, [product, publication, publicationSettled]);

  if (!hasExplanation && !hasContributionActions) return null;

  const ink = darkMode ? tone.ink : resultPresentation.emerald.ink.light;
  const muted = darkMode ? tone.muted : resultPresentation.emerald.muted.light;
  const actionInk = darkMode ? resultPresentation.emerald.ink.light : '#FFFFFF';

  return (
    <>
      <View style={styles.cardHit}>
        <LinearGradient
          colors={darkMode ? [tone.card, tone.card] : [...resultPresentation.emerald.teaser]}
          style={[styles.card, { borderColor: tone.teaserBorder }]}
        >
          <Text style={[styles.heading, { color: ink }]}>
            {t('result.productInformationHeading', PRODUCT_INFORMATION_HEADING)}
          </Text>
          <Text style={[styles.support, { color: muted }]}>
            {t('result.productInformationSupport', PRODUCT_INFORMATION_SUPPORT)}
          </Text>
          {hasContributionActions && onAddOrCorrect ? (
            <TouchableOpacity
              onPress={onAddOrCorrect}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={ADD_OR_CORRECT_INFORMATION}
              testID="add-or-correct-information"
              style={[styles.primaryButton, { backgroundColor: tone.action }]}
            >
              <Ionicons name="create-outline" size={20} color={actionInk} />
              <Text style={[styles.primaryLabel, { color: actionInk }]}>{ADD_OR_CORRECT_INFORMATION}</Text>
            </TouchableOpacity>
          ) : null}
          {hasExplanation ? (
            <TouchableOpacity
              onPress={openExplanation}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={ABOUT_THIS_INFORMATION}
              testID="about-this-information"
              style={styles.secondaryHit}
            >
              <Ionicons name="information-circle-outline" size={20} color={tone.action} />
              <Text style={[styles.secondaryLabel, { color: tone.action }]}>{ABOUT_THIS_INFORMATION}</Text>
            </TouchableOpacity>
          ) : null}
        </LinearGradient>
      </View>

      {hasExplanation && publication ? (
        <InfoModal
          visible={modalVisible}
          onClose={closeExplanation}
          title={t('result.legalDataLimitationsModalTitle')}
          icon="cloud-offline-outline"
          iconColor={tone.action}
        >
          {PILLAR_ROWS.map((row) => {
            const pub = getPillarPublication(publication, row.key);
            if (!pub.s26) return null;
            return (
              <ExplanationBlock
                key={row.key}
                title={row.title}
                pub={pub}
                ink={tone.ink}
                muted={tone.muted}
              />
            );
          })}
          <Text style={[styles.modalParagraph, { color: tone.muted }]}>{t('result.legalDataLimitationsModalP1')}</Text>
          <Text style={[styles.modalParagraph, { color: tone.muted }]}>{t('result.legalDataLimitationsModalP2')}</Text>
          <Text style={[styles.modalParagraph, { color: tone.muted }]}>{t('result.legalDataLimitationsModalP3')}</Text>
          <Text style={[styles.modalParagraph, { color: tone.muted }]}>{t('result.legalDataLimitationsModalP4')}</Text>
          <Text style={[styles.modalParagraph, { color: tone.muted }]}>{t('result.legalDataLimitationsModalP5')}</Text>
        </InfoModal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  cardHit: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: resultPresentation.emerald.radius.teaser,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 8,
  },
  heading: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  support: {
    fontSize: 15,
    lineHeight: 21,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    flexShrink: 1,
  },
  secondaryHit: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  secondaryLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    flexShrink: 1,
  },
  pillarBlock: { marginBottom: 16 },
  pillarTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  pillarBody: { fontSize: 13, lineHeight: 19 },
  futureNote: { fontSize: 12, fontStyle: 'italic', marginTop: 6 },
  modalParagraph: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
});
