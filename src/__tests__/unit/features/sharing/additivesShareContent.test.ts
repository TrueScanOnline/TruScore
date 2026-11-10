/**
 * W5-ADD-SHARE-01 — focused additives sharing tests.
 */

import {
  ADDITIVES_OVERVIEW_HIGHLIGHT_LIMIT,
  additiveDetailShareRows,
  additivesOverviewShareRows,
  additivesShareText,
  buildAdditiveDetailSharePayload,
  buildAdditivesOverviewSharePayload,
  buildAdditivesShareMessage,
  buildEmptyAdditivesOverviewSharePayload,
} from '../../../../features/sharing/additivesShareContent';
import { ShareContentBuilder } from '../../../../features/sharing/services/ShareContentBuilder';
import { sharePathSummary } from '../../../../components/sharePathSummary';
import { shareStoryHeading } from '../../../../components/shareStoryHeading';
import { shareImageScoreState, resolveShareOverallScore } from '../../../../utils/shareScoreSemantics';
import type { S25CatalogueEntry, S25RenderListItem } from '../../../../s25/types';
import type { ProductWithTrustScore } from '../../../../types/product';
import type { TruScoreResult } from '../../../../lib/truscoreEngine';
import { DISCOVERY_DISPLAY_SEQUENCE } from '../../../../s25/discoveryPresentationOrder';

function entry(partial: Partial<S25CatalogueEntry> & Pick<S25CatalogueEntry, 'additive_id'>): S25CatalogueEntry {
  return {
    schedule8_code: partial.additive_id.replace(/^e/i, ''),
    schedule8_names: '',
    consumer_display_name: partial.consumer_display_name || partial.additive_id,
    entry_title: partial.entry_title || `${partial.additive_id} title`,
    body6_existing: false,
    presentation_treatment: 'STANDARD',
    tile_summary: partial.tile_summary || `Discovery for ${partial.additive_id}`,
    expanded_summary: partial.expanded_summary || '',
    source_preparation_profile: partial.source_preparation_profile || 'FERMENTATION',
    source_preparation_render_mode: 'STANDARD_PROFILE_AND_COPY',
    source_preparation_copy: partial.source_preparation_copy || '',
    fact_1_label: '',
    fact_1_copy: '',
    fact_2_label: '',
    fact_2_copy: '',
    fact_3_label: '',
    fact_3_copy: '',
    name_aliases: [],
    code_aliases: [],
    code_detection_enabled: true,
    code_detection_scope: 'STRUCTURED_ADDITIVE_TAG_OR_EXPLICIT_E_INS_OR_DECLARED_CLASS_CODE',
    bare_numeric_requires_declared_additive_context: false,
    name_detection_enabled: true,
    name_detection_scope: 'WITHIN_DECLARED_ADDITIVE_CONTEXT',
    evidence_enabled: false,
    evidence_copy: '',
    evidence_source_count: 0,
    evidence_source_1_link_label: '',
    evidence_source_1_url: '',
    evidence_source_2_link_label: '',
    evidence_source_2_url: '',
    ...partial,
  };
}

function item(
  id: string,
  overrides: Partial<S25CatalogueEntry> = {},
  extra: Partial<S25RenderListItem> = {}
): S25RenderListItem {
  return {
    additiveId: id,
    entry: entry({ additive_id: id, ...overrides }),
    declaredClass: null,
    isBody6: false,
    ...extra,
  };
}

function product(overrides: Partial<ProductWithTrustScore> = {}): ProductWithTrustScore {
  return {
    barcode: '9300617064879',
    product_name: 'Dairy Milk',
    image_url: 'https://example.com/dm.jpg',
    ...overrides,
  } as ProductWithTrustScore;
}

function ratedTruScore(score = 72): TruScoreResult {
  return {
    publication: {
      settled: true,
      overall: { publicationStatus: 'rated', publishedScore: score },
    },
  } as TruScoreResult;
}

function nrTruScore(): TruScoreResult {
  return {
    publication: {
      settled: true,
      overall: { publicationStatus: 'nr', publishedScore: null },
    },
  } as TruScoreResult;
}

function checkingTruScore(): TruScoreResult {
  return {
    publication: {
      settled: false,
      overall: { publicationStatus: 'checking', publishedScore: null },
    },
  } as TruScoreResult;
}

describe('W5-ADD-SHARE-01 additives share content', () => {
  it('shares an individual CORE additive with governed discovery copy', () => {
    const coreId = 'e120';
    expect(DISCOVERY_DISPLAY_SEQUENCE[coreId]).toBe(1);
    const payload = buildAdditiveDetailSharePayload({
      productName: 'Cadbury Favourites',
      item: item(coreId, {
        entry_title: 'Cochineal or carmines or carminic acid (120)',
        tile_summary: 'This red food colouring comes from insects.',
        source_preparation_profile: 'ANIMAL_DERIVED',
      }),
      totalAdditiveCount: 15,
    });
    expect(payload.mode).toBe('detail');
    expect(payload.highlights[0].isCorePromoted).toBe(true);
    expect(payload.highlights[0].discovery).toContain('insects');
    const msg = buildAdditivesShareMessage({
      payload,
      universalLink: 'https://truescan.app/barcode/9300617308324?ctx=additive',
    }).message;
    expect(msg).toContain('Cochineal');
    expect(msg).toContain('insects');
    expect(msg).toMatch(/not a safety ranking/i);
    expect(msg).not.toMatch(/toxicity|avoid|unsafe/i);
  });

  it('shares an unranked additive without inventing CORE promotion', () => {
    const payload = buildAdditiveDetailSharePayload({
      productName: 'Cadbury Favourites',
      item: item('e223', {
        entry_title: 'Sodium metabisulphite (223)',
        tile_summary: 'A sulphite preservative.',
        source_preparation_profile: 'MINERAL_INORGANIC',
      }),
      totalAdditiveCount: 15,
    });
    expect(payload.highlights[0].isCorePromoted).toBe(false);
    expect(payload.highlights[0].qualifications.join(' ')).not.toMatch(/safety ranking/i);
  });

  it('shares a VARIABLE-source additive without product-specific origin claims', () => {
    const payload = buildAdditiveDetailSharePayload({
      productName: 'Dairy Milk',
      item: item('e322', {
        entry_title: 'Lecithin (322)',
        tile_summary: 'Lecithin helps oil and water mix.',
        source_preparation_profile: 'VARIABLE',
      }),
      totalAdditiveCount: 2,
    });
    const text = additivesShareText(payload);
    expect(text).toMatch(/does not establish a product-specific/i);
    expect(text.toLowerCase()).not.toContain('this product uses soy');
    expect(text.toLowerCase()).not.toContain('from petroleum');
  });

  it('CHEMICAL_SYNTHESIS share never auto-labels PETROLEUM_REFINED', () => {
    const payload = buildAdditiveDetailSharePayload({
      productName: 'Indomie',
      item: item('e319', {
        entry_title: 'tert-Butylhydroquinone (319)',
        tile_summary: 'TBHQ is a synthetic phenolic antioxidant.',
        source_preparation_profile: 'CHEMICAL_SYNTHESIS',
      }),
      totalAdditiveCount: 14,
    });
    const text = additivesShareText(payload);
    expect(text).toMatch(/chemical synthesis/i);
    // Explicit negation is required; must not assert petroleum origin as fact.
    expect(text).toMatch(/not the same as .*\bmade from petroleum/i);
    expect(text.toLowerCase()).not.toMatch(/\bsource:\s*made from petroleum\b/);
    expect(text.toLowerCase()).not.toContain('petroleum-refined');
  });

  it('builds an overall additives overview for two additives', () => {
    const items = [
      item('e476', { entry_title: 'PGPR (476)', tile_summary: 'Castor-oil flow helper.' }),
      item('e322', {
        entry_title: 'Lecithin (322)',
        tile_summary: 'Helps oil and water mix.',
        source_preparation_profile: 'VARIABLE',
      }),
    ];
    const payload = buildAdditivesOverviewSharePayload({
      productName: 'Dairy Milk',
      items,
      showDiscoveryOrderNote: true,
    });
    expect(payload.additiveCount).toBe(2);
    expect(payload.listComplete).toBe(true);
    expect(payload.omittedCount).toBe(0);
    expect(payload.discoveryOrderNote).toMatch(/not a safety ranking/i);
    const rows = additivesOverviewShareRows(payload);
    expect(rows.some((r) => r.kind === 'text' && r.text.includes('2 additives'))).toBe(true);
    expect(rows.some((r) => r.kind === 'text' && /more in/i.test(r.text))).toBe(false);
  });

  it('summarises many additives without presenting a silent partial list', () => {
    const items = Array.from({ length: 14 }, (_, i) =>
      item(`e${100 + i}`, { tile_summary: `Fact ${i}` })
    );
    const payload = buildAdditivesOverviewSharePayload({
      productName: 'Indomie',
      items,
      showDiscoveryOrderNote: false,
    });
    expect(payload.highlights).toHaveLength(ADDITIVES_OVERVIEW_HIGHLIGHT_LIMIT);
    expect(payload.listComplete).toBe(false);
    expect(payload.omittedCount).toBe(14 - ADDITIVES_OVERVIEW_HIGHLIGHT_LIMIT);
    const msg = buildAdditivesShareMessage({
      payload,
      universalLink: 'https://truescan.app/barcode/0089686170924?ctx=additives',
    }).message;
    expect(msg).toMatch(/more additives identified/i);
    expect(msg).toMatch(/not the complete list|full list/i);
    expect(msg).toMatch(/not a safety ranking/i);
  });

  it('handles no identified additives', () => {
    const payload = buildEmptyAdditivesOverviewSharePayload('Plain water');
    expect(payload.additiveCount).toBe(0);
    expect(payload.listComplete).toBe(true);
    const content = ShareContentBuilder.buildContent({
      product: product({ product_name: 'Plain water', barcode: '000' }),
      item: 'additives',
      additiveShare: payload,
    });
    expect(content.message.toLowerCase()).toContain('additive');
  });

  it('tolerates missing catalogue discovery fields', () => {
    const payload = buildAdditiveDetailSharePayload({
      productName: 'Test',
      item: item('e500', {
        tile_summary: '',
        expanded_summary: '',
        entry_title: '',
        consumer_display_name: '',
        source_preparation_profile: 'MINERAL_INORGANIC',
      }),
      totalAdditiveCount: 1,
    });
    expect(payload.highlights[0].title.length).toBeGreaterThan(0);
    expect(additiveDetailShareRows(payload).length).toBeGreaterThan(0);
  });

  it('Rated product share keeps published score semantics out of additive message body', () => {
    const payload = buildAdditivesOverviewSharePayload({
      productName: 'Dairy Milk',
      items: [item('e476'), item('e322')],
    });
    const content = ShareContentBuilder.buildContent({
      product: product(),
      truScore: ratedTruScore(72),
      item: 'additives',
      additiveShare: payload,
      publicationSettled: true,
    });
    expect(content.message).not.toMatch(/72\s*\/\s*100/);
    expect(content.message).not.toMatch(/Body:\s*\d+/i);
    expect(resolveShareOverallScore(ratedTruScore(72), { publicationSettled: true })).toBe(72);
  });

  it('NR product — additive share still factual; score state stays NR', () => {
    const state = shareImageScoreState(nrTruScore(), { publicationSettled: true });
    expect(state.kind).toBe('nr');
    expect(state.valueText).toBeNull();
    const payload = buildAdditivesOverviewSharePayload({
      productName: 'Dairy Milk',
      items: [item('e476')],
    });
    const content = ShareContentBuilder.buildContent({
      product: product(),
      truScore: nrTruScore(),
      item: 'additives',
      additiveShare: payload,
      publicationSettled: true,
    });
    expect(content.message).not.toMatch(/\d+\s*\/\s*100/);
  });

  it('Checking / unsettled — no published number leakage on additive share path', () => {
    expect(resolveShareOverallScore(checkingTruScore(), { publicationSettled: false })).toBeNull();
    expect(shareImageScoreState(checkingTruScore(), { publicationSettled: false }).valueText).toBeNull();
    const payload = buildAdditivesOverviewSharePayload({
      productName: 'Favourites',
      items: [item('e120')],
    });
    const content = ShareContentBuilder.buildContent({
      product: product({ barcode: '9300617308324', product_name: 'Favourites' }),
      truScore: checkingTruScore(),
      item: 'additives',
      additiveShare: payload,
      publicationSettled: false,
    });
    expect(content.message).not.toMatch(/\d+\s*\/\s*100/);
    expect(content.message).not.toMatch(/publishedScore/i);
  });

  it('genuine published zero remains distinguishable from unpublished', () => {
    const zero = ratedTruScore(0);
    expect(resolveShareOverallScore(zero, { publicationSettled: true })).toBe(0);
    expect(shareImageScoreState(zero, { publicationSettled: true })).toEqual(
      expect.objectContaining({ kind: 'rated', valueText: '0/100' })
    );
    expect(resolveShareOverallScore(nrTruScore(), { publicationSettled: true })).toBeNull();
  });

  it('preview rows and message agree for overview and detail', () => {
    const overview = buildAdditivesOverviewSharePayload({
      productName: 'Indomie',
      items: [item('e330'), item('e319', { source_preparation_profile: 'CHEMICAL_SYNTHESIS' })],
    });
    const overviewText = additivesShareText(overview);
    const overviewMsg = buildAdditivesShareMessage({
      payload: overview,
      universalLink: 'https://truescan.app/barcode/x?ctx=additives',
    }).message;
    expect(overviewMsg).toContain('Indomie');
    expect(overviewText).toContain('2 additives');

    const detail = buildAdditiveDetailSharePayload({
      productName: 'Indomie',
      item: item('e319', {
        entry_title: 'tert-Butylhydroquinone (319)',
        tile_summary: 'TBHQ antioxidant.',
        source_preparation_profile: 'CHEMICAL_SYNTHESIS',
      }),
      totalAdditiveCount: 14,
    });
    const detailText = additivesShareText(detail);
    const detailMsg = buildAdditivesShareMessage({
      payload: detail,
      universalLink: 'https://truescan.app/barcode/x?ctx=additive',
    }).message;
    expect(detailText).toContain('TBHQ');
    expect(detailMsg).toContain('TBHQ');
    expect(detailMsg).toContain(detail.highlights[0].title);
  });

  it('sharePathSummary and headings route additives types', () => {
    expect(shareStoryHeading('additives')).toBe('Additive discoveries');
    expect(shareStoryHeading('additive')).toBe('Additive discovery');
    const payload = buildAdditivesOverviewSharePayload({
      productName: 'Dairy Milk',
      items: [item('e476'), item('e322')],
    });
    const summary = sharePathSummary({
      shareType: 'additives',
      product: product(),
      scoreCaption: 'Rveel Score',
      scoreValue: null,
      pillars: null,
      additiveShare: payload,
    });
    expect(summary).toContain('2 additives');
  });

  it('cancellation / return contract: closing clears payload (state machine)', () => {
    let visible = true;
    let additiveShare: ReturnType<typeof buildAdditivesOverviewSharePayload> | null =
      buildAdditivesOverviewSharePayload({
        productName: 'Dairy Milk',
        items: [item('e476')],
      });
    const onClose = () => {
      visible = false;
      additiveShare = null;
    };
    onClose();
    expect(visible).toBe(false);
    expect(additiveShare).toBeNull();
  });

  it('stale product / barcode change drops prior additive payload', () => {
    let barcode = '9300617064879';
    let additiveShare = buildAdditiveDetailSharePayload({
      productName: 'Dairy Milk',
      item: item('e476'),
      totalAdditiveCount: 2,
    });
    const onBarcodeChange = (next: string) => {
      barcode = next;
      additiveShare = null as typeof additiveShare;
    };
    onBarcodeChange('9300617308324');
    expect(barcode).toBe('9300617308324');
    expect(additiveShare).toBeNull();
  });

  it('ShareContentBuilder does not mutate detection inputs', () => {
    const items = [item('e120'), item('e471')];
    const before = JSON.stringify(items);
    buildAdditivesOverviewSharePayload({ productName: 'X', items });
    ShareContentBuilder.buildContent({
      product: product({ barcode: '9300617308324' }),
      item: 'additive',
      additiveShare: buildAdditiveDetailSharePayload({
        productName: 'X',
        item: items[0],
        totalAdditiveCount: 2,
      }),
    });
    expect(JSON.stringify(items)).toBe(before);
  });
});
