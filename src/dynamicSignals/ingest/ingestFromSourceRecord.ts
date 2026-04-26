import { buildIngestionIdempotencyKey } from './idempotencyKey';
import { INGESTION_CANDIDATE_LIFECYCLE } from './ingestionCandidateLifecycle';
import { fingerprintIngestionContent } from './contentFingerprint';
import type { IngestionClock } from './ingestionClock';
import type { IngestedSignalCandidate, SourceRecordIngestionInput } from './types';
import type { InMemoryCandidateIngestionStore } from './candidateIngestionStore';

export type IngestSourceRecordResult =
  | {
      ok: true;
      candidate: IngestedSignalCandidate;
      action: 'created' | 'updated';
      content_changed: boolean;
    }
  | { ok: false; reason: 'malformed_input'; message: string };

/**
 * Normalizes a source record into a **candidate** and upserts into the store. Does **not** set
 * `signal_publication_state` or call any Slice 5B publication engine — 5A cannot publish.
 */
export function ingestSourceRecord(
  input: SourceRecordIngestionInput,
  ctx: {
    clock: IngestionClock;
    ingestionRunId: string;
    store: InMemoryCandidateIngestionStore;
  }
): IngestSourceRecordResult {
  const gtin = input.resolution_key.gtin?.trim() ?? '';
  if (!/^\d{8,14}$/.test(gtin)) {
    return { ok: false, reason: 'malformed_input', message: 'resolution_key.gtin must be 8–14 digits' };
  }
  if (!input.source_system.trim() || !input.source_record_id.trim()) {
    return { ok: false, reason: 'malformed_input', message: 'source_system and source_record_id required' };
  }

  const idempotency_key = buildIngestionIdempotencyKey({
    source_system: input.source_system,
    source_record_id: input.source_record_id,
    signal_class: input.signal_class,
  });
  const now = ctx.clock.nowIso();
  const existing = ctx.store.get(idempotency_key);
  const raw_fingerprint = fingerprintIngestionContent({
    title: input.title,
    href: input.href,
    content_text: input.content_text,
  });
  const content_changed = existing ? existing.content_summary.raw_fingerprint !== raw_fingerprint : true;

  const refTag = `ingest_run:${ctx.ingestionRunId}`;
  const source_refs = existing
    ? existing.lineage.source_refs.includes(refTag)
      ? existing.lineage.source_refs
      : [...existing.lineage.source_refs, refTag]
    : [refTag];

  const first_ingested_at = existing?.ingestion.first_ingested_at ?? now;
  const lifecycle =
    INGESTION_CANDIDATE_LIFECYCLE.normalized;

  const candidate: IngestedSignalCandidate = {
    candidate_id: idempotency_key,
    idempotency_key,
    source_system: input.source_system,
    source_record_id: input.source_record_id,
    lineage: {
      /** Fixed pattern only — deterministic; do not replace with free-form user text. */
      lineage_reference: `phase6:ingest:candidate:${idempotency_key}`,
      source_refs,
    },
    signal_class: input.signal_class,
    resolution_key: input.resolution_key,
    ingestion: {
      candidate_lifecycle: lifecycle,
      first_ingested_at,
      last_ingested_at: now,
      ingestion_run_id: ctx.ingestionRunId,
    },
    content_summary: { title: input.title, href: input.href, raw_fingerprint: raw_fingerprint },
  };

  const { action } = ctx.store.upsert(candidate);
  return { ok: true, candidate, action, content_changed };
}
