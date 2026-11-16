/**
 * Account Trust / Privacy / Support / Legal completion behavioural contracts.
 */
import fs from 'fs';
import path from 'path';
import en from '../../../i18n/locales/en.json';
import { legalDestinations, isLegalDestinationReady } from '../../../config/legalDestinations';
import { MVP_RUNTIME } from '../../../config/mvpRuntimeGates';
import {
  isOffPublicContributionEnabled,
} from '../../../config/offContributionGate';
import {
  isLocalShareAnalyticsEnabled,
  isShareEventTelemetryEnabled,
} from '../../../config/shareTelemetryGate';
import { OFFICIAL_FOOD_RECALL_LINKS, HELP_FAQ_ITEMS } from '../../../content/accountTrustContent';
import { buildPrivacyDataRequestMailto } from '../../../utils/reportPrivacyMailto';
import { buildAssessmentReportMailto } from '../../../utils/reportAssessmentMailto';
import {
  buildManufacturerReviewMailto,
  buildTechnicalSupportMailto,
} from '../../../utils/reportSupportMailto';

const root = path.resolve(__dirname, '../../../..');
function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

describe('Account Trust completion — privacy', () => {
  test('privacy intro distinguishes device clears from transmitted data', () => {
    expect(en.account.privacyIntro).toMatch(/saves some information on your device/i);
    expect(en.account.privacyIntro).toMatch(/does not automatically delete/i);
    expect(en.account.privacyIntro).toMatch(/Evidence Authority/i);
    expect(en.account.privacyIntro).not.toMatch(/every scan is stored on RVEEL servers/i);
  });

  test('privacy requests cover access/correction/deletion-review/complaint without GTIN demand', () => {
    const privacy = read('src/screens/account/PrivacyDataScreen.tsx');
    expect(privacy).toMatch(/privacyRequestAccess/);
    expect(privacy).toMatch(/privacyRequestCorrection/);
    expect(privacy).toMatch(/privacyRequestDeletionReview/);
    expect(privacy).toMatch(/privacyRequestComplaint/);
    expect(privacy).toMatch(/openPrivacyDataRequest/);
    expect(privacy).not.toMatch(/openAssessmentReport/);

    const url = decodeURIComponent(
      buildPrivacyDataRequestMailto('a@b.test', 'Privacy', {
        requestType: 'deletion_review',
      }) || ''
    );
    expect(url).toMatch(/deletion request is a request for review/i);
    expect(url).not.toMatch(/Barcode \/ GTIN/);
    expect(url).toMatch(/Do not attach government identity documents/i);
  });

  test('cache unavailable state is represented in privacy UI', () => {
    const privacy = read('src/screens/account/PrivacyDataScreen.tsx');
    expect(privacy).toMatch(/cacheSize === null/);
    expect(privacy).toMatch(/cacheCountUnavailable/);
    expect(en.account.cacheCountUnavailable).toMatch(/unavailable/i);
  });

  test('telemetry copy does not invent consumer consent or permanent absence', () => {
    expect(en.account.dataUseTelemetryBody).toMatch(/default off/i);
    expect(en.account.dataUseTelemetryBody).toMatch(/gated/i);
    expect(en.account.dataUseTelemetryBody).not.toMatch(/never transmits|always disabled permanently/i);
    expect(en.account.dataUseTelemetryBody).not.toMatch(/by toggling analytics consent/i);
  });
});

describe('Account Trust completion — help', () => {
  test('FAQ set covers required topics', () => {
    expect(HELP_FAQ_ITEMS.length).toBeGreaterThanOrEqual(12);
    for (const item of HELP_FAQ_ITEMS) {
      const titlePath = item.titleKey.replace(/^account\./, '') as keyof typeof en.account;
      const bodyPath = item.bodyKey.replace(/^account\./, '') as keyof typeof en.account;
      expect(typeof en.account[titlePath]).toBe('string');
      expect(String(en.account[bodyPath]).length).toBeGreaterThan(20);
    }
  });

  test('help keeps product report distinct from privacy and does not claim receipt', () => {
    const help = read('src/screens/account/HelpSupportScreen.tsx');
    expect(help).toMatch(/openAssessmentReport/);
    expect(help).toMatch(/buildManufacturerReviewMailto/);
    expect(help).toMatch(/buildTechnicalSupportMailto/);
    expect(help).toMatch(/PrivacyData/);
    expect(en.account.helpIntro).toMatch(/does not mean a report was received/i);
    expect(en.account.helpEmailOpensOnly).toMatch(/do not create a ticket/i);
    expect(en.account.reportProductExplain).toMatch(/does not automatically change a score/i);
  });

  test('official recall links are the founder-specified destinations', () => {
    expect(OFFICIAL_FOOD_RECALL_LINKS.nz.url).toBe(
      'https://www.mpi.govt.nz/food-safety-home/food-recalls-and-complaints/recalled-food-products'
    );
    expect(OFFICIAL_FOOD_RECALL_LINKS.au.url).toBe(
      'https://www.foodstandards.gov.au/food-recalls/recall-alert'
    );
    const help = read('src/screens/account/HelpSupportScreen.tsx');
    expect(help).toMatch(/OFFICIAL_FOOD_RECALL_LINKS/);
  });

  test('assessment mailto clarifies optional photos and non-automatic correction', () => {
    const decoded = decodeURIComponent(
      buildAssessmentReportMailto('s@t.test', 'Report', { barcode: '123' }) || ''
    );
    expect(decoded).toMatch(/Barcode \/ GTIN: 123/);
    expect(decoded).toMatch(/does not automatically change a RVEEL Score/i);
    expect(decoded).toMatch(/Optional pack photographs/i);
    expect(decoded).not.toMatch(/Please attach pack photos if available\.$/);
  });

  test('technical and manufacturer mailtos avoid credentials and automatic change claims', () => {
    const tech = decodeURIComponent(
      buildTechnicalSupportMailto('s@t.test', 'Tech') || ''
    );
    const mfr = decodeURIComponent(
      buildManufacturerReviewMailto('s@t.test', 'Mfr') || ''
    );
    expect(tech).toMatch(/Do not include passwords, tokens/i);
    expect(mfr).toMatch(/does not automatically change or remove an assessment/i);
    expect(buildTechnicalSupportMailto('', 'x')).toBeNull();
    expect(buildManufacturerReviewMailto('', 'x')).toBeNull();
  });
});

describe('Account Trust completion — legal', () => {
  test('publication-state copy separates Rated, Checking, NR and hold', () => {
    expect(en.account.publicationCheckingBody).toMatch(/not a final product outcome/i);
    expect(en.account.publicationNrBody).toMatch(/not a zero/i);
    expect(en.account.publicationNrBody).toMatch(/administrative hold/i);
    expect(en.account.publicationHoldBody).toMatch(/separate from scoring, NR and Checking/i);
    expect(en.account.confidenceAccountBody).toMatch(/weakest pillar confidence/i);
    expect(en.account.confidenceAccountBody).not.toMatch(/statistical guarantee that the score is correct/i);
  });

  test('legal destinations remain fail-closed and gates stay off', () => {
    expect(isLegalDestinationReady('privacy')).toBe(false);
    expect(isLegalDestinationReady('terms')).toBe(false);
    expect(legalDestinations.privacy.ready).toBe(false);
    expect(legalDestinations.terms.ready).toBe(false);
    expect(MVP_RUNTIME.subscriptionAndPaywall).toBe(false);
    expect(isOffPublicContributionEnabled()).toBe(false);
    expect(isShareEventTelemetryEnabled()).toBe(false);
    expect(isLocalShareAnalyticsEnabled()).toBe(false);
    const legal = read('src/screens/account/LegalMethodologyScreen.tsx');
    expect(legal).not.toMatch(/ready:\s*true/);
    expect(legal).toMatch(/legalSignalsNote/);
    expect(en.account.sourcesStructuredImagesBody).toMatch(/Share Cards do not currently render/i);
  });
});
