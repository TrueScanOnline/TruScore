/**
 * Share-card web destination HTML.
 * Numeric trust_score and trust_score_breakdown on the payload are not publication
 * authority and are never rendered. A URL ctx value is not publication authority either.
 */

import {
  absoluteImageUrl,
  buildLandingPresentation,
  escapeHtmlAttr,
  escapeHtmlText,
  normalizeShareContext,
  pickQueryString,
} from './shareLandingMeta';

export type ShareLandingProduct = {
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  image_url?: string;
  trust_score?: number | null;
  trust_score_breakdown?: {
    body?: number;
    planet?: number;
    ethics?: number;
    care?: number;
    open?: number;
  };
  categories?: string;
};

export type ShareLandingInput = {
  barcode: string;
  query: Record<string, string | string[] | undefined>;
  productData: ShareLandingProduct | null;
  appStoreId?: string;
  origin?: string;
};

const SHARED_PRODUCT_HEADLINE = 'Someone shared this product with you';
const SHARED_PRODUCT_READING = 'Open it in Rveel for the full reading.';

export function renderShareLandingHtml(input: ShareLandingInput): string {
  const { barcode, query, productData } = input;
  const APP_STORE_ID = input.appStoreId || '';
  const appStoreReady = /^\d{6,}$/.test(APP_STORE_ID);
  const appStoreLink = appStoreReady ? `https://apps.apple.com/app/id${APP_STORE_ID}` : '';
  const playStoreLink = 'https://play.google.com/store/apps/details?id=com.truescan.foodscanner';
  const deepLink = `truescan://barcode/${barcode}`;
  const origin = (input.origin || 'https://truescan.app').replace(/\/$/, '');

  const ctxParam = normalizeShareContext(query.ctx);
  const passthrough = pickQueryString(query, [
    'ctx',
    'src',
    'ref',
    'utm_source',
    'utm_medium',
    'utm_campaign',
  ]);
  const canonicalQuery = new URLSearchParams();
  for (const [k, v] of Object.entries(passthrough)) {
    canonicalQuery.set(k, v);
  }
  const canonicalQs = canonicalQuery.toString();
  const canonicalPageUrl = `${origin}/barcode/${barcode}${canonicalQs ? `?${canonicalQs}` : ''}`;

  const productNamePlain =
    productData?.product_name || productData?.product_name_en || 'Shared product';
  const productImageAbsolute = absoluteImageUrl(productData?.image_url || '');
  const brands = productData?.brands;
  const categories = productData?.categories;

  const productNameHtml = escapeHtmlText(productNamePlain);
  const firstBrandPlain = brands ? String(brands).split(',')[0].trim() : '';
  const firstCategoryPlain = categories ? String(categories).split(',')[0].trim() : '';
  const firstBrandHtml = firstBrandPlain ? escapeHtmlText(firstBrandPlain) : '';
  const firstCategoryHtml = firstCategoryPlain ? escapeHtmlText(firstCategoryPlain) : '';
  const barcodeHtml = escapeHtmlText(barcode);

  const defaultHeadline = SHARED_PRODUCT_HEADLINE;
  const defaultMetaDescription = `${SHARED_PRODUCT_HEADLINE}. ${SHARED_PRODUCT_READING}`;

  const landing = buildLandingPresentation({
    ctx: ctxParam,
    productNamePlain,
    defaultHeadline,
    defaultMetaDescription,
    scoreHook: SHARED_PRODUCT_HEADLINE,
    scoreViral: SHARED_PRODUCT_READING,
  });

  const pageHeadlineHtml = escapeHtmlText(landing.pageHeadlinePlain);
  const documentTitleHtml = escapeHtmlText(landing.documentTitlePlain);
  const metaDescriptionAttr = escapeHtmlAttr(landing.metaDescriptionPlain);
  const heroTaglineHtml = escapeHtmlText(landing.heroTaglinePlain);
  const heroViralHtml = escapeHtmlText(landing.heroViralPlain);
  const ogTitleAttr = escapeHtmlAttr(landing.pageHeadlinePlain);
  const twitterTitleAttr = escapeHtmlAttr(landing.pageHeadlinePlain);
  const canonicalUrlAttr = escapeHtmlAttr(canonicalPageUrl);

  const appStoreMeta = appStoreReady
    ? `<meta property="al:ios:app_store_id" content="${escapeHtmlAttr(APP_STORE_ID)}">`
    : '';
  const imageMeta = productImageAbsolute
    ? `<meta property="og:image" content="${escapeHtmlAttr(productImageAbsolute)}">`
    : '';
  const imageTwitter = productImageAbsolute
    ? `<meta name="twitter:image" content="${escapeHtmlAttr(productImageAbsolute)}">`
    : '';
  const photoHtml = productImageAbsolute
    ? `<img src="${escapeHtmlAttr(productImageAbsolute)}" alt="${escapeHtmlAttr(productNamePlain)}" onerror="this.outerHTML='<span aria-hidden=\\'true\\'>▣</span>'">`
    : '<span aria-hidden="true">▣</span>';

  const storeButtons = [
    appStoreLink
      ? `<a class="btn btn-soft btn-block" href="${escapeHtmlAttr(appStoreLink)}">Download on the App Store</a>`
      : '',
    `<a class="btn btn-soft btn-block" href="${escapeHtmlAttr(playStoreLink)}">Get it on Google Play</a>`,
  ].join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${documentTitleHtml}</title>
  <meta name="description" content="${metaDescriptionAttr}">
  <meta name="theme-color" content="#10957E">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/rveel.css">
  <link rel="canonical" href="${canonicalUrlAttr}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrlAttr}">
  <meta property="og:title" content="${ogTitleAttr}">
  <meta property="og:description" content="${metaDescriptionAttr}">
  ${imageMeta}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrlAttr}">
  <meta name="twitter:title" content="${twitterTitleAttr}">
  <meta name="twitter:description" content="${metaDescriptionAttr}">
  ${imageTwitter}
  ${appStoreMeta}
  <meta property="al:ios:app_name" content="Rveel">
  <meta property="al:ios:url" content="${escapeHtmlAttr(deepLink)}">
  <meta property="al:android:package" content="com.truescan.foodscanner">
  <meta property="al:android:app_name" content="Rveel">
  <meta property="al:android:url" content="${escapeHtmlAttr(deepLink)}">
</head>
<body class="sheet">
  <a class="skip" href="#content">Skip to content</a>
  <div class="wash sheet-wash" aria-hidden="true"></div>
  <div class="overlay" id="loadingOverlay">
    <div class="spinner" aria-hidden="true"></div>
    <div>Opening Rveel…</div>
  </div>
  <header class="top">
    <a class="mark" href="/"><img src="/logo.svg" alt="Rveel"></a>
    <nav class="nav-mini" aria-label="Primary">
      <a href="/#foods">The score</a>
      <a class="pill" href="/#get">Get the app</a>
    </nav>
  </header>
  <main class="sheet-main" id="content">
    <p class="eyebrow">Shared from Rveel</p>
    <h1 class="sheet-headline">${pageHeadlineHtml}</h1>
    <article class="product-hero">
      <div class="photo-well">${photoHtml}</div>
      <div>
        ${firstBrandHtml ? `<p class="brand">${firstBrandHtml}</p>` : ''}
        <h2 class="product-title">${productNameHtml}</h2>
        <p class="meta">${firstCategoryHtml ? `${firstCategoryHtml} · ` : ''}Barcode ${barcodeHtml}</p>
      </div>
    </article>
    <p class="context">${heroTaglineHtml}. ${heroViralHtml}</p>
    <div class="cta-stack">
      <a class="btn btn-green btn-block" id="openApp" href="${escapeHtmlAttr(deepLink)}">Open in Rveel</a>
      ${storeButtons}
      <a class="btn btn-soft btn-block" href="/">About Rveel</a>
    </div>
  </main>
  <footer class="site-footer">
    <div>
      <span>Rveel</span>
      <span class="sha-chip">SHA ac9a0e2</span>
    </div>
    <nav aria-label="Legal">
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
    </nav>
  </footer>
  <script>
    const barcode = ${JSON.stringify(barcode)};
    const deepLink = ${JSON.stringify(deepLink)};
    const playStoreLink = ${JSON.stringify(playStoreLink)};
    const appStoreLink = ${JSON.stringify(appStoreLink)};
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const overlay = document.getElementById('loadingOverlay');

    function showOpening() {
      if (!overlay) return;
      overlay.style.display = 'flex';
    }
    function hideOpening() {
      if (!overlay) return;
      overlay.style.display = 'none';
    }

    document.getElementById('openApp').addEventListener('click', function (event) {
      if (!isIOS && !isAndroid) {
        event.preventDefault();
        const note = document.createElement('p');
        note.className = 'context';
        note.textContent = 'Rveel is a phone app. Open this page on your phone, or install it from the store links below.';
        event.currentTarget.insertAdjacentElement('afterend', note);
        return;
      }
      event.preventDefault();
      showOpening();
      if (isAndroid) {
        const intentUrl = 'intent://barcode/' + encodeURIComponent(barcode) + '#Intent;scheme=truescan;package=com.truescan.foodscanner;S.browser_fallback_url=' + encodeURIComponent(playStoreLink) + ';end';
        window.location.href = intentUrl;
        setTimeout(function () {
          if (!document.hidden) window.location.href = playStoreLink;
        }, 1800);
        return;
      }
      window.location.href = deepLink;
      setTimeout(function () {
        if (!document.hidden && appStoreLink) window.location.href = appStoreLink;
        else hideOpening();
      }, 1800);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) hideOpening();
    });
  </script>
</body>
</html>`;
}
