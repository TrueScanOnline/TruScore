/**
 * Offline Nutri-Score 2023 + Whole Produce shadow validation runner.
 *
 * Usage (repo root):
 *   npx ts-node --project scripts/tsconfig.json scripts/bodyShadow/runNutriScore2023Validation.ts
 *
 * Does NOT modify production scoring paths.
 */

import fs from 'fs';
import path from 'path';
import { evaluateBodyShadowRow, BODY_SHADOW_MODULE_VERSION, METHODOLOGY_SOURCES } from '../../src/lib/truscoreEngine/bodyShadow';
import type { Product } from '../../src/types/product';

const USER_AGENT = 'Rveel/1.0.0';
const OFF_FIELDS =
  'product_name,nutriments,nutriscore,categories_tags,ingredients_text,nova_group,nutriscore_grade,nutrition_grades_tags';

function readCsvGtins(filePath: string): string[] {
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(',')[0]?.trim())
    .filter(Boolean) as string[];
}

function loadCohortGtins(): { name: string; gtins: string[] }[] {
  const root = path.resolve(__dirname, '../..');
  const auGolden = readCsvGtins(path.join(root, 'docs/phase4/golden-barcode-pack-au.csv'));
  const nzGolden = readCsvGtins(path.join(root, 'docs/phase4/golden-barcode-pack-nz.csv'));
  const mandatory = ['9300617300793', '93541121', '9300617064879'];
  const gtin35 = [...new Set([...auGolden, ...nzGolden, ...mandatory])];
  return [
    { name: 'golden_au_core', gtins: auGolden },
    { name: 'golden_nz_core', gtins: nzGolden },
    { name: 'gtin35_regression', gtins: gtin35 },
  ];
}

async function fetchOffProduct(gtin: string, attempts = 4): Promise<Product | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${gtin}.json?fields=${OFF_FIELDS}`;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (res.status === 429) {
        await sleep(2000 * (i + 1));
        continue;
      }
      if (!res.ok) return null;
      const json = (await res.json()) as { product?: Product; status?: number };
      if (!json.product) return null;
      return { ...json.product, barcode: gtin };
    } catch {
      await sleep(1000 * (i + 1));
    }
  }
  return null;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const cohorts = loadCohortGtins();
  const allGtins = [...new Set(cohorts.flatMap((c) => c.gtins))];
  const rows = [];

  console.log(`Body shadow validation ${BODY_SHADOW_MODULE_VERSION}`);
  console.log(`Cohort counts: ${cohorts.map((c) => `${c.name}=${c.gtins.length}`).join(', ')}`);
  console.log(`Unique GTINs to fetch: ${allGtins.length}`);

  for (const gtin of allGtins) {
    const product = await fetchOffProduct(gtin);
    if (!product) {
      rows.push({ gtin, error: 'off_fetch_failed' });
    } else {
      rows.push(evaluateBodyShadowRow(product));
    }
    await sleep(900);
  }

  const valid = rows.filter((r) => !('error' in r));
  const withOffGrade = valid.filter((r) => r.offGrade);
  const comparable = withOffGrade.filter((r) => r.localGrade);
  const exactMatches = comparable.filter((r) => r.exactMatch);
  const disagreements = comparable.filter((r) => r.exactMatch === false);
  const localRecovered = valid.filter((r) => r.classification === 'LOCAL_COMPLETE_INPUT_GRADE_RECOVERED');
  const boundsRecovered = valid.filter((r) => r.classification === 'BOUNDS_INVARIANT_GRADE');
  const wholeProduce = valid.filter((r) => r.wholeProduceCandidate);
  const unresolved = valid.filter((r) => r.classification === 'INSUFFICIENT_DETERMINISTIC_EVIDENCE');
  const notApplicable = valid.filter((r) => r.classification === 'NUTRISCORE_NOT_APPLICABLE');

  const summary = {
    generated_at: new Date().toISOString(),
    module_version: BODY_SHADOW_MODULE_VERSION,
    methodology_sources: METHODOLOGY_SOURCES,
    production_scoring_unchanged: true,
    retired_calculator_not_used: true,
    cohorts: cohorts.map((c) => ({ name: c.name, count: c.gtins.length })),
    totals: {
      fetched: rows.length,
      fetch_failed: rows.length - valid.length,
      with_off_grade: withOffGrade.length,
      local_calculated_comparable: comparable.length,
      exact_matches: exactMatches.length,
      disagreements: disagreements.length,
      exact_match_pct_among_comparable:
        comparable.length > 0 ? Math.round((exactMatches.length / comparable.length) * 1000) / 10 : null,
      local_complete_recovered: localRecovered.length,
      bounds_invariant_recovered: boundsRecovered.length,
      insufficient_evidence: unresolved.length,
      not_applicable: notApplicable.length,
      whole_produce_candidates: wholeProduce.length,
    },
    mandatory_regressions: {
      sour_patch_kids_9300617300793: rows.find((r) => r.gtin === '9300617300793') ?? null,
      driscolls_raspberries_93541121: rows.find((r) => r.gtin === '93541121') ?? null,
    },
    disagreements,
    local_recovered: localRecovered,
    bounds_recovered: boundsRecovered,
    whole_produce_candidates: wholeProduce,
    rows,
  };

  const outDir = path.join(path.resolve(__dirname, '../..'), 'reports', 'bodyShadow');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'nutriScore2023_shadow_validation_20260830.json');
  fs.writeFileSync(outFile, JSON.stringify(summary, null, 2));
  console.log(`Wrote ${outFile}`);
  console.log(JSON.stringify(summary.totals, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
