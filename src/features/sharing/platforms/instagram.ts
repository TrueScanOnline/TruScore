// Instagram sharing implementation
// Uses Instagram Stories API or fallback to native share

import { ShareContent, ShareResult } from '../types';
import { Share } from 'react-native';
import { logger } from '../../../utils/logger';
import * as Linking from 'expo-linking';

export class InstagramShare {
  /**
   * Share to Instagram
   * Uses Instagram Stories API if available, otherwise falls back to native share
   */
  static async share(content: ShareContent): Promise<ShareResult> {
    try {
      // Instagram Stories requires image
      if (content.imageUrl) {
        // Try Instagram Stories deep link
        const instagramUrl = `instagram://library?AssetPath=${encodeURIComponent(content.imageUrl)}`;
        
        const canOpen = await Linking.canOpenURL(instagramUrl);
        
        if (canOpen) {
          await Linking.openURL(instagramUrl);
          return {
            success: true,
            platform: 'instagram',
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
        platform: 'instagram',
      };
    } catch (error) {
      logger.error('Error sharing to Instagram:', error);
      return {
        success: false,
        platform: 'instagram',
        error: error instanceof Error ? error : new Error('Instagram share failed'),
      };
    }
  }
}


