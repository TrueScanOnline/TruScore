/**
 * W5-UI-12 history — superseded by W5-UI-13 minimal confirmation bar.
 * Retains behavioural wiring assertions; presentation expectations updated.
 */
import * as fs from 'fs';
import * as path from 'path';
import { AGREEMENT_ACCENT } from '../../../communityAgreement/agreementAgreeButtonStyle';

const barPath = path.join(
  __dirname,
  '../../../components/communityAgreement/CommunityAgreementBar.tsx'
);
const resultPath = path.join(__dirname, '../../../../app/result/[barcode].tsx');

describe('W5-UI-12 → W5-UI-13 Community Agreement presentation continuity', () => {
  const bar = fs.readFileSync(barPath, 'utf8');
  const result = fs.readFileSync(resultPath, 'utf8');

  it('1–4. agreement count remains beside thumbs-up from remoteCount; no external counter', () => {
    expect(bar).toContain('String(remoteCount)');
    expect(bar).toContain('styles.agreeCluster');
    expect(bar).toContain('AGREEMENT_ACCENT');
    expect(bar).not.toContain('People Agree');
    expect(bar).not.toMatch(/styles\.count\b/);
    expect(bar).not.toContain('countLabel');
    expect(bar).toMatch(/thumbs-up[\s\S]*remoteCount/);
  });

  it('5–7. successful Agree still updates from server body; selected state keeps count', () => {
    expect(bar).toContain('setRemoteCount(outcome.body.count)');
    expect(bar).toContain('setHasAgreed(true)');
    expect(bar).toContain('disabled={busy || hasAgreed}');
    expect(bar).toContain('You already agreed');
    expect(bar).toContain('people agree');
  });

  it('8–9. Correct information journey wiring unchanged (icon-only control)', () => {
    expect(bar).toContain('accessibilityLabel="Correct information"');
    expect(bar).toContain('thumbs-down-outline');
    expect(bar).toContain('onCorrect()');
    expect(bar).toContain('onRevalidateSurface() !== true');
    expect(bar).not.toContain('chevron-forward');
    expect(result).toContain('onCorrect={() => openAgreementChange(');
  });

  it('10. settlement / latch gates remain wired on Result', () => {
    expect(result).toContain('agreementSurfaceGate');
    expect(result).toContain('revalidateAgreementSurface');
    expect(result).toContain('surfaceEnabled={agreementSurfaceEnabled');
  });

  it('11. brand emerald accent remains #087B68 for light Agree ink', () => {
    expect(AGREEMENT_ACCENT).toBe('#087B68');
  });
});
