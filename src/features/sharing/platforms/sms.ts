// SMS (Text Message) sharing implementation
// Uses SMS URL scheme or fallback to native share

import { ShareContent, ShareResult } from '../types';
import { Share } from 'react-native';
import { logger } from '../../../utils/logger';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export class SMSShare {
  /**
   * Share via SMS (Text Message)
   * Uses SMS URL scheme: sms:?body=... (iOS) or sms:?body=... (Android)
   * Falls back to native share if SMS is not available
   */
  static async share(content: ShareContent): Promise<ShareResult> {
    try {
      // Build SMS message
      // Include URL in message for SMS (SMS doesn't support link previews)
      // Format it cleanly
      let smsMessage = content.message;
      if (content.url) {
        smsMessage += `\n\n📱 Open in Rveel:\n${content.url}`;
      }
      
      // Encode the message for URL
      const encodedMessage = encodeURIComponent(smsMessage);
      
      // SMS URL scheme
      // Format: sms:?body=... (opens SMS app with pre-filled message)
      // Note: On iOS, you can also specify a number: sms:+1234567890&body=...
      // For Android, the format is: sms:?body=...
      // iOS format: sms:&body=... (no number, opens new message)
      // Android format: sms:?body=... (opens SMS app with pre-filled message)
      const smsUrl = Platform.OS === 'ios' 
        ? `sms:&body=${encodedMessage}`
        : `sms:?body=${encodedMessage}`;
      
      // Check if SMS is available
      // Note: On iOS, you need to add 'sms' to LSApplicationQueriesSchemes in app.config.js
      const canOpen = await Linking.canOpenURL(smsUrl);
      
      if (canOpen) {
        await Linking.openURL(smsUrl);
        return {
          success: true,
          platform: 'sms',
        };
      }

      // Fallback to native share (which includes SMS option)
      // URL already included in message
      const result = await Share.share({
        message: smsMessage,
        title: content.title,
        // Don't pass url separately
      });

      return {
        success: result.action === Share.sharedAction,
        platform: 'sms',
      };
    } catch (error) {
      logger.error('Error sharing via SMS:', error);
      return {
        success: false,
        platform: 'sms',
        error: error instanceof Error ? error : new Error('SMS share failed'),
      };
    }
  }
}
