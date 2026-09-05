import { resolveOpenGovernedCopy } from '../../../../lib/scoreHighlights/openGovernedCopy';

describe('resolveOpenGovernedCopy', () => {
  it('resolves one broad/generic clarity variant without requiring a market token', () => {
    const copy = resolveOpenGovernedCopy('open-v15-ing-clarity-one', {
      termPresentationClass: 'broad_generic',
      matchedTerms: 'natural flavours',
    });
    expect(copy?.l1).toBe('One ingredient term is vague');
    expect(copy?.l2).toBe(
      'The ingredient list says “natural flavours”. This is a broad description, and in the wording we could ' +
        'assess it does not identify the specific ingredient or substance represented by natural flavours.'
    );
  });

  it('resolves one coded clarity variant with decoded plain name', () => {
    const copy = resolveOpenGovernedCopy('open-v15-ing-clarity-one', {
      termPresentationClass: 'coded',
      matchedTerms: 'E102',
      decodedAdditiveNames: 'Tartrazine',
    });
    expect(copy?.l1).toBe('One ingredient needs decoding');
    expect(copy?.l2).toBe(
      '“E102” is a standard food-additive number for Tartrazine. The code identifies the additive precisely, but a ' +
        'shopper needs to know or look up the number to see the additive’s name.'
    );
  });

  it('fail-closes the coded variant when no decoded additive name is supplied', () => {
    expect(
      resolveOpenGovernedCopy('open-v15-ing-clarity-one', {
        termPresentationClass: 'coded',
        matchedTerms: 'E102',
      })
    ).toBeNull();
  });

  it('fail-closes any clarity variant without a governed presentation class', () => {
    expect(
      resolveOpenGovernedCopy('open-v15-ing-clarity-one', {
        matchedTerms: 'natural flavours',
      })
    ).toBeNull();
  });

  it('resolves two broad terms from the locked two-flag copy', () => {
    const copy = resolveOpenGovernedCopy('open-v15-ing-clarity-two', {
      termPresentationClass: 'broad_generic',
      matchedTerms: 'vegetable oil|natural flavours',
    });
    expect(copy?.l1).toBe('Two ingredient terms are vague');
    expect(copy?.l2).toBe(
      'The ingredient list uses two broad descriptions: “vegetable oil” and “natural flavours”. In the wording we ' +
        'could assess, they do not identify the specific ingredients or substances represented by those categories.'
    );
  });

  it('resolves the two-flag mixed clarity variant', () => {
    const copy = resolveOpenGovernedCopy('open-v15-ing-clarity-two', {
      termPresentationClass: 'mixed',
      matchedTerms: 'natural flavours|E102',
    });
    expect(copy?.l1).toBe('Some ingredient wording needs explanation');
    expect(copy?.l2).toBe(
      'This ingredient list combines a broad description with a coded additive number. Tap through to see what each ' +
        'term means.'
    );
  });

  it('resolves three-plus broad terms as a governed list', () => {
    const copy = resolveOpenGovernedCopy('open-v15-ing-clarity-three-plus', {
      termPresentationClass: 'broad_generic',
      matchedTerms: 'vegetable oil|natural flavours|spices',
    });
    expect(copy?.l1).toBe('Several ingredient terms are vague');
    expect(copy?.l2).toBe(
      'Several broad ingredient descriptions appear in this list, including vegetable oil, natural flavours and ' +
        'spices. In the wording we could assess, they leave parts of the ingredient make-up unspecified.'
    );
  });

  it('resolves single-ingredient and generic evidently complete origins to the same locked copy', () => {
    const locked = {
      l1: 'Ingredient origins appear fully accounted for',
      l2: 'The available origin information appears to account for the relevant ingredient sourcing, with no material remainder left unexplained.',
    };
    const single = resolveOpenGovernedCopy('open-v15-origins-evidently-complete', {
      singleIngredient: true,
      ingredient: 'Whole milk',
      country: 'New Zealand',
    });
    const generic = resolveOpenGovernedCopy('open-v15-origins-evidently-complete', {});
    expect(single).toEqual(locked);
    expect(generic).toEqual(locked);
    expect(single?.l2).not.toContain('Whole milk');
  });

  it('resolves zero-flag ingredient-clarity copy from the locked 5 September strings', () => {
    const copy = resolveOpenGovernedCopy('open-v15-ing-clarity-zero', {});
    expect(copy?.l1).toBe('Ingredient wording is clear where assessed');
    expect(copy?.l2).toBe(
      'In the ingredient list we could assess, we did not find any of the broad, generic or code-dependent terms we ' +
        'check for. That does not mean every detail about the product is disclosed.'
    );
  });
});
