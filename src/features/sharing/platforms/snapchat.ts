// Snapchat sharing implementation
// Uses Snapchat Creative Kit or fallback to native share

import { ShareContent, ShareResult } from '../types';
import { Share } from 'react-native';
import { logger } from '../../../utils/logger';
import * as Linking from 'expo-linking';

export class SnapchatShare {
  /**
   * Share to Snapchat
   * Uses Snapchat Creative Kit if available, otherwise falls back to native share
   */
  static async share(content: ShareContent): Promise<ShareResult> {
    try {
      // Snapchat requires image and uses Creative Kit
      if (content.imageUrl) {
        // Try Snapchat deep link
        const snapchatUrl = `snapchat://creativekit?attachmentUrl=${encodeURIComponent(content.imageUrl)}`;
        
        const canOpen = await Linking.canOpenURL(snapchatUrl);
        
        if (canOpen) {
          await Linking.openURL(snapchatUrl);
          return {
            success: true,
            platform: 'snapchat',
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
        platform: 'snapchat',
      };
    } catch (error) {
      logger.error('Error sharing to Snapchat:', error);
      return {
        success: false,
        platform: 'snapchat',
        error: error instanceof Error ? error : new Error('Snapchat share failed'),
      };
    }
  }
}


