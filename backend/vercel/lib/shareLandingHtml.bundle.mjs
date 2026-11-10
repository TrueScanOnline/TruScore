// backend/vercel/lib/shareLandingMeta.ts
var ALLOWED_SHARE_CONTEXTS = /* @__PURE__ */ new Set([
  "truScore",
  "recall",
  "countryOfManufacture",
  "negativeTruScore",
  "productInfo",
  "insights",
  "palmOil",
  "nutrition",
  "ingredients",
  "processing",
  "allergens",
  "ecoscore"
]);
function normalizeShareContext(raw) {
  const s = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : void 0;
  if (!s || !ALLOWED_SHARE_CONTEXTS.has(s)) return void 0;
  return s;
}
function escapeHtmlText(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeHtmlAttr(s) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function absoluteImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  const t = url.trim();
  if (!t) return "";
  if (t.startsWith("//")) return `https:${t}`;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}
function pickQueryString(reqQuery, keys) {
  const out = {};
  for (const key of keys) {
    const v = reqQuery[key];
    const s = typeof v === "string" ? v : Array.isArray(v) ? v[0] : void 0;
    if (!s || s.length > 200) continue;
    if (/^[\w.\-+%]{1,200}$/.test(s)) {
      out[key] = s;
    }
  }
  return out;
}
function buildLandingPresentation(args) {
  const { ctx, productNamePlain: pn, defaultHeadline, defaultMetaDescription, scoreHook, scoreViral } = args;
  switch (ctx) {
    case "recall":
      return {
        pageHeadlinePlain: `Recall alert: ${pn}`,
        documentTitlePlain: `${pn} \xB7 Recall \xB7 Rveel`,
        metaDescriptionPlain: `Recall and safety context for ${pn}. Open Rveel for full details \u2014 free app.`,
        heroTaglinePlain: "Someone shared this for your safety",
        heroViralPlain: "Check recall status and product details in Rveel."
      };
    case "nutrition":
      return {
        pageHeadlinePlain: `Nutrition snapshot: ${pn}`,
        documentTitlePlain: `${pn} \xB7 Nutrition \xB7 Rveel`,
        metaDescriptionPlain: `Nutrition facts for ${pn}. Open it in Rveel for the full reading.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: "Open it in Rveel for the full reading."
      };
    case "allergens":
      return {
        pageHeadlinePlain: `Allergens & additives: ${pn}`,
        documentTitlePlain: `${pn} \xB7 Allergens \xB7 Rveel`,
        metaDescriptionPlain: `Allergen and additive context for ${pn}. View details in Rveel.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: "See allergen and ingredient details in the app."
      };
    case "ecoscore":
      return {
        pageHeadlinePlain: `Environmental context: ${pn}`,
        documentTitlePlain: `${pn} \xB7 Eco \xB7 Rveel`,
        metaDescriptionPlain: `Environmental context for ${pn}. Open it in Rveel for the full reading.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: "Open it in Rveel for the full reading."
      };
    case "countryOfManufacture":
      return {
        pageHeadlinePlain: `Country of manufacture: ${pn}`,
        documentTitlePlain: `${pn} \xB7 Origin \xB7 Rveel`,
        metaDescriptionPlain: `Where ${pn} is made \u2014 see sourcing details in Rveel.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: "Trace manufacturing and origins in the app."
      };
    case "insights":
      return {
        pageHeadlinePlain: `Alert insight: ${pn}`,
        documentTitlePlain: `${pn} \xB7 Alerts \xB7 Rveel`,
        metaDescriptionPlain: `Optional user-alert insight for ${pn}. Open Rveel to read more.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: "See how this product lines up with your chosen alerts."
      };
    case "palmOil":
      return {
        pageHeadlinePlain: `Palm oil: ${pn}`,
        documentTitlePlain: `${pn} \xB7 Palm oil \xB7 Rveel`,
        metaDescriptionPlain: `Palm oil and sourcing context for ${pn} in Rveel.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: "See palm oil and transparency details in the app."
      };
    case "ingredients":
      return {
        pageHeadlinePlain: `Ingredients: ${pn}`,
        documentTitlePlain: `${pn} \xB7 Ingredients \xB7 Rveel`,
        metaDescriptionPlain: `Ingredient list and analysis for ${pn} \u2014 Rveel app.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: "Read ingredients and processing in the app."
      };
    case "processing":
      return {
        pageHeadlinePlain: `Processing level: ${pn}`,
        documentTitlePlain: `${pn} \xB7 Processing \xB7 Rveel`,
        metaDescriptionPlain: `How processed is ${pn}? See NOVA-style context in Rveel.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: "See processing and nutrition context in the app."
      };
    case "negativeTruScore":
    case "truScore":
    case "productInfo":
    default:
      return {
        pageHeadlinePlain: defaultHeadline,
        documentTitlePlain: `${pn} \xB7 Rveel`,
        metaDescriptionPlain: defaultMetaDescription,
        heroTaglinePlain: scoreHook,
        heroViralPlain: scoreViral
      };
  }
}

// backend/vercel/lib/shareLandingHtml.ts
var SHARED_PRODUCT_HEADLINE = "Someone shared this product with you";
var SHARED_PRODUCT_READING = "Open it in Rveel for the full reading.";
function renderShareLandingHtml(input) {
  const { barcode, query, productData } = input;
  const APP_STORE_ID = input.appStoreId || "";
  const appStoreReady = /^\d{6,}$/.test(APP_STORE_ID);
  const appStoreLink = appStoreReady ? `https://apps.apple.com/app/id${APP_STORE_ID}` : "";
  const playStoreLink = "https://play.google.com/store/apps/details?id=com.truescan.foodscanner";
  const deepLink = `truescan://barcode/${barcode}`;
  const origin = (input.origin || "https://truscoreapi.vercel.app").replace(/\/$/, "");
  const ctxParam = normalizeShareContext(query.ctx);
  const passthrough = pickQueryString(query, [
    "ctx",
    "src",
    "ref",
    "utm_source",
    "utm_medium",
    "utm_campaign"
  ]);
  const canonicalQuery = new URLSearchParams();
  for (const [k, v] of Object.entries(passthrough)) {
    canonicalQuery.set(k, v);
  }
  const canonicalQs = canonicalQuery.toString();
  const canonicalPageUrl = `${origin}/barcode/${barcode}${canonicalQs ? `?${canonicalQs}` : ""}`;
  const productNamePlain = productData?.product_name || productData?.product_name_en || "Shared product";
  const productImageAbsolute = absoluteImageUrl(productData?.image_url || "");
  const brands = productData?.brands;
  const productNameHtml = escapeHtmlText(productNamePlain);
  const firstBrandPlain = brands ? String(brands).split(",")[0].trim() : "";
  const firstBrandHtml = firstBrandPlain ? escapeHtmlText(firstBrandPlain) : "";
  const barcodeHtml = escapeHtmlText(barcode);
  const landing = buildLandingPresentation({
    ctx: ctxParam,
    productNamePlain,
    defaultHeadline: SHARED_PRODUCT_HEADLINE,
    defaultMetaDescription: `${SHARED_PRODUCT_HEADLINE}. ${SHARED_PRODUCT_READING}`,
    scoreHook: SHARED_PRODUCT_HEADLINE,
    scoreViral: SHARED_PRODUCT_READING
  });
  const pageHeadlineHtml = escapeHtmlText(landing.pageHeadlinePlain);
  const documentTitleHtml = escapeHtmlText(landing.documentTitlePlain);
  const metaDescriptionAttr = escapeHtmlAttr(landing.metaDescriptionPlain);
  const heroTaglineHtml = escapeHtmlText(landing.heroTaglinePlain);
  const heroViralHtml = escapeHtmlText(landing.heroViralPlain);
  const ogTitleAttr = escapeHtmlAttr(landing.pageHeadlinePlain);
  const twitterTitleAttr = escapeHtmlAttr(landing.pageHeadlinePlain);
  const canonicalUrlAttr = escapeHtmlAttr(canonicalPageUrl);
  const appStoreMeta = appStoreReady ? `<meta property="al:ios:app_store_id" content="${escapeHtmlAttr(APP_STORE_ID)}">` : "";
  const imageMeta = productImageAbsolute ? `<meta property="og:image" content="${escapeHtmlAttr(productImageAbsolute)}">` : "";
  const imageTwitter = productImageAbsolute ? `<meta name="twitter:image" content="${escapeHtmlAttr(productImageAbsolute)}">` : "";
  const photoHtml = productImageAbsolute ? `<img src="${escapeHtmlAttr(productImageAbsolute)}" alt="${escapeHtmlAttr(productNamePlain)}" onerror="this.outerHTML='<span class=\\'story-placeholder\\' aria-hidden=\\'true\\'>\u25A3</span>'">` : '<span class="story-placeholder" aria-hidden="true">\u25A3</span>';
  const brandLine = firstBrandHtml ? `<p class="story-brand">${firstBrandHtml}</p>` : "";
  const storeButtons = [
    appStoreLink ? `<a class="btn btn-soft btn-block" href="${escapeHtmlAttr(appStoreLink)}">Download on the App Store</a>` : `<span class="btn btn-soft btn-block soon" aria-disabled="true">Coming to the App Store</span>`,
    `<a class="btn btn-soft btn-block" href="${escapeHtmlAttr(playStoreLink)}">Get it on Google Play</a>`
  ].join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${documentTitleHtml}</title>
  <meta name="description" content="${metaDescriptionAttr}">
  <meta name="theme-color" content="#10957E">
  <meta name="robots" content="noindex,nofollow">
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
<body class="sheet sheet-teaser">
  <a class="skip" href="#content">Skip to content</a>
  <header class="top">
    <a class="mark" href="/"><img src="/logo.svg" alt="Rveel"></a>
    <nav class="nav-mini" aria-label="Primary">
      <a class="pill" href="${escapeHtmlAttr(playStoreLink)}">Get the app</a>
    </nav>
  </header>
  <main class="sheet-main sheet-main-compact" id="content">
    <p class="eyebrow">Shared from Rveel</p>
    <h1 class="sheet-headline">${pageHeadlineHtml}</h1>
    <p class="context sr-reading">${heroTaglineHtml}. ${heroViralHtml}</p>

    <article class="teaser-card" aria-label="Teaser for ${escapeHtmlAttr(productNamePlain)} \u2014 reading only in the app">
      <div class="story-head">
        <img src="/logo-light.svg" alt="Rveel" height="24">
        <span>Shared product</span>
      </div>

      <div class="teaser-identity">
        <div class="story-photo teaser-photo">${photoHtml}</div>
        <div>
          ${brandLine}
          <h2 class="story-title">${productNameHtml}</h2>
          <p class="story-barcode">Barcode ${barcodeHtml}</p>
        </div>
      </div>

      <div class="teaser-veil" aria-hidden="true">
        <div class="teaser-blur-grid">
          <span class="tb body"></span>
          <span class="tb planet"></span>
          <span class="tb claims"></span>
          <span class="tb open"></span>
          <span class="tb-disc"></span>
        </div>
        <div class="teaser-frost">
          <strong>Reading locked</strong>
          <span>Scores and details stay in the app \u2014 this page is only a teaser.</span>
        </div>
      </div>
    </article>

    <p class="teaser-promise">${escapeHtmlText(SHARED_PRODUCT_READING)}</p>

    <div class="cta-stack">
      <a class="btn btn-green btn-block btn-glow" id="openApp" href="${escapeHtmlAttr(deepLink)}">Open this product in Rveel</a>
      ${storeButtons}
    </div>
    <p class="teaser-fine">Already have Rveel? We\u2019ll open this exact barcode. If not, grab the app and scan with confidence.</p>
  </main>
  <footer class="site-footer">
    <div>
      <span>Rveel</span>
      <span class="sha-chip">teaser only</span>
    </div>
    <nav aria-label="Legal">
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
      <a href="/">About</a>
    </nav>
  </footer>
  <div class="overlay" id="loadingOverlay">
    <div class="spinner" aria-hidden="true"></div>
    <div>Opening this product in Rveel\u2026</div>
  </div>
  <script>
    const barcode = ${JSON.stringify(barcode)};
    const deepLink = ${JSON.stringify(deepLink)};
    const playStoreLink = ${JSON.stringify(playStoreLink)};
    const appStoreLink = ${JSON.stringify(appStoreLink)};
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    const overlay = document.getElementById('loadingOverlay');
    const openBtn = document.getElementById('openApp');
    let triedAuto = false;

    function showOpening() {
      if (!overlay) return;
      overlay.style.display = 'flex';
    }
    function hideOpening() {
      if (!overlay) return;
      overlay.style.display = 'none';
    }

    function openInApp(fromAuto) {
      if (!isIOS && !isAndroid) {
        if (!fromAuto && openBtn) {
          const note = document.createElement('p');
          note.className = 'meta';
          note.textContent = 'Rveel is a phone app. Open this link on your phone to jump straight to the product, or install it below.';
          openBtn.insertAdjacentElement('afterend', note);
        }
        return;
      }
      showOpening();
      if (isAndroid) {
        const intentUrl = 'intent://barcode/' + encodeURIComponent(barcode) + '#Intent;scheme=truescan;package=com.truescan.foodscanner;S.browser_fallback_url=' + encodeURIComponent(playStoreLink) + ';end';
        window.location.href = intentUrl;
        setTimeout(function () {
          if (!document.hidden && !fromAuto) window.location.href = playStoreLink;
          else if (!document.hidden) hideOpening();
        }, fromAuto ? 1400 : 1800);
        return;
      }
      window.location.href = deepLink;
      setTimeout(function () {
        if (!document.hidden && !fromAuto && appStoreLink) window.location.href = appStoreLink;
        else hideOpening();
      }, fromAuto ? 1400 : 1800);
    }

    if (openBtn) {
      openBtn.addEventListener('click', function (event) {
        event.preventDefault();
        openInApp(false);
      });
    }

    // Mobile: try the exact product deep link first so installed apps skip the teaser.
    if ((isIOS || isAndroid) && !triedAuto) {
      triedAuto = true;
      setTimeout(function () { openInApp(true); }, 350);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) hideOpening();
    });
  </script>
</body>
</html>`;
}
export {
  renderShareLandingHtml
};
