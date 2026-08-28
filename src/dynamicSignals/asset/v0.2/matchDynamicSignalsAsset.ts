/**
 * Rveel Dynamic Signals Asset v0.2 — deterministic target matcher (remediation).
 *
 * Eligibility: market_key + target_type + canonical_target_id + propagation_mode,
 * then optional product_scope_guard (currently cocoa_chocolate).
 * Safety & Regulatory product recalls with exact/batch/date scope are NOT published here —
 * they must go through the Food Recall Matcher.
 */

import type { CsvRecord } from '../../../identity/workstreamA/csv';
import type { DynamicSignalPublicationRecord } from '../../publish/types';
import type { ProductFamilyMaps } from '../../../identity/chaining/productFamilyMaps';
import { reviewedFamilyIdsForGtin } from '../../../identity/chaining/productFamilyMaps';
import type {
  BrandHierarchyMaps,
  EntityHierarchyMaps,
} from '../../../identity/chaining/brandEntityHierarchyMaps';
import {
  brandIsDescendantOf,
  entityOwnsOrIsAncestorOf,
} from '../../../identity/chaining/brandEntityHierarchyMaps';
import type { ResolutionStatus } from '../../../contracts/phase6/enums';
import type { StructuredFoodRecallNotice } from '../../../workstreamC/recall';
import {
  productScopeGuardAllowsDisplay,
  type CocoaChocolateProductScopeEvidence,
} from './cocoaChocolateProductScopeGuard';

const VALID_FAR = '2099-12-31T23:59:59.000Z';

export type AssetScanIdentity = {
  barcode: string;
  brand_id: string | null;
  parent_id: string | null;
  product_family_ids: string[];
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN';
  productScopeEvidence?: CocoaChocolateProductScopeEvidence | null;
};

/** Signal ↔ structured recall eligibility (smallest durable contract). */
export type AssetRecallEligibilityBinding = {
  signal_id: string;
  recall_notice_id: string;
  /** Only `reviewed` may evaluate; held/unavailable fail closed. */
  eligibility_status: string;
};

export type AssetPackParsed = {
  sources: CsvRecord[];
  signals: CsvRecord[];
  targets: CsvRecord[];
  familyMaps: ProductFamilyMaps;
  brandHierarchy: BrandHierarchyMaps;
  entityHierarchy: EntityHierarchyMaps;
  /** Asset-authorised recall bindings — empty unless structured eligibility onboarded. */
  recallEligibility?: AssetRecallEligibilityBinding[];
  /** Structured packs for bound notices — never the historical MILO Stage 2 pack by default. */
  recallNotices?: StructuredFoodRecallNotice[];
};

function marketAllows(scan: 'AU' | 'NZ' | 'UNKNOWN', linkMarket: string): boolean {
  if (scan === 'UNKNOWN') return false;
  if (linkMarket === 'AU+NZ') return scan === 'AU' || scan === 'NZ';
  return linkMarket === scan;
}

function authorisedSourceIds(sources: CsvRecord[]): Set<string> {
  const s = new Set<string>();
  for (const r of sources) {
    if ((r.status ?? '').trim() !== 'active') continue;
    const id = (r.source_channel_id ?? '').trim();
    if (id) s.add(id);
  }
  return s;
}

function targetResolutionAllowsMatch(status: string): boolean {
  return status === 'resolved' || status === 'resolved_with_warning';
}

/**
 * Product-scoped Safety & Regulatory recalls (batch/date/variant eligible) must not use
 * generic Asset exact_only / product matching. Food Recall Matcher is the sole eligibility layer.
 */
export function requiresFoodRecallMatcherEligibility(
  signalClass: string,
  targetType: string,
  propagationMode: string
): boolean {
  if (signalClass !== 'safety_regulatory') return false;
  if (targetType === 'product' || propagationMode === 'exact_only') return true;
  if (targetType === 'product_family' && propagationMode === 'family_members') return true;
  return false;
}

function propagationMatches(
  mode: string,
  targetType: string,
  canonicalId: string,
  identity: AssetScanIdentity,
  brandHierarchy: BrandHierarchyMaps,
  entityHierarchy: EntityHierarchyMaps
): boolean {
  if (!canonicalId) return false;
  switch (mode) {
    case 'exact_only':
      return targetType === 'product' && identity.barcode === canonicalId;
    case 'family_members':
      return targetType === 'product_family' && identity.product_family_ids.includes(canonicalId);
    case 'brand_descendants':
      return (
        targetType === 'brand' &&
        brandIsDescendantOf(brandHierarchy, identity.brand_id, canonicalId)
      );
    case 'entity_descendants':
      return (
        targetType === 'entity' &&
        entityOwnsOrIsAncestorOf(entityHierarchy, identity.parent_id, canonicalId)
      );
    case 'operational_descendants':
      return false;
    default:
      return false;
  }
}

function signalToPublicationRecord(
  signal: CsvRecord,
  barcode: string,
  market: AssetScanIdentity['scanMarketPublic'],
  targetResolutionStatus: ResolutionStatus
): DynamicSignalPublicationRecord {
  const sigId = signal.signal_id ?? '';
  const internalMarket = market === 'UNKNOWN' ? 'AU' : market;
  return {
    signal_id: sigId,
    dedupe_key: `p6|dsa_v0_2|${sigId}|${barcode}`,
    signal_class: (signal.signal_class as DynamicSignalPublicationRecord['signal_class']) ?? 'in_the_news',
    signal_publication_state:
      (signal.signal_publication_state as DynamicSignalPublicationRecord['signal_publication_state']) ??
      'candidate',
    resolution_key: { gtin: barcode, market_key: internalMarket },
    state: {
      confidence_state:
        (signal.confidence_state as DynamicSignalPublicationRecord['state']['confidence_state']) ??
        'strong',
      review_state:
        (signal.review_state as DynamicSignalPublicationRecord['state']['review_state']) ?? 'seeded',
      resolution_status: targetResolutionStatus,
    },
    lineage_reference: signal.lineage_reference ?? `dsa_v0_2:signal:${sigId}`,
    source_record_id: signal.source_record_id ?? undefined,
    source_system: signal.source_channel_id ?? undefined,
    source_record_url: (() => {
      const u = (signal.source_url ?? '').trim();
      return u && /^https?:\/\//i.test(u) ? u : undefined;
    })(),
    source_idempotency_key: `dsa_v0_2|${sigId}|${barcode}`,
    staleness: { valid_until: signal.expires_at?.trim() || VALID_FAR },
    editorial: {
      priority: 0,
      due_at: null,
      last_reviewed_at: signal.reviewed_at?.trim() || null,
    },
    mislink: { open_report_count: 0, last_event_at: null },
    skeleton_card_copy: {
      title_display: signal.signal_headline ?? sigId,
      body_display: signal.signal_summary ?? '',
      why_display: signal.scope_qualification ?? '',
    },
  };
}

export function buildDynamicSignalsAssetPublicationRecords(input: {
  pack: AssetPackParsed;
  identity: AssetScanIdentity;
  logLines?: string[];
  includeNonPublishable?: boolean;
}): DynamicSignalPublicationRecord[] {
  const push = (s: string) => input.logLines?.push(s);
  const authSources = authorisedSourceIds(input.pack.sources);
  const signalById = new Map(input.pack.signals.map((r) => [r.signal_id ?? '', r]));
  const out: DynamicSignalPublicationRecord[] = [];
  const seen = new Set<string>();

  const familyIds =
    input.identity.product_family_ids.length > 0
      ? input.identity.product_family_ids
      : reviewedFamilyIdsForGtin(
          input.pack.familyMaps,
          input.identity.barcode,
          input.identity.scanMarketPublic
        );
  const identity: AssetScanIdentity = { ...input.identity, product_family_ids: familyIds };

  for (const tgt of input.pack.targets) {
    const linkMarket = (tgt.market_key ?? '').trim();
    if (!marketAllows(identity.scanMarketPublic, linkMarket)) continue;

    const resStatus = (tgt.resolution_status ?? '').trim();
    if (!targetResolutionAllowsMatch(resStatus)) {
      push(`target_block: ${tgt.signal_target_id} resolution_status=${resStatus}`);
      continue;
    }

    const canonicalId = (tgt.canonical_target_id ?? '').trim();
    const targetType = (tgt.target_type ?? '').trim();
    const mode = (tgt.propagation_mode ?? '').trim();

    const sigId = (tgt.signal_id ?? '').trim();
    const signal = signalById.get(sigId);
    if (!signal) continue;

    const signalClass = (signal.signal_class ?? '').trim();
    if (requiresFoodRecallMatcherEligibility(signalClass, targetType, mode)) {
      push(
        `food_recall_matcher_required: skip Asset publish for ${sigId} via ${tgt.signal_target_id} (class=${signalClass} type=${targetType} mode=${mode})`
      );
      continue;
    }

    if (
      !propagationMatches(
        mode,
        targetType,
        canonicalId,
        identity,
        input.pack.brandHierarchy,
        input.pack.entityHierarchy
      )
    ) {
      continue;
    }

    const scopeGuard = (tgt.product_scope_guard ?? '').trim();
    if (!productScopeGuardAllowsDisplay(scopeGuard, identity.productScopeEvidence)) {
      push(
        `product_scope_guard: skip ${sigId} via ${tgt.signal_target_id} guard=${scopeGuard || '(empty)'}`
      );
      continue;
    }

    const sourceId = (signal.source_channel_id ?? '').trim();
    if (!authSources.has(sourceId)) {
      push(`source_reject: ${sigId} source_channel_id=${sourceId} not active authorised`);
      continue;
    }

    const pubState = (signal.signal_publication_state ?? '').trim();
    if (pubState !== 'publishable' && !input.includeNonPublishable) {
      push(`candidate_hold: ${sigId} signal_publication_state=${pubState} — not public`);
      continue;
    }

    if (seen.has(sigId)) {
      push(`dedupe: skip duplicate signal=${sigId} via ${tgt.signal_target_id}`);
      continue;
    }
    seen.add(sigId);
    out.push(
      signalToPublicationRecord(
        signal,
        identity.barcode,
        identity.scanMarketPublic,
        resStatus as ResolutionStatus
      )
    );
    push(
      `match: target=${tgt.signal_target_id} signal=${sigId} type=${targetType} id=${canonicalId} mode=${mode} resolution=${resStatus}`
    );
  }

  push(`attach: dsa_v0_2 built ${out.length} record(s)`);
  return out;
}
