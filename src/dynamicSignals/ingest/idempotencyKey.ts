import type { NormativeSignalClass } from '../../contracts/phase6/enums';

/**
 * **Ingestion idempotency boundary** — same upstream source row + class → one candidate row.
 * Intended to dedupe **candidate identity** at source-record level, not to express final public
 * dedupe semantics: `dedupe_key` and `signal_id` for the dynamic signal **record** are created in
 * Slice 5B (`buildPublicationDedupeKey` / `buildSignalId`) and may differ.
 */
export function buildIngestionIdempotencyKey(input: {
  source_system: string;
  source_record_id: string;
  signal_class: NormativeSignalClass;
}): string {
  return `${input.source_system}|${input.source_record_id}|${input.signal_class}`;
}
