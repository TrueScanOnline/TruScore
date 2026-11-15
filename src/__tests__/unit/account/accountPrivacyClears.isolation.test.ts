/**
 * Account Privacy clears must touch only their named local stores.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const CREDENTIAL_KEY = '@rveel_evidence_contributor_credential_v1';
const HISTORY_KEY = '@truescan_history';
const FAVORITES_KEY = '@truescan_favorites';
const CACHE_KEY = '@truescan_product_cache';
const SETTINGS_KEY = '@truescan_settings';

describe('Account privacy clear isolation', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await AsyncStorage.multiSet([
      [CREDENTIAL_KEY, JSON.stringify({ id: 'contributor-fixture' })],
      [HISTORY_KEY, JSON.stringify([{ barcode: '9300675025735' }])],
      [FAVORITES_KEY, JSON.stringify([{ barcode: '9300675025735' }])],
      [CACHE_KEY, JSON.stringify({ '9300675025735': { name: 'Fixture' } })],
      [SETTINGS_KEY, JSON.stringify({ darkMode: true, analyticsEnabled: false })],
    ]);
  });

  test('clearHistory removes only scan history', async () => {
    const { useScanStore } = require('../../../store/useScanStore');
    await useScanStore.getState().initializeStore();
    await useScanStore.getState().clearHistory();

    const remaining = await AsyncStorage.getItem(HISTORY_KEY);
    expect(remaining === null || remaining === '[]').toBe(true);
    expect(await AsyncStorage.getItem(CREDENTIAL_KEY)).toContain('contributor-fixture');
    expect(await AsyncStorage.getItem(FAVORITES_KEY)).toContain('9300675025735');
    expect(await AsyncStorage.getItem(CACHE_KEY)).toContain('9300675025735');
    expect(await AsyncStorage.getItem(SETTINGS_KEY)).toContain('darkMode');
  });

  test('clearFavorites removes only favourites', async () => {
    const { useFavoritesStore } = require('../../../store/useFavoritesStore');
    await useFavoritesStore.getState().initializeStore();
    await useFavoritesStore.getState().clearFavorites();

    const favs = await AsyncStorage.getItem(FAVORITES_KEY);
    expect(favs === null || favs === '[]').toBe(true);
    expect(await AsyncStorage.getItem(CREDENTIAL_KEY)).toContain('contributor-fixture');
    expect(await AsyncStorage.getItem(HISTORY_KEY)).toContain('9300675025735');
    expect(await AsyncStorage.getItem(CACHE_KEY)).toContain('9300675025735');
    expect(await AsyncStorage.getItem(SETTINGS_KEY)).toContain('darkMode');
  });

  test('clearCache removes only product cache', async () => {
    const { clearCache } = require('../../../services/cacheService');
    await clearCache();

    const cache = await AsyncStorage.getItem(CACHE_KEY);
    expect(cache === null || cache === '{}' || cache === '[]').toBe(true);
    expect(await AsyncStorage.getItem(CREDENTIAL_KEY)).toContain('contributor-fixture');
    expect(await AsyncStorage.getItem(HISTORY_KEY)).toContain('9300675025735');
    expect(await AsyncStorage.getItem(FAVORITES_KEY)).toContain('9300675025735');
    expect(await AsyncStorage.getItem(SETTINGS_KEY)).toContain('darkMode');
  });
});
