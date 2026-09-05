/**
 * Closed-set pipeline-resolved L1/L2 regression for every Highlight-eligible ID and authorised
 * commentary variant (Wave 3 copy-fidelity corrective, TECH-020).
 *
 * The oracle is the hand-authored founder contract in
 * `src/__tests__/fixtures/scoreHighlights/literalCopyContract.v05.ts`, transcribed from the
 * 5 September 2026 Score Highlights documents. `resolveGovernedCopy()`, the pillar registries and
 * every other runtime copy helper are deliberately excluded from expectation-building here: the
 * previous version of this suite compared `selectScoreHighlights` output against
 * `resolveGovernedCopy` output, so both sides moved together and no drift could ever fail.
 *
 * The registries are still imported, but only to prove all-eligible set equality: a newly
 * Highlight-eligible ID with no contract entry must fail.
 *
 * Latent Open Origins IDs remain mvpUnreachable in the scorer; they are exercised here as
 * synthetic fired rows so locked copy cannot drift.
 */

import * as fs from 'fs';
import * as path from 'path';
import { BODY_V12_ADJUSTMENT_REGISTRY } from '../../../../lib/truscoreEngine/pillars/bodyPillarV12Registry';
import { PLANET_V19_ADJUSTMENT_REGISTRY } from '../../../../lib/truscoreEngine/pillars/planetPillarV19Registry';
import { ETHICS_V37_ADJUSTMENT_REGISTRY } from '../../../../lib/truscoreEngine/pillars/ethicsPillarV37Registry';
import {
  OPEN_V15_ADJUSTMENT_REGISTRY,
  OPEN_V15_MVP_UNREACHABLE_ORIGINS_IDS,
} from '../../../../lib/truscoreEngine/pillars/openPillarV15Registry';
import { selectScoreHighlights } from '../../../../lib/scoreHighlights/selectScoreHighlights';
import type { FiredAdjustment } from '../../../../lib/scoreHighlights/types';
import {
  CONTRACT_COVERED_ELIGIBLE_KEYS,
  GLYPH_NORMALISED_CONTRACT_KEYS,
  INSTRUCTION_DERIVED_CONTRACT_KEYS,
  LITERAL_COPY_CONTRACT,
  normaliseGovernedTypography,
  type LiteralCopyContractEntry,
} from '../../../fixtures/scoreHighlights/literalCopyContract.v05';

const CONTRACT_FIXTURE_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '__tests__',
  'fixtures',
  'scoreHighlights',
  'literalCopyContract.v05.ts'
);

function firedRows(entry: LiteralCopyContractEntry): FiredAdjustment[] {
  return entry.fired.map((row) => ({
    pillar: entry.pillar,
    id: row.id,
    value: row.value,
    highlightEligible: true,
    ...(row.metadata && { metadata: row.metadata }),
  }));
}

function resolveThroughPipeline(entry: LiteralCopyContractEntry) {
  const { byPillar } = selectScoreHighlights(firedRows(entry));
  return byPillar[entry.pillar][0];
}

function eligibleKeys(
  pillar: string,
  registry: Record<string, { highlightEligible: boolean }>
): string[] {
  return Object.entries(registry)
    .filter(([, row]) => row.highlightEligible)
    .map(([id]) => `${pillar}:${id}`);
}

const REGISTRY_ELIGIBLE_KEYS = [
  ...eligibleKeys('Body', BODY_V12_ADJUSTMENT_REGISTRY),
  ...eligibleKeys('Planet', PLANET_V19_ADJUSTMENT_REGISTRY),
  ...eligibleKeys('Ethics', ETHICS_V37_ADJUSTMENT_REGISTRY),
  ...eligibleKeys('Open', OPEN_V15_ADJUSTMENT_REGISTRY),
].sort();

/** Founder authoring tokens. None may survive into consumer copy. */
const UNRESOLVED_TOKEN = /\[[^\]]+\]/;

describe('literal copy contract — oracle independence', () => {
  it('the contract fixture does not import any runtime copy source', () => {
    const source = fs.readFileSync(CONTRACT_FIXTURE_PATH, 'utf8');
    const imports = source.match(/^import[\s\S]*?from '[^']+';$/gm) ?? [];

    // The only permitted import is the pillar string-union type, which carries no copy.
    expect(imports).toEqual(["import type { ScoreHighlightPillar } from '../../../lib/scoreHighlights/types';"]);

    for (const banned of [
      'governedCommentary',
      'openGovernedCopy',
      'bodyColourSynthesis',
      'selectScoreHighlights',
      'contextualContributionPrompts',
      'Registry',
    ]) {
      expect(source).not.toContain(`from '../../../lib/scoreHighlights/${banned}'`);
      expect(source).not.toContain(banned === 'Registry' ? 'truscoreEngine/pillars' : `require('${banned}`);
    }
  });

  it('covers every Highlight-eligible registry ID, and only those', () => {
    expect(CONTRACT_COVERED_ELIGIBLE_KEYS).toEqual(REGISTRY_ELIGIBLE_KEYS);
  });

  it('has a unique key per ID/variant pair', () => {
    const keys = LITERAL_COPY_CONTRACT.map((entry) => entry.contractKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps instruction-derived rows to the locked exception list', () => {
    expect(INSTRUCTION_DERIVED_CONTRACT_KEYS).toEqual([
      'Open:open-v15-ing-clarity-three-plus:broad_generic',
      'Open:open-v15-origins-qualified-partial',
    ]);
  });

  it('does not make latent Open Origins states reachable in the OFF MVP scorer registry', () => {
    expect([...OPEN_V15_MVP_UNREACHABLE_ORIGINS_IDS].sort()).toEqual(
      [
        'open-v15-origins-pct-95-99',
        'open-v15-origins-pct-76-94',
        'open-v15-origins-pct-50-75',
        'open-v15-origins-pct-25-49',
        'open-v15-origins-pct-1-24',
        'open-v15-origins-qualified-partial',
        'open-v15-origins-packet-gap',
      ].sort()
    );
  });
});

describe('closed-set pipeline-resolved L1/L2 equals the independent literal contract', () => {
  it.each(
    LITERAL_COPY_CONTRACT.map(
      (entry) => [entry.contractKey, entry] as [string, LiteralCopyContractEntry]
    )
  )('%s', (_key, entry) => {
    const story = resolveThroughPipeline(entry);

    expect(story).toBeDefined();
    expect(story.storyKey).toBe(entry.storyKey);
    expect(story.boundAdjustmentIds).toEqual([...entry.eligibleIds].sort());

    expect(normaliseGovernedTypography(story.l1)).toBe(normaliseGovernedTypography(entry.l1));
    expect(normaliseGovernedTypography(story.l2)).toBe(normaliseGovernedTypography(entry.l2));

    expect(story.l1).not.toMatch(UNRESOLVED_TOKEN);
    expect(story.l2).not.toMatch(UNRESOLVED_TOKEN);
  });

  it('only the locked set of rows differs from the founder text by apostrophe/quote glyph', () => {
    const glyphOnly = LITERAL_COPY_CONTRACT.filter((entry) => {
      const story = resolveThroughPipeline(entry);
      const strictlyEqual = story.l1 === entry.l1 && story.l2 === entry.l2;
      const normalisedEqual =
        normaliseGovernedTypography(story.l1) === normaliseGovernedTypography(entry.l1) &&
        normaliseGovernedTypography(story.l2) === normaliseGovernedTypography(entry.l2);
      return !strictlyEqual && normalisedEqual;
    })
      .map((entry) => entry.contractKey)
      .sort();

    expect(glyphOnly).toEqual([...GLYPH_NORMALISED_CONTRACT_KEYS]);
  });

  it('resolves the founder template tokens rather than echoing them', () => {
    for (const entry of LITERAL_COPY_CONTRACT) {
      if (!UNRESOLVED_TOKEN.test(entry.l1Template) && !UNRESOLVED_TOKEN.test(entry.l2Template)) {
        continue;
      }
      const story = resolveThroughPipeline(entry);
      expect(story.l1).not.toMatch(UNRESOLVED_TOKEN);
      expect(story.l2).not.toMatch(UNRESOLVED_TOKEN);
    }
  });
});

describe('governed token binding fails closed', () => {
  function fired(
    pillar: FiredAdjustment['pillar'],
    id: string,
    value: number,
    metadata?: Record<string, string | number | boolean>
  ): FiredAdjustment {
    return { pillar, id, value, highlightEligible: true, metadata };
  }

  it('withholds qualified-partial origins without a packet statement', () => {
    const { byPillar, exclusions } = selectScoreHighlights([
      fired('Open', 'open-v15-origins-qualified-partial', -4),
    ]);
    expect(byPillar.Open).toEqual([]);
    expect(exclusions).toContainEqual({
      pillar: 'Open',
      adjustmentId: 'open-v15-origins-qualified-partial',
      reason: 'unresolved_locked_copy_token',
    });
  });

  it('withholds the KTC story when no benchmarked company can be named', () => {
    const { byPillar, exclusions } = selectScoreHighlights([
      fired('Ethics', 'ethics-v37-ktc-21-30', -6, { benchmarkYear: 2026, benchmarkScore: 24 }),
    ]);
    expect(byPillar.Ethics).toEqual([]);
    expect(exclusions).toContainEqual({
      pillar: 'Ethics',
      adjustmentId: 'ethics-v37-ktc-21-30',
      reason: 'unresolved_locked_copy_token',
    });
  });

  it('withholds the KTC story when the benchmark year cannot be established', () => {
    const { byPillar, exclusions } = selectScoreHighlights([
      fired('Ethics', 'ethics-v37-ktc-0-10', -10, {
        benchmarkCompany: 'Example Foods',
        benchmarkScore: 3,
      }),
    ]);
    expect(byPillar.Ethics).toEqual([]);
    expect(exclusions).toContainEqual({
      pillar: 'Ethics',
      adjustmentId: 'ethics-v37-ktc-0-10',
      reason: 'unresolved_locked_copy_token',
    });
  });

  it('withholds an ingredient-clarity story when the governed variant cannot be resolved', () => {
    const { byPillar, exclusions } = selectScoreHighlights([
      fired('Open', 'open-v15-ing-clarity-one', -2, {
        termPresentationClass: 'broad_generic',
      }),
    ]);
    expect(byPillar.Open).toEqual([]);
    expect(exclusions).toContainEqual({
      pillar: 'Open',
      adjustmentId: 'open-v15-ing-clarity-one',
      reason: 'unresolved_locked_copy_token',
    });
  });

  it('withholds packaging copy when no active jurisdiction is bound', () => {
    const { byPillar, exclusions } = selectScoreHighlights([
      fired('Planet', 'planet-v19-packaging-all-kerbside', 2),
    ]);
    expect(byPillar.Planet).toEqual([]);
    expect(exclusions).toContainEqual({
      pillar: 'Planet',
      adjustmentId: 'planet-v19-packaging-all-kerbside',
      reason: 'unresolved_locked_copy_token',
    });
  });
});
