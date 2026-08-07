import fs from 'fs';
import path from 'path';
import { buildProductScanResult } from '../../../services/buildProductScanResult';
import { buildWorkstreamCSkeletonPublicationRecords } from '../../../workstreamC/skeleton';
import { flattenSignalsOrdered, dedupeSignalCards } from '../../../utils/scanResultPresentation';

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const PACK = path.join(ROOT, 'workstreamC', 'c-data', 'v0.4', 'input');
const A_DATA = path.join(ROOT, 'workstreamA', 'a-data', 'wave1-v0.14', 'input');

function expectPackFiles(): void {
  if (!fs.existsSync(PACK)) {
    throw new Error(`Missing pack at ${PACK}`);
  }
}

describe('Workstream C v0.4 skeleton publication records', () => {
  it('UAT_C_008: Cadbury — two distinct signals, distinct dedupe_key, not collapsed (AU)', () => {
    expectPackFiles();
    const log: string[] = [];
    const recs = buildWorkstreamCSkeletonPublicationRecords({
      packInputRoot: PACK,
      aDataInputRoot: A_DATA,
      barcode: '9300601234567',
      productName: 'Cadbury Dairy Milk 180g',
      scanMarketPublic: 'AU',
      logLines: log,
      injectedChain: { brand_id: 'B0241', parent_id: 'P0009' },
    });
    const ids = new Set(recs.map((r) => r.signal_id));
    expect(ids.has('SIG_NEWS_GLOBAL_001')).toBe(true);
    expect(ids.has('SIG_NEWS_GLOBAL_002')).toBe(true);
    const dk = new Set(recs.map((r) => r.dedupe_key));
    expect(dk.size).toBe(recs.length);
    const { result } = buildProductScanResult({
      barcode: '9300601234567',
      product: {
        barcode: '9300601234567',
        product_name: 'Cadbury Dairy Milk 180g',
        brands: 'Cadbury',
        source: 'test',
        trust_score: 50,
        trust_score_breakdown: { body: 10, planet: 10, ethics: 10, open: 10 },
      } as any,
      userPreferences: { palmOil: true, animalWelfare: true, fairTrade: true, organic: true } as any,
      isSubscriber: false,
      market: 'AU',
      deriveTerminal: false,
      terminal_state: 'success',
      dynamicSignalRecords: recs,
    });
    const flat = dedupeSignalCards(flattenSignalsOrdered(result.signals));
    const bySig = flat.filter((c) => c.id === 'SIG_NEWS_GLOBAL_001' || c.id === 'SIG_NEWS_GLOBAL_002');
    expect(bySig.length).toBe(2);
    expect(log.some((l) => l.includes('GLOBAL_CONTEXT=narrow'))).toBe(true);
  });

  it('UAT_C_011: NZ Countdown — SIG_NEWS_NZ_001 present', () => {
    expectPackFiles();
    const log: string[] = [];
    const recs = buildWorkstreamCSkeletonPublicationRecords({
      packInputRoot: PACK,
      aDataInputRoot: A_DATA,
      barcode: '9415556123456',
      productName: 'Countdown Greek Style Yoghurt',
      scanMarketPublic: 'NZ',
      logLines: log,
      injectedChain: { brand_id: 'B0004', parent_id: 'P0001' },
    });
    expect(recs.some((r) => r.signal_id === 'SIG_NEWS_NZ_001')).toBe(true);
    expect(recs.every((r) => r.signal_publication_state === 'publishable')).toBe(true);
  });

  it('Cadbury chocolate — identity-only chain (no injectedChain) still matches SL008/SL011', () => {
    expectPackFiles();
    const recs = buildWorkstreamCSkeletonPublicationRecords({
      packInputRoot: PACK,
      aDataInputRoot: A_DATA,
      barcode: '9300601234567',
      productName: 'Cadbury Dairy Milk Chocolate Bar',
      scanMarketPublic: 'AU',
      product: {
        barcode: '9300601234567',
        product_name: 'Cadbury Dairy Milk Chocolate Bar',
        brands: 'Cadbury',
        categories_tags: ['en:chocolates'],
        source: 'test',
      } as any,
    });
    const ids = new Set(recs.map((r) => r.signal_id));
    expect(ids.has('SIG_NEWS_GLOBAL_001')).toBe(true);
    expect(ids.has('SIG_NEWS_GLOBAL_002')).toBe(true);
  });

  it('Negative: Ritz — no NGO global signals (AU)', () => {
    expectPackFiles();
    const recs = buildWorkstreamCSkeletonPublicationRecords({
      packInputRoot: PACK,
      aDataInputRoot: A_DATA,
      barcode: '9310123456789',
      productName: 'Ritz crackers',
      scanMarketPublic: 'AU',
      injectedChain: { brand_id: 'B0069', parent_id: 'P0009' },
    });
    expect(recs.filter((r) => r.signal_id.startsWith('SIG_NEWS_GLOBAL'))).toHaveLength(0);
  });

  it('product_family Alfamino matches SL002 when name contains Alfamino', () => {
    expectPackFiles();
    const recs = buildWorkstreamCSkeletonPublicationRecords({
      packInputRoot: PACK,
      aDataInputRoot: A_DATA,
      barcode: '9310999888777',
      productName: 'Nestlé Alfamino Infant Formula 400g',
      scanMarketPublic: 'AU',
      injectedChain: { brand_id: 'B0061', parent_id: 'P0008' },
    });
    expect(recs.some((r) => r.signal_id === 'SIG_REG_AU_002')).toBe(true);
  });
});
