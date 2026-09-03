import { resolveOpenGovernedCopy } from '../../../../lib/scoreHighlights/openGovernedCopy';

describe('resolveOpenGovernedCopy', () => {
  it('resolves one broad/generic clarity variant with market-aware labelling', () => {
    const copy = resolveOpenGovernedCopy('open-v15-ing-clarity-one', {
      termPresentationClass: 'broad_generic',
      matchedTerms: 'natural flavours',
      market: 'AU',
    });
    expect(copy?.l1).toBe('One ingredient term is vague');
    expect(copy?.l2).toContain('“natural flavours”');
    expect(copy?.l2).toContain('Australian food-labelling rules');
  });

  it('resolves one coded clarity variant with decoded plain name', () => {
    const copy = resolveOpenGovernedCopy('open-v15-ing-clarity-one', {
      termPresentationClass: 'coded',
      matchedTerms: 'E102',
      decodedAdditiveNames: 'Tartrazine',
    });
    expect(copy?.l1).toBe('One ingredient needs decoding');
    expect(copy?.l2).toContain('“E102”');
    expect(copy?.l2).toContain('Tartrazine');
  });

  it('fail-closes one broad variant when market is unknown', () => {
    expect(
      resolveOpenGovernedCopy('open-v15-ing-clarity-one', {
        termPresentationClass: 'broad_generic',
        matchedTerms: 'natural flavours',
      })
    ).toBeNull();
  });

  it('resolves two mixed clarity variant', () => {
    const copy = resolveOpenGovernedCopy('open-v15-ing-clarity-two', {
      termPresentationClass: 'mixed',
      matchedTerms: 'natural flavours|E102',
    });
    expect(copy?.l1).toBe('Some ingredient wording needs explanation');
    expect(copy?.l2).toContain('combines broad descriptions with coded additive names');
  });

  it('resolves single-ingredient and generic evidently complete origins to the same locked v0.4 copy', () => {
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

  it('resolves zero-flag ingredient-clarity copy from the locked v0.4 strings', () => {
    const copy = resolveOpenGovernedCopy('open-v15-ing-clarity-zero', {});
    expect(copy?.l1).toBe('Ingredient wording is clear where assessed');
    expect(copy?.l2).toContain('we didn’t find any of the broad, generic or code-dependent terms');
  });
});
