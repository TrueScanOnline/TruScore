import {
  ContributionCelebrationGate,
  admissionSubmissionKey,
  agreementSubmissionKey,
} from '../../../contributionDelight/celebrationGate';
import { celebrationVariantForAdmission } from '../../../contributionDelight/copy';

describe('W5-CD-01 ContributionCelebrationGate', () => {
  it('admits a submission once and suppresses duplicates', () => {
    const gate = new ContributionCelebrationGate();
    const key = admissionSubmissionKey({
      barcode: '9415077057821',
      snapshotGeneratedAt: 100,
      journey: 'add',
    });
    expect(gate.admit({ submissionKey: key, variant: 'admitted_visible' })).toBe('admitted_visible');
    expect(gate.admit({ submissionKey: key, variant: 'admitted_visible' })).toBeNull();
    expect(gate.hasCelebrated(key)).toBe(true);
  });

  it('treats retries of the same logical key as not a new celebration', () => {
    const gate = new ContributionCelebrationGate();
    const key = 'ea:1:1:add';
    gate.admit({ submissionKey: key, variant: 'admitted_visible' });
    expect(gate.admit({ submissionKey: key, variant: 'correction' })).toBeNull();
  });

  it('allows distinct agreement acknowledgements per revision', () => {
    const gate = new ContributionCelebrationGate();
    const a = agreementSubmissionKey({ barcode: '1', group: 'nutrition', revisionId: 'r1' });
    const b = agreementSubmissionKey({ barcode: '1', group: 'nutrition', revisionId: 'r2' });
    expect(gate.admit({ submissionKey: a, variant: 'agreement_compact' })).toBe('agreement_compact');
    expect(gate.admit({ submissionKey: b, variant: 'agreement_compact' })).toBe('agreement_compact');
    expect(gate.admit({ submissionKey: a, variant: 'agreement_compact' })).toBeNull();
  });

  it('ignores empty submission keys', () => {
    const gate = new ContributionCelebrationGate();
    expect(gate.admit({ submissionKey: '   ', variant: 'admitted_visible' })).toBeNull();
  });
});

describe('celebrationVariantForAdmission', () => {
  it('does not celebrate incomplete or failed admissions', () => {
    expect(celebrationVariantForAdmission({ complete: false, journey: 'add' })).toBeNull();
  });

  it('maps add journeys to admitted_visible and change to correction', () => {
    expect(celebrationVariantForAdmission({ complete: true, journey: 'add' })).toBe('admitted_visible');
    expect(celebrationVariantForAdmission({ complete: true, journey: 'change' })).toBe('correction');
  });
});
