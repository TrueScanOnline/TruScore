import { FrozenAttributionRowStore } from '../../../benchmark/frozenAttributionRowStore';
import { materializeFrozenBenchmarkAttribution } from '../../../benchmark/materializeFrozenBenchmarkAttribution';
import { FREEZE_GUARD_INTENT, getFreezeGuardEvents, resetFreezeGuardEventsForTests } from '../../../benchmark/freezeGuards';
import { selectBenchmarkSnapshot } from '../../../benchmark/snapshotSelect';
import { resetAttributionDiffSequenceForTests } from '../../../benchmark/auditAttributionDiff';
import { frozenAttributionRowKey } from '../../../benchmark/frozenAttributionRowKey';
import type { SharedIdentityContext } from '../../../identity/types';
import type { Product } from '../../../types/product';
import type { FrozenBenchmarkAttributionObject } from '../../../benchmark/types';

function baseContext(): SharedIdentityContext {
  return {
    resolution_key: { gtin: '9300633072391', market_key: 'AU' },
    canonical: {
      product_id: 'gtin:9300633072391',
      brand_id: 'brand:acme',
      current_owner_entity_id: 'owner:new_owner',
    },
    operational_entities: {},
    quality: {
      confidence_state: 'strong',
      review_state: 'reviewed',
      resolution_status: 'resolved',
      ambiguity_flags: [],
    },
    lineage: { source_refs: ['openfoodfacts'], alias_hits: [], normalizer_version: 'v1' },
  };
}

function baseProduct(overrides: Partial<Product> = {}): Product {
  return {
    barcode: '9300633072391',
    brand_owner: 'New Owner Ltd',
    source: 'openfoodfacts',
    ...overrides,
  };
}

function cloneForAttempt(raw: FrozenBenchmarkAttributionObject): FrozenBenchmarkAttributionObject {
  return JSON.parse(JSON.stringify(raw)) as FrozenBenchmarkAttributionObject;
}

function makeV1(benchmarkName: 'BBFAW' | 'KTC' = 'BBFAW'): FrozenBenchmarkAttributionObject {
  return materializeFrozenBenchmarkAttribution({
    snapshot: selectBenchmarkSnapshot(benchmarkName),
    benchmarkName,
    product: baseProduct({
      phase6_current_owner_effective_date: '2024-01-01',
    }),
    sharedIdentityContext: baseContext(),
  });
}

function makeV2(
  v1: FrozenBenchmarkAttributionObject,
  newSnapshotVersion: string
): FrozenBenchmarkAttributionObject {
  const next: FrozenBenchmarkAttributionObject = cloneForAttempt(v1);
  next.snapshot_ref.snapshot_version = newSnapshotVersion;
  return Object.freeze({
    ...next,
    snapshot_ref: Object.freeze({ ...next.snapshot_ref }),
    subject_resolution: Object.freeze({ ...next.subject_resolution }),
    comparison_context: Object.freeze({ ...next.comparison_context }),
    state: Object.freeze({ ...next.state }),
    eligibility: Object.freeze({ ...next.eligibility }),
    freeze: Object.freeze({ ...next.freeze, freeze_status: 'frozen' }),
  });
}

describe('Slice 4: freeze guards + store', () => {
  let store: FrozenAttributionRowStore;

  beforeEach(() => {
    store = new FrozenAttributionRowStore();
    resetFreezeGuardEventsForTests();
    resetAttributionDiffSequenceForTests();
  });

  it('rejects in-place update on an active frozen row and logs a guard event (dynamic_refresh source)', () => {
    const a = makeV1();
    const k = frozenAttributionRowKey(a);
    const reg = store.registerInitial(a, 'persistence');
    expect(reg).toEqual({ ok: true, key: k });
    const attempted = cloneForAttempt(a);
    attempted.subject_resolution.benchmark_owner_legal_name = 'Hacked In Place';
    const upd = store.tryInPlaceUpdate(attempted, 'dynamic_refresh');
    expect(upd.ok).toBe(false);
    if (upd.ok) throw new Error('expected block');
    expect(store.get(k)?.value).toBe(a);
    const ev = getFreezeGuardEvents().filter((e) => e.intent === FREEZE_GUARD_INTENT.in_place_update);
    expect(ev.length).toBe(1);
    expect(ev[0].source).toBe('dynamic_refresh');
    expect(ev[0].result).toBe('blocked');
  });

  it('applies superseding correction with a new key, marks old superseded, and records an audit diff', () => {
    const v1 = makeV1();
    const k1 = frozenAttributionRowKey(v1);
    const reg = store.registerInitial(v1, 'persistence');
    expect(reg.ok).toBe(true);
    const v2 = makeV2(v1, 'bbfaw-2024-qual-v2-slice4');
    const k2 = frozenAttributionRowKey(v2);
    expect(k2).not.toBe(k1);
    const r = store.applySupersedingCorrection(v1, v2, {
      rationale: 'Ownership correction',
      approver_ref: 'approver:seed',
      source: 'service',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('expected supersede');
    expect(r.from_key).toBe(k1);
    expect(r.to_key).toBe(k2);
    expect(r.diff.field_changes.map((c) => c.path)).toContain('snapshot_version');
    expect(store.get(k1)?.isSuperseded).toBe(true);
    expect(store.get(k2)?.isSuperseded).toBe(false);
    expect(getFreezeGuardEvents().filter((e) => e.intent === FREEZE_GUARD_INTENT.supersede).length).toBe(1);
  });

  it('rejects supersession when the replacement key is unchanged', () => {
    const v1 = makeV1();
    expect(store.registerInitial(v1, 'persistence').ok).toBe(true);
    const sameKeyCopy = cloneForAttempt(v1);
    const r = store.applySupersedingCorrection(v1, sameKeyCopy, {
      rationale: 'n/a',
      approver_ref: 'a',
      source: 'test',
    });
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.reason).toContain('different_composite_key');
  });

  it('rejects a second in-place after supersede on the same logical row key', () => {
    const v1 = makeV1();
    const k1 = frozenAttributionRowKey(v1);
    store.registerInitial(v1, 'persistence');
    const v2 = makeV2(v1, 'bbfaw-2024-qual-v2-b');
    store.applySupersedingCorrection(v1, v2, { rationale: 'c', approver_ref: 'a', source: 'service' });
    const v1b = cloneForAttempt(v1);
    const re = store.tryInPlaceUpdate(v1b, 'test');
    expect(re.ok).toBe(false);
    if (re.ok) throw new Error('expected no in-place on superseded slot');
  });
});
