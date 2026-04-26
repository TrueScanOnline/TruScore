import {
  createFixedIngestionClock,
  createSteppingIngestionClock,
  InMemoryCandidateIngestionStore,
  ingestSourceRecord,
} from '../../../../dynamicSignals/ingest';
import { INGESTION_CANDIDATE_LIFECYCLE } from '../../../../dynamicSignals/ingest/ingestionCandidateLifecycle';

const baseInput = () => ({
  source_system: 'recalls.gov.au',
  source_record_id: 'recall-2024-001',
  signal_class: 'safety_regulatory' as const,
  resolution_key: { gtin: '9300633072391', market_key: 'AU' as const },
  title: 'Test recall',
  href: 'https://example.com/r1',
  content_text: 'Details',
});

describe('Slice 5A: source / candidate ingestion', () => {
  let store: InMemoryCandidateIngestionStore;

  beforeEach(() => {
    store = new InMemoryCandidateIngestionStore();
  });

  it('creates a candidate with stable idempotency key, lineage, and no publication state', () => {
    const r = ingestSourceRecord(baseInput(), {
      clock: createFixedIngestionClock('2026-04-26T00:00:00.000Z'),
      ingestionRunId: 'run-1',
      store,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const c = r.candidate;
    expect(r.action).toBe('created');
    expect(c.idempotency_key).toBe('recalls.gov.au|recall-2024-001|safety_regulatory');
    expect(c.lineage.lineage_reference).toBe('phase6:ingest:candidate:recalls.gov.au|recall-2024-001|safety_regulatory');
    expect(c.lineage.source_refs).toEqual(['ingest_run:run-1']);
    expect(c.ingestion.candidate_lifecycle).toBe(INGESTION_CANDIDATE_LIFECYCLE.normalized);
    expect('signal_publication_state' in c).toBe(false);
    expect('dedupe_key' in c).toBe(false);
  });

  it('is idempotent: second ingest with same key updates last_ingested_at, preserves first_ingested_at', () => {
    const clock = createSteppingIngestionClock(['2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z']);
    const r1 = ingestSourceRecord(baseInput(), { clock, ingestionRunId: 'a', store });
    const r2 = ingestSourceRecord(baseInput(), { clock, ingestionRunId: 'b', store });
    expect(r1.ok && r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;
    expect(r1.action).toBe('created');
    expect(r2.action).toBe('updated');
    expect(r2.candidate.ingestion.first_ingested_at).toBe('2026-01-01T00:00:00.000Z');
    expect(r2.candidate.ingestion.last_ingested_at).toBe('2026-01-02T00:00:00.000Z');
    expect(r2.content_changed).toBe(false);
  });

  it('detects updated source payload (fingerprint) on same idempotency key', () => {
    const clock = createFixedIngestionClock('2026-01-01T00:00:00.000Z');
    const a = baseInput();
    ingestSourceRecord(a, { clock, ingestionRunId: '1', store });
    const b = { ...a, content_text: 'Changed body' };
    const r2 = ingestSourceRecord(b, { clock, ingestionRunId: '2', store });
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(r2.content_changed).toBe(true);
  });

  it('rejects malformed input without writing a row', () => {
    const bad = { ...baseInput(), resolution_key: { gtin: 'abc', market_key: 'AU' as const } };
    const r = ingestSourceRecord(bad, {
      clock: createFixedIngestionClock('2026-01-01T00:00:00.000Z'),
      ingestionRunId: 'x',
      store,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toBe('malformed_input');
    expect(store.size()).toBe(0);
  });
});
