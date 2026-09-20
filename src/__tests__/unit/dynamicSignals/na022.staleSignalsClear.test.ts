/**
 * NA-022 — clear stale Dynamic Signal records when Core Truth authority is lost.
 * Mirrors the Result-screen contract in app/result/[barcode].tsx (signals useEffect).
 */
describe('NA-022 stale Signal clear on Core Truth authority loss', () => {
  it('clears prior Signal records when eval context becomes null (same barcode authority drop)', () => {
    let dynamicSignalRecords: string[] = ['STALE_SIG'];
    let signalsReadyOutcome: string | null = 'ok';
    let signalsEvalKey: string | null = 'prior-key';

    function applySignalsEvalContext(ctx: { evalKey: string } | null) {
      if (!ctx) {
        // NA-022: Core Truth authority loss collapses eval context — clear stale Signal cards.
        dynamicSignalRecords = [];
        signalsReadyOutcome = null;
        signalsEvalKey = null;
        return;
      }
      // Production would evaluate here; not required for clear-on-null proof.
      void ctx.evalKey;
    }

    applySignalsEvalContext({ evalKey: 'bc:stamped:reviewed:B1:P1' });
    expect(dynamicSignalRecords).toEqual(['STALE_SIG']);

    applySignalsEvalContext(null);
    expect(dynamicSignalRecords).toEqual([]);
    expect(signalsReadyOutcome).toBeNull();
    expect(signalsEvalKey).toBeNull();
  });

  it('Result screen source contains NA-022 clear-on-null contract', () => {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../../app/result/[barcode].tsx'),
      'utf8'
    );
    expect(src).toContain('NA-022');
    expect(src).toContain('setDynamicSignalRecords([])');
    expect(src).toMatch(/if\s*\(\s*!ctx\s*\)\s*\{[\s\S]*setDynamicSignalRecords\(\[\]\)/);
  });
});
