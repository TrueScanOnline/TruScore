// Twitter/X sharing implementation
// Uses Twitter API or fallback to native share

import { ShareContent, ShareResult } from '../types';
import { Share } from 'react-native';
import { logger } from '../../../utils/logger';
import * as Linking from 'expo-linking';

export class TwitterShare {
  /**
   * Share to Twitter/X
   * Uses Twitter Share URL or fallback to native share
   */
  static async share(content: ShareContent): Promise<ShareResult> {
    try {
      // Build Twitter share URL
      const text = encodeURIComponent(content.message.substring(0, 280));
      const url = content.url ? encodeURIComponent(content.url) : '';
      const hashtags = content.hashtags?.join(',') || '';
      const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`;
      
      const canOpen = await Linking.canOpenURL(twitterUrl);
      
      if (canOpen) {
        await Linking.openURL(twitterUrl);
        return {
          success: true,
          platform: 'twitter',
        };
      }

      // Fallback to native share
      // URL already included in Twitter URL above
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
        platform: 'twitter',
      };
    } catch (error) {
      logger.error('Error sharing to Twitter:', error);
      return {
        success: false,
        platform: 'twitter',
        error: error instanceof Error ? error : new Error('Twitter share failed'),
      };
    }
  }
}


