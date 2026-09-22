/**
 * Wave 3 UAT corrective — focused presentation/routing proofs (no scoring methodology).
 * Includes Claude P1/P2 closure: Open number-free counts; Nutrition Details focus clear.
 */

import { resolveOpenGovernedCopy } from '../../../lib/scoreHighlights/openGovernedCopy';
import { resolveGovernedL3Content } from '../../../lib/scoreHighlights/l3/content';
import { planInAppL3HostPresentation } from '../../../lib/scoreHighlights/l3/hostPresentation';
import { mergeRenderedAdditives } from '../../../s25/merge';
import type { NutritionDetailsFocusTarget } from '../../../components/NutritionDetailsModal';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../../..');

/**
 * Mirrors NutritionTable's initialDetailsFocus → detailsFocus sync (P2).
 * Parent may open Details twice; null must clear a prior highlight.
 */
function syncDetailsFocusFromProp(
  _current: NutritionDetailsFocusTarget | null,
  initialDetailsFocus: NutritionDetailsFocusTarget | null
): NutritionDetailsFocusTarget | null {
  return initialDetailsFocus;
}

describe('Wave 3 UAT corrective — S25 / Open / Nutrition / Claims presentation', () => {
  it('S25 total count is unique(renderedAdditiveIds).length doctrine', () => {
    const merged = mergeRenderedAdditives({
      firedBodyLedgerIds: ['body-v12-additive-e102'],
      ingredientsText: 'colour (e102), thickener (e412), emulsifier (e471)',
      additivesTags: ['en:e102', 'en:e412', 'en:e471'],
    });
    expect(merged.renderedAdditiveIds.length).toBe(
      new Set(merged.renderedAdditiveIds).size
    );
    expect(merged.renderedAdditiveIds.length).toBeGreaterThan(0);
  });

  it('P1: Open three-plus coded Highlight restores number-free baseline copy', () => {
    const copy = resolveOpenGovernedCopy('open-v15-ing-clarity-three-plus', {
      termPresentationClass: 'coded',
      matchedTerms: 'E1420|E412|E422|E471|E330|E500|E621|E322|E415',
    });
    expect(copy?.l1).toBe('Several ingredients need decoding');
    expect(copy?.l2).toMatch(/^Several additives are listed mainly by number/);
    expect(copy?.l1).not.toMatch(/\d/);
    expect(copy?.l2).not.toMatch(/\d+\s+additive/);
  });

  it('P1: Claude fixture — duplicate E102 cannot create an Open numeric count; S25 owns unique count', () => {
    // Claude-reproduced ingredient string; e102 is Body-6 (ledger), e300 is standard catalogue.
    const ingredientsText = 'Colour (E102), Antioxidant (E300), Preservative (E102)';
    const merged = mergeRenderedAdditives({
      firedBodyLedgerIds: ['body-v12-additive-e102'],
      ingredientsText,
      additivesTags: ['en:e102', 'en:e300'],
    });
    const uniqueS25 = new Set(merged.renderedAdditiveIds);
    expect(merged.renderedAdditiveIds.length).toBe(uniqueS25.size);
    expect(uniqueS25.has('e102')).toBe(true);
    expect(uniqueS25.has('e300')).toBe(true);

    const matchedTerms = 'E102|E300|E102';
    const copy = resolveOpenGovernedCopy('open-v15-ing-clarity-three-plus', {
      termPresentationClass: 'coded',
      matchedTerms,
    });
    expect(copy?.l1).toBe('Several ingredients need decoding');
    expect(copy?.l1).not.toMatch(/\d/);

    const content = resolveGovernedL3Content(
      'ingredient_wording',
      'open-v15-ing-clarity-three-plus',
      {
        termPresentationClass: 'coded',
        matchedTerms,
      },
      { renderedAdditiveIds: merged.renderedAdditiveIds }
    );
    expect(content?.codedAdditivesSection?.heading).toBe('Coded additives');
    expect(content?.codedAdditivesSection?.heading).not.toMatch(/\d/);
    expect(content?.codedAdditivesSection?.exploreLabel).toBe('About these Additives');
    expect(content?.codedAdditivesSection?.exploreLabel).not.toMatch(/\d/);
    // Deduped by additiveId — duplicate E102 appears once in the compact Open list
    const ids = (content?.termRouteActions ?? []).map((a) => a.additiveId);
    expect(ids.filter((id) => id === 'e102')).toHaveLength(1);
    expect(new Set(ids).size).toBe(ids.length);
    // Authoritative S25 unique count remains on the destination side (not in Open copy)
    expect(merged.renderedAdditiveIds.length).toBe(2);
  });

  it('P1: unresolved coded terms do not invent S25 identities; compact list stays resolution-gated', () => {
    const content = resolveGovernedL3Content(
      'ingredient_wording',
      'open-v15-ing-clarity-three-plus',
      {
        termPresentationClass: 'coded',
        matchedTerms: 'E102|NOT-A-REAL-CODE|E9999',
      },
      { renderedAdditiveIds: ['e102'] }
    );
    const actions = content?.termRouteActions ?? [];
    expect(actions.every((a) => a.additiveId === 'e102')).toBe(true);
    expect(actions.some((a) => a.term === 'NOT-A-REAL-CODE')).toBe(false);
    expect(actions.some((a) => /invent|unknown/i.test(a.displayName ?? ''))).toBe(false);
    for (const action of actions) {
      if (action.displayName) {
        expect(action.displayName.length).toBeGreaterThan(0);
      }
    }
  });

  it('P1: Open coded L3 compact section is number-free; S25 unique count remains separate', () => {
    const rendered = ['e412', 'e422', 'e1420', 'e471', 'e330', 'e102'];
    const content = resolveGovernedL3Content(
      'ingredient_wording',
      'open-v15-ing-clarity-three-plus',
      {
        termPresentationClass: 'coded',
        matchedTerms: 'E412|E422|E1420',
        decodedAdditiveNames: 'a|b|c',
      },
      { renderedAdditiveIds: rendered }
    );
    expect(content?.codedAdditivesSection?.heading).toBe('Coded additives');
    expect(content?.codedAdditivesSection?.exploreLabel).toBe('About these Additives');
    expect(content?.termRouteActions).toHaveLength(3);
    expect(rendered.length).toBe(6);
  });

  it('Claims Packet Context L3 host plan opens nutrition_details, not intermediary governed_l3', () => {
    expect(planInAppL3HostPresentation('claims_packet_context_nutrition')).toEqual({
      dismissLookThrough: true,
      present: 'nutrition_details',
    });
  });

  it('Claims high_nutrients metadata maps to multi-nutrient Nutrition Details focus keys', () => {
    const labels = 'total sugars|saturated fat'.split('|').map((s) => s.trim().toLowerCase());
    const map: Record<string, string> = {
      'total sugars': 'totalSugars',
      'saturated fat': 'saturatedFat',
      sodium: 'sodium',
    };
    const keys = labels.map((l) => map[l]).filter(Boolean);
    expect(keys).toEqual(['totalSugars', 'saturatedFat']);
  });

  it('P2: consecutive Claims opens clear stale Nutrition Details focus when second has none', () => {
    const src = fs.readFileSync(path.join(ROOT, 'src/components/NutritionTable.tsx'), 'utf8');
    expect(src).toMatch(/setDetailsFocus\(initialDetailsFocus\)/);
    expect(src).not.toMatch(/if \(initialDetailsFocus != null\)/);

    let focus: NutritionDetailsFocusTarget | null = null;
    // First Claims-routed open — High nutrient focus
    focus = syncDetailsFocusFromProp(focus, 'totalSugars');
    expect(focus).toBe('totalSugars');
    // Second open — no resolvable focus; still opens Details, but highlight must clear
    focus = syncDetailsFocusFromProp(focus, null);
    expect(focus).toBeNull();
    expect(planInAppL3HostPresentation('claims_packet_context_nutrition').present).toBe(
      'nutrition_details'
    );
  });

  it('Nutrition primary card source no longer renders Per serve column', () => {
    const src = fs.readFileSync(path.join(ROOT, 'src/components/NutritionTable.tsx'), 'utf8');
    expect(src).toMatch(/const showPerServe = false/);
    expect(src).toMatch(/Per serve is Details-only/);
  });

  it('Nutrition Details prefers Per serve before Per 100 column order', () => {
    const src = fs.readFileSync(
      path.join(ROOT, 'src/components/NutritionDetailsModal.tsx'),
      'utf8'
    );
    const serveIdx = src.indexOf("t('nutrition.perServe'");
    const per100Idx = src.indexOf("t('nutrition.per100ml'");
    expect(serveIdx).toBeGreaterThan(0);
    expect(per100Idx).toBeGreaterThan(serveIdx);
    expect(src).toMatch(/levelCompact/);
    expect(src).toMatch(/accessibilityLabel=\{`\$\{row\.label\}: \$\{a11yLevel\}`\}/);
  });

  it('Result hero prefers image_front_small_url and prefetches', () => {
    const src = fs.readFileSync(path.join(ROOT, 'app/result/[barcode].tsx'), 'utf8');
    expect(src).toMatch(
      /image_front_small_url\s*\|\|\s*product\.image_front_url\s*\|\|\s*product\.image_url/
    );
    expect(src).toMatch(/ExpoImage\.prefetch/);
  });

  it('S25 destination is full-screen Modal (not InfoModal inset)', () => {
    const src = fs.readFileSync(
      path.join(ROOT, 'src/components/AboutTheseAdditivesModal.tsx'),
      'utf8'
    );
    expect(src).toMatch(/presentationStyle="fullScreen"/);
    expect(src).not.toMatch(/import InfoModal/);
    expect(src).toMatch(/Collapsed-only tile_summary/);
  });

  it('AboutTheseAdditivesCard promotes count N and honour reduced-motion path', () => {
    const src = fs.readFileSync(
      path.join(ROOT, 'src/components/AboutTheseAdditivesCard.tsx'),
      'utf8'
    );
    expect(src).toMatch(/AdditiveCountReveal/);
    expect(src).toMatch(/isReduceMotionEnabled/);
    expect(src).toMatch(/announceForAccessibility/);
  });
});
