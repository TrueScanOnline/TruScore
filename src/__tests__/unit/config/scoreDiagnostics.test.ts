import {
  assertScoreDiagnosticsReleaseSafe,
  isScoreDiagnosticsBuildEntitled,
  isStoreReleaseRuntime,
  shouldShowScoreDiagnosticsEntry,
} from '../../../config/scoreDiagnostics';

describe('scoreDiagnostics P1-C fail-closed', () => {
  const originalDiag = process.env.EXPO_PUBLIC_SCORE_DIAGNOSTICS;
  const originalStore = process.env.EXPO_PUBLIC_STORE_RELEASE;

  afterEach(() => {
    if (originalDiag === undefined) delete process.env.EXPO_PUBLIC_SCORE_DIAGNOSTICS;
    else process.env.EXPO_PUBLIC_SCORE_DIAGNOSTICS = originalDiag;
    if (originalStore === undefined) delete process.env.EXPO_PUBLIC_STORE_RELEASE;
    else process.env.EXPO_PUBLIC_STORE_RELEASE = originalStore;
  });

  test('missing env defaults OFF', () => {
    delete process.env.EXPO_PUBLIC_SCORE_DIAGNOSTICS;
    expect(isScoreDiagnosticsBuildEntitled()).toBe(false);
    expect(shouldShowScoreDiagnosticsEntry(true)).toBe(false);
  });

  test('only exact "1" entitles', () => {
    process.env.EXPO_PUBLIC_SCORE_DIAGNOSTICS = 'true';
    expect(isScoreDiagnosticsBuildEntitled()).toBe(false);
    process.env.EXPO_PUBLIC_SCORE_DIAGNOSTICS = '1';
    expect(isScoreDiagnosticsBuildEntitled()).toBe(true);
  });

  test('entitled + local Off hides entry; On shows', () => {
    process.env.EXPO_PUBLIC_SCORE_DIAGNOSTICS = '1';
    expect(shouldShowScoreDiagnosticsEntry(false)).toBe(false);
    expect(shouldShowScoreDiagnosticsEntry(true)).toBe(true);
  });

  test('store release + entitled throws', () => {
    process.env.EXPO_PUBLIC_STORE_RELEASE = '1';
    process.env.EXPO_PUBLIC_SCORE_DIAGNOSTICS = '1';
    expect(isStoreReleaseRuntime()).toBe(true);
    expect(() => assertScoreDiagnosticsReleaseSafe()).toThrow(/Score Diagnostics/);
  });

  test('uat entitled does not throw', () => {
    process.env.EXPO_PUBLIC_STORE_RELEASE = '0';
    process.env.EXPO_PUBLIC_SCORE_DIAGNOSTICS = '1';
    expect(() => assertScoreDiagnosticsReleaseSafe()).not.toThrow();
  });
});
