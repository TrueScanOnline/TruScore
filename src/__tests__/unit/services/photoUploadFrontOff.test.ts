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
  beforeEach(() => {
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('base64');
  });

  it('starts the front image upload without waiting for Open Food Facts', async () => {
    let releaseOff: (() => void) | null = null;
    (global.fetch as jest.Mock).mockImplementation((url: string, options?: { method?: string; body?: string }) => {
      const target = String(url);
      if (target.includes('/api/off-image-dispatch')) {
        const body = options?.body ? JSON.parse(options.body) : {};
        expect(body.password).toBeUndefined();
        expect(body.user_id).toBeUndefined();
        expect(body.imageField).toBe('front');
        return new Promise((resolve) => {
          releaseOff = () => resolve(jsonResponse({ ok: true, imageUrl: 'https://images.openfoodfacts.org/front.jpg' }));
        });
      }
      if (target.includes('/api/upload-photo') && options?.method === 'POST') {
        return Promise.resolve(jsonResponse({ success: true, url: 'https://storage.example.com/front.jpg' }));
      }
      return Promise.resolve(jsonResponse({}));
    });

    const result = await uploadProductPhoto('9300657233358', 'file:///pack.jpg', 'front');
    await Promise.resolve();
    expect(result.success).toBe(true);
    expect(result.vercelUrl).toBe('https://storage.example.com/front.jpg');
    expect(result.openFoodFactsUrl).toBeUndefined();
    expect(
      (global.fetch as jest.Mock).mock.calls.some((call) => String(call[0]).includes('product_image_upload.pl'))
    ).toBe(false);
    expect(
      (global.fetch as jest.Mock).mock.calls.some((call) => String(call[0]).includes('/api/off-image-dispatch'))
    ).toBe(true);
    releaseOff?.();
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
