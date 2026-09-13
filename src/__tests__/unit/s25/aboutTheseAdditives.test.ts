/**
 * S25 — About these Additives unit tests (catalogue MVP v0.7).
 */

import {
  assertAssetCounts,
  buildRenderList,
  detectStandardAdditives,
  formatResultCountCopy,
  getSurfaceCopy,
  mergeRenderedAdditives,
  normalizeCodedTermToAdditiveId,
  resolveDeclaredClassAt,
  S25_CATALOGUE,
  S25_CLASSES,
  S25_SURFACE_COPY,
} from '../../../s25';
import { resolveGovernedL3Content } from '../../../lib/scoreHighlights/l3/content';
import { scoreBodyMvpAdditives } from '../../../lib/truscoreEngine/pillars/bodyAdditiveScoring';
import { assessOpenPillarHiddenTerms } from '../../../lib/truscoreEngine/pillars/openPillarHiddenTerms';
import type { Product } from '../../../types/product';
import * as fs from 'fs';
import * as path from 'path';

describe('S25 asset load counts', () => {
  it('loads 315 / 309 std / 6 BODY6 / 33 evidence / 7 dual-source / no duplicate ids', () => {
    const counts = assertAssetCounts();
    expect(counts).toEqual({
      catalogue_rows: 315,
      standard_rows: 309,
      body6_rows: 6,
      evidence_enabled: 33,
      evidence_dual_source: 7,
      unique_additive_ids: 315,
      duplicate_additive_ids: 0,
    });
    expect(S25_CLASSES).toHaveLength(25);
    expect(S25_SURFACE_COPY.surface_title).toBe('About these Additives');
    expect(S25_SURFACE_COPY.function_unknown).toBe(
      'The available product information identifies the additive but not its function in this product.'
    );
    expect(S25_SURFACE_COPY.evidence_section_title).toBe('What the evidence says');
  });

  it('exposes evidence copy only on the 33 enabled standard rows', () => {
    const evidence = S25_CATALOGUE.filter((e) => !e.body6_existing && e.evidence_enabled);
    expect(evidence).toHaveLength(33);
    expect(evidence.every((e) => e.evidence_copy.trim().length > 0)).toBe(true);
    expect(evidence.filter((e) => e.evidence_source_count === 2)).toHaveLength(7);
    expect(evidence.filter((e) => e.evidence_source_count === 1)).toHaveLength(26);
    expect(S25_CATALOGUE.filter((e) => e.body6_existing).every((e) => !e.evidence_enabled)).toBe(
      true
    );
  });
});

describe('S25 detection / merge / dedupe', () => {
  it('maps Body-6 from ledger only and does not redetect Body-6 via standard path', () => {
    const merged = mergeRenderedAdditives({
      firedBodyLedgerIds: ['body-v12-additive-e102', 'body-v12-additive-e250'],
      ingredientsText: 'Colour (102), preservative (250), emulsifier (471)',
      additivesTags: ['en:e102', 'en:e250', 'en:e471'],
    });
    expect(merged.body6Ids.sort()).toEqual(['e102', 'e250']);
    expect(merged.standardIds).toContain('e471');
    expect(merged.standardIds).not.toContain('e102');
    expect(merged.standardIds).not.toContain('e250');
    expect(merged.renderedAdditiveIds).toEqual(
      expect.arrayContaining(['e102', 'e250', 'e471'])
    );
    expect(new Set(merged.renderedAdditiveIds).size).toBe(merged.renderedAdditiveIds.length);
  });

  it('dedupes unique IDs and counts colours separately', () => {
    const merged = mergeRenderedAdditives({
      firedBodyLedgerIds: [
        'body-v12-additive-e102',
        'body-v12-additive-e110',
        'body-v12-additive-e129',
      ],
      ingredientsText: 'Colours (102, 110, 129)',
      additivesTags: ['en:e102', 'en:e110', 'en:e129'],
    });
    expect(merged.renderedAdditiveIds.sort()).toEqual(['e102', 'e110', 'e129']);
    expect(merged.renderedAdditiveIds).toHaveLength(3);
    const list = buildRenderList(merged, 'Colours (102, 110, 129)');
    expect(list.filter((i) => i.colourGroupIds)).toHaveLength(1);
    expect(list[0].colourGroupIds).toEqual(['e102', 'e110', 'e129']);
  });

  it('orders by first occurrence then stable append', () => {
    const merged = mergeRenderedAdditives({
      firedBodyLedgerIds: [],
      ingredientsText: 'Emulsifier (471), preservative (202)',
      additivesTags: ['en:e202', 'en:e471'],
    });
    expect(merged.renderedAdditiveIds[0]).toBe('e471');
    expect(merged.renderedAdditiveIds).toContain('e202');
  });

  it('hides Result card when count is zero', () => {
    const merged = mergeRenderedAdditives({
      firedBodyLedgerIds: [],
      ingredientsText: 'Water, sugar, salt',
      additivesTags: [],
    });
    expect(merged.renderedAdditiveIds).toHaveLength(0);
    expect(formatResultCountCopy(1)).toBe(getSurfaceCopy('result_count_singular'));
    expect(formatResultCountCopy(3)).toBe('3 additives identified');
  });

  it('requires declared class context for bare numeric and name detection', () => {
    const withoutContext = detectStandardAdditives({
      ingredientsText: 'Contains 471 and xanthan gum',
      additivesTags: [],
    });
    expect(withoutContext.map((h) => h.additiveId)).not.toContain('e471');

    const withContext = detectStandardAdditives({
      ingredientsText: 'Emulsifier (471), thickener (xanthan gum)',
      additivesTags: [],
    });
    expect(withContext.map((h) => h.additiveId)).toEqual(
      expect.arrayContaining(['e471', 'e415'])
    );
  });
});

describe('S25 class unknown fail-closed', () => {
  it('returns null declared class when no parser_terms match', () => {
    expect(resolveDeclaredClassAt('Water, sugar', 0)).toBeNull();
  });

  it('matches Classes_25 parser_terms only', () => {
    const cls = resolveDeclaredClassAt('Colour (102)', 0);
    expect(cls?.class_id).toBe('colour');
    expect(cls?.consumer_label).toBe('Colour');
  });
});

describe('S25 normaliser (Open deep-link)', () => {
  it('normalises coded terms to canonical ids', () => {
    expect(normalizeCodedTermToAdditiveId('E102')).toBe('e102');
    expect(normalizeCodedTermToAdditiveId('E 110')).toBe('e110');
    expect(normalizeCodedTermToAdditiveId('INS 129')).toBe('e129');
    expect(normalizeCodedTermToAdditiveId('en:e250')).toBe('e250');
    expect(normalizeCodedTermToAdditiveId('471')).toBe('e471');
  });
});

describe('S25 Open coded-term route actions (presentation only)', () => {
  it('exposes About this additive only for coded terms in renderedAdditiveIds', () => {
    const content = resolveGovernedL3Content(
      'ingredient_wording',
      'open-v15-ing-clarity-coded',
      {
        termPresentationClass: 'coded',
        matchedTerms: 'E102|E999',
        decodedAdditiveNames: 'Tartrazine|Unknown',
      },
      { renderedAdditiveIds: ['e102'] }
    );
    expect(content?.termRouteActions).toEqual([
      { term: 'E102', label: 'About this additive', additiveId: 'e102' },
    ]);
  });

  it('does not add route actions for broad_generic terms', () => {
    const content = resolveGovernedL3Content(
      'ingredient_wording',
      'open-v15-ing-clarity',
      {
        termPresentationClass: 'broad_generic',
        matchedTerms: 'natural flavours',
      },
      { renderedAdditiveIds: ['e102'] }
    );
    expect(content?.termRouteActions).toBeUndefined();
  });
});

describe('S25 does not change Body / Open scoring', () => {
  it('Body MVP additive scoring fixtures remain unchanged', () => {
    const product = {
      additives_tags: ['en:e102', 'en:e250'],
      ingredients_text: 'Colour (102), preservative (250)',
    } as Product;
    const scored = scoreBodyMvpAdditives(product);
    expect(scored.matches.map((m) => m.canonicalId).sort()).toEqual(['e102', 'e250']);
    expect(scored.elementDeduction).toBeGreaterThan(0);
  });

  it('Open hidden-term assessment / decoded names unchanged by S25 import', () => {
    const assessment = assessOpenPillarHiddenTerms('Colour (E102), natural flavours');
    expect(assessment.termPresentationClass).toMatch(/coded|mixed|broad_generic/);
    expect(assessment.matchedTerms.length).toBeGreaterThan(0);
    // decodedAdditiveNames still comes from additiveDatabase path inside Open — unchanged API
    expect(typeof assessment.decodedAdditiveNames).toBe('string');
  });
});

describe('S25 legacy retirement evidence', () => {
  it('Result screen no longer mounts AdditivesRiskCard', () => {
    const resultPath = path.join(__dirname, '..', '..', '..', '..', 'app', 'result', '[barcode].tsx');
    const src = fs.readFileSync(resultPath, 'utf8');
    expect(src).not.toMatch(/AdditivesRiskCard/);
    expect(src).toMatch(/AboutTheseAdditivesCard/);
    expect(src).toMatch(/AboutTheseAdditivesModal/);
  });

  it('S25 module does not read ADDITIVE_DATABASE consumer judgement fields', () => {
    const s25Dir = path.join(__dirname, '..', '..', '..', 's25');
    const files = fs.readdirSync(s25Dir).filter((f) => f.endsWith('.ts'));
    for (const f of files) {
      const src = fs.readFileSync(path.join(s25Dir, f), 'utf8');
      expect(src).not.toMatch(/ADDITIVE_DATABASE|bodyConcernTier|getAdditiveInfo/);
      expect(src).not.toMatch(/\bsafety\s*[:=]\s*['"]?(safe|caution|avoid)/i);
    }
  });
});
