/**
 * W3-S26 componentised Data Limitations — Body / Planet / Claims / Transparency / Overall,
 * retaining the pre-existing Result legal paragraphs P1–P5.
 * Provisional S26 copy retains “(Awaiting founder approval)” prefix (§11).
 * Minimal UAT placement; final surface consolidation deferred to Wave 5.
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import InfoModal from '../InfoModal';
import { useTheme } from '../../theme';
import { resultEmeraldTone, resultPresentation } from '../../theme/resultPresentation';
import { Product, ProductWithTrustScore } from '../../types/product';
import { PACKET_INFORMATION_ADD } from '../../contribution/resultContributionActions';
import {
  bodyDataLimitationActions,
  transparencyShowsSeparateAddIngredients,
} from '../../contribution/governedDisplayProjection';
import type {
  ContributionOpportunity,
  CrossPillarPublicationSnapshot,
  PillarPublicationResult,
  S26Explanation,
} from '../../lib/rateability';
import { consumerPillarLabel } from '../../lib/scoreHighlights';

type Props = {
  product: Product | ProductWithTrustScore | null | undefined;
  /** Opens the ingredients journey. */
  onOpenIngredients?: () => void;
  /** Opens the nutrition journey. */
  onOpenNutrition?: () => void;
  /**
   * Route keys already shown on the originating Result card.
   * Those actions are not repeated here.
   */
  suppressLiveRoutes?: string[];
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
  /** Opens the live Packet Claims contribution journey. */
  onOpenPacketClaims?: () => void;
  /** When false, suppress S26 (assessment cycle still checking). */
  publicationSettled?: boolean;
  /**
   * Parent bump (e.g. Confidence badge) opens the S26 modal without using the teaser.
   * Overall explanation is included in the modal pillar rows.
   */
  openRequestKey?: number;
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
      <Ionicons name="add-circle-outline" size={22} color={primaryColor} />
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
  bodyActions,
  ingredientAction,
}: {
  title: string;
  pub: PillarPublicationResult;
  colors: { text: string; textSecondary: string; primary: string };
  onLiveAction?: () => void;
  /** Deduped: only the first identical live CTA in the modal renders. */
  showLiveCta: boolean;
  bodyActions?: Array<{ label: string; onPress: () => void }>;
  /** Ingredient Clarity invitation. Shown once, including while Origins is also unresolved. */
  ingredientAction?: { onPress: () => void };
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
      <Text style={[styles.pillarBody, { color: colors.textSecondary }]}>
        {s26.explanation.replace(/^\(Awaiting founder approval\)\s*/, '')}
      </Text>
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
              ? 'Add product origins'
              : opp?.routeKey === 'packet_claims'
                ? PACKET_INFORMATION_ADD
                : 'Add ingredients'
          }
          accessibilityLabel={
            opp?.routeKey === 'origins'
              ? 'Add product origins'
              : opp?.routeKey === 'packet_claims'
                ? PACKET_INFORMATION_ADD
                : 'Add ingredients'
          }
          primaryColor={colors.primary}
        />
      ) : null}
      {ingredientAction ? (
        <ManualEditActionRow
          onPress={ingredientAction.onPress}
          label="Add ingredients"
          accessibilityLabel="Add ingredients"
          primaryColor={colors.primary}
        />
      ) : null}
      {(bodyActions || []).map((action) => (
        <ManualEditActionRow
          key={action.label}
          onPress={action.onPress}
          label={action.label}
          accessibilityLabel={action.label}
          primaryColor={colors.primary}
        />
      ))}
    </View>
  );
}

export default function ProductDataLimitationsCard({
  product,
  onOpenIngredients,
  onOpenNutrition,
  onOpenOrigins,
  onOpenPacketClaims,
  suppressLiveRoutes = [],
  publicationSettled = true,
  openRequestKey = 0,
}: Props) {
  const { t } = useTranslation();
  const { colors, darkMode } = useTheme();
  const tone = resultEmeraldTone(!!darkMode);
  const [modalVisible, setModalVisible] = useState(false);

  const open = useCallback(() => setModalVisible(true), []);
  const close = useCallback(() => setModalVisible(false), []);

  useEffect(() => {
    if (openRequestKey > 0) {
      setModalVisible(true);
    }
  }, [openRequestKey]);

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
    if (routeKey && suppressLiveRoutes.includes(routeKey)) return undefined;
    if (routeKey === 'origins') {
      return onOpenOrigins ? () => onOpenOrigins(prefill) : undefined;
    }
    if (routeKey === 'ingredients_nutrition') return onOpenIngredients ?? onOpenNutrition;
    if (routeKey === 'packet_claims') return onOpenPacketClaims;
    return undefined;
  };

  // Deduplicate identical live CTAs (same routeKey) within this modal — show once.
  const seenLiveRoutes = new Set<string>();

  return (
    <>
      <TouchableOpacity
        onPress={open}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={t('result.legalDataLimitationsTeaserA11y')}
        style={styles.cardHit}
      >
        <LinearGradient
          colors={darkMode ? [tone.card, tone.card] : [...resultPresentation.emerald.teaser]}
          style={[styles.card, { borderColor: tone.teaserBorder }]}
        >
          <View style={[styles.iconPlate, { backgroundColor: resultPresentation.emerald.chevronCircle.light }]}>
            <Svg width={28} height={28} viewBox="0 0 28 28" accessible={false}>
              <Rect x={8} y={1} width={17} height={20} rx={3.5} fill="#FFFFFF" />
              <Rect x={8} y={1} width={17} height={20} rx={3.5} fill={tone.action} opacity={0.55} />
              <Rect x={2} y={6} width={18} height={21} rx={3.5} fill={tone.action} />
              <Path d="M14 6H20V12L14 6Z" fill="#FFFFFF" opacity={0.85} />
              <Rect x={5} y={12} width={12} height={1.8} rx={0.9} fill="#FFFFFF" />
              <Rect x={5} y={16} width={12} height={1.8} rx={0.9} fill="#FFFFFF" />
              <Rect x={5} y={20} width={8} height={1.8} rx={0.9} fill="#FFFFFF" />
            </Svg>
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={[styles.cardTitle, { color: darkMode ? tone.ink : resultPresentation.emerald.ink.light }]}>
              {t('result.legalDataLimitationsTeaserTitle')}
            </Text>
            <Text style={[styles.cardSubtitle, { color: darkMode ? tone.muted : resultPresentation.emerald.muted.light }]}>
              {t('result.legalDataLimitationsTeaserBody')}
            </Text>
          </View>
          <View style={[styles.chevronCircle, { backgroundColor: tone.chevronCircle }]}>
            <Ionicons name="chevron-forward" size={18} color={tone.action} />
          </View>
        </LinearGradient>
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
          const bodyActions =
            row.key === 'body'
              ? bodyDataLimitationActions(product).map((action) => ({
                    label: action.label,
                    onPress: () => {
                      close();
                      if (action.destination === 'nutrition') onOpenNutrition?.();
                      if (action.destination === 'ingredients') onOpenIngredients?.();
                    },
                  }))
              : [];
          const action = row.key === 'body' ? undefined : resolveAction(routeKey, prefill);
          const liveKey =
            opp?.material === true && opp.routeStatus === 'live' && opp.routeKey
              ? opp.routeKey
              : null;
          let showLiveCta = false;
          if (liveKey && action && !seenLiveRoutes.has(liveKey)) {
            seenLiveRoutes.add(liveKey);
            showLiveCta = true;
          }
          const ingredientAction =
            row.key === 'transparency' &&
            transparencyShowsSeparateAddIngredients(product) &&
            onOpenIngredients
              ? {
                  onPress: () => {
                    close();
                    onOpenIngredients();
                  },
                }
              : undefined;
          return (
            <S26PillarBlock
              key={row.key}
              title={row.title}
              pub={pub}
              colors={colors}
              showLiveCta={showLiveCta}
              bodyActions={bodyActions}
              ingredientAction={ingredientAction}
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
  cardHit: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: resultPresentation.emerald.radius.teaser,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10,
  },
  iconPlate: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: { flex: 1 },
  cardTitle: { fontSize: 15, lineHeight: 20, fontWeight: '700', marginBottom: 2 },
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
