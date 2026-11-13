import React, { forwardRef, useEffect, useState, type Ref } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ShareableItem } from '../features/sharing/types';
import type { ShareImageScoreState } from '../utils/shareScoreSemantics';
import { RVEEL_SCORE_UNAVAILABLE_NEUTRAL_COLOR } from '../utils/truScorePresentation';
import type { AdditiveSharePayload } from '../features/sharing/additivesShareContent';
import { omittedListLabel } from '../features/sharing/additivesShareContent';
import CountryFlag from './CountryFlag';
import type { ShareCardRow } from './shareCardRows';
import { shareStoryHeading } from './shareStoryHeading';
import { RveelLockup } from './brand/RveelLockup';

const CARD_W = 360;

export interface ShareStoryPillar {
  label: string;
  value: string;
  glyph: 'human' | 'leaf' | 'book-open-page-variant' | 'eye';
  iconColor: string;
  tileColor: string;
}

export interface ShareProductStoryCardProps {
  productName: string;
  imageUrl?: string | null;
  barcode: string;
  scoreState: ShareImageScoreState;
  shareType: ShareableItem;
  brandColor: string;
  /** Published score-band colour. Used only when the score state is not neutral. */
  scoreColor?: string;
  surfaceColor: string;
  textColor: string;
  textSecondary: string;
  /** Light green panel, matching the Result cards. */
  panelColor: string;
  /** What the sender chose to share: Rveel Score, Nutrition, and so on. */
  contextTitle: string;
  /** Optional note the sender typed in the share sheet. */
  note?: string;
  /** Short facts for the chosen share, already prepared for display. */
  details?: string[];
  /** Marked rows for the captured card. Logos, level labels, and flags render here. */
  detailRows?: ShareCardRow[] | null;
  /** Readable address printed on the card. The tappable link travels in the caption. */
  linkLabel?: string;
  /** Rated pillar lines. Omitted when the score is not published. */
  pillars?: ShareStoryPillar[] | null;
  /** Identifies this open. A late callback from an older open must not settle a newer one. */
  settleToken: number;
  /** After a load failure or the capture timeout, show the missing-image mark. */
  forcePlaceholder?: boolean;
  /** Fires once the image has rendered, or the parcel mark is on screen. */
  onImageSettled?: (token: number, url: string) => void;
  /**
   * W5-ADD-SHARE-01B — additives / additive share composition.
   * When set, score chrome and pillars are omitted (presentation only).
   */
  additiveShare?: AdditiveSharePayload | null;
  /** Border/line token for additive card edges. */
  lineColor?: string;
}

export const ShareProductStoryCard = forwardRef<View, ShareProductStoryCardProps>(
  (
    {
      productName,
      imageUrl,
      barcode,
      scoreState,
      shareType,
      brandColor,
      scoreColor,
      surfaceColor,
      textColor,
      textSecondary,
      panelColor,
      contextTitle,
      note,
      details,
      detailRows,
      linkLabel,
      pillars,
      settleToken,
      forcePlaceholder = false,
      onImageSettled,
      additiveShare = null,
      lineColor = '#E1ECE8',
    },
    ref: Ref<View>
  ) => {
    const isAdditivesShare =
      Boolean(additiveShare) && (shareType === 'additives' || shareType === 'additive');
    const scoreChrome = scoreState.neutral
      ? RVEEL_SCORE_UNAVAILABLE_NEUTRAL_COLOR
      : scoreColor || brandColor;
    const imageKey = `${settleToken}:${imageUrl || ''}`;
    const [failedKey, setFailedKey] = useState<string | null>(null);
    const failed = failedKey === imageKey;
    const showImage = Boolean(imageUrl) && !failed && !forcePlaceholder;
    const trimmedNote = (note || '').trim();
    const detailLines = (details || []).map((line) => line.trim()).filter((line) => line.length > 0);
    const markedRows = detailRows && detailRows.length > 0 ? detailRows : null;
    const pillarLines = scoreState.neutral || isAdditivesShare ? [] : pillars || [];

    useEffect(() => {
      if (showImage) return;
      onImageSettled?.(settleToken, imageUrl || '');
    }, [showImage, settleToken, imageUrl, onImageSettled]);

    if (isAdditivesShare && additiveShare) {
      const countLabel =
        additiveShare.additiveCount === 1
          ? '1 additive identified'
          : `${additiveShare.additiveCount} additives identified`;
      const featured = additiveShare.mode === 'detail';

      return (
        <View ref={ref} collapsable={false} style={[styles.root, { backgroundColor: surfaceColor }]}>
          <View style={[styles.headerBand, { backgroundColor: brandColor }]}>
            <RveelLockup tone="light" height={24} />
            <Text style={styles.contextText}>{contextTitle || shareStoryHeading(shareType)}</Text>
          </View>

          <View style={styles.addHeader}>
            <View style={[styles.addThumbWrap, { backgroundColor: panelColor, borderColor: lineColor }]}>
              {showImage ? (
                <Image
                  key={imageKey}
                  source={{ uri: imageUrl ?? undefined }}
                  style={styles.addThumb}
                  contentFit="contain"
                  onDisplay={() => onImageSettled?.(settleToken, imageUrl || '')}
                  onError={() => setFailedKey(imageKey)}
                />
              ) : (
                <Text style={[styles.addThumbPlaceholder, { color: textSecondary }]}>📦</Text>
              )}
            </View>
            <View style={styles.addHeaderCopy}>
              <Text style={[styles.addProductName, { color: textColor }]} numberOfLines={3}>
                {productName}
              </Text>
              <Text style={[styles.addCount, { color: textSecondary }]}>{countLabel}</Text>
            </View>
          </View>

          <View style={styles.addList}>
            {additiveShare.highlights.length === 0 ? (
              <View style={[styles.addCard, { backgroundColor: panelColor, borderColor: lineColor }]}>
                <Text style={[styles.addDiscovery, { color: textSecondary }]}>
                  No recognised additives are available to share for this product right now.
                </Text>
              </View>
            ) : (
              additiveShare.highlights.map((h) => (
                <View
                  key={h.additiveId}
                  style={[
                    styles.addCard,
                    featured && styles.addCardFeatured,
                    { backgroundColor: panelColor, borderColor: lineColor },
                  ]}
                >
                  <View style={styles.addCardTop}>
                    <View style={[styles.addCodeBadge, { backgroundColor: surfaceColor, borderColor: brandColor }]}>
                      <Text style={[styles.addCodeText, { color: brandColor }]}>{h.codeLabel}</Text>
                    </View>
                    <View style={styles.addNameBlock}>
                      <Text
                        style={[styles.addDisplayName, featured && styles.addDisplayNameFeatured, { color: textColor }]}
                        numberOfLines={featured ? 3 : 2}
                      >
                        {h.displayName}
                      </Text>
                      {h.formalTitle ? (
                        <Text style={[styles.addFormal, { color: textSecondary }]} numberOfLines={2}>
                          {h.formalTitle}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  {h.discovery ? (
                    <Text
                      style={[styles.addDiscovery, featured && styles.addDiscoveryFeatured, { color: textColor }]}
                    >
                      {h.discovery}
                    </Text>
                  ) : null}
                  {h.sourceLabel ? (
                    <Text style={[styles.addSource, { color: textSecondary }]}>
                      {`Commonly sourced / prepared: ${h.sourceLabel}`}
                    </Text>
                  ) : null}
                  {h.qualifications.map((q) => (
                    <Text key={q} style={[styles.addQual, { color: textSecondary }]}>
                      {q}
                    </Text>
                  ))}
                </View>
              ))
            )}
          </View>

          {additiveShare.mode === 'overview' &&
          !additiveShare.listComplete &&
          additiveShare.omittedCount > 0 ? (
            <Text style={[styles.addOmitted, { color: textSecondary }]}>
              {omittedListLabel(additiveShare.omittedCount)}
            </Text>
          ) : null}
          {additiveShare.mode === 'detail' && additiveShare.additiveCount > 1 ? (
            <Text style={[styles.addOmitted, { color: textSecondary }]}>
              {`One of ${additiveShare.additiveCount} additives identified on this product.`}
            </Text>
          ) : null}

          {trimmedNote ? (
            <View style={[styles.noteBox, { backgroundColor: panelColor }]}>
              <Text style={[styles.noteText, { color: textColor }]} numberOfLines={4}>
                {`“${trimmedNote}”`}
              </Text>
            </View>
          ) : null}

          <Text style={[styles.addDisclaimer, { color: textSecondary }]}>{additiveShare.disclaimer}</Text>
          <View style={[styles.linkBand, { backgroundColor: panelColor }]}>
            <Text style={[styles.footerOpen, { color: brandColor }]}>Explore this product in Rveel</Text>
            {linkLabel ? (
              <Text style={[styles.linkLine, { color: textColor }]}>{linkLabel}</Text>
            ) : null}
          </View>
        </View>
      );
    }

    return (
      <View ref={ref} collapsable={false} style={[styles.root, { backgroundColor: surfaceColor }]}>
        <View style={[styles.headerBand, { backgroundColor: brandColor }]}>
          <RveelLockup tone="light" height={24} />
          <Text style={styles.contextText}>{contextTitle || shareStoryHeading(shareType)}</Text>
        </View>
        <View style={[styles.imageWrap, { backgroundColor: panelColor }]}>
          {showImage ? (
            <Image
              key={imageKey}
              source={{ uri: imageUrl ?? undefined }}
              style={styles.image}
              contentFit="contain"
              onDisplay={() => onImageSettled?.(settleToken, imageUrl || '')}
              onError={() => setFailedKey(imageKey)}
            />
          ) : (
            <Text style={[styles.placeholder, { color: textSecondary }]}>📦</Text>
          )}
        </View>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>
          {productName}
        </Text>
        <View style={[styles.scorePanel, { backgroundColor: panelColor }]}>
          <Text style={[styles.scoreLabel, { color: scoreState.neutral ? scoreChrome : textSecondary }]}>
            {scoreState.caption}
          </Text>
          {!scoreState.neutral && scoreState.valueText ? (
            <Text style={[styles.scoreValue, { color: scoreChrome }]}>{scoreState.valueText}</Text>
          ) : null}
        </View>
        {pillarLines.length > 0 ? (
          <View style={styles.pillarGrid}>
            {pillarLines.map((pillar) => (
              <View key={pillar.label} style={[styles.pillarTile, { backgroundColor: pillar.tileColor }]}>
                <MaterialCommunityIcons name={pillar.glyph} size={26} color={pillar.iconColor} />
                <View style={styles.pillarCopy}>
                  <Text style={[styles.pillarLabel, { color: pillar.iconColor }]} numberOfLines={1}>
                    {pillar.label}
                  </Text>
                  <Text style={[styles.pillarValue, { color: textColor }]}>{pillar.value}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
        {markedRows ? (
          <View style={[styles.detailBlock, { backgroundColor: panelColor }]}>
            {markedRows.map((row, index) => {
              if (row.kind === 'pillar') {
                return (
                  <View key={`pillar-${index}`} style={styles.markRow}>
                    <MaterialCommunityIcons name={row.glyph} size={22} color={row.color} />
                    <Text style={[styles.detailText, styles.markText, { color: textColor }]}>{row.text}</Text>
                  </View>
                );
              }
              if (row.kind === 'nutrient') {
                return (
                  <View key={`nutrient-${index}`} style={styles.markRow}>
                    <Text style={[styles.detailText, styles.markText, { color: textColor }]}>{row.text}</Text>
                    {row.level ? (
                      <View style={styles.levelBadge}>
                        <View style={[styles.levelDot, { backgroundColor: row.levelColor || brandColor }]} />
                        <Text style={[styles.levelLabel, { color: row.levelColor || textColor }]}>{row.level}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              }
              if (row.kind === 'origin') {
                return (
                  <View key={`origin-${index}`} style={styles.originRow}>
                    {row.statement ? (
                      <Text style={[styles.originStatement, { color: textSecondary }]}>{row.statement}</Text>
                    ) : null}
                    <CountryFlag appearance="hero" nameColor={textColor} country={row.country} />
                    {row.support.length > 0 ? (
                      <Text style={[styles.detailText, { color: textSecondary }]}>{row.support.join(' · ')}</Text>
                    ) : null}
                    {row.packWording ? (
                      <Text style={[styles.detailText, { color: textColor }]}>{`"${row.packWording}"`}</Text>
                    ) : null}
                  </View>
                );
              }
              return (
                <Text key={`text-${index}`} style={[styles.detailText, { color: textColor }]}>
                  {row.text}
                </Text>
              );
            })}
          </View>
        ) : detailLines.length > 0 ? (
          <View style={[styles.detailBlock, { backgroundColor: panelColor }]}>
            {detailLines.map((line, index) => (
              <Text key={`${index}-${line}`} style={[styles.detailText, { color: textColor }]}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}
        {trimmedNote ? (
          <View style={[styles.noteBox, { backgroundColor: panelColor }]}>
            <Text style={[styles.noteText, { color: textColor }]} numberOfLines={4}>
              {`“${trimmedNote}”`}
            </Text>
          </View>
        ) : null}
        <Text style={[styles.footerBarcode, styles.barcodeLine, { color: textSecondary }]}>{barcode}</Text>
        <View style={[styles.linkBand, { backgroundColor: panelColor }]}>
          <Text style={[styles.footerOpen, { color: brandColor }]}>Open in Rveel</Text>
          {linkLabel ? (
            <Text style={[styles.linkLine, { color: textColor }]}>{linkLabel}</Text>
          ) : null}
        </View>
      </View>
    );
  }
);

ShareProductStoryCard.displayName = 'ShareProductStoryCard';

const styles = StyleSheet.create({
  root: {
    width: CARD_W,
    borderRadius: 20,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  headerBand: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contextText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  imageWrap: {
    height: 168,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    fontSize: 56,
  },
  title: {
    marginHorizontal: 16,
    marginTop: 14,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  scorePanel: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  pillarGrid: {
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillarTile: {
    width: (CARD_W - 32 - 8) / 2,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillarCopy: {
    flex: 1,
  },
  pillarLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  pillarValue: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
  },
  detailBlock: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markText: {
    flex: 1,
    flexShrink: 1,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  originRow: {
    gap: 4,
    marginBottom: 6,
  },
  originStatement: {
    fontSize: 12,
    fontWeight: '700',
  },
  noteBox: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 21,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  footerBarcode: {
    fontSize: 12,
    fontWeight: '600',
  },
  barcodeLine: {
    marginHorizontal: 16,
    marginTop: 14,
  },
  linkBand: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  footerOpen: {
    fontSize: 15,
    fontWeight: '800',
  },
  linkLine: {
    fontSize: 13,
    fontWeight: '700',
  },
  /* —— Additives share composition (W5-ADD-SHARE-01B) —— */
  addHeader: {
    marginHorizontal: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addThumbWrap: {
    width: 72,
    height: 88,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  addThumb: {
    width: '100%',
    height: '100%',
  },
  addThumbPlaceholder: {
    fontSize: 28,
  },
  addHeaderCopy: {
    flex: 1,
    paddingTop: 2,
  },
  addProductName: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  addCount: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  addList: {
    marginHorizontal: 16,
    marginTop: 14,
    gap: 10,
  },
  addCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  addCardFeatured: {
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  addCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  addCodeBadge: {
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCodeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  addNameBlock: {
    flex: 1,
    gap: 2,
  },
  addDisplayName: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 21,
  },
  addDisplayNameFeatured: {
    fontSize: 20,
    lineHeight: 26,
  },
  addFormal: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  addDiscovery: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  addDiscoveryFeatured: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  addSource: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  addQual: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    fontStyle: 'italic',
  },
  addOmitted: {
    marginHorizontal: 16,
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  addDisclaimer: {
    marginHorizontal: 16,
    marginTop: 12,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
});
