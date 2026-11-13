/**
 * Public web share fail-closed contract.
 * Legacy numeric preview fields and URL ctx values are not publication authority.
 */

import { renderShareLandingHtml } from '../../../../backend/vercel/lib/shareLandingHtml';
import { ALLOWED_SHARE_CONTEXTS } from '../../../../backend/vercel/lib/shareLandingMeta';
import { toPublicProductPreview } from '../../../../backend/vercel/lib/publicPreviewContract';

const SHARED = 'Curious about this product?';
const READING = 'Reveal more in Rveel';
const SUPPORT = 'See how Rveel looks at';
const UNKNOWN_AVAIL =
  'Once Rveel is available, you can scan or search this barcode to see what information is available.';
const UNKNOWN_HEADLINE = "We couldn't identify this product yet.";
const REVEAL_CTA = 'Discover more in Rveel';
const SCORE_COLOURS = /#16a085|#1f9d78|#b8860b|#e45757/i;
const BANDS = /\b(Excellent|Good|Fair|Poor)\b/;

const legacyProduct = {
  product_name: 'Coca-Cola Original',
  brands: 'Coca-Cola',
  image_url: 'https://images.example/cola.jpg',
  categories: 'Beverages',
  trust_score: 44,
  trust_score_breakdown: { body: 2, planet: 16, ethics: 15, care: 99, open: 11 },
};

function render(options?: {
  query?: Record<string, string>;
  productData?: Record<string, unknown> | null;
  trust_score?: number | null;
  breakdown?: { body: number; planet: number; ethics: number; open: number };
}) {
  const productData =
    options?.productData === null
      ? null
      : {
          ...legacyProduct,
          ...(options?.trust_score !== undefined ? { trust_score: options.trust_score } : {}),
          ...(options?.breakdown ? { trust_score_breakdown: options.breakdown } : {}),
          ...(options?.productData ?? {}),
        };
  return renderShareLandingHtml({
    barcode: '5449000000996',
    query: options?.query ?? { ctx: 'truScore' },
    productData,
    appStoreId: '6755704230',
    origin: 'https://truescan.app',
  });
}

function expectNoPublishedScore(html: string) {
  expect(html).not.toMatch(/\d+\s*\/\s*100/);
  expect(html).not.toMatch(/\d+\s*\/\s*25/);
  expect(html).not.toMatch(SCORE_COLOURS);
  expect(html).not.toContain('stroke-dashoffset');
  expect(html).not.toMatch(BANDS);
  expect(html).not.toContain('Low Rveel Score');
  expect(html).not.toContain('Rveel Score');
  expect(html).not.toContain('Rveel Score unavailable');
  expect(html).not.toContain('UnRevealed');
  expect(html).not.toContain('scored excellent');
}

function expectIdentityAndLinks(html: string) {
  expect(html).toContain('Coca-Cola Original');
  expect(html).toContain('https://images.example/cola.jpg');
  expect(html).toContain('truescan://barcode/5449000000996');
  expect(html).toContain('Google Play — coming soon');
  expect(html).not.toContain('https://play.google.com/store/apps/details?id=com.truescan.foodscanner');
  expect(html).toContain('https://apps.apple.com/app/id6755704230');
  expect(html).toContain('Barcode 5449000000996');
}

describe('public product-preview score contract', () => {
  it('nulls finite legacy Overall and all four pillar values, and keeps identity fields', () => {
    const preview = toPublicProductPreview({
      barcode: '5449000000996',
      product_name: 'Coca-Cola Original',
      product_name_en: 'Coca-Cola',
      brands: 'COCA-COLA',
      image_url: 'https://images.example/cola.jpg',
      nutriments: { sugars_100g: 10.6 },
      ingredients_text: 'Carbonated water',
      nova_group: 4,
      ecoscore_grade: 'not-applicable',
      categories: 'Beverages',
      trust_score: 44,
      trust_score_breakdown: { body: 2, planet: 16, ethics: 15, care: 99, open: 11 },
    });

    expect(preview.trust_score).toBeNull();
    expect(preview.trust_score_breakdown).toBeNull();
    expect(preview.product_name).toBe('Coca-Cola Original');
    expect(preview.image_url).toBe('https://images.example/cola.jpg');
    expect(preview.nutriments).toEqual({ sugars_100g: 10.6 });
    expect(preview.ingredients_text).toBe('Carbonated water');
    expect(preview.nova_group).toBe(4);
    expect(preview.categories).toBe('Beverages');

    const json = JSON.parse(JSON.stringify(preview)) as Record<string, unknown>;
    expect(json).toHaveProperty('trust_score', null);
    expect(json).toHaveProperty('trust_score_breakdown', null);
    expect(Object.keys(json)).toEqual(
      expect.arrayContaining(['trust_score', 'trust_score_breakdown', 'product_name', 'image_url'])
    );
  });

  it('nulls a raw zero and a missing publication instead of omitting the fields', () => {
    const zero = toPublicProductPreview({
      barcode: '00000000',
      trust_score: 0,
      trust_score_breakdown: { body: 0, planet: 0, ethics: 0, open: 0 },
    });
    const missing = toPublicProductPreview({ barcode: '00000000' });

    for (const preview of [zero, missing]) {
      const json = JSON.parse(JSON.stringify(preview)) as Record<string, unknown>;
      expect(json.trust_score).toBeNull();
      expect(json.trust_score_breakdown).toBeNull();
      expect(json).toHaveProperty('trust_score');
      expect(json).toHaveProperty('trust_score_breakdown');
    }
  });
});

describe('share landing renderer ignores legacy scores and ctx', () => {
  it('renders neutral metadata and no score from a finite legacy payload', () => {
    const html = render();
    expectNoPublishedScore(html);
    expectIdentityAndLinks(html);
    expect(html).toContain(SHARED);
    expect(html).toContain(READING);
    expect(html).toContain(SUPPORT);
    expect(html).toContain('Body');
    expect(html).toContain('Planet');
    expect(html).toContain('Claims');
    expect(html).toContain('Transparency');
    expect(html).toContain(`<title>Coca-Cola Original · Rveel</title>`);
    expect(html).toContain(SHARED);
    expect(html).toContain('property="og:description"');
    expect(html).toContain('name="twitter:description"');
    expect(html).toContain('alt="Coca-Cola Original"');
    expect(html).not.toContain('openInApp(true)');
    expect(html).not.toMatch(/triedAuto/);
  });

  it('does not render a raw zero or four pillar zeros', () => {
    const html = render({
      trust_score: 0,
      breakdown: { body: 0, planet: 0, ethics: 0, open: 0 },
    });
    expectNoPublishedScore(html);
    expect(html).not.toContain('0/100');
    expect(html).not.toContain('0/25');
    expect(html).toContain(SHARED);
    expect(html).toContain(READING);
  });

  it('stays neutral when product data and publication are missing', () => {
    const html = render({ productData: null, query: {} });
    expectNoPublishedScore(html);
    expect(html).toContain('Shared product');
    expect(html).toContain(UNKNOWN_HEADLINE);
    expect(html).toContain('No completed product analysis is available on this page yet.');
    expect(html).toContain(UNKNOWN_AVAIL);
    expect(html).not.toContain('Download Rveel to scan');
    expect(html).toContain('sheet-unknown');
    expect(html).toContain('truescan://barcode/5449000000996');
    expect(html).toContain('No photo yet');
    expect(html).not.toContain('ORGANIC BLUE CORN');
    expect(html).not.toContain('Curious about this product?');
  });

  it.each([...ALLOWED_SHARE_CONTEXTS])(
    'ctx %s cannot authorise a number, band, or low-score frame',
    (ctx) => {
      const html = render({
        query: { ctx },
        trust_score: 12,
        breakdown: { body: 2, planet: 3, ethics: 4, open: 3 },
      });
      expectNoPublishedScore(html);
      expect(html).not.toContain('Low Rveel Score');
    }
  );

  it('keeps non-score context while a legacy score is present', () => {
    const recall = render({ query: { ctx: 'recall' }, trust_score: 12 });
    expectNoPublishedScore(recall);
    expect(recall).toContain('Recall alert: Coca-Cola Original');
    expect(recall).toContain('Someone shared this for your safety');

    const nutrition = render({ query: { ctx: 'nutrition' }, trust_score: 80 });
    expectNoPublishedScore(nutrition);
    expect(nutrition).toContain('Nutrition snapshot: Coca-Cola Original');
    expect(nutrition).toContain('Open it in Rveel for the full reading.');

    const negative = render({ query: { ctx: 'negativeTruScore' }, trust_score: 10 });
    expectNoPublishedScore(negative);
    expect(negative).toContain(SHARED);
    expect(negative).toContain(READING);
    expect(negative).not.toContain('low Rveel');
  });

  it('does not embed real score digits behind frost (no hidden score DOM)', () => {
    const html = render();
    expect(html).not.toMatch(/\b2\s*\/\s*25\b/);
    expect(html).not.toMatch(/\b23\b[^<]*Poor/);
    expect(html).not.toMatch(/\b\d+\s*\/\s*25\b/);
    expect(html).toContain('pillar-tile');
    expect(html).toContain('pillar-veil');
    expect(html).toContain('pillar-mystery');
    expect(html).toContain('mystery-impression');
    expect(html).toContain('data-mci="apple"');
    expect(html).toContain('data-mci="leaf"');
    expect(html).toContain('data-mci="message-text"');
    expect(html).toContain('data-mci="eye"');
    expect(html).toContain('sheet-gateway-v5');
    expect(html).toContain('sheet-gateway-mystery');
    expect(html).toContain('mystery-medallion');
    expect(html).toContain('medallion-socket');
    expect(html).not.toContain('pillar-veil-bars');
    expect(html).not.toContain('medallion-lock');
    expect(html).not.toContain('v5-aperture');
    expect(html).not.toContain('In Rveel');
    expect(html).toContain('pillar-name');
    expect(html).toMatch(/>\?</);
    expect(html).not.toMatch(/\b\d+\s*\/\s*25\b/);
    expect(html).not.toMatch(/\b(Poor|Excellent|Fair|Good)\b/);
    expect(html).toContain('Google Play — coming soon');
    expect(html).toContain('store-soon');
    expect(html).not.toMatch(/data-store="android"[^>]*href=/);
    // Fixture supplies APP_STORE_ID → live App Store link remains valid when configured
    expect(html).toContain('Download on the App Store');
    expect(html).toContain('Already have Rveel? Open this product');
    expect(html).toContain(SHARED);
    expect(html).toContain('Coca-Cola Original');
    expect(html).toContain(REVEAL_CTA);
    expect(html).toContain('does not uncover product findings or scores');
    expect(html).toContain('App store listings are coming soon');
    expect(html).not.toContain('Downloading Rveel does not automatically restore');
    expect(html).not.toMatch(/triedAuto|openInApp\(true\)/);
  });
});
