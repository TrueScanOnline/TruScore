import {
  assertDynamicSignalsAssetForReleaseRuntime,
  assertMvpReleaseProfilesHaveDynamicSignalsAsset,
  MVP_RELEASE_EAS_PROFILES,
  resolveEasProfileEnv,
} from '../../../config/mvpReleaseDynamicSignalsAsset';
import easJson from '../../../../eas.json';

describe('mvpReleaseDynamicSignalsAsset (R-01 / S-01)', () => {
  it('passes for configured eas.json MVP release profiles', () => {
    const result = assertMvpReleaseProfilesHaveDynamicSignalsAsset(easJson as any);
    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
    expect(result.checkedProfiles).toEqual([...MVP_RELEASE_EAS_PROFILES]);
  });

  it('fails when Asset flag absent on an intended MVP profile', () => {
    const broken = {
      build: {
        production: {
          env: {
            EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH: '1',
          },
        },
      },
    };
    const result = assertMvpReleaseProfilesHaveDynamicSignalsAsset(broken, ['production']);
    expect(result.ok).toBe(false);
    expect(result.failures[0]?.profile).toBe('production');
    expect(result.failures[0]?.reason).toMatch(/absent/i);
  });

  it('fails when Asset flag is not "1"', () => {
    const broken = {
      build: {
        preview: {
          env: {
            EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET: '0',
          },
        },
      },
    };
    const result = assertMvpReleaseProfilesHaveDynamicSignalsAsset(broken, ['preview']);
    expect(result.ok).toBe(false);
    expect(result.failures[0]?.resolvedValue).toBe('0');
  });

  it('resolves Asset=1 through extends merge', () => {
    const eas = {
      build: {
        preview: {
          env: { EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET: '1' },
        },
        'uat-child': {
          extends: 'preview',
          env: { RVEEL_IOS_BUILD_NUMBER: '99' },
        },
      },
    };
    const env = resolveEasProfileEnv(eas, 'uat-child');
    expect(env.EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET).toBe('1');
    expect(env.RVEEL_IOS_BUILD_NUMBER).toBe('99');
  });

  it('runtime release assert throws when Asset missing outside __DEV__', () => {
    expect(() =>
      assertDynamicSignalsAssetForReleaseRuntime(undefined, { isDev: false })
    ).toThrow(/EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET=1/);
    expect(() =>
      assertDynamicSignalsAssetForReleaseRuntime('0', { isDev: false })
    ).toThrow(/producer=none/);
  });

  it('runtime release assert allows Asset unset in __DEV__ (Expo Go / Metro)', () => {
    expect(() =>
      assertDynamicSignalsAssetForReleaseRuntime(undefined, { isDev: true })
    ).not.toThrow();
  });

  it('runtime release assert accepts Asset=1 in release', () => {
    expect(() =>
      assertDynamicSignalsAssetForReleaseRuntime('1', { isDev: false })
    ).not.toThrow();
  });
});
