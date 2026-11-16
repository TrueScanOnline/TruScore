/**
 * Units preference persistence — display-only; must not touch scoring stores.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const SETTINGS_KEY = '@truescan_settings';

describe('units settings persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('setUnits persists metric/imperial and restore via initializeStore', async () => {
    const { useSettingsStore } = require('../../../store/useSettingsStore');
    await useSettingsStore.getState().initializeStore();
    expect(useSettingsStore.getState().units).toBe('metric');

    await useSettingsStore.getState().setUnits('imperial');
    expect(useSettingsStore.getState().units).toBe('imperial');

    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    expect(raw).toBeTruthy();
    expect(raw).toContain('"units":"imperial"');

    // Mutate in-memory only, then reload from storage.
    useSettingsStore.setState({ units: 'metric' });
    expect(useSettingsStore.getState().units).toBe('metric');
    await useSettingsStore.getState().initializeStore();
    expect(useSettingsStore.getState().units).toBe('imperial');

    await useSettingsStore.getState().setUnits('metric');
    expect(useSettingsStore.getState().units).toBe('metric');
    const rawMetric = await AsyncStorage.getItem(SETTINGS_KEY);
    expect(rawMetric).toContain('"units":"metric"');
  });
});
