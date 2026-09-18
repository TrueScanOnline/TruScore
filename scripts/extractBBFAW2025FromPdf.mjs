/**
 * Extract BBFAW 2025 company-tier data from Figure 1.1 of bbfaw-benchmark-2025.pdf
 * using positioned text (column x-ranges).
 *
 * Output:
 *   Database files/ETHICS Pillar/BBFAW folder/bbfaw-2025-data.json
 *   Database files/ETHICS Pillar/BBFAW folder/bbfaw-2025-extracted.txt
 *
 * Run: node scripts/extractBBFAW2025FromPdf.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PDF = path.join(ROOT, 'Database files', 'ETHICS Pillar', 'BBFAW folder', 'bbfaw-benchmark-2025.pdf');
const OUT_JSON = path.join(ROOT, 'Database files', 'ETHICS Pillar', 'BBFAW folder', 'bbfaw-2025-data.json');
const OUT_TXT = path.join(ROOT, 'Database files', 'ETHICS Pillar', 'BBFAW folder', 'bbfaw-2025-extracted.txt');
const REF = 'https://www.bbfaw.com/media/2209/bbfaw-benchmark-2025.pdf';
const SECTION = 'Figure 1.1 - Company Tier Rankings and Impact Ratings';

const COLS = [
  { tier: 2, x0: 120, x1: 210 },
  { tier: 3, x0: 210, x1: 295 },
  { tier: 4, x0: 295, x1: 380 },
  { tier: 5, x0: 380, x1: 465 },
  { tier: 6, x0: 465, x1: 600 },
];

function colOf(x) {
  for (const c of COLS) if (x >= c.x0 && x < c.x1) return c.tier;
  return null;
}

function mergeContinuations(list, isCont) {
  const out = [];
  for (const raw of list) {
    if (out.length && isCont(raw)) {
      const prev = out[out.length - 1];
      const m = prev.match(/^(.*?)(\s+[↑↓]?\s*[A-F]|[↑↓]?[A-F])$/u);
      if (m) {
        out[out.length - 1] = `${m[1].trim()} ${raw} ${m[2].trim()}`.replace(/\s+/g, ' ').trim();
      } else {
        out[out.length - 1] = `${prev} ${raw}`.replace(/\s+/g, ' ').trim();
      }
    } else {
      out.push(raw);
    }
  }
  return out;
}

function cleanName(name) {
  return name
    .replace(/\u2191|\u2193|↑|↓/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseEntry(raw, tier) {
  let s = raw.replace(/\s+/g, ' ').trim();
  // Strip year-change arrows anywhere; keep trailing A-F as Impact Rating
  s = s.replace(/[↑↓]/gu, ' ').replace(/\s+/g, ' ').trim();
  const m = s.match(/^(.*?)\s+([A-F])$/u);
  if (!m) return { companyName: cleanName(s), tier, impactRating: null, raw };
  return {
    companyName: cleanName(m[1]),
    tier,
    impactRating: m[2],
    raw,
  };
}

async function main() {
  const data = new Uint8Array(fs.readFileSync(PDF));
  const pdf = await getDocument({ data, useSystemFonts: true }).promise;
  const page = await pdf.getPage(21); // Figure 1.1
  const tc = await page.getTextContent();
  const items = tc.items
    .map((i) => ({ str: i.str, x: i.transform[4], y: i.transform[5] }))
    .filter((i) => i.str && i.str.trim());

  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows = [];
  let cur = [];
  let lastY = null;
  for (const it of sorted) {
    if (lastY === null || Math.abs(it.y - lastY) < 4) {
      cur.push(it);
      lastY = lastY === null ? it.y : (lastY * (cur.length - 1) + it.y) / cur.length;
    } else {
      rows.push(cur);
      cur = [it];
      lastY = it.y;
    }
  }
  if (cur.length) rows.push(cur);

  const byTier = { 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const row of rows) {
    const byCol = { 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const it of row) {
      const t = colOf(it.x);
      if (t) byCol[t].push(it);
    }
    for (const t of [2, 3, 4, 5, 6]) {
      const parts = byCol[t].sort((a, b) => a.x - b.x).map((p) => p.str);
      if (!parts.length) continue;
      const joined = parts.join(' ').replace(/\s+/g, ' ').trim();
      if (
        /^Tier|^Leadership|^Integral|^Established|^Making|^On the|^No evidence|^business|^work to|^implementation|^but limited|^\d+$/.test(
          joined
        )
      ) {
        continue;
      }
      if (['0', '4', '8', '18', '59', '60'].includes(joined)) continue;
      byTier[t].push(joined);
    }
  }

  byTier[5] = mergeContinuations(
    byTier[5],
    (raw) =>
      raw === '(Boparan Holdings Ltd)' ||
      raw === '(ALDI Nord)' ||
      raw === 'Genossenschaft' ||
      raw === 'Aurora Alimentos'
  );
  byTier[6] = mergeContinuations(
    byTier[6],
    (raw) =>
      raw === 'Group Co., Ltd.' ||
      raw === 'Italiana Soc. Coop. ARL' ||
      raw === '(Inspire Brands, Subway et al.)'
  );

  const ambiguous = [];
  const companies = [];
  for (const t of [2, 3, 4, 5, 6]) {
    for (const raw of byTier[t]) {
      const e = parseEntry(raw, t);
      if (!e.impactRating) {
        ambiguous.push({ reason: 'missing_IR', raw, tier: t });
        continue;
      }
      companies.push({
        companyName: e.companyName,
        tier: e.tier,
        impactRating: e.impactRating,
        year: 2025,
        referenceUrl: REF,
        reportSection: SECTION,
      });
    }
  }

  const seen = new Set();
  const unique = [];
  for (const c of companies) {
    const key = c.companyName.toLowerCase();
    if (seen.has(key)) {
      ambiguous.push({ reason: 'duplicate', companyName: c.companyName, tier: c.tier });
      continue;
    }
    seen.add(key);
    unique.push(c);
  }

  // Stable sort: by tier then name
  unique.sort((a, b) => a.tier - b.tier || a.companyName.localeCompare(b.companyName));

  const tierCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const irCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  for (const c of unique) {
    tierCounts[c.tier]++;
    irCounts[c.impactRating]++;
  }

  const lastExtracted = new Date().toISOString();
  const out = {
    lastExtracted,
    source: 'BBFAW 2025 Report (Figure 1.1)',
    year: 2025,
    sourceReport: 'bbfaw-benchmark-2025.pdf',
    reportUrl: REF,
    companies: unique,
  };
  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 2), 'utf8');

  const lines = [];
  lines.push('BBFAW 2025 Figure 1.1 Extraction Verification');
  lines.push('==========================================');
  lines.push(`Source PDF: ${PDF}`);
  lines.push(`Reference URL: ${REF}`);
  lines.push(`Report section: ${SECTION}`);
  lines.push(`Extracted: ${lastExtracted}`);
  lines.push('');
  lines.push(`Total companies: ${unique.length} (expected 149)`);
  lines.push('');
  lines.push('Tier counts (PDF Figure 1.1 header row under Tier 1..6: 0 4 8 18 59 60):');
  lines.push(`  Tier 1: ${tierCounts[1]} (expected 0)`);
  lines.push(`  Tier 2: ${tierCounts[2]} (expected 4)`);
  lines.push(`  Tier 3: ${tierCounts[3]} (expected 8)`);
  lines.push(`  Tier 4: ${tierCounts[4]} (expected 18)`);
  lines.push(`  Tier 5: ${tierCounts[5]} (expected 59)`);
  lines.push(`  Tier 6: ${tierCounts[6]} (expected 60)`);
  lines.push(`  Sum: ${Object.values(tierCounts).reduce((a, b) => a + b, 0)}`);
  lines.push('');
  lines.push('NOTE: Plain-text extract showed "59" then "0 4 8 18 60" (mis-ordered columns).');
  lines.push('Positioned PDF parse places 59 under Tier 5 and 60 under Tier 6.');
  lines.push('');
  lines.push('Impact Rating counts (from Figure 1.1 company cells):');
  for (const k of ['A', 'B', 'C', 'D', 'E', 'F']) lines.push(`  ${k}: ${irCounts[k]}`);
  lines.push(`  Sum: ${Object.values(irCounts).reduce((a, b) => a + b, 0)}`);
  lines.push('');
  lines.push('Table 1.3 states B=3, C=5, D=7, E=14, F=120.');
  lines.push(
    `Figure 1.1 cells: B=${irCounts.B}, C=${irCounts.C}, D=${irCounts.D}, E=${irCounts.E}, F=${irCounts.F}.`
  );
  lines.push('Discrepancy: Figure has E=12 / F=122 (Δ2 vs Table 1.3). Company rows follow Figure 1.1.');
  lines.push('');
  lines.push('Known Tier 2 check:');
  for (const n of ['Greggs PLC', 'Marks & Spencer PLC', 'Premier Foods PLC', 'Waitrose']) {
    const c = unique.find((x) => x.companyName === n);
    lines.push(`  ${n}: ${c ? `tier ${c.tier} IR ${c.impactRating}` : 'MISSING'}`);
  }
  lines.push('Known Tier 3 check:');
  for (const n of [
    'Co-op UK',
    'Cranswick PLC',
    'Fonterra',
    'Groupe Danone SA',
    'Hilton Food Group',
    'MBRF',
    'Minerva Foods',
    'Noble Foods',
  ]) {
    const c = unique.find((x) => x.companyName === n);
    lines.push(`  ${n}: ${c ? `tier ${c.tier} IR ${c.impactRating}` : 'MISSING'}`);
  }
  lines.push('');
  lines.push('Ambiguous / name notes:');
  if (!ambiguous.length) lines.push('  (no parse failures)');
  for (const a of ambiguous) lines.push(`  ${JSON.stringify(a)}`);
  lines.push('  Figure 1.1 name forms (vs appendix aliases):');
  lines.push('    - Müller UTM (appendix: Unternehmensgruppe Theo Müller)');
  lines.push('    - Maruha Nichiro (appendix: Umios (previously Maruha Nichiro))');
  lines.push('    - Vion Food Group (appendix: Vion Food)');
  lines.push('    - Bellis Topco Ltd./Asda (appendix also: Asda (Bellis Topco Ltd.))');
  lines.push('    - ALDI SOUTH Group (appendix: ALDI Süd/ALDI Einkauf SE & Co. OHG)');
  lines.push('');
  lines.push('Companies by tier:');
  for (const t of [2, 3, 4, 5, 6]) {
    lines.push('');
    lines.push(`--- Tier ${t} (${tierCounts[t]}) ---`);
    for (const c of unique.filter((x) => x.tier === t)) {
      lines.push(`  ${c.companyName} | ${c.impactRating}`);
    }
  }

  fs.writeFileSync(OUT_TXT, lines.join('\n'), 'utf8');
  console.log(
    JSON.stringify(
      {
        total: unique.length,
        tierCounts,
        irCounts,
        ambiguous,
        outJson: OUT_JSON,
        outTxt: OUT_TXT,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
