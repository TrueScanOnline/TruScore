// Share Modal — platform picker, copy link, presets, optional story image

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { resultEmeraldTone, resultPresentation, type ResultPillarKey } from '../theme/resultPresentation';
import { publishedOverallVisualScore } from '../utils/truScorePresentation';
import { getNutritionShareBurnData } from '../utils/nutritionShareCopy';
import { buildShareUrl } from '../utils/shareUrl';
import { ShareService } from '../features/sharing/services/ShareService';
import { ShareContentBuilder } from '../features/sharing/services/ShareContentBuilder';
import { ShareOptions, SharePlatform } from '../features/sharing/types';
import { ProductWithTrustScore } from '../types/product';
import { TruScoreResult } from '../lib/truscoreEngine';
import { resolveShareBreakdownForOverall, resolveShareOverallScore, shareImageScoreState } from '../utils/shareScoreSemantics';
import { consumerPillarLabel } from '../lib/scoreHighlights';
import { logger } from '../utils/logger';
import { ShareProductStoryCard } from './ShareProductStoryCard';
import { sharePathSummary } from './sharePathSummary';
import { highlightShareRows, nutritionShareRows, originShareRows } from './shareCardRows';
import { shareStoryHeading } from './shareStoryHeading';
import { armShareImageGate, releaseShareImageGate, waitForShareImageGate, type ShareImageGate } from './shareImageCaptureGate';

const SHARE_IMAGE_TIMEOUT_MS = 4000;

function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  product: ProductWithTrustScore;
  truScore?: TruScoreResult | null;
  shareType?: 'truScore' | 'recall' | 'countryOfManufacture' | 'negativeTruScore' | 'productInfo' | 'insights' | 'palmOil' | 'nutrition' | 'ingredients' | 'processing' | 'allergens' | 'ecoscore' | 'highlights';
  /** Lines currently shown on the What we found card, with the pillar each line belongs to. */
  highlightEntries?: Array<{ pillar: ResultPillarKey; text: string }>;
  country?: string;
  initialCustomMessage?: string;
  /** Result checking latch. False keeps the image and the text share unpublished. */
  publicationSettled?: boolean;
}

const PLATFORM_DEFS: {
  id: SharePlatform;
  icon: string;
  color: string;
  nameKey: string;
  descKey: string;
}[] = [
  { id: 'whatsapp', icon: 'logo-whatsapp', color: '#25D366', nameKey: 'shareModal.platformWhatsappName', descKey: 'shareModal.platformWhatsappDesc' },
  { id: 'sms', icon: 'chatbubble-outline', color: '#34C759', nameKey: 'shareModal.platformSmsName', descKey: 'shareModal.platformSmsDesc' },
  { id: 'facebook', icon: 'logo-facebook', color: '#1877F2', nameKey: 'shareModal.platformFacebookName', descKey: 'shareModal.platformFacebookDesc' },
  { id: 'twitter', icon: 'logo-twitter', color: '#1DA1F2', nameKey: 'shareModal.platformTwitterName', descKey: 'shareModal.platformTwitterDesc' },
  { id: 'instagram', icon: 'logo-instagram', color: '#E4405F', nameKey: 'shareModal.platformInstagramName', descKey: 'shareModal.platformInstagramDesc' },
  { id: 'snapchat', icon: 'logo-snapchat', color: '#FFFC00', nameKey: 'shareModal.platformSnapchatName', descKey: 'shareModal.platformSnapchatDesc' },
  { id: 'tiktok', icon: 'musical-notes-outline', color: '#000000', nameKey: 'shareModal.platformTiktokName', descKey: 'shareModal.platformTiktokDesc' },
  { id: 'native', icon: 'share-outline', color: '#16a085', nameKey: 'shareModal.platformSheetName', descKey: 'shareModal.platformSheetDesc' },
  { id: 'moreApps', icon: 'apps-outline', color: '#5f6c7b', nameKey: 'shareModal.platformMoreAppsName', descKey: 'shareModal.platformMoreAppsDesc' },
];

export default function ShareModal({
  visible,
  onClose,
  product,
  truScore,
  shareType = 'truScore',
  highlightEntries,
  country,
  initialCustomMessage,
  publicationSettled,
}: ShareModalProps) {
  const { colors, darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [sharing, setSharing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<SharePlatform | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const storyCardRef = useRef<View>(null);
  const imageSettleRef = useRef<ShareImageGate | null>(null);
  const shareVisibleRef = useRef(false);
  const shareTokenRef = useRef(0);
  const [fallbackToken, setFallbackToken] = useState<number | null>(null);
  const imageKey = product.image_url || '';
  const openingShare = visible && !shareVisibleRef.current;
  shareVisibleRef.current = visible;
  if (!imageSettleRef.current || openingShare || imageSettleRef.current.url !== imageKey) {
    shareTokenRef.current += 1;
    imageSettleRef.current = armShareImageGate(imageKey, shareTokenRef.current);
  }
  const settleToken = imageSettleRef.current.token;
  const imageFallback = fallbackToken === settleToken;
  const markImageSettled = (token: number, url: string) => {
    releaseShareImageGate(imageSettleRef.current, token, url);
  };
  const waitForShareImage = async () => {
    const gate = imageSettleRef.current;
    if (!gate) return;
    const outcome = await waitForShareImageGate(gate, SHARE_IMAGE_TIMEOUT_MS);
    if (outcome === 'timeout' && imageSettleRef.current === gate && !gate.settled) {
      setFallbackToken(gate.token);
      await gate.promise;
    }
    await nextPaint();
  };

  const copyLinkUrl = useMemo(
    () =>
      buildShareUrl(product.barcode, {
        context: shareType,
        source: 'copy',
        utmSource: 'app',
        utmMedium: 'share',
        utmCampaign: shareType,
      }),
    [product, shareType]
  );

  const nutritionBurnData = useMemo(
    () => (shareType === 'nutrition' ? getNutritionShareBurnData(product.nutriments) : null),
    [shareType, product.nutriments, product.barcode]
  );

  const presetEntries = useMemo(
    () => [
      { key: 'p1', text: t('shareModal.presetRecommend') },
      { key: 'p2', text: t('shareModal.presetConcern') },
      { key: 'p3', text: t('shareModal.presetSafety') },
      { key: 'p4', text: t('shareModal.presetNutrition') },
    ],
    [t]
  );

  useEffect(() => {
    if (!visible) return;
    setCustomMessage((initialCustomMessage ?? '').trim());
  }, [visible, initialCustomMessage]);

  const applyPreset = (snippet: string) => {
    setCustomMessage((prev) => {
      const p = prev.trim();
      return p ? `${p}\n\n${snippet}` : snippet;
    });
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(copyLinkUrl);
      Toast.show({
        type: 'success',
        text1: t('shareModal.linkCopiedTitle'),
        text2: t('shareModal.linkCopiedBody'),
      });
    } catch (e) {
      logger.error('Copy link failed', e);
      Toast.show({ type: 'error', text1: t('shareModal.copyFailed') });
    }
  };

  const handleShareImage = async () => {
    try {
      setSharing(true);
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Toast.show({ type: 'error', text1: t('shareModal.shareImageUnavailable') });
        return;
      }
      const ref = storyCardRef.current;
      if (!ref) {
        Toast.show({ type: 'error', text1: t('shareModal.shareImageFailed') });
        return;
      }
      await waitForShareImage();
      const uri = await captureRef(ref, { format: 'png', quality: 0.95 });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t('shareModal.shareImageTitle'),
      });
      Toast.show({
        type: 'success',
        text1: t('shareModal.shareImageReady'),
      });
    } catch (e) {
      logger.error('Share image failed', e);
      Toast.show({ type: 'error', text1: t('shareModal.shareImageFailed') });
    } finally {
      setSharing(false);
    }
  };

  const handleShare = async (platform: SharePlatform) => {
    try {
      setSharing(true);
      setSelectedPlatform(platform);

      let storyImageUri: string | undefined;
      const ref = storyCardRef.current;
      if (ref) {
        try {
          await waitForShareImage();
          storyImageUri = await captureRef(ref, { format: 'png', quality: 0.95 });
        } catch (captureError) {
          logger.warn('Share card image was not captured', captureError);
        }
      }

      const shareOptions: ShareOptions = {
        product,
        truScore: truScore ?? undefined,
        item: shareType,
        platform,
        customMessage: customMessage.trim() || undefined,
        storyImageUri,
        receiver: {
          productName: productDisplayName,
          section: storyHeading,
          summary: pathSummary,
        },
        country: country || undefined,
        publicationSettled,
      };

      const result = await ShareService.share(shareOptions);

      if (result.success) {
        logger.info(`Successfully shared to ${platform}`);
        Toast.show({
          type: 'success',
          text1: t('shareModal.shareOpenedTitle'),
          text2: t('shareModal.shareOpenedBody'),
        });
        setTimeout(() => {
          setCustomMessage('');
          onClose();
          setSharing(false);
          setSelectedPlatform(null);
        }, 400);
      } else {
        logger.error(`Failed to share to ${platform}`, result.error);
        Toast.show({
          type: 'error',
          text1: t('shareModal.shareFailedTitle'),
          text2: t('shareModal.shareFailedBody'),
        });
        setSharing(false);
        setSelectedPlatform(null);
      }
    } catch (error) {
      logger.error('Error sharing', error);
      Toast.show({
        type: 'error',
        text1: t('shareModal.shareFailedTitle'),
        text2: t('shareModal.shareFailedBody'),
      });
      setSharing(false);
      setSelectedPlatform(null);
    }
  };

  const handleClose = () => {
    setCustomMessage('');
    onClose();
  };

  const baseContent = ShareContentBuilder.buildContent({
    product,
    truScore,
    item: shareType,
    platform: 'native',
  });

  const inputPlaceholder =
    shareType === 'nutrition' && nutritionBurnData && !nutritionBurnData.burn
      ? t('shareModal.nutritionPlaceholderNoBurn')
      : t('shareModal.messagePlaceholder');

  const productDisplayName = product.product_name || product.product_name_en || t('shareModal.productFallback');
  const publishedScore = truScore ? publishedOverallVisualScore(truScore, { publicationSettled }) : null;
  const ratedScoreColor =
    publishedScore == null
      ? undefined
      : publishedScore >= 80
        ? colors.trust.excellent
        : publishedScore >= 60
          ? colors.trust.good
          : publishedScore >= 40
            ? colors.trust.fair
            : colors.trust.poor;
  const storyHeading = shareStoryHeading(shareType);
  const storyNote = customMessage.trim();
  const storyPillars = useMemo(() => {
    const overall = resolveShareOverallScore(truScore, { publicationSettled });
    const breakdown = resolveShareBreakdownForOverall(overall, truScore, { publicationSettled });
    if (!breakdown) return null;
    const paint = resultPresentation.emerald.pillars;
    return (['Body', 'Planet', 'Ethics', 'Open'] as const).map((key) => {
      const role = paint[key];
      return {
        label: consumerPillarLabel(key),
        value: `${breakdown[key]}/25`,
        glyph: role.glyph,
        iconColor: darkMode ? resultPresentation.emerald.discIconOnDark : role.icon,
        tileColor: darkMode ? role.dark[1] : role.light[1],
      };
    });
  }, [truScore, publicationSettled, darkMode]);
  const pathSummary = useMemo(() => {
    const scoreState = shareImageScoreState(truScore, { publicationSettled });
    return sharePathSummary({
      shareType,
      product,
      country,
      scoreCaption: scoreState.caption,
      scoreValue: scoreState.neutral ? null : scoreState.valueText,
      pillars: storyPillars,
      insightLines: (truScore?.insights || []).map((item) => item.reason),
      highlightLines: (highlightEntries || []).map((entry) => entry.text),
    });
  }, [shareType, product, country, truScore, publicationSettled, storyPillars, highlightEntries]);
  const detailRows = useMemo(() => {
    if (shareType === 'highlights') return highlightShareRows(highlightEntries || [], !!darkMode);
    if (shareType === 'nutrition') return nutritionShareRows(product, !!darkMode);
    if (shareType === 'countryOfManufacture') return originShareRows(product, country);
    return null;
  }, [shareType, product, country, darkMode, highlightEntries]);
  const storyDetails = useMemo(() => {
    if (shareType === 'truScore' || shareType === 'negativeTruScore' || shareType === 'productInfo') return [];
    return pathSummary
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 12)
      .map((line) => (line.length > 180 ? `${line.slice(0, 177)}…` : line));
  }, [shareType, pathSummary]);
  const storyCardProps = {
    productName: productDisplayName,
    imageUrl: imageKey || null,
    barcode: product.barcode,
    scoreState: shareImageScoreState(truScore, { publicationSettled }),
    shareType,
    brandColor: resultPresentation.emerald.action.light,
    scoreColor: ratedScoreColor,
    surfaceColor: emerald.card,
    textColor: emerald.ink,
    textSecondary: emerald.muted,
    panelColor: emerald.chevronCircle,
    contextTitle: storyHeading,
    note: storyNote,
    details: detailRows ? [] : storyDetails,
    detailRows,
    linkLabel: `truescan.app/barcode/${product.barcode}`,
    pillars: storyPillars,
    settleToken,
    forcePlaceholder: imageFallback,
    onImageSettled: markImageSettled,
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: darkMode ? '#10241F' : '#F4FBF8' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: emerald.card,
              borderBottomColor: emerald.line,
              paddingTop: Math.max(insets.top, 12),
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: emerald.ink }]}>{t('shareModal.headerTitle')}</Text>
          <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: emerald.chevronCircle }]}>
            <Ionicons name="close" size={24} color={emerald.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Text style={[styles.cardPreviewTitle, { color: emerald.ink }]}>{t('shareModal.cardPreviewTitle')}</Text>
          <View style={styles.cardPreviewFrame}>
            <ShareProductStoryCard {...storyCardProps} />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: emerald.card, borderColor: emerald.line, borderWidth: StyleSheet.hairlineWidth }]}>
            <Text style={[styles.inputLabel, { color: emerald.ink }]}>{t('shareModal.addMessageOptional')}</Text>
            <View style={styles.presetRow}>
              {presetEntries.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.presetChip, { borderColor: emerald.line, backgroundColor: emerald.chevronCircle }]}
                  onPress={() => applyPreset(p.text)}
                  disabled={sharing}
                >
                  <Text style={[styles.presetChipText, { color: emerald.action }]} numberOfLines={2}>
                    {p.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[
                styles.textInput,
                shareType === 'nutrition' && styles.textInputNutrition,
                {
                  backgroundColor: darkMode ? '#10241F' : '#F4FBF8',
                  color: emerald.ink,
                  borderColor: emerald.line,
                },
              ]}
              placeholder={inputPlaceholder}
              placeholderTextColor={emerald.muted}
              value={customMessage}
              onChangeText={setCustomMessage}
              multiline
              numberOfLines={shareType === 'nutrition' ? 6 : 4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={[styles.charCount, { color: emerald.muted }]}>{customMessage.length}/500</Text>
          </View>

          <View style={[styles.previewContainer, { backgroundColor: emerald.card, borderColor: emerald.line, borderWidth: StyleSheet.hairlineWidth }]}>
            <Text style={[styles.previewTitle, { color: emerald.ink }]}>{t('shareModal.summary')}</Text>
            <Text style={[styles.previewText, { color: emerald.ink }]}>
              {pathSummary}
            </Text>
            <Text style={[styles.linkPreviewLabel, { color: emerald.ink }]}>{t('shareModal.linkPreviewLabel')}</Text>
            <Text selectable style={[styles.linkPreviewUrl, { color: emerald.action }]}>
              {copyLinkUrl}
            </Text>
            {baseContent.hashtags && baseContent.hashtags.length > 0 && (
              <View style={styles.hashtagsContainer}>
                {baseContent.hashtags.slice(0, 3).map((tag, index) => (
                  <Text key={index} style={[styles.hashtag, { color: emerald.action }]}>
                    #{tag}
                  </Text>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.copyLinkButton, { backgroundColor: resultPresentation.emerald.action.light }]}
            onPress={handleCopyLink}
            disabled={sharing}
          >
            <Ionicons name="link-outline" size={22} color="#fff" />
            <Text style={styles.copyLinkButtonText}>{t('shareModal.copyLink')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shareImageButton, { borderColor: emerald.action, backgroundColor: emerald.card }]}
            onPress={handleShareImage}
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator color={emerald.action} />
            ) : (
              <>
                <Ionicons name="image-outline" size={22} color={emerald.action} />
                <Text style={[styles.shareImageButtonText, { color: emerald.action }]}>
                  {t('shareModal.shareImageButton')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: emerald.ink }]}>{t('shareModal.platformSectionTitle')}</Text>
          <View style={styles.platformsGrid}>
            {PLATFORM_DEFS.map((platform) => {
              const isSharing = sharing && selectedPlatform === platform.id;
              return (
                <TouchableOpacity
                  key={platform.id}
                  style={[
                    styles.platformButton,
                    { backgroundColor: emerald.card, borderColor: emerald.line },
                    isSharing && { opacity: 0.6 },
                  ]}
                  onPress={() => handleShare(platform.id)}
                  disabled={sharing}
                >
                  <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
                    <Ionicons name={platform.icon as never} size={32} color={platform.color} />
                  </View>
                  <Text style={[styles.platformName, { color: emerald.ink }]}>{t(platform.nameKey)}</Text>
                  <Text style={[styles.platformDesc, { color: emerald.muted }]}>{t(platform.descKey)}</Text>
                  {isSharing && (
                    <View style={styles.sharingIndicator}>
                      <Text style={[styles.sharingText, { color: emerald.action }]}>{t('shareModal.sharing')}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.tipsContainer, { backgroundColor: emerald.chevronCircle }]}>
            <Ionicons name="bulb-outline" size={20} color={emerald.action} />
            <View style={styles.tipsContent}>
              <Text style={[styles.tipsTitle, { color: emerald.ink }]}>{t('shareModal.tipsTitle')}</Text>
              <Text style={[styles.tipsText, { color: emerald.muted }]}>{t('shareModal.tipsBody')}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Off-screen card for story image capture */}
        <View style={styles.offscreen} pointerEvents="none">
          <ShareProductStoryCard
            ref={storyCardRef}
            productName={productDisplayName}
            imageUrl={imageKey || null}
            barcode={product.barcode}
            scoreState={shareImageScoreState(truScore, { publicationSettled })}
            shareType={shareType}
            brandColor={resultPresentation.emerald.action.light}
            scoreColor={ratedScoreColor}
            surfaceColor={emerald.card}
            textColor={emerald.ink}
            textSecondary={emerald.muted}
            panelColor={emerald.chevronCircle}
            contextTitle={storyHeading}
            note={storyNote}
            details={detailRows ? [] : storyDetails}
            detailRows={detailRows}
            linkLabel={`truescan.app/barcode/${product.barcode}`}
            pillars={storyPillars}
            settleToken={settleToken}
            forcePlaceholder={imageFallback}
            onImageSettled={markImageSettled}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -4000,
    top: 0,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  cardPreviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  cardPreviewFrame: {
    alignItems: 'center',
    marginBottom: 16,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  presetChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    maxWidth: SCREEN_WIDTH - 64,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  linkPreviewLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 4,
  },
  linkPreviewUrl: {
    fontSize: 12,
    lineHeight: 18,
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  hashtag: {
    fontSize: 12,
    fontWeight: '600',
  },
  copyLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  copyLinkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  shareImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
    minHeight: 48,
  },
  shareImageButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  platformButton: {
    width: (SCREEN_WIDTH - 48) / 2,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  platformIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  platformDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  sharingIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  sharingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tipsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipsContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    maxHeight: 150,
  },
  textInputNutrition: {
    minHeight: 120,
    maxHeight: 200,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
});
