/**
 * Null-score integrity on the live Result path (Wave 3).
 *
 * The Result screen used to coerce every persisted pillar with `?? 0` before handing the breakdown
 * to `TruScoreResult`, which turned "no usable pillar score" into the substantive claim `0/25`.
 * That coercion is removed; `resultPillarBreakdown` is now the single Result-path mapping and
 * `app/result/[barcode].tsx` calls it directly.
 *
 * These assertions run against the real Result-path module and the real downstream consumer and
 * share services, not a test-local reimplementation of any of them. Component rendering is
 * asserted at source level because this project has no React Native renderer in the Jest setup.
 *
 * Score-neutral: no pillar arithmetic, thresholds or eligibility is exercised or changed.
 */

import * as fs from 'fs';
import * as path from 'path';
import { resultPillarBreakdown } from '../../../utils/resultPillarBreakdown';
import { getTruScoreConsumerPresentation } from '../../../utils/truScorePresentation';
import {
  resolveGenuinePillarBreakdown,
  resolveShareBreakdownForOverall,
} from '../../../utils/shareScoreSemantics';
import { getShareCardData, generateShareMessage } from '../../../services/shareCardGenerator';
import { ShareContentBuilder } from '../../../features/sharing/services/ShareContentBuilder';
import type { TruScoreResult } from '../../../lib/truscoreEngine';
import type { ProductWithTrustScore } from '../../../types/product';

const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..');
const RESULT_SCREEN_SOURCE = fs.readFileSync(
  path.join(REPO_ROOT, 'app', 'result', '[barcode].tsx'),
  'utf8'
);
const TRUSCORE_COMPONENT_SOURCE = fs.readFileSync(
  path.join(REPO_ROOT, 'src', 'components', 'TruScore.tsx'),
  'utf8'
);
const LOOK_THROUGH_SOURCE = fs.readFileSync(
  path.join(REPO_ROOT, 'src', 'components', 'ScoreHighlightsLookThroughModal.tsx'),
  'utf8'
);

const product = {
  barcode: '9300000000002',
  product_name: 'Null Pillar Cereal',
  brands: 'Test',
  ingredients_text: 'Wheat.',
  nutriments: {},
  trust_score: 48,
  trust_score_breakdown: null,
} as unknown as ProductWithTrustScore;

/** Persisted breakdown as it actually arrives when a pillar could not be assessed. */
const PERSISTED_WITH_NULL_PILLARS = {
  body: 18,
  planet: null,
  ethics: 0,
  open: undefined,
} as const;

function resultTruScore(overrides?: Partial<TruScoreResult>): TruScoreResult {
  return {
    truscore: 48,
    breakdown: resultPillarBreakdown(PERSISTED_WITH_NULL_PILLARS),
    ...overrides,
  };
}

describe('Result path preserves null pillars end-to-end', () => {
  it('the Result screen no longer coerces persisted pillars and delegates to the shared mapping', () => {
    expect(RESULT_SCREEN_SOURCE).not.toMatch(/trust_score_breakdown\.(body|planet|ethics|open)\s*\?\?\s*0/);
    expect(RESULT_SCREEN_SOURCE).toContain(
      'breakdown: resultPillarBreakdown(product.trust_score_breakdown)'
    );
    expect(RESULT_SCREEN_SOURCE).toContain(
      "import { resultPillarBreakdown } from '../../src/utils/resultPillarBreakdown'"
    );
  });

  it('carries an unavailable pillar into TruScore as null, and a genuine 0 as 0', () => {
    const breakdown = resultTruScore().breakdown;

    expect(breakdown.Planet).toBeNull();
    expect(breakdown.Open).toBeNull();
    expect(breakdown.Body).toBe(18);
    // A genuine zero is a real substantive score and must survive untouched.
    expect(breakdown.Ethics).toBe(0);
    expect(breakdown.Planet).not.toBe(0);
    expect(breakdown.Open).not.toBe(0);
  });

  it('treats a wholly missing persisted breakdown as four null pillars, not four zeros', () => {
    expect(resultPillarBreakdown(null)).toEqual({
      Body: null,
      Planet: null,
      Ethics: null,
      Open: null,
    });
    expect(resultPillarBreakdown(undefined)).toEqual({
      Body: null,
      Planet: null,
      Ethics: null,
      Open: null,
    });
  });

  it('does not resurrect a null pillar from NaN', () => {
    expect(resultPillarBreakdown({ body: Number.NaN }).Body).toBeNull();
  });
});

describe('Result surfaces never show a null pillar as 0 or 0/25', () => {
  it('the pillar bars render an em dash rather than a coerced zero', () => {
    // TruScore.tsx is the Result pillar-bar surface; it must branch on the null before any maths.
    const guardStart = TRUSCORE_COMPONENT_SOURCE.indexOf("if (typeof value !== 'number'");
    const numericStart = TRUSCORE_COMPONENT_SOURCE.indexOf('const rowContent');
    expect(guardStart).toBeGreaterThan(-1);
    expect(numericStart).toBeGreaterThan(guardStart);

    const nullBranch = TRUSCORE_COMPONENT_SOURCE.slice(guardStart, numericStart);
    expect(nullBranch).toContain('>\u2014</Text>');
    expect(nullBranch).not.toContain('/25');
    expect(nullBranch).not.toContain('getPillarColor');

    // The `/25` render and the bar width maths sit only inside the numeric branch.
    expect(TRUSCORE_COMPONENT_SOURCE).toContain('{value}/25');
    expect(TRUSCORE_COMPONENT_SOURCE).not.toMatch(/breakdown\[pillar\]\s*\?\?\s*0/);
  });

  it('the pillar look-through header omits the score line when the pillar score is null', () => {
    expect(LOOK_THROUGH_SOURCE).toContain('pillarScore != null');
    expect(LOOK_THROUGH_SOURCE).not.toMatch(/pillarScore\s*\?\?\s*0/);
  });

  it('an unavailable overall still presents as unavailable, not as zero', () => {
    const presentation = getTruScoreConsumerPresentation(
      resultTruScore({ truscore: null, scoringUnavailable: true })
    );
    expect(presentation.kind).toBe('unavailable');
    if (presentation.kind !== 'unavailable') return;
    expect(presentation.forbiddenConsumerTokens).toEqual(
      expect.arrayContaining(['0/25', '0/100'])
    );
  });

  it('a scored overall with a null pillar stays scored without fabricating the null pillar', () => {
    const presentation = getTruScoreConsumerPresentation(resultTruScore());
    expect(presentation.kind).toBe('scored');
    if (presentation.kind !== 'scored') return;
    expect(presentation.score).toBe(48);
  });
});

describe('Share of a Result with a null pillar omits the breakdown', () => {
  const tru = resultTruScore();

  it('the live share semantics refuse an incomplete pillar set', () => {
    expect(resolveGenuinePillarBreakdown(tru, product)).toBeNull();
    expect(resolveShareBreakdownForOverall(48, tru, product)).toBeNull();
  });

  it('the live share card and content builder emit no 0/25 pillar line', () => {
    const cardData = getShareCardData(product, tru);
    expect(cardData.truScore).toBe(48);
    expect(cardData.breakdown).toBeUndefined();

    const message = generateShareMessage(product, tru);
    expect(message).toContain('48/100');
    expect(message).not.toMatch(/\b0\/25\b/);
    expect(message).not.toMatch(/Breakdown:/);

    const content = ShareContentBuilder.buildContent({
      product: product as never,
      truScore: tru as never,
      item: 'truScore',
    });
    expect(content.message).not.toMatch(/\b0\/25\b/);
    expect(content.message).not.toMatch(/• Body: /);
  });

  it('a fully genuine breakdown, including a real 0, still shares', () => {
    const genuine = resultTruScore({
      breakdown: resultPillarBreakdown({ body: 18, planet: 0, ethics: 15, open: 15 }),
    });
    const cardData = getShareCardData(product, genuine);
    expect(cardData.breakdown).toEqual({ Body: 18, Planet: 0, Ethics: 15, Open: 15 });
    expect(generateShareMessage(product, genuine)).toContain('Planet: 0/25');
  });
});
