import {
  L3_PROHIBITED_LEGACY_SNIPPETS,
  resolveGovernedL3Content,
} from '../../../../lib/scoreHighlights/l3/content';
import { resolveInAppL3Route } from '../../../../lib/scoreHighlights/l3/resolveL3Route';
import { L3_TITLES } from '../../../../lib/scoreHighlights/l3/targets';

describe('resolveGovernedL3Content — Addendum v1.0', () => {
  it('binds Nutri-Score grade from the fired adjustment ID', () => {
    const content = resolveGovernedL3Content('nutri_score', 'body-v12-nutri-c', undefined);
    expect(content?.title).toBe(L3_TITLES.nutri_score);
    expect(content?.highlightLine).toContain('Nutri-Score C');
    expect(content?.sources[0].label).toContain('Santé publique France');
  });

  it('shows all four NOVA groups and WHO diet-pattern context only for Group 4', () => {
    const g3 = resolveGovernedL3Content('nova', 'body-v12-nova-3', undefined);
    expect(g3?.highlightLine).toContain('NOVA Group 3');
    expect(g3?.sections.some((s) => s.heading?.includes('Group 1'))).toBe(true);
    expect(g3?.sections.some((s) => s.heading === 'Diet-pattern health context')).toBe(false);
    expect(g3?.sources.some((s) => s.label.includes('WHO'))).toBe(false);

    const g4 = resolveGovernedL3Content('nova', 'body-v12-nova-4', undefined);
    expect(g4?.sections.some((s) => s.heading === 'Diet-pattern health context')).toBe(true);
    expect(g4?.sections.some((s) => s.body.includes('dietary patterns'))).toBe(true);
    expect(g4?.sources.some((s) => s.label.includes('WHO'))).toBe(true);
    const blob = JSON.stringify(g4);
    expect(blob).not.toContain('Associated with health risks including obesity');
  });

  it('Green-Score L3 has no fake sub-score decomposition or sustainable wording', () => {
    const content = resolveGovernedL3Content('green_score', 'planet-v19-environmental-a', {
      environmentalGrade: 'A',
    });
    expect(content?.title).toBe(L3_TITLES.green_score);
    expect(content?.highlightLine).toContain('Green-Score A');
    const blob = JSON.stringify(content).toLowerCase();
    expect(blob).not.toContain('40%');
    expect(blob).not.toContain('sustainable');
    expect(blob).not.toContain('unsustainable');
  });

  it('Packaging L3 requires jurisdiction and uses consumer disposition labels', () => {
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
    expect(content?.componentRows?.[1].dispositionLabel).toContain('Special pathway');
    expect(content?.sources[0].label).toContain('New Zealand');
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
    expect(ktc?.sections.some((s) => s.body.includes('company-level'))).toBe(true);

    const bbfaw = resolveGovernedL3Content('ethics_bbfaw', 'ethics-v37-bbfaw-tier-3', {
      benchmarkCompany: 'Example Foods',
      benchmarkYear: 2024,
      tier: 3,
      impactRating: 'C',
    });
    expect(bbfaw?.highlightLine).toBe('Example Foods — BBFAW 2024');
    expect(bbfaw?.sections.some((s) => s.body.includes('Tier 3'))).toBe(true);
    expect(bbfaw?.sections.some((s) => s.body.includes('Impact Rating C'))).toBe(true);
  });

  it('Ingredient wording binds matched terms and market; fails closed without market for broad terms', () => {
    expect(
      resolveGovernedL3Content('ingredient_wording', 'open-v15-ing-clarity-one', {
        termPresentationClass: 'broad_generic',
        termPresentationClasses: 'broad_generic',
        matchedTerms: 'natural flavours',
      })
    ).toBeNull();

    const content = resolveGovernedL3Content('ingredient_wording', 'open-v15-ing-clarity-one', {
      termPresentationClass: 'broad_generic',
      termPresentationClasses: 'broad_generic',
      matchedTerms: 'natural flavours',
      market: 'AU',
    });
    expect(content?.title).toBe(L3_TITLES.ingredient_wording);
    expect(content?.sections.some((s) => s.heading === 'natural flavours')).toBe(true);
    expect(content?.sections.some((s) => s.body.includes('Australian food-labelling'))).toBe(true);
  });

  it('zero-flag ingredient wording L3 needs no matched-term metadata', () => {
    const content = resolveGovernedL3Content(
      'ingredient_wording',
      'open-v15-ing-clarity-zero',
      undefined
    );
    expect(content?.sections.some((s) => s.body.includes('did not find any'))).toBe(true);
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
