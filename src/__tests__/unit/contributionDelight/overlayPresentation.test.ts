import fs from 'fs';
import path from 'path';

const overlay = fs.readFileSync(
  path.resolve(__dirname, '../../../contributionDelight/ContributionCelebrationOverlay.tsx'),
  'utf8'
);

describe('W5-CD-01 ContributionCelebrationOverlay presentation', () => {
  it('implements Concept A checkmark modal with confetti and community ripple', () => {
    expect(overlay).toContain('ConfettiBurst');
    expect(overlay).toContain('CommunityRipple');
    expect(overlay).toContain('checkmark');
    expect(overlay).toContain('copy.primaryAction');
  });

  it('uses a full-screen confetti layer outside the clipped modal card (V2)', () => {
    expect(overlay).toContain('styles.confettiLayer');
    expect(overlay).toMatch(/ConfettiBurst[\s\S]*styles\.card|confettiLayer[\s\S]*zIndex/);
    // Card keeps overflow hidden for modal chrome; confetti must not live only inside it.
    expect(overlay).toMatch(/overflow:\s*'hidden'/);
    expect(overlay).toContain('pointerEvents="none"');
    expect(overlay).toContain('FULL_DURATION_MS');
    expect(overlay).toMatch(/primary = gentle \? 18 : 78/);
    expect(overlay).toMatch(/secondary = gentle \? 6 : 28/);
  });

  it('applies the strong burst only to admitted_visible full success', () => {
    expect(overlay).toContain("variant === 'admitted_visible'");
    expect(overlay).toContain('fullConfetti');
    expect(overlay).toContain('gentle={!fullConfetti}');
  });

  it('respects reduced-motion with a static alternative and skips vibration', () => {
    expect(overlay).toContain('AccessibilityInfo.isReduceMotionEnabled');
    expect(overlay).toContain('forceReducedMotion');
    expect(overlay).toContain('if (reducedMotion)');
    expect(overlay).toContain("Platform.OS === 'android'");
  });

  it('auto-dismisses compact agreement acknowledgement without blocking navigation', () => {
    expect(overlay).toContain("variant === 'agreement_compact'");
    expect(overlay).toContain('setTimeout(() => onDismiss()');
  });

  it('centres the compact Community Agreement acknowledgement on screen', () => {
    expect(overlay).toContain('useSafeAreaInsets');
    expect(overlay).toMatch(/compactBackdrop:[\s\S]*justifyContent:\s*'center'/);
    expect(overlay).toMatch(/compactBackdrop:[\s\S]*alignItems:\s*'center'/);
    expect(overlay).not.toMatch(/compactBackdrop:[\s\S]*justifyContent:\s*'flex-end'/);
  });

  it('cleans up running animations when the overlay closes', () => {
    expect(overlay).toContain('anim.stop()');
    expect(overlay).toContain('intro.stop()');
  });

  it('does not invent fake points or community-impact statistics', () => {
    expect(overlay).not.toMatch(/points? earned|impact score|\+\d+\s*people/i);
  });
});
