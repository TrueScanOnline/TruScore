// YouTube sharing implementation
// Uses YouTube API for video sharing or fallback to native share

import { ShareContent, ShareResult } from '../types';
import { Share } from 'react-native';
import { logger } from '../../../utils/logger';
import * as Linking from 'expo-linking';

export class YouTubeShare {
  /**
   * Share to YouTube
   * Uses YouTube API if available, otherwise falls back to native share
   */
  static async share(content: ShareContent): Promise<ShareResult> {
    try {
      // YouTube sharing typically requires video content
      // For now, use native share or open YouTube with URL
      const youtubeUrl = `https://www.youtube.com/upload?url=${encodeURIComponent(content.url || '')}`;
      
      const canOpen = await Linking.canOpenURL(youtubeUrl);
      
      if (canOpen) {
        await Linking.openURL(youtubeUrl);
        return {
          success: true,
          platform: 'youtube',
        };
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
        platform: 'youtube',
      };
    } catch (error) {
      logger.error('Error sharing to YouTube:', error);
      return {
        success: false,
        platform: 'youtube',
        error: error instanceof Error ? error : new Error('YouTube share failed'),
      };
    }
  }
}


