/**
 * W5-UI-13 — Minimal Community Confirmation Bar (presentation only).
 */
import * as fs from 'fs';
import * as path from 'path';
import { AGREEMENT_ACCENT } from '../../../communityAgreement/agreementAgreeButtonStyle';

const barPath = path.join(
  __dirname,
  '../../../components/communityAgreement/CommunityAgreementBar.tsx'
);
const resultPath = path.join(__dirname, '../../../../app/result/[barcode].tsx');

describe('W5-UI-13 minimal Community Confirmation Bar', () => {
  const bar = fs.readFileSync(barPath, 'utf8');
  const result = fs.readFileSync(resultPath, 'utf8');

  it('1. question displays Does this look right?', () => {
    expect(bar).toContain('Does this look right?');
    expect(bar).not.toContain('Does this look correct?');
  });

  it('2–3. People Agree / Correct wording and bordered agreement box are gone', () => {
    expect(bar).not.toContain('People Agree');
    expect(bar).not.toMatch(/>\s*Agree\s*</);
    expect(bar).not.toContain('Correct information</Text>');
    expect(bar).not.toContain('chevron-forward');
    // Standalone agreement box removed; only the hairline divider / subtle correct outline remain.
    expect(bar).not.toMatch(/wrap:\s*\{[^}]*borderWidth/);
    expect(bar).not.toMatch(/wrap:\s*\{[^}]*borderRadius:\s*12/);
    expect(bar).toContain('styles.divider');
    expect(bar).toContain('StyleSheet.hairlineWidth');
  });

  it('4–5. thumbs-up + server count cluster; thumbs-down icon only', () => {
    expect(bar).toContain("thumbs-up-outline");
    expect(bar).toContain("thumbs-up'");
    expect(bar).toContain('String(remoteCount)');
    expect(bar).toContain('styles.agreeCluster');
    expect(bar).toContain('thumbs-down-outline');
    expect(bar).not.toMatch(/thumbs-down[\s\S]*Correct information/);
  });

  it('6–7. accessibility labels and 44pt touch targets', () => {
    expect(bar).toContain('Agree with this information.');
    expect(bar).toContain('You already agreed.');
    expect(bar).toContain('1 person agrees');
    expect(bar).toContain('people agree');
    expect(bar).toContain('accessibilityLabel="Correct information"');
    expect(bar).toContain('Opens the existing information correction process.');
    expect(bar).toContain('resultPresentation.tap.min');
    expect(bar).toContain('minWidth: TAP');
    expect(bar).toContain('minHeight: TAP');
  });

  it('8. shared bar remains mounted for all four WP-09 groups on Result', () => {
    expect(result).toContain('group="nutrition"');
    expect(result).toContain('group="ingredients"');
    expect(result).toContain('group="origins"');
    expect(result).toContain('group="packet_information"');
    expect(result.match(/CommunityAgreementBar/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
    // Ingredients confirmation is slotted before Processing Level, not under NOVA.
    const mountAt = result.indexOf('<ResultIngredientsSection');
    const slotPropAt = result.indexOf('confirmationSlot={', mountAt);
    expect(slotPropAt).toBeGreaterThan(mountAt);
    expect(result.indexOf('group="ingredients"', slotPropAt)).toBeGreaterThan(slotPropAt);
    const sectionFnAt = result.indexOf('function ResultIngredientsSection');
    expect(result.indexOf('{confirmationSlot}', sectionFnAt)).toBeLessThan(
      result.indexOf('styles.novaContainer', sectionFnAt)
    );
  });

  it('9. already-agreed selected state and server-confirmed count path preserved', () => {
    expect(bar).toContain('setHasAgreed(true)');
    expect(bar).toContain('setRemoteCount(outcome.body.count)');
    expect(bar).toContain('disabled={busy || hasAgreed}');
    expect(bar).toContain('selected: hasAgreed');
    expect(bar).toContain("name={hasAgreed ? 'thumbs-up' : 'thumbs-up-outline'}");
  });

  it('10. WP-09 behaviour wiring and settlement gates unchanged', () => {
    expect(bar).toContain('agreementControlsVisible');
    expect(bar).toContain('fetchCommunityAgreement');
    expect(bar).toContain('submitCommunityAgreement');
    expect(bar).toContain('onRevalidateSurface() !== true');
    expect(bar).toContain('onCorrect()');
    expect(bar).toContain('stale_revision');
    expect(bar).toContain('self_agreement_not_allowed');
    expect(result).toContain('agreementSurfaceGate');
    expect(result).toContain('surfaceEnabled={agreementSurfaceEnabled');
  });

  it('11. brand emerald accent token retained; no People Agree fill/ink tokens', () => {
    expect(AGREEMENT_ACCENT).toBe('#087B68');
    expect(bar).toContain('AGREEMENT_ACCENT');
    expect(bar).not.toContain('AGREEMENT_AGREE_BUTTON_FILL');
    expect(bar).not.toContain('AGREEMENT_AGREE_BUTTON_INK');
  });

  it('12. reduced-motion aware confirmation animation uses existing Animated API', () => {
    expect(bar).toContain('AccessibilityInfo.isReduceMotionEnabled');
    expect(bar).toContain('Animated.sequence');
    expect(bar).toContain('playAgreeConfirmation');
  });
});
