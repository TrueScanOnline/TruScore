/**
 * Mechanically sync Dynamic Signals v0.3 CSVs from founder workbook
 * Rveel_Dynamic_Signals_Asset_20260926_FINAL.xlsx
 *
 * - Current publishable heads/targets = workbook exactly
 * - Historical predecessor targets/signals retained as non-publishable lineage
 * - Criteria derived from product_match_terms + verified_gtins only
 * - Does not touch Chaining A-data
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const ROOT = path.resolve(__dirname, '..');
const WB =
  'C:\\Users\\leigh\\Desktop\\Rveel_Dynamic_Signals_Asset_20260926_FINAL.xlsx';
const PACK = path.join(ROOT, 'workstreamC', 'c-data', 'dynamic-signals-v0.3', 'input');

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    return row;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function csvEscape(v) {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows, headers) {
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => csvEscape(r[h] ?? '')).join(','));
  }
  return lines.join('\n') + '\n';
}

function normalizePhrase(v) {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pipeSplit(v) {
  return String(v || '')
    .split('|')
    .map((x) => x.trim())
    .filter(Boolean);
}

const wb = XLSX.readFile(WB, { raw: false, cellDates: true });
const wbSignals = XLSX.utils.sheet_to_json(wb.Sheets.Signals, { defval: '', raw: false });
const wbTargets = XLSX.utils.sheet_to_json(wb.Sheets.Signal_Targets, { defval: '', raw: false });
const wbSources = XLSX.utils.sheet_to_json(wb.Sheets.Source_Universe, { defval: '', raw: false });
const wbDomains = XLSX.utils.sheet_to_json(wb.Sheets.Reveal_Domains, { defval: '', raw: false });
const wbControlled = XLSX.utils.sheet_to_json(wb.Sheets.Controlled_Values, { defval: '', raw: false });

function asIsoDate(v) {
  if (v == null || v === '') return '';
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // Excel serial fallback
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    if (n > 20000 && n < 80000) {
      const epoch = Date.UTC(1899, 11, 30);
      const d = new Date(epoch + Math.round(n) * 86400000);
      return d.toISOString().slice(0, 10);
    }
  }
  return s;
}

const SIGNAL_DATE_FIELDS = [
  'source_published_at',
  'detected_at',
  'reviewed_at',
  'last_material_update_at',
  'publishable_from',
  'expires_at',
];

const existingSignals = parseCsv(fs.readFileSync(path.join(PACK, 'signals.csv'), 'utf8'));
const existingTargets = parseCsv(fs.readFileSync(path.join(PACK, 'signal_targets.csv'), 'utf8'));

const wbSignalIds = new Set(wbSignals.map((s) => String(s.signal_id).trim()));
const wbTargetIds = new Set(wbTargets.map((t) => String(t.signal_target_id).trim()));

// --- Signals: workbook rows win; retain historical non-workbook rows as lineage ---
const signalHeaders = [
  'signal_id',
  'dedupe_key',
  'signal_class',
  'market_key',
  'source_channel_id',
  'source_record_id',
  'source_published_at',
  'source_url',
  'source_title',
  'reveal_domain',
  'signal_headline',
  'signal_summary',
  'scope_qualification',
  'subject_response',
  'subject_response_status',
  'subject_response_source_url',
  'confidence_state',
  'review_state',
  'signal_publication_state',
  'editorial_review_required',
  'editorial_review_state',
  'detected_at',
  'reviewed_at',
  'last_material_update_at',
  'publishable_from',
  'expires_at',
  'supersedes_signal_id',
  'lineage_reference',
  'rationale_summary',
  'evidence_policy_version',
];

const signalsOut = [];
for (const s of wbSignals) {
  const row = {};
  for (const h of signalHeaders) {
    row[h] = SIGNAL_DATE_FIELDS.includes(h) ? asIsoDate(s[h]) : s[h] ?? '';
  }
  signalsOut.push(row);
}
for (const s of existingSignals) {
  const id = String(s.signal_id || '').trim();
  if (!id || wbSignalIds.has(id)) continue;
  // Historical lineage — force non-publishable so workbook heads alone publish.
  const row = {};
  for (const h of signalHeaders) row[h] = s[h] ?? '';
  if (String(row.signal_publication_state).toLowerCase() === 'publishable') {
    row.signal_publication_state = 'candidate';
  }
  signalsOut.push(row);
}

// --- Targets: workbook current heads; retain historical targets for non-workbook signals ---
const targetHeaders = [
  'signal_target_id',
  'signal_id',
  'market_key',
  'target_type',
  'target_label',
  'canonical_target_id',
  'propagation_mode',
  'required_brand_id',
  'required_parent_id',
  'product_match_terms',
  'verified_gtins',
  'verified_gtin_evidence',
  'scope_review_summary',
  'coverage_state',
  'confidence_state',
  'review_state',
  'resolution_status',
  'lineage_reference',
  'product_scope_guard',
];

const targetsOut = [];
for (const t of wbTargets) {
  const row = {};
  for (const h of targetHeaders) row[h] = t[h] ?? '';
  // No publishable product_family / family_members
  if (String(row.target_type) === 'product_family' || String(row.propagation_mode) === 'family_members') {
    throw new Error(
      `Workbook publishable target ${row.signal_target_id} uses forbidden ${row.target_type}/${row.propagation_mode}`
    );
  }
  targetsOut.push(row);
}
for (const t of existingTargets) {
  const tid = String(t.signal_target_id || '').trim();
  const sid = String(t.signal_id || '').trim();
  if (!tid || wbTargetIds.has(tid)) continue;
  if (wbSignalIds.has(sid)) continue; // drop superseded heads for workbook signal ids
  const row = {};
  for (const h of targetHeaders) {
    if (h === 'required_brand_id' || h === 'required_parent_id' || h === 'product_match_terms' || h === 'verified_gtins' || h === 'verified_gtin_evidence') {
      row[h] = t[h] ?? '';
    } else {
      row[h] = t[h] ?? '';
    }
  }
  targetsOut.push(row);
}

// --- Criteria: mechanical derivation from workbook current targets only ---
// Historical predecessor criteria kept only for retained historical target ids
const existingCriteria = parseCsv(
  fs.readFileSync(path.join(PACK, 'signal_target_product_criteria.csv'), 'utf8')
);
const criteriaHeaders = [
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
];

const criteriaOut = [];
let seq = 1;
const nextId = () => `SPC-${String(seq++).padStart(4, '0')}`;

for (const t of wbTargets) {
  const tid = String(t.signal_target_id).trim();
  const market = String(t.market_key || '').trim();
  const brand = String(t.required_brand_id || '').trim();
  const parent = String(t.required_parent_id || '').trim();
  const lineage = String(t.lineage_reference || '').trim();
  const terms = pipeSplit(t.product_match_terms);
  const gtins = pipeSplit(t.verified_gtins);

  for (const term of terms) {
    const norm = normalizePhrase(term);
    if (!norm) continue;
    criteriaOut.push({
      criterion_id: nextId(),
      signal_target_id: tid,
      market_key: market,
      required_brand_id: brand,
      required_parent_id: parent,
      match_field: 'product_name',
      match_mode: 'phrase_contains',
      match_value: term,
      match_value_normalized: norm,
      review_state: 'reviewed',
      confidence_state: String(t.confidence_state || 'confirmed').trim() || 'confirmed',
      lineage_reference: lineage,
      notes: 'Derived mechanically from workbook product_match_terms',
    });
  }
  for (const gtin of gtins) {
    const digits = gtin.replace(/\D/g, '');
    if (!digits) continue;
    criteriaOut.push({
      criterion_id: nextId(),
      signal_target_id: tid,
      market_key: market,
      required_brand_id: brand,
      required_parent_id: parent,
      match_field: 'gtin',
      match_mode: 'exact',
      match_value: digits,
      match_value_normalized: digits,
      review_state: 'reviewed',
      confidence_state: String(t.confidence_state || 'confirmed').trim() || 'confirmed',
      lineage_reference: lineage,
      notes: 'Derived mechanically from workbook verified_gtins',
    });
  }
}

const retainedHistoricalTargetIds = new Set(
  targetsOut.filter((t) => !wbTargetIds.has(String(t.signal_target_id).trim())).map((t) =>
    String(t.signal_target_id).trim()
  )
);
for (const c of existingCriteria) {
  const tid = String(c.signal_target_id || '').trim();
  if (!retainedHistoricalTargetIds.has(tid)) continue;
  const row = {};
  for (const h of criteriaHeaders) row[h] = c[h] ?? '';
  criteriaOut.push(row);
}

// Source / domains / controlled values — replace from workbook
const sourceHeaders = Object.keys(wbSources[0] || {});
const domainHeaders = Object.keys(wbDomains[0] || {});
const controlledHeaders = Object.keys(wbControlled[0] || {});

fs.writeFileSync(path.join(PACK, 'signals.csv'), toCsv(signalsOut, signalHeaders));
fs.writeFileSync(path.join(PACK, 'signal_targets.csv'), toCsv(targetsOut, targetHeaders));
fs.writeFileSync(path.join(PACK, 'signal_target_product_criteria.csv'), toCsv(criteriaOut, criteriaHeaders));
fs.writeFileSync(path.join(PACK, 'source_universe.csv'), toCsv(wbSources, sourceHeaders));
fs.writeFileSync(path.join(PACK, 'reveal_domains.csv'), toCsv(wbDomains, domainHeaders));
fs.writeFileSync(path.join(PACK, 'controlled_values.csv'), toCsv(wbControlled, controlledHeaders));

// Proof summary
const gtinSet = new Set();
for (const t of wbTargets) pipeSplit(t.verified_gtins).forEach((g) => gtinSet.add(g.replace(/\D/g, '')));
const phraseCount = criteriaOut.filter((c) => c.match_field === 'product_name' && wbTargetIds.has(c.signal_target_id)).length;
const gtinCritCount = criteriaOut.filter((c) => c.match_field === 'gtin' && wbTargetIds.has(c.signal_target_id)).length;
const publishableTargets = targetsOut.filter((t) => wbSignalIds.has(String(t.signal_id).trim()));
const activeFamily = publishableTargets.filter(
  (t) => t.target_type === 'product_family' || t.propagation_mode === 'family_members'
);

const summary = {
  workbook_signals: wbSignals.length,
  workbook_targets: wbTargets.length,
  signals_out: signalsOut.length,
  targets_out: targetsOut.length,
  publishable_targets: publishableTargets.length,
  criteria_out: criteriaOut.length,
  active_phrase_criteria: phraseCount,
  active_gtin_criteria: gtinCritCount,
  unique_verified_gtins: gtinSet.size,
  gtin_set: [...gtinSet].sort(),
  active_product_family_or_family_members: activeFamily.length,
  cocoa_guard_targets: publishableTargets.filter((t) => t.product_scope_guard === 'cocoa_chocolate').map((t) => t.signal_target_id),
};
fs.writeFileSync(
  path.join(ROOT, 'reports', 'dsa_asset_20260926_sync_summary.json'),
  JSON.stringify(summary, null, 2)
);
console.log(JSON.stringify(summary, null, 2));
