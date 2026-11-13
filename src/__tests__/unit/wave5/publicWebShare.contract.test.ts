/**
 * Public web share fail-closed contract.
 * Legacy numeric preview fields and URL ctx values are not publication authority.
 */

import { renderShareLandingHtml } from '../../../../backend/vercel/lib/shareLandingHtml';
import { ALLOWED_SHARE_CONTEXTS } from '../../../../backend/vercel/lib/shareLandingMeta';
import { toPublicProductPreview } from '../../../../backend/vercel/lib/publicPreviewContract';

/** Approved WEB-01 teaser copy (shareLandingHtml) — verified on temporary Vercel host. */
const SHARED = 'Someone shared this product with you';
const READING = 'Open it in Rveel for the full reading.';
const TEASER_LOCK = 'Reading locked';
const TEASER_PROMISE = 'Scores and details stay in the app — this page is only a teaser.';
const OPEN_CTA = 'Open this product in Rveel';
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
  expect(html).toContain('Get it on Google Play');
  expect(html).toContain('https://play.google.com/store/apps/details?id=com.truescan.foodscanner');
  expect(html).toContain('https://apps.apple.com/app/id6755704230');
  expect(html).toContain('Barcode 5449000000996');
}

/** Presentation markers for the approved teaser veil (not legacy mystery-pillar DOM). */
function expectApprovedTeaserPresentation(html: string) {
  expect(html).toContain('sheet-teaser');
  expect(html).toContain('teaser-card');
  expect(html).toContain('teaser-veil');
  expect(html).toContain('teaser-blur-grid');
  expect(html).toContain('teaser-frost');
  expect(html).toContain(TEASER_LOCK);
  expect(html).toContain(TEASER_PROMISE);
  expect(html).toContain(OPEN_CTA);
  expect(html).toContain('class="tb body"');
  expect(html).toContain('class="tb planet"');
  expect(html).toContain('class="tb claims"');
  expect(html).toContain('class="tb open"');
  // Legacy mystery-score scaffolding must stay gone (fail-closed presentation).
  expect(html).not.toContain('pillar-tile');
  expect(html).not.toContain('pillar-mystery');
  expect(html).not.toContain('mystery-medallion');
  expect(html).not.toContain('sheet-gateway-v5');
  expect(html).not.toContain('v5-aperture');
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
    expectApprovedTeaserPresentation(html);
    expect(html).toContain(SHARED);
    expect(html).toContain(READING);
    expect(html).toContain(`<title>Coca-Cola Original · Rveel</title>`);
    expect(html).toContain('property="og:description"');
    expect(html).toContain('name="twitter:description"');
    expect(html).toContain('alt="Coca-Cola Original"');
    // Installed-app handoff is intentional on mobile; auto-open remains gated in-page.
    expect(html).toContain('openInApp(true)');
    expect(html).toMatch(/triedAuto/);
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
    expect(html).toContain(SHARED);
    expect(html).toContain(READING);
    expectApprovedTeaserPresentation(html);
    expect(html).toContain('truescan://barcode/5449000000996');
    expect(html).toContain('Barcode 5449000000996');
    expect(html).not.toContain('ORGANIC BLUE CORN');
    expect(html).not.toContain('Curious about this product?');
    expect(html).not.toMatch(/\d+\s*\/\s*100/);
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
    expectNoPublishedScore(html);
    expectApprovedTeaserPresentation(html);
    expect(html).not.toMatch(/\b2\s*\/\s*25\b/);
    expect(html).not.toMatch(/\b23\b[^<]*Poor/);
    expect(html).not.toMatch(/\b\d+\s*\/\s*25\b/);
    expect(html).not.toMatch(/\b(Poor|Excellent|Fair|Good)\b/);
    expect(html).toContain('Download on the App Store');
    expect(html).toContain('Get it on Google Play');
    expect(html).toContain('Already have Rveel? We’ll open this exact barcode');
    expect(html).toContain(SHARED);
    expect(html).toContain('Coca-Cola Original');
    expect(html).toContain(OPEN_CTA);
    expect(html).toMatch(/triedAuto/);
    expect(html).toContain('openInApp(true)');
  });
});
