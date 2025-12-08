// WhatsApp sharing implementation
// Uses WhatsApp URL scheme or fallback to native share

import { ShareContent, ShareResult } from '../types';
import { Share } from 'react-native';
import { logger } from '../../../utils/logger';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export class WhatsAppShare {
  /**
   * Share to WhatsApp
   * Uses WhatsApp URL scheme: whatsapp://send?text=...
   * Falls back to native share if WhatsApp is not installed
   */
  static async share(content: ShareContent): Promise<ShareResult> {
    try {
      // Build WhatsApp share URL
      // WhatsApp URL scheme only supports text parameter, not separate URL
      // We need to include the URL in the message text for WhatsApp to show link preview
      // Format it cleanly so it doesn't look like a raw URL
      let whatsappMessage = content.message;
      if (content.url) {
        // Add URL at the end with clean formatting for link preview
        // WhatsApp will automatically create a link preview card from the URL
        whatsappMessage += `\n\n${content.url}`;
      }
      
      // Encode the message for URL
      const encodedMessage = encodeURIComponent(whatsappMessage);
      
      // WhatsApp URL scheme
      // Format: whatsapp://send?text=...
      // Note: On iOS, you may need to use whatsapp://send?text=... without phone number
      // On Android, the format is the same
      const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;
      
      // Check if WhatsApp is installed
      // Note: On iOS, you need to add 'whatsapp' to LSApplicationQueriesSchemes in app.config.js
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        return {
          success: true,
          platform: 'whatsapp',
        };
      }

      // Fallback: Try web WhatsApp (works on desktop/web)
      if (Platform.OS === 'web') {
        const webWhatsappUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
        try {
          await Linking.openURL(webWhatsappUrl);
          return {
            success: true,
            platform: 'whatsapp',
          };
        } catch (webError) {
          logger.warn('Web WhatsApp failed, falling back to native share');
        }
      }

      // Fallback to native share
      // Don't pass url separately - it gets auto-appended
      const result = await Share.share({
        message: whatsappMessage,
        title: content.title,
        // URL already included in message above
      });

      return {
        success: result.action === Share.sharedAction,
        platform: 'whatsapp',
      };
    } catch (error) {
      logger.error('Error sharing to WhatsApp:', error);
      return {
        success: false,
        platform: 'whatsapp',
        error: error instanceof Error ? error : new Error('WhatsApp share failed'),
      };
    }
  }
}
