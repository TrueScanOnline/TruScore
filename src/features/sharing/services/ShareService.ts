// Unified sharing service
// Handles sharing across multiple platforms

import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ShareContent, ShareOptions, ShareResult } from '../types';
import { ShareContentBuilder } from './ShareContentBuilder';
import { logger } from '../../../utils/logger';
import { shareAnalytics } from '../../../utils/shareAnalytics';
import { reportShareEventToBackend } from '../../../utils/reportShareEvent';
import { publishedShareAnalyticsScore } from '../../../utils/shareScoreSemantics';
import { FacebookShare } from '../platforms/facebook';
import { InstagramShare } from '../platforms/instagram';
import { TwitterShare } from '../platforms/twitter';
import { SnapchatShare } from '../platforms/snapchat';
import { TikTokShare } from '../platforms/tiktok';
import { WhatsAppShare } from '../platforms/whatsapp';
import { SMSShare } from '../platforms/sms';
import { shareStoryCardImage } from '../platforms/shareCardImage';
import { buildReceiverCaption } from '../receiverCaption';

export class ShareService {
  /**
   * Share content to specified platform
   */
  static async share(options: ShareOptions): Promise<ShareResult> {
    const { platform = 'native' } = options;

    try {
      const content = ShareContentBuilder.buildContent(options);
      const optimizedContent = ShareContentBuilder.optimizeForPlatform(content, platform);

      if (options.receiver) {
        const captionInput = {
          note: options.customMessage,
          productName: options.receiver.productName,
          section: options.receiver.section,
          summary: options.receiver.summary,
          url: optimizedContent.url,
        };
        const imageCaption = buildReceiverCaption({ ...captionInput, includeSummary: false });
        // Expo Go can attach the captured card as a real picture. Text message uses that
        // same picture. A words-only message is only the fallback when capture failed.
        if (options.storyImageUri) {
          if (optimizedContent.url) {
            try {
              await Clipboard.setStringAsync(optimizedContent.url);
            } catch (copyError) {
              logger.warn('Could not copy the share link', copyError);
            }
          }
          const sentCard = await shareStoryCardImage({
            imageUri: options.storyImageUri,
            caption: imageCaption,
            platform,
          });
          if (sentCard) {
            const sent = { success: true, platform } satisfies ShareResult;
            this.recordShare(options, sent, platform);
            return sent;
          }
        }
        optimizedContent.message = buildReceiverCaption({ ...captionInput, includeSummary: true });
      } else if (options.customMessage && options.customMessage.trim()) {
        optimizedContent.message = `${options.customMessage.trim()}\n\n${optimizedContent.message}`;
      }

      let result: ShareResult;

      switch (platform) {
        case 'facebook':
          result = await FacebookShare.share(optimizedContent);
          break;

        case 'instagram':
          result = await InstagramShare.share(optimizedContent);
          break;

        case 'twitter':
          result = await TwitterShare.share(optimizedContent);
          break;

        case 'snapchat':
          result = await SnapchatShare.share(optimizedContent);
          break;

        case 'tiktok':
          result = await TikTokShare.share(optimizedContent);
          break;

        case 'moreApps': {
          const nativeResult = await this.shareNative(optimizedContent, options);
          result = { ...nativeResult, platform: 'moreApps' };
          break;
        }

        case 'whatsapp':
          result = await WhatsAppShare.share(optimizedContent);
          break;

        case 'sms':
          result = await SMSShare.share(optimizedContent);
          break;

        case 'native':
        default:
          result = await this.shareNative(optimizedContent, options);
          break;
      }

      this.recordShare(options, result, platform);
      return result;
    } catch (error) {
      logger.error('Error sharing:', error);
      return {
        success: false,
        platform,
        error: error instanceof Error ? error : new Error('Unknown sharing error'),
      };
    }
  }

  private static recordShare(options: ShareOptions, result: ShareResult, platform: ShareResult['platform']) {
    if (!options.product) return;
    const trackedPlatform = result.platform || platform;
    shareAnalytics.trackShare({
      timestamp: Date.now(),
      platform: trackedPlatform,
      itemType: options.item || 'productInfo',
      productBarcode: options.product.barcode,
      // Published score only. NR, Checking, and a missing publication record nothing.
      truScore: publishedShareAnalyticsScore(options.truScore, {
        publicationSettled: options.publicationSettled,
      }),
      success: result.success,
    });
    void reportShareEventToBackend({
      barcode: options.product.barcode,
      platform: trackedPlatform,
      itemType: options.item || 'productInfo',
      success: result.success,
    });
  }

  /**
   * Share using native share sheet (fallback)
   */
  private static async shareNative(content: ShareContent, _options?: ShareOptions): Promise<ShareResult> {
    try {
      const alreadyLinked = Boolean(content.url && content.message.includes(content.url));
      const appCTA = alreadyLinked
        ? ''
        : content.url
          ? `\n\n🔍 See full details → ${content.url}\n📱 Free app - opens instantly if installed`
          : `\n\n📱 Get Rveel free - scan any product`;

      const combinedMessage = `${content.message}${appCTA}`;

      const result = await Share.share({
        message: combinedMessage,
        title: content.title,
      });

      const success = result.action === Share.sharedAction;

      return {
        success,
        platform: 'native',
      };
    } catch (error) {
      logger.error('Error with native share:', error);

      return {
        success: false,
        platform: 'native',
        error: error instanceof Error ? error : new Error('Native share failed'),
      };
    }
  }

  static async shareWithPlatformSelection(options: ShareOptions): Promise<ShareResult> {
    return await this.share({ ...options, platform: 'native' });
  }
}
