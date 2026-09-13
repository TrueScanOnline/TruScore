/**
 * S28 Claims diagnostic surface contracts (S28-01..08).
 * Founder/UAT modal must render Claims assessment fields — attachment alone is insufficient.
 */

import * as fs from 'fs';
import * as path from 'path';
import { assertScoreDiagnosticsReleaseSafe, isScoreDiagnosticsBuildEntitled } from '../../../../config/scoreDiagnostics';

const REPO = path.resolve(__dirname, '../../../../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(REPO, rel), 'utf8');
}

describe('S28 Claims diagnostic surface contracts', () => {
  const modal = read('src/components/TruScoreAnalysisModal.tsx');
  const analysisTypes = read('src/types/truscoreAnalysis.ts');
  const engine = read('src/lib/truscoreEngine/index.ts');

  test('S28-01..07: modal renders Claims assessment fields (not attachment-only)', () => {
    expect(analysisTypes).toContain('claimsAssessment?: ClaimsAssessmentResult');
    expect(engine).toContain('claimsAssessment');
    expect(modal).toContain('claimsAssessment');
    expect(modal).toContain('assessment_state');
    expect(modal).toContain('packet_coverage_state');
    expect(modal).toContain('Admitted claims');
    expect(modal).toContain('evidence_id');
    expect(modal).toContain('register_row_id');
    expect(modal).toContain('Nutrient context');
    expect(modal).toContain('Fired Claims adjustments');
    expect(modal).toContain('Suppressed candidates');
    expect(modal).toContain('Benchmark checks');
    expect(modal).toContain('Diagnostics / fail-closed reasons');
    expect(modal).toContain('assessed-neutral must never appear as a +0');
    // Internal Ethics pillar key may remain in S28 pillar map
    expect(modal).toContain("(['Body', 'Planet', 'Ethics', 'Open'] as const)");
  });

  test('S28-08: ordinary release path remains dual-gated', () => {
    expect(isScoreDiagnosticsBuildEntitled()).toBe(false);
    const prevStore = process.env.EXPO_PUBLIC_STORE_RELEASE;
    const prevDiag = process.env.EXPO_PUBLIC_SCORE_DIAGNOSTICS;
    try {
      process.env.EXPO_PUBLIC_STORE_RELEASE = '1';
      process.env.EXPO_PUBLIC_SCORE_DIAGNOSTICS = '1';
      expect(() => assertScoreDiagnosticsReleaseSafe()).toThrow(/Score Diagnostics/);
    } finally {
      process.env.EXPO_PUBLIC_STORE_RELEASE = prevStore;
      process.env.EXPO_PUBLIC_SCORE_DIAGNOSTICS = prevDiag;
    }
  });
});
