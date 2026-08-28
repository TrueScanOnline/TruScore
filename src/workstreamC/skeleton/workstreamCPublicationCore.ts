/**
 * Shared A-data map builders for Dynamic Signals Asset retail-chain resolution.
 * Skeleton subject-link pack publisher removed — Asset matcher is the sole production Signal path.
 */

import type { CsvRecord } from '../../identity/workstreamA/csv';

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

/** Tests / harnesses only — never pass from app screens. */
export type InjectedUatChain = { brand_id: string; parent_id: string };
