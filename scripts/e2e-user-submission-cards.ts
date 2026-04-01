/**
 * End-to-end: user submission cards vs live Vercel backend.
 *
 * Vercel manual-products stores ONLY proprietary fields (country + certifications).
 * Core product fields (ingredients, nutrition, etc.) go to Open Food Facts from the app — not asserted here.
 *
 *   1) Ingredients ignored on Vercel → POST with ingredients_text, GET must not return it
 *   2) Nutrition ignored on Vercel   → POST nutriments, GET must not return them
 *   3) Certifications                 → POST labels_tags, GET recall
 *   4) Hero image                     → POST /api/upload-photo, GET manual-products photo merge
 *   5) Country of mfg                 → POST /api/manufacturing-country, GET recall
 *   6) Cumulative proprietary merge   → country + labels POSTs, GET has both (ingredients POST ignored)
 *
 * Barcodes are numeric 13-digit (valid for app result screen) and <= 20 chars for Postgres.
 *
 * Usage:
 *   yarn test:e2e:user-submission-cards
 *   EXPO_PUBLIC_BACKEND_URL=https://your.preview.url yarn test:e2e:user-submission-cards
 */

import * as fs from 'fs';
import * as path from 'path';

const TIMEOUT_MS = 30000;
const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function getBackendUrl(): string {
  let backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    try {
      const envPath = path.join(__dirname, '..', '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/EXPO_PUBLIC_BACKEND_URL=(.+)/);
        if (match) backendUrl = match[1].trim();
      }
    } catch {
      /* ignore */
    }
  }
  return backendUrl || 'https://truscoreapi.vercel.app';
}

function endpoints(base: string) {
  return {
    manualProducts: `${base}/api/manual-products`,
    uploadPhoto: `${base}/api/upload-photo`,
    manufacturingCountry: `${base}/api/manufacturing-country`,
  };
}

/** 13-digit numeric barcode, unique per seed (app result regex 8–14 digits). */
function makeBarcode(seed: number): string {
  const t = Date.now() + seed * 997;
  const tail = String(t).replace(/\D/g, '').slice(-12).padStart(12, '0');
  return `9${tail}`.slice(0, 13);
}

async function fetchJson(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<{ ok: boolean; status: number; data: any; text: string }> {
  const timeoutMs = init.timeoutMs ?? TIMEOUT_MS;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { _raw: text };
    }
    return { ok: res.ok, status: res.status, data, text };
  } finally {
    clearTimeout(id);
  }
}

interface CaseResult {
  name: string;
  ok: boolean;
  detail: string;
}

async function postManual(
  api: string,
  barcode: string,
  productData: Record<string, unknown>
): Promise<{ ok: boolean; detail: string }> {
  const { ok, status, data } = await fetchJson(api, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ barcode, productData }),
  });
  if (!ok || data?.success === false) {
    return { ok: false, detail: `POST manual-products ${status}: ${JSON.stringify(data).slice(0, 400)}` };
  }
  return { ok: true, detail: 'POST ok' };
}

async function getManual(
  api: string,
  barcode: string
): Promise<{ ok: boolean; product: Record<string, unknown> | null; detail: string }> {
  const { ok, status, data } = await fetchJson(`${api}?barcode=${encodeURIComponent(barcode)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!ok) {
    return { ok: false, product: null, detail: `GET ${status}: ${JSON.stringify(data).slice(0, 400)}` };
  }
  const product = data?.product;
  if (!product || typeof product !== 'object') {
    return {
      ok: false,
      product: null,
      detail: `No product in response: ${JSON.stringify(data).slice(0, 400)}`,
    };
  }
  return { ok: true, product: product as Record<string, unknown>, detail: 'GET ok' };
}

async function runAll(base: string): Promise<CaseResult[]> {
  const api = endpoints(base);
  const results: CaseResult[] = [];

  const push = (name: string, ok: boolean, detail: string) => results.push({ name, ok, detail });

  // --- 1) Core fields must NOT be stored on Vercel (ingredients) ---
  {
    const barcode = makeBarcode(1);
    const marker = `e2e_ingredients_${Date.now()}`;
    let r = await postManual(api.manualProducts, barcode, {
      product_name: 'E2E should not persist on Vercel',
      ingredients_text: marker,
    });
    if (!r.ok) {
      push('1) Non-proprietary — submit', false, r.detail);
    } else {
      push('1) Non-proprietary — submit', true, r.detail);
      const g = await getManual(api.manualProducts, barcode);
      if (!g.ok) {
        push('1) Non-proprietary — GET after ingredients POST', false, g.detail);
      } else {
        const ing = String(g.product?.ingredients_text || '');
        const leaked = ing.includes(marker);
        push(
          '1) Non-proprietary — ingredients not on Vercel',
          !leaked && !ing,
          !leaked
            ? 'ingredients_text not returned from manual-products (expected)'
            : `Vercel leaked ingredients: ${ing.slice(0, 120)}`
        );
      }
    }
  }

  // --- 2) Core fields must NOT be stored on Vercel (nutrition) ---
  {
    const barcode = makeBarcode(2);
    const r = await postManual(api.manualProducts, barcode, {
      product_name: 'E2E nutrition not on Vercel',
      nutriments: {
        'energy-kcal_100g': 222,
        proteins_100g: 6.5,
        fat_100g: 3.25,
      },
    });
    if (!r.ok) {
      push('2) Non-proprietary nutrition — submit', false, r.detail);
    } else {
      push('2) Non-proprietary nutrition — submit', true, r.detail);
      const g = await getManual(api.manualProducts, barcode);
      const n = g.product?.nutriments as Record<string, number> | undefined;
      const noNut = !n || Object.keys(n).length === 0;
      push(
        '2) Non-proprietary — nutriments not on Vercel',
        g.ok && !!noNut,
        noNut
          ? 'nutriments absent from GET (expected)'
          : `Vercel leaked nutriments: ${JSON.stringify(n)}`
      );
    }
  }

  // --- 3) Certifications / labels card ---
  {
    const barcode = makeBarcode(3);
    const r = await postManual(api.manualProducts, barcode, {
      product_name: 'E2E Cert Card',
      labels_tags: ['en:organic'],
      labels_hierarchy: ['en:organic'],
    });
    if (!r.ok) {
      push('3) Certifications — submit', false, r.detail);
    } else {
      push('3) Certifications — submit', true, r.detail);
      const g = await getManual(api.manualProducts, barcode);
      const tags = g.product?.labels_tags as string[] | undefined;
      const has = Array.isArray(tags) && tags.some((t) => String(t).toLowerCase() === 'en:organic');
      push(
        '3) Certifications — recall',
        has,
        has ? 'labels_tags contains en:organic' : `labels_tags: ${JSON.stringify(tags)}`
      );
    }
  }

  // --- 4) Hero image (upload + GET manual merge) ---
  {
    const barcode = makeBarcode(4);
    const up = await fetchJson(api.uploadPhoto, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barcode,
        imageType: 'front',
        imageBase64: PNG_1X1_BASE64,
        mimeType: 'image/png',
      }),
    });
    if (!up.ok || !up.data?.success || !up.data?.url) {
      push(
        '4) Hero — upload',
        false,
        `upload-photo ${up.status}: ${JSON.stringify(up.data).slice(0, 400)}`
      );
    } else {
      const url = String(up.data.url);
      const https = url.startsWith('https://');
      push('4) Hero — upload', https, https ? `URL ok` : `Bad url: ${url.slice(0, 80)}`);
      const g = await getManual(api.manualProducts, barcode);
      const img = String(g.product?.image_url || g.product?.image_front_url || '');
      const okImg = img.startsWith('http://') || img.startsWith('https://');
      push(
        '4) Hero — recall (GET manual-products)',
        g.ok && okImg,
        okImg ? `image_url: ${img.slice(0, 72)}…` : `${g.detail} image fields: ${JSON.stringify({ image_url: g.product?.image_url })}`
      );
    }
  }

  // --- 5) Country of manufacture ---
  {
    const barcode = makeBarcode(5);
    const userId = `e2e_script_${Date.now()}`;
    const country = 'E2E Testland';
    const post = await fetchJson(api.manufacturingCountry, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barcode,
        country,
        userId,
        hasImportedIngredients: false,
      }),
    });
    if (!post.ok || post.data?.success === false) {
      push(
        '5) Country — submit',
        false,
        `POST ${post.status}: ${JSON.stringify(post.data).slice(0, 400)}`
      );
    } else {
      push('5) Country — submit', true, 'POST ok');
      const get = await fetchJson(
        `${api.manufacturingCountry}?barcode=${encodeURIComponent(barcode)}`,
        { method: 'GET', headers: { Accept: 'application/json' } }
      );
      const c = get.data?.country;
      const match = get.ok && typeof c === 'string' && c.toUpperCase() === country.toUpperCase();
      push(
        '5) Country — recall',
        !!match,
        match ? `country=${c}` : `GET ${get.status} body: ${JSON.stringify(get.data).slice(0, 300)}`
      );
    }
  }

  // --- 6) Cumulative proprietary merge (ingredients/nutrition POSTs ignored on Vercel) ---
  {
    const barcode = makeBarcode(6);
    const ingMarker = `e2e_merge_ing_${Date.now()}`;
    let step = await postManual(api.manualProducts, barcode, {
      ingredients_text: ingMarker,
      countries: 'E2E Merge Country',
      manufacturing_places: 'E2E Merge Country',
    });
    if (!step.ok) {
      push('6) Merge — step1 country + spurious ingredients', false, step.detail);
    } else {
      step = await postManual(api.manualProducts, barcode, {
        nutriments: { salt_100g: 1.25 },
        labels_tags: ['en:fair-trade'],
        labels_hierarchy: ['en:fair-trade'],
      });
      if (!step.ok) {
        push('6) Merge — step2 labels + spurious nutrition', false, step.detail);
      } else {
        const g = await getManual(api.manualProducts, barcode);
        const ing = String(g.product?.ingredients_text || '');
        const n = g.product?.nutriments as Record<string, number> | undefined;
        const tags = g.product?.labels_tags as string[] | undefined;
        const countries = String(g.product?.countries || '');
        const noIng = !ing.includes(ingMarker) && !ing;
        const noNut = !n || Object.keys(n).length === 0;
        const hasFair = Array.isArray(tags) && tags.some((t) => String(t).toLowerCase().includes('fair'));
        const hasCountry = countries.toLowerCase().includes('e2e merge country');
        const all = g.ok && noIng && noNut && hasFair && hasCountry;
        push(
          '6) Merge — proprietary only on Vercel',
          all,
          all
            ? 'country + fair-trade present; ingredients/nutrition not stored'
            : `ingLeak=${!noIng} nutLeak=${!noNut} fair=${hasFair} country=${hasCountry} ${JSON.stringify(g.product).slice(0, 350)}`
        );
      }
    }
  }

  return results;
}

async function main() {
  const base = getBackendUrl().replace(/\/$/, '');
  console.log('\n=== E2E: User submission cards (live backend) ===\n');
  console.log(`Base URL: ${base}\n`);

  if (base.includes('YOUR-VERCEL-URL')) {
    console.error('Set EXPO_PUBLIC_BACKEND_URL or .env to a real backend URL.');
    process.exit(1);
  }

  const results = await runAll(base);
  let failed = 0;
  for (const r of results) {
    const icon = r.ok ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`   ${r.detail}`);
    if (!r.ok) failed++;
  }

  console.log('\n---');
  console.log(
    failed === 0
      ? `All ${results.length} checks passed.`
      : `${failed} of ${results.length} checks failed.`
  );
  console.log(
    '\nNote: This validates Vercel APIs + persistence + GET recall (same contracts as the app).\n' +
      'Full UI/device testing still requires running the Expo app against this backend.\n'
  );

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
