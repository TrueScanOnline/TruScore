/**
 * W5-UI-12 — Agree count inside button; Correct information chevron.
 */
import * as fs from 'fs';
import * as path from 'path';
import { agreementCountOrange } from '../../../communityAgreement/agreementCountOrange';

const barPath = path.join(
  __dirname,
  '../../../components/communityAgreement/CommunityAgreementBar.tsx'
);
const resultPath = path.join(__dirname, '../../../../app/result/[barcode].tsx');

describe('W5-UI-12 Community Agreement button refinements', () => {
  const bar = fs.readFileSync(barPath, 'utf8');
  const result = fs.readFileSync(resultPath, 'utf8');

  it('1–4. agreement count renders inside Agree from remoteCount; no external counter', () => {
    expect(bar).toContain('String(remoteCount)');
    expect(bar).toContain('styles.countInBtn');
    expect(bar).toContain('agreementCountOrange');
    // No standalone count Text outside the Agree Pressable.
    expect(bar).not.toMatch(/styles\.count\b/);
    expect(bar).not.toContain('countLabel');
    expect(bar).toMatch(/thumbs-up[\s\S]*remoteCount[\s\S]*Agree/);
  });

  it('5–7. successful Agree still updates from server body; selected state keeps count', () => {
    expect(bar).toContain('setRemoteCount(outcome.body.count)');
    expect(bar).toContain('setHasAgreed(true)');
    expect(bar).toContain('disabled={busy || hasAgreed}');
    expect(bar).toContain('You already agreed');
    expect(bar).toContain('${remoteCount} agree');
  });

  it('8–9. Correct information shows trailing chevron and unchanged journey wiring', () => {
    expect(bar).toContain('Correct information');
    expect(bar).toContain('chevron-forward');
    expect(bar).toContain('thumbs-down-outline');
    expect(bar).toContain('onCorrect()');
    expect(bar).toContain('onRevalidateSurface() !== true');
    expect(result).toContain('onCorrect={() => openAgreementChange(');
  });

  it('10. settlement / latch gates remain wired on Result', () => {
    expect(result).toContain('agreementSurfaceGate');
    expect(result).toContain('revalidateAgreementSurface');
    expect(result).toContain('surfaceEnabled={agreementSurfaceEnabled');
  });

  it('11. count orange remains readable across modes and selected fill', () => {
    expect(agreementCountOrange(false, false)).toMatch(/^#/);
    expect(agreementCountOrange(true, false)).toMatch(/^#/);
    expect(agreementCountOrange(false, true)).toMatch(/^#/);
    expect(agreementCountOrange(true, true)).toMatch(/^#/);
    expect(agreementCountOrange(false, false)).not.toBe(agreementCountOrange(false, true));
    expect(agreementCountOrange(true, false)).not.toBe(agreementCountOrange(true, true));
  });
});
