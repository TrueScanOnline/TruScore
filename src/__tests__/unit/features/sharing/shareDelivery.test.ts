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

const platforms: SharePlatform[] = [
  'whatsapp',
  'sms',
  'facebook',
  'twitter',
  'instagram',
  'snapchat',
  'tiktok',
  'native',
  'moreApps',
];

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
  test('every platform sends the captured card and copies one link', async () => {
    for (const platform of platforms) {
      const result = await ShareService.share(shareOptions(platform, 'file:///card.png'));
      expect(result).toEqual({ success: true, platform });
    }

    expect(Sharing.shareAsync).toHaveBeenCalledTimes(platforms.length);
    for (const call of (Sharing.shareAsync as jest.Mock).mock.calls) {
      expect(call[0]).toBe('file:///card.png');
      expect(call[1]).toMatchObject({ mimeType: 'image/png', UTI: 'public.png' });
    }
    expect(Linking.openURL).not.toHaveBeenCalled();

    const copied = (Clipboard.setStringAsync as jest.Mock).mock.calls.map((call) => String(call[0]));
    expect(copied).toHaveLength(platforms.length);
    for (const url of copied) {
      expect(url.startsWith('https://truescan.app/barcode/9400547009879?')).toBe(true);
      expect(url).toContain('ctx=processing');
      expect(url.match(/truescan\.app/g)).toHaveLength(1);
    }
    expect(copied.some((url) => url.includes('src=sms'))).toBe(true);
    expect(copied.some((url) => url.includes('src=whatsapp'))).toBe(true);
  });

  test('a missing card falls back to one text that includes the section facts and the link', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    const result = await ShareService.share(shareOptions('sms'));
    expect(result.success).toBe(true);
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
    const opened = (Linking.openURL as jest.Mock).mock.calls.map((call) => decodeURIComponent(String(call[0]))).join('\n');
    expect(opened).toContain('Tomatoes Mexican Style');
    expect(opened).toContain('Processing');
    expect(opened).toContain('Processed');
    expect(opened).toContain('https://truescan.app/barcode/9400547009879');
    expect(opened.match(/truescan\.app/g)).toHaveLength(1);
  });
});
