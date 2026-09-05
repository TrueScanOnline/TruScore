import {
  L3_PROHIBITED_APP_NAME_TOKENS,
  L3_PROHIBITED_LEGACY_SNIPPETS,
  resolveGovernedL3Content,
} from '../../../../lib/scoreHighlights/l3/content';
import { resolveInAppL3Route } from '../../../../lib/scoreHighlights/l3/resolveL3Route';
import { L3_TITLES } from '../../../../lib/scoreHighlights/l3/targets';

describe('resolveGovernedL3Content — Addendum v1.1', () => {
  it('binds Nutri-Score grade from the fired adjustment ID and uses the locked grade label', () => {
    const content = resolveGovernedL3Content('nutri_score', 'body-v12-nutri-c', undefined);
    expect(content?.title).toBe(L3_TITLES.nutri_score);
    expect(content?.highlightLine).toBe('Nutri-Score C — nutritional middle ground');
    expect(content?.sources[0].label).toContain('Santé publique France');
    expect(content?.sections[0].body).toContain('We use the reported A–E grade as one input to Body.');
  });

  it('suppresses the S27 Health Star Rating cross-link until the destination exists', () => {
    const suppressed = resolveGovernedL3Content('nutri_score', 'body-v12-nutri-a', undefined);
    expect(suppressed?.action).toBeUndefined();
    expect(JSON.stringify(suppressed)).not.toContain('Health Star Rating');

    const live = resolveGovernedL3Content('nutri_score', 'body-v12-nutri-a', undefined, {
      s27BodyExplainerRouteLive: true,
    });
    expect(live?.action?.anchorLabel).toBe('here');
    expect(live?.action?.textBefore).toContain('Health Star Rating');
  });

  it('shows all four NOVA groups and WHO/Deakin context only for Group 4', () => {
    const g3 = resolveGovernedL3Content('nova', 'body-v12-nova-3', undefined);
    expect(g3?.highlightLine).toBe('This product: NOVA Group 3 — Processed foods');
    expect(g3?.sections.some((s) => s.heading?.includes('Group 1'))).toBe(true);
    expect(g3?.sections.some((s) => s.heading === 'Group 4 health context')).toBe(false);
    expect(g3?.sources.some((s) => s.label.includes('WHO'))).toBe(false);
    expect(g3?.sources[0].label).toBe('OFF — NOVA terminology');

    const g4 = resolveGovernedL3Content('nova', 'body-v12-nova-4', undefined);
    expect(g4?.sections.some((s) => s.heading === 'Group 4 health context')).toBe(true);
    expect(g4?.sections.some((s) => s.body.includes('dietary patterns'))).toBe(true);
    expect(g4?.sources.some((s) => s.label.includes('WHO'))).toBe(true);
    expect(g4?.sources.some((s) => s.label.includes('Deakin'))).toBe(true);
    expect(JSON.stringify(g4)).not.toContain('Associated with health risks including obesity');
  });

  it('cites the Open Food Facts NOVA URL for every group', () => {
    for (const id of ['body-v12-nova-1-off', 'body-v12-nova-2', 'body-v12-nova-3', 'body-v12-nova-4']) {
      const content = resolveGovernedL3Content('nova', id, undefined);
      expect(content?.sources[0].url).toBe('https://world.openfoodfacts.org/nova');
    }
  });

  it('Green-Score L3 carries the experimental caveat and no legacy Eco-Score decomposition', () => {
    const content = resolveGovernedL3Content('green_score', 'planet-v19-environmental-a', {
      environmentalGrade: 'A',
    });
    expect(content?.title).toBe(L3_TITLES.green_score);
    expect(content?.highlightLine).toBe('Green-Score A — lower environmental impact');
    expect(content?.sections.some((s) => s.body.includes('experimental'))).toBe(true);
    expect(content?.sources[0].url).toContain('how_is_the_green_score_calculated');
    const blob = JSON.stringify(content).toLowerCase();
    expect(blob).not.toContain('40%');
    expect(blob).not.toContain('sustainable');
    expect(blob).not.toContain('eco-score');
  });

  it('Packaging L3 requires jurisdiction and uses the locked disposition labels', () => {
    expect(
      resolveGovernedL3Content('packaging', 'planet-v19-packaging-all-kerbside', undefined)
    ).toBeNull();

    const content = resolveGovernedL3Content('packaging', 'planet-v19-packaging-some-kerbside', {
      jurisdiction: 'NZ',
      packagingComponentLabels: 'Bottle (Plastic)|Lid',
      packagingComponentDispositions: 'kerbside|special_pathway',
    });
    expect(content?.highlightLine).toBe('Assessment market: New Zealand');
    expect(content?.componentRows).toHaveLength(2);
    expect(content?.componentRows?.[0].dispositionLabel).toBe('Kerbside recycling');
    expect(content?.componentRows?.[1].dispositionLabel).toBe('Special pathway / check locally');
    expect(content?.sources[0].url).toBe('https://arl.org.au');
    expect(content?.sources.some((s) => s.label.includes('MfE'))).toBe(true);
  });

  it('KTC and BBFAW fail closed without required benchmark tokens', () => {
    expect(resolveGovernedL3Content('ethics_ktc', 'ethics-v37-ktc-71-80', undefined)).toBeNull();
    expect(
      resolveGovernedL3Content('ethics_bbfaw', 'ethics-v37-bbfaw-tier-3', {
        benchmarkCompany: 'Example',
      })
    ).toBeNull();

    const ktc = resolveGovernedL3Content('ethics_ktc', 'ethics-v37-ktc-71-80', {
      benchmarkCompany: 'Example Foods',
      benchmarkYear: 2026,
      benchmarkScore: 75,
    });
    expect(ktc?.highlightLine).toBe('Example Foods — 2026 Food & Beverage Benchmark — 75/100');
    expect(ktc?.sections[0].body).toContain('opportunity to review the information identified');
    expect(ktc?.sections.some((s) => s.body.includes('company-level'))).toBe(true);
  });

  it('BBFAW prominent line binds Tier and Impact together and omits a missing counterpart', () => {
    const both = resolveGovernedL3Content('ethics_bbfaw', 'ethics-v37-bbfaw-tier-3', {
      benchmarkCompany: 'Example Foods',
      benchmarkYear: 2024,
      tier: 3,
      impactRating: 'C',
    });
    expect(both?.highlightLine).toBe('Example Foods — BBFAW 2024 Tier 3 — Impact Rating C');
    expect(both?.sections[0].body).toContain('Tier 3 describes');
    expect(both?.sections[0].body).toContain('Impact Rating C describes');
    expect(both?.sections[1].body).toContain('Tier and Impact answer different questions');

    const tierOnly = resolveGovernedL3Content('ethics_bbfaw', 'ethics-v37-bbfaw-tier-3', {
      benchmarkCompany: 'Example Foods',
      benchmarkYear: 2024,
      tier: 3,
    });
    expect(tierOnly?.highlightLine).toBe('Example Foods — BBFAW 2024 Tier 3');
    expect(JSON.stringify(tierOnly)).not.toContain('Impact Rating');
  });

  it('organic claim-only L3 never presents the product as certified', () => {
    const claimOnly = resolveGovernedL3Content('ethics_organic', 'ethics-v37-cert-organic', {
      organicEvidenceClass: 'claim_only',
    });
    expect(claimOnly?.sections[0].body).toContain('does not establish a specific organic certification');
    expect(claimOnly?.sections[1].body).toContain('The current Ethics rule recognises the packet claim');
    expect(claimOnly?.sources.map((s) => s.label)).toEqual([
      'Australia — ACCC Organic claims',
      'New Zealand — MPI organic product requirements',
    ]);
  });

  it('ingredient wording binds matched terms without requiring a market token', () => {
    const one = resolveGovernedL3Content('ingredient_wording', 'open-v15-ing-clarity-one', {
      termPresentationClass: 'broad_generic',
      matchedTerms: 'natural flavours',
    });
    expect(one?.title).toBe(L3_TITLES.ingredient_wording);
    expect(one?.sections.some((s) => s.heading === '“natural flavours”')).toBe(true);
    expect(
      one?.sections.some((s) =>
        s.body.includes('the term identifies a category without fully showing')
      )
    ).toBe(true);

    const two = resolveGovernedL3Content('ingredient_wording', 'open-v15-ing-clarity-two', {
      termPresentationClass: 'broad_generic',
      matchedTerms: 'vegetable oil|natural flavours',
    });
    expect(two?.sections.some((s) => s.heading === '“vegetable oil” and “natural flavours”')).toBe(
      true
    );
  });

  it('coded ingredient wording shows decoded names only where metadata supplies them', () => {
    const coded = resolveGovernedL3Content('ingredient_wording', 'open-v15-ing-clarity-one', {
      termPresentationClass: 'coded',
      matchedTerms: 'E102',
      decodedAdditiveNames: 'Tartrazine',
    });
    expect(coded?.sections.some((s) => s.heading === '“E102” — Tartrazine')).toBe(true);

    const undecoded = resolveGovernedL3Content('ingredient_wording', 'open-v15-ing-clarity-one', {
      termPresentationClass: 'coded',
      matchedTerms: 'E102',
    });
    expect(undecoded?.sections.some((s) => s.heading === '“E102”')).toBe(true);
  });

  it('mixed ingredient wording fails closed without per-term classification', () => {
    expect(
      resolveGovernedL3Content('ingredient_wording', 'open-v15-ing-clarity-two', {
        termPresentationClass: 'mixed',
        matchedTerms: 'vegetable oil|E102',
      })
    ).toBeNull();

    const mixed = resolveGovernedL3Content('ingredient_wording', 'open-v15-ing-clarity-two', {
      termPresentationClass: 'mixed',
      termPresentationClasses: 'broad_generic|coded',
      matchedTerms: 'vegetable oil|E102',
      decodedAdditiveNames: 'Tartrazine',
    });
    expect(mixed?.sections.some((s) => s.heading === 'Broad or generic terms')).toBe(true);
    expect(mixed?.sections.some((s) => s.heading === 'Coded additive numbers')).toBe(true);
  });

  it('zero-flag ingredient wording L3 needs no matched-term metadata', () => {
    const content = resolveGovernedL3Content(
      'ingredient_wording',
      'open-v15-ing-clarity-zero',
      undefined
    );
    expect(content?.sections.some((s) => s.body.includes('did not find any'))).toBe(true);
  });

  it('suppresses the ingredient contribution fragment until the route is live', () => {
    const suppressed = resolveGovernedL3Content(
      'ingredient_wording',
      'open-v15-ing-clarity-zero',
      undefined
    );
    expect(suppressed?.action).toBeUndefined();
    expect(JSON.stringify(suppressed)).not.toContain('to contribute');

    const live = resolveGovernedL3Content('ingredient_wording', 'open-v15-ing-clarity-zero', undefined, {
      userContributionRouteLive: true,
    });
    expect(live?.action?.anchorLabel).toBe('here');
    expect(live?.action?.textAfter).toBe(' to contribute.');
  });

  it('never leaks a literal [here] token or the app name into consumer L3', () => {
    const samples = [
      resolveGovernedL3Content('nutri_score', 'body-v12-nutri-a', undefined, {
        s27BodyExplainerRouteLive: true,
      }),
      resolveGovernedL3Content('nova', 'body-v12-nova-4', undefined),
      resolveGovernedL3Content('green_score', 'planet-v19-environmental-e', undefined),
      resolveGovernedL3Content('packaging', 'planet-v19-packaging-all-kerbside', { market: 'AU' }),
      resolveGovernedL3Content('ethics_organic', 'ethics-v37-cert-organic', {}),
      resolveGovernedL3Content('ethics_msc', 'ethics-v37-cert-msc', {}),
      resolveGovernedL3Content('ethics_asc', 'ethics-v37-cert-asc', {}),
      resolveGovernedL3Content('ethics_fairtrade', 'ethics-v37-cert-fairtrade', {}),
      resolveGovernedL3Content('ethics_rainforest', 'ethics-v37-cert-rainforest-alliance', {}),
      resolveGovernedL3Content('ethics_ktc', 'ethics-v37-ktc-71-80', {
        benchmarkCompany: 'Example Foods',
        benchmarkYear: 2026,
        benchmarkScore: 75,
      }),
      resolveGovernedL3Content('ethics_bbfaw', 'ethics-v37-bbfaw-impact-cd', {
        benchmarkCompany: 'Example Foods',
        benchmarkYear: 2024,
        impactRating: 'C',
      }),
      resolveGovernedL3Content('ingredient_wording', 'open-v15-ing-clarity-zero', undefined, {
        userContributionRouteLive: true,
      }),
    ];
    const blob = JSON.stringify(samples);
    expect(blob).not.toContain('[here]');
    for (const token of L3_PROHIBITED_APP_NAME_TOKENS) {
      expect(blob).not.toContain(token);
    }
  });

  it('does not leak prohibited legacy snippets across Green-Score / NOVA 4 content', () => {
    const green = resolveGovernedL3Content('green_score', 'planet-v19-environmental-e', undefined);
    const nova4 = resolveGovernedL3Content('nova', 'body-v12-nova-4', undefined);
    const blob = `${JSON.stringify(green)}\n${JSON.stringify(nova4)}`;
    for (const banned of L3_PROHIBITED_LEGACY_SNIPPETS) {
      if (banned === 'this individual product causes') {
        // Allowed negation appears in NOVA 4 diet-pattern copy ("does not show that this individual product causes")
        continue;
      }
      expect(blob.toLowerCase()).not.toContain(banned.toLowerCase());
    }
  });
});

describe('resolveInAppL3Route coverage', () => {
  it('maps every addendum family to its authorised in-app title', () => {
    expect(resolveInAppL3Route('Body', ['body-v12-nutri-a'])?.kind === 'in_app' &&
      resolveInAppL3Route('Body', ['body-v12-nutri-a'])).toMatchObject({
      target: 'nutri_score',
      label: L3_TITLES.nutri_score,
    });
    expect(resolveInAppL3Route('Open', ['open-v15-origins-evidently-complete'])).toMatchObject({
      target: 'product_origins',
    });
    expect(resolveInAppL3Route('Open', ['open-v15-ing-clarity-two'])).toMatchObject({
      target: 'ingredient_wording',
    });
  });
});
