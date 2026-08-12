/**
 * Wave 4 — existing-data exposure inventory.
 * Classifies historical manual-products / contribution field shapes.
 * Does not delete or mutate live records.
 */
import * as fs from 'fs';
import * as path from 'path';

const SCORING_LEAK_KEYS = [
  'manufacturing_places',
  'manufacturing_places_tags',
  'countries',
  'countries_tags',
  'origins',
  'origins_tags',
  'labels_tags',
  'labels_hierarchy',
] as const;

const ALLOWED_NON_SCORING_KEYS = ['allergens_tags', 'additives_tags'] as const;

export type ExposureClass =
  | 'historical_scoring_field_exposure'
  | 'allowed_non_scoring_proprietary'
  | 'no_contribution_fields';

export type InventoryRow = {
  sampleId: string;
  barcode?: string;
  presentLeakKeys: string[];
  presentAllowedKeys: string[];
  classification: ExposureClass;
  conservativeTreatment: 'pending' | 'not_applicable';
  deleteAuthorised: false;
  mayEnterScoringProduct: false;
};

export function classifyManualProductRecord(
  sampleId: string,
  record: Record<string, unknown>
): InventoryRow {
  const presentLeakKeys = SCORING_LEAK_KEYS.filter((key) => {
    const value = record[key];
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });
  const presentAllowedKeys = ALLOWED_NON_SCORING_KEYS.filter((key) => {
    const value = record[key];
    return Array.isArray(value) && value.length > 0;
  });

  let classification: ExposureClass = 'no_contribution_fields';
  if (presentLeakKeys.length > 0) classification = 'historical_scoring_field_exposure';
  else if (presentAllowedKeys.length > 0) classification = 'allowed_non_scoring_proprietary';

  return {
    sampleId,
    barcode: typeof record.barcode === 'string' ? record.barcode : undefined,
    presentLeakKeys,
    presentAllowedKeys,
    classification,
    conservativeTreatment: presentLeakKeys.length > 0 ? 'pending' : 'not_applicable',
    deleteAuthorised: false,
    mayEnterScoringProduct: false,
  };
}

const samples: Array<{ sampleId: string; record: Record<string, unknown> }> = [
  {
    sampleId: 'historical-origin-and-certs',
    record: {
      barcode: '9300000000001',
      manufacturing_places: 'New Zealand',
      countries: 'New Zealand',
      labels_tags: ['en:fair-trade'],
      labels_hierarchy: ['en:fair-trade'],
    },
  },
  {
    sampleId: 'allowed-allergens-additives-only',
    record: {
      barcode: '9300000000002',
      allergens_tags: ['en:milk'],
      additives_tags: ['en:e330'],
    },
  },
  {
    sampleId: 'empty-proprietary-row',
    record: { barcode: '9300000000003' },
  },
];

const rows = samples.map((s) => classifyManualProductRecord(s.sampleId, s.record));

const outDir = path.join(__dirname, '..', 'docs', 'uat');
const outPath = path.join(outDir, 'WAVE4_CONTRIBUTION_EXPOSURE_INVENTORY_20260812.md');

const lines = [
  '# Wave 4 contribution exposure inventory — 2026-08-12',
  '',
  'Classification only. **No deletion.** Historical Vercel `manual_products` rows that still contain origin/certification keys remain stored; GET `/api/manual-products` no longer returns those keys, and client merge/scoring no longer copies them onto the scoring Product.',
  '',
  'Conservative treatment for any historically exposed origin/cert/nutrition field: **pending**. It must not enter `toScoringProduct`.',
  '',
  '## Leak keys (must not score from contributions)',
  '',
  SCORING_LEAK_KEYS.map((k) => `- \`${k}\``).join('\n'),
  '',
  '## Allowed non-scoring proprietary keys',
  '',
  ALLOWED_NON_SCORING_KEYS.map((k) => `- \`${k}\``).join('\n'),
  '',
  '## Sample classification',
  '',
  '| sampleId | leak keys | allowed keys | classification | treatment | delete | score |',
  '|---|---|---|---|---|---|---|',
  ...rows.map(
    (r) =>
      `| ${r.sampleId} | ${r.presentLeakKeys.join(', ') || '—'} | ${r.presentAllowedKeys.join(', ') || '—'} | ${r.classification} | ${r.conservativeTreatment} | no | no |`
  ),
  '',
  '## Live database',
  '',
  process.env.DATABASE_URL || process.env.POSTGRES_URL
    ? 'Database URL is present in this environment. This script still does not mutate rows. Operators may run a read-only `SELECT barcode, product_data` against `manual_products` and classify each row with `classifyManualProductRecord`.'
    : 'No `DATABASE_URL`/`POSTGRES_URL` in this run. Inventory is the key map + conservative pending treatment above. A live read-only pass can be attached later without changing policy.',
  '',
  '## Residual risk',
  '',
  '- On-device caches written before this package may still hold leaked origin/cert fields. `calculateTruScore` → `toScoringProduct` strips standalone `user_contributed` records and pending-marked fields. Trusted OFF/SQLite fields are unchanged (W1).',
  '',
];

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Wrote ${outPath}`);
console.log(JSON.stringify(rows, null, 2));
