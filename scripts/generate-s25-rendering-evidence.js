/**
 * Write reports/s25_about_these_additives/S25_RENDERING_EVIDENCE.json
 * Run: node scripts/generate-s25-rendering-evidence.js
 * (Requires jest/ts transform — prefer running via the unit test which validates the same fixtures.)
 *
 * This script uses the committed JSON assets + a minimal detector port for offline evidence only.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const catalogue = require(path.join(root, 'src/s25/assets/catalogue_315.json'));
const surface = require(path.join(root, 'src/s25/assets/surface_copy.json'));

function formatCount(n) {
  if (n === 1) return surface.result_count_singular;
  return surface.result_count_plural.replace('{count}', String(n));
}

function normalizeTag(tag) {
  let t = String(tag).toLowerCase().trim();
  if (t.startsWith('en:')) t = t.slice(3);
  t = t.replace(/\s+/g, '');
  const m = t.match(/^e-?(\d+[a-z]?)$/) || t.match(/^(\d+[a-z]?)$/);
  return m ? `e${m[1]}` : null;
}

function detect(input) {
  const bodyMap = {
    'body-v12-additive-e102': 'e102',
    'body-v12-additive-e110': 'e110',
    'body-v12-additive-e129': 'e129',
    'body-v12-additive-e171': 'e171',
    'body-v12-additive-e250': 'e250',
    'body-v12-additive-e951': 'e951',
  };
  const body6 = [...new Set((input.firedBodyLedgerIds || []).map((id) => bodyMap[id]).filter(Boolean))];
  const byId = new Map(catalogue.map((e) => [e.additive_id, e]));
  const std = new Set();
  for (const tag of input.additivesTags || []) {
    const id = normalizeTag(tag);
    if (!id) continue;
    const e = byId.get(id);
    if (e && !e.body6_existing) std.add(id);
  }
  const rendered = [...new Set([...body6, ...std])];
  return { body6, std: [...std], rendered };
}

const scenarios = [
  {
    id: 'no_additive_hidden',
    label: 'no-additive hidden state',
    input: { firedBodyLedgerIds: [], additivesTags: [] },
    nav: { from: 'result', focusAdditiveIds: [], backRestores: 'n/a', closeExitsTo: 'result' },
  },
  {
    id: 'standard_only_no_evidence',
    label: 'standard-only scan without evidence',
    input: { firedBodyLedgerIds: [], additivesTags: ['en:e100'] },
    nav: { from: 'result', focusAdditiveIds: [], backRestores: 'result', closeExitsTo: 'result' },
  },
  {
    id: 'standard_enriched_one_source',
    label: 'standard enriched one-source entry',
    input: { firedBodyLedgerIds: [], additivesTags: ['en:e120'] },
    nav: { from: 'result', focusAdditiveIds: ['e120'], backRestores: 'result', closeExitsTo: 'result' },
  },
  {
    id: 'standard_enriched_two_source',
    label: 'standard enriched two-source entry',
    input: { firedBodyLedgerIds: [], additivesTags: ['en:e211'] },
    nav: { from: 'result', focusAdditiveIds: ['e211'], backRestores: 'result', closeExitsTo: 'result' },
  },
  {
    id: 'body6_only',
    label: 'Body-6-only scan',
    input: { firedBodyLedgerIds: ['body-v12-additive-e250'], additivesTags: ['en:e250'] },
    nav: { from: 'body', focusAdditiveIds: ['e250'], backRestores: 'Body L2 story', closeExitsTo: 'result' },
  },
  {
    id: 'mixed_standard_body6',
    label: 'mixed standard + Body-6 scan',
    input: { firedBodyLedgerIds: ['body-v12-additive-e171'], additivesTags: ['en:e171', 'en:e471'] },
    nav: { from: 'result', focusAdditiveIds: [], backRestores: 'result', closeExitsTo: 'result' },
  },
  {
    id: 'mixed_enriched_body6',
    label: 'mixed enriched standard + Body-6 scan',
    input: { firedBodyLedgerIds: ['body-v12-additive-e102'], additivesTags: ['en:e102', 'en:e120'] },
    nav: { from: 'body', focusAdditiveIds: ['e102'], backRestores: 'Body L2 story', closeExitsTo: 'result' },
  },
  {
    id: 'direct_result_entry',
    label: 'direct Result entry',
    input: { firedBodyLedgerIds: [], additivesTags: ['en:e415'] },
    nav: { from: 'result', focusAdditiveIds: [], backRestores: 'result', closeExitsTo: 'result' },
  },
  {
    id: 'open_deep_link',
    label: 'Open coded-term deep-link and Back/X behaviour',
    input: { firedBodyLedgerIds: [], additivesTags: ['en:e120'] },
    nav: {
      from: 'open',
      focusAdditiveIds: ['e120'],
      backRestores: 'Open Ingredient wording L3',
      closeExitsTo: 'result',
    },
  },
];

const byId = new Map(catalogue.map((e) => [e.additive_id, e]));
const out = {
  kind: 'automated_render_evidence',
  note: 'Not device screenshots — deterministic merge/list fixtures for S25 scenarios required by brief §7.',
  surface_title: surface.surface_title,
  surface_intro: surface.surface_intro,
  scenarios: scenarios.map((s) => {
    const d = detect(s.input);
    const count = d.rendered.length;
    return {
      id: s.id,
      label: s.label,
      cardVisible: count >= 1,
      countText: count >= 1 ? formatCount(count) : null,
      renderedAdditiveIds: d.rendered,
      entries: d.rendered.map((id) => {
        const e = byId.get(id);
        return {
          additiveId: id,
          entry_title: e?.entry_title,
          isBody6: !!e?.body6_existing,
          evidence_enabled: !!e?.evidence_enabled,
          evidence_source_count: e?.evidence_source_count ?? 0,
        };
      }),
      navigation: s.nav,
    };
  }),
};

const outPath = path.join(root, 'reports', 's25_about_these_additives', 'S25_RENDERING_EVIDENCE.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
console.log('Wrote', outPath);
