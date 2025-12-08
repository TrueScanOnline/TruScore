// Unified sharing service
// Handles sharing across multiple platforms

import { Share } from 'react-native';
import { ShareContent, ShareOptions, ShareResult, SharePlatform } from '../types';
import { ShareContentBuilder } from './ShareContentBuilder';
import { logger } from '../../../utils/logger';
import { shareAnalytics } from '../../../utils/shareAnalytics';
import { FacebookShare } from '../platforms/facebook';
import { InstagramShare } from '../platforms/instagram';
import { TwitterShare } from '../platforms/twitter';
import { SnapchatShare } from '../platforms/snapchat';
import { TikTokShare } from '../platforms/tiktok';
import { YouTubeShare } from '../platforms/youtube';
import { WhatsAppShare } from '../platforms/whatsapp';
import { SMSShare } from '../platforms/sms';

export class ShareService {
  /**
   * Share content to specified platform
   */
  static async share(options: ShareOptions): Promise<ShareResult> {
    const { platform = 'native' } = options;

    try {
      // Build content
      const content = ShareContentBuilder.buildContent(options);
      const optimizedContent = ShareContentBuilder.optimizeForPlatform(content, platform);
      
      // Override message with custom message if provided
      if (options.customMessage && options.customMessage.trim()) {
        optimizedContent.message = `${options.customMessage.trim()}\n\n${optimizedContent.message}`;
      }

      // Share to platform
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
        
        case 'youtube':
          result = await YouTubeShare.share(optimizedContent);
          break;
        
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
      
      // Track analytics for all platforms
      if (options.product) {
        shareAnalytics.trackShare({
          timestamp: Date.now(),
          platform: result.platform || platform,
          itemType: options.item || 'productInfo',
          productBarcode: options.product.barcode,
          truScore: options.truScore?.truscore || options.product.trust_score || undefined,
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
   * NOTE: React Native Share API automatically appends URL to message on iOS/Android
   * We format the URL as a clean, compelling call-to-action that drives users to the app
   */
  private static async shareNative(content: ShareContent, options?: ShareOptions): Promise<ShareResult> {
    try {
      // Format URL as compelling CTA - drives to app or app stores
      // Universal link automatically opens app if installed, or redirects to app stores
      const appCTA = content.url 
        ? `\n\n🔍 See full details → ${content.url}\n📱 Free app - opens instantly if installed`
        : `\n\n📱 Get TruScore free - scan any product`;
      
      const combinedMessage = `${content.message}${appCTA}`;
      
      // Don't pass url separately - it gets auto-appended by React Native
      // Instead, include it in the message with compelling formatting
      const result = await Share.share({
        message: combinedMessage,
        title: content.title,
        // DO NOT pass url - it causes React Native to append it automatically
      });

      const success = result.action === Share.sharedAction;
      
      // Track analytics
      if (options?.product) {
        shareAnalytics.trackShare({
          timestamp: Date.now(),
          platform: 'native',
          itemType: options.item || 'productInfo',
          productBarcode: options.product.barcode,
          truScore: options.truScore?.truscore || options.product.trust_score || undefined,
          success,
        });
      }
      
      return {
        success,
        platform: 'native',
      };
    } catch (error) {
      logger.error('Error with native share:', error);
      
      // Track failed share
      if (options?.product) {
        shareAnalytics.trackShare({
          timestamp: Date.now(),
          platform: 'native',
          itemType: options.item || 'productInfo',
          productBarcode: options.product.barcode,
          truScore: options.truScore?.truscore || options.product.trust_score || undefined,
          success: false,
        });
      }
      
      return {
        success: false,
        platform: 'native',
        error: error instanceof Error ? error : new Error('Native share failed'),
      };
    }
  }

  /**
   * Show platform selection modal and share
   */
  static async shareWithPlatformSelection(options: ShareOptions): Promise<ShareResult> {
    // For now, use native share sheet which shows platform options
    // In future, can implement custom platform picker
    return await this.share({ ...options, platform: 'native' });
  }
}


