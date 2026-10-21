/**
 * Sends the rendered share card as a real picture.
 * A direct app intent was dropping the picture and leaving only the caption,
 * which is what Facebook, text, and WhatsApp were showing.
 */

import * as Sharing from 'expo-sharing';
import type { SharePlatform } from '../types';
import { logger } from '../../../utils/logger';

const SHEET_TITLE: Record<SharePlatform, string> = {
  whatsapp: 'Post the Rveel card to WhatsApp',
  facebook: 'Post the Rveel card to Facebook',
  instagram: 'Post the Rveel card to Instagram',
  twitter: 'Post the Rveel card to X',
  snapchat: 'Post the Rveel card to Snapchat',
  tiktok: 'Post the Rveel card to TikTok',
  sms: 'Send the Rveel card by message',
  moreApps: 'Share the Rveel card',
  native: 'Share the Rveel card',
};

/**
 * Opens the phone share sheet with the card image attached.
 * Expo Go's share sheet can carry the picture. It cannot also attach the caption,
 * so the caller copies the link for the sender to paste under the card.
 */
export async function shareStoryCardImage(input: {
  imageUri: string;
  caption: string;
  platform: SharePlatform;
}): Promise<boolean> {
  void input.caption;
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) return false;
    await Sharing.shareAsync(input.imageUri, {
      mimeType: 'image/png',
      UTI: 'public.png',
      dialogTitle: SHEET_TITLE[input.platform],
    });
    return true;
  } catch (error) {
    logger.warn('Card image share failed', error);
    return false;
  }
}
