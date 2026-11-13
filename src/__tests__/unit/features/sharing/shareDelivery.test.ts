import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import { ShareService } from '../../../../features/sharing/services/ShareService';
import type { SharePlatform } from '../../../../features/sharing/types';
import type { ProductWithTrustScore } from '../../../../types/product';

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(async () => true),
}));

jest.mock('expo-linking', () => ({
  canOpenURL: jest.fn(async () => true),
  openURL: jest.fn(async () => true),
}));

const product = {
  barcode: '9400547009879',
  product_name: 'Tomatoes Mexican Style',
  trust_score: null,
  trust_score_breakdown: null,
} as ProductWithTrustScore;

const imageFirstPlatforms: SharePlatform[] = ['instagram', 'snapchat', 'tiktok'];

function shareOptions(platform: SharePlatform, storyImageUri?: string) {
  return {
    product,
    item: 'processing' as const,
    platform,
    storyImageUri,
    publicationSettled: true,
    receiver: {
      productName: 'Tomatoes Mexican Style',
      section: 'Processing',
      summary: 'Processed',
    },
  };
}

describe('real-phone share handoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
  });

  test('image-first platforms send the card image; clipboard is sender-side only', async () => {
    for (const platform of imageFirstPlatforms) {
      const result = await ShareService.share(shareOptions(platform, 'file:///card.png'));
      expect(result).toEqual({ success: true, platform });
    }
    expect(Sharing.shareAsync).toHaveBeenCalledTimes(imageFirstPlatforms.length);
    expect(Clipboard.setStringAsync).toHaveBeenCalledTimes(imageFirstPlatforms.length);
  });

  test('whatsapp puts the HTTPS product link in the message body (not image-only)', async () => {
    const result = await ShareService.share(shareOptions('whatsapp', 'file:///card.png'));
    expect(result.success).toBe(true);
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
    const opened = (Linking.openURL as jest.Mock).mock.calls
      .map((call) => decodeURIComponent(String(call[0])))
      .join('\n');
    expect(opened).toContain('https://truscoreapi.vercel.app/barcode/9400547009879');
    expect(opened).toContain('Tomatoes Mexican Style');
    expect(opened).toContain('Open in Rveel');
  });

  test('sms puts the HTTPS product link in the message body', async () => {
    const result = await ShareService.share(shareOptions('sms', 'file:///card.png'));
    expect(result.success).toBe(true);
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
    const opened = (Linking.openURL as jest.Mock).mock.calls
      .map((call) => decodeURIComponent(String(call[0])))
      .join('\n');
    expect(opened).toContain('https://truscoreapi.vercel.app/barcode/9400547009879');
    expect(opened).toContain('Open in Rveel');
  });

  test('a missing card falls back to text that includes facts and the link', async () => {
    const result = await ShareService.share(shareOptions('sms'));
    expect(result.success).toBe(true);
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
    const opened = (Linking.openURL as jest.Mock).mock.calls
      .map((call) => decodeURIComponent(String(call[0])))
      .join('\n');
    expect(opened).toContain('Tomatoes Mexican Style');
    expect(opened).toContain('Processing');
    expect(opened).toContain('https://truscoreapi.vercel.app/barcode/9400547009879');
  });
});
