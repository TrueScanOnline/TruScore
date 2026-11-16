/**
 * Account tab MVP completion contracts — Free/Guest polish without Premium/auth/scoring changes.
 */
import fs from 'fs';
import path from 'path';
import { legalDestinations, isLegalDestinationReady } from '../../../config/legalDestinations';
import { MVP_RUNTIME, MVP_ENABLED_UI_LOCALES } from '../../../config/mvpRuntimeGates';
import en from '../../../i18n/locales/en.json';

const root = path.resolve(__dirname, '../../../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

describe('Account MVP completion contracts', () => {
  test('units toggle is present and Preferences placeholder is gone', () => {
    const home = read('src/screens/account/AccountHomeScreen.tsx');
    expect(home).toMatch(/account-row-units/);
    expect(home).toMatch(/setUnits/);
    expect(home).not.toMatch(/account-row-preferences/);
    expect(home).not.toMatch(/comingSoon/);
  });

  test('plan copy does not promise future paid release timing', () => {
    expect(en.account.planPaidUnavailableNote).toMatch(/not available in this build/i);
    expect(en.account.planPaidUnavailableNote).not.toMatch(/planned for a future release|coming soon|\$\d/i);
    expect(en.account.planFreeBody).not.toMatch(/upgrade|trial|subscribe/i);
  });

  test('profile explains guest local-data limits without inventing delete-account', () => {
    expect(en.account.profileLimitsNote).toMatch(/Guest mode/i);
    expect(en.account.profileLimitsNote).toMatch(/delete-account|Delete Account/i);
    const profile = read('src/screens/account/AccountProfileScreen.tsx');
    expect(profile).toMatch(/profileLimitsNote/);
    expect(profile).not.toMatch(/Delete Account|Sign in|Log out/i);
  });

  test('privacy distinguishes local clears from server/OFF and gates data-help on support', () => {
    const privacy = read('src/screens/account/PrivacyDataScreen.tsx');
    expect(privacy).toMatch(/privacyIntro/);
    expect(privacy).toMatch(/privacyFootnote/);
    expect(privacy).toMatch(/requestDataHelp/);
    expect(privacy).toMatch(/supportConfigured/);
    expect(privacy).toMatch(/productIdentity\.supportEmail/);
    expect(privacy).toMatch(/openPrivacyDataRequest/);
    expect(privacy).not.toMatch(/openAssessmentReport/);
    expect(en.account.privacyIntro).toMatch(/Open Food Facts|Evidence Authority/i);
    expect(en.account.privacyFootnote).toMatch(/Delete Account/i);
  });

  test('help contact does not claim receipt when opening email', () => {
    expect(en.account.helpIntro).toMatch(/does not mean a report was received/i);
    expect(en.account.helpEmailOpensOnly).toMatch(/do not create a ticket|confirm/i);
    const help = read('src/screens/account/HelpSupportScreen.tsx');
    expect(help).toMatch(/helpEmailOpensOnly/);
    expect(help).not.toMatch(/report was received|ticket created/i);
  });

  test('legal remains fail-closed and does not flip readiness', () => {
    expect(isLegalDestinationReady('privacy')).toBe(false);
    expect(isLegalDestinationReady('terms')).toBe(false);
    expect(legalDestinations.privacy.ready).toBe(false);
    expect(legalDestinations.terms.ready).toBe(false);
    const legal = read('src/screens/account/LegalMethodologyScreen.tsx');
    expect(legal).toMatch(/legalIntro/);
    expect(legal).toMatch(/legalSignalsNote/);
    expect(legal).not.toMatch(/ready:\s*true/);
  });

  test('MVP gates stay off for paywall and English-only UI', () => {
    expect(MVP_RUNTIME.subscriptionAndPaywall).toBe(false);
    expect([...MVP_ENABLED_UI_LOCALES]).toEqual(['en']);
  });

  test('AccountRow exposes accessible switch and font scaling bounds', () => {
    const row = read('src/components/account/AccountRow.tsx');
    expect(row).toMatch(/maxFontSizeMultiplier=\{1\.35\}/);
    expect(row).toMatch(/accessibilityRole=\{hasSwitch \? 'switch'/);
    expect(row).toMatch(/minHeight:\s*56/);
  });
});
