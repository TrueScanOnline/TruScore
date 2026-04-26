import type { ProductWithTrustScore } from '../../../types/product';
import type { DynamicSignalPublicationRecord } from '../../../dynamicSignals/publish/types';
import type { Phase6FixtureCase } from './types';

function baseProduct(over: Partial<ProductWithTrustScore> = {}): ProductWithTrustScore {
  return {
    barcode: '9300633072391',
    product_name: 'Phase6 Fixture Product',
    brands: 'Acme Foods',
    brand_owner: 'Acme Foods Pty Ltd',
    source: 'openfoodfacts',
    trust_score: 72,
    trust_score_breakdown: { body: 18, planet: 18, ethics: 18, open: 18, reasons: [] },
    ...over,
  } as ProductWithTrustScore;
}

function pubRecord(
  input: Pick<DynamicSignalPublicationRecord, 'signal_id' | 'dedupe_key' | 'signal_class' | 'signal_publication_state'> &
    Partial<DynamicSignalPublicationRecord>
): DynamicSignalPublicationRecord {
  return {
    signal_id: input.signal_id,
    dedupe_key: input.dedupe_key,
    signal_class: input.signal_class,
    signal_publication_state: input.signal_publication_state,
    resolution_key: input.resolution_key ?? { gtin: '9300633072391', market_key: 'AU' },
    state:
      input.state ?? { confidence_state: 'strong', review_state: 'reviewed', resolution_status: 'resolved' },
    lineage_reference: input.lineage_reference ?? `phase6:pub:signal:${input.signal_id}`,
    source_idempotency_key: input.source_idempotency_key ?? `fixture|${input.signal_id}`,
    staleness: input.staleness ?? { valid_until: '2030-01-01T00:00:00.000Z' },
    editorial: input.editorial ?? { priority: 0, due_at: null, last_reviewed_at: null },
    mislink: input.mislink ?? { open_report_count: 0, last_event_at: null },
  };
}

export const PHASE6_FIXTURE_SCHEMA_ID = 'phase6.fixture.schema.v1';
export const PHASE6_FIXTURE_PACK_VERSION = 'phase6.pack.v1.0.0';

export const PHASE6_FIXTURES: Phase6FixtureCase[] = [
  {
    id: 'p0-frozen-eligibility-gate-b',
    title: 'Frozen benchmark eligibility gate enforces deterministic ineligible state',
    severity: 'P0',
    layer: 'frozen_benchmark',
    gate_tags: ['B'],
    clock_iso: '2026-06-01T12:00:00.000Z',
    input: {
      barcode: '9300633072391',
      marketHint: 'AU',
      product: baseProduct(),
      dynamic_records: [],
      phase6SignalSourceMode: 'governed_5b_only',
      frozen_probe: {
        benchmark_name: 'BBFAW',
        review_state: 'provisional',
        resolution_status: 'needs_review',
        blocker_flags: ['needs_review'],
      },
    },
    expected: {
      public_market: 'AU',
      publishable_signal_ids: [],
      disallowed_signal_ids: [],
      has_legacy_banner_signals: false,
      frozen_ethics_scoring_eligible: false,
    },
  },
  {
    id: 'p0-identity-au-nz-public-no-leak',
    title: 'Internal AU+NZ does not leak to ProductScanResult.market',
    severity: 'P0',
    layer: 'identity',
    gate_tags: ['A', 'E'],
    clock_iso: '2026-06-01T12:00:00.000Z',
    input: {
      barcode: '9300633072391',
      marketHint: 'AU+NZ',
      product: baseProduct(),
      dynamic_records: [],
      phase6SignalSourceMode: 'governed_5b_only',
    },
    expected: {
      public_market: 'UNKNOWN',
      publishable_signal_ids: [],
      disallowed_signal_ids: [],
      has_legacy_banner_signals: false,
    },
  },
  {
    id: 'p0-dynamic-blocked-never-public',
    title: 'Blocked dynamic record never surfaces in public signals',
    severity: 'P0',
    layer: 'dynamic_signals',
    gate_tags: ['C', 'E'],
    clock_iso: '2026-06-01T12:00:00.000Z',
    input: {
      barcode: '9300633072391',
      marketHint: 'AU',
      product: baseProduct(),
      dynamic_records: [
        pubRecord({
          signal_id: 'blocked-1',
          dedupe_key: 'p6|safety_regulatory|blocked-1',
          signal_class: 'safety_regulatory',
          signal_publication_state: 'suppressed',
        }),
      ],
      phase6SignalSourceMode: 'governed_5b_only',
    },
    expected: {
      public_market: 'AU',
      publishable_signal_ids: [],
      disallowed_signal_ids: ['blocked-1'],
      has_legacy_banner_signals: false,
    },
  },
  {
    id: 'p0-publication-order-deterministic',
    title: 'Publication render order follows owner mapping precedence',
    severity: 'P0',
    layer: 'cross_layer',
    gate_tags: ['D', 'E'],
    clock_iso: '2026-06-01T12:00:00.000Z',
    input: {
      barcode: '9300633072391',
      marketHint: 'AU',
      product: baseProduct(),
      dynamic_records: [
        pubRecord({
          signal_id: 'c1',
          dedupe_key: 'p6|my_choices_chain|z',
          signal_class: 'my_choices_chain',
          signal_publication_state: 'publishable',
        }),
        pubRecord({
          signal_id: 'a2',
          dedupe_key: 'p6|safety_regulatory|b',
          signal_class: 'safety_regulatory',
          signal_publication_state: 'publishable',
        }),
        pubRecord({
          signal_id: 'a1',
          dedupe_key: 'p6|safety_regulatory|a',
          signal_class: 'safety_regulatory',
          signal_publication_state: 'publishable',
        }),
      ],
      phase6SignalSourceMode: 'governed_5b_only',
    },
    expected: {
      public_market: 'AU',
      publishable_signal_ids: ['a1', 'a2', 'c1'],
      disallowed_signal_ids: [],
      has_legacy_banner_signals: false,
    },
  },
  {
    id: 'p0-release-mode-disables-legacy-feeders',
    title: 'Release governed mode excludes legacy banner/synthetic feeder outputs',
    severity: 'P0',
    layer: 'cross_layer',
    gate_tags: ['E'],
    clock_iso: '2026-06-01T12:00:00.000Z',
    input: {
      barcode: '9300633072391',
      marketHint: 'AU',
      product: baseProduct({ source: 'web_search', trust_score: 65 }),
      dynamic_records: [],
      phase6SignalSourceMode: 'governed_5b_only',
    },
    expected: {
      public_market: 'AU',
      publishable_signal_ids: [],
      disallowed_signal_ids: [],
      has_legacy_banner_signals: false,
    },
  },
  {
    id: 'p1-transitional-mode-allows-legacy-feeders',
    title: 'Transitional mode retains legacy feeder behavior as bounded MVP condition',
    severity: 'P1',
    layer: 'cross_layer',
    gate_tags: ['E'],
    clock_iso: '2026-06-01T12:00:00.000Z',
    input: {
      barcode: '9300633072391',
      marketHint: 'AU',
      product: baseProduct({ source: 'web_search', trust_score: 65 }),
      dynamic_records: [],
      phase6SignalSourceMode: 'transitional',
    },
    expected: {
      public_market: 'AU',
      publishable_signal_ids: [
        'transparency-limited-data-9300633072391',
        'transparency-web-search-9300633072391',
      ],
      disallowed_signal_ids: [],
      has_legacy_banner_signals: true,
    },
  },
];

