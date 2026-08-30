/**
 * Missing-grade cohort: strict vs OFF-aligned unavailable-fibre shadow mode.
 *
 * Usage: npx ts-node --project scripts/tsconfig.json scripts/bodyShadow/runMissingGradeFibreModeValidation.ts
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { Product } from '../../src/types/product';
import {
  evaluateLocalNutriScoreFromOffProduct,
  mapOffProductToNutriScore2023Inputs,
  offGradeForComparison,
  OFF_FIBRE_UNAVAILABLE_ZERO_POINTS,
  buildOffInputTrace,
} from '../../src/lib/truscoreEngine/bodyShadow/nutriScore2023/offEvidenceMapper';

const USER_AGENT = 'Rveel/1.0.0';
const OFF_INSPECT_FIELDS =
  'product_name,nutriments,nutriscore,nutriscore_grade,nutrition_grades_tags,misc_tags,categories_tags,ingredients_text,nova_group';

type RowResult = {
  gtin: string;
  productName: string | null;
  strictComplete: boolean;
  strictGrade: string | null;
  fibreModeComplete: boolean;
  fibreModeGrade: string | null;
  fibreModePath: string | null;
  offGrade: string | null;
  offGradeReferenceSource: string | null;
  exactMatchVsOffReference: boolean | null;
  incrementalFromFibreMode: boolean;
  fibreOnlyGapStrict: boolean;
  stillUnresolvedReason: string | null;
  branch: string | null;
  fibreG: number | null;
};

function loadCache(): Record<string, Product> {
  const cachePath = path.join(
    path.resolve(__dirname, '../..'),
    'reports/bodyShadow/off_evidence_cache.json'
  );
  return JSON.parse(fs.readFileSync(cachePath, 'utf8')) as Record<string, Product>;
}

function loadMissingGradeGtinsFromPriorValidation(): string[] {
  const reportPath = path.join(
    path.resolve(__dirname, '../..'),
    'reports/bodyShadow/nutriScore2023_shadow_validation_complete_20260830.json'
  );
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
    rows: Array<{ gtin: string; offGrade: string | null; fetchSource?: string }>;
  };
  return report.rows
    .filter((r) => r.fetchSource !== 'failed' && !r.offGrade)
    .map((r) => r.gtin);
}

function fibreOnlyGap(product: Product): boolean {
  const mapped = mapOffProductToNutriScore2023Inputs(product);
  if (!mapped.inputs) return false;
  const i = mapped.inputs;
  const fibreMissing = i.fibreG === null || !Number.isFinite(i.fibreG);
  if (!fibreMissing) return false;
  const adverse = [i.energyKj, i.saturatedFatG, i.sugarsG, i.saltG, i.proteinG];
  if (i.branch === 'fats_oils_nuts_seeds') adverse.push(i.totalFatG);
  if (i.branch === 'beverages') {
    return (
      adverse.every((v) => v !== null && Number.isFinite(v)) &&
      i.nonNutritiveSweetenersPresent !== null &&
      i.fvlPercent !== null
    );
  }
  return adverse.every((v) => v !== null && Number.isFinite(v)) && i.fvlPercent !== null;
}

async function fetchOffProduct(gtin: string): Promise<Product | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${gtin}.json?fields=${OFF_INSPECT_FIELDS}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const json = (await res.json()) as { product?: Product };
    return json.product ? { ...json.product, barcode: gtin } : null;
  } catch {
    return null;
  }
}

function extractOffNutriStatus(product: Product) {
  const ns = (product as Product & { nutriscore?: Record<string, unknown> }).nutriscore;
  const ns2023 = ns?.['2023'] as Record<string, unknown> | undefined;
  return {
    nutriscore_grade: product.nutriscore_grade ?? null,
    nutrition_grades_tags: product.nutrition_grades_tags ?? null,
    misc_tags: (product as Product & { misc_tags?: string[] }).misc_tags ?? null,
    nutriscore_2023: ns2023
      ? {
          grade: ns2023.grade,
          score: ns2023.score,
          nutriscore_computed: ns2023.nutriscore_computed,
          nutriscore_applicable: ns2023.nutriscore_applicable,
          nutrients_available: ns2023.nutrients_available,
          category_available: ns2023.category_available,
          data: ns2023.data,
        }
      : null,
  };
}

async function main() {
  const cache = loadCache();
  const gtins = loadMissingGradeGtinsFromPriorValidation();
  const rows: RowResult[] = [];

  for (const gtin of gtins) {
    const product = cache[gtin];
    if (!product) continue;

    const strict = evaluateLocalNutriScoreFromOffProduct(product);
    const fibreMode = evaluateLocalNutriScoreFromOffProduct(product, OFF_FIBRE_UNAVAILABLE_ZERO_POINTS);
    const mapped = mapOffProductToNutriScore2023Inputs(product);

    const strictComplete = strict.completeOutcome?.kind === 'calculated';
    const fibreComplete = fibreMode.completeOutcome?.kind === 'calculated';
    const incremental =
      !strictComplete && fibreComplete && fibreOnlyGap(product);

    let offRef = offGradeForComparison(product);
    let offRefSource: string | null = offRef ? 'current_off_payload' : null;

    rows.push({
      gtin,
      productName: product.product_name ?? product.product_name_en ?? null,
      strictComplete,
      strictGrade:
        strict.completeOutcome?.kind === 'calculated' ? strict.completeOutcome.grade : null,
      fibreModeComplete: fibreComplete,
      fibreModeGrade:
        fibreMode.completeOutcome?.kind === 'calculated' ? fibreMode.completeOutcome.grade : null,
      fibreModePath:
        fibreMode.completeOutcome?.kind === 'calculated' ? fibreMode.completeOutcome.path : null,
      offGrade: offRef,
      offGradeReferenceSource: offRefSource,
      exactMatchVsOffReference:
        offRef && fibreComplete && fibreMode.completeOutcome?.kind === 'calculated'
          ? offRef === fibreMode.completeOutcome.grade
          : null,
      incrementalFromFibreMode: incremental,
      fibreOnlyGapStrict: fibreOnlyGap(product),
      stillUnresolvedReason: fibreComplete
        ? null
        : fibreMode.completeOutcome?.kind === 'unresolved'
          ? fibreMode.completeOutcome.reason
          : strict.unresolvedReason ?? 'not_applicable_or_other',
      branch: mapped.inputs?.branch ?? null,
      fibreG: mapped.inputs?.fibreG ?? null,
    });
  }

  const priorStrictRecoveries = rows.filter((r) => r.strictComplete).length;
  const incrementalRecoveries = rows.filter((r) => r.incrementalFromFibreMode);
  const stillUnresolved = rows.filter((r) => !r.fibreModeComplete);

  const inspectGtins = ['9300617300793', '9336318000113'];
  const offInspections: Record<string, unknown> = {};
  for (const gtin of inspectGtins) {
    const live = await fetchOffProduct(gtin);
    const cached = cache[gtin];
    const product = live ?? cached ?? null;
    offInspections[gtin] = {
      source: live ? 'live_off' : cached ? 'cache' : 'not_found',
      off_nutri_status: product ? extractOffNutriStatus(product) : null,
      strict: product ? evaluateLocalNutriScoreFromOffProduct(product) : null,
      fibre_mode: product
        ? evaluateLocalNutriScoreFromOffProduct(product, OFF_FIBRE_UNAVAILABLE_ZERO_POINTS)
        : null,
      input_trace: product ? buildOffInputTrace(product) : null,
    };
  }

  const head = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

  const report = {
    generated_at: new Date().toISOString(),
    git_sha: head,
    mode: 'missing_grade_fibre_unavailable_zero_points_shadow',
    methodology_note:
      'Fibre unavailable → 0 favourable fibre points (OFF-aligned shadow mode). Does not coerce fibreG to 0 g/100g. Adverse nutrients remain fail-closed.',
    cohort: {
      denominator: gtins.length,
      evaluated: rows.length,
      source: 'missing_off_grade rows from nutriScore2023_shadow_validation_complete_20260830.json',
    },
    summary: {
      prior_strict_complete_input_recoveries: priorStrictRecoveries,
      fibre_mode_complete_input_recoveries: rows.filter((r) => r.fibreModeComplete).length,
      additional_recoveries_solely_from_fibre_mode: incrementalRecoveries.length,
      exact_matches_vs_off_reference_where_available: rows.filter(
        (r) => r.exactMatchVsOffReference === true
      ).length,
      still_unresolved_fibre_mode: stillUnresolved.length,
    },
    incremental_recoveries: incrementalRecoveries,
    fibre_mode_grades_recovered: rows
      .filter((r) => r.fibreModeComplete)
      .map((r) => ({
        gtin: r.gtin,
        productName: r.productName,
        grade: r.fibreModeGrade,
        path: r.fibreModePath,
        incremental: r.incrementalFromFibreMode,
        offReference: r.offGrade,
        exactMatch: r.exactMatchVsOffReference,
      })),
    still_unresolved: stillUnresolved.map((r) => ({
      gtin: r.gtin,
      productName: r.productName,
      reason: r.stillUnresolvedReason,
      fibreOnlyWasGap: r.fibreOnlyGapStrict,
      branch: r.branch,
    })),
    off_nutri_inspections: offInspections,
    rows,
  };

  const outDir = path.join(path.resolve(__dirname, '../..'), 'reports/bodyShadow');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'missing_grade_fibre_mode_validation_20260830.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`Wrote ${outFile}`);
  console.log(JSON.stringify(report.summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
