/**
 * Dynamic Signals Asset v0.3 — pack load, cocoa_chocolate guard, presentation labels.
 * Does not invent GTINs. Workbook resolution/publication states are used as-is;
 * matcher proofs overlay resolved + publishable on the approved corporate targets only.
 */

import fs from 'fs';
import path from 'path';
import { parseCsv, type CsvRecord } from '../../../identity/workstreamA/csv';
import { buildProductFamilyMapsFromCsvRecords } from '../../../identity/chaining/productFamilyMaps';
import {
  buildBrandHierarchyMapsFromCsvRecords,
  buildEntityHierarchyMapsFromCsvRecords,
} from '../../../identity/chaining/brandEntityHierarchyMaps';
import {
  buildDynamicSignalsAssetPublicationRecords,
  requiresFoodRecallMatcherEligibility,
  type AssetPackParsed,
} from '../../../dynamicSignals/asset/v0.2/matchDynamicSignalsAsset';
import {
  productHasPositiveCocoaChocolateEvidence,
  productScopeGuardAllowsDisplay,
} from '../../../dynamicSignals/asset/v0.2/cocoaChocolateProductScopeGuard';
import { buildProductScanResult } from '../../../services/buildProductScanResult';
import {
  buildBannerAlertsDataFromScanResult,
  flattenSignalsOrdered,
} from '../../../utils/scanResultPresentation';
import {
  consumerSignalCategoryLabel,
  mapPublicationRecordToSignalCard,
} from '../../../signals/signalRenderMapping';
import { lightColors } from '../../../theme/colors';
import type { DynamicSignalPublicationRecord } from '../../../dynamicSignals/publish/types';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const PACK = path.join(ROOT, 'workstreamC', 'c-data', 'dynamic-signals-v0.3', 'input');
const FAM = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.2');
const GL002_TARGETS = ['TGT-020', 'TGT-021', 'TGT-022', 'TGT-023', 'TGT-024', 'TGT-025'];

function loadV03Pack(): AssetPackParsed {
  const read = (p: string) => parseCsv(fs.readFileSync(p, 'utf8'));
  return {
    sources: read(path.join(PACK, 'source_universe.csv')),
    signals: read(path.join(PACK, 'signals.csv')),
    targets: read(path.join(PACK, 'signal_targets.csv')),
    familyMaps: buildProductFamilyMapsFromCsvRecords(
      read(path.join(FAM, 'product_families.csv')),
      read(path.join(FAM, 'product_family_membership.csv'))
    ),
    brandHierarchy: buildBrandHierarchyMapsFromCsvRecords(
      read(path.join(FAM, 'brand_child_of_brand.csv'))
    ),
    entityHierarchy: buildEntityHierarchyMapsFromCsvRecords(
      read(path.join(FAM, 'entity_child_of_entity.csv'))
    ),
    recallEligibility: [],
    recallNotices: [],
  };
}

function withPublishable(signals: CsvRecord[], ids: string[]): CsvRecord[] {
  const set = new Set(ids);
  return signals.map((s) =>
    set.has(s.signal_id ?? '')
      ? { ...s, signal_publication_state: 'publishable', review_state: 'reviewed' }
      : s
  );
}

function withResolvedGl002(pack: AssetPackParsed): AssetPackParsed {
  const live = new Set(GL002_TARGETS);
  return {
    ...pack,
    signals: withPublishable(pack.signals, ['SIG-IN-GL-002']),
    targets: pack.targets.map((t) =>
      live.has(t.signal_target_id ?? '') ? { ...t, resolution_status: 'resolved' } : t
    ),
  };
}

function matchGl002(input: {
  barcode: string;
  brand_id: string;
  parent_id: string;
  product_name: string;
  categories_tags?: string[];
  ingredients_text?: string;
}) {
  const pack = withResolvedGl002(loadV03Pack());
  return buildDynamicSignalsAssetPublicationRecords({
    pack,
    identity: {
      barcode: input.barcode,
      brand_id: input.brand_id,
      parent_id: input.parent_id,
      product_family_ids: [],
      scanMarketPublic: 'AU',
      productScopeEvidence: {
        product_name: input.product_name,
        categories_tags: input.categories_tags,
        ingredients_text: input.ingredients_text,
      },
    },
  });
}

describe('cocoa_chocolate product_scope_guard', () => {
  it('returns false when positive product evidence is absent', () => {
    expect(productHasPositiveCocoaChocolateEvidence(null)).toBe(false);
    expect(productHasPositiveCocoaChocolateEvidence({})).toBe(false);
    expect(
      productHasPositiveCocoaChocolateEvidence({
        product_name: 'Original Crackers',
        categories_tags: ['en:crackers'],
        ingredients_text: 'wheat flour, oil, salt',
      })
    ).toBe(false);
  });

  it('matches chocolate / choc / cocoa / cacao after case and spacing normalisation', () => {
    expect(productHasPositiveCocoaChocolateEvidence({ product_name: '  Dairy Milk Chocolate  ' })).toBe(
      true
    );
    expect(productHasPositiveCocoaChocolateEvidence({ generic_name: 'Choc-Chip Ice Cream' })).toBe(true);
    expect(productHasPositiveCocoaChocolateEvidence({ categories: 'Cocoa Spreads' })).toBe(true);
    expect(productHasPositiveCocoaChocolateEvidence({ categories_tags: ['en:cacao-powders'] })).toBe(
      true
    );
    expect(productHasPositiveCocoaChocolateEvidence({ ingredients_text: 'Sugar, COCOA mass' })).toBe(
      true
    );
  });

  it('empty guard allows display; unknown guard fails closed', () => {
    expect(productScopeGuardAllowsDisplay('', { product_name: 'Water' })).toBe(true);
    expect(productScopeGuardAllowsDisplay('cocoa_chocolate', { product_name: 'Water' })).toBe(false);
    expect(productScopeGuardAllowsDisplay('not_a_real_guard', { product_name: 'Chocolate' })).toBe(
      false
    );
  });
});

describe('Dynamic Signals Asset v0.3 pack', () => {
  it('validates and loads workbook counts (14 sources / 18 signals / 27 targets)', () => {
    const pack = loadV03Pack();
    expect(pack.sources).toHaveLength(14);
    expect(pack.signals).toHaveLength(18);
    expect(pack.targets).toHaveLength(27);
    expect(pack.sources.some((s) => s.source_channel_id === 'SRC-FOOD-SAFETY-NEWS')).toBe(true);
    expect(pack.signals.every((s) => s.signal_publication_state === 'publishable')).toBe(true);
  });

  it('adding Food Safety News does not itself create a Signal', () => {
    const pack = loadV03Pack();
    expect(pack.signals.some((s) => s.source_channel_id === 'SRC-FOOD-SAFETY-NEWS')).toBe(false);
  });

  it('SIG-SR-AU-003 is classified in_the_news; ACCC/NZ ComCom sources are in_the_news', () => {
    const pack = loadV03Pack();
    expect(pack.signals.find((s) => s.signal_id === 'SIG-SR-AU-003')?.signal_class).toBe('in_the_news');
    expect(pack.sources.find((s) => s.source_channel_id === 'SRC-ACCC')?.eligible_signal_class).toBe(
      'in_the_news'
    );
    expect(pack.sources.find((s) => s.source_channel_id === 'SRC-NZ-COMCOM')?.eligible_signal_class).toBe(
      'in_the_news'
    );
  });

  it('new Food Safety Signals remain restricted to product/date scope and have no invented GTINs', () => {
    const pack = loadV03Pack();
    const vogel = pack.signals.find((s) => s.signal_id === 'SIG-SR-NZ-003')!;
    const chen = pack.signals.find((s) => s.signal_id === 'SIG-SR-AU-004')!;
    expect(vogel.signal_class).toBe('safety_regulatory');
    expect(chen.signal_class).toBe('safety_regulatory');

    const vogelT = pack.targets.find((t) => t.signal_target_id === 'TGT-028')!;
    const chenT = pack.targets.find((t) => t.signal_target_id === 'TGT-029')!;
    expect(vogelT.canonical_target_id).toBe('');
    expect(chenT.canonical_target_id).toBe('');
    expect(vogelT.resolution_status).toBe('needs_review');
    expect(chenT.resolution_status).toBe('needs_review');
    expect(
      requiresFoodRecallMatcherEligibility(
        vogel.signal_class ?? '',
        vogelT.target_type ?? '',
        vogelT.propagation_mode ?? ''
      )
    ).toBe(true);
    expect(
      requiresFoodRecallMatcherEligibility(
        chen.signal_class ?? '',
        chenT.target_type ?? '',
        chenT.propagation_mode ?? ''
      )
    ).toBe(true);

    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack: {
        ...pack,
        signals: withPublishable(pack.signals, ['SIG-SR-NZ-003', 'SIG-SR-AU-004']),
        targets: pack.targets.map((t) =>
          t.signal_target_id === 'TGT-028' || t.signal_target_id === 'TGT-029'
            ? { ...t, resolution_status: 'resolved', canonical_target_id: 'SHOULD_NOT_INVENT' }
            : t
        ),
      },
      identity: {
        barcode: 'SHOULD_NOT_INVENT',
        brand_id: null,
        parent_id: null,
        product_family_ids: [],
        scanMarketPublic: 'NZ',
      },
    });
    expect(recs.some((r) => r.signal_id === 'SIG-SR-NZ-003' || r.signal_id === 'SIG-SR-AU-004')).toBe(
      false
    );
  });
});

describe('SIG-IN-GL-002 v0.3 corporate targets + cocoa_chocolate guard', () => {
  it('propagates through approved corporate targets only when the guard passes', () => {
    const hit = matchGl002({
      barcode: '9300617064879',
      brand_id: 'B0241',
      parent_id: 'P0009',
      product_name: 'Cadbury Dairy Milk Milk Chocolate',
      categories_tags: ['en:chocolates'],
    });
    expect(hit.map((r) => r.signal_id)).toContain('SIG-IN-GL-002');

    const miss = matchGl002({
      barcode: '9300617064879',
      brand_id: 'B0241',
      parent_id: 'P0009',
      product_name: 'Original Crackers',
      categories_tags: ['en:crackers'],
      ingredients_text: 'wheat flour, oil, salt',
    });
    expect(miss.some((r) => r.signal_id === 'SIG-IN-GL-002')).toBe(false);
  });

  it('non-cocoa sibling products under the same parent do not receive SIG-IN-GL-002', () => {
    const ritz = matchGl002({
      barcode: '9310123456789',
      brand_id: 'B0069',
      parent_id: 'P0009',
      product_name: 'Ritz Crackers',
      categories_tags: ['en:crackers'],
    });
    expect(ritz.some((r) => r.signal_id === 'SIG-IN-GL-002')).toBe(false);
  });

  it('Magnum receives the historical Signal only through its explicit brand target', () => {
    const magnum = matchGl002({
      barcode: '9300652000001',
      brand_id: 'B0105',
      parent_id: 'P0014',
      product_name: 'Magnum Classic Chocolate Ice Cream',
      ingredients_text: 'cream, cocoa mass, sugar',
    });
    expect(magnum.map((r) => r.signal_id)).toContain('SIG-IN-GL-002');
  });

  it('unrelated current TMICC brands do not inherit SIG-IN-GL-002', () => {
    const cornetto = matchGl002({
      barcode: '9300652000002',
      brand_id: 'B0107',
      parent_id: 'P0014',
      product_name: 'Cornetto Chocolate Cone',
      ingredients_text: 'cocoa, cream, sugar',
    });
    expect(cornetto.some((r) => r.signal_id === 'SIG-IN-GL-002')).toBe(false);

    const streets = matchGl002({
      barcode: '9300652000003',
      brand_id: 'B0104',
      parent_id: 'P0014',
      product_name: 'Streets Chocolate Ice Cream',
    });
    expect(streets.some((r) => r.signal_id === 'SIG-IN-GL-002')).toBe(false);
  });

  it('resolved targets on SIG-IN-GL-002 match for cocoa/chocolate product under named parent', () => {
    const pack = loadV03Pack();
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: {
        barcode: '9300617064879',
        brand_id: 'B0241',
        parent_id: 'P0009',
        product_family_ids: [],
        scanMarketPublic: 'AU',
        productScopeEvidence: { product_name: 'Dairy Milk Chocolate' },
      },
    });
    expect(recs.some((r) => r.signal_id === 'SIG-IN-GL-002')).toBe(true);
  });

  it('needs_review targets still fail closed when overlaid', () => {
    const pack = loadV03Pack();
    const overridden = pack.targets.map((t) =>
      t.signal_id === 'SIG-IN-GL-002' ? { ...t, resolution_status: 'needs_review' } : t
    );
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack: { ...pack, targets: overridden },
      identity: {
        barcode: '9300617064879',
        brand_id: 'B0241',
        parent_id: 'P0009',
        product_family_ids: [],
        scanMarketPublic: 'AU',
        productScopeEvidence: { product_name: 'Dairy Milk Chocolate' },
      },
    });
    expect(recs.some((r) => r.signal_id === 'SIG-IN-GL-002')).toBe(false);
  });
});

describe('Did You Know? consumer presentation', () => {
  const t = (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key;

  function pub(
    signal_id: string,
    signal_class: DynamicSignalPublicationRecord['signal_class']
  ): DynamicSignalPublicationRecord {
    return {
      signal_id,
      dedupe_key: `p6|dsa_v0_3|${signal_id}|1`,
      signal_class,
      signal_publication_state: 'publishable',
      resolution_key: { gtin: '1', market_key: 'AU' },
      state: { confidence_state: 'strong', review_state: 'reviewed', resolution_status: 'resolved' },
      lineage_reference: signal_id,
      source_idempotency_key: signal_id,
      staleness: { valid_until: '2099-12-31T23:59:59.000Z' },
      editorial: { priority: 0, due_at: null, last_reviewed_at: null },
      mislink: { open_report_count: 0, last_event_at: null },
      skeleton_card_copy: {
        title_display: signal_id,
        body_display: 'body',
        why_display: 'why',
      },
    };
  }

  it('maps Food Safety and In the News consumer labels; My Choices stays hidden', () => {
    expect(consumerSignalCategoryLabel('A')).toBe('Food Safety');
    expect(consumerSignalCategoryLabel('B')).toBe('In the News');
    expect(consumerSignalCategoryLabel('C')).toBeNull();

    const newsCard = mapPublicationRecordToSignalCard(pub('SIG-SR-AU-003', 'in_the_news'));
    expect(newsCard.class).toBe('B');
    expect(consumerSignalCategoryLabel(newsCard.class)).toBe('In the News');

    const safetyCard = mapPublicationRecordToSignalCard(pub('SIG-SR-NZ-003', 'safety_regulatory'));
    expect(safetyCard.class).toBe('A');
    expect(consumerSignalCategoryLabel(safetyCard.class)).toBe('Food Safety');

    const { result } = buildProductScanResult({
      barcode: '1',
      product: { barcode: '1', source: 'test', trust_score: 40 } as any,
      userPreferences: {} as any,
      isSubscriber: false,
      market: 'AU',
      terminal_state: 'success',
      dynamicSignalRecords: [
        pub('SIG-SR-AU-003', 'in_the_news'),
        pub('SIG-SR-NZ-003', 'safety_regulatory'),
        pub('CHOICE-HIDDEN', 'my_choices_chain'),
      ],
    });
    const banners = buildBannerAlertsDataFromScanResult(result, t as any);
    expect(banners.alerts.some((a) => a.id === 'CHOICE-HIDDEN')).toBe(false);
    expect(banners.alerts.find((a) => a.id === 'SIG-SR-AU-003')?.signalClass).toBe('B');
    expect(banners.alerts.find((a) => a.id === 'SIG-SR-NZ-003')?.signalClass).toBe('A');
    expect(flattenSignalsOrdered(result.signals).some((c) => c.class === 'C')).toBe(true);

    expect(lightColors.didYouKnow).toEqual({
      card: '#FFFFFF',
      badgeBackground: '#F5F6F7',
      border: '#D8DCE1',
      charcoal: '#44484E',
    });
  });
});
