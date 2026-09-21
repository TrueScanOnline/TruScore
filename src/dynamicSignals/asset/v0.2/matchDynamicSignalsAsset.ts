/**
 * Rveel Dynamic Signals Asset v0.2 — deterministic target matcher.
 *
 * Ownership (brand/entity) uses Shared Identity hierarchy.
 * Product / product_family scope uses Workstream C signal_target_product_criteria only.
 */

import type { CsvRecord } from '../../../identity/workstreamA/csv';
import type { DynamicSignalPublicationRecord } from '../../publish/types';
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
import type { IngestionClock } from '../../ingest/ingestionClock';
import { createSystemIngestionClock } from '../../ingest/ingestionClock';
import {
  productScopeGuardAllowsDisplay,
  type CocoaChocolateProductScopeEvidence,
} from './cocoaChocolateProductScopeGuard';
import {
  assetExpiresAtAsValidUntil,
  isAssetSignalWithinPublicTemporalWindow,
} from './assetSignalTemporalPolicy';
import {
  signalTargetProductScopeMatches,
  type SignalProductScopeMaps,
} from '../../productScope/signalProductScopeEvaluator';

export type AssetScanIdentity = {
  barcode: string;
  brand_id: string | null;
  parent_id: string | null;
  /** Ordinary scanned product name — required for Workstream C product-scope evaluation. */
  productName: string;
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
  productScopeMaps: SignalProductScopeMaps;
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
 * Retired by the 22 Sep 2026 MVP recall doctrine. Safety product targets now publish
 * through ordinary Asset matching once governed product scope matches; batch/date/GTIN
 * eligibility is card qualification content, not a display trigger.
 *
 * @deprecated Always false — kept so callers/tests can assert Stage 2 gating is gone.
 */
export function requiresFoodRecallMatcherEligibility(
  _signalClass: string,
  _targetType: string,
  _propagationMode: string
): boolean {
  return false;
}

function targetMatchesScan(
  tgt: CsvRecord,
  identity: AssetScanIdentity,
  pack: AssetPackParsed
): boolean {
  const targetType = (tgt.target_type ?? '').trim();
  const mode = (tgt.propagation_mode ?? '').trim();
  const canonicalId = (tgt.canonical_target_id ?? '').trim();
  const targetId = (tgt.signal_target_id ?? '').trim();

  if (targetType === 'product' || targetType === 'product_family') {
    // Product scope is entirely Workstream C criteria — not Shared Identity.
    return signalTargetProductScopeMatches(pack.productScopeMaps, targetId, {
      barcode: identity.barcode,
      productName: identity.productName,
      brand_id: identity.brand_id,
      parent_id: identity.parent_id,
      scanMarketPublic: identity.scanMarketPublic,
      brandIsUnderAnchor: (scanBrandId, anchorBrandId) =>
        brandIsDescendantOf(pack.brandHierarchy, scanBrandId, anchorBrandId),
    });
  }

  if (mode === 'brand_descendants') {
    return (
      targetType === 'brand' &&
      !!canonicalId &&
      brandIsDescendantOf(pack.brandHierarchy, identity.brand_id, canonicalId)
    );
  }
  if (mode === 'entity_descendants') {
    return (
      targetType === 'entity' &&
      !!canonicalId &&
      entityOwnsOrIsAncestorOf(pack.entityHierarchy, identity.parent_id, canonicalId)
    );
  }
  return false;
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
    staleness: { valid_until: assetExpiresAtAsValidUntil(signal.expires_at) },
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
  evaluationClock?: IngestionClock;
}): DynamicSignalPublicationRecord[] {
  const push = (s: string) => input.logLines?.push(s);
  const clock = input.evaluationClock ?? createSystemIngestionClock();
  const authSources = authorisedSourceIds(input.pack.sources);
  const signalById = new Map(input.pack.signals.map((r) => [r.signal_id ?? '', r]));
  const out: DynamicSignalPublicationRecord[] = [];
  const seen = new Set<string>();
  const identity = input.identity;

  for (const tgt of input.pack.targets) {
    const linkMarket = (tgt.market_key ?? '').trim();
    if (!marketAllows(identity.scanMarketPublic, linkMarket)) continue;

    const resStatus = (tgt.resolution_status ?? '').trim();
    if (!targetResolutionAllowsMatch(resStatus)) {
      push(`target_block: ${tgt.signal_target_id} resolution_status=${resStatus}`);
      continue;
    }

    const targetType = (tgt.target_type ?? '').trim();
    const mode = (tgt.propagation_mode ?? '').trim();
    const canonicalId = (tgt.canonical_target_id ?? '').trim();

    const sigId = (tgt.signal_id ?? '').trim();
    const signal = signalById.get(sigId);
    if (!signal) continue;

    if (!targetMatchesScan(tgt, identity, input.pack)) {
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
    if (pubState === 'suppressed' || pubState === 'expired') {
      push(`lifecycle_hold: ${sigId} signal_publication_state=${pubState} — not public`);
      continue;
    }
    if (pubState !== 'publishable' && !input.includeNonPublishable) {
      push(`candidate_hold: ${sigId} signal_publication_state=${pubState} — not public`);
      continue;
    }

    if (
      !isAssetSignalWithinPublicTemporalWindow(
        {
          publishable_from: signal.publishable_from,
          expires_at: signal.expires_at,
        },
        clock
      )
    ) {
      push(
        `temporal_hold: ${sigId} outside public window publishable_from=${(signal.publishable_from ?? '').trim() || '(none)'} expires_at=${(signal.expires_at ?? '').trim() || '(none)'}`
      );
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

/** Exported for Food Recall overlay — same product-scope rules as Asset matcher. */
export function assetTargetProductScopeMatches(
  pack: AssetPackParsed,
  tgt: CsvRecord,
  identity: AssetScanIdentity
): boolean {
  return targetMatchesScan(tgt, identity, pack);
}
