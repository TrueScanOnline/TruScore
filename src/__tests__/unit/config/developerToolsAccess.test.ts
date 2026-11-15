describe('developerToolsAccess', () => {
  const ORIGINAL = process.env.EXPO_PUBLIC_STORE_RELEASE;

  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.EXPO_PUBLIC_STORE_RELEASE;
    } else {
      process.env.EXPO_PUBLIC_STORE_RELEASE = ORIGINAL;
    }
    jest.resetModules();
  });

  test('enabled outside store-release runtime (founder/UAT/dev)', () => {
    delete process.env.EXPO_PUBLIC_STORE_RELEASE;
    jest.resetModules();
    const { isDeveloperSettingsRouteEnabled } = require('../../../config/developerToolsAccess');
    expect(isDeveloperSettingsRouteEnabled()).toBe(true);
  });

  test('disabled for production-class store release', () => {
    process.env.EXPO_PUBLIC_STORE_RELEASE = '1';
    jest.resetModules();
    const { isDeveloperSettingsRouteEnabled } = require('../../../config/developerToolsAccess');
    expect(isDeveloperSettingsRouteEnabled()).toBe(false);
  });
});
