/**
 * Closed-set pipeline-resolved L1/L2 regression for every Highlight-eligible ID
 * and authorised commentary variant (Wave 3 copy-fidelity corrective).
 *
 * Asserts selectScoreHighlights output, not registry fields in isolation.
 * Latent Open Origins IDs remain mvpUnreachable in the scorer; they are exercised
 * here only as synthetic fired rows so locked copy cannot drift.
 */

import { BODY_V12_ADJUSTMENT_REGISTRY } from '../../../../lib/truscoreEngine/pillars/bodyPillarV12Registry';
import { PLANET_V19_ADJUSTMENT_REGISTRY } from '../../../../lib/truscoreEngine/pillars/planetPillarV19Registry';
import { ETHICS_V37_ADJUSTMENT_REGISTRY } from '../../../../lib/truscoreEngine/pillars/ethicsPillarV37Registry';
import {
  OPEN_V15_ADJUSTMENT_REGISTRY,
  OPEN_V15_MVP_UNREACHABLE_ORIGINS_IDS,
} from '../../../../lib/truscoreEngine/pillars/openPillarV15Registry';
import {
  BODY_COLOUR_SYNTHESIS_FAMILY,
  BODY_COLOUR_SYNTHESIS_L1,
  bodyColourSynthesisL2,
} from '../../../../lib/scoreHighlights/bodyColourSynthesis';
import { resolveGovernedCopy } from '../../../../lib/scoreHighlights/governedCommentary';
import { selectScoreHighlights } from '../../../../lib/scoreHighlights/selectScoreHighlights';
import type { FiredAdjustment, ScoreHighlightPillar } from '../../../../lib/scoreHighlights/types';

const ORIGINS_COMPLETE_L1 = 'Ingredient origins appear fully accounted for';
const ORIGINS_COMPLETE_L2 =
  'The available origin information appears to account for the relevant ingredient sourcing, with no material remainder left unexplained.';
const CLARITY_ZERO_L1 = 'Ingredient wording is clear where assessed';
const CLARITY_ZERO_L2 =
  'In the ingredient list we could assess, we did not find any of the broad, generic or code-dependent terms we check for. That does not mean every detail about the product is disclosed.';
const PACKET_GAP_L1 = 'No clear origin statement found';
const PACKET_GAP_L2 =
  'This packet was checked and no clear ingredient-origin information was found, leaving the product’s origins unclear.';

function fired(
  pillar: ScoreHighlightPillar,
  id: string,
  value: number,
  metadata?: Record<string, string | number | boolean>
): FiredAdjustment {
  return { pillar, id, value, highlightEligible: true, metadata };
}

function eligibleIds(
  registry: Record<string, { highlightEligible: boolean }>
): string[] {
  return Object.entries(registry)
    .filter(([, row]) => row.highlightEligible)
    .map(([id]) => id)
    .sort();
}

const ALL_ELIGIBLE = [
  ...eligibleIds(BODY_V12_ADJUSTMENT_REGISTRY).map((id) => `Body:${id}`),
  ...eligibleIds(PLANET_V19_ADJUSTMENT_REGISTRY).map((id) => `Planet:${id}`),
  ...eligibleIds(ETHICS_V37_ADJUSTMENT_REGISTRY).map((id) => `Ethics:${id}`),
  ...eligibleIds(OPEN_V15_ADJUSTMENT_REGISTRY).map((id) => `Open:${id}`),
];

const KTC_META = { benchmarkYear: 2026, benchmarkScore: 24, benchmarkCompany: 'Example Foods' };
const BBFAW_META = { benchmarkYear: 2024, benchmarkCompany: 'Example Foods' };

describe('closed-set pipeline-resolved L1/L2', () => {
  it('does not make latent Open Origins states reachable in the OFF MVP scorer registry', () => {
    expect(OPEN_V15_MVP_UNREACHABLE_ORIGINS_IDS.sort()).toEqual(
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

  describe('D-1 Open +8 evidently complete (single-ingredient override removed)', () => {
    it('resolves the locked v0.4 copy with single-ingredient provenance metadata still present', () => {
      const { byPillar } = selectScoreHighlights([
        fired('Open', 'open-v15-origins-evidently-complete', 8, {
          singleIngredient: true,
          ingredient: 'Honey',
          country: 'New Zealand',
        }),
      ]);
      expect(byPillar.Open[0].l1).toBe(ORIGINS_COMPLETE_L1);
      expect(byPillar.Open[0].l2).toBe(ORIGINS_COMPLETE_L2);
      expect(byPillar.Open[0].metadata?.singleIngredient).toBe(true);
      expect(byPillar.Open[0].metadata?.ingredient).toBe('Honey');
    });

    it('resolves the same locked copy without single-ingredient metadata', () => {
      const { byPillar } = selectScoreHighlights([
        fired('Open', 'open-v15-origins-evidently-complete', 8),
      ]);
      expect(byPillar.Open[0].l1).toBe(ORIGINS_COMPLETE_L1);
      expect(byPillar.Open[0].l2).toBe(ORIGINS_COMPLETE_L2);
    });
  });

  describe('D-2 Open clarity-zero', () => {
    it('resolves the locked v0.4 strings', () => {
      const { byPillar } = selectScoreHighlights([
        fired('Open', 'open-v15-ing-clarity-zero', 1),
      ]);
      expect(byPillar.Open[0].l1).toBe(CLARITY_ZERO_L1);
      expect(byPillar.Open[0].l2).toBe(CLARITY_ZERO_L2);
    });
  });

  describe('D-3 Open Origins latent registry copy', () => {
    it.each([
      ['open-v15-origins-pct-95-99', 4, 97, 3, '97% of ingredient sourcing disclosed'],
      ['open-v15-origins-pct-76-94', -1, 80, 20, '20% of ingredient sourcing is unspecified'],
      ['open-v15-origins-pct-50-75', -3, 60, 40, '40% of ingredient sourcing is unspecified'],
      ['open-v15-origins-pct-25-49', -5, 30, 70, '70% of ingredient sourcing is unspecified'],
      ['open-v15-origins-pct-1-24', -7, 10, 90, '90% of ingredient sourcing is unspecified'],
    ] as const)('%s resolves locked percentage copy', (id, value, accounted, remainder, l1) => {
      const { byPillar } = selectScoreHighlights([
        fired('Open', id, value, { accountedPercent: accounted, remainderPercent: remainder }),
      ]);
      expect(byPillar.Open[0].l1).toBe(l1);
      if (id === 'open-v15-origins-pct-95-99') {
        expect(byPillar.Open[0].l2).toBe(
          `The origin information accounts for ${accounted}% of ingredient sourcing, leaving only a small remainder unspecified.`
        );
      } else {
        expect(byPillar.Open[0].l2).toBe(
          `The origin statement identifies ${accounted}% of ingredient sourcing. It doesn’t say where the remaining ${remainder}% comes from.`
        );
      }
    });

    it('resolves qualified-partial from the packet statement token', () => {
      const { byPillar } = selectScoreHighlights([
        fired('Open', 'open-v15-origins-qualified-partial', -4, {
          sourceStatement: 'local and imported',
        }),
      ]);
      expect(byPillar.Open[0].l1).toBe('Origin information is only partly specific');
      expect(byPillar.Open[0].l2).toBe(
        'The origin statement says “local and imported”, but doesn’t identify where all ingredients come from or how much comes from each source.'
      );
    });

    it('fail-closes qualified-partial without a packet statement', () => {
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

    it('resolves packet-gap locked copy', () => {
      const { byPillar } = selectScoreHighlights([
        fired('Open', 'open-v15-origins-packet-gap', -8),
      ]);
      expect(byPillar.Open[0].l1).toBe(PACKET_GAP_L1);
      expect(byPillar.Open[0].l2).toBe(PACKET_GAP_L2);
    });
  });

  describe('D-4 / D-5 KTC year binding', () => {
    it('binds the displayed year and company from the fired governed record metadata', () => {
      const { byPillar } = selectScoreHighlights([
        fired('Ethics', 'ethics-v37-ktc-21-30', -6, KTC_META),
      ]);
      expect(byPillar.Ethics[0].l2).toBe(
        'KnowTheChain’s 2026 Food & Beverage Benchmark scored Example Foods 24/100 for its efforts ' +
          'to prevent and address forced-labour risks in its supply chains.'
      );
    });

    it('keeps the Product owner L1 attribution only when entity resolution proves ownership', () => {
      const owned = selectScoreHighlights([
        fired('Ethics', 'ethics-v37-ktc-21-30', -6, {
          ...KTC_META,
          benchmarkEntityRole: 'product_owner',
        }),
      ]).byPillar.Ethics[0];
      expect(owned.l1).toBe(
        'Product owner: 24/100 in independent forced-labour safeguards benchmark'
      );

      const unproven = selectScoreHighlights([
        fired('Ethics', 'ethics-v37-ktc-21-30', -6, KTC_META),
      ]).byPillar.Ethics[0];
      expect(unproven.l1).toBe(
        'Example Foods: 24/100 in independent forced-labour safeguards benchmark'
      );
      expect(unproven.l1).not.toContain('Product owner');
    });

    it('fail-closes the KTC L1 attribution when no benchmarked company can be named', () => {
      const { byPillar, exclusions } = selectScoreHighlights([
        fired('Ethics', 'ethics-v37-ktc-21-30', -6, {
          benchmarkYear: 2026,
          benchmarkScore: 24,
        }),
      ]);
      expect(byPillar.Ethics).toEqual([]);
      expect(exclusions).toContainEqual({
        pillar: 'Ethics',
        adjustmentId: 'ethics-v37-ktc-21-30',
        reason: 'unresolved_locked_copy_token',
      });
    });

    it('fail-closes when the KTC year cannot be established', () => {
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
  });

  const OPEN_CLARITY_VARIANTS: Array<{
    id: string;
    value: number;
    meta: Record<string, string | number | boolean>;
    l1: string;
  }> = [
    {
      id: 'open-v15-ing-clarity-one',
      value: -2,
      meta: { termPresentationClass: 'broad_generic', matchedTerms: 'natural flavours', market: 'AU' },
      l1: 'One ingredient term is vague',
    },
    {
      id: 'open-v15-ing-clarity-one',
      value: -2,
      meta: { termPresentationClass: 'coded', matchedTerms: 'E102', decodedAdditiveNames: 'Tartrazine' },
      l1: 'One ingredient needs decoding',
    },
    {
      id: 'open-v15-ing-clarity-two',
      value: -4,
      meta: { termPresentationClass: 'broad_generic', matchedTerms: 'natural flavours|spices' },
      l1: 'Two ingredient terms are vague',
    },
    {
      id: 'open-v15-ing-clarity-two',
      value: -4,
      meta: { termPresentationClass: 'coded', matchedTerms: 'E102|E110' },
      l1: 'Two ingredients need decoding',
    },
    {
      id: 'open-v15-ing-clarity-two',
      value: -4,
      meta: { termPresentationClass: 'mixed', matchedTerms: 'natural flavours|E102' },
      l1: 'Some ingredient wording needs explanation',
    },
    {
      id: 'open-v15-ing-clarity-three-plus',
      value: -6,
      meta: { termPresentationClass: 'broad_generic', matchedTerms: 'natural flavours|spices|vegetable oil' },
      l1: 'Several ingredient terms are vague',
    },
    {
      id: 'open-v15-ing-clarity-three-plus',
      value: -6,
      meta: { termPresentationClass: 'coded', matchedTerms: 'E102|E110|E129' },
      l1: 'Several ingredients need decoding',
    },
    {
      id: 'open-v15-ing-clarity-three-plus',
      value: -6,
      meta: { termPresentationClass: 'mixed', matchedTerms: 'natural flavours|E102|spices' },
      l1: 'Several ingredient terms need explanation',
    },
  ];

  it.each(OPEN_CLARITY_VARIANTS)('Open authorised clarity variant $id / $l1', ({ id, value, meta, l1 }) => {
    const { byPillar } = selectScoreHighlights([fired('Open', id, value, meta)]);
    expect(byPillar.Open[0].l1).toBe(l1);
    expect(byPillar.Open[0].l2).not.toMatch(/\[[^\]]+\]/);
  });

  it('covers every Highlight-eligible registry ID through the pipeline', () => {
    const covered = new Set<string>();

    const mark = (pillar: ScoreHighlightPillar, id: string) => covered.add(`${pillar}:${id}`);

    for (const [id, row] of Object.entries(BODY_V12_ADJUSTMENT_REGISTRY)) {
      if (!row.highlightEligible) continue;
      if (id === 'body-v12-additive-e102' || id === 'body-v12-additive-e110' || id === 'body-v12-additive-e129') {
        const { byPillar } = selectScoreHighlights([fired('Body', id, row.points)]);
        expect(byPillar.Body[0].storyKey).toBe(BODY_COLOUR_SYNTHESIS_FAMILY);
        expect(byPillar.Body[0].boundAdjustmentIds).toEqual([id]);
        expect(byPillar.Body[0].l1).toBe(BODY_COLOUR_SYNTHESIS_L1);
        expect(byPillar.Body[0].l2).toBe(bodyColourSynthesisL2([id]));
        mark('Body', id);
        continue;
      }
      const copy = resolveGovernedCopy('Body', id, undefined);
      const { byPillar } = selectScoreHighlights([fired('Body', id, row.points)]);
      expect(byPillar.Body[0].l1).toBe(copy?.l1);
      expect(byPillar.Body[0].l2).toBe(copy?.l2);
      mark('Body', id);
    }

    for (const [id, row] of Object.entries(PLANET_V19_ADJUSTMENT_REGISTRY)) {
      if (!row.highlightEligible) continue;
      const meta = id.startsWith('planet-v19-packaging-') ? { jurisdiction: 'AU' } : undefined;
      const copy = resolveGovernedCopy('Planet', id, meta);
      const { byPillar } = selectScoreHighlights([fired('Planet', id, row.points, meta)]);
      expect(byPillar.Planet[0].l1).toBe(copy?.l1);
      expect(byPillar.Planet[0].l2).toBe(copy?.l2);
      expect(byPillar.Planet[0].l2).not.toMatch(/\[[^\]]+\]/);
      mark('Planet', id);
    }

    for (const [id, row] of Object.entries(ETHICS_V37_ADJUSTMENT_REGISTRY)) {
      if (!row.highlightEligible) continue;
      const meta = id.startsWith('ethics-v37-ktc-')
        ? KTC_META
        : id.startsWith('ethics-v37-bbfaw-')
          ? BBFAW_META
          : id === 'ethics-v37-cert-organic'
            ? { organicEvidenceClass: 'certified' }
            : undefined;
      const copy = resolveGovernedCopy('Ethics', id, meta);
      const { byPillar } = selectScoreHighlights([fired('Ethics', id, row.points, meta)]);
      expect(byPillar.Ethics[0].l1).toBe(copy?.l1);
      expect(byPillar.Ethics[0].l2).toBe(copy?.l2);
      expect(byPillar.Ethics[0].l2).not.toMatch(/\[[^\]]+\]/);
      mark('Ethics', id);
    }

    const organicClaim = selectScoreHighlights([
      fired('Ethics', 'ethics-v37-cert-organic', 2, { organicEvidenceClass: 'claim_only' }),
    ]).byPillar.Ethics[0];
    expect(organicClaim.l1).toBe('Organic claim identified');

    for (const [id, row] of Object.entries(OPEN_V15_ADJUSTMENT_REGISTRY)) {
      if (!row.highlightEligible) continue;
      let meta: Record<string, string | number | boolean> | undefined;
      if (id === 'open-v15-ing-clarity-one') {
        meta = { termPresentationClass: 'broad_generic', matchedTerms: 'natural flavours', market: 'NZ' };
      } else if (id === 'open-v15-ing-clarity-two' || id === 'open-v15-ing-clarity-three-plus') {
        meta = { termPresentationClass: 'coded', matchedTerms: 'E102|E110' };
      } else if (id.startsWith('open-v15-origins-pct-')) {
        meta = { accountedPercent: 80, remainderPercent: 20 };
      } else if (id === 'open-v15-origins-qualified-partial') {
        meta = { sourceStatement: 'local and imported' };
      }
      const { byPillar } = selectScoreHighlights([fired('Open', id, row.points, meta)]);
      expect(byPillar.Open[0].l1).toBeTruthy();
      expect(byPillar.Open[0].l2).not.toMatch(/\[[^\]]+\]/);
      mark('Open', id);
    }

    const twoColour = selectScoreHighlights([
      fired('Body', 'body-v12-additive-e102', -3),
      fired('Body', 'body-v12-additive-e110', -3),
    ]).byPillar.Body[0];
    expect(twoColour.l2).toBe(bodyColourSynthesisL2(['body-v12-additive-e102', 'body-v12-additive-e110']));

    const threeColour = selectScoreHighlights([
      fired('Body', 'body-v12-additive-e102', -3),
      fired('Body', 'body-v12-additive-e110', -3),
      fired('Body', 'body-v12-additive-e129', -3),
    ]).byPillar.Body[0];
    expect(threeColour.l2).toBe(
      bodyColourSynthesisL2([
        'body-v12-additive-e102',
        'body-v12-additive-e110',
        'body-v12-additive-e129',
      ])
    );

    expect([...covered].sort()).toEqual([...ALL_ELIGIBLE].sort());
  });
});
