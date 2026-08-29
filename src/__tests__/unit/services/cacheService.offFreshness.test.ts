import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cacheProduct,
  getCachedProduct,
  clearCache,
} from '../../../services/cacheService';
import {
  OFF_REVALIDATION_MS,
  needsOffBackgroundRevalidation,
  withOffRevalidationTimestamp,
} from '../../../services/offRevalidationPolicy';
import type { Product } from '../../../types/product';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  cacheDirectory: 'file:///cache/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  downloadAsync: jest.fn(),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

const storage = new Map<string, string>();

const mockedGetItem = AsyncStorage.getItem as jest.Mock;
const mockedSetItem = AsyncStorage.setItem as jest.Mock;
const mockedRemoveItem = AsyncStorage.removeItem as jest.Mock;

const BARCODE = '9300652815573';

function baseProduct(): Product {
  return {
    barcode: BARCODE,
    product_name: 'Cached Oats',
    source: 'openfoodfacts',
  };
}

describe('cacheService OFF freshness (_cachedAt)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    storage.clear();
    mockedGetItem.mockImplementation(async (key: string) => storage.get(key) ?? null);
    mockedSetItem.mockImplementation(async (key: string, value: string) => {
      storage.set(key, value);
    });
    mockedRemoveItem.mockImplementation(async (key: string) => {
      storage.delete(key);
    });
    await clearCache();
  });

  it('does not stamp _cachedAt on generic cache write', async () => {
    await cacheProduct(baseProduct(), false);
    const cached = await getCachedProduct(BARCODE, false);
    expect(cached?._cachedAt).toBeUndefined();
    expect(needsOffBackgroundRevalidation(cached!)).toBe(true);
  });

  it('advances _cachedAt only when offRevalidatedAt is supplied', async () => {
    const offAt = 1_700_000_000_000;
    await cacheProduct(baseProduct(), false, { offRevalidatedAt: offAt });
    const cached = await getCachedProduct(BARCODE, false);
    expect(cached?._cachedAt).toBe(offAt);
  });

  it('local enhancement write preserves existing _cachedAt', async () => {
    const offAt = 1_700_000_000_000;
    await cacheProduct(baseProduct(), false, { offRevalidatedAt: offAt });

    const enhancedAt = offAt + 60_000;
    await cacheProduct(
      {
        ...baseProduct(),
        product_name: 'Enhanced Oats',
        nova_group: 3,
      },
      false
    );

    const cached = await getCachedProduct(BARCODE, false);
    expect(cached?._cachedAt).toBe(offAt);
    expect(cached?.product_name).toBe('Enhanced Oats');
    expect(needsOffBackgroundRevalidation(cached!, enhancedAt + OFF_REVALIDATION_MS)).toBe(true);
  });

  it('contribution/local refinement preserves existing _cachedAt', async () => {
    const offAt = 1_700_000_000_000;
    const stamped = withOffRevalidationTimestamp(baseProduct(), offAt);
    await cacheProduct(stamped, false, { offRevalidatedAt: offAt });

    await cacheProduct(
      {
        ...stamped,
        product_name: 'Community Refined Name',
        ingredients_text: 'oats, salt',
      },
      false
    );

    const cached = await getCachedProduct(BARCODE, false);
    expect(cached?._cachedAt).toBe(offAt);
    expect(cached?.product_name).toBe('Community Refined Name');
  });

  it('product becomes ≥24h stale despite intervening local cache writes', async () => {
    const offAt = 1_700_000_000_000;
    await cacheProduct(baseProduct(), false, { offRevalidatedAt: offAt });

    for (let i = 0; i < 3; i += 1) {
      await cacheProduct(
        {
          ...baseProduct(),
          product_name: `Local touch ${i}`,
        },
        false
      );
    }

    const cached = await getCachedProduct(BARCODE, false);
    expect(cached?._cachedAt).toBe(offAt);
    expect(needsOffBackgroundRevalidation(cached!, offAt + OFF_REVALIDATION_MS)).toBe(true);
  });

  it('successful stale-cache revalidation advances _cachedAt', async () => {
    const staleAt = 1_700_000_000_000;
    await cacheProduct(baseProduct(), false, { offRevalidatedAt: staleAt });

    const revalidatedAt = staleAt + OFF_REVALIDATION_MS + 5_000;
    await cacheProduct(
      {
        ...baseProduct(),
        product_name: 'Revalidated Oats',
      },
      false,
      { offRevalidatedAt: revalidatedAt }
    );

    const cached = await getCachedProduct(BARCODE, false);
    expect(cached?._cachedAt).toBe(revalidatedAt);
    expect(cached?._cachedAt).toBeGreaterThan(staleAt);
    expect(needsOffBackgroundRevalidation(cached!, revalidatedAt + 1_000)).toBe(false);
  });
});
