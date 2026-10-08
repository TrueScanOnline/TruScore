/**
 * Partial doctrine §10.4 gate. This file is not a complete §10.4 implementation.
 *
 * Covered:
 * - Forbidden-token counts in src/components, src/features and app (tests excluded).
 *   The known-hit allowlist is unchanged. A new file or a higher count fails.
 *   Hits inside app/result/[barcode].tsx stay the existing orchestration allowlist
 *   entry. They are not reclassified here as a new live presentation read.
 * - Score-adjacent `?? 0` / `|| 0` on one line, where the operand immediately
 *   before the operator is `.score`, truScore, publishedScore, internalScore,
 *   or trust_score. Live presentation hits must be empty.
 * - Direct app/ source strings for `truscoreEngine/bodyShadow` and
 *   `features/product` (the existing PalmOilCard import only).
 * - MVP_RUNTIME remains all false. PALM_OIL_PRODUCT_CARD_VISIBLE is read from
 *   source text and must stay false.
 * - Named H-13 source-text test files are still present. Presence is not a
 *   review of their assertions.
 *
 * Exclusions, stated so they are not mistaken for coverage:
 * - Dormant score defaults are recorded and are not live Result reads:
 *   EcoScore.tsx (unreachable §8 display) and ShareContentBuilder.buildEcoScoreContent
 *   (dormant ecoscore share branch; no live caller).
 * - Unrelated `?? 0` / `|| 0` defaults are not banned: photo dimensions, origin
 *   blank counts, nutrient kcal, generatedAt, and fetch-trace length.
 * - Comments are stripped before the score-default scan. Prose that does not
 *   use the operand pattern is not a hit. TrustScoreInfoModal's Eco-Score
 *   sentence is prose, not a score read.
 * - Score defaults reached through an intermediate variable, a default
 *   parameter, or another line are not detected.
 * - src/utils and src/lib are outside the scan. shareAnalytics `truScore || 0`
 *   is one such gap.
 *
 * Not covered:
 * - Forbidden imports. Only two direct app/ strings are checked. There is no
 *   §5.1 interface allowlist, and the rest of the §8 inventory is not listed.
 * - Transitive dormant reachability. An app file can import a live module that
 *   imports a dormant one without this gate noticing. ShareModal reaches
 *   ShareContentBuilder, which still contains the dormant ecoscore branch.
 * - Retired source-text controls. This gate does not retire an H-13 assertion
 *   and does not name a behavioural replacement. Deleting the assertion text
 *   while leaving the file in place would still pass.
 * - `.breakdown.` used for display, S28 diagnostics as a separate exclusion,
 *   and removal of the known-hit allowlist after C-1 to C-3.
 */

import fs from 'fs';
import path from 'path';
import { MVP_RUNTIME } from '../../../config/mvpRuntimeGates';

const ROOT = path.resolve(__dirname, '../../../..');

const SCAN_ROOTS = ['src/components', 'src/features', 'app'];

const FORBIDDEN = [
  'trust_score_breakdown',
  '.internalScore',
  'truScore.truscore',
  'product.confidence',
  'ecoscore_grade',
];

/** File → allowed hit count across FORBIDDEN. Do not add a file without founder approval. */
const ALLOWED_HITS: Record<string, number> = {
  'app/result/[barcode].tsx': 4,
  'src/components/TrustScoreInfoModal.tsx': 1,
  'src/features/product/components/TruScoreCard.tsx': 2,
  'src/features/product/cards/TruScoreCard/TruScoreCard.tsx': 2,
};

const SCORE_DEFAULT =
  /(?:\.score|\btruScore\b|\btruscore\b|\bpublishedScore\b|\binternalScore\b|\btrust_score\b)\s*(?:\?\?|\|\|)\s*0\b/;

/** H-13 anchors. This gate only checks that the files still exist. */
const SOURCE_TEXT_ANCHORS = [
  'src/__tests__/unit/result/wave4a5ResultSurface.contract.test.ts',
  'src/__tests__/unit/review1/pass2Corrective.candidate2.na003Release.test.ts',
  'src/__tests__/unit/dynamicSignals/na022.staleSignalsClear.test.ts',
  'src/__tests__/unit/review1/pass2Corrective.candidate3.manualScoreRender.test.ts',
  'src/__tests__/unit/utils/nullScoreResultPath.test.ts',
];

const UNRELATED_DEFAULT_FILES = [
  'app/result/[barcode].tsx',
  'src/components/PacketContributionModal.tsx',
  'src/components/NutritionDetailsModal.tsx',
];

type ScoreDefaultHit = {
  file: string;
  snippet: string;
  kind: 'live' | 'dormant-file' | 'dormant-branch';
};

function walk(dir: string, acc: string[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      walk(full, acc);
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full);
  }
}

function rel(file: string) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function hitCount(source: string) {
  return FORBIDDEN.reduce((sum, token) => sum + source.split(token).length - 1, 0);
}

function stripComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/^\s*\/\/.*$/gm, '');
}

function presentationFiles() {
  const files: string[] = [];
  for (const root of SCAN_ROOTS) walk(path.join(ROOT, root), files);
  return files;
}

function classifyScoreDefault(file: string, source: string, index: number): ScoreDefaultHit['kind'] {
  if (file === 'src/components/EcoScore.tsx') return 'dormant-file';
  if (file === 'src/features/sharing/services/ShareContentBuilder.ts') {
    const start = source.indexOf('buildEcoScoreContent');
    const end = source.indexOf('static optimizeForPlatform', start);
    if (start >= 0 && end > start && index > start && index < end) return 'dormant-branch';
  }
  return 'live';
}

function scoreDefaultHits(): ScoreDefaultHit[] {
  const hits: ScoreDefaultHit[] = [];
  for (const file of presentationFiles()) {
    const key = rel(file);
    const raw = fs.readFileSync(file, 'utf8');
    const source = stripComments(raw);
    const matcher = new RegExp(SCORE_DEFAULT.source, 'g');
    let match: RegExpExecArray | null;
    while ((match = matcher.exec(source))) {
      const lineStart = source.lastIndexOf('\n', match.index) + 1;
      const lineEnd = source.indexOf('\n', match.index);
      const snippet = source.slice(lineStart, lineEnd === -1 ? source.length : lineEnd).trim();
      hits.push({
        file: key,
        snippet,
        kind: classifyScoreDefault(key, source, match.index),
      });
    }
  }
  return hits;
}

describe('partial doctrine §10.4 consumption guards', () => {
  it('fails when a presentation file gains a forbidden score read', () => {
    const unexpected: string[] = [];
    const seen = new Set<string>();
    for (const file of presentationFiles()) {
      const key = rel(file);
      const count = hitCount(fs.readFileSync(file, 'utf8'));
      if (count === 0) continue;
      seen.add(key);
      const allowed = ALLOWED_HITS[key];
      if (allowed !== count) unexpected.push(`${key}: ${count} hit(s), allowlist ${allowed ?? 0}`);
    }
    for (const key of Object.keys(ALLOWED_HITS)) {
      if (!seen.has(key)) unexpected.push(`${key}: allowlisted but no longer present`);
    }
    expect(unexpected).toEqual([]);
    expect(Object.keys(ALLOWED_HITS)).toEqual([
      'app/result/[barcode].tsx',
      'src/components/TrustScoreInfoModal.tsx',
      'src/features/product/components/TruScoreCard.tsx',
      'src/features/product/cards/TruScoreCard/TruScoreCard.tsx',
    ]);
  });

  it('fails a new live score-adjacent ?? 0 or || 0 and keeps dormant defaults out of that failure', () => {
    const hits = scoreDefaultHits();
    expect(hits.filter((hit) => hit.kind === 'live')).toEqual([]);
    expect(hits.filter((hit) => hit.kind !== 'live').map((hit) => `${hit.file} :: ${hit.snippet}`)).toEqual([
      'src/components/EcoScore.tsx :: const score = ecoScore.score || 0;',
      'src/features/sharing/services/ShareContentBuilder.ts :: const score = ecoScore?.score || 0;',
    ]);
  });

  it('does not ban unrelated ?? 0 or || 0 defaults', () => {
    const hits = scoreDefaultHits();
    for (const file of UNRELATED_DEFAULT_FILES) {
      const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
      expect(source.includes('?? 0') || source.includes('|| 0')).toBe(true);
      expect(hits.some((hit) => hit.file === file)).toBe(false);
      expect(ALLOWED_HITS[file]).toBe(file === 'app/result/[barcode].tsx' ? 4 : undefined);
    }
  });

  it('checks only direct app/ import strings, not transitive dormant reachability', () => {
    const files: string[] = [];
    walk(path.join(ROOT, 'app'), files);
    const productImports: string[] = [];
    const shadowImports: string[] = [];
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      const key = rel(file);
      if (source.includes('truscoreEngine/bodyShadow')) shadowImports.push(key);
      if (source.includes('features/product')) productImports.push(key);
    }
    expect(shadowImports).toEqual([]);
    expect(productImports).toEqual(['app/result/[barcode].tsx']);
    const result = fs.readFileSync(path.join(ROOT, 'app/result/[barcode].tsx'), 'utf8');
    const productLines = result
      .split('\n')
      .filter((line) => line.includes('features/product'))
      .map((line) => line.replace(/\r$/, ''));
    expect(productLines).toEqual([
      "import { PalmOilCard } from '../../src/features/product/cards/PalmOilCard';",
    ]);
    expect(result.includes('ShareContentBuilder') || result.includes('ShareModal')).toBe(true);
  });

  it('keeps MVP runtime gates and the Palm Oil card off', () => {
    expect(MVP_RUNTIME).toEqual({
      legacyAlertsInsights: false,
      alertsTab: false,
      allergensUi: false,
      pricingUi: false,
      subscriptionAndPaywall: false,
      legacyPlanetCsvDatabases: false,
    });
    const palm = fs.readFileSync(
      path.join(ROOT, 'src/features/product/cards/PalmOilCard/PalmOilCard.tsx'),
      'utf8'
    );
    expect(palm).toContain('export const PALM_OIL_PRODUCT_CARD_VISIBLE = false');
  });

  it('does not retire the named H-13 source-text test files', () => {
    for (const file of SOURCE_TEXT_ANCHORS) {
      expect(fs.existsSync(path.join(ROOT, file))).toBe(true);
    }
  });
});
