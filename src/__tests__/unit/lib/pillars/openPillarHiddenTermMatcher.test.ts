/**
 * Open Pillar v15 — governed-term matcher fixtures.
 *
 * Locks the structural matcher contract: governed broad/generic terms fire only against an
 * unresolved ingredient/category expression, never against a fragment of a more specific
 * phrase. Open v15 adjustment IDs and points (+1 / -2 / -4 / -6) are unchanged; only
 * whether a governed clarity flag legitimately fires moves.
 */

import {
  OPEN_GOVERNED_TERM_PHRASES,
  assessOpenPillarHiddenTerms,
  countHiddenTermHitsInToken,
  countOpenPillarHiddenTermHits,
  tokenizeIngredientsText,
} from '../../../../lib/truscoreEngine/pillars/openPillarHiddenTerms';
import { calculateOpenPillar } from '../../../../lib/truscoreEngine/pillars/openPillar';
import type { Product } from '../../../../types/product';

function productWith(ingredientsText: string): Product {
  return {
    barcode: '1234567890123',
    product_name: 'Matcher Fixture',
    ingredients_text: ingredientsText,
    source: 'test',
  } as Product;
}

/**
 * The four UAT strings, with the flag counts produced by the pre-change matcher
 * (comma-only tokenization + free substring phrase matching) alongside the counts the
 * structural matcher must produce. `Thickeners (...)` / `Colours (...)` were already 0 and
 * are carried here so the regression stays locked.
 */
const UAT_BEFORE_AFTER: readonly {
  ingredientsText: string;
  beforeFlagCount: number;
  afterFlagCount: number;
  reason: string;
}[] = [
  {
    ingredientsText: 'Yeast extract',
    beforeFlagCount: 1,
    afterFlagCount: 0,
    reason: '"extract" is a suffix of a more specific head, not the unresolved expression',
  },
  {
    ingredientsText: 'Citric Acid',
    beforeFlagCount: 1,
    afterFlagCount: 0,
    reason: '"acid" is a suffix of a named acid, not an unresolved additive category',
  },
  {
    ingredientsText: 'Thickeners (Methyl Cellulose)',
    beforeFlagCount: 0,
    afterFlagCount: 0,
    reason: 'category shell specifically resolved; no governed term left in the specification',
  },
  {
    ingredientsText: 'Colours (Burnt Sugar, Beetroot Powder)',
    beforeFlagCount: 0,
    afterFlagCount: 0,
    reason: 'category shell specifically resolved by a nested composition list',
  },
];

describe('Open v15 governed-term matcher — UAT before/after', () => {
  it('documents before → after flag counts for the four UAT strings', () => {
    const table = UAT_BEFORE_AFTER.map((f) => ({
      ingredientsText: f.ingredientsText,
      before: f.beforeFlagCount,
      after: countOpenPillarHiddenTermHits(f.ingredientsText),
      reason: f.reason,
    }));

    expect(table.map((row) => [row.ingredientsText, row.before, row.after])).toEqual([
      ['Yeast extract', 1, 0],
      ['Citric Acid', 1, 0],
      ['Thickeners (Methyl Cellulose)', 0, 0],
      ['Colours (Burnt Sugar, Beetroot Powder)', 0, 0],
    ]);
  });

  it.each(UAT_BEFORE_AFTER)(
    'standalone "$ingredientsText" produces $afterFlagCount governed flags',
    ({ ingredientsText, afterFlagCount }) => {
      expect(countOpenPillarHiddenTermHits(ingredientsText)).toBe(afterFlagCount);
    }
  );

  it.each(UAT_BEFORE_AFTER)(
    '"$ingredientsText" inside an ingredient list produces $afterFlagCount governed flags',
    ({ ingredientsText, afterFlagCount }) => {
      expect(countOpenPillarHiddenTermHits(`Water, ${ingredientsText}, Salt`)).toBe(afterFlagCount);
      expect(countOpenPillarHiddenTermHits(`Water; ${ingredientsText}; Salt`)).toBe(afterFlagCount);
    }
  );

  it('UAT false positives no longer cost the ingredient-clarity adjustment', () => {
    for (const { ingredientsText } of UAT_BEFORE_AFTER) {
      const result = calculateOpenPillar(productWith(`Water, ${ingredientsText}, Salt`));
      expect(result.details.governedFlagCount).toBe(0);
      expect(
        result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-zero' && a.value === 1)
      ).toBe(true);
    }
  });
});

describe('Open v15 governed-term matcher — item parsing', () => {
  it('splits on top-level commas and semicolons with nesting depth awareness', () => {
    expect(tokenizeIngredientsText('emulsifier (soy, modified), salt')).toEqual([
      'emulsifier (soy, modified)',
      'salt',
    ]);
    expect(tokenizeIngredientsText('Water; Thickeners [Methyl Cellulose]; Salt')).toEqual([
      'Water',
      'Thickeners [Methyl Cellulose]',
      'Salt',
    ]);
    expect(tokenizeIngredientsText('Colours (Caramel (150a), Beetroot), Salt')).toEqual([
      'Colours (Caramel (150a), Beetroot)',
      'Salt',
    ]);
  });

  it('normalizes spacing and edge punctuation without collapsing phrase structure', () => {
    expect(tokenizeIngredientsText('  Water ,\n natural   flavor. ')).toEqual([
      'Water',
      'natural flavor',
    ]);
    expect(countOpenPillarHiddenTermHits('Water, natural flavor.')).toBe(1);
    expect(countOpenPillarHiddenTermHits('WATER, NATURAL FLAVOR')).toBe(1);
  });

  it('treats square brackets like parentheses for category specifications', () => {
    expect(countHiddenTermHitsInToken('Thickeners [Methyl Cellulose]')).toBe(0);
    const coded = assessOpenPillarHiddenTerms('Thickeners [471]');
    expect(coded.flagCount).toBe(1);
    expect(coded.termPresentationClass).toBe('coded');
  });
});

describe('Open v15 governed-term matcher — unresolved terms still fire', () => {
  it.each([
    'Thickeners',
    'Colours',
    'extract',
    'Vegetable extract',
    'natural flavor',
    'natural and artificial flavours',
    'smoke flavouring',
    'spices',
    'mixed herbs',
    'seasoning',
    'aroma',
    'preservative',
    'emulsifier',
    'acid',
    'flavour enhancer',
    'permitted colours',
    'natural colour',
  ])('standalone unresolved "%s" fires', (term) => {
    expect(countHiddenTermHitsInToken(term)).toBeGreaterThanOrEqual(1);
    expect(countOpenPillarHiddenTermHits(`Water, ${term}, Salt`)).toBeGreaterThanOrEqual(1);
  });

  it('every governed phrase in the v15 list can still fire standalone', () => {
    const nonFiring = OPEN_GOVERNED_TERM_PHRASES.filter(
      (phrase) => countHiddenTermHitsInToken(phrase) < 1
    );
    expect(nonFiring).toEqual([]);
  });

  it('an additive category heading an otherwise unresolved expression still fires', () => {
    expect(countHiddenTermHitsInToken('Emulsifier Soy Lecithin')).toBe(1);
    expect(countHiddenTermHitsInToken('Colour 150a')).toBe(1);
  });

  it('multiple unresolved governed terms in one item each fire', () => {
    expect(countHiddenTermHitsInToken('herbs and spices')).toBe(2);
    expect(countOpenPillarHiddenTermHits('natural flavor, aroma, smoke flavouring')).toBe(3);
  });
});

describe('Open v15 governed-term matcher — resolved categories and coded additives', () => {
  it('does not double-count a category shell and its coded specification', () => {
    const thickener = assessOpenPillarHiddenTerms('Thickeners (471)');
    expect(thickener.flagCount).toBe(1);
    expect(thickener.termPresentationClass).toBe('coded');

    const colour = assessOpenPillarHiddenTerms('Colours (E150a)');
    expect(colour.flagCount).toBe(1);
    expect(colour.termPresentationClass).toBe('coded');
    expect(colour.matchedTerms).toBe('E150a');
  });

  it('preserves coded-additive flags listed inside a category specification', () => {
    const multi = assessOpenPillarHiddenTerms('Emulsifier (471, 472e)');
    expect(multi.flagCount).toBe(2);
    expect(multi.termPresentationClass).toBe('coded');
    expect(assessOpenPillarHiddenTerms('Colours (E150a, E160b)').flagCount).toBe(2);
  });

  it('does not read quantities inside a specification as additive codes', () => {
    expect(countHiddenTermHitsInToken('Preservative (250 mg)')).toBe(0);
    expect(countHiddenTermHitsInToken('Thickeners (2%)')).toBe(0);
    expect(countHiddenTermHitsInToken('Sugar (30%)')).toBe(0);
  });

  it('fires governed terms left unresolved inside a partial specification', () => {
    const partial = assessOpenPillarHiddenTerms('Thickeners (natural flavor)');
    expect(partial.flagCount).toBe(1);
    expect(partial.matchedTerms).toBe('natural flavor');

    const mixed = assessOpenPillarHiddenTerms('Colours (150a, Beetroot Powder)');
    expect(mixed.flagCount).toBe(1);
    expect(mixed.termPresentationClass).toBe('coded');
  });
});

describe('Open v15 governed-term matcher — retained specificity behaviours', () => {
  it.each([
    'allspice',
    'vanilla extract',
    'paprika extract',
    'caramel colour',
    'emulsifier (soy lecithin)',
    'seasoning (salt, pepper, paprika)',
    'monosodium glutamate',
    'flavour enhancer (MSG)',
    'monosodium glutamate (621)',
    'preservative (potassium sorbate)',
    'Lactic Acid',
    'Ascorbic Acid (Vitamin C)',
    'Malt extract',
    'Rosemary extract',
    'Methyl Cellulose',
    'Burnt Sugar',
  ])('"%s" produces no governed flag', (token) => {
    expect(countHiddenTermHitsInToken(token)).toBe(0);
  });

  it('prefers the longest governed phrase over its shorter members', () => {
    expect(assessOpenPillarHiddenTerms('natural and artificial flavours').matchedTerms).toBe(
      'natural and artificial flavours'
    );
    expect(assessOpenPillarHiddenTerms('Vegetable extract').matchedTerms).toBe('Vegetable extract');
    expect(assessOpenPillarHiddenTerms('spice extractives').matchedTerms).toBe('spice extractives');
  });

  it('keeps E / INS coded detection anywhere in an item', () => {
    expect(countHiddenTermHitsInToken('E621')).toBe(1);
    expect(countHiddenTermHitsInToken('INS 322')).toBe(1);
    expect(countHiddenTermHitsInToken('en:e330')).toBe(1);
  });
});
