/**
 * Phase E §8.4–8.5 focused Dynamic Signals refresh assurance
 * (Mon Sire AU/NZ separation, Woolworths non-propagation, Mondelez / comparator negatives,
 * candidate-GTIN fail-closed, residual exact-product fail-closed).
 */
import path from 'path';
import type { CsvRecord } from '../../../identity/workstreamA/csv';
import {
  buildDynamicSignalsAssetPublicationRecords,
  type AssetPackParsed,
} from '../../../dynamicSignals/asset/v0.2/matchDynamicSignalsAsset';
import { loadAssetPackFromRoots } from './_assetPackTestHelpers';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const PACK = path.join(ROOT, 'workstreamC', 'c-data', 'dynamic-signals-v0.3', 'input');
const FAM = path.join(ROOT, 'workstreamA', 'a-data', 'chaining-extensions', 'v0.3');
const CLOCK = { nowIso: () => '2026-09-18T00:00:00.000Z' };

function loadV03Pack(): AssetPackParsed {
  return loadAssetPackFromRoots({ packRoot: PACK, famRoot: FAM });
}

function match(input: {
  barcode: string;
  brand_id: string | null;
  parent_id: string | null;
  scanMarketPublic: 'AU' | 'NZ';
  productName?: string;
}) {
  return buildDynamicSignalsAssetPublicationRecords({
    pack: loadV03Pack(),
    identity: {
      barcode: input.barcode,
      brand_id: input.brand_id,
      parent_id: input.parent_id,
      productName: input.productName ?? '',
      scanMarketPublic: input.scanMarketPublic,
      productScopeEvidence: input.productName
        ? { product_name: input.productName }
        : undefined,
    },
    evaluationClock: CLOCK,
  });
}

describe('Phase E §8.4–8.5 Dynamic Signals refresh', () => {
  it('SIG-IN-GL-003 fires for Mondelez descendants in AU and NZ without cocoa guard', () => {
    const au = match({
      barcode: '9300617064879',
      brand_id: 'B0241',
      parent_id: 'P0009',
      scanMarketPublic: 'AU',
      productName: 'Original Crackers',
    });
    expect(au.map((r) => r.signal_id)).toContain('SIG-IN-GL-003');
    expect(au.find((r) => r.signal_id === 'SIG-IN-GL-003')?.skeleton_card_copy?.title_display).toContain(
      'Mondelez'
    );

    const nz = match({
      barcode: '9415007000001',
      brand_id: 'B0241',
      parent_id: 'P0009',
      scanMarketPublic: 'NZ',
      productName: 'Cadbury Dairy Milk',
    });
    expect(nz.map((r) => r.signal_id)).toContain('SIG-IN-GL-003');
  });

  it('Mars / Nestlé / Ferrero / Tony’s and non-Mondelez products do not receive SIG-IN-GL-003', () => {
    const cases: Array<{ brand_id: string; parent_id: string; name: string }> = [
      { brand_id: 'B0007', parent_id: 'P0007', name: 'Mars Bar' },
      { brand_id: 'B0008', parent_id: 'P0008', name: 'Nestlé KitKat' },
      { brand_id: 'B0017', parent_id: 'P0017', name: 'Ferrero Rocher' },
      { brand_id: 'B0999', parent_id: 'P0999', name: "Tony's Chocolonely" },
    ];
    for (const c of cases) {
      const recs = match({
        barcode: '9999999999999',
        brand_id: c.brand_id,
        parent_id: c.parent_id,
        scanMarketPublic: 'AU',
        productName: c.name,
      });
      expect(recs.some((r) => r.signal_id === 'SIG-IN-GL-003')).toBe(false);
    }
  });

  it('non-cocoa Mondelez products receive SIG-IN-GL-003 but not guarded SIG-IN-GL-002-20260918', () => {
    const recs = match({
      barcode: '9300617064879',
      brand_id: 'B0069',
      parent_id: 'P0009',
      scanMarketPublic: 'AU',
      productName: 'Ritz Crackers',
    });
    expect(recs.map((r) => r.signal_id)).toContain('SIG-IN-GL-003');
    expect(recs.some((r) => r.signal_id === 'SIG-IN-GL-002-20260918')).toBe(false);
  });

  it('Mon Sire Brie publishes in its own market only; AU and NZ recalls stay separated', () => {
    const au = match({
      barcode: '9300000000001',
      brand_id: 'B0798',
      parent_id: 'P0177',
      scanMarketPublic: 'AU',
      productName: 'Brie Mon Sire 1kg',
    });
    expect(au.map((r) => r.signal_id)).toContain('SIG-SR-AU-008');
    expect(au.some((r) => r.signal_id === 'SIG-SR-NZ-006')).toBe(false);

    const nz = match({
      barcode: '9410000000001',
      brand_id: 'B0798',
      parent_id: 'P0177',
      scanMarketPublic: 'NZ',
      productName: 'Mon Sire Brie Sabato',
    });
    expect(nz.map((r) => r.signal_id)).toContain('SIG-SR-NZ-006');
    expect(nz.some((r) => r.signal_id === 'SIG-SR-AU-008')).toBe(false);

    // Unrelated Mon Sire line stays out of scope in both markets.
    const sibling = match({
      barcode: '9300000000002',
      brand_id: 'B0798',
      parent_id: 'P0177',
      scanMarketPublic: 'AU',
      productName: 'Mon Sire Mascarpone 250g',
    });
    expect(sibling.some((r) => r.signal_id === 'SIG-SR-AU-008')).toBe(false);
  });

  it('Woolworths Multi Grain cereal does not entity-propagate to unrelated Woolworths products', () => {
    const recs = match({
      barcode: '9300633000001',
      brand_id: 'B0001',
      parent_id: 'P0001',
      scanMarketPublic: 'NZ',
      productName: 'Woolworths Milk 2L',
    });
    expect(recs.some((r) => r.signal_id === 'SIG-SR-NZ-005')).toBe(false);
  });

  it('candidate Red Hat / Dongwon GTINs do not become publishable matches', () => {
    for (const gtin of ['4975186250043', '8801047559610']) {
      const recs = match({
        barcode: gtin,
        brand_id: null,
        parent_id: null,
        scanMarketPublic: gtin.startsWith('88') ? 'NZ' : 'AU',
      });
      expect(recs.some((r) => r.signal_id === 'SIG-SR-AU-005' || r.signal_id === 'SIG-SR-NZ-004')).toBe(
        false
      );
    }
  });

  it('unresolved exact-product targets without canonical identity fail closed', () => {
    const pack = loadV03Pack();
    const unresolved = pack.targets.filter(
      (t) =>
        t.propagation_mode === 'exact_only' &&
        t.target_type === 'product' &&
        !(t.canonical_target_id ?? '').trim()
    );
    for (const t of unresolved) {
      expect(t.resolution_status === 'blocked' || t.resolution_status === 'needs_review').toBe(true);
    }
    // Chaining must resolve before any product Signal — unresolved identity fails closed.
    const unresolvedIdentity = match({
      barcode: 'SHOULD_NOT_MATCH_BLOCKED',
      brand_id: null,
      parent_id: null,
      scanMarketPublic: 'AU',
      productName: 'Chickadees 190g',
    });
    expect(unresolvedIdentity.some((r) => r.signal_id === 'SIG-SR-AU-001-20260918')).toBe(false);

    // With reviewed Chaining identity the governed product line does publish (MVP doctrine).
    const resolvedIdentity = match({
      barcode: '9310000333333',
      brand_id: 'B0654',
      parent_id: 'P0156',
      scanMarketPublic: 'AU',
      productName: 'Chickadees 190g',
    });
    expect(resolvedIdentity.map((r) => r.signal_id)).toContain('SIG-SR-AU-001-20260918');
  });

  it('predecessor→successor dedupe lineage: one publishable head per dedupe_key family', () => {
    const pack = loadV03Pack();
    const byDedupe = new Map<string, CsvRecord[]>();
    for (const s of pack.signals) {
      const k = s.dedupe_key ?? '';
      if (!byDedupe.has(k)) byDedupe.set(k, []);
      byDedupe.get(k)!.push(s);
    }
    for (const [, rows] of byDedupe) {
      const publishable = rows.filter((r) => r.signal_publication_state === 'publishable');
      expect(publishable.length).toBeLessThanOrEqual(1);
      if (rows.length > 1) {
        const succ = rows.find((r) => (r.signal_id ?? '').includes('-20260918'));
        const pred = rows.find((r) => !(r.signal_id ?? '').includes('-20260918'));
        if (succ && pred) {
          expect(succ.supersedes_signal_id).toBe(pred.signal_id);
          expect(succ.dedupe_key).toBe(pred.dedupe_key);
        }
      }
    }
  });

  it('family-bound in_the_news successor fires via Workstream C product-scope + brand', () => {
    const recs = match({
      barcode: '9300000111111',
      brand_id: 'B0179',
      parent_id: 'P0041',
      scanMarketPublic: 'AU',
      productName: "Leggo's Tomato Paste",
    });
    expect(recs.map((r) => r.signal_id)).toContain('SIG-IN-AU-001-20260918');
    const hit = recs.find((r) => r.signal_id === 'SIG-IN-AU-001-20260918')!;
    expect(hit.skeleton_card_copy?.title_display).toBeTruthy();
  });
});
