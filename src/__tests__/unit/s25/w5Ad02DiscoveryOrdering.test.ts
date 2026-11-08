/**
 * W5-AD-02 — experimental modal discovery presentation order.
 * Presentation-only; merge / detection / assets must stay unchanged.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  applyDiscoveryPresentationOrder,
  DISCOVERY_DISPLAY_SEQUENCE,
  DISCOVERY_ORDER_INTRO_NOTE,
  shouldShowDiscoveryOrderIntro,
} from '../../../s25/discoveryPresentationOrder';
import {
  buildRenderList,
  getSurfaceCopy,
  mergeRenderedAdditives,
  type S25RenderListItem,
} from '../../../s25';

const FAVOURITES_INGREDIENTS =
  'sugar milk solids cocoa butter cocoa mass glucose syrup vegetable fat coconut (contains preservative 223) peanut pieces glace cherries (cherries glucose fructose syrup colour (163) food acid (330)) cocoa powder invert sugar wheat flour biscuit pieces (contain wheat) emulsifiers (soy lecithin 476 471) barley malt extract gelling agents (1401 440) golden syrup humectant (422) rice crisps raising agent (500) salt hydrolysed milk protein maltodextrin gelatine acidity regulators (331 575) starch (corn tapioca) flavours colours (150c 163 120 160c) vegetable oil enzymes (contain wheat) processing aid (sulphites)';

const FAVOURITES_TAGS = [
  'en:e223',
  'en:e163',
  'en:e330',
  'en:e322',
  'en:e476',
  'en:e471',
  'en:e1401',
  'en:e440',
  'en:e422',
  'en:e500',
  'en:e331',
  'en:e575',
  'en:e150c',
  'en:e120',
  'en:e160c',
];

const PROMOTED = [
  'e120',
  'e471',
  'e476',
  'e150c',
  'e330',
  'e322',
  'e422',
  'e575',
  'e223',
] as const;

function idsOf(items: S25RenderListItem[]): string[] {
  return items.map((i) => i.additiveId);
}

function relativeOrder(ids: string[], subset: string[]): string[] {
  return ids.filter((id) => subset.includes(id));
}

describe('W5-AD-02 discovery presentation order', () => {
  it('uses the approved Favourites promoted sequence then occurrence tail', () => {
    const merged = mergeRenderedAdditives({
      firedBodyLedgerIds: [],
      ingredientsText: FAVOURITES_INGREDIENTS,
      additivesTags: FAVOURITES_TAGS,
    });
    const baseline = buildRenderList(merged, FAVOURITES_INGREDIENTS);
    const ordered = applyDiscoveryPresentationOrder(baseline);

    expect(idsOf(ordered).slice(0, PROMOTED.length)).toEqual([...PROMOTED]);
    expect(idsOf(ordered).sort()).toEqual(idsOf(baseline).sort());
    expect(ordered).toHaveLength(baseline.length);
    expect(ordered).toHaveLength(merged.renderedAdditiveIds.length);

    const unrankedBaseline = idsOf(baseline).filter((id) => !(PROMOTED as readonly string[]).includes(id));
    const unrankedOrdered = idsOf(ordered).slice(PROMOTED.length);
    expect(unrankedOrdered).toEqual(unrankedBaseline);
  });

  it('does not mutate merge identity outputs', () => {
    const input = {
      firedBodyLedgerIds: [] as string[],
      ingredientsText: FAVOURITES_INGREDIENTS,
      additivesTags: FAVOURITES_TAGS,
    };
    const before = mergeRenderedAdditives(input);
    const snapshot = {
      rendered: [...before.renderedAdditiveIds],
      anchors: [...before.orderedListAnchors],
      body6: [...before.body6Ids],
      standard: [...before.standardIds],
    };
    const list = buildRenderList(before, FAVOURITES_INGREDIENTS);
    applyDiscoveryPresentationOrder(list);
    const after = mergeRenderedAdditives(input);
    expect(after.renderedAdditiveIds).toEqual(snapshot.rendered);
    expect(after.orderedListAnchors).toEqual(snapshot.anchors);
    expect(after.body6Ids).toEqual(snapshot.body6);
    expect(after.standardIds).toEqual(snapshot.standard);
  });

  it('preserves relative order for mixed ranked/unranked products', () => {
    const ingredients = 'Preservative (223), emulsifier (471), colour (160c), humectant (422)';
    const merged = mergeRenderedAdditives({
      firedBodyLedgerIds: [],
      ingredientsText: ingredients,
      additivesTags: ['en:e223', 'en:e471', 'en:e160c', 'en:e422'],
    });
    const baseline = buildRenderList(merged, ingredients);
    const ordered = applyDiscoveryPresentationOrder(baseline);
    expect(idsOf(ordered)).toEqual(['e471', 'e422', 'e223', 'e160c']);
    expect(relativeOrder(idsOf(baseline), ['e223', 'e160c'])).toEqual(['e223', 'e160c']);
  });

  it('leaves products with only unranked additives in occurrence order', () => {
    const ingredients = 'Gelling agent (440), colour (163), raising agent (500)';
    const merged = mergeRenderedAdditives({
      firedBodyLedgerIds: [],
      ingredientsText: ingredients,
      additivesTags: ['en:e440', 'en:e163', 'en:e500'],
    });
    const baseline = buildRenderList(merged, ingredients);
    const ordered = applyDiscoveryPresentationOrder(baseline);
    expect(idsOf(ordered)).toEqual(idsOf(baseline));
    expect(idsOf(ordered)[0]).toBe('e440');
  });

  it('preserves Body-6 colour grouping as a single card with min member sequence', () => {
    const ingredients = 'Colour (102, 110, 129), emulsifier (471)';
    const merged = mergeRenderedAdditives({
      firedBodyLedgerIds: [
        'body-v12-additive-e102',
        'body-v12-additive-e110',
        'body-v12-additive-e129',
      ],
      ingredientsText: ingredients,
      additivesTags: ['en:e102', 'en:e110', 'en:e129', 'en:e471'],
    });
    expect(merged.renderedAdditiveIds.sort()).toEqual(['e102', 'e110', 'e129', 'e471']);
    const baseline = buildRenderList(merged, ingredients);
    expect(baseline.filter((i) => i.colourGroupIds?.length)).toHaveLength(1);

    const ordered = applyDiscoveryPresentationOrder(baseline);
    expect(ordered.filter((i) => i.colourGroupIds?.length)).toHaveLength(1);
    expect(ordered).toHaveLength(baseline.length);
    // e471 is sequenced; colour members are not in the pilot map → colour stays unranked tail relative order
    expect(ordered[0].additiveId).toBe('e471');
    expect(ordered[1].colourGroupIds).toEqual(['e102', 'e110', 'e129']);
  });

  it('keeps unranked Body-6 colour groups in stable single-card order', () => {
    // Pilot map does not include e102/e110/e129 → colour group stays unranked.
    const ingredients = 'Colour (102, 110)';
    const merged = mergeRenderedAdditives({
      firedBodyLedgerIds: ['body-v12-additive-e102', 'body-v12-additive-e110'],
      ingredientsText: ingredients,
      additivesTags: ['en:e102', 'en:e110'],
    });
    const baseline = buildRenderList(merged, ingredients);
    const ordered = applyDiscoveryPresentationOrder(baseline);
    expect(ordered).toHaveLength(1);
    expect(ordered[0].colourGroupIds).toEqual(['e102', 'e110']);
    expect(DISCOVERY_DISPLAY_SEQUENCE.e102).toBeUndefined();
    expect(DISCOVERY_DISPLAY_SEQUENCE.e110).toBeUndefined();
    expect(DISCOVERY_DISPLAY_SEQUENCE.e129).toBeUndefined();
  });

  it('assigns a colour-group card the minimum sequence among sequenced members', () => {
    const ingredients = 'Emulsifier (322), colour (100)';
    const merged = mergeRenderedAdditives({
      firedBodyLedgerIds: [],
      ingredientsText: ingredients,
      additivesTags: ['en:e322', 'en:e100'],
    });
    const baseline = buildRenderList(merged, ingredients);
    const lecithin = baseline.find((i) => i.additiveId === 'e322');
    const other = baseline.find((i) => i.additiveId === 'e100');
    expect(lecithin && other).toBeTruthy();
    const syntheticColourGroup: S25RenderListItem = {
      ...other!,
      colourGroupIds: ['e160c', 'e120', 'e150c'],
    };
    const ordered = applyDiscoveryPresentationOrder([lecithin!, syntheticColourGroup]);
    // e120 sequence 1 beats e322 sequence 6 and e150c sequence 4
    expect(idsOf(ordered)).toEqual([syntheticColourGroup.additiveId, 'e322']);
    expect(ordered[0].colourGroupIds).toEqual(['e160c', 'e120', 'e150c']);
  });

  it('keeps Body-6 non-colour entries and does not alter counts', () => {
    const ingredients = 'Preservative (250), emulsifier (471)';
    const merged = mergeRenderedAdditives({
      firedBodyLedgerIds: ['body-v12-additive-e250'],
      ingredientsText: ingredients,
      additivesTags: ['en:e250', 'en:e471'],
    });
    const baseline = buildRenderList(merged, ingredients);
    const ordered = applyDiscoveryPresentationOrder(baseline);
    expect(idsOf(ordered)).toEqual(['e471', 'e250']);
    expect(merged.renderedAdditiveIds).toHaveLength(2);
    expect(ordered).toHaveLength(2);
  });

  it('does not invent ranking-derived safety claims in presentation constants', () => {
    expect(DISCOVERY_ORDER_INTRO_NOTE).toBe(
      'Some notable discoveries appear first. This order is not a safety ranking.'
    );
    expect(DISCOVERY_ORDER_INTRO_NOTE.toLowerCase()).not.toMatch(
      /risk|toxic|severity|danger|hazard|score/
    );
    const modalSrc = fs.readFileSync(
      path.join(__dirname, '../../../components/AboutTheseAdditivesModal.tsx'),
      'utf8'
    );
    expect(modalSrc).toContain('DISCOVERY_ORDER_INTRO_NOTE');
    expect(modalSrc).toContain('shouldShowDiscoveryOrderIntro');
    expect(modalSrc).toContain('applyDiscoveryPresentationOrder');
    expect(modalSrc).toMatch(/getSurfaceCopy\(\s*['"]surface_intro['"]\s*\)/);
    // Governed surface asset must remain the completeness caveat source.
    const surface = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../../../s25/assets/surface_copy.json'),
        'utf8'
      )
    ) as { surface_intro: string };
    expect(surface.surface_intro).toMatch(/may not be a complete list/i);
    expect(surface.surface_intro).not.toContain('safety ranking');
    expect(getSurfaceCopy('surface_intro')).toBe(surface.surface_intro);
  });

  it('does not mutate the input array reference contents order in place', () => {
    const ingredients = 'Emulsifier (471), preservative (223)';
    const merged = mergeRenderedAdditives({
      firedBodyLedgerIds: [],
      ingredientsText: ingredients,
      additivesTags: ['en:e471', 'en:e223'],
    });
    const baseline = buildRenderList(merged, ingredients);
    const beforeIds = idsOf(baseline);
    const ordered = applyDiscoveryPresentationOrder(baseline);
    expect(idsOf(baseline)).toEqual(beforeIds);
    expect(ordered).not.toBe(baseline);
    expect(idsOf(ordered)).toEqual(['e471', 'e223']);
  });

  describe('discovery intro visibility (Stage 2C)', () => {
    it('A: omits discovery sentence when zero additives are promoted', () => {
      const ingredients = 'Gelling agent (440), colour (163), raising agent (500)';
      const merged = mergeRenderedAdditives({
        firedBodyLedgerIds: [],
        ingredientsText: ingredients,
        additivesTags: ['en:e440', 'en:e163', 'en:e500'],
      });
      const items = applyDiscoveryPresentationOrder(buildRenderList(merged, ingredients));
      expect(items.length).toBeGreaterThanOrEqual(2);
      expect(items.every((i) => DISCOVERY_DISPLAY_SEQUENCE[i.additiveId] == null)).toBe(true);
      expect(shouldShowDiscoveryOrderIntro(items)).toBe(false);
    });

    it('B: omits discovery sentence for a single unranked additive', () => {
      const ingredients = 'Gelling agent (440)';
      const merged = mergeRenderedAdditives({
        firedBodyLedgerIds: [],
        ingredientsText: ingredients,
        additivesTags: ['en:e440'],
      });
      const items = applyDiscoveryPresentationOrder(buildRenderList(merged, ingredients));
      expect(items).toHaveLength(1);
      expect(DISCOVERY_DISPLAY_SEQUENCE[items[0].additiveId]).toBeUndefined();
      expect(shouldShowDiscoveryOrderIntro(items)).toBe(false);
    });

    it('C: omits discovery sentence for a single promoted additive', () => {
      const ingredients = 'Emulsifier (471)';
      const merged = mergeRenderedAdditives({
        firedBodyLedgerIds: [],
        ingredientsText: ingredients,
        additivesTags: ['en:e471'],
      });
      const items = applyDiscoveryPresentationOrder(buildRenderList(merged, ingredients));
      expect(items).toHaveLength(1);
      expect(DISCOVERY_DISPLAY_SEQUENCE[items[0].additiveId]).toBe(2);
      expect(shouldShowDiscoveryOrderIntro(items)).toBe(false);
    });

    it('D: shows discovery sentence when multiple cards include a promotion', () => {
      const ingredients = 'Emulsifier (471), preservative (223), colour (160c)';
      const merged = mergeRenderedAdditives({
        firedBodyLedgerIds: [],
        ingredientsText: ingredients,
        additivesTags: ['en:e471', 'en:e223', 'en:e160c'],
      });
      const items = applyDiscoveryPresentationOrder(buildRenderList(merged, ingredients));
      expect(items.length).toBeGreaterThanOrEqual(2);
      expect(items.some((i) => DISCOVERY_DISPLAY_SEQUENCE[i.additiveId] != null)).toBe(true);
      expect(shouldShowDiscoveryOrderIntro(items)).toBe(true);
    });

    it('E: governed surface_intro remains the completeness caveat', () => {
      const intro = getSurfaceCopy('surface_intro');
      expect(intro).toMatch(/may not be a complete list/i);
      expect(intro).not.toContain('notable discoveries');
      expect(intro).not.toContain('safety ranking');
    });

    it('F: discovery ordering remains unchanged for Favourites promotion set', () => {
      const merged = mergeRenderedAdditives({
        firedBodyLedgerIds: [],
        ingredientsText: FAVOURITES_INGREDIENTS,
        additivesTags: FAVOURITES_TAGS,
      });
      const baseline = buildRenderList(merged, FAVOURITES_INGREDIENTS);
      const ordered = applyDiscoveryPresentationOrder(baseline);
      expect(idsOf(ordered).slice(0, PROMOTED.length)).toEqual([...PROMOTED]);
      expect(shouldShowDiscoveryOrderIntro(ordered)).toBe(true);
    });

    it('G: colour-group promotion is evaluated with the same sequence rules', () => {
      const ingredients = 'Emulsifier (322), colour (100)';
      const merged = mergeRenderedAdditives({
        firedBodyLedgerIds: [],
        ingredientsText: ingredients,
        additivesTags: ['en:e322', 'en:e100'],
      });
      const baseline = buildRenderList(merged, ingredients);
      const lecithin = baseline.find((i) => i.additiveId === 'e322');
      const other = baseline.find((i) => i.additiveId === 'e100');
      expect(lecithin && other).toBeTruthy();
      const syntheticColourGroup: S25RenderListItem = {
        ...other!,
        colourGroupIds: ['e160c', 'e120', 'e150c'],
      };
      const items = applyDiscoveryPresentationOrder([lecithin!, syntheticColourGroup]);
      expect(items).toHaveLength(2);
      expect(shouldShowDiscoveryOrderIntro(items)).toBe(true);
      expect(shouldShowDiscoveryOrderIntro([syntheticColourGroup])).toBe(false);
    });
  });
});
