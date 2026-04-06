// Share Modal - Platform picker for viral sharing
// Allows users to select platform and customize share content

import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { getNutritionShareBurnData } from '../utils/nutritionShareCopy';
import { ShareService } from '../features/sharing/services/ShareService';
import { ShareContentBuilder } from '../features/sharing/services/ShareContentBuilder';
import { ShareOptions, SharePlatform } from '../features/sharing/types';
import { ProductWithTrustScore } from '../types/product';
import { TruScoreResult } from '../lib/truscoreEngine';
import { logger } from '../utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  product: ProductWithTrustScore;
  truScore?: TruScoreResult | null;
  shareType?: 'truScore' | 'recall' | 'countryOfManufacture' | 'negativeTruScore' | 'productInfo' | 'insights' | 'palmOil' | 'nutrition' | 'ingredients' | 'processing' | 'allergens' | 'ecoscore';
  country?: string; // Optional country data for countryOfManufacture sharing
  /** Seeds the optional user message when the modal opens (e.g. nutrition activity-equivalent note). */
  initialCustomMessage?: string;
}

const PLATFORMS: Array<{
  id: SharePlatform;
  name: string;
  icon: string;
  color: string;
  description: string;
}> = [
  {
    id: 'native',
    name: 'Share Sheet',
    icon: 'share-outline',
    color: '#16a085',
    description: 'Choose from installed apps',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'logo-facebook',
    color: '#1877F2',
    description: 'Post to Facebook',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'logo-instagram',
    color: '#E4405F',
    description: 'Share to Instagram Stories',
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: 'logo-twitter',
    color: '#1DA1F2',
    description: 'Tweet about this product',
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    icon: 'logo-snapchat',
    color: '#FFFC00',
    description: 'Share to Snapchat',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'musical-notes-outline',
    color: '#000000',
    description: 'Create TikTok content',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: 'logo-whatsapp',
    color: '#25D366',
    description: 'Share via WhatsApp',
  },
  {
    id: 'sms',
    name: 'Text Message',
    icon: 'chatbubble-outline',
    color: '#34C759',
    description: 'Send via SMS',
  },
];

export default function ShareModal({
  visible,
  onClose,
  product,
  truScore,
  shareType = 'truScore',
  country,
  initialCustomMessage,
}: ShareModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [sharing, setSharing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<SharePlatform | null>(null);
  const [customMessage, setCustomMessage] = useState('');

  const nutritionBurnData = useMemo(
    () => (shareType === 'nutrition' ? getNutritionShareBurnData(product.nutriments) : null),
    [shareType, product.nutriments, product.barcode]
  );

  const defaultNutritionMessage = useMemo(() => {
    if (shareType !== 'nutrition' || !nutritionBurnData?.burn) return '';
    const { burn } = nutritionBurnData;
    return t('shareModal.nutritionDefaultMessage', {
      walk: burn.walking,
      run: burn.running,
      cycle: burn.cycling,
    });
  }, [shareType, nutritionBurnData, t]);

  useEffect(() => {
    if (!visible) return;
    const external = (initialCustomMessage ?? '').trim();
    if (external) {
      setCustomMessage(initialCustomMessage ?? '');
      return;
    }
    if (shareType === 'nutrition' && defaultNutritionMessage) {
      setCustomMessage(defaultNutritionMessage);
    } else {
      setCustomMessage('');
    }
  }, [visible, initialCustomMessage, shareType, defaultNutritionMessage]);

  const handleShare = async (platform: SharePlatform) => {
    try {
      setSharing(true);
      setSelectedPlatform(platform);

      const shareOptions: ShareOptions = {
        product,
        truScore: truScore ?? undefined,
        item: shareType,
        platform,
        customMessage: customMessage.trim() || undefined, // Include custom message if provided
        country: country || undefined, // Include country if provided (for countryOfManufacture sharing)
      };

      const result = await ShareService.share(shareOptions);

      if (result.success) {
        // Show success message
        logger.info(`Successfully shared to ${platform}`);
        // Reset custom message and close modal after short delay
        setTimeout(() => {
          setCustomMessage('');
          onClose();
          setSharing(false);
          setSelectedPlatform(null);
        }, 500);
      } else {
        logger.error(`Failed to share to ${platform}`, result.error);
        // Show error but don't close modal
        setSharing(false);
        setSelectedPlatform(null);
      }
    } catch (error) {
      logger.error('Error sharing', error);
      setSharing(false);
      setSelectedPlatform(null);
    }
  };

  // Reset custom message when modal closes
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

  /** Nutrition: hook ("Check this out…") lives only in the message box; Summary shows the structured block below. Share still sends both. */
  const previewMessage =
    shareType === 'nutrition'
      ? baseContent.message
      : customMessage.trim()
        ? `${customMessage.trim()}\n\n${baseContent.message}`
        : baseContent.message;

  const inputPlaceholder =
    shareType === 'nutrition' && nutritionBurnData && !nutritionBurnData.burn
      ? t('shareModal.nutritionPlaceholderNoBurn')
      : t('shareModal.messagePlaceholder');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('shareModal.headerTitle')}</Text>
          <TouchableOpacity
            onPress={handleClose}
            style={[styles.closeButton, { backgroundColor: colors.border }]}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Custom Message Input */}
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              {t('shareModal.addMessageOptional')}
            </Text>
            <TextInput
              style={[
                styles.textInput,
                shareType === 'nutrition' && styles.textInputNutrition,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder={inputPlaceholder}
              placeholderTextColor={colors.textSecondary}
              value={customMessage}
              onChangeText={setCustomMessage}
              multiline
              numberOfLines={shareType === 'nutrition' ? 6 : 4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {customMessage.length}/500
            </Text>
          </View>

          {/* Summary (full outgoing share text) */}
          <View style={[styles.previewContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.previewTitle, { color: colors.text }]}>{t('shareModal.summary')}</Text>
            <Text
              style={[styles.previewText, { color: colors.textSecondary }]}
              {...(shareType === 'nutrition' ? {} : { numberOfLines: 8 })}
            >
              {previewMessage}
            </Text>
            {baseContent.hashtags && baseContent.hashtags.length > 0 && (
              <View style={styles.hashtagsContainer}>
                {baseContent.hashtags.slice(0, 3).map((tag, index) => (
                  <Text key={index} style={[styles.hashtag, { color: colors.primary }]}>
                    #{tag}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Platform Selection */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Share to Platform</Text>
          <View style={styles.platformsGrid}>
            {PLATFORMS.map((platform) => {
              const isSharing = sharing && selectedPlatform === platform.id;
              return (
                <TouchableOpacity
                  key={platform.id}
                  style={[
                    styles.platformButton,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isSharing && { opacity: 0.6 },
                  ]}
                  onPress={() => handleShare(platform.id)}
                  disabled={sharing}
                >
                  <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
                    <Ionicons name={platform.icon as any} size={32} color={platform.color} />
                  </View>
                  <Text style={[styles.platformName, { color: colors.text }]}>
                    {platform.name}
                  </Text>
                  <Text style={[styles.platformDesc, { color: colors.textSecondary }]}>
                    {platform.description}
                  </Text>
                  {isSharing && (
                    <View style={styles.sharingIndicator}>
                      <Text style={[styles.sharingText, { color: colors.primary }]}>Sharing...</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tips for Viral Sharing */}
          <View style={[styles.tipsContainer, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name="bulb-outline" size={20} color={colors.primary} />
            <View style={styles.tipsContent}>
              <Text style={[styles.tipsTitle, { color: colors.text }]}>🚀 Make It Viral</Text>
              <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
                • Share surprising TruScores to spark curiosity{'\n'}
                • Add your personal take on the product{'\n'}
                • Tag friends who care about what they buy{'\n'}
                • Use trending hashtags for maximum reach{'\n'}
                • Share recall alerts to help others stay safe
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  previewContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtag: {
    fontSize: 12,
    fontWeight: '600',
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
