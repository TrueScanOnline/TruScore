// TikTok sharing implementation
// Uses TikTok Share or fallback to native share

import { ShareContent, ShareResult } from '../types';
import { Share } from 'react-native';
import { logger } from '../../../utils/logger';
import * as Linking from 'expo-linking';

export class TikTokShare {
  /**
   * Share to TikTok
   * Uses TikTok Share if available, otherwise falls back to native share
   */
  static async share(content: ShareContent): Promise<ShareResult> {
    try {
      // TikTok requires video/image
      if (content.imageUrl) {
        // Try TikTok deep link
        const tiktokUrl = `tiktok://share?url=${encodeURIComponent(content.url || '')}`;
        
        const canOpen = await Linking.canOpenURL(tiktokUrl);
        
        if (canOpen) {
          await Linking.openURL(tiktokUrl);
          return {
            success: true,
            platform: 'tiktok',
          };
        }
      }

      // Fallback to native share
      const combinedMessage = content.url 
        ? `${content.message}\n\n${content.url}`
        : content.message;
      const result = await Share.share({
        message: combinedMessage,
        title: content.title,
        // Don't pass url separately
      });

      return {
        success: result.action === Share.sharedAction,
        platform: 'tiktok',
      };
    } catch (error) {
      logger.error('Error sharing to TikTok:', error);
      return {
        success: false,
        platform: 'tiktok',
        error: error instanceof Error ? error : new Error('TikTok share failed'),
      };
    }
  }
}


