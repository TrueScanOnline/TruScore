/**
 * Open Pillar v15 — governed-term matcher fixtures.
 *
 * Locks the structural matcher contract: governed broad/generic terms fire only against an
 * unresolved ingredient/category expression, never against a fragment of a more specific
 * phrase. Open v15 adjustment IDs and points (+1 / -2 / -4 / -6) are unchanged; only
 * whether a governed clarity flag legitimately fires moves.
 *
 * v0.5 supersedes v0.4 class-shell resolution with the residual-ambiguity test: none /
 * code-only / non-exhaustive / residual governed ambiguity / direct identity. Arbitrary
 * trailing words are not sufficient to resolve a class shell. One unresolved top-level
 * class item contributes one broad/generic clarity count. The two founder UAT packet
 * strings remain mandatory full-string fixtures.
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

/**
 * v0.4 class-shell resolution: "The shell is resolved when the same ingredient item
 * directly identifies the specific substance/additive, whether the identity is supplied in
 * parentheses/brackets or immediately after the class name."
 */
const CLASS_IDENTITY_BEFORE_AFTER: readonly {
  ingredientsText: string;
  beforeFlagCount: number;
  afterFlagCount: number;
  afterTermPresentationClass: 'broad_generic' | 'coded';
  reason: string;
}[] = [
  {
    ingredientsText: 'Emulsifier Soy Lecithin',
    beforeFlagCount: 1,
    afterFlagCount: 0,
    afterTermPresentationClass: 'broad_generic',
    reason: 'class and specific substance both supplied; parentheses are not required',
  },
  {
    ingredientsText: 'Thickener Xanthan Gum',
    beforeFlagCount: 1,
    afterFlagCount: 0,
    afterTermPresentationClass: 'broad_generic',
    reason: 'class and specific substance both supplied; parentheses are not required',
  },
  {
    ingredientsText: 'Preservative Potassium Sorbate',
    beforeFlagCount: 1,
    afterFlagCount: 0,
    afterTermPresentationClass: 'broad_generic',
    reason: 'class and specific substance both supplied; parentheses are not required',
  },
  {
    ingredientsText: 'Antioxidant Ascorbic Acid',
    beforeFlagCount: 1,
    afterFlagCount: 0,
    afterTermPresentationClass: 'broad_generic',
    reason: 'class and specific substance both supplied; Acid does not fire from Ascorbic Acid',
  },
  {
    ingredientsText: 'Acidity Regulator Citric Acid',
    beforeFlagCount: 1,
    afterFlagCount: 0,
    afterTermPresentationClass: 'broad_generic',
    reason: 'class and specific substance both supplied; Acid does not fire from Citric Acid',
  },
  {
    ingredientsText: 'Colour 150a',
    beforeFlagCount: 1,
    afterFlagCount: 1,
    afterTermPresentationClass: 'coded',
    reason: 'code-only identity: suppress the broad shell, retain one code-dependent flag',
  },
  {
    ingredientsText: 'Flavour enhancer (621)',
    beforeFlagCount: 1,
    afterFlagCount: 1,
    afterTermPresentationClass: 'coded',
    reason: 'code-only identity: suppress the broad shell, retain one code-dependent flag',
  },
  {
    ingredientsText: 'Emulsifier (471)',
    beforeFlagCount: 1,
    afterFlagCount: 1,
    afterTermPresentationClass: 'coded',
    reason: 'code-only identity: suppress the broad shell, retain one code-dependent flag',
  },
  {
    ingredientsText: 'Flavours (Contains Glutamic Acid)',
    beforeFlagCount: 1,
    afterFlagCount: 1,
    afterTermPresentationClass: 'broad_generic',
    reason: '"Contains" is non-exhaustive and does not fully identify the flavouring substances',
  },
];

describe('Open v15 v0.4 — category/function-shell resolution', () => {
  it('documents before → after flag counts for the class+identity cases', () => {
    expect(
      CLASS_IDENTITY_BEFORE_AFTER.map((f) => [
        f.ingredientsText,
        f.beforeFlagCount,
        countOpenPillarHiddenTermHits(f.ingredientsText),
      ])
    ).toEqual([
      ['Emulsifier Soy Lecithin', 1, 0],
      ['Thickener Xanthan Gum', 1, 0],
      ['Preservative Potassium Sorbate', 1, 0],
      ['Antioxidant Ascorbic Acid', 1, 0],
      ['Acidity Regulator Citric Acid', 1, 0],
      ['Colour 150a', 1, 1],
      ['Flavour enhancer (621)', 1, 1],
      ['Emulsifier (471)', 1, 1],
      ['Flavours (Contains Glutamic Acid)', 1, 1],
    ]);
  });

  it.each(CLASS_IDENTITY_BEFORE_AFTER)(
    '"$ingredientsText" produces $afterFlagCount governed flags standalone and in a list',
    ({ ingredientsText, afterFlagCount }) => {
      expect(countHiddenTermHitsInToken(ingredientsText)).toBe(afterFlagCount);
      expect(countOpenPillarHiddenTermHits(`Water, ${ingredientsText}, Salt`)).toBe(afterFlagCount);
      expect(countOpenPillarHiddenTermHits(`Water; ${ingredientsText}; Salt`)).toBe(afterFlagCount);
    }
  );

  it.each(CLASS_IDENTITY_BEFORE_AFTER.filter((f) => f.afterFlagCount > 0))(
    '"$ingredientsText" is classified $afterTermPresentationClass',
    ({ ingredientsText, afterTermPresentationClass }) => {
      expect(assessOpenPillarHiddenTerms(ingredientsText).termPresentationClass).toBe(
        afterTermPresentationClass
      );
    }
  );

  it.each([
    'Emulsifier Soy Lecithin',
    'Emulsifier (Soy Lecithin)',
    'Thickener Xanthan Gum',
    'Thickener (Xanthan Gum)',
    'Preservative Potassium Sorbate',
    'Antioxidant Ascorbic Acid',
    'Acidity Regulator Citric Acid',
    'Colour Caramel',
    'Flavour enhancer Yeast Extract',
  ])('direct class+identity "%s" resolves the shell with or without brackets', (token) => {
    expect(countHiddenTermHitsInToken(token)).toBe(0);
  });

  it('code-only specification produces one coded flag without double-counting the class', () => {
    for (const token of ['Emulsifier (471)', 'Colour 150a', 'Flavour enhancer (621)']) {
      const assessment = assessOpenPillarHiddenTerms(token);
      expect(assessment.flagCount).toBe(1);
      expect(assessment.termPresentationClass).toBe('coded');
    }
    const inlineCode = assessOpenPillarHiddenTerms('Colour E150a');
    expect(inlineCode.flagCount).toBe(1);
    expect(inlineCode.termPresentationClass).toBe('coded');
  });

  it('a non-exhaustive qualifier does not resolve a broad category', () => {
    expect(assessOpenPillarHiddenTerms('Flavours (Contains Glutamic Acid)').matchedTerms).toBe(
      'Flavours'
    );
    expect(countHiddenTermHitsInToken('Thickeners (Contains Xanthan Gum)')).toBe(1);
    expect(countHiddenTermHitsInToken('Thickeners (May Contain Xanthan Gum)')).toBe(1);
    expect(countHiddenTermHitsInToken('Colours (Including Beetroot Powder)')).toBe(1);
  });

  it('standalone class shells stay unresolved and keep firing', () => {
    for (const shell of [
      'Emulsifier',
      'Preservative',
      'Thickener',
      'Colour',
      'Antioxidant',
      'Acidity Regulator',
      'Flavour enhancer',
    ]) {
      expect(countHiddenTermHitsInToken(shell)).toBe(1);
      expect(assessOpenPillarHiddenTerms(shell).termPresentationClass).toBe('broad_generic');
    }
  });
});

/**
 * Founder UAT regression fixtures — mandatory full-string tests (v0.4). Abbreviated
 * substitutes are expressly not sufficient to prove the defects remain closed.
 */
const UAT_FIXTURE_1 =
  'Water, Soy Protein, Coconut Oil, Potato Starch, Canola Oil, Methylcellulose, Sausage Casing (Sodium Alginate, Calcium Chloride), Yeast Extract, Maltodextrin, Spices, Salt, Sugar, Citric Acid, Potassium Sorbate.';

const UAT_FIXTURE_2 =
  'Water, Plant Protein 25% (Soy), Vegetable Oils, Thickeners (Methyl Cellulose, Modified Corn Starch, Gellan Gum (Contains Soy), Carrageenan), Vinegar, Colours (Burnt Sugar, Beetroot Powder), Flavours (Contains Glutamic Acid), Cultured Sugar (From Cane), Yeast Extract, Dextrose, Salt, Onion Powder, Iron, Vitamin B12.';

describe('Open v15 v0.4 — founder UAT full-string fixtures', () => {
  it('Fixture 1 matches Spices only', () => {
    const assessment = assessOpenPillarHiddenTerms(UAT_FIXTURE_1);
    expect(assessment.flagCount).toBe(1);
    expect(assessment.matchedTerms).toBe('Spices');
    expect(assessment.termPresentationClass).toBe('broad_generic');
  });

  it('Fixture 2 matches Flavours only', () => {
    const assessment = assessOpenPillarHiddenTerms(UAT_FIXTURE_2);
    expect(assessment.flagCount).toBe(1);
    expect(assessment.matchedTerms).toBe('Flavours');
    expect(assessment.termPresentationClass).toBe('broad_generic');
  });

  it.each([
    ['Fixture 1', UAT_FIXTURE_1],
    ['Fixture 2', UAT_FIXTURE_2],
  ])('%s takes exactly the one-flag ingredient-clarity adjustment', (_label, text) => {
    const result = calculateOpenPillar(productWith(text));
    expect(result.details.governedFlagCount).toBe(1);
    expect(
      result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-one' && a.value === -2)
    ).toBe(true);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-two')).toBe(false);
    expect(result.adjustments.some((a) => a.id === 'open-v15-ing-clarity-three-plus')).toBe(false);
  });

  it('Fixture 1 does not fire Extract from Yeast Extract or Acid from Citric Acid', () => {
    const terms = assessOpenPillarHiddenTerms(UAT_FIXTURE_1).matches.map((m) =>
      m.term.toLowerCase()
    );
    expect(terms).not.toContain('extract');
    expect(terms).not.toContain('acid');
  });

  it('Fixture 2 resolves the directly specified Thickeners and Colours shells', () => {
    const terms = assessOpenPillarHiddenTerms(UAT_FIXTURE_2).matches.map((m) =>
      m.term.toLowerCase()
    );
    expect(terms).not.toContain('thickeners');
    expect(terms).not.toContain('colours');
    expect(terms).not.toContain('extract');
    expect(terms).not.toContain('acid');
  });
});

/**
 * v0.5 residual-ambiguity — founder-locked. Bracketed and unbracketed specifications share
 * the same decision path. Extra ungoverned words cannot mask a governed ambiguity, and an
 * otherwise unaccounted substantive trailing word is not sufficient class resolution.
 */
describe('Open v15 v0.5 — residual-ambiguity class-shell classification', () => {
  it.each([
    ['Emulsifier Soy Lecithin', 0, ''],
    ['Emulsifier Contains Soy Lecithin', 1, 'Emulsifier'],
    ['Emulsifier blend', 1, 'Emulsifier'],
    ['Emulsifier blend premium', 1, 'Emulsifier'],
    ['Thickener vegetable gum', 1, 'vegetable gum'],
    ['Thickener vegetable gum natural', 1, 'vegetable gum'],
    ['Colour 150a', 1, 'Colour 150a'],
    ['Colour E150a', 1, 'E150a'],
    ['Flavours (Contains Glutamic Acid)', 1, 'Flavours'],
    ['Emulsifier (blend)', 1, 'Emulsifier'],
    ['Thickener (vegetable gum)', 1, 'vegetable gum'],
  ] as const)(
    '%s → %i flags (evidence %s)',
    (token, flags, evidence) => {
      const assessment = assessOpenPillarHiddenTerms(token);
      expect(assessment.flagCount).toBe(flags);
      if (flags === 0) {
        expect(assessment.matchedTerms).toBe('');
      } else {
        expect(assessment.matchedTerms).toBe(evidence);
      }
      expect(countOpenPillarHiddenTermHits(`Water, ${token}, Salt`)).toBe(flags);
    }
  );

  it('does not treat residual governed wording as resolved by extra ungoverned words', () => {
    // Old defect: hasSpecifyingWord("blend"/"premium") resolved the shell to 0.
    expect(countHiddenTermHitsInToken('Emulsifier blend')).toBe(1);
    expect(countHiddenTermHitsInToken('Emulsifier blend premium')).toBe(1);
    expect(countHiddenTermHitsInToken('Thickener vegetable gum')).toBe(1);
    expect(countHiddenTermHitsInToken('Thickener vegetable gum natural')).toBe(1);
    expect(countHiddenTermHitsInToken('Emulsifier (blend)')).toBe(1);
    expect(countHiddenTermHitsInToken('Thickener (vegetable gum)')).toBe(1);
  });

  it('qualifier-only remainder does not resolve a class shell', () => {
    expect(countHiddenTermHitsInToken('Thickener natural')).toBe(1);
    expect(countHiddenTermHitsInToken('Colour permitted')).toBe(1);
  });
  it('keeps one-item / one-ambiguity for residual class items (no shell+generic double count)', () => {
    expect(countHiddenTermHitsInToken('Emulsifier blend')).toBe(1);
    expect(countHiddenTermHitsInToken('Thickener vegetable gum')).toBe(1);
    expect(countHiddenTermHitsInToken('Emulsifier Contains Soy Lecithin')).toBe(1);
  });

  it('retains distinct code-dependent tokens inside an otherwise unresolved class item', () => {
    const mixed = assessOpenPillarHiddenTerms('Emulsifiers (471, spices)');
    expect(mixed.flagCount).toBe(2);
    expect(mixed.matches.some((m) => m.presentationClass === 'coded')).toBe(true);
    expect(mixed.matches.some((m) => m.presentationClass === 'broad_generic')).toBe(true);
  });

  it('Colour 150a / Colour E150a remain single coded flags', () => {
    for (const token of ['Colour 150a', 'Colour E150a']) {
      const assessment = assessOpenPillarHiddenTerms(token);
      expect(assessment.flagCount).toBe(1);
      expect(assessment.termPresentationClass).toBe('coded');
    }
  });
});
