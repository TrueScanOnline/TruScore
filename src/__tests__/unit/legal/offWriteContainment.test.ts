import Constants from 'expo-constants';
import {
  submitManufacturingCountryToOpenFoodFacts,
  submitProductToOpenFoodFacts,
  uploadPhotoToOpenFoodFacts,
} from '../../../services/openFoodFactsSubmission';
import { uploadProductPhoto } from '../../../services/photoUploadService';
import * as FileSystem from 'expo-file-system';

describe('OFF public write containment', () => {
  const extra = Constants.expoConfig!.extra as Record<string, unknown>;

  beforeEach(() => {
    extra.offPublicContribution = '0';
    extra.offApiContactEmail = '';
    (global.fetch as jest.Mock).mockClear();
  });

  it('refuses product, photo, and manufacturing-country OFF posts when gated off', async () => {
    const product = await submitProductToOpenFoodFacts({
      barcode: '9421901234567',
      product_name: 'Test',
    } as any);
    expect(product.success).toBe(false);
    expect(product.message).toMatch(/disabled/i);

    const photo = await uploadPhotoToOpenFoodFacts('9421901234567', 'file:///x.jpg', 'front');
    expect(photo).toBeNull();

    const country = await submitManufacturingCountryToOpenFoodFacts('9421901234567', 'New Zealand');
    expect(country.success).toBe(false);
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(0);
  });

  it('does not dispatch front images to OFF when contribution gate is off', async () => {
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('base64');
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, url: 'https://storage.example.com/front.jpg' }),
      text: async () => '{}',
    });

    await uploadProductPhoto('9421901234567', 'file:///pack.jpg', 'front');
    expect(
      (global.fetch as jest.Mock).mock.calls.some((call) =>
        String(call[0]).includes('/api/off-image-dispatch')
      )
    ).toBe(false);
  });
});
