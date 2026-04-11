// Facebook sharing — link preview comes from the destination URL; optional quote prefills text.

import { ShareContent, ShareResult } from '../types';
import { Share } from 'react-native';
import { logger } from '../../../utils/logger';
import * as Linking from 'expo-linking';

export class FacebookShare {
  static async share(content: ShareContent): Promise<ShareResult> {
    try {
      const u = encodeURIComponent(content.url || '');
      const quote = encodeURIComponent((content.message || '').substring(0, 600));
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${quote}`;

      try {
        await Linking.openURL(facebookUrl);
        return {
          success: true,
          platform: 'facebook',
        };
      } catch (linkErr) {
        logger.warn('Facebook sharer URL failed, falling back to native share', linkErr);
      }

      const combinedMessage = content.url ? `${content.message}\n\n${content.url}` : content.message;
      const result = await Share.share({
        message: combinedMessage,
        title: content.title,
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
