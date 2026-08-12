import {
  applyFounderAdminAction,
  canPromoteToCanonicalProduct,
  confirmEvidence,
  createPendingEvidence,
  disputeEvidence,
  markCanonicalPromoted,
} from '../../../contributions/lifecycle';
import type { ContributionEvidence } from '../../../contributions/types';

function pendingCert(): ContributionEvidence {
  return createPendingEvidence({
    evidenceId: '9300000000001|certifications|fair trade|v1',
    barcode: '9300000000001',
    domain: 'certifications',
    evidenceVersion: 1,
    claimKey: 'fair trade',
    claimValue: 'en:fair-trade',
    labelsTags: ['en:fair-trade'],
    submitterId: 'user_submitter',
    createdAt: 1,
  });
}

function pendingOrigin(): ContributionEvidence {
  return createPendingEvidence({
    evidenceId: '9300000000001|origins|new zealand|v1',
    barcode: '9300000000001',
    domain: 'origins',
    evidenceVersion: 1,
    claimKey: 'new zealand',
    claimValue: 'New Zealand',
    submitterId: 'user_submitter',
    createdAt: 1,
  });
}

describe('contribution evidence lifecycle', () => {
  it('starts pending and not scoring-eligible', () => {
    const evidence = pendingCert();
    expect(evidence.state).toBe('pending');
    expect(evidence.scoringEligible).toBe(false);
    expect(evidence.canonicalPromoted).toBe(false);
  });

  it('submitter cannot confirm or dispute their own evidence', () => {
    const evidence = pendingCert();
    expect(confirmEvidence(evidence, 'user_submitter').ok).toBe(false);
    expect(disputeEvidence(evidence, 'user_submitter', 'claim_not_present').ok).toBe(false);
  });

  it('one independent confirmation reaches cross_user_eligible', () => {
    const confirmed = confirmEvidence(pendingCert(), 'user_other');
    expect(confirmed.ok).toBe(true);
    expect(confirmed.evidence.state).toBe('cross_user_eligible');
    expect(confirmed.evidence.scoringEligible).toBe(true);
  });

  it('Origins confirmation never becomes scoring-eligible (canonicalPromotionPermission false)', () => {
    const confirmed = confirmEvidence(pendingOrigin(), 'user_other');
    expect(confirmed.ok).toBe(true);
    expect(confirmed.evidence.state).toBe('cross_user_eligible');
    expect(confirmed.evidence.scoringEligible).toBe(false);
    expect(canPromoteToCanonicalProduct(confirmed.evidence)).toBe(false);
  });

  it('two independent disputes move evidence to review_required', () => {
    const first = disputeEvidence(pendingCert(), 'user_a', 'claim_not_present');
    const second = disputeEvidence(first.evidence, 'user_b', 'wrong_product');
    expect(second.evidence.state).toBe('review_required');
    expect(second.evidence.scoringEligible).toBe(false);
  });

  it('one active response per contributor per evidence version', () => {
    const confirmed = confirmEvidence(pendingCert(), 'user_other');
    const disputed = disputeEvidence(confirmed.evidence, 'user_other', 'wording_differs');
    expect(disputed.ok).toBe(true);
    expect(disputed.evidence.confirmations.some((c) => c.contributorId === 'user_other')).toBe(false);
    expect(disputed.evidence.disputes).toHaveLength(1);
  });

  it('founder withdraw/suppress closes evidence without automatic withdrawal', () => {
    const withdrawn = applyFounderAdminAction(pendingCert(), 'withdraw');
    expect(withdrawn.state).toBe('withdrawn');
    expect(withdrawn.scoringEligible).toBe(false);
    expect(confirmEvidence(withdrawn, 'user_other').ok).toBe(false);
  });

  it('CERT promotion is reserved: eligible certs may be marked promoted; origins cannot', () => {
    const certEligible = confirmEvidence(pendingCert(), 'user_other').evidence;
    expect(canPromoteToCanonicalProduct(certEligible)).toBe(true);
    const promoted = markCanonicalPromoted(certEligible);
    expect(promoted.canonicalPromoted).toBe(true);

    const originEligible = confirmEvidence(pendingOrigin(), 'user_other').evidence;
    expect(markCanonicalPromoted(originEligible).canonicalPromoted).toBe(false);
  });
});
