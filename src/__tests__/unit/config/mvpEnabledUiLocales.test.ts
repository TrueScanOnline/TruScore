/**
 * MVP English-only UI locale authority.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  isMvpEnabledUiLocale,
  MVP_ENABLED_UI_LOCALES,
  resolveMvpUiLocale,
} from '../../../config/mvpRuntimeGates';

describe('MVP enabled UI locales', () => {
  test('only English is enabled', () => {
    expect([...MVP_ENABLED_UI_LOCALES]).toEqual(['en']);
    expect(isMvpEnabledUiLocale('en')).toBe(true);
    expect(isMvpEnabledUiLocale('en-AU')).toBe(true);
    expect(isMvpEnabledUiLocale('es')).toBe(false);
    expect(isMvpEnabledUiLocale('fr')).toBe(false);
    expect(isMvpEnabledUiLocale('id')).toBe(false);
  });

  test('non-English device or requested locale resolves to English', () => {
    expect(resolveMvpUiLocale('fr')).toBe('en');
    expect(resolveMvpUiLocale('es-MX')).toBe('en');
    expect(resolveMvpUiLocale('de')).toBe('en');
    expect(resolveMvpUiLocale(undefined)).toBe('en');
    expect(resolveMvpUiLocale('en')).toBe('en');
  });

  test('settings/profile language pickers do not offer es/fr buttons', () => {
    // Lightweight source contract: MVP pickers must not call setLanguage('es'|'fr').
    const root = path.join(__dirname, '../../../../');
    for (const rel of ['app/settings.tsx', 'app/profile.tsx']) {
      const src = fs.readFileSync(path.join(root, rel), 'utf8');
      expect(src).not.toMatch(/setLanguage\(\s*['"]es['"]\s*\)/);
      expect(src).not.toMatch(/setLanguage\(\s*['"]fr['"]\s*\)/);
      expect(src).not.toMatch(/text:\s*['"]Español['"]/);
      expect(src).not.toMatch(/text:\s*['"]Français['"]/);
    }
  });

  test('i18n bootstrap does not activate device es/fr', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../../i18n/index.ts'), 'utf8');
    expect(src).toMatch(/resolveMvpUiLocale/);
    expect(src).not.toMatch(/getDeviceLanguage/);
    expect(src).toMatch(/Dormant scaffolding/);
  });
});
