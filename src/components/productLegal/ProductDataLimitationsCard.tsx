/**
 * W3-S26 componentised Data Limitations — Body / Planet / Claims / Transparency / Overall,
 * retaining the pre-existing Result legal paragraphs P1–P5.
 * Provisional S26 copy retains “(Awaiting founder approval)” prefix (§11).
 * Minimal UAT placement; final surface consolidation deferred to Wave 5.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import InfoModal from '../InfoModal';
import { useTheme } from '../../theme';
import { Product, ProductWithTrustScore } from '../../types/product';
import type {
  ContributionOpportunity,
  CrossPillarPublicationSnapshot,
  PillarPublicationResult,
  S26Explanation,
} from '../../lib/rateability';
import { consumerPillarLabel } from '../../lib/scoreHighlights';

const INCOMPLETE_DATA_CARD_BORDER_RED = '#d32f2f';

type Props = {
  product: Product | ProductWithTrustScore | null | undefined;
  /** Opens manual product entry when a live ingredients/nutrition route is actionable. */
  onOpenManualEdit?: () => void;
  /**
   * Opens Product Origins contribution when live.
   * Prefill carries structured origins_tags candidate + conflicting free text only when
   * freeTextContradiction === true.
   */
  onOpenOrigins?: (prefill?: {
    structuredOriginCountry?: string;
    conflictingFreeTextOrigins?: string;
    originsTags?: string[];
  }) => void;
  /** When false, suppress S26 (assessment cycle still checking). */
  publicationSettled?: boolean;
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

function ManualEditActionRow({
  onPress,
  label,
  accessibilityLabel,
  primaryColor,
}: {
  onPress: () => void;
  label: string;
  accessibilityLabel: string;
  primaryColor: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.editLinkRow, { borderColor: primaryColor, backgroundColor: primaryColor + '12' }]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name="create-outline" size={22} color={primaryColor} />
      <Text style={[styles.editLinkText, { color: primaryColor }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={primaryColor} />
    </TouchableOpacity>
  );
}

function LegalParagraph({
  text,
  colors,
}: {
  text: string;
  colors: { text: string; textSecondary: string };
}) {
  return <Text style={[styles.modalParagraph, { color: colors.textSecondary }]}>{text}</Text>;
}

function S26PillarBlock({
  title,
  pub,
  colors,
  onLiveAction,
  showLiveCta,
}: {
  title: string;
  pub: PillarPublicationResult;
  colors: { text: string; textSecondary: string; primary: string };
  onLiveAction?: () => void;
  /** Deduped: only the first identical live CTA in the modal renders. */
  showLiveCta: boolean;
}) {
  const s26: S26Explanation | null = pub.s26;
  if (!s26) return null;
  const opp = s26.contributionOpportunity;

  return (
    <View style={styles.pillarBlock}>
      <Text style={[styles.pillarTitle, { color: colors.text }]}>
        {title}
        {pub.publicationStatus === 'rated' && pub.confidence
          ? ` · ${pub.confidence.charAt(0).toUpperCase()}${pub.confidence.slice(1)}`
          : pub.publicationStatus === 'nr'
            ? ' · Unrevealed'
            : ''}
      </Text>
      <Text style={[styles.pillarBody, { color: colors.textSecondary }]}>{s26.explanation}</Text>
      {opp?.prefill?.structuredOriginCountry ? (
        <Text style={[styles.futureNote, { color: colors.textSecondary }]}>
          Suggested origin for validation: {opp.prefill.structuredOriginCountry}
          {opp.prefill.conflictingFreeTextOrigins
            ? ` (conflicts with “${opp.prefill.conflictingFreeTextOrigins}”)`
            : ''}
        </Text>
      ) : null}
      {showLiveCta && onLiveAction ? (
        <ManualEditActionRow
          onPress={onLiveAction}
          label={
            opp?.routeKey === 'origins'
              ? 'Validate or correct origin information'
              : 'Edit or add product information'
          }
          accessibilityLabel={
            opp?.routeKey === 'origins'
              ? 'Open origins contribution'
              : 'Open manual edit to add or correct product information'
          }
          primaryColor={colors.primary}
        />
      ) : null}
    </View>
  );
}

export default function ProductDataLimitationsCard({
  product,
  onOpenManualEdit,
  onOpenOrigins,
  publicationSettled = true,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const open = useCallback(() => setModalVisible(true), []);
  const close = useCallback(() => setModalVisible(false), []);

  const publication = (product as ProductWithTrustScore | null | undefined)?._publication;

  const actionable = useMemo(() => {
    if (!publication || !publicationSettled) return false;
    return PILLAR_ROWS.some((row) => {
      const s26 = getPillarPublication(publication, row.key).s26;
      return !!s26;
    });
  }, [publication, publicationSettled]);

  if (!product || !publicationSettled || !publication || !actionable) {
    return null;
  }

  const resolveAction = (routeKey?: string, prefill?: ContributionOpportunity['prefill']) => {
    if (routeKey === 'origins') {
      return onOpenOrigins ? () => onOpenOrigins(prefill) : undefined;
    }
    if (routeKey === 'ingredients_nutrition') return onOpenManualEdit;
    return undefined;
  };

  // Deduplicate identical live CTAs (same routeKey) within this modal — show once.
  const seenLiveRoutes = new Set<string>();

  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: INCOMPLETE_DATA_CARD_BORDER_RED },
        ]}
        onPress={open}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={t('result.legalDataLimitationsTeaserA11y')}
      >
        <Ionicons
          name="warning-outline"
          size={20}
          color={colors.warning || '#ff9800'}
          style={styles.cardIcon}
        />
        <View style={styles.cardTextWrap}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t('result.legalDataLimitationsTeaserTitle')}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {t('result.legalDataLimitationsTeaserBody')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>

      <InfoModal
        visible={modalVisible}
        onClose={close}
        title={t('result.legalDataLimitationsModalTitle')}
        icon="cloud-offline-outline"
        iconColor={colors.warning || '#ff9800'}
      >
        {PILLAR_ROWS.map((row) => {
          const pub = getPillarPublication(publication, row.key);
          if (!pub.s26) return null;
          const routeKey = pub.s26.contributionOpportunity?.routeKey;
          const prefill = pub.s26.contributionOpportunity?.prefill;
          const opp = pub.s26.contributionOpportunity;
          const action = resolveAction(routeKey, prefill);
          const liveKey =
            opp?.material === true && opp.routeStatus === 'live' && opp.routeKey
              ? opp.routeKey
              : null;
          let showLiveCta = false;
          if (liveKey && action && !seenLiveRoutes.has(liveKey)) {
            seenLiveRoutes.add(liveKey);
            showLiveCta = true;
          }
          return (
            <S26PillarBlock
              key={row.key}
              title={row.title}
              pub={pub}
              colors={colors}
              showLiveCta={showLiveCta}
              onLiveAction={
                showLiveCta && action
                  ? () => {
                      close();
                      action();
                    }
                  : undefined
              }
            />
          );
        })}

        <LegalParagraph text={t('result.legalDataLimitationsModalP1')} colors={colors} />
        <LegalParagraph text={t('result.legalDataLimitationsModalP2')} colors={colors} />
        <LegalParagraph text={t('result.legalDataLimitationsModalP3')} colors={colors} />
        <LegalParagraph text={t('result.legalDataLimitationsModalP4')} colors={colors} />
        <LegalParagraph text={t('result.legalDataLimitationsModalP5')} colors={colors} />
      </InfoModal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  cardIcon: { marginRight: 10 },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  cardSubtitle: { fontSize: 13, lineHeight: 18 },
  pillarBlock: { marginBottom: 16 },
  pillarTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  pillarBody: { fontSize: 13, lineHeight: 19 },
  futureNote: { fontSize: 12, fontStyle: 'italic', marginTop: 6 },
  modalParagraph: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  editLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
    gap: 8,
  },
  editLinkText: { flex: 1, fontSize: 14, fontWeight: '600' },
});
