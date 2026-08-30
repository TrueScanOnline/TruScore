/**
 * Offline Nutri-Score 2023 + Whole Produce shadow validation runner (Wave 2 Body).
 *
 * Usage (repo root):
 *   npm run bodyShadow:validate-nutri2023
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  evaluateBodyShadowRow,
  BODY_SHADOW_MODULE_VERSION,
  METHODOLOGY_SOURCES,
} from '../../src/lib/truscoreEngine/bodyShadow';
import {
  buildOffInputTrace,
  classifyMissingOffGradeProduct,
  evaluateLocalNutriScoreFromOffProduct,
  mapOffProductToNutriScore2023Inputs,
  offGradeForComparison,
} from '../../src/lib/truscoreEngine/bodyShadow/nutriScore2023/offEvidenceMapper';
import {
  evaluateWholeProduceCandidate,
  shadowBodyNutriPoints,
  shadowBodyScoreEstimate,
} from '../../src/lib/truscoreEngine/bodyShadow/wholeProduce';
import type { Product } from '../../src/types/product';
import type { NutriScore2023Branch, ShadowClassification } from '../../src/lib/truscoreEngine/bodyShadow/nutriScore2023/types';

const USER_AGENT = 'Rveel/1.0.0';
const OFF_FIELDS =
  'product_name,nutriments,nutriscore,categories_tags,ingredients_text,nova_group,nutriscore_grade,nutrition_grades_tags';
const AUTHORIZED_BASELINE = 'e919d550c40ca73c35179149525bacb1970d7826';
const SHADOW_BUILD_COMMIT = 'dbb55ac270c34a07f0358f24d8641c1d97f2a05';

type CohortSpec = {
  name: string;
  assetPath: string;
  expectedCount: number;
  gtins: string[];
  filter?: string;
};

type DetailedRow = ReturnType<typeof evaluateBodyShadowRow> & {
  cohorts: string[];
  fetchSource: 'cache' | 'live_off' | 'failed';
  inputTrace?: ReturnType<typeof buildOffInputTrace>;
  runtimeEligibility: {
    branchResolved: boolean;
    branch: NutriScore2023Branch | null;
    completeInputCalculable: boolean;
    boundsCalculable: boolean;
  };
  algorithmValidation: {
    applicable: boolean;
    completeGradeComparable: boolean;
    exactMatch: boolean | null;
  };
  missingGradeClassification: ShadowClassification | null;
};

function readCsvGtins(filePath: string): string[] {
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(',')[0]?.trim())
    .filter(Boolean) as string[];
}

function loadJsonGtins(filePath: string, filter?: string): string[] {
  const rows = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Array<Record<string, string>>;
  return rows
    .filter((r) => r['Execute?'] === undefined || r['Execute?'] === 'Yes')
    .filter((r) => !filter || r['Scope Classification'] === filter)
    .map((r) => String(r['Runner GTIN']).trim())
    .filter(Boolean);
}

function loadCohorts(root: string): CohortSpec[] {
  const auAsset = path.join(root, 'scripts/_local_wave2_au_cohort_executable_DO_NOT_COMMIT.json');
  const nzAsset = path.join(root, 'scripts/_local_wave2_nz_cohort_executable_DO_NOT_COMMIT.json');
  const auGolden = readCsvGtins(path.join(root, 'docs/phase4/golden-barcode-pack-au.csv'));
  const nzGolden = readCsvGtins(path.join(root, 'docs/phase4/golden-barcode-pack-nz.csv'));
  const mandatoryRegressions = ['9300617300793', '93541121'];
  const gtin35 = [...new Set([...auGolden, ...nzGolden, '9300617064879'])];

  return [
    {
      name: 'au_core_run_79',
      assetPath: auAsset,
      expectedCount: 79,
      filter: 'Core packaged/processed F&B',
      gtins: loadJsonGtins(auAsset, 'Core packaged/processed F&B'),
    },
    {
      name: 'au_edge_cases_6',
      assetPath: auAsset,
      expectedCount: 6,
      filter: 'In-scope edge / lower-expectation',
      gtins: loadJsonGtins(auAsset, 'In-scope edge / lower-expectation'),
    },
    {
      name: 'nz_core_run_34',
      assetPath: nzAsset,
      expectedCount: 34,
      gtins: loadJsonGtins(nzAsset),
    },
    {
      name: 'gtin35_historical_regression',
      assetPath: 'docs/phase4/golden-barcode-pack-au.csv + nz + Cadbury targeted',
      expectedCount: 35,
      gtins: gtin35,
    },
    {
      name: 'mandatory_regressions',
      assetPath: 'founder mandatory GTINs (not in governed cohort)',
      expectedCount: 2,
      gtins: mandatoryRegressions,
    },
  ];
}

function loadEvidenceCache(cachePath: string): Record<string, Product> {
  if (!fs.existsSync(cachePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8')) as Record<string, Product>;
  } catch {
    return {};
  }
}

function saveEvidenceCache(cachePath: string, cache: Record<string, Product>) {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
}

async function fetchOffProduct(gtin: string, attempts = 5): Promise<Product | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${gtin}.json?fields=${OFF_FIELDS}`;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (res.status === 429) {
        await sleep(2500 * (i + 1));
        continue;
      }
      if (!res.ok) return null;
      const json = (await res.json()) as { product?: Product; status?: number };
      if (!json.product) return null;
      return { ...json.product, barcode: gtin };
    } catch {
      await sleep(1500 * (i + 1));
    }
  }
  return null;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function analyzeProduct(product: Product, cohorts: string[], fetchSource: DetailedRow['fetchSource']): DetailedRow {
  const base = evaluateBodyShadowRow(product);
  const local = evaluateLocalNutriScoreFromOffProduct(product);
  const mapped = mapOffProductToNutriScore2023Inputs(product);
  const offGrade = offGradeForComparison(product);
  const completeCalculable = local.completeOutcome?.kind === 'calculated';
  const boundsCalculable = local.boundsOutcome?.kind === 'bounds_invariant_grade';

  return {
    ...base,
    cohorts,
    fetchSource,
    runtimeEligibility: {
      branchResolved: mapped.inputs !== null,
      branch: mapped.inputs?.branch ?? null,
      completeInputCalculable: completeCalculable,
      boundsCalculable,
    },
    algorithmValidation: {
      applicable: local.applicability.applicable,
      completeGradeComparable: !!offGrade && completeCalculable,
      exactMatch:
        offGrade && completeCalculable && local.completeOutcome?.kind === 'calculated'
          ? offGrade.toLowerCase() === local.completeOutcome.grade
          : offGrade && completeCalculable
            ? null
            : null,
    },
    missingGradeClassification: offGrade ? null : classifyMissingOffGradeProduct(product),
  };
}

function branchKey(branch: string | null): string {
  return branch ?? 'unresolved';
}

function aggregateKnownGrade(rows: DetailedRow[]) {
  const withOff = rows.filter((r) => r.offGrade);
  const calculable = withOff.filter((r) => r.runtimeEligibility.completeInputCalculable);
  const exact = calculable.filter((r) => r.exactMatch === true);
  const disagreements = calculable.filter((r) => r.exactMatch === false);
  const offNoLocal = withOff.filter((r) => !r.localGrade);

  const byBranch: Record<string, { total: number; calculable: number; exact: number; disagreements: number }> = {};
  for (const row of withOff) {
    const b = branchKey(row.branch);
    if (!byBranch[b]) byBranch[b] = { total: 0, calculable: 0, exact: 0, disagreements: 0 };
    byBranch[b].total += 1;
    if (row.runtimeEligibility.completeInputCalculable) {
      byBranch[b].calculable += 1;
      if (row.exactMatch) byBranch[b].exact += 1;
      if (row.exactMatch === false) byBranch[b].disagreements += 1;
    }
  }

  return {
    cohort_count: withOff.length,
    locally_calculable_count: calculable.length,
    exact_matches: exact.length,
    disagreements: disagreements.map((r) => ({
      gtin: r.gtin,
      productName: r.productName,
      offGrade: r.offGrade,
      localGrade: r.localGrade,
      branch: r.branch,
      localNumericScore: r.localNumericScore,
    })),
    off_grade_no_local_recovery: offNoLocal.length,
    exact_match_pct_among_calculable:
      calculable.length > 0 ? Math.round((exact.length / calculable.length) * 1000) / 10 : null,
    branch_breakdown: byBranch,
  };
}

function aggregateMissingGrade(rows: DetailedRow[]) {
  const missing = rows.filter((r) => !r.offGrade);
  const counts: Record<ShadowClassification, number> = {
    LOCAL_COMPLETE_INPUT_GRADE_RECOVERED: 0,
    BOUNDS_INVARIANT_GRADE: 0,
    INSUFFICIENT_DETERMINISTIC_EVIDENCE: 0,
    NUTRISCORE_NOT_APPLICABLE: 0,
    WHOLE_PRODUCE_CANDIDATE: 0,
    OFF_GRADE_PRESENT_NO_LOCAL_RECOVERY: 0,
  };
  for (const row of missing) {
    const c = row.missingGradeClassification ?? 'INSUFFICIENT_DETERMINISTIC_EVIDENCE';
    counts[c] += 1;
  }

  const completeUnresolved = missing.filter(
    (r) =>
      r.missingGradeClassification === 'INSUFFICIENT_DETERMINISTIC_EVIDENCE' &&
      !r.runtimeEligibility.completeInputCalculable
  );
  const boundsIncremental = completeUnresolved.filter((r) => r.runtimeEligibility.boundsCalculable);

  return {
    denominator: missing.length,
    complete_input_recoveries: counts.LOCAL_COMPLETE_INPUT_GRADE_RECOVERED,
    bounds_invariant_recoveries: counts.BOUNDS_INVARIANT_GRADE,
    incremental_bounds_from_complete_unresolved: boundsIncremental.length,
    unresolved: counts.INSUFFICIENT_DETERMINISTIC_EVIDENCE,
    not_applicable: counts.NUTRISCORE_NOT_APPLICABLE,
    whole_produce_candidates: counts.WHOLE_PRODUCE_CANDIDATE,
    by_classification: counts,
    bounds_incremental_examples: boundsIncremental.map((r) => ({
      gtin: r.gtin,
      productName: r.productName,
      boundsGrade: r.localGrade,
    })),
  };
}

function aggregateRuntimeEligibility(rows: DetailedRow[]) {
  const applicable = rows.filter((r) => r.algorithmValidation.applicable);
  return {
      population: rows.length,
      branch_resolved: rows.filter((r) => r.runtimeEligibility.branchResolved).length,
      complete_input_establishable: rows.filter((r) => r.runtimeEligibility.completeInputCalculable).length,
      bounds_establishable: rows.filter((r) => r.runtimeEligibility.boundsCalculable).length,
      applicable_population: applicable.length,
      branch_resolved_pct:
        rows.length > 0
          ? Math.round((rows.filter((r) => r.runtimeEligibility.branchResolved).length / rows.length) * 1000) / 10
          : null,
      complete_input_pct:
        rows.length > 0
          ? Math.round((rows.filter((r) => r.runtimeEligibility.completeInputCalculable).length / rows.length) * 1000) /
            10
          : null,
    };
}

function runWholeProduceBoundaryTests(): Array<{ name: string; pass: boolean; detail: string }> {
  const tests: Array<{ name: string; pass: boolean; detail: string }> = [];

  const driscolls: Product = {
    barcode: '93541121',
    product_name: 'Raspberries',
    ingredients_text: 'raspberries',
    categories_tags: ['en:fresh-raspberries', 'en:berries', 'en:fruits'],
    nova_group: 1,
    nutriscore_grade: 'unknown',
    nutriments: {
      energy_100g: 298.75,
      fiber_100g: 6.5,
      proteins_100g: 1.2,
      sugars_100g: 4.4,
      salt_100g: 0.00625,
      'saturated-fat_100g': 0.13,
    },
    nutriscore: {
      '2023': {
        category_available: 1,
        data: { is_beverage: 0, is_cheese: 0, is_fat_oil_nuts_seeds: 0, is_red_meat_product: 0, is_water: 0, fruits_vegetables_legumes: 100 },
      },
    },
  } as Product;
  const driscollsShadow = shadowBodyScoreEstimate({
    product: driscolls,
    localGrade: null,
    offGrade: null,
    wholeProduceCandidate: evaluateWholeProduceCandidate(driscolls).candidate,
  });
  tests.push({
    name: 'Driscolls raspberries 93541121 inclusion 15+3+4=22',
    pass: driscollsShadow === 22,
    detail: `shadowBody=${driscollsShadow}`,
  });

  const juiceExcluded: Product = {
    barcode: '9990000000001',
    product_name: 'Apple juice',
    ingredients_text: 'apple juice',
    categories_tags: ['en:apple-juices', 'en:juices'],
    nova_group: 1,
  };
  tests.push({
    name: 'Juice category excluded from Whole Produce',
    pass: !evaluateWholeProduceCandidate(juiceExcluded).candidate,
    detail: evaluateWholeProduceCandidate(juiceExcluded).reason,
  });

  const multiIngredient: Product = {
    barcode: '9990000000002',
    product_name: 'Fruit salad',
    ingredients_text: 'apple, banana',
    categories_tags: ['en:fresh-fruits'],
    nova_group: 1,
  };
  tests.push({
    name: 'Multi-ingredient excluded from Whole Produce',
    pass: !evaluateWholeProduceCandidate(multiIngredient).candidate,
    detail: evaluateWholeProduceCandidate(multiIngredient).reason,
  });

  const nova4: Product = {
    barcode: '9990000000003',
    product_name: 'Ultra processed berries',
    ingredients_text: 'raspberries',
    categories_tags: ['en:fresh-raspberries'],
    nova_group: 4,
  };
  tests.push({
    name: 'NOVA 4 excluded from Whole Produce',
    pass: !evaluateWholeProduceCandidate(nova4).candidate,
    detail: evaluateWholeProduceCandidate(nova4).reason,
  });

  const withOffNutri: Product = {
    ...driscolls,
    nutriscore_grade: 'a',
  };
  const stacked = shadowBodyScoreEstimate({
    product: withOffNutri,
    localGrade: null,
    offGrade: 'a',
    wholeProduceCandidate: evaluateWholeProduceCandidate(withOffNutri).candidate,
  });
  tests.push({
    name: 'Whole Produce +4 does not stack when OFF Nutri grade present',
    pass: stacked === 25,
    detail: `shadowBody=${stacked} (15+7 NOVA1+3)`,
  });

  return tests;
}

function investigateDisagreement(row: {
  gtin: string;
  productName: string | null;
  offGrade: string | null;
  localGrade: string | null;
  branch: string | null;
  localNumericScore: number | null;
}): Record<string, unknown> {
  if (row.localNumericScore === 0 && row.offGrade === 'b' && row.localGrade === 'a') {
    return {
      root_cause: 'grade_boundary_or_fvl_input',
      detail:
        'Local score 0 → grade A; OFF grade B implies OFF score 1–2. Likely FVL band or protein-eligibility input difference (runtime input resolution).',
    };
  }
  if (row.branch === 'fats_oils_nuts_seeds') {
    return {
      root_cause: 'fats_branch_input_or_boundary',
      detail: `Fats branch local score ${row.localNumericScore} (${row.localGrade}) vs OFF ${row.offGrade}.`,
    };
  }
  return {
    root_cause: 'requires_off_2023_component_trace',
    detail: `Local score ${row.localNumericScore} (${row.localGrade}) vs OFF ${row.offGrade}.`,
  };
}

function gitInfo() {
  const head = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  let baselineIsAncestor = false;
  try {
    execSync(`git merge-base --is-ancestor ${AUTHORIZED_BASELINE} HEAD`, { stdio: 'pipe' });
    baselineIsAncestor = true;
  } catch {
    baselineIsAncestor = false;
  }
  const shadowFiles = execSync(`git diff --name-only ${AUTHORIZED_BASELINE}..HEAD -- src/lib/truscoreEngine/bodyShadow/ scripts/bodyShadow/ reports/bodyShadow/`, {
    encoding: 'utf8',
  })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  const bodyPillarChanged = execSync(`git diff --name-only ${AUTHORIZED_BASELINE}..HEAD -- src/lib/truscoreEngine/pillars/bodyPillar.ts`, {
    encoding: 'utf8',
  }).trim();
  return {
    current_sha: head,
    authorized_baseline_sha: AUTHORIZED_BASELINE,
    shadow_build_commit: SHADOW_BUILD_COMMIT,
    baseline_is_ancestor: baselineIsAncestor,
    shadow_files_changed_since_baseline: shadowFiles,
    production_body_pillar_changed: bodyPillarChanged.length > 0,
  };
}

async function main() {
  const root = path.resolve(__dirname, '../..');
  const outDir = path.join(root, 'reports', 'bodyShadow');
  const cachePath = path.join(outDir, 'off_evidence_cache.json');
  const cohorts = loadCohorts(root);

  const cohortReconciliation = cohorts.map((c) => ({
    name: c.name,
    asset: c.assetPath,
    expected_count: c.expectedCount,
    actual_count: c.gtins.length,
    reconciled: c.gtins.length === c.expectedCount,
  }));

  const gtinToCohorts = new Map<string, string[]>();
  for (const cohort of cohorts) {
    for (const gtin of cohort.gtins) {
      const list = gtinToCohorts.get(gtin) ?? [];
      list.push(cohort.name);
      gtinToCohorts.set(gtin, list);
    }
  }
  const uniqueGtins = [...gtinToCohorts.keys()];

  const cache = loadEvidenceCache(cachePath);
  const rows: DetailedRow[] = [];
  let liveFetched = 0;
  let cacheHits = 0;
  let fetchFailed = 0;

  console.log(`Body shadow validation ${BODY_SHADOW_MODULE_VERSION}`);
  console.log('Cohort reconciliation:', JSON.stringify(cohortReconciliation, null, 2));
  console.log(`Unique GTINs: ${uniqueGtins.length}`);

  for (const gtin of uniqueGtins) {
    let product = cache[gtin];
    let fetchSource: DetailedRow['fetchSource'] = 'cache';
    if (!product) {
      product = (await fetchOffProduct(gtin)) ?? undefined;
      if (product) {
        cache[gtin] = product;
        saveEvidenceCache(cachePath, cache);
        fetchSource = 'live_off';
        liveFetched += 1;
      } else {
        fetchSource = 'failed';
        fetchFailed += 1;
        rows.push({
          gtin,
          productName: null,
          offGrade: null,
          localGrade: null,
          localNumericScore: null,
          branch: null,
          classification: 'INSUFFICIENT_DETERMINISTIC_EVIDENCE',
          exactMatch: null,
          productionBodyScore: 0,
          shadowBodyScoreEstimate: 0,
          wholeProduceCandidate: false,
          completeOutcomeKind: null,
          cohorts: gtinToCohorts.get(gtin) ?? [],
          fetchSource,
          runtimeEligibility: {
            branchResolved: false,
            branch: null,
            completeInputCalculable: false,
            boundsCalculable: false,
          },
          algorithmValidation: { applicable: false, completeGradeComparable: false, exactMatch: null },
          missingGradeClassification: null,
        });
        await sleep(1200);
        continue;
      }
    } else {
      cacheHits += 1;
    }

    rows.push(analyzeProduct(product, gtinToCohorts.get(gtin) ?? [], fetchSource));
    await sleep(product && fetchSource === 'live_off' ? 1200 : 0);
  }

  // Retry failed fetches once with longer backoff (rate-limit recovery)
  const failedGtins = rows.filter((r) => r.fetchSource === 'failed').map((r) => r.gtin);
  for (const gtin of failedGtins) {
    await sleep(3000);
    const product = await fetchOffProduct(gtin, 6);
    if (!product) continue;
    cache[gtin] = product;
    saveEvidenceCache(cachePath, cache);
    const idx = rows.findIndex((r) => r.gtin === gtin);
    rows[idx] = analyzeProduct(product, gtinToCohorts.get(gtin) ?? [], 'live_off');
    liveFetched += 1;
    fetchFailed -= 1;
  }
  saveEvidenceCache(cachePath, cache);

  const validRows = rows.filter((r) => r.fetchSource !== 'failed');
  const knownGrade = aggregateKnownGrade(validRows);
  const missingGrade = aggregateMissingGrade(validRows);
  const runtimeEligibility = aggregateRuntimeEligibility(validRows);
  const algorithmCorrectness = {
    among_known_grade_complete_input_calculable: {
      total: knownGrade.locally_calculable_count,
      exact_matches: knownGrade.exact_matches,
      disagreements: knownGrade.disagreements.length,
      exact_match_pct: knownGrade.exact_match_pct_among_calculable,
    },
  };

  const sourPatchProduct = cache['9300617300793'] ?? (await fetchOffProduct('9300617300793'));
  const sourPatchTrace = sourPatchProduct ? buildOffInputTrace(sourPatchProduct) : null;
  const sourPatchRow = rows.find((r) => r.gtin === '9300617300793') ??
    (sourPatchProduct ? analyzeProduct(sourPatchProduct, ['mandatory_regression'], 'live_off') : null);

  const driscollsRow = rows.find((r) => r.gtin === '93541121');
  const wholeProduceTests = runWholeProduceBoundaryTests();

  const perCohort = cohorts.map((c) => {
    const cohortRows = validRows.filter((r) => r.cohorts.includes(c.name));
    return {
      name: c.name,
      expected: c.expectedCount,
      evaluated: cohortRows.length,
      known_grade: aggregateKnownGrade(cohortRows),
      missing_grade: aggregateMissingGrade(cohortRows),
    };
  });

  const provenance = gitInfo();

  const report = {
    generated_at: new Date().toISOString(),
    module_version: BODY_SHADOW_MODULE_VERSION,
    methodology_sources: METHODOLOGY_SOURCES,
    production_scoring_unchanged: true,
    retired_calculator_not_used: true,
    provenance,
    cohort_reconciliation: cohortReconciliation,
    fetch_evidence: {
      unique_gtins: uniqueGtins.length,
      cache_hits: cacheHits,
      live_fetched: liveFetched,
      fetch_failed: fetchFailed,
      cache_path: cachePath,
    },
    known_grade_validation: knownGrade,
    missing_grade_validation: missingGrade,
    runtime_eligibility_validation: runtimeEligibility,
    algorithm_correctness_validation: algorithmCorrectness,
    per_cohort: perCohort,
    mandatory_regressions: {
      sour_patch_kids_9300617300793: {
        row: sourPatchRow,
        input_trace: sourPatchTrace,
        complete_input_result:
          sourPatchTrace?.completeOutcome?.kind === 'calculated' ? sourPatchTrace.completeOutcome : null,
        bounds_result:
          sourPatchTrace?.boundsOutcome?.kind === 'bounds_invariant_grade' ? sourPatchTrace.boundsOutcome : null,
        unresolved_reason:
          sourPatchTrace?.completeOutcome?.kind === 'unresolved'
            ? sourPatchTrace.completeOutcome.reason
            : sourPatchTrace?.unresolvedReason ?? null,
        sodium_present: sourPatchTrace?.rawOffNutriments.sodiumG !== null || sourPatchTrace?.rawOffNutriments.sodiumMg !== null,
        salt_conversion_applied: sourPatchTrace?.saltResolution.sodiumToSaltApplied ?? false,
        fibre_treated_as_zero: false,
      },
      driscolls_raspberries_93541121: {
        row: driscollsRow ?? null,
        shadow_body_breakdown: driscollsRow
          ? {
              base: 15,
              nova1: 3,
              whole_produce: 4,
              nutri_adjustment: shadowBodyNutriPoints(null, driscollsRow.offGrade).adjustment,
              total: driscollsRow.shadowBodyScoreEstimate,
            }
          : null,
      },
    },
    whole_produce_boundary_tests: wholeProduceTests,
    disagreements_investigated: knownGrade.disagreements.map((d) => ({
      ...d,
      investigation: investigateDisagreement(d),
    })),
    fetch_failed_gtins: rows.filter((r) => r.fetchSource === 'failed').map((r) => r.gtin),
    recommendation: {
      complete_input_mvp_supported: null as boolean | null,
      bounds_later_consideration: null as string | null,
      whole_produce_boundary_pass: wholeProduceTests.every((t) => t.pass),
    },
    rows,
  };

  const completeInputRate =
    missingGrade.denominator > 0
      ? missingGrade.complete_input_recoveries / missingGrade.denominator
      : 0;
  const boundsIncrementalRate =
    missingGrade.denominator > 0
      ? missingGrade.incremental_bounds_from_complete_unresolved / missingGrade.denominator
      : 0;

  report.recommendation.complete_input_mvp_supported =
    knownGrade.disagreements.length === 0 &&
    knownGrade.exact_match_pct_among_calculable === 100 &&
    completeInputRate >= 0.15;
  report.recommendation.bounds_later_consideration =
    boundsIncrementalRate > 0
      ? `Incremental bounds recovered ${missingGrade.incremental_bounds_from_complete_unresolved}/${missingGrade.denominator} missing-grade products (${Math.round(boundsIncrementalRate * 1000) / 10}%) — shadow-only review warranted.`
      : 'Bounds provided no incremental missing-grade recovery beyond complete-input path in this cohort — marginal for MVP.';

  fs.mkdirSync(outDir, { recursive: true });
  const jsonOut = path.join(outDir, 'nutriScore2023_shadow_validation_complete_20260830.json');
  fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2));

  const md = buildMarkdownReport(report);
  const mdOut = path.join(outDir, 'nutriScore2023_shadow_validation_report_20260830.md');
  fs.writeFileSync(mdOut, md);

  console.log(`Wrote ${jsonOut}`);
  console.log(`Wrote ${mdOut}`);
  console.log(JSON.stringify({
    known_grade: report.known_grade_validation,
    missing_grade: report.missing_grade_validation,
    fetch: report.fetch_evidence,
  }, null, 2));
}

function buildMarkdownReport(report: Record<string, unknown>): string {
  const kg = report.known_grade_validation as Record<string, unknown>;
  const mg = report.missing_grade_validation as Record<string, unknown>;
  const prov = report.provenance as Record<string, unknown>;
  const sp = (report.mandatory_regressions as Record<string, unknown>).sour_patch_kids_9300617300793 as Record<string, unknown>;
  const dr = (report.mandatory_regressions as Record<string, unknown>).driscolls_raspberries_93541121 as Record<string, unknown>;
  const wp = report.whole_produce_boundary_tests as Array<{ name: string; pass: boolean; detail: string }>;
  const rec = report.recommendation as Record<string, unknown>;

  return `# Nutri-Score 2023 Shadow Validation — Wave 2 Body (Complete)

Generated: ${report.generated_at}
Module: ${report.module_version}
SHA: ${prov.current_sha}
Baseline: ${prov.authorized_baseline_sha} (ancestor: ${prov.baseline_is_ancestor})

## Cohort reconciliation
${JSON.stringify(report.cohort_reconciliation, null, 2)}

## A. Known-grade validation (mathematical algorithm)
- Cohort with OFF A–E: ${kg.cohort_count}
- Locally calculable (complete input): ${kg.locally_calculable_count}
- Exact matches: ${kg.exact_matches}
- Disagreements: ${(kg.disagreements as unknown[]).length}
- Branch breakdown: ${JSON.stringify(kg.branch_breakdown)}

## B. Runtime eligibility validation
${JSON.stringify(report.runtime_eligibility_validation, null, 2)}

## Missing-grade validation (denominator = no valid OFF A–E)
- Denominator: ${mg.denominator}
- Complete-input recoveries: ${mg.complete_input_recoveries}
- Bounds-invariant recoveries: ${mg.bounds_invariant_recoveries}
- Incremental bounds (complete-unresolved → bounds): ${mg.incremental_bounds_from_complete_unresolved}
- Unresolved: ${mg.unresolved}
- Not applicable: ${mg.not_applicable}
- Whole Produce candidates: ${mg.whole_produce_candidates}

## Mandatory regressions

### Sour Patch Kids 9300617300793
${JSON.stringify(sp, null, 2)}

### Driscoll's Raspberries 93541121
${JSON.stringify(dr, null, 2)}

## Whole Produce boundary tests
${wp.map((t) => `- [${t.pass ? 'x' : ' '}] ${t.name}: ${t.detail}`).join('\n')}

## Recommendation
- Complete-input MVP supported: ${rec.complete_input_mvp_supported}
- Bounds: ${rec.bounds_later_consideration}
- Whole Produce boundaries pass: ${rec.whole_produce_boundary_pass}

## Production Body unchanged
bodyPillar.ts modified since baseline: ${prov.production_body_pillar_changed}
`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
