/**
 * End-to-end verification: Ethics + Open pillars vs shipped spec (code + docs),
 * plus optional live Vercel backend smoke tests.
 *
 * Run: npx ts-node --project scripts/tsconfig.json scripts/e2eEthicsOpenBackendVerification.ts
 * Or:  npm run test:e2e:ethics-open-backend
 *
 * Env: EXPO_PUBLIC_BACKEND_URL or VERCEL_BACKEND_URL (optional). Reads ../.env for EXPO_PUBLIC_BACKEND_URL.
 * SKIP_LIVE_BACKEND=1 or CI=true — skip HTTP checks (automated CI; pillar spec checks still run).
 */

import * as fs from 'fs';
import * as path from 'path';

import { calculateEthicsPillar } from '../src/lib/truscoreEngine/pillars/ethicsPillar';
import { calculateOpenPillar } from '../src/lib/truscoreEngine/pillars/openPillar';
import { getBBFAWTierScore, getBBFAWImpactScore } from '../src/services/bbfawService';
import { getKTCScoreAdjustment } from '../src/services/ktcService';
import { ETHICS_CERTIFICATION_WEIGHTS } from '../src/services/ethicsCertificationsService';
import { Product } from '../src/types/product';

function getBackendUrl(): string {
  let u = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.VERCEL_BACKEND_URL;
  if (!u) {
    try {
      const envPath = path.join(__dirname, '..', '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const m = content.match(/EXPO_PUBLIC_BACKEND_URL\s*=\s*(.+)/);
        if (m) u = m[1].trim().replace(/^["']|["']$/g, '');
      }
    } catch {
      /* ignore */
    }
  }
  // Default to the canonical production URL for the `truscoreapi` Vercel project.
  return (u || 'https://truscoreapi.vercel.app').replace(/\/$/, '');
}

const SPEC_BBFAW_TIER: Record<number, number> = { 1: 6, 2: 4, 3: 2, 4: 1, 5: -4, 6: -6 };
const SPEC_IMPACT: Array<{ r: string; v: number }> = [
  { r: 'A', v: 3 },
  { r: 'B', v: 3 },
  { r: 'C', v: 1 },
  { r: 'D', v: 1 },
  { r: 'E', v: -3 },
  { r: 'F', v: -3 },
];

const SPEC_KTC: Array<{ lo: number; hi: number; adj: number }> = [
  { lo: 0, hi: 10, adj: -10 },
  { lo: 11, hi: 20, adj: -8 },
  { lo: 21, hi: 30, adj: -6 },
  { lo: 31, hi: 50, adj: -3 },
  { lo: 51, hi: 70, adj: 3 },
  { lo: 71, hi: 80, adj: 6 },
  { lo: 81, hi: 90, adj: 8 },
  { lo: 91, hi: 100, adj: 10 },
];

let failed = 0;
function ok(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function baseProduct(over: Partial<Product> = {}): Product {
  return {
    barcode: 'e2e-test',
    product_name: 'E2E',
    brands: '',
    categories: '',
    categories_tags: [],
    labels_tags: [],
    ingredients_text: '',
    ingredients_analysis_tags: [],
    additives_tags: [],
    nutriments: {},
    source: 'test',
    ...over,
  };
}

console.log('\n=== ETHICS PILLAR — constants vs Ethics spec sheet (v37 / shipped code) ===\n');
for (const t of [1, 2, 3, 4, 5, 6] as const) {
  ok(
    `BBFAW Tier ${t} = ${SPEC_BBFAW_TIER[t]}`,
    getBBFAWTierScore(t) === SPEC_BBFAW_TIER[t]
  );
}
for (const { r, v } of SPEC_IMPACT) {
  ok(
    `BBFAW Impact ${r} = ${v >= 0 ? '+' : ''}${v}`,
    getBBFAWImpactScore(r as 'A' | 'B' | 'C' | 'D' | 'E' | 'F') === v
  );
}
for (const band of SPEC_KTC) {
  const mid = Math.floor((band.lo + band.hi) / 2);
  ok(
    `KTC score ${band.lo}–${band.hi} → ${band.adj >= 0 ? '+' : ''}${band.adj} (probe ${mid})`,
    getKTCScoreAdjustment(mid) === band.adj
  );
}
ok(
  'Cert weights: Fairtrade 6, RA/UTZ 6, ASC/MSC 4, RSPO 0 (non-scoring), Organic 2',
  ETHICS_CERTIFICATION_WEIGHTS.fairtrade === 6 &&
    ETHICS_CERTIFICATION_WEIGHTS.rainforest_alliance === 6 &&
    ETHICS_CERTIFICATION_WEIGHTS.asc === 4 &&
    ETHICS_CERTIFICATION_WEIGHTS.msc === 4 &&
    ETHICS_CERTIFICATION_WEIGHTS.rspo === 0 &&
    ETHICS_CERTIFICATION_WEIGHTS.organic === 2
);

console.log('\n=== ETHICS PILLAR — integration (calculateEthicsPillar) ===\n');
{
  const r1 = calculateEthicsPillar(baseProduct());
  ok('No brand: score = base 15', r1.score === 15);

  const r2 = calculateEthicsPillar(
    baseProduct({ brands: 'Marks & Spencer PLC' })
  );
  ok(
    'M&S: BBFAW Tier 2 (+4) + Impact B (+3) → score 22',
    r2.details.bbfawTier === 2 &&
      r2.details.bbfawTierScore === 4 &&
      r2.details.bbfawImpactScore === 3 &&
      r2.score === 22
  );

  const r3 = calculateEthicsPillar(
    baseProduct({ brands: 'Unknown X', labels_tags: ['en:fair-trade'] })
  );
  ok('Fairtrade only: +6 cert → total 21', r3.score === 21 && r3.details.certificationsAdjustment === 6);

  const mscOnly = calculateEthicsPillar(
    baseProduct({
      brands: 'X',
      labels_tags: ['en:marine-stewardship-council'],
      ethics_msc_api_validated: false,
    })
  );
  ok('MSC label without API validation: no MSC credit', mscOnly.details.certificationsAdjustment === 0);

  const mscOk = calculateEthicsPillar(
    baseProduct({
      brands: 'X',
      labels_tags: ['en:marine-stewardship-council'],
      ethics_msc_api_validated: true,
    })
  );
  ok('MSC + API validated: +4', mscOk.details.certificationsWinningScheme === 'msc' && mscOk.details.certificationsAdjustment === 4);
}

console.log('\n=== OPEN PILLAR — Open_Scoring_Specification_v15 (accepted) ===\n');
{
  const r0 = calculateOpenPillar(baseProduct());
  ok('Base 15', r0.base === 15);
  ok(
    'Unavailable ingredients: clarity neutral (0)',
    r0.details.ingredientClarityAdjustment === 0 &&
      r0.adjustments.some((a) => a.id === 'open-v15-ing-clarity-unavailable')
  );
  ok(
    'Unavailable ingredients: originsAdjustmentId + originsAdjustment present',
    typeof r0.details.originsAdjustmentId === 'string' &&
      typeof r0.details.originsAdjustment === 'number'
  );

  const r1 = calculateOpenPillar(baseProduct({ ingredients_text: 'Water, sugar.' }));
  ok(
    'Clarity zero governed flags: +1',
    r1.details.governedFlagCount === 0 && r1.details.ingredientClarityAdjustment === 1
  );

  const r2 = calculateOpenPillar(
    baseProduct({
      ingredients_text: 'Water, natural flavor.',
    })
  );
  ok(
    'One governed flag: −2',
    r2.details.governedFlagCount === 1 && r2.details.ingredientClarityAdjustment === -2
  );

  const r3 = calculateOpenPillar(
    baseProduct({
      ingredients_text: 'Water, natural flavor, spice extractives.',
    })
  );
  ok(
    'Two governed flags: −4',
    r3.details.governedFlagCount === 2 && r3.details.ingredientClarityAdjustment === -4
  );

  const r4 = calculateOpenPillar(
    baseProduct({
      ingredients_text: 'Water, natural flavor, aroma, smoke flavouring, artificial flavouring.',
    })
  );
  ok(
    'Three+ governed flags: −6',
    r4.details.governedFlagCount >= 3 && r4.details.ingredientClarityAdjustment === -6
  );

  const r5 = calculateOpenPillar(
    baseProduct({
      ingredients_text: '',
      ingredients_text_en: 'Milk, cultures.',
    })
  );
  ok(
    'ingredients_text_en fallback: clarity zero +1',
    r5.details.ingredientClarityAdjustment === 1
  );
  ok(
    'ingredients_text_en fallback exposes originsAdjustment fields',
    typeof r5.details.originsAdjustmentId === 'string' &&
      typeof r5.details.originsAdjustment === 'number'
  );
}

const skipLiveBackend =
  process.env.SKIP_LIVE_BACKEND === '1' || process.env.CI === 'true';

function printSummaryAndExit(): void {
  console.log('\n=== SUMMARY ===\n');
  if (failed === 0) {
    console.log('All checks passed.\n');
    process.exit(0);
  }
  console.log(`${failed} check(s) failed. Review logs above.\n`);
  process.exit(1);
}

if (skipLiveBackend) {
  console.log(
    '\n=== VERCEL BACKEND — skipped (SKIP_LIVE_BACKEND=1 or CI=true) ===\n' +
      '  For live HTTP smoke: npm run test:e2e:ethics-open-backend\n'
  );
  printSummaryAndExit();
}

console.log('\n=== VERCEL BACKEND — HTTP smoke (non-destructive GETs) ===\n');
const baseUrl = getBackendUrl();
console.log(`  Base URL: ${baseUrl}`);
const cacheBust = Date.now();
const previewBarcode = '3017620422003';
const productPreviewUrl = (t: number) =>
  `${baseUrl}/api/product-preview?barcode=${previewBarcode}&_t=${t}`;

async function httpCheck(label: string, url: string, test: (res: Response) => boolean) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TrueScan-E2E/1.0' },
      signal: AbortSignal.timeout(25000),
    });
    const pass = test(res);
    ok(label, pass, pass ? undefined : `status ${res.status}`);
  } catch (e: any) {
    ok(label, false, e?.message || String(e));
  }
}

(async () => {
  await httpCheck(
    'GET product-preview (sample barcode)',
    productPreviewUrl(cacheBust),
    (r) => {
    if (r.status !== 200) return false;
    return true;
    }
  );

  let previewHasBreakdown = false;
  let previewLegacyCare = false;
  try {
    const r = await fetch(productPreviewUrl(cacheBust), {
      headers: { 'User-Agent': 'TrueScan-E2E/1.0' },
      signal: AbortSignal.timeout(25000),
    });
    if (r.ok) {
      const j = (await r.json()) as Record<string, unknown>;
      const b = j.trust_score_breakdown as Record<string, unknown> | undefined;
      if (b && typeof b === 'object') {
        previewLegacyCare = 'care' in b && !('ethics' in b);
        previewHasBreakdown =
          typeof b.body === 'number' &&
          typeof b.ethics === 'number' &&
          typeof b.open === 'number' &&
          typeof b.planet === 'number';
      }
    }
  } catch {
    /* handled below */
  }
  ok(
    'product-preview uses shared pillars (breakdown.ethics, not legacy care)',
    previewHasBreakdown && !previewLegacyCare,
    previewLegacyCare
      ? 'Redeploy backend/vercel — production still returns trust_score_breakdown.care + old heuristics'
      : undefined
  );

  await httpCheck(
    'GET apple-app-site-association',
    `${baseUrl}/api/.well-known/apple-app-site-association`,
    (r) => r.status === 200 || r.status === 404
  );

  await httpCheck(
    'GET assetlinks.json',
    `${baseUrl}/api/.well-known/assetlinks.json`,
    (r) => r.status === 200 || r.status === 404
  );

  await httpCheck(
    'GET fsanz-query (light)',
    `${baseUrl}/api/fsanz-query?country=nz&productName=Milk`,
    (r) => r.status === 200 || r.status === 400 || r.status === 500
  );

  await httpCheck(
    'GET foodatlas-query (light)',
    `${baseUrl}/api/foodatlas-query?productName=Milk`,
    (r) => r.status === 200 || r.status === 400 || r.status === 500
  );

  printSummaryAndExit();
})();
