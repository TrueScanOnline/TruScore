/**
 * Asset-governed Food Recall eligibility → Safety publication.
 *
 * Dynamic Signals Asset is the sole production Signal-content authority.
 * The Food Recall Matcher only decides whether a scanned GTIN/batch/date
 * satisfies structured eligibility bound to an already-governed Asset Safety Signal.
 *
 * Historical MILO Stage 2 pack is NOT consulted here and cannot introduce public Signals.
 * EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH is a matcher kill-switch only — never a content activator.
 */

import type { CsvRecord } from '../../../identity/workstreamA/csv';
import type { DynamicSignalPublicationRecord } from '../../publish/types';
import {
  createFixedFoodRecallClock,
  evaluateStructuredFoodRecallMatch,
  isFoodRecallCorrectedPathEnabled,
  type FoodRecallSubmittedMarkings,
  type StructuredFoodRecallNotice,
} from '../../../workstreamC/recall';
import { publicationStateForGtinVerification } from '../../../workstreamC/recall/mapFoodRecallMatchToPublicationRecord';
import type { AssetPackParsed } from './matchDynamicSignalsAsset';

const VALID_FAR = '2099-12-31T23:59:59.000Z';

function authorisedSourceIds(sources: CsvRecord[]): Set<string> {
  const s = new Set<string>();
  for (const r of sources) {
    if ((r.status ?? '').trim() !== 'active') continue;
    const id = (r.source_channel_id ?? '').trim();
    if (id) s.add(id);
  }
  return s;
}

function mapAssetGovernedMatchToPublicationRecord(input: {
  signal: CsvRecord;
  match: ReturnType<typeof evaluateStructuredFoodRecallMatch>;
  scanMarket: 'AU' | 'NZ' | 'UNKNOWN';
}): DynamicSignalPublicationRecord | null {
  const { signal, match } = input;
  // Production Asset path: only confirmed / markings-required states publish.
  // Non-affected batch/date and related-unconfirmed must not introduce a Safety Signal.
  if (
    match.match_state !== 'confirmed_affected' &&
    match.match_state !== 'batch_check_required'
  ) {
    return null;
  }

  const sigId = (signal.signal_id ?? '').trim();
  const market = input.scanMarket === 'UNKNOWN' ? 'AU' : input.scanMarket;
  const sourceUrl = (() => {
    const u = (signal.source_url ?? match.official_source_url ?? '').trim();
    return u && /^https?:\/\//i.test(u) ? u : undefined;
  })();

  return {
    signal_id: sigId,
    dedupe_key: match.dedupe_key,
    signal_class: 'safety_regulatory',
    signal_publication_state:
      (signal.signal_publication_state as DynamicSignalPublicationRecord['signal_publication_state']) ??
      'candidate',
    resolution_key: { gtin: match.scanned_gtin, market_key: market },
    state: publicationStateForGtinVerification(match.gtin_verification_status),
    lineage_reference: signal.lineage_reference ?? `dsa_v0_2:signal:${sigId}`,
    source_record_id: signal.source_record_id ?? match.recall_notice_id,
    source_system: signal.source_channel_id ?? undefined,
    source_record_url: sourceUrl,
    source_idempotency_key: match.dedupe_key,
    staleness: { valid_until: signal.expires_at?.trim() || VALID_FAR },
    editorial: {
      priority: 0,
      due_at: null,
      last_reviewed_at: signal.reviewed_at?.trim() || null,
    },
    mislink: { open_report_count: 0, last_event_at: null },
    // Asset Signal remains the content authority — no parallel MILO/commentary records.
    skeleton_card_copy: {
      title_display: signal.signal_headline ?? sigId,
      body_display: signal.signal_summary ?? '',
      why_display: signal.scope_qualification ?? '',
    },
    food_recall: {
      match_state: match.match_state,
      severity_override: match.severity,
      needs_batch_entry: match.needs_batch_entry,
      recall_notice_id: match.recall_notice_id,
      gtin_verification_status: match.gtin_verification_status,
      uat_only_override: match.gtin_verification_status !== 'verified_for_consumer',
    },
  };
}

/**
 * Emits Safety publication records only when:
 * 1. Matcher kill-switch allows evaluation (EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH=1), AND
 * 2. A governed Asset Safety Signal has a reviewed eligibility binding, AND
 * 3. Structured affected-variant data exists for that binding, AND
 * 4. The matcher finds an applicable GTIN/batch/date state (not not_applicable).
 *
 * Kill-switch alone never invents content. Historical MILO pack is never read.
 */
export function buildAssetGovernedFoodRecallPublicationRecords(input: {
  pack: AssetPackParsed;
  barcode: string;
  scanMarketPublic: 'AU' | 'NZ' | 'UNKNOWN';
  foodRecallMarkings?: FoodRecallSubmittedMarkings | null;
  evaluationClockIso?: string;
  logLines?: string[];
  /** Tests: include candidate Asset Safety Signals */
  includeNonPublishable?: boolean;
}): DynamicSignalPublicationRecord[] {
  const push = (s: string) => input.logLines?.push(s);
  const corrected = isFoodRecallCorrectedPathEnabled();
  push(`food_recall_matcher_kill_switch=${corrected ? '1' : '0'}`);
  if (!corrected) {
    push('food_recall: matcher kill-switch off — no Safety eligibility evaluation');
    return [];
  }

  const bindings = input.pack.recallEligibility ?? [];
  const notices = input.pack.recallNotices ?? [];
  if (bindings.length === 0) {
    push('food_recall: no Asset recall_eligibility bindings — no governed Safety recalls');
    return [];
  }

  const signalById = new Map(input.pack.signals.map((r) => [r.signal_id ?? '', r]));
  const noticeById = new Map(notices.map((n) => [n.recall_notice_id, n]));
  const authSources = authorisedSourceIds(input.pack.sources);
  const clock = createFixedFoodRecallClock(
    input.evaluationClockIso ?? '2026-08-05T00:00:00.000Z'
  );
  const out: DynamicSignalPublicationRecord[] = [];
  const seen = new Set<string>();

  for (const binding of bindings) {
    const signalId = (binding.signal_id ?? '').trim();
    const noticeId = (binding.recall_notice_id ?? '').trim();
    const eligibility = (binding.eligibility_status ?? '').trim();
    if (!signalId || !noticeId) continue;

    if (eligibility !== 'reviewed') {
      push(
        `food_recall: skip ${signalId} eligibility_status=${eligibility || 'empty'} (fail closed)`
      );
      continue;
    }

    const signal = signalById.get(signalId);
    if (!signal) {
      push(`food_recall: skip ${signalId} — Asset signal missing`);
      continue;
    }
    if ((signal.signal_class ?? '').trim() !== 'safety_regulatory') {
      push(`food_recall: skip ${signalId} — not safety_regulatory`);
      continue;
    }

    const sourceId = (signal.source_channel_id ?? '').trim();
    if (!authSources.has(sourceId)) {
      push(`food_recall: skip ${signalId} — source not active`);
      continue;
    }

    const pubState = (signal.signal_publication_state ?? '').trim();
    if (pubState !== 'publishable' && !input.includeNonPublishable) {
      push(`food_recall: skip ${signalId} signal_publication_state=${pubState} — not public`);
      continue;
    }

    const notice = noticeById.get(noticeId);
    if (!notice || notice.affected_variants.length === 0) {
      push(
        `food_recall: skip ${signalId} — no structured affected variants for ${noticeId} (MILO/historical packs are not production content)`
      );
      continue;
    }

    // Enforce notice.signal_id matches Asset Signal (sole content authority).
    const governedNotice: StructuredFoodRecallNotice = {
      ...notice,
      signal_id: signalId,
    };

    const match = evaluateStructuredFoodRecallMatch({
      notice: governedNotice,
      gtin: input.barcode,
      markings: input.foodRecallMarkings,
      clock,
    });
    push(
      `food_recall_asset: signal=${signalId} notice=${noticeId} state=${match.match_state} reason=${match.match_reason_code}`
    );

    const rec = mapAssetGovernedMatchToPublicationRecord({
      signal,
      match,
      scanMarket: input.scanMarketPublic,
    });
    if (!rec || seen.has(rec.signal_id)) continue;
    seen.add(rec.signal_id);
    out.push(rec);
  }

  return out;
}

/** @deprecated Use buildAssetGovernedFoodRecallPublicationRecords — MILO is not a production content path. */
export function buildFoodRecallSafetyPublicationRecords(input: {
  barcode: string;
  foodRecallMarkings?: FoodRecallSubmittedMarkings | null;
  evaluationClockIso?: string;
  logLines?: string[];
  pack?: AssetPackParsed;
  scanMarketPublic?: 'AU' | 'NZ' | 'UNKNOWN';
  includeNonPublishable?: boolean;
}): DynamicSignalPublicationRecord[] {
  if (!input.pack) {
    input.logLines?.push(
      'food_recall: retired independent path — Asset pack required; MILO pack cannot originate production Signals'
    );
    return [];
  }
  return buildAssetGovernedFoodRecallPublicationRecords({
    pack: input.pack,
    barcode: input.barcode,
    scanMarketPublic: input.scanMarketPublic ?? 'AU',
    foodRecallMarkings: input.foodRecallMarkings,
    evaluationClockIso: input.evaluationClockIso,
    logLines: input.logLines,
    includeNonPublishable: input.includeNonPublishable,
  });
}
