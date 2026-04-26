import { ingestSourceRecord, createFixedIngestionClock, createSteppingIngestionClock, InMemoryCandidateIngestionStore } from '../../../../dynamicSignals/ingest';
import {
  applyStalenessExpiryIfDue,
  buildPublicationDedupeKey,
  buildSignalId,
  classAllowsPublishable,
  materializePublicationFromCandidate,
  recordMislinkReport,
  tryApplyPublicationIntent,
} from '../../../../dynamicSignals/publish';

function baseSourceInput(overrides: Record<string, unknown> = {}) {
  return {
    source_system: 'recalls.gov.au',
    source_record_id: 'rec-42',
    signal_class: 'safety_regulatory' as const,
    resolution_key: { gtin: '9300633072391', market_key: 'AU' as const },
    title: 'Recall',
    content_text: 'x',
    ...overrides,
  };
}

function candidateFromIngest(over: Record<string, unknown> = {}): ReturnType<typeof seedCandidate> {
  return seedCandidate(over);
}

function seedCandidate(over: Record<string, unknown> = {}): import('../../../../dynamicSignals/ingest').IngestedSignalCandidate {
  const store = new InMemoryCandidateIngestionStore();
  const r = ingestSourceRecord(
    { ...baseSourceInput(), ...over } as import('../../../../dynamicSignals/ingest').SourceRecordIngestionInput,
    {
      clock: createFixedIngestionClock('2026-01-15T12:00:00.000Z'),
      ingestionRunId: 't0',
      store,
    }
  );
  if (!r.ok) throw new Error('ingest');
  return r.candidate;
}

describe('Slice 5B: publication engine', () => {
  it('creates signal_id and dedupe_key in 5B only; 5A candidate has neither', () => {
    const c = seedCandidate();
    expect('signal_id' in c).toBe(false);
    expect('dedupe_key' in c).toBe(false);
    const dk = buildPublicationDedupeKey(c);
    const sid = buildSignalId(dk);
    expect(dk).toContain('9300633072391');
    expect(sid).toMatch(/^p6s-/);
    const pub = materializePublicationFromCandidate(
      c,
      { confidence_state: 'strong', review_state: 'reviewed', resolution_status: 'resolved' },
      { clock: createFixedIngestionClock('2026-01-15T12:00:00.000Z') }
    );
    expect(pub.signal_id).toBe(sid);
    expect(pub.dedupe_key).toBe(dk);
  });

  it('blocked resolution never allows publishable (Doc 5 / pack)', () => {
    const c = seedCandidate();
    const r = materializePublicationFromCandidate(
      c,
      { confidence_state: 'strong', review_state: 'reviewed', resolution_status: 'blocked' },
      { clock: createFixedIngestionClock('2026-01-15T12:00:00.000Z') }
    );
    expect(r.signal_publication_state).toBe('suppressed');
    const tryPub = tryApplyPublicationIntent(
      { ...r, state: { ...r.state, resolution_status: 'blocked' } },
      { type: 'to_publishable' },
      { clock: createFixedIngestionClock('2026-01-16T12:00:00.000Z') }
    );
    expect(tryPub.ok).toBe(false);
  });

  it('needs_review never allows to_publishable via engine', () => {
    const c = seedCandidate();
    const r = materializePublicationFromCandidate(
      c,
      { confidence_state: 'strong', review_state: 'provisional', resolution_status: 'needs_review' },
      { clock: createFixedIngestionClock('2026-01-15T12:00:00.000Z') }
    );
    const t = tryApplyPublicationIntent(
      { ...r, state: { ...r.state, resolution_status: 'needs_review' } },
      { type: 'to_publishable' },
      { clock: createFixedIngestionClock('2026-01-16T00:00:00.000Z') }
    );
    expect(t.ok).toBe(false);
  });

  it('gating: safety can be publishable when resolution + confidence pass', () => {
    const c = seedCandidate({ signal_class: 'safety_regulatory' });
    const r = materializePublicationFromCandidate(
      c,
      { confidence_state: 'strong', review_state: 'reviewed', resolution_status: 'resolved' },
      { clock: createFixedIngestionClock('2026-01-15T00:00:00.000Z') }
    );
    expect(r.signal_publication_state).toBe('publishable');
  });

  it('gating: in_the_news requires review_state reviewed', () => {
    const c = seedCandidate({ signal_class: 'in_the_news' });
    const held = materializePublicationFromCandidate(
      c,
      { confidence_state: 'strong', review_state: 'provisional', resolution_status: 'resolved' },
      { clock: createFixedIngestionClock('2026-01-15T00:00:00.000Z') }
    );
    expect(held.signal_publication_state).toBe('held_for_review');
    const ok = materializePublicationFromCandidate(
      candidateFromIngest({ signal_class: 'in_the_news' }),
      { confidence_state: 'strong', review_state: 'reviewed', resolution_status: 'resolved' },
      { clock: createFixedIngestionClock('2026-01-15T00:00:00.000Z') }
    );
    expect(ok.signal_publication_state).toBe('publishable');
  });

  it('gating: my_choices_chain requires chain link context for publishable', () => {
    const c = seedCandidate({ signal_class: 'my_choices_chain' });
    const noCtx = materializePublicationFromCandidate(
      c,
      { confidence_state: 'strong', review_state: 'reviewed', resolution_status: 'resolved' },
      { clock: createFixedIngestionClock('2026-01-15T00:00:00.000Z') }
    );
    expect(noCtx.signal_publication_state).toBe('held_for_review');
    const linked = materializePublicationFromCandidate(
      candidateFromIngest({ signal_class: 'my_choices_chain' }),
      { confidence_state: 'strong', review_state: 'reviewed', resolution_status: 'resolved' },
      { clock: createFixedIngestionClock('2026-01-15T00:00:00.000Z'), myChoicesContext: { is_chain_linked: true } }
    );
    expect(linked.signal_publication_state).toBe('publishable');
  });

  it('mislink forces downgrade from publishable to held', () => {
    const c = seedCandidate();
    const pub0 = materializePublicationFromCandidate(
      c,
      { confidence_state: 'strong', review_state: 'reviewed', resolution_status: 'resolved' },
      { clock: createFixedIngestionClock('2026-01-15T00:00:00.000Z') }
    );
    const clock = createFixedIngestionClock('2026-01-20T00:00:00.000Z');
    const after = recordMislinkReport(pub0, clock);
    expect(after.signal_publication_state).toBe('held_for_review');
    const tryP = tryApplyPublicationIntent(after, { type: 'to_publishable' }, { clock });
    expect(tryP.ok).toBe(false);
  });

  it('staleness expiry uses injected clock, not wall time', () => {
    const c = seedCandidate();
    const clock1 = createFixedIngestionClock('2025-01-01T00:00:00.000Z');
    const r1 = materializePublicationFromCandidate(
      c,
      { confidence_state: 'strong', review_state: 'reviewed', resolution_status: 'resolved' },
      { clock: clock1 }
    );
    const future = createFixedIngestionClock('2100-01-01T00:00:00.000Z');
    const r2 = applyStalenessExpiryIfDue(r1, future);
    expect(r2.signal_publication_state).toBe('expired');
  });

  it('5A ingest path alone cannot add publication fields to type', () => {
    const r = ingestSourceRecord(
      { ...baseSourceInput(), content_text: 'a' } as import('../../../../dynamicSignals/ingest').SourceRecordIngestionInput,
      {
        clock: createSteppingIngestionClock(['2026-01-01T00:00:00.000Z', '2026-01-02T00:00:00.000Z']),
        ingestionRunId: 'a',
        store: new InMemoryCandidateIngestionStore(),
      }
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const x = r.candidate as unknown as Record<string, unknown>;
    expect(x.signal_publication_state).toBeUndefined();
    expect(x.dedupe_key).toBeUndefined();
  });
});

describe('classAllowsPublishable unit', () => {
  it('exposes different reasons per class (smoke)', () => {
    const s = (cls: 'safety_regulatory' | 'in_the_news' | 'my_choices_chain', rev: 'reviewed' | 'provisional', res: 'resolved') =>
      classAllowsPublishable(cls, { confidence_state: 'strong', review_state: rev, resolution_status: res });
    expect(s('in_the_news', 'provisional', 'resolved').allowed).toBe(false);
    expect(s('in_the_news', 'reviewed', 'resolved').allowed).toBe(true);
  });
});
