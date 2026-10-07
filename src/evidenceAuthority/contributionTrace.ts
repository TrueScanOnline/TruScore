import { getBackendUrl } from '../config/backendConfig';

const TRACE_ID_RE = /^ctr_[a-f0-9]{16}$/;
const MARK_RE = /^[a-z0-9_]{1,48}$/;
const OUTCOME_RE = /^(ok|http_error|timeout|abort|network_error|cache_hit|cache_miss|admitted|refused|failed|none)$/;
const DOMAINS = new Set(['ingredients_nutrition', 'origins', 'packet_claims', 'certifications']);

export type TraceRequestKind =
  | 'authority_env'
  | 'issue_credential'
  | 'finalize_manual_text'
  | 'upload_asset_chunk'
  | 'finalize_asset'
  | 'submit'
  | 'evidence_image_profile'
  | 'authorize_evidence_image'
  | 'evidence_image_put'
  | 'finalize_evidence_image';

export type TraceRequestOutcome = 'ok' | 'http_error' | 'timeout' | 'abort' | 'network_error';

type TraceMark = { name: string; ms: number; outcome?: string; state: string };
type TraceRequest = {
  kind: TraceRequestKind;
  ms: number;
  durationMs: number;
  outcome: TraceRequestOutcome;
  status: number | null;
  timeoutMs: number;
};

export type ContributionTracePayload = {
  action: 'contribution-trace';
  traceId: string;
  platform: 'ios' | 'android' | 'unknown';
  entry: 'modal' | 'retry' | 'capture';
  byteRequests?: number;
  error?: string;
  domains: string[];
  reason: string;
  t0: number;
  elapsedMs: number;
  openTransmits: number;
  marks: TraceMark[];
  requests: TraceRequest[];
};

function randomTraceId(): string {
  const bytes = new Uint8Array(8);
  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.getRandomValues) cryptoRef.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  return `ctr_${Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function readAppState(): string {
  try {
    const { AppState } = require('react-native') as { AppState?: { currentState?: string } };
    const state = AppState?.currentState;
    return state === 'active' || state === 'background' || state === 'inactive' ? state : 'unknown';
  } catch {
    return 'unknown';
  }
}

export function readClientPlatform(): 'ios' | 'android' | 'unknown' {
  try {
    const { Platform } = require('react-native') as { Platform?: { OS?: string } };
    if (Platform?.OS === 'ios' || Platform?.OS === 'android') return Platform.OS;
  } catch {
    // Jest and server copies have no React Native runtime.
  }
  return 'unknown';
}

export class ContributionTrace {
  readonly traceId: string;
  readonly entry: 'modal' | 'retry' | 'capture';
  readonly platform: 'ios' | 'android' | 'unknown';
  readonly t0: number;
  domains: string[] = [];
  openTransmits = 0;
  private marks: TraceMark[] = [];
  private requests: TraceRequest[] = [];

  byteRequests = 0;

  private errorNote = '';

  constructor(
    entry: 'modal' | 'retry' | 'capture',
    platform: string,
    restored?: { traceId: string; t0: number }
  ) {
    this.traceId = restored?.traceId && TRACE_ID_RE.test(restored.traceId) ? restored.traceId : randomTraceId();
    this.entry = entry;
    this.platform = platform === 'ios' || platform === 'android' ? platform : 'unknown';
    this.t0 = restored?.t0 && Number.isFinite(restored.t0) ? restored.t0 : Date.now();
  }

  mark(name: string, outcome?: string): void {
    if (!MARK_RE.test(name)) return;
    const safeOutcome = outcome && OUTCOME_RE.test(outcome) ? outcome : undefined;
    this.marks.push({ name, ms: Date.now() - this.t0, ...(safeOutcome ? { outcome: safeOutcome } : {}), state: readAppState() });
    if (this.marks.length > 40) this.marks.shift();
  }

  request(input: {
    kind: TraceRequestKind;
    durationMs: number;
    outcome: TraceRequestOutcome;
    status: number | null;
    timeoutMs: number;
  }): void {
    this.requests.push({
      kind: input.kind,
      ms: Date.now() - this.t0,
      durationMs: input.durationMs,
      outcome: input.outcome,
      status: input.status,
      timeoutMs: input.timeoutMs,
    });
    if (this.requests.length > 20) this.requests.shift();
  }

  setDomains(domains: string[]): void {
    this.domains = [...new Set(domains.filter((domain) => DOMAINS.has(domain)))];
  }

  /** Bounded diagnostic. It is not shown to the consumer. */
  noteError(error: unknown): void {
    const name = error instanceof Error ? error.name : 'Error';
    const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'unknown';
    this.errorNote = `${name}: ${message}`.replace(/\s+/g, ' ').slice(0, 180);
  }

  headers(): Record<string, string> {
    return {
      'X-Rveel-Trace-Id': this.traceId,
      'X-Rveel-Trace-Platform': this.platform,
      'X-Rveel-Trace-T0': String(this.t0),
      'X-Rveel-Client-Marks': this.compactMarks(),
    };
  }

  compactMarks(): string {
    return this.marks
      .map((mark) => `${mark.name}@${mark.ms}${mark.outcome ? `:${mark.outcome}` : ''}/${mark.state}`)
      .join(',')
      .slice(0, 1800);
  }

  payload(reason: string): ContributionTracePayload {
    return {
      action: 'contribution-trace',
      traceId: this.traceId,
      platform: this.platform,
      entry: this.entry,
      domains: this.domains,
      reason: MARK_RE.test(reason) ? reason : 'flush',
      t0: this.t0,
      elapsedMs: Date.now() - this.t0,
      openTransmits: this.openTransmits,
      byteRequests: this.byteRequests,
      ...(this.errorNote ? { error: this.errorNote } : {}),
      marks: this.marks.map((mark) => ({ ...mark })),
      requests: this.requests.map((request) => ({ ...request })),
    };
  }

  flush(reason: string): void {
    if (process.env.JEST_WORKER_ID) return;
    const body = this.payload(reason);
    if (!TRACE_ID_RE.test(body.traceId)) return;
    const base = getBackendUrl().replace(/\/$/, '');
    void fetch(`${base}/api/evidence-authority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.headers() },
      body: JSON.stringify(body),
    }).catch(() => undefined);
  }
}

let modalTrace: ContributionTrace | null = null;
let openTransmits = 0;

export function beginModalTrace(platform: string): ContributionTrace {
  modalTrace = new ContributionTrace('modal', platform);
  return modalTrace;
}

export function currentModalTrace(): ContributionTrace | null {
  return modalTrace;
}

export function finishModalTrace(): void {
  modalTrace = null;
}

export function beginRetryTrace(): ContributionTrace {
  return new ContributionTrace('retry', readClientPlatform());
}

export function noteTransmitEnter(trace: ContributionTrace): void {
  openTransmits += 1;
  trace.openTransmits = openTransmits;
  trace.mark('transmit_enter');
}

export function noteTransmitLeave(trace: ContributionTrace): void {
  openTransmits = Math.max(0, openTransmits - 1);
  trace.openTransmits = openTransmits;
  trace.mark('transmit_leave');
}
