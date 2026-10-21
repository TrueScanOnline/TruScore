import React, { forwardRef, useEffect, useState, type Ref } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ShareableItem } from '../features/sharing/types';
import type { ShareImageScoreState } from '../utils/shareScoreSemantics';
import { RVEEL_SCORE_UNAVAILABLE_NEUTRAL_COLOR } from '../utils/truScorePresentation';
import CountryFlag from './CountryFlag';
import type { ShareCardRow } from './shareCardRows';
import { shareStoryHeading } from './shareStoryHeading';

const CARD_W = 360;

export interface ShareStoryPillar {
  label: string;
  value: string;
  glyph: 'apple' | 'leaf' | 'message-text' | 'eye';
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
    },
    ref: Ref<View>
  ) => {
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
    const pillarLines = scoreState.neutral ? [] : pillars || [];
    useEffect(() => {
      if (showImage) return;
      onImageSettled?.(settleToken, imageUrl || '');
    }, [showImage, settleToken, imageUrl, onImageSettled]);

    return (
      <View ref={ref} collapsable={false} style={[styles.root, { backgroundColor: surfaceColor }]}>
        <View style={[styles.headerBand, { backgroundColor: brandColor }]}>
          <Text style={styles.headerText}>Rveel</Text>
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
  headerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
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
});
