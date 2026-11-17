/**
 * getCacheSize must not report storage failures as a genuine empty cache (0).
 */
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/',
  EncodingType: { UTF8: 'utf8' },
  getInfoAsync: jest.fn(async () => ({ exists: true, isDirectory: true })),
  makeDirectoryAsync: jest.fn(async () => undefined),
  deleteAsync: jest.fn(async () => undefined),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCacheSize } from '../../../services/cacheService';

const getItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;

describe('getCacheSize failure semantics', () => {
  beforeEach(() => {
    getItem.mockReset();
  });

  test('missing cache key is a genuine zero', async () => {
    getItem.mockResolvedValueOnce(null);
    await expect(getCacheSize()).resolves.toBe(0);
  });

  test('valid empty object is a genuine zero', async () => {
    getItem.mockResolvedValueOnce('{}');
    await expect(getCacheSize()).resolves.toBe(0);
  });

  test('counts cached products when storage succeeds', async () => {
    getItem.mockResolvedValueOnce(
      JSON.stringify({
        a: { barcode: 'a', cachedAt: 1, data: {} },
        b: { barcode: 'b', cachedAt: 2, data: {} },
      })
    );
    await expect(getCacheSize()).resolves.toBe(2);
  });

  test('AsyncStorage rejection returns null (unknown), not zero', async () => {
    getItem.mockRejectedValueOnce(new Error('disk unavailable'));
    await expect(getCacheSize()).resolves.toBeNull();
  });

  test('corrupt JSON returns null (unknown), not zero', async () => {
    getItem.mockResolvedValueOnce('{not-json');
    await expect(getCacheSize()).resolves.toBeNull();
  });

  test('non-object JSON returns null (unknown), not zero', async () => {
    getItem.mockResolvedValueOnce('[]');
    await expect(getCacheSize()).resolves.toBeNull();
  });
});

describe('PrivacyDataScreen cache unknown UX', () => {
  test('privacy screen distinguishes unavailable count from zero', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../screens/account/PrivacyDataScreen.tsx'),
      'utf8'
    );
    expect(src).toMatch(/cacheSize === null/);
    expect(src).toMatch(/cacheCountUnavailable/);
    expect(src).toMatch(/clearCacheCountUnknown/);
    expect(src).not.toMatch(/setCacheSize\(0\)/);
  });
});
