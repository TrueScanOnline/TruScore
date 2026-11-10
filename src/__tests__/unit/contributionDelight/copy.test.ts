import { CONTRIBUTION_NOTICE_ADDED, CONTRIBUTION_NOTICE_SAVED } from '../../../contribution/resultContributionActions';
import { copyForCelebrationVariant } from '../../../contributionDelight/copy';

describe('W5-CD-01 celebration copy', () => {
  it('uses the existing admitted-visible success fact, not awaiting-review copy', () => {
    const copy = copyForCelebrationVariant('admitted_visible');
    expect(copy.title).toBe('You made a difference!');
    expect(copy.body).toContain('clearer');
    expect(copy.status).toBe(CONTRIBUTION_NOTICE_ADDED);
    expect(copy.qualification).toBeNull();
    expect(copy.status).not.toBe('Contribution received');
    expect(copy.secondaryDetail || '').not.toMatch(/We'll check your information before it appears/);
  });

  it('uses correction title with the same truthful admitted status', () => {
    const copy = copyForCelebrationVariant('correction');
    expect(copy.title).toBe('Thank you for keeping Rveel accurate!');
    expect(copy.status).toBe(CONTRIBUTION_NOTICE_ADDED);
  });

  it('keeps Community Agreement acknowledgement compact', () => {
    const copy = copyForCelebrationVariant('agreement_compact');
    expect(copy.title).toBe('Thanks for your contribution');
    expect(copy.secondaryAction).toBeNull();
    expect(copy.status).toBeNull();
  });

  it('drops the redundant Thanks from the secondary status confirmation', () => {
    expect(CONTRIBUTION_NOTICE_ADDED).toBe('Your contribution has been added.');
    expect(CONTRIBUTION_NOTICE_ADDED).not.toMatch(/^Thanks\b/i);
    const admitted = copyForCelebrationVariant('admitted_visible');
    const correction = copyForCelebrationVariant('correction');
    expect(admitted.status).toBe('Your contribution has been added.');
    expect(correction.status).toBe('Your contribution has been added.');
    expect(admitted.body).toBe('Thanks for helping make food information clearer.');
  });

  it('does not reuse queued/transport-failure messaging as celebration status', () => {
    const admitted = copyForCelebrationVariant('admitted_visible');
    expect(admitted.status).not.toBe(CONTRIBUTION_NOTICE_SAVED);
  });
});
