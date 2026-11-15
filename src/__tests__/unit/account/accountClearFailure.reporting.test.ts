/**
 * Clear actions must not report success when durable storage deletion fails.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const HISTORY_KEY = '@truescan_history';
const FAVORITES_KEY = '@truescan_favorites';
const CACHE_KEY = '@truescan_product_cache';
const CREDENTIAL_KEY = '@rveel_evidence_contributor_credential_v1';

describe('Account clear failure reporting', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await AsyncStorage.clear();
    await AsyncStorage.multiSet([
      [CREDENTIAL_KEY, JSON.stringify({ id: 'contributor-fixture' })],
      [HISTORY_KEY, JSON.stringify([{ barcode: '9300675025735', timestamp: 1, productName: 'A' }])],
      [
        FAVORITES_KEY,
        JSON.stringify([{ barcode: '9300675025735', productName: 'A', trustScore: 1, addedAt: 1 }]),
      ],
      [CACHE_KEY, JSON.stringify({ '9300675025735': { barcode: '9300675025735', timestamp: 1, product: {} } })],
    ]);
  });

  test('clearHistory restores memory and throws when AsyncStorage.removeItem fails', async () => {
    const { useScanStore } = require('../../../store/useScanStore');
    await useScanStore.getState().initializeStore();
    expect(useScanStore.getState().recentScans).toHaveLength(1);

    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('disk full'));

    await expect(useScanStore.getState().clearHistory()).rejects.toThrow(/Failed to clear scan history|disk full/);
    expect(useScanStore.getState().recentScans).toHaveLength(1);
    expect(await AsyncStorage.getItem(CREDENTIAL_KEY)).toContain('contributor-fixture');
  });

  test('clearFavorites restores memory and throws when AsyncStorage.removeItem fails', async () => {
    const { useFavoritesStore } = require('../../../store/useFavoritesStore');
    await useFavoritesStore.getState().initializeStore();
    expect(useFavoritesStore.getState().favorites).toHaveLength(1);

    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('disk full'));

    await expect(useFavoritesStore.getState().clearFavorites()).rejects.toThrow(
      /Failed to clear favorites|disk full/
    );
    expect(useFavoritesStore.getState().favorites).toHaveLength(1);
    expect(await AsyncStorage.getItem(CREDENTIAL_KEY)).toContain('contributor-fixture');
  });

  test('clearCache throws when AsyncStorage.removeItem fails and leaves credentials intact', async () => {
    const { clearCache } = require('../../../services/cacheService');
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('disk full'));

    await expect(clearCache()).rejects.toThrow(/Failed to clear product cache|disk full/);
    expect(await AsyncStorage.getItem(CREDENTIAL_KEY)).toContain('contributor-fixture');
  });

  test('clearCache throws when FileSystem.deleteAsync fails', async () => {
    const FileSystem = require('expo-file-system');
    const { clearCache } = require('../../../services/cacheService');
    jest.spyOn(FileSystem, 'deleteAsync').mockRejectedValueOnce(new Error('fs denied'));

    await expect(clearCache()).rejects.toThrow(/Failed to clear product cache|fs denied/);
    expect(await AsyncStorage.getItem(CREDENTIAL_KEY)).toContain('contributor-fixture');
  });
});
