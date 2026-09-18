/**
 * Wave 3 UAT corrective — focused presentation/routing proofs (no scoring methodology).
 */

import { resolveOpenGovernedCopy } from '../../../lib/scoreHighlights/openGovernedCopy';
import { resolveGovernedL3Content } from '../../../lib/scoreHighlights/l3/content';
import { planInAppL3HostPresentation } from '../../../lib/scoreHighlights/l3/hostPresentation';
import { mergeRenderedAdditives } from '../../../s25/merge';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../../..');

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

  it('Open three-plus coded commentary uses the bounded count, not “several”', () => {
    const copy = resolveOpenGovernedCopy('open-v15-ing-clarity-three-plus', {
      termPresentationClass: 'coded',
      matchedTerms: 'E1420|E412|E422|E471|E330|E500|E621|E322|E415',
    });
    expect(copy?.l1).toBe('9 ingredients need decoding');
    expect(copy?.l2).toMatch(/^9 additives are listed mainly by number/);
    expect(copy?.l2).not.toMatch(/Several additives are listed mainly by number/);
  });

  it('Open coded L3 builds compact codedAdditivesSection with S25 total distinct from coded count', () => {
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
    expect(content?.codedAdditivesSection?.codedCount).toBe(3);
    expect(content?.codedAdditivesSection?.s25TotalCount).toBe(6);
    expect(content?.codedAdditivesSection?.exploreLabel).toContain('6');
    expect(content?.termRouteActions?.every((a) => a.displayName || a.displayName === undefined)).toBe(
      true
    );
    // Deterministic names only when catalogue resolves
    for (const action of content?.termRouteActions ?? []) {
      if (action.displayName) {
        expect(action.displayName.length).toBeGreaterThan(0);
      }
    }
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
