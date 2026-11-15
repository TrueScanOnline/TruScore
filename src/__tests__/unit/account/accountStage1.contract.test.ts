/**
 * Account Stage 1 — consumer Account foundation contracts.
 * GREEN presentation/navigation only; purchase and auth remain off.
 */
import fs from 'fs';
import path from 'path';
import {
  isMvpSubscriptionAndPaywallEnabled,
  MVP_RUNTIME,
  MVP_ENABLED_UI_LOCALES,
} from '../../../config/mvpRuntimeGates';
import { ENABLE_PREMIUM_GATING } from '../../../utils/premiumFeatures';
import { legalDestinations, isLegalDestinationReady } from '../../../config/legalDestinations';
import { productIdentity } from '../../../config/productIdentity';
import { getInstalledAppVersion } from '../../../utils/appVersion';

const root = path.resolve(__dirname, '../../../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

describe('Account Stage 1 contracts', () => {
  test('bottom tab is Account with person icon, not Settings gear', () => {
    const tabs = read('src/navigation/AppTabs.tsx');
    expect(tabs).toMatch(/name=\"Account\"/);
    expect(tabs).toMatch(/t\('tabs\.account'\)/);
    expect(tabs).toMatch(/person-outline/);
    expect(tabs).not.toMatch(/name=\"Settings\"/);
    expect(tabs).not.toMatch(/settings-outline/);
    const order = [
      tabs.indexOf('name="Scan"'),
      tabs.indexOf('name="Search"'),
      tabs.indexOf('name="History"'),
      tabs.indexOf('name="Favourites"'),
      tabs.indexOf('name="Account"'),
    ];
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  test('legacy /profile deep link maps to AccountHome', () => {
    const linking = read('src/utils/linking.ts');
    expect(linking).toMatch(/AccountHome:\s*'profile'/);
    expect(linking).toMatch(/barcode\/:barcode/);
    expect(linking).not.toMatch(/Settings:\s*'profile'/);
  });

  test('Account stack includes required detail routes and excludes developer purchase surfaces', () => {
    const stack = read('src/navigation/AccountStack.tsx');
    for (const name of [
      'AccountHome',
      'AccountProfile',
      'AccountPlan',
      'PrivacyData',
      'HelpSupport',
      'LegalMethodology',
    ]) {
      expect(stack).toContain(`name="${name}"`);
    }
    expect(stack).not.toMatch(/name=\"DeveloperSettings\"/);
    expect(stack).not.toMatch(/name=\"Subscription\"/);
    expect(stack).not.toMatch(/Qonversion/);
    expect(stack).not.toMatch(/from ['\"].*\/settings['\"]/);
  });

  test('Account Home presents guest identity and approved sections', () => {
    const home = read('src/screens/account/AccountHomeScreen.tsx');
    expect(home).toMatch(/account\.guestProfile/);
    expect(home).toMatch(/account\.guestSupporting/);
    expect(home).toMatch(/account\.planSummaryFree/);
    expect(home).toMatch(/account\.sectionPersonal/);
    expect(home).toMatch(/account\.sectionAppSettings/);
    expect(home).toMatch(/account\.sectionPrivacySupport/);
    expect(home).toMatch(/account\.preferences/);
    expect(home).toMatch(/disabled/);
    expect(home).not.toMatch(/Log Out|Logout|Sign in|Sign up/i);
    expect(home).not.toMatch(/setAnalyticsEnabled/);
    expect(home).not.toMatch(/setUnits/);
    expect(home).not.toMatch(/openSource/);
    expect(home).not.toMatch(/ContributionCelebrationPreview/);
  });

  test('guest profile does not fabricate authenticated identity', () => {
    const profile = read('src/screens/account/AccountProfileScreen.tsx');
    expect(profile).toMatch(/account\.guest/);
    expect(profile).toMatch(/account\.profileLocalStorageNote/);
    expect(profile).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(profile).not.toMatch(/Logout|Log Out|delete account/i);
    expect(profile).not.toMatch(/evidenceAuthority|contributor/i);
  });

  test('plan screen is Free-only with purchase protection while MVP gate is off', () => {
    expect(MVP_RUNTIME.subscriptionAndPaywall).toBe(false);
    expect(isMvpSubscriptionAndPaywallEnabled()).toBe(false);
    expect(ENABLE_PREMIUM_GATING).toBe(false);
    const plan = read('src/screens/account/AccountPlanScreen.tsx');
    expect(plan).toMatch(/account\.planFreeName/);
    expect(plan).toMatch(/account\.planFutureNote/);
    expect(plan).not.toMatch(/\bUpgrade Now\b|\bStart Trial\b|\bSubscribe\b|\bRestore Purchases\b|\bManage Billing\b/i);
    expect(plan).not.toMatch(/from ['"].*qonversion|purchaseProduct\(|restorePurchases\(/i);
    expect(plan).not.toMatch(/useSubscriptionStore/);
    expect(plan).toMatch(/isMvpSubscriptionAndPaywallEnabled/);
  });

  test('language remains English-only and Preferences stay non-interactive', () => {
    expect([...MVP_ENABLED_UI_LOCALES]).toEqual(['en']);
    const home = read('src/screens/account/AccountHomeScreen.tsx');
    expect(home).toMatch(/account\.languageEnglish/);
    expect(home).not.toMatch(/setLanguage\(/);
    expect(home).toMatch(/account\.comingSoon/);
  });

  test('privacy clears use targeted store APIs only', () => {
    const privacy = read('src/screens/account/PrivacyDataScreen.tsx');
    expect(privacy).toMatch(/clearHistory\(/);
    expect(privacy).toMatch(/clearFavorites\(/);
    expect(privacy).toMatch(/clearCache\(/);
    expect(privacy).not.toMatch(/AsyncStorage\.clear/);
    expect(privacy).not.toMatch(/multiRemove/);
    expect(privacy).not.toMatch(/contributor|CREDENTIAL_KEY|evidenceAuthority/);
  });

  test('analytics consent is not silently changed by Account redesign', () => {
    const store = read('src/store/useSettingsStore.ts');
    expect(store).toMatch(/analyticsEnabled:\s*false/);
    const home = read('src/screens/account/AccountHomeScreen.tsx');
    const privacy = read('src/screens/account/PrivacyDataScreen.tsx');
    expect(home).not.toMatch(/setAnalyticsEnabled/);
    expect(privacy).not.toMatch(/setAnalyticsEnabled/);
  });

  test('support uses configured productIdentity email only', () => {
    const help = read('src/screens/account/HelpSupportScreen.tsx');
    expect(help).toMatch(/productIdentity\.supportEmail/);
    expect(help).not.toMatch(/openfoodfacts\.org|community forum/i);
    expect(help).toMatch(/supportEmailMissing/);
  });

  test('legal destinations fail closed when public URLs are not ready', () => {
    expect(isLegalDestinationReady('privacy')).toBe(false);
    expect(isLegalDestinationReady('terms')).toBe(false);
    expect(legalDestinations.privacy.url).toBe(productIdentity.privacyPolicyUrl);
    expect(legalDestinations.terms.url).toBe(productIdentity.termsOfServiceUrl);
    const legal = read('src/screens/account/LegalMethodologyScreen.tsx');
    expect(legal).toMatch(/isLegalDestinationReady/);
    expect(legal).toMatch(/account\.legalUrlUnavailable/);
    expect(legal).not.toMatch(/Linking\.openURL/);
  });

  test('app version helper reads Expo config rather than hardcoded 1.0.0', () => {
    expect(getInstalledAppVersion()).toBe('10.0.0');
    const home = read('src/screens/account/AccountHomeScreen.tsx');
    expect(home).toMatch(/getInstalledAppVersion/);
    expect(home).not.toMatch(/1\.0\.0/);
  });

  test('DeveloperSettings remains a root modal route, not Account stack', () => {
    const layout = read('app/_layout.tsx');
    expect(layout).toMatch(/name=\"DeveloperSettings\"/);
    expect(read('src/navigation/AccountStack.tsx')).not.toMatch(/DeveloperSettings/);
    expect(read('src/utils/linking.ts')).toMatch(/DeveloperSettings:\s*'developer-settings'/);
  });
});
