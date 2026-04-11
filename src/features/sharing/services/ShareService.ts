// Unified sharing service
// Handles sharing across multiple platforms

import { Share } from 'react-native';
import { ShareContent, ShareOptions, ShareResult } from '../types';
import { ShareContentBuilder } from './ShareContentBuilder';
import { logger } from '../../../utils/logger';
import { shareAnalytics } from '../../../utils/shareAnalytics';
import { reportShareEventToBackend } from '../../../utils/reportShareEvent';
import { FacebookShare } from '../platforms/facebook';
import { InstagramShare } from '../platforms/instagram';
import { TwitterShare } from '../platforms/twitter';
import { SnapchatShare } from '../platforms/snapchat';
import { TikTokShare } from '../platforms/tiktok';
import { WhatsAppShare } from '../platforms/whatsapp';
import { SMSShare } from '../platforms/sms';

export class ShareService {
  /**
   * Share content to specified platform
   */
  static async share(options: ShareOptions): Promise<ShareResult> {
    const { platform = 'native' } = options;

    try {
      const content = ShareContentBuilder.buildContent(options);
      const optimizedContent = ShareContentBuilder.optimizeForPlatform(content, platform);

      if (options.customMessage && options.customMessage.trim()) {
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

      if (options.product) {
        const trackedPlatform = result.platform || platform;
        shareAnalytics.trackShare({
          timestamp: Date.now(),
          platform: trackedPlatform,
          itemType: options.item || 'productInfo',
          productBarcode: options.product.barcode,
          truScore: options.truScore?.truscore || options.product.trust_score || undefined,
          success: result.success,
        });
        void reportShareEventToBackend({
          barcode: options.product.barcode,
          platform: trackedPlatform,
          itemType: options.item || 'productInfo',
          success: result.success,
        });
      }

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

  /**
   * Share using native share sheet (fallback)
   */
  private static async shareNative(content: ShareContent, _options?: ShareOptions): Promise<ShareResult> {
    try {
      const appCTA = content.url
        ? `\n\n🔍 See full details → ${content.url}\n📱 Free app - opens instantly if installed`
        : `\n\n📱 Get TruScore free - scan any product`;

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
