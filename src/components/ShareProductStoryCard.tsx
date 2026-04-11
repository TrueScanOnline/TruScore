import React, { forwardRef, type Ref } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { buildShareUrl } from '../utils/shareUrl';
import type { ShareableItem } from '../features/sharing/types';

const CARD_W = 360;
const CARD_H = 520;

export interface ShareProductStoryCardProps {
  productName: string;
  imageUrl?: string | null;
  barcode: string;
  truScore?: number | null;
  shareType: ShareableItem;
  brandColor: string;
  surfaceColor: string;
  textColor: string;
  textSecondary: string;
}

export const ShareProductStoryCard = forwardRef<View, ShareProductStoryCardProps>(
  (
    {
      productName,
      imageUrl,
      barcode,
      truScore,
      shareType,
      brandColor,
      surfaceColor,
      textColor,
      textSecondary,
    },
    ref: Ref<View>
  ) => {
    const link = buildShareUrl(barcode, {
      context: shareType,
      source: 'image',
      utmSource: 'app',
      utmMedium: 'share',
      utmCampaign: shareType,
    });

    const scoreLabel =
      truScore === null || truScore === undefined ? '—' : `${Math.round(truScore)}/100`;

    return (
      <View ref={ref} collapsable={false} style={[styles.root, { backgroundColor: surfaceColor }]}>
        <View style={[styles.headerBand, { backgroundColor: brandColor }]}>
          <Text style={styles.headerText}>TrueScan</Text>
        </View>
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} contentFit="contain" />
          ) : (
            <Text style={[styles.placeholder, { color: textSecondary }]}>📦</Text>
          )}
        </View>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={3}>
          {productName}
        </Text>
        <View style={[styles.scoreRow, { borderColor: brandColor }]}>
          <Text style={[styles.scoreLabel, { color: textSecondary }]}>TruScore</Text>
          <Text style={[styles.scoreValue, { color: brandColor }]}>{scoreLabel}</Text>
        </View>
        <Text style={[styles.link, { color: textSecondary }]} numberOfLines={2}>
          {link}
        </Text>
      </View>
    );
  }
);

ShareProductStoryCard.displayName = 'ShareProductStoryCard';

const styles = StyleSheet.create({
  root: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 20,
    overflow: 'hidden',
    paddingBottom: 16,
  },
  headerBand: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  imageWrap: {
    height: 200,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    fontSize: 64,
  },
  title: {
    marginHorizontal: 16,
    marginTop: 14,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  scoreRow: {
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  link: {
    marginHorizontal: 16,
    marginTop: 12,
    fontSize: 12,
    lineHeight: 16,
  },
});
