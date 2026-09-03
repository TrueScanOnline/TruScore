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

  it('resolves single-ingredient evidently complete origins variant', () => {
    const copy = resolveOpenGovernedCopy('open-v15-origins-evidently-complete', {
      singleIngredient: true,
      ingredient: 'Whole milk',
      country: 'New Zealand',
    });
    expect(copy?.l2).toContain('Whole milk');
    expect(copy?.l2).toContain('New Zealand');
  });
});
