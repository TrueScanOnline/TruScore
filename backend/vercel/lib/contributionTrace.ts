import { AsyncLocalStorage } from 'node:async_hooks';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const TRACE_ID_RE = /^ctr_[a-f0-9]{16}$/;
const MARK_RE = /^[a-z0-9_]{1,48}$/;
const OUTCOME_RE = /^(ok|http_error|timeout|abort|network_error|cache_hit|cache_miss|admitted|refused|failed|none|rejected|pending_source|no_facts|source_hash_mismatch|source_not_finalized|source_not_owned)$/;
const DOMAINS = new Set(['ingredients_nutrition', 'origins', 'packet_claims', 'certifications']);
const REQUEST_KINDS = new Set([
  'authority_env',
  'issue_credential',
  'finalize_manual_text',
  'upload_asset_chunk',
  'finalize_asset',
  'submit',
  'evidence_image_profile',
  'authorize_evidence_image',
  'evidence_image_put',
  'finalize_evidence_image',
]);

type ServerMark = { name: string; ms: number };

type ServerTrace = {
  traceId: string;
  platform: 'ios' | 'android' | 'unknown';
  t0: number | null;
  clientMarks: string;
  action: string;
  receivedAt: number;
  marks: ServerMark[];
  note: Record<string, string | number | boolean | string[]>;
};

const storage = new AsyncLocalStorage<ServerTrace>();

function header(req: VercelRequest, name: string): string {
  const value = req.headers[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function openServerTrace(req: VercelRequest, receivedAt: number): ServerTrace | null {
  const traceId = header(req, 'x-rveel-trace-id');
  if (!TRACE_ID_RE.test(traceId)) return null;
  const platformHeader = header(req, 'x-rveel-trace-platform');
  const platform = platformHeader === 'ios' || platformHeader === 'android' ? platformHeader : 'unknown';
  const t0Raw = Number(header(req, 'x-rveel-trace-t0'));
  const t0 = Number.isFinite(t0Raw) && t0Raw > 0 ? Math.floor(t0Raw) : null;
  const clientMarks = header(req, 'x-rveel-client-marks').slice(0, 1800);
  return {
    traceId,
    platform,
    t0,
    clientMarks,
    action: 'unknown',
    receivedAt,
    marks: [],
    note: {},
  };
}

export function bindServerTrace(res: VercelResponse, trace: ServerTrace, startedAt: number): void {
  storage.enterWith(trace);
  const original = res.json.bind(res);
  let logged = false;
  res.json = ((body?: unknown) => {
    if (!logged) {
      logged = true;
      emitServerTrace(trace, res.statusCode || 200, Date.now() - startedAt);
    }
    return original(body);
  }) as VercelResponse['json'];
}

export function serverTraceAction(action: string): void {
  const current = storage.getStore();
  if (!current || !MARK_RE.test(action)) return;
  current.action = action;
}

export function serverTraceMark(name: string): void {
  const current = storage.getStore();
  if (!current || !MARK_RE.test(name)) return;
  current.marks.push({ name, ms: Date.now() - current.receivedAt });
  if (current.marks.length > 40) current.marks.shift();
}

export function serverTraceTransaction(phase: 'begin' | 'commit' | 'rollback'): void {
  const action = storage.getStore()?.action;
  const prefix = action === 'submit' ? 'admission_transaction' : 'db_transaction';
  serverTraceMark(`${prefix}_${phase}`);
}

export function serverTraceNote(note: Record<string, string | number | boolean | string[]>): void {
  const current = storage.getStore();
  if (!current) return;
  for (const [key, value] of Object.entries(note)) {
    if (!MARK_RE.test(key)) continue;
    if (typeof value === 'string') {
      if (MARK_RE.test(value) || OUTCOME_RE.test(value)) current.note[key] = value;
      continue;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      current.note[key] = value;
      continue;
    }
    if (typeof value === 'boolean') {
      current.note[key] = value;
      continue;
    }
    if (Array.isArray(value)) {
      current.note[key] = value.filter((item) => typeof item === 'string' && (MARK_RE.test(item) || OUTCOME_RE.test(item))).slice(0, 12);
    }
  }
}

function sanitizedClientTimeline(body: Record<string, unknown>): Record<string, unknown> | null {
  const traceId = typeof body.traceId === 'string' ? body.traceId : '';
  if (!TRACE_ID_RE.test(traceId)) return null;
  const platform = body.platform === 'ios' || body.platform === 'android' ? body.platform : 'unknown';
  const entry = body.entry === 'modal' || body.entry === 'retry' || body.entry === 'capture' ? body.entry : 'unknown';
  const domains = Array.isArray(body.domains)
    ? body.domains.filter((domain): domain is string => typeof domain === 'string' && DOMAINS.has(domain)).slice(0, 4)
    : [];
  const marks = Array.isArray(body.marks)
    ? body.marks
        .map((mark) => {
          if (!mark || typeof mark !== 'object') return null;
          const row = mark as Record<string, unknown>;
          const name = typeof row.name === 'string' ? row.name : '';
          const ms = typeof row.ms === 'number' ? row.ms : null;
          if (!MARK_RE.test(name) || ms == null || !Number.isFinite(ms)) return null;
          const outcome = typeof row.outcome === 'string' && OUTCOME_RE.test(row.outcome) ? row.outcome : undefined;
          const state =
            row.state === 'active' || row.state === 'background' || row.state === 'inactive' || row.state === 'unknown'
              ? row.state
              : 'unknown';
          return { name, ms, ...(outcome ? { outcome } : {}), state };
        })
        .filter((mark) => mark != null)
        .slice(0, 40)
    : [];
  const requests = Array.isArray(body.requests)
    ? body.requests
        .map((request) => {
          if (!request || typeof request !== 'object') return null;
          const row = request as Record<string, unknown>;
          const kind = typeof row.kind === 'string' ? row.kind : '';
          if (!REQUEST_KINDS.has(kind)) return null;
          const outcome = typeof row.outcome === 'string' && OUTCOME_RE.test(row.outcome) ? row.outcome : 'network_error';
          return {
            kind,
            ms: typeof row.ms === 'number' && Number.isFinite(row.ms) ? row.ms : 0,
            durationMs: typeof row.durationMs === 'number' && Number.isFinite(row.durationMs) ? row.durationMs : 0,
            outcome,
            status: typeof row.status === 'number' && Number.isFinite(row.status) ? row.status : null,
            timeoutMs: typeof row.timeoutMs === 'number' && Number.isFinite(row.timeoutMs) ? row.timeoutMs : 0,
          };
        })
        .filter((request) => request != null)
        .slice(0, 20)
    : [];
  return {
    traceId,
    platform,
    entry,
    domains,
    reason: typeof body.reason === 'string' && MARK_RE.test(body.reason) ? body.reason : 'flush',
    t0: typeof body.t0 === 'number' && Number.isFinite(body.t0) ? Math.floor(body.t0) : null,
    elapsedMs: typeof body.elapsedMs === 'number' && Number.isFinite(body.elapsedMs) ? body.elapsedMs : null,
    openTransmits: typeof body.openTransmits === 'number' && Number.isFinite(body.openTransmits) ? body.openTransmits : null,
    byteRequests: typeof body.byteRequests === 'number' && Number.isFinite(body.byteRequests) ? body.byteRequests : 0,
    marks,
    requests,
  };
}

export function logClientTimeline(body: Record<string, unknown>): void {
  const timeline = sanitizedClientTimeline(body);
  if (!timeline) return;
  console.log('[contribution-trace]', JSON.stringify({ tag: 'contribution-trace', side: 'client', ...timeline }));
}

function emitServerTrace(trace: ServerTrace, status: number, durationMs: number): void {
  const line = {
    tag: 'contribution-trace',
    side: 'server',
    traceId: trace.traceId,
    platform: trace.platform,
    action: trace.action,
    t0: trace.t0,
    receivedAt: trace.receivedAt,
    durationMs,
    status,
    clientMarks: trace.clientMarks,
    marks: trace.marks,
    ...trace.note,
  };
  console.log('[contribution-trace]', JSON.stringify(line));
}
