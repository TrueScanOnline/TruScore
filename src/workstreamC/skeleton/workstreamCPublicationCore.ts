/**
 * Shared Workstream C publication logic: parsed C-pack rows + reviewed A-data chain → 5B-shaped records.
 * No filesystem — safe for Expo / React Native runtime when given embedded CSV row arrays.
 */

import type { DynamicSignalPublicationRecord } from '../../dynamicSignals/publish/types';
import type { MarketKeyResolution } from '../../contracts/phase6/enums';
import type { CsvRecord } from '../../identity/workstreamA/csv';
import type { Product } from '../../types/product';
import { resolveReviewedRetailChainUnified } from './resolveWorkstreamCRetailChain';

const VALID_FAR = '2099-12-31T00:00:00.000Z';

export interface ADataMaps {
  brandsById: Map<string, { parent_id: string; review_state: string }>;
  parentsById: Map<string, { review_state: string }>;
  gtinRows: Map<string, { brand_id: string; parent_id: string; link_review_state: string }>;
}

export function buildADataMapsFromCsvRecords(
  brandRows: CsvRecord[],
  parentRows: CsvRecord[],
  gtinRowsInput: CsvRecord[]
): ADataMaps {
  const brandsById = new Map<string, { parent_id: string; review_state: string }>();
  const parentsById = new Map<string, { review_state: string }>();

  for (const r of brandRows) {
    brandsById.set(r.brand_id ?? '', {
      parent_id: r.parent_id ?? '',
      review_state: r.review_state ?? '',
    });
  }
  for (const r of parentRows) {
    parentsById.set(r.parent_id ?? '', { review_state: r.review_state ?? '' });
  }
  const gtinRows = new Map<string, { brand_id: string; parent_id: string; link_review_state: string }>();
  for (const r of gtinRowsInput) {
    gtinRows.set(r.gtin ?? '', {
      brand_id: r.brand_id ?? '',
      parent_id: r.parent_id ?? '',
      link_review_state: r.link_review_state ?? '',
    });
  }
  return { brandsById, parentsById, gtinRows };
}

export interface ResolvedRetailChain {
  brand_id: string;
  parent_id: string;
  source: 'gtin_link' | 'injected_uat_fixture' | 'identity_resolution';
}

/** Tests / scripts only: when GTIN is absent from reviewed `gtin_brand_links`. App runtime must not inject. */
export type InjectedUatChain = { brand_id: string; parent_id: string };

/** Scripts/tests without a Product payload — GTIN reviewed rows + optional injected chain only (no identity path). */
export function resolveReviewedRetailChain(input: {
  barcode: string;
  productName: string;
  aData: ADataMaps;
  /** Unit tests and developer harnesses only — never pass from app screens. */
  injected?: InjectedUatChain | null;
}): ResolvedRetailChain | null {
  return resolveReviewedRetailChainUnified({
    barcode: input.barcode,
    productName: input.productName,
    product: null,
    aData: input.aData,
    canonicalBrandRows: [],
    brandAliasRows: [],
    injected: input.injected ?? null,
  });
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

export interface BuildPublicationRecordsFromParsedPackInput {
  links: CsvRecord[];
  signals: CsvRecord[];
  uxRows: CsvRecord[];
  aData: ADataMaps;
  barcode: string;
  productName: string;
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN';
  logLines?: string[];
  /** Omit or null in production app runtime — reviewed GTIN chain only. */
  injectedChain?: InjectedUatChain | null;
  /** Supermarket runtime: OFF/product fields → reviewed canonical chain (preferred over GTIN when present). */
  product?: Product | null;
  /** Frozen v0.14 `canonical_brands.csv` rows — defaults empty when omitted (GTIN/script path only). */
  canonicalBrandRows?: CsvRecord[];
  /** Frozen v0.14 `brand_aliases.csv` rows — defaults empty when omitted. */
  brandAliasRows?: CsvRecord[];
}

export function buildWorkstreamCPublicationRecordsFromParsedPack(
  input: BuildPublicationRecordsFromParsedPackInput
): DynamicSignalPublicationRecord[] {
  const log = input.logLines ?? [];
  const push = (s: string) => log.push(s);

  const uxMap = buildUxCopyMaps(input.uxRows);
  const signalById = new Map(input.signals.map((r) => [r.signal_id ?? '', r]));

  const chain = resolveReviewedRetailChainUnified({
    barcode: input.barcode,
    productName: input.productName,
    product: input.product ?? null,
    aData: input.aData,
    canonicalBrandRows: input.canonicalBrandRows ?? [],
    brandAliasRows: input.brandAliasRows ?? [],
    injected: input.injectedChain ?? null,
    logLines: log,
  });
  if (!chain) {
    push(
      'chain_resolve: no reviewed retail chain from identity fields (when product provided), bundled GTIN reviewed rows, or test injected chain — RT001 blocks Workstream C signals'
    );
    return [];
  }

  const internalMarket = toInternalMarket(input.scanMarketPublic);
  const out: DynamicSignalPublicationRecord[] = [];

  for (const link of input.links) {
    const linkMarket = link.market_key ?? '';
    if (!marketMatchesLink(internalMarket, input.scanMarketPublic, linkMarket)) {
      continue;
    }
    if (!linkMatchesChain(link, chain, input.productName, input.aData)) {
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
    // Deduplicate by governed signal_id: brand-scoped and parent-scoped paths to the same
    // Signal must display once (MVP Signal-scope contract, 2026-08-07).
    if (out.some((r) => r.signal_id === sigId)) {
      push(`dedupe: skip duplicate signal=${sigId} via additional link=${linkId}`);
      continue;
    }
    const dedupe_key = `p6|workstream_c_skeleton|${sigId}|${input.barcode}`;

    const evidenceUrl = (row.source_record_url ?? '').trim();
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
      source_record_url: evidenceUrl && /^https?:\/\//i.test(evidenceUrl) ? evidenceUrl : undefined,
      source_idempotency_key: `workstream_c_skeleton|${sigId}|${input.barcode}`,
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
