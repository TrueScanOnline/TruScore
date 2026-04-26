export { INGESTION_CANDIDATE_LIFECYCLE } from './ingestionCandidateLifecycle';
export type { IngestedSignalCandidate, SourceRecordIngestionInput } from './types';
export { buildIngestionIdempotencyKey } from './idempotencyKey';
export { fingerprintIngestionContent } from './contentFingerprint';
export {
  createSystemIngestionClock,
  createFixedIngestionClock,
  createSteppingIngestionClock,
  type IngestionClock,
} from './ingestionClock';
export { InMemoryCandidateIngestionStore } from './candidateIngestionStore';
export { ingestSourceRecord, type IngestSourceRecordResult } from './ingestFromSourceRecord';
