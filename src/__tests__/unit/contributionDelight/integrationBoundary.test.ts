import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../../../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

describe('W5-CD-01 integration boundary', () => {
  const delightDir = path.join(root, 'src/contributionDelight');

  it('celebration module stays presentation-only (no Share, EA submit, scoring)', () => {
    const files = fs.readdirSync(delightDir).filter((name) => /\.(ts|tsx)$/.test(name));
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      const src = fs.readFileSync(path.join(delightDir, name), 'utf8');
      expect(src).not.toMatch(/ShareModal|ShareService/);
      expect(src).not.toMatch(/transmitSessionToAuthority|submitGovernedEvidence/);
      expect(src).not.toMatch(/calculateTrustScore/);
      expect(src).not.toMatch(/from ['"].*evidenceAuthority\/device/);
    }
  });

  it('Result still preserves existing success notice and failed/queued messaging', () => {
    const result = read('app/result/[barcode].tsx');
    expect(result).toContain('showContributionNotice(CONTRIBUTION_NOTICE_ADDED)');
    expect(result).toContain('showContributionNotice(CONTRIBUTION_NOTICE_SAVED)');
    expect(result).toContain('ContributionCelebrationOverlay');
    expect(result).toContain('celebrationVariantForAdmission');
    expect(result).not.toMatch(/from ['"].*contributionDelight['"].*Share/);
  });

  it('does not celebrate onSharedEvidenceFailed or incomplete admissions', () => {
    const result = read('app/result/[barcode].tsx');
    const failedBlock = result.slice(result.indexOf('onSharedEvidenceFailed'));
    expect(failedBlock).toContain('CONTRIBUTION_NOTICE_SAVED');
    expect(failedBlock.slice(0, 400)).not.toContain('presentContributionCelebration');
    expect(result).toContain('if (complete)');
    expect(result).toContain('celebrationVariantForAdmission');
    expect(result).toContain('complete: true');
  });

  it('Community Agreement only notifies after ok:true path', () => {
    const bar = read('src/components/communityAgreement/CommunityAgreementBar.tsx');
    expect(bar).toContain('onAgreementRecorded');
    const idx = bar.indexOf('onAgreementRecorded?.(');
    expect(idx).toBeGreaterThan(0);
    const before = bar.slice(Math.max(0, idx - 500), idx);
    expect(before).toContain('setHasAgreed(true)');
    expect(before).toContain('playAgreeConfirmation');
  });

  it('ShareModal wiring on Result is unchanged in role', () => {
    const result = read('app/result/[barcode].tsx');
    expect(result).toContain("import ShareModal from '../../src/components/ShareModal'");
    expect(result).toContain('<ShareModal');
    const delight = read('src/contributionDelight/ContributionCelebrationOverlay.tsx');
    expect(delight).not.toContain('ShareModal');
    expect(delight).not.toContain('ShareService');
  });

  it('keeps Celebration Preview out of production navigation and deep links', () => {
    const layout = read('app/_layout.tsx');
    expect(layout).toMatch(/\{__DEV__\s*\?\s*\([\s\S]*ContributionCelebrationPreview/);
    expect(read('app/settings.tsx')).toMatch(/\{__DEV__\s*\?\s*\([\s\S]*ContributionCelebrationPreview/);
    expect(read('app/profile.tsx')).toMatch(/\{__DEV__\s*\?\s*\([\s\S]*ContributionCelebrationPreview/);
    const linking = read('src/utils/linking.ts');
    expect(linking).toContain('...(__DEV__');
    expect(linking).toContain("ContributionCelebrationPreview: 'contribution-celebration-preview'");
    expect(read('app/contribution-celebration-preview.tsx')).toContain('if (!__DEV__)');
  });
});
