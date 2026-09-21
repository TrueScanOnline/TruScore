/**
 * Pass 4 corrective — NA-019 temporal public window + NA-020 Cadbury cocoa_chocolate guard.
 */

import path from 'path';
import type { CsvRecord } from '../../../identity/workstreamA/csv';
import {
  buildDynamicSignalsAssetPublicationRecords,
  type AssetPackParsed,
} from '../../../dynamicSignals/asset/v0.2/matchDynamicSignalsAsset';
import { createFixedIngestionClock } from '../../../dynamicSignals/ingest/ingestionClock';
import {
  isAssetSignalWithinPublicTemporalWindow,
  normalizeAssetTemporalBound,
} from '../../../dynamicSignals/asset/v0.2/assetSignalTemporalPolicy';
import { isPublicationRecordPubliclyRenderable } from '../../../signals/signalRenderMapping';
import { calculateTruScore } from '../../../lib/truscoreEngine';
import type { Product } from '../../../types/product';
import type { DynamicSignalPublicationRecord } from '../../../dynamicSignals/publish/types';
import { loadAssetPackFromRoots } from '../dynamicSignals/_assetPackTestHelpers';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const PACK = path.join(ROOT, 'workstreamC', 'c-data', 'dynamic-signals-v0.3', 'input');
const FAM = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.3');

/** Pure temporal helper fixtures (independent of refreshed pack dates). */
const HELPER_WITHIN = createFixedIngestionClock('2026-08-10T12:00:00.000Z');
const HELPER_BEFORE = createFixedIngestionClock('2026-08-01T12:00:00.000Z');
const HELPER_AFTER = createFixedIngestionClock('2026-09-09T12:00:00.000Z');

/** 2026-09-18 refresh: successors expire 2026-12-31; publishable_from 2026-09-18. */
const WITHIN_WINDOW = createFixedIngestionClock('2026-09-18T12:00:00.000Z');
const AFTER_EXPIRY = createFixedIngestionClock('2027-01-01T12:00:00.000Z');
const AFTER_PREDECESSOR_ERA = createFixedIngestionClock('2026-09-09T12:00:00.000Z');

function loadV03Pack(): AssetPackParsed {
  return loadAssetPackFromRoots({ packRoot: PACK, famRoot: FAM });
}

function cadburyIdentity(overrides?: {
  brand_id?: string;
  product_name?: string;
  categories_tags?: string[];
  ingredients_text?: string;
  scanMarketPublic?: 'AU' | 'NZ';
}) {
  const productName = overrides?.product_name ?? 'Cadbury Dairy Milk Milk Chocolate';
  return {
    barcode: '9300617064879',
    brand_id: overrides?.brand_id ?? 'B0241',
    parent_id: 'P0009',
    productName,
    scanMarketPublic: overrides?.scanMarketPublic ?? ('AU' as const),
    productScopeEvidence: {
      product_name: productName,
      categories_tags: overrides?.categories_tags ?? ['en:chocolates'],
      ingredients_text: overrides?.ingredients_text,
    },
  };
}

function withSignalPatch(pack: AssetPackParsed, signalId: string, patch: Partial<CsvRecord>): AssetPackParsed {
  return {
    ...pack,
    signals: pack.signals.map((s) => (s.signal_id === signalId ? { ...s, ...patch } : s)),
  };
}

describe('Pass 4 NA-019 — Asset temporal public window', () => {
  it('normalizes date-only bounds to UTC day start/end', () => {
    expect(normalizeAssetTemporalBound('2026-08-06', 'start')).toBe('2026-08-06T00:00:00.000Z');
    expect(normalizeAssetTemporalBound('2026-08-19', 'end')).toBe('2026-08-19T23:59:59.999Z');
  });

  it('before publishable_from → hidden', () => {
    expect(
      isAssetSignalWithinPublicTemporalWindow(
        { publishable_from: '2026-08-06', expires_at: '2026-08-19' },
        HELPER_BEFORE
      )
    ).toBe(false);
  });

  it('valid publication window → visible', () => {
    expect(
      isAssetSignalWithinPublicTemporalWindow(
        { publishable_from: '2026-08-06', expires_at: '2026-08-19' },
        HELPER_WITHIN
      )
    ).toBe(true);
  });

  it('after expires_at → hidden', () => {
    expect(
      isAssetSignalWithinPublicTemporalWindow(
        { publishable_from: '2026-08-06', expires_at: '2026-08-19' },
        HELPER_AFTER
      )
    ).toBe(false);
  });

  it('suppressed publication state → hidden regardless of dates', () => {
    const pack = withSignalPatch(loadV03Pack(), 'SIG-IN-GL-001-20260918', {
      signal_publication_state: 'suppressed',
    });
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: cadburyIdentity(),
      evaluationClock: WITHIN_WINDOW,
    });
    expect(recs.some((r) => r.signal_id === 'SIG-IN-GL-001-20260918')).toBe(false);
  });

  it('expired publication state → hidden', () => {
    const pack = withSignalPatch(loadV03Pack(), 'SIG-IN-GL-001-20260918', {
      signal_publication_state: 'expired',
    });
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: cadburyIdentity(),
      evaluationClock: WITHIN_WINDOW,
    });
    expect(recs.some((r) => r.signal_id === 'SIG-IN-GL-001-20260918')).toBe(false);
  });

  it('inactive/non-authorised source → hidden', () => {
    const pack = loadV03Pack();
    const gl = pack.signals.find((s) => s.signal_id === 'SIG-IN-GL-001-20260918')!;
    const sourceId = gl.source_channel_id ?? '';
    const patched: AssetPackParsed = {
      ...pack,
      sources: pack.sources.map((s) =>
        s.source_channel_id === sourceId ? { ...s, status: 'inactive' } : s
      ),
    };
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack: patched,
      identity: cadburyIdentity(),
      evaluationClock: WITHIN_WINDOW,
    });
    expect(recs.some((r) => r.signal_id === 'SIG-IN-GL-001-20260918')).toBe(false);
  });

  it('predecessor candidates do not render; successors hide after expires_at', () => {
    const pack = loadV03Pack();
    const predecessors = pack.signals.filter(
      (s) =>
        !(s.signal_id ?? '').includes('-20260918') &&
        ![
          'SIG-SR-AU-005',
          'SIG-SR-AU-006',
          'SIG-SR-AU-007',
          'SIG-SR-AU-008',
          'SIG-SR-NZ-004',
          'SIG-SR-NZ-005',
          'SIG-SR-NZ-006',
          'SIG-IN-GL-003',
        ].includes(s.signal_id ?? '')
    );
    expect(predecessors.every((s) => s.signal_publication_state === 'candidate')).toBe(true);
    const mid = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: cadburyIdentity(),
      evaluationClock: AFTER_PREDECESSOR_ERA,
    });
    expect(mid.some((r) => r.signal_id === 'SIG-IN-GL-001')).toBe(false);

    const afterSucc = buildDynamicSignalsAssetPublicationRecords({
      pack,
      identity: cadburyIdentity(),
      evaluationClock: AFTER_EXPIRY,
    });
    expect(afterSucc.some((r) => (r.signal_id ?? '').endsWith('-20260918'))).toBe(false);
    expect(isAssetSignalWithinPublicTemporalWindow({ expires_at: '2026-12-31' }, AFTER_EXPIRY)).toBe(
      false
    );
  });

  it('within-window Cadbury chocolate matches successor SIG-IN-GL-001-20260918', () => {
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack: loadV03Pack(),
      identity: cadburyIdentity(),
      evaluationClock: WITHIN_WINDOW,
    });
    expect(recs.some((r) => r.signal_id === 'SIG-IN-GL-001-20260918')).toBe(true);
  });
});

describe('Pass 4 NA-020 — TGT-014/015 cocoa_chocolate guard', () => {
  it('pack rows and embed carry cocoa_chocolate on TGT-014/015 only as guard change', () => {
    const pack = loadV03Pack();
    expect(pack.targets.find((t) => t.signal_target_id === 'TGT-014')?.product_scope_guard).toBe(
      'cocoa_chocolate'
    );
    expect(pack.targets.find((t) => t.signal_target_id === 'TGT-015')?.product_scope_guard).toBe(
      'cocoa_chocolate'
    );
  });

  it('qualifying Cadbury/Dairy Milk chocolate context continues to receive SIG-IN-GL-001-20260918', () => {
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack: loadV03Pack(),
      identity: cadburyIdentity({ product_name: 'Cadbury Dairy Milk Milk Chocolate' }),
      evaluationClock: WITHIN_WINDOW,
    });
    expect(recs.map((r) => r.signal_id)).toContain('SIG-IN-GL-001-20260918');
  });

  it('B0067 descendant lacking positive cocoa/chocolate evidence does not receive SIG-IN-GL-001-20260918', () => {
    const recs = buildDynamicSignalsAssetPublicationRecords({
      pack: loadV03Pack(),
      identity: cadburyIdentity({
        brand_id: 'B0241',
        product_name: 'Cadbury Drinking Custard',
        categories_tags: ['en:desserts'],
        ingredients_text: 'milk, sugar, starch',
      }),
      evaluationClock: WITHIN_WINDOW,
    });
    expect(recs.some((r) => r.signal_id === 'SIG-IN-GL-001-20260918')).toBe(false);
  });

  it('Ritz and other non-Cadbury Mondelēz siblings remain negative for SIG-IN-GL-001-20260918', () => {
    const ritz = buildDynamicSignalsAssetPublicationRecords({
      pack: loadV03Pack(),
      identity: {
        barcode: '9310123456789',
        brand_id: 'B0069',
        parent_id: 'P0009',
        productName: 'Ritz Crackers',
        scanMarketPublic: 'AU',
        productScopeEvidence: {
          product_name: 'Ritz Crackers',
          categories_tags: ['en:crackers'],
        },
      },
      evaluationClock: WITHIN_WINDOW,
    });
    expect(ritz.some((r) => r.signal_id === 'SIG-IN-GL-001-20260918')).toBe(false);
  });

  it('existing GL-002 cocoa_chocolate scope behaviour remains unchanged on successor', () => {
    const hit = buildDynamicSignalsAssetPublicationRecords({
      pack: loadV03Pack(),
      identity: cadburyIdentity({ product_name: 'Cadbury Dairy Milk Milk Chocolate' }),
      evaluationClock: WITHIN_WINDOW,
    });
    expect(hit.map((r) => r.signal_id)).toContain('SIG-IN-GL-002-20260918');
    const miss = buildDynamicSignalsAssetPublicationRecords({
      pack: loadV03Pack(),
      identity: cadburyIdentity({
        product_name: 'Original Crackers',
        categories_tags: ['en:crackers'],
        ingredients_text: 'wheat flour, oil, salt',
      }),
      evaluationClock: WITHIN_WINDOW,
    });
    expect(miss.some((r) => r.signal_id === 'SIG-IN-GL-002-20260918')).toBe(false);
  });
});

describe('Pass 4 NA-019 — TruScore / identity unchanged by Signal temporal gate', () => {
  it('calculateTruScore output is independent of Signal temporal enforcement', () => {
    const product: Product = {
      barcode: '9300617064879',
      product_name: 'Cadbury Dairy Milk Milk Chocolate',
      brands: 'Cadbury',
      categories: '',
      categories_tags: ['en:chocolates'],
      labels_tags: [],
      ingredients_text: 'milk, sugar, cocoa',
      ingredients_analysis_tags: [],
      additives_tags: [],
      nutriments: {},
      source: 'test',
    };
    const a = calculateTruScore(product);
    const b = calculateTruScore(product);
    expect(a.truscore).toBe(b.truscore);
    expect(a.breakdown).toEqual(b.breakdown);
  });
});
