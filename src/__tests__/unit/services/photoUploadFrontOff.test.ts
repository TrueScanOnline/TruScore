import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { uploadProductPhoto } from '../../../services/photoUploadService';

function jsonResponse(body: unknown) {
  const text = JSON.stringify(body);
  return {
    ok: true,
    status: 200,
    text: async () => text,
    json: async () => JSON.parse(text),
  };
}

describe('front hero Open Food Facts dispatch', () => {
  const extra = Constants.expoConfig!.extra as Record<string, unknown>;

  beforeEach(() => {
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('base64');
    // MVP default: public OFF contribution disabled.
    extra.offPublicContribution = '0';
  });

  it('does not dispatch front images to OFF while public contribution is gated off', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: { method?: string }) => {
      const target = String(url);
      if (target.includes('/api/upload-photo') && options?.method === 'POST') {
        return Promise.resolve(jsonResponse({ success: true, url: 'https://storage.example.com/front.jpg' }));
      }
      return Promise.resolve(jsonResponse({}));
    });

    const result = await uploadProductPhoto('9300657233358', 'file:///pack.jpg', 'front');
    expect(result.success).toBe(true);
    expect(result.vercelUrl).toBe('https://storage.example.com/front.jpg');
    expect(result.openFoodFactsUrl).toBeUndefined();
    expect(
      (global.fetch as jest.Mock).mock.calls.some((call) => String(call[0]).includes('/api/off-image-dispatch'))
    ).toBe(false);
  });

  it('leaves country-label photos off the Open Food Facts image upload', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: { method?: string }) => {
      const target = String(url);
      if (target.includes('/api/upload-photo') && options?.method === 'POST') {
        return Promise.resolve(jsonResponse({ success: true, url: 'https://storage.example.com/label.jpg' }));
      }
      return Promise.resolve(jsonResponse({}));
    });

    const result = await uploadProductPhoto('9300657233358', 'file:///label.jpg', 'country_label');
    expect(result.success).toBe(true);
    expect(
      (global.fetch as jest.Mock).mock.calls.some((call) => String(call[0]).includes('/api/off-image-dispatch'))
    ).toBe(false);
  });
});
