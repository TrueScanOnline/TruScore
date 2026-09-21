/**
 * One-shot migrator: convert SI product-family/identity artefacts into
 * Workstream C signal_target_product_criteria.csv, then rewrite product/
 * product_family target canonical_target_id away from PI_/PF_ pseudo-IDs.
 *
 * Run: npx tsx scripts/_local_migrate_product_scope_to_workstream_c.ts
 */
import fs from 'fs';
import path from 'path';
import { parseCsv } from '../src/identity/workstreamA/csv';

const ROOT = path.resolve(__dirname, '..');
const FAM = path.join(ROOT, 'workstreamA/a-data/chaining-extensions/v0.3');
const C = path.join(ROOT, 'workstreamC/c-data/dynamic-signals-v0.3/input');

function read(p: string) {
  return fs.existsSync(p) ? parseCsv(fs.readFileSync(p, 'utf8')) : [];
}

function csvEscape(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function writeCsv(filePath: string, headers: string[], rows: Record<string, string>[]) {
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h] ?? '')).join(','));
  }
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
}

function main() {
  const families = read(path.join(FAM, 'product_families.csv'));
  const familyAliases = read(path.join(FAM, 'product_family_aliases.csv'));
  const identities = read(path.join(FAM, 'product_identities.csv'));
  const identityAliases = read(path.join(FAM, 'product_identity_aliases.csv'));
  const targets = read(path.join(C, 'signal_targets.csv'));

  const famById = new Map(families.map((f) => [f.product_family_id, f]));
  const identById = new Map(identities.map((i) => [i.product_identity_id, i]));

  const criteria: Record<string, string>[] = [];
  let n = 0;
  const nextId = () => `SPC-${String(++n).padStart(4, '0')}`;

  const rewrittenTargets = targets.map((t) => {
    const type = (t.target_type || '').trim();
    const canon = (t.canonical_target_id || '').trim();
    const tid = (t.signal_target_id || '').trim();
    const market = (t.market_key || '').trim();

    if (type === 'product_family' && canon.startsWith('PF_')) {
      const fam = famById.get(canon);
      const aliases = familyAliases.filter((a) => a.product_family_id === canon);
      if (aliases.length === 0 && fam) {
        // No aliases — fail-closed family (e.g. Vogel's). Record brand/parent only with empty term
        // so evaluator knows the target exists but cannot match without terms.
        // Do not add a criterion without match_value — leave target without criteria = fail closed.
      }
      for (const a of aliases) {
        if ((a.review_state || '').trim() !== 'reviewed') continue;
        criteria.push({
          criterion_id: nextId(),
          signal_target_id: tid,
          market_key: fam?.market_key || market,
          required_brand_id: (fam?.anchor_brand_id || '').trim(),
          required_parent_id: (fam?.anchor_parent_id || '').trim(),
          match_field: 'product_name',
          match_mode: (a.match_mode || 'phrase_contains').trim() || 'phrase_contains',
          match_value: (a.alias_text || '').trim(),
          match_value_normalized: (a.alias_normalized || '').trim(),
          review_state: 'reviewed',
          confidence_state: (a.confidence_state || fam?.confidence_state || 'strong').trim(),
          lineage_reference: (a.lineage_reference || t.lineage_reference || '').trim(),
          notes: `Migrated from ${canon} / ${a.alias_id}`,
        });
      }
      return {
        ...t,
        // Target is scoped by Workstream C criteria keyed on signal_target_id — not an SI identity.
        canonical_target_id: tid,
        resolution_status: aliases.length > 0 ? 'resolved' : (t.resolution_status || 'resolved'),
      };
    }

    if (type === 'product' && (canon.startsWith('PI_') || !canon)) {
      const ident = canon.startsWith('PI_') ? identById.get(canon) : undefined;
      const aliases = canon.startsWith('PI_')
        ? identityAliases.filter((a) => a.product_identity_id === canon)
        : [];
      for (const a of aliases) {
        if ((a.review_state || '').trim() !== 'reviewed') continue;
        criteria.push({
          criterion_id: nextId(),
          signal_target_id: tid,
          market_key: ident?.market_key || market,
          required_brand_id: (ident?.anchor_brand_id || '').trim(),
          required_parent_id: (ident?.anchor_parent_id || '').trim(),
          match_field: 'product_name',
          match_mode: (a.match_mode || 'phrase_contains').trim() || 'phrase_contains',
          match_value: (a.alias_text || '').trim(),
          match_value_normalized: (a.alias_normalized || '').trim(),
          review_state: 'reviewed',
          confidence_state: (a.confidence_state || ident?.confidence_state || 'confirmed').trim(),
          lineage_reference: (a.lineage_reference || t.lineage_reference || '').trim(),
          notes: `Migrated from ${canon} / ${a.alias_id}`,
        });
      }
      // If identity had no aliases but has display_name, add one phrase from display_name
      if (aliases.length === 0 && ident?.display_name) {
        const disp = ident.display_name.trim();
        const norm = disp.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        criteria.push({
          criterion_id: nextId(),
          signal_target_id: tid,
          market_key: ident.market_key || market,
          required_brand_id: (ident.anchor_brand_id || '').trim(),
          required_parent_id: (ident.anchor_parent_id || '').trim(),
          match_field: 'product_name',
          match_mode: 'phrase_contains',
          match_value: disp,
          match_value_normalized: norm,
          review_state: 'reviewed',
          confidence_state: (ident.confidence_state || 'confirmed').trim(),
          lineage_reference: (ident.lineage_reference || t.lineage_reference || '').trim(),
          notes: `Migrated from ${canon} display_name`,
        });
      }
      return {
        ...t,
        canonical_target_id: tid,
      };
    }

    return t;
  });

  const criteriaPath = path.join(C, 'signal_target_product_criteria.csv');
  writeCsv(
    criteriaPath,
    [
      'criterion_id',
      'signal_target_id',
      'market_key',
      'required_brand_id',
      'required_parent_id',
      'match_field',
      'match_mode',
      'match_value',
      'match_value_normalized',
      'review_state',
      'confidence_state',
      'lineage_reference',
      'notes',
    ],
    criteria
  );

  const targetHeaders = Object.keys(targets[0] || {});
  writeCsv(path.join(C, 'signal_targets.csv'), targetHeaders, rewrittenTargets as any);

  // Update food_recall_notices: clear recall_product_family_id SI pointers (keep notice; product match via targets/criteria)
  const notices = read(path.join(C, 'food_recall_notices.csv'));
  if (notices.length) {
    const nh = Object.keys(notices[0]);
    const cleared = notices.map((n) => ({
      ...n,
      recall_product_family_id: '',
      notes: [
        (n.notes || '').trim(),
        n.recall_product_family_id
          ? `Former recall_product_family_id=${n.recall_product_family_id} retired from SI; product scope via signal_target_product_criteria.`
          : '',
      ]
        .filter(Boolean)
        .join(' '),
    }));
    writeCsv(path.join(C, 'food_recall_notices.csv'), nh, cleared);
  }

  console.log(
    JSON.stringify(
      {
        criteria: criteria.length,
        targets_rewritten: rewrittenTargets.filter((t) =>
          ['product', 'product_family'].includes((t.target_type || '').trim())
        ).length,
        wrote: criteriaPath,
      },
      null,
      2
    )
  );
}

main();
