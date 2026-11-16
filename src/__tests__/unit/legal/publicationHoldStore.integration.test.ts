/**
 * Publication-hold store integration tests (in-memory query fake).
 * Does not require a live Postgres instance.
 */

import {
  __resetPublicationHoldSchemaForTests,
  getPublicationHold,
  isPublicationHoldServiceOperational,
  isPublicationHoldStoreConfigured,
  setPublicationHold,
  type HoldStoreQuery,
} from '../../../../backend/vercel/lib/publicationHoldStore';

type Row = Record<string, unknown>;

function createMemoryStore(): {
  query: HoldStoreQuery;
  holds: Map<string, Row>;
  events: Row[];
} {
  const holds = new Map<string, Row>();
  const events: Row[] = [];

  const query: HoldStoreQuery = async (text, params = []) => {
    const sql = text.replace(/\s+/g, ' ').trim();
    if (sql.startsWith('CREATE TABLE') || sql.startsWith('CREATE INDEX')) {
      return { rows: [], rowCount: 0 };
    }
    if (sql.startsWith('SELECT') && sql.includes('FROM publication_holds')) {
      const barcode = String(params[0]);
      const row = holds.get(barcode);
      return {
        rows: row ? [row] : [],
        rowCount: row ? 1 : 0,
      };
    }
    if (sql.startsWith('INSERT INTO publication_hold_events')) {
      events.push({
        barcode: params[0],
        action: params[1],
        held: params[2],
        reason: params[3],
        authorized_by: params[4],
        created_at: params[5],
      });
      return { rows: [], rowCount: 1 };
    }
    if (sql.startsWith('INSERT INTO publication_holds')) {
      const barcode = String(params[0]);
      const held = params[1] === true;
      const reason = params[2] ?? null;
      const authorized_by = params[3];
      const ts = params[4];
      const prev = holds.get(barcode);
      const row: Row = {
        barcode,
        held,
        reason,
        authorized_by,
        held_at: held ? prev?.held_at || ts : prev?.held_at || null,
        released_at: held ? null : ts,
        updated_at: ts,
      };
      holds.set(barcode, row);
      return { rows: [row], rowCount: 1 };
    }
    throw new Error(`Unhandled SQL in fake store: ${sql}`);
  };

  return { query, holds, events };
}

describe('publicationHoldStore integration', () => {
  beforeEach(() => {
    __resetPublicationHoldSchemaForTests();
  });

  it('never treats a missing DB as confirmed no hold', async () => {
    const result = await getPublicationHold('9421901234567', { configured: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('hold_store_unconfigured');
    }
  });

  it('reports store configuration and operational readiness from env', () => {
    expect(isPublicationHoldStoreConfigured({})).toBe(false);
    expect(
      isPublicationHoldStoreConfigured({ DATABASE_URL: 'postgres://example' } as NodeJS.ProcessEnv)
    ).toBe(true);
    expect(
      isPublicationHoldServiceOperational({
        DATABASE_URL: 'postgres://example',
        PUBLICATION_HOLD_OPERATIONAL: '1',
      } as NodeJS.ProcessEnv)
    ).toBe(true);
    expect(
      isPublicationHoldServiceOperational({
        DATABASE_URL: 'postgres://example',
      } as NodeJS.ProcessEnv)
    ).toBe(false);
  });

  it('activates, audits, and releases a hold for the exact GTIN', async () => {
    const mem = createMemoryStore();
    const barcode = '9421901234567';

    const before = await getPublicationHold(barcode, { configured: true, query: mem.query });
    expect(before.ok).toBe(true);
    if (before.ok) expect(before.record.held).toBe(false);

    const held = await setPublicationHold(
      {
        barcode,
        held: true,
        reason: 'Manufacturer identity dispute',
        authorizedBy: 'founder-test',
      },
      { configured: true, query: mem.query }
    );
    expect(held.ok).toBe(true);
    if (held.ok) {
      expect(held.record.held).toBe(true);
      expect(held.record.reason).toContain('identity');
    }
    expect(mem.events).toHaveLength(1);
    expect(mem.events[0].action).toBe('hold');
    expect(mem.events[0].authorized_by).toBe('founder-test');

    const wrong = await getPublicationHold('00000000000000', {
      configured: true,
      query: mem.query,
    });
    expect(wrong.ok).toBe(true);
    if (wrong.ok) expect(wrong.record.held).toBe(false);

    const released = await setPublicationHold(
      {
        barcode,
        held: false,
        reason: 'Verified pack photo',
        authorizedBy: 'founder-test',
      },
      { configured: true, query: mem.query }
    );
    expect(released.ok).toBe(true);
    if (released.ok) expect(released.record.held).toBe(false);
    expect(mem.events).toHaveLength(2);
    expect(mem.events[1].action).toBe('release');
  });

  it('rejects invalid GTIN and missing reason/authorizer', async () => {
    const mem = createMemoryStore();
    const bad = await setPublicationHold(
      { barcode: '123', held: true, reason: 'x', authorizedBy: 'a' },
      { configured: true, query: mem.query }
    );
    expect(bad.ok).toBe(false);

    const noReason = await setPublicationHold(
      { barcode: '9421901234567', held: true, reason: '', authorizedBy: 'a' },
      { configured: true, query: mem.query }
    );
    expect(noReason.ok).toBe(false);
    if (!noReason.ok) expect(noReason.code).toBe('reason_required');
  });

  it('surfaces database failures as unavailable, not no-hold', async () => {
    const query: HoldStoreQuery = async () => {
      throw new Error('connection refused');
    };
    const result = await getPublicationHold('9421901234567', { configured: true, query });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('hold_store_unavailable');
  });
});
