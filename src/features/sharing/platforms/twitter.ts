// Twitter / X — intent uses separate text and url so the link is not duplicated in the body.

import { ShareContent, ShareResult } from '../types';
import { Share } from 'react-native';
import { logger } from '../../../utils/logger';
import * as Linking from 'expo-linking';

export class TwitterShare {
  static async share(content: ShareContent): Promise<ShareResult> {
    try {
      let textBody = (content.message || '').trim();
      if (content.url) {
        textBody = textBody.split(content.url).join('').replace(/\n{3,}/g, '\n\n').trim();
      }
      const maxText = 240;
      if (textBody.length > maxText) {
        textBody = `${textBody.substring(0, maxText - 1)}…`;
      }

      const text = encodeURIComponent(textBody);
      const url = content.url ? encodeURIComponent(content.url) : '';
      const hashtags = content.hashtags?.join(',') || '';
      const twitterUrl = `https://twitter.com/intent/tweet?text=${text}${url ? `&url=${url}` : ''}${hashtags ? `&hashtags=${hashtags}` : ''}`;

      try {
        await Linking.openURL(twitterUrl);
        return {
          success: true,
          platform: 'twitter',
        };
      } catch (linkErr) {
        logger.warn('Twitter intent failed, falling back to native share', linkErr);
      }

      const combinedMessage = content.url ? `${textBody}\n\n${content.url}` : textBody;
      const result = await Share.share({
        message: combinedMessage,
        title: content.title,
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
