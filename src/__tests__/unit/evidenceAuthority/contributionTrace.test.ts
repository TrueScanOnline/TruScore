import { ContributionTrace } from '../../../evidenceAuthority/contributionTrace';

describe('contribution trace', () => {
  it('keeps one id and drops packet wording from the timeline', () => {
    const trace = new ContributionTrace('modal', 'ios');
    trace.mark('submit_tap');
    trace.mark('Fairtrade cocoa from the packet');
    trace.setDomains(['certifications', 'Made with care']);
    trace.request({
      kind: 'finalize_manual_text',
      durationMs: 1800,
      outcome: 'ok',
      status: 200,
      timeoutMs: 20000,
    });
    trace.request({
      kind: 'submit',
      durationMs: 20000,
      outcome: 'timeout',
      status: null,
      timeoutMs: 20000,
    });
    const payload = trace.payload('modal_finally');
    const encoded = JSON.stringify(payload);
    expect(payload.traceId).toMatch(/^ctr_[a-f0-9]{16}$/);
    expect(payload.platform).toBe('ios');
    expect(payload.domains).toEqual(['certifications']);
    expect(payload.marks.map((mark) => mark.name)).toEqual(['submit_tap']);
    expect(payload.requests.map((request) => request.outcome)).toEqual(['ok', 'timeout']);
    expect(encoded).not.toContain('Fairtrade');
    expect(encoded).not.toContain('Made with care');
    expect(trace.headers()['X-Rveel-Trace-Id']).toBe(payload.traceId);
    expect(trace.compactMarks()).not.toContain('Fairtrade');
  });
});
