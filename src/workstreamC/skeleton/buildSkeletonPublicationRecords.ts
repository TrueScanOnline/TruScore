/**
 * Workstream C skeleton v0.4 — builds `DynamicSignalPublicationRecord[]` from fixed CSV pack + reviewed A-Data chain.
 * GLOBAL_CONTEXT on subject links = narrow eligibility (AU/NZ scan may match global NGO rows after chain match); not a resolution shortcut.
 */

import fs from 'fs';
import path from 'path';
import type { DynamicSignalPublicationRecord } from '../../dynamicSignals/publish/types';
import type { MarketKeyResolution } from '../../contracts/phase6/enums';
import { parseCsv, type CsvRecord } from '../../identity/workstreamA/csv';

const VALID_FAR = '2099-12-31T00:00:00.000Z';

export interface ADataMaps {
  brandsById: Map<string, { parent_id: string; review_state: string }>;
  parentsById: Map<string, { review_state: string }>;
  gtinRows: Map<string, { brand_id: string; parent_id: string; link_review_state: string }>;
}

export function loadADataMaps(aDataInputRoot: string): ADataMaps {
  const brandsPath = path.join(aDataInputRoot, 'canonical_brands.csv');
  const parentsPath = path.join(aDataInputRoot, 'canonical_parents.csv');
  const gtinPath = path.join(aDataInputRoot, 'gtin_brand_links.csv');
  const brandsById = new Map<string, { parent_id: string; review_state: string }>();
  const parentsById = new Map<string, { review_state: string }>();

  if (fs.existsSync(brandsPath)) {
    const rows = parseCsv(fs.readFileSync(brandsPath, 'utf8'));
    for (const r of rows) {
      brandsById.set(r.brand_id ?? '', {
        parent_id: r.parent_id ?? '',
        review_state: r.review_state ?? '',
      });
    }
  }
  if (fs.existsSync(parentsPath)) {
    const rows = parseCsv(fs.readFileSync(parentsPath, 'utf8'));
    for (const r of rows) {
      parentsById.set(r.parent_id ?? '', { review_state: r.review_state ?? '' });
    }
  }
  const gtinRows = new Map<string, { brand_id: string; parent_id: string; link_review_state: string }>();
  if (fs.existsSync(gtinPath)) {
    const rows = parseCsv(fs.readFileSync(gtinPath, 'utf8'));
    for (const r of rows) {
      gtinRows.set(r.gtin ?? '', {
        brand_id: r.brand_id ?? '',
        parent_id: r.parent_id ?? '',
        link_review_state: r.link_review_state ?? '',
      });
    }
  }
  return { brandsById, parentsById, gtinRows };
}

export interface ResolvedRetailChain {
  brand_id: string;
  parent_id: string;
  source: 'gtin_link' | 'injected_uat_fixture';
}

/** UAT / fixture-only chain injection when GTIN is not in A-Data gtin_brand_links. */
export type InjectedUatChain = { brand_id: string; parent_id: string };

export function resolveReviewedRetailChain(input: {
  barcode: string;
  productName: string;
  aData: ADataMaps;
  /** Non-mutating UAT-only chain when GTIN is absent from A-Data (tests / controlled fixtures). */
  injected?: InjectedUatChain | null;
}): ResolvedRetailChain | null {
  const g = input.aData.gtinRows.get(input.barcode);
  if (g) {
    if (g.link_review_state !== 'reviewed') return null;
    const b = input.aData.brandsById.get(g.brand_id);
    const p = input.aData.parentsById.get(g.parent_id);
    if (!b || b.review_state !== 'reviewed') return null;
    if (!p || p.review_state !== 'reviewed') return null;
    return { brand_id: g.brand_id, parent_id: g.parent_id, source: 'gtin_link' };
  }
  if (input.injected) {
    const b = input.aData.brandsById.get(input.injected.brand_id);
    const p = input.aData.parentsById.get(input.injected.parent_id);
    if (!b || b.review_state !== 'reviewed') return null;
    if (!p || p.review_state !== 'reviewed') return null;
    if (b.parent_id !== input.injected.parent_id) return null;
    return {
      brand_id: input.injected.brand_id,
      parent_id: input.injected.parent_id,
      source: 'injected_uat_fixture',
    };
  }
  return null;
}

function marketMatchesLink(mk: MarketKeyResolution, scanPublic: 'AU' | 'NZ' | 'UNKNOWN', linkMarket: string): boolean {
  if (linkMarket === 'GLOBAL_CONTEXT') {
    return scanPublic === 'AU' || scanPublic === 'NZ';
  }
  if (linkMarket === 'AU') return scanPublic === 'AU';
  if (linkMarket === 'NZ') return scanPublic === 'NZ';
  return false;
}

function toInternalMarket(scanPublic: 'AU' | 'NZ' | 'UNKNOWN'): MarketKeyResolution {
  if (scanPublic === 'AU') return 'AU';
  if (scanPublic === 'NZ') return 'NZ';
  return 'AU+NZ';
}

function editorialAllowsSignal(row: CsvRecord): boolean {
  const req = (row.editorial_review_required ?? '').toUpperCase();
  const st = (row.editorial_review_state ?? '').trim();
  if (req === 'Y') return st === 'approved';
  return st === 'not_required' || st === '';
}

function linkMatchesChain(
  link: CsvRecord,
  chain: ResolvedRetailChain,
  productName: string,
  aData: ADataMaps
): boolean {
  const st = link.subject_type ?? '';
  const sid = link.subject_id ?? '';
  const brandRow = aData.brandsById.get(chain.brand_id);

  if (st === 'brand') {
    return sid === chain.brand_id;
  }
  if (st === 'parent') {
    /** Retailer conduct: same parent as resolved chain parent + brand rolls up under that parent */
    if (sid !== chain.parent_id) return false;
    return brandRow?.parent_id === chain.parent_id;
  }
  if (st === 'product_family') {
    if (sid !== 'SOURCE_PRODUCT_ALFAMINO_400G') return false;
    return productName.toLowerCase().includes('alfamino');
  }
  return false;
}

function buildUxCopyMaps(rows: CsvRecord[]): Map<string, { title: string; body: string; why: string }> {
  const m = new Map<string, { title: string; body: string; why: string }>();
  for (const r of rows) {
    const sid = r.signal_id ?? '';
    if (!sid) continue;
    m.set(sid, {
      title: r.example_headline ?? '',
      body: r.why_shown ?? '',
      why: r.caveat ?? '',
    });
  }
  return m;
}

export interface BuildSkeletonPublicationRecordsInput {
  packInputRoot: string;
  aDataInputRoot: string;
  barcode: string;
  productName: string;
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN';
  /** Structured log lines for acceptance evidence (console in tests / caller). */
  logLines?: string[];
  injectedChain?: InjectedUatChain | null;
}

export function buildWorkstreamCSkeletonPublicationRecords(
  input: BuildSkeletonPublicationRecordsInput
): DynamicSignalPublicationRecord[] {
  const log = input.logLines ?? [];
  const push = (s: string) => log.push(s);

  const packRoot = input.packInputRoot;
  const links = parseCsv(fs.readFileSync(path.join(packRoot, 'signal_subject_links.csv'), 'utf8'));
  const signals = parseCsv(fs.readFileSync(path.join(packRoot, 'signal_records.csv'), 'utf8'));
  const uxPath = path.join(packRoot, 'ux_copy_skeleton.csv');
  const uxRows = fs.existsSync(uxPath) ? parseCsv(fs.readFileSync(uxPath, 'utf8')) : [];
  const uxMap = buildUxCopyMaps(uxRows);

  const signalById = new Map(signals.map((r) => [r.signal_id ?? '', r]));
  const aData = loadADataMaps(input.aDataInputRoot);

  const chain = resolveReviewedRetailChain({
    barcode: input.barcode,
    productName: input.productName,
    aData,
    injected: input.injectedChain ?? null,
  });
  if (!chain) {
    push('chain_resolve: no reviewed GTIN link and no valid injected UAT chain — RT001 blocks skeleton signals');
    return [];
  }
  push(
    `chain_resolve: brand_id=${chain.brand_id} parent_id=${chain.parent_id} source=${chain.source} (RT001 reviewed A-Data chain)`
  );

  const internalMarket = toInternalMarket(input.scanMarketPublic);
  const out: DynamicSignalPublicationRecord[] = [];

  for (const link of links) {
    const linkMarket = link.market_key ?? '';
    if (!marketMatchesLink(internalMarket, input.scanMarketPublic, linkMarket)) {
      continue;
    }
    if (!linkMatchesChain(link, chain, input.productName, aData)) {
      continue;
    }

    const sigId = link.signal_id ?? '';
    const row = signalById.get(sigId);
    if (!row) continue;
    if (!editorialAllowsSignal(row)) {
      push(`editorial_block: ${sigId} editorial_review_state prevents publish`);
      continue;
    }
    if ((row.signal_publication_state ?? '') !== 'publishable') continue;

    const sk = uxMap.get(sigId);
    const title = sk?.title || row.headline || row.signal_class || sigId;
    const body = sk?.body || row.short_summary || '';
    const why = sk?.why || row.skeleton_notes || '';

    const linkId = link.link_id ?? '';
    const dedupe_key = `p6|workstream_c_skeleton|${sigId}|${linkId}|${input.barcode}`;

    const rec: DynamicSignalPublicationRecord = {
      signal_id: sigId,
      dedupe_key,
      signal_class: row.signal_class as DynamicSignalPublicationRecord['signal_class'],
      signal_publication_state: 'publishable',
      resolution_key: { gtin: input.barcode, market_key: internalMarket },
      state: {
        confidence_state: row.confidence_state as DynamicSignalPublicationRecord['state']['confidence_state'],
        review_state: row.review_state as DynamicSignalPublicationRecord['state']['review_state'],
        resolution_status: row.resolution_status as DynamicSignalPublicationRecord['state']['resolution_status'],
      },
      lineage_reference: row.lineage_reference ?? `phase6:pub:signal:${sigId}`,
      source_record_id: row.source_id ?? undefined,
      source_system: row.source_id ?? undefined,
      source_idempotency_key: `workstream_c_skeleton|${sigId}|${linkId}`,
      staleness: { valid_until: VALID_FAR },
      editorial: { priority: 0, due_at: null, last_reviewed_at: null },
      mislink: { open_report_count: 0, last_event_at: null },
      skeleton_card_copy: { title_display: title, body_display: body, why_display: why },
    };
    out.push(rec);
    push(
      `match: link=${linkId} signal=${sigId} market_link=${linkMarket} GLOBAL_CONTEXT=narrow_eligibility_only subject=${link.subject_type}:${link.subject_id}`
    );
  }

  push(`attach: built ${out.length} publication record(s) for ProductScanResult.signals pipeline`);
  return out;
}
