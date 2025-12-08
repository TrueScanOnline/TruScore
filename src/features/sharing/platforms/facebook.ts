// Facebook sharing implementation
// Uses Facebook SDK or fallback to native share

import { ShareContent, ShareResult } from '../types';
import { Share } from 'react-native';
import { logger } from '../../../utils/logger';
import * as Linking from 'expo-linking';

export class FacebookShare {
  /**
   * Share to Facebook
   * Uses Facebook Share Dialog if available, otherwise falls back to native share
   */
  static async share(content: ShareContent): Promise<ShareResult> {
    try {
      // Try Facebook Share Dialog URL
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url || '')}`;
      
      // Check if Facebook app is installed
      const canOpen = await Linking.canOpenURL(facebookUrl);
      
      if (canOpen) {
        await Linking.openURL(facebookUrl);
        return {
          success: true,
          platform: 'facebook',
        };
      }

      // Fallback to native share
      // Combine message and URL to prevent auto-append
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
        platform: 'facebook',
      };
    } catch (error) {
      logger.error('Error sharing to Facebook:', error);
      return {
        success: false,
        platform: 'facebook',
        error: error instanceof Error ? error : new Error('Facebook share failed'),
      };
    }
  }
}


