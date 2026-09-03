/**
 * Wave 3 governed Score Highlights — deterministic selection evidence.
 *
 * Covers the locked S12/S12a controls: colour synthesis 1/2/3, the one-positive/one-negative
 * promotion cap, S12a completeness and eligibility exclusions, registry-driven tie-breaks and
 * the prohibition on description-string matching.
 */

import { selectScoreHighlights } from '../../../../lib/scoreHighlights/selectScoreHighlights';
import { firedLedgerFromAnalysis } from '../../../../lib/scoreHighlights/firedLedger';
import { BODY_COLOUR_SYNTHESIS_FAMILY } from '../../../../lib/scoreHighlights/bodyColourSynthesis';
import type { FiredAdjustment } from '../../../../lib/scoreHighlights/types';
import type { PillarAnalysis, TruScoreAnalysis } from '../../../../types/truscoreAnalysis';

function body(
  id: string,
  value: number,
  metadata?: Record<string, string | number | boolean>
): FiredAdjustment {
  return { pillar: 'Body', id, value, highlightEligible: true, metadata };
}

function fired(
  pillar: FiredAdjustment['pillar'],
  id: string,
  value: number,
  metadata?: Record<string, string | number | boolean>
): FiredAdjustment {
  return { pillar, id, value, highlightEligible: true, metadata };
}

/** Rows the scorer marks ineligible (rescues, normalisers, provenance-failed NOVA, neutrals). */
function ineligible(
  pillar: FiredAdjustment['pillar'],
  id: string,
  value: number
): FiredAdjustment {
  return { pillar, id, value, highlightEligible: false };
}

const KTC_META = { benchmarkYear: 2026, benchmarkScore: 24, benchmarkCompany: 'Example Foods' };
const BBFAW_META = { benchmarkYear: 2024, benchmarkCompany: 'Example Foods' };

describe('Body colour-warning synthesis', () => {
  it('replaces one fired colour with a single −3 presentation candidate bound to that ID', () => {
    const { byPillar } = selectScoreHighlights([body('body-v12-additive-e110', -3)]);

    expect(byPillar.Body).toHaveLength(1);
    const [story] = byPillar.Body;
    expect(story.storyKey).toBe(BODY_COLOUR_SYNTHESIS_FAMILY);
    expect(story.synthesisFamily).toBe(BODY_COLOUR_SYNTHESIS_FAMILY);
    expect(story.boundAdjustmentIds).toEqual(['body-v12-additive-e110']);
    expect(story.materiality).toBe(-3);
    expect(story.priority).toBe(9);
    expect(story.band).toBe('negative');
    expect(story.l1).toBe('EU/UK packs warn about children’s activity and attention');
    expect(story.l2).toContain('This product contains Sunset Yellow (E110), an industrially made');
    expect(story.l2).toContain('this colour in specified public-school foods');
  });

  it('uses the locked two-colour L2 and −6 presentation materiality', () => {
    const { byPillar } = selectScoreHighlights([
      body('body-v12-additive-e129', -3),
      body('body-v12-additive-e102', -3),
    ]);

    expect(byPillar.Body).toHaveLength(1);
    const [story] = byPillar.Body;
    expect(story.boundAdjustmentIds).toEqual([
      'body-v12-additive-e102',
      'body-v12-additive-e129',
    ]);
    expect(story.materiality).toBe(-6);
    expect(story.priority).toBe(4);
    expect(story.band).toBe('strong_negative');
    expect(story.l2).toContain('This product contains Tartrazine (E102) and Allura Red (E129)');
    expect(story.l2).toContain('prohibit both colours');
  });

  it('uses the locked three-colour L2 and −9 presentation materiality', () => {
    const { byPillar } = selectScoreHighlights([
      body('body-v12-additive-e129', -3),
      body('body-v12-additive-e110', -3),
      body('body-v12-additive-e102', -3),
    ]);

    expect(byPillar.Body).toHaveLength(1);
    const [story] = byPillar.Body;
    expect(story.boundAdjustmentIds).toEqual([
      'body-v12-additive-e102',
      'body-v12-additive-e110',
      'body-v12-additive-e129',
    ]);
    expect(story.materiality).toBe(-9);
    expect(story.priority).toBe(1);
    expect(story.l2).toContain(
      'This product contains Tartrazine (E102), Sunset Yellow (E110) and Allura Red (E129)'
    );
    expect(story.l2).toContain('prohibit these colours');
  });

  it('leaves non-family additives as their own independent stories', () => {
    const { byPillar } = selectScoreHighlights([
      body('body-v12-additive-e102', -3),
      body('body-v12-additive-e171', -3),
      body('body-v12-additive-e250', -6),
    ]);

    // −6 E250 first, then the two −3 stories by locked priority: E171 (8) before the
    // one-colour cluster (9).
    expect(byPillar.Body.map((s) => s.storyKey)).toEqual([
      'body-v12-additive-e250',
      'body-v12-additive-e171',
      BODY_COLOUR_SYNTHESIS_FAMILY,
    ]);
  });
});

describe('overall S12 promotion cap', () => {
  it('promotes at most one positive and one negative per pillar', () => {
    const { promoted } = selectScoreHighlights([
      body('body-v12-nutri-a', 7),
      body('body-v12-nova-2', 1),
      body('body-v12-additive-e250', -6),
      body('body-v12-additive-e171', -3),
      fired('Planet', 'planet-v19-environmental-e', -7),
      fired('Ethics', 'ethics-v37-cert-fairtrade', 6),
      fired('Ethics', 'ethics-v37-bbfaw-tier-3', 2, BBFAW_META),
      fired('Ethics', 'ethics-v37-ktc-21-30', -6, KTC_META),
      fired('Ethics', 'ethics-v37-bbfaw-impact-ef', -3, BBFAW_META),
      fired('Open', 'open-v15-ing-clarity-two', -4),
      fired('Open', 'open-v15-ing-clarity-zero', 1),
    ]);

    (['Body', 'Planet', 'Ethics', 'Open'] as const).forEach((pillar) => {
      const forPillar = promoted.filter((s) => s.pillar === pillar);
      expect(forPillar.filter((s) => s.sign === 'positive').length).toBeLessThanOrEqual(1);
      expect(forPillar.filter((s) => s.sign === 'negative').length).toBeLessThanOrEqual(1);
    });

    expect(promoted.map((s) => s.storyKey)).toEqual([
      // Body → Planet → Ethics → Open, more material first inside each pillar
      'body-v12-nutri-a',
      'body-v12-additive-e250',
      'planet-v19-environmental-e',
      // Fairtrade +6 and KTC 21–30 −6 are equally material, so locked priority decides:
      // the KTC negative row carries priority 3 against Fairtrade's 5.
      'ethics-v37-ktc-21-30',
      'ethics-v37-cert-fairtrade',
      'open-v15-ing-clarity-two',
      'open-v15-ing-clarity-zero',
    ]);
    promoted.forEach((story) => expect(story.promotedOverall).toBe(true));
  });

  it('leaves a side absent rather than padding when no eligible finding fired', () => {
    const { promoted } = selectScoreHighlights([fired('Planet', 'planet-v19-environmental-d', -3)]);

    expect(promoted).toHaveLength(1);
    expect(promoted[0].sign).toBe('negative');
  });

  it('renders nothing rather than manufacturing a story when the ledger has no eligible rows', () => {
    const { promoted, byPillar } = selectScoreHighlights([
      ineligible('Body', 'body-v12-nutri-unavailable', 0),
      ineligible('Open', 'open-v15-origins-insufficient', 0),
    ]);

    expect(promoted).toEqual([]);
    expect(byPillar.Body).toEqual([]);
    expect(byPillar.Open).toEqual([]);
  });
});

describe('S12a completeness and eligibility', () => {
  it('shows every eligible story for the pillar, including ones not promoted overall', () => {
    const { byPillar, promoted } = selectScoreHighlights([
      body('body-v12-nutri-d', -3),
      body('body-v12-nova-4', -6),
      body('body-v12-additive-e951', -3),
      body('body-v12-nova-2', 1),
    ]);

    expect(byPillar.Body.map((s) => s.storyKey)).toEqual([
      'body-v12-nova-4',
      'body-v12-nutri-d',
      'body-v12-additive-e951',
      'body-v12-nova-2',
    ]);
    expect(promoted.map((s) => s.storyKey)).toEqual(['body-v12-nova-4', 'body-v12-nova-2']);
  });

  it('excludes base rows, rescues, normalisers and ineligible NOVA provenance states', () => {
    const { byPillar, exclusions } = selectScoreHighlights([
      ineligible('Body', 'body-v12-base', 0),
      ineligible('Body', 'body-v12-whole-produce-rescue', 7),
      ineligible('Body', 'body-v12-nova-1-inferred', 3),
      ineligible('Body', 'body-v12-nova-1-unknown', 3),
      ineligible('Body', 'body-v12-additive-cap', 4),
      ineligible('Body', 'body-v12-red-additive-ceiling', -2),
      ineligible('Body', 'body-v12-final-floor', 1),
      ineligible('Ethics', 'ethics-v37-final-cap', -3),
      ineligible('Planet', 'planet-v19-packaging-neutral-evidence', 0),
      body('body-v12-nutri-e', -7),
    ]);

    expect(byPillar.Body.map((s) => s.storyKey)).toEqual(['body-v12-nutri-e']);
    expect(byPillar.Ethics).toEqual([]);
    expect(byPillar.Planet).toEqual([]);
    expect(exclusions.filter((e) => e.reason === 'registry_ineligible')).toHaveLength(9);
  });

  it('keeps eligible external NOVA 1 while excluding the inferred and unknown states', () => {
    const { byPillar } = selectScoreHighlights([
      body('body-v12-nova-1-off', 3, { nova1Provenance: 'off' }),
      ineligible('Body', 'body-v12-nova-1-inferred', 3),
      ineligible('Body', 'body-v12-nova-1-unknown', 3),
    ]);

    expect(byPillar.Body.map((s) => s.storyKey)).toEqual(['body-v12-nova-1-off']);
    expect(byPillar.Body[0].l1).toBe('Unprocessed or minimally processed');
  });

  it('fails closed on an unknown fired adjustment ID and on rows with no stable ID', () => {
    const { byPillar, exclusions } = selectScoreHighlights([
      { pillar: 'Body', id: 'body-v12-not-a-real-id', value: -5, highlightEligible: true },
      { pillar: 'Body', value: -4, highlightEligible: true },
      body('body-v12-nutri-c', -1),
    ]);

    expect(byPillar.Body.map((s) => s.storyKey)).toEqual(['body-v12-nutri-c']);
    expect(exclusions).toEqual(
      expect.arrayContaining([
        { pillar: 'Body', adjustmentId: 'body-v12-not-a-real-id', reason: 'unknown_registry_id' },
        { pillar: 'Body', adjustmentId: null, reason: 'no_stable_id' },
      ])
    );
  });
});

describe('locked tie-break determinism', () => {
  it('resolves the Ethics +6 three-way tie by locked registry priority', () => {
    const rows = [
      fired('Ethics', 'ethics-v37-cert-fairtrade', 6),
      fired('Ethics', 'ethics-v37-bbfaw-tier-1', 6, BBFAW_META),
      fired('Ethics', 'ethics-v37-ktc-71-80', 6, { ...KTC_META, benchmarkScore: 75 }),
    ];

    expect(selectScoreHighlights(rows).byPillar.Ethics.map((s) => s.storyKey)).toEqual([
      'ethics-v37-ktc-71-80',
      'ethics-v37-bbfaw-tier-1',
      'ethics-v37-cert-fairtrade',
    ]);
  });

  it('is independent of ledger array order', () => {
    const rows = [
      fired('Ethics', 'ethics-v37-cert-fairtrade', 6),
      fired('Ethics', 'ethics-v37-bbfaw-tier-1', 6, BBFAW_META),
      fired('Ethics', 'ethics-v37-ktc-71-80', 6, { ...KTC_META, benchmarkScore: 75 }),
    ];
    const expected = selectScoreHighlights(rows).byPillar.Ethics.map((s) => s.storyKey);

    [
      [rows[2], rows[0], rows[1]],
      [rows[1], rows[2], rows[0]],
      [...rows].reverse(),
    ].forEach((permutation) => {
      expect(selectScoreHighlights(permutation).byPillar.Ethics.map((s) => s.storyKey)).toEqual(
        expected
      );
    });
  });

  it('ranks Origins qualified/unquantified partial above two-term ingredient wording at −4', () => {
    const { byPillar, promoted } = selectScoreHighlights([
      fired('Open', 'open-v15-ing-clarity-two', -4, {
        termPresentationClass: 'coded',
        matchedTerms: 'E102|E110',
      }),
      fired('Open', 'open-v15-origins-qualified-partial', -4, {
        sourceStatement: 'local and imported',
      }),
    ]);

    expect(byPillar.Open.map((s) => s.storyKey)).toEqual([
      'open-v15-origins-qualified-partial',
      'open-v15-ing-clarity-two',
    ]);
    expect(promoted.map((s) => s.storyKey)).toEqual(['open-v15-origins-qualified-partial']);
  });

  it('ranks E250 above NOVA 4 and above the two-colour cluster at −6', () => {
    const { byPillar } = selectScoreHighlights([
      body('body-v12-nova-4', -6),
      body('body-v12-additive-e102', -3),
      body('body-v12-additive-e110', -3),
      body('body-v12-additive-e250', -6),
    ]);

    expect(byPillar.Body.map((s) => s.storyKey)).toEqual([
      'body-v12-additive-e250',
      BODY_COLOUR_SYNTHESIS_FAMILY,
      'body-v12-nova-4',
    ]);
  });

  it('ranks the two-colour cluster above NOVA 4 when E250 did not fire', () => {
    const { byPillar } = selectScoreHighlights([
      body('body-v12-nova-4', -6),
      body('body-v12-additive-e110', -3),
      body('body-v12-additive-e129', -3),
    ]);

    expect(byPillar.Body[0].storyKey).toBe(BODY_COLOUR_SYNTHESIS_FAMILY);
    expect(byPillar.Body[1].storyKey).toBe('body-v12-nova-4');
  });
});

describe('governed copy resolution', () => {
  it('resolves locked Ethics benchmark tokens from the fired-row metadata', () => {
    const { byPillar } = selectScoreHighlights([
      fired('Ethics', 'ethics-v37-ktc-21-30', -6, KTC_META),
    ]);

    expect(byPillar.Ethics[0].l2).toBe(
      'KnowTheChain’s 2026 Food & Beverage Benchmark scored this company 24/100 for its efforts ' +
        'to prevent and address forced-labour risks in its supply chains.'
    );
  });

  it('withholds a story whose locked template token cannot be resolved from metadata', () => {
    const { byPillar, exclusions } = selectScoreHighlights([
      fired('Ethics', 'ethics-v37-bbfaw-tier-6', -6),
    ]);

    expect(byPillar.Ethics).toEqual([]);
    expect(exclusions).toContainEqual({
      pillar: 'Ethics',
      adjustmentId: 'ethics-v37-bbfaw-tier-6',
      reason: 'unresolved_locked_copy_token',
    });
  });

  it('resolves the Planet jurisdiction token from the fired packaging row', () => {
    const { byPillar } = selectScoreHighlights([
      fired('Planet', 'planet-v19-packaging-all-kerbside', 2, { jurisdiction: 'NZ' }),
    ]);

    expect(byPillar.Planet[0].l2).toContain('In New Zealand, the packaging evidence');
    expect(byPillar.Planet[0].l2).not.toContain('[Australia/New Zealand]');
  });

  it('selects the locked organic claim-only copy from the evidence-class metadata', () => {
    const certified = selectScoreHighlights([
      fired('Ethics', 'ethics-v37-cert-organic', 2, { organicEvidenceClass: 'certified' }),
    ]).byPillar.Ethics[0];
    const claimOnly = selectScoreHighlights([
      fired('Ethics', 'ethics-v37-cert-organic', 2, { organicEvidenceClass: 'claim_only' }),
    ]).byPillar.Ethics[0];

    expect(certified.l1).toBe('Organic certified');
    expect(claimOnly.l1).toBe('Organic claim recognised');
    expect(claimOnly.l2).toBe(
      'An organic claim appears on this packet, but the packet does not show a specific organic certification.'
    );
  });
});

describe('Body additive in-app L3 routing', () => {
  it('routes Body additive stories to in-app About these additives when available', () => {
    const { byPillar } = selectScoreHighlights(
      [body('body-v12-additive-e171', -3)],
      { additivesL3Available: true }
    );
    expect(byPillar.Body[0].l3Route).toEqual({
      kind: 'in_app',
      target: 'additives',
      label: 'About these additives',
    });
  });

  it('falls back to no L3 route when in-app L3 is unavailable', () => {
    const { byPillar } = selectScoreHighlights([body('body-v12-additive-e171', -3)]);
    expect(byPillar.Body[0].l3Route).toBeUndefined();
  });
});

describe('Open Origins Product Origins L3 routing', () => {
  it('deep-links Open origins stories into the Product Origins experience when available', () => {
    const { byPillar } = selectScoreHighlights(
      [fired('Open', 'open-v15-origins-evidently-complete', 8, { singleIngredient: true, ingredient: 'Honey', country: 'New Zealand' })],
      { productOriginsL3Available: true }
    );
    expect(byPillar.Open[0].l3Route).toEqual({
      kind: 'in_app',
      target: 'product_origins',
      label: 'Product Origins',
    });
  });

  it('falls back to no L3 route when Product Origins deep-link is unavailable', () => {
    const { byPillar } = selectScoreHighlights([
      fired('Open', 'open-v15-origins-evidently-complete', 8, {
        singleIngredient: true,
        ingredient: 'Honey',
        country: 'New Zealand',
      }),
    ]);
    expect(byPillar.Open[0].l3Route).toBeUndefined();
  });
});

describe('Addendum v1.0 governed in-app L3 routing (no external substitute)', () => {
  const host = { additivesL3Available: true, productOriginsL3Available: true };

  const cases: Array<{
    pillar: 'Body' | 'Planet' | 'Ethics' | 'Open';
    id: string;
    value: number;
    target: string;
    meta?: Record<string, string | number | boolean>;
  }> = [
    { pillar: 'Body', id: 'body-v12-nutri-a', value: 7, target: 'nutri_score' },
    { pillar: 'Body', id: 'body-v12-nova-3', value: -3, target: 'nova' },
    { pillar: 'Body', id: 'body-v12-nova-4', value: -8, target: 'nova' },
    { pillar: 'Planet', id: 'planet-v19-environmental-b', value: 3, target: 'green_score' },
    {
      pillar: 'Planet',
      id: 'planet-v19-packaging-all-kerbside',
      value: 2,
      target: 'packaging',
      meta: { jurisdiction: 'AU', packagingComponentLabels: 'Bottle', packagingComponentDispositions: 'kerbside' },
    },
    { pillar: 'Ethics', id: 'ethics-v37-cert-fairtrade', value: 6, target: 'ethics_fairtrade' },
    { pillar: 'Ethics', id: 'ethics-v37-cert-rainforest-alliance', value: 6, target: 'ethics_rainforest' },
    { pillar: 'Ethics', id: 'ethics-v37-cert-msc', value: 4, target: 'ethics_msc' },
    { pillar: 'Ethics', id: 'ethics-v37-cert-asc', value: 4, target: 'ethics_asc' },
    {
      pillar: 'Ethics',
      id: 'ethics-v37-cert-organic',
      value: 2,
      target: 'ethics_organic',
      meta: { organicEvidenceClass: 'certified' },
    },
    {
      pillar: 'Ethics',
      id: 'ethics-v37-ktc-71-80',
      value: 6,
      target: 'ethics_ktc',
      meta: { benchmarkCompany: 'Example', benchmarkYear: 2026, benchmarkScore: 75 },
    },
    {
      pillar: 'Ethics',
      id: 'ethics-v37-bbfaw-tier-3',
      value: 6,
      target: 'ethics_bbfaw',
      meta: { benchmarkCompany: 'Example', benchmarkYear: 2024, tier: 3, impactRating: 'C' },
    },
    {
      pillar: 'Open',
      id: 'open-v15-ing-clarity-one',
      value: -2,
      target: 'ingredient_wording',
      meta: {
        termPresentationClass: 'broad_generic',
        termPresentationClasses: 'broad_generic',
        matchedTerms: 'natural flavours',
        market: 'AU',
      },
    },
    { pillar: 'Open', id: 'open-v15-ing-clarity-zero', value: 1, target: 'ingredient_wording' },
  ];

  it.each(cases)('routes $id to in-app $target', ({ pillar, id, value, target, meta }) => {
    const { byPillar } = selectScoreHighlights([fired(pillar, id, value, meta)], host);
    const story = byPillar[pillar][0];
    expect(story.l3Route?.kind).toBe('in_app');
    expect(story.l3Route && story.l3Route.kind === 'in_app' ? story.l3Route.target : null).toBe(
      target
    );
    expect(story.l3Route?.kind).not.toBe('external_source');
  });
});

describe('Open structured-metadata L2 variants', () => {
  it('uses locked broad one-term copy from metadata', () => {
    const { byPillar } = selectScoreHighlights([
      fired('Open', 'open-v15-ing-clarity-one', -2, {
        termPresentationClass: 'broad_generic',
        matchedTerms: 'natural flavours',
        market: 'NZ',
      }),
    ]);
    expect(byPillar.Open[0].l1).toBe('One ingredient term is vague');
    expect(byPillar.Open[0].l2).toContain('New Zealand food-labelling rules');
  });

  it('withholds clarity stories when metadata variant cannot be resolved', () => {
    const { byPillar, exclusions } = selectScoreHighlights([
      fired('Open', 'open-v15-ing-clarity-one', -2, {
        termPresentationClass: 'broad_generic',
        matchedTerms: 'natural flavours',
      }),
    ]);
    expect(byPillar.Open).toEqual([]);
    expect(exclusions.some((e) => e.reason === 'unresolved_locked_copy_token')).toBe(true);
  });
});

describe('no description-string matching', () => {
  function analysisPillar(
    pillarName: PillarAnalysis['pillarName'],
    adjustments: PillarAnalysis['adjustments']
  ): PillarAnalysis {
    return { pillarName, baseScore: 15, finalScore: 15, adjustments, dataSourcesUsed: [] };
  }

  it('resolves consumer copy from stable IDs even when descriptions are absent or misleading', () => {
    const analysis: TruScoreAnalysis = {
      barcode: '0000000000000',
      totalScore: 40,
      fetchTrace: [],
      pillars: {
        Body: analysisPillar('Body', [
          {
            description: 'Nutri-Score grade A (highest nutritional quality)',
            value: -7,
            type: 'negative',
            adjustmentId: 'body-v12-nutri-e',
            highlightEligible: true,
          },
        ]),
        Planet: analysisPillar('Planet', [
          {
            description: '',
            value: 7,
            type: 'positive',
            adjustmentId: 'planet-v19-environmental-a',
            highlightEligible: true,
          },
        ]),
        Ethics: analysisPillar('Ethics', []),
        Open: analysisPillar('Open', []),
      },
      generatedAt: 0,
    };

    const { byPillar } = selectScoreHighlights(firedLedgerFromAnalysis(analysis));

    expect(byPillar.Body[0].l1).toBe('E — lowest nutritional quality');
    expect(byPillar.Planet[0].l1).toBe('A — lower environmental impact');
  });

  it('never receives an adjustment description in the selection input', () => {
    const ledger = firedLedgerFromAnalysis({
      barcode: '1',
      totalScore: 0,
      fetchTrace: [],
      pillars: {
        Body: analysisPillar('Body', [
          {
            description: 'contains artificial colours',
            value: -3,
            type: 'negative',
            adjustmentId: 'body-v12-additive-e171',
            highlightEligible: true,
          },
        ]),
        Planet: analysisPillar('Planet', []),
        Ethics: analysisPillar('Ethics', []),
        Open: analysisPillar('Open', []),
      },
      generatedAt: 0,
    });

    ledger.forEach((row) => expect(Object.keys(row)).not.toContain('description'));
  });
});
