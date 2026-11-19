/**
 * Distinguishes prohibited POST EA actions from authorised snapshot reads.
 * Snapshot reads are GET /api/evidence-authority?barcode= — not a POST action.
 * A mistaken POST action "snapshot" is correctly rejected under preselected-only.
 */

import {
  rejectEvidenceAuthorityActionIfPolicyActive,
  MVP_CONTRIBUTION_INPUT_POLICY_VERSION,
} from '../../../../backend/vercel/lib/mvpContributionInputPolicy';

describe('MVP EA policy: snapshot read vs prohibited POST', () => {
  const prev = process.env.RVEEL_MVP_PRESELECTED_ONLY;

  beforeEach(() => {
    delete process.env.RVEEL_MVP_PRESELECTED_ONLY;
  });

  afterAll(() => {
    if (prev === undefined) delete process.env.RVEEL_MVP_PRESELECTED_ONLY;
    else process.env.RVEEL_MVP_PRESELECTED_ONLY = prev;
  });

  it('rejects unknown POST action "snapshot" under preselected-only (not a real EA action)', () => {
    const gate = rejectEvidenceAuthorityActionIfPolicyActive({
      action: 'snapshot',
      body: { barcode: '9300617064879' },
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) {
      expect(gate.status).toBe(403);
      expect(gate.error).toBe('mvp_preselected_only_evidence_action_forbidden');
      expect(gate.policyVersion).toBe(MVP_CONTRIBUTION_INPUT_POLICY_VERSION);
    }
  });

  it('permits structured Origins finalize-manual-text and FM-03R attestation finalize', () => {
    const origins = rejectEvidenceAuthorityActionIfPolicyActive({
      action: 'finalize-manual-text',
      body: {
        barcode: '9300617064879',
        domain: 'origins',
        originClaimType: 'made_in',
        originCountry: 'Fiji',
        percentageNotStated: true,
      },
    });
    expect(origins.ok).toBe(true);

    const absence = rejectEvidenceAuthorityActionIfPolicyActive({
      action: 'finalize-packet-absence-attestation',
      body: { barcode: '9300673999999' },
    });
    expect(absence.ok).toBe(true);
  });

  it('rejects free-form finalize-manual-text with statement', () => {
    const gate = rejectEvidenceAuthorityActionIfPolicyActive({
      action: 'finalize-manual-text',
      body: {
        barcode: '9300617064879',
        domain: 'origins',
        originClaimType: 'made_in',
        originCountry: 'Fiji',
        statement: 'Made in Fiji',
      },
    });
    expect(gate.ok).toBe(false);
  });
});
