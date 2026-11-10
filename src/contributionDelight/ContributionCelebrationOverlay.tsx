/**
 * W5-CD-01 Concept A — Rveel Celebration (+ Concept B community ripple).
 * Presentation only. Does not submit, score, publish, or share.
 *
 * V2: fuller radial confetti (full success only). Modal layout/copy unchanged.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resultEmeraldTone, resultPresentation } from '../theme/resultPresentation';
import { useTheme } from '../theme';
import { copyForCelebrationVariant } from './copy';
import type { ContributionCelebrationVariant } from './types';

const ACCENT_GOLD = '#D4A84B';
const ACCENT_CORAL = '#E07A5F';
const ACCENT_LAVENDER = '#9B8EC4';
const ACCENT_CYAN = '#3EC6C9';
const CONFETTI_COLORS = [
  '#10957E',
  '#087B68',
  '#27B899',
  ACCENT_GOLD,
  ACCENT_CORAL,
  ACCENT_LAVENDER,
  ACCENT_CYAN,
  '#C9E7DF',
];

/** Full celebration ~3.5–4s visible life. */
const FULL_DURATION_MS = 3800;
const GENTLE_DURATION_MS = 1600;
const SECONDARY_WAVE_MS = 420;

type Props = {
  visible: boolean;
  variant: ContributionCelebrationVariant | null;
  onDismiss: () => void;
  /** When true, skip confetti / ripple / haptic (also auto-detected). */
  forceReducedMotion?: boolean;
};

function usePrefersReducedMotion(force?: boolean): boolean {
  const [reduced, setReduced] = useState(Boolean(force));
  useEffect(() => {
    if (force) {
      setReduced(true);
      return;
    }
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => {
      if (mounted) setReduced(Boolean(v));
    });
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => {
      setReduced(Boolean(v));
    });
    return () => {
      mounted = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sub as any)?.remove?.();
    };
  }, [force]);
  return reduced;
}

type ParticleShape = 'strip' | 'rect' | 'dot';

type Particle = {
  key: string;
  color: string;
  shape: ParticleShape;
  /** Initial radial angle (radians). */
  angle: number;
  burstPx: number;
  fallPx: number;
  driftPx: number;
  delay: number;
  size: number;
  height: number;
  borderRadius: number;
  spinDeg: number;
  wave: 1 | 2;
};

function hashUnit(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function buildParticles(gentle: boolean): Particle[] {
  // Full: ~100; correction: lighter secondary treatment.
  const primary = gentle ? 18 : 78;
  const secondary = gentle ? 6 : 28;
  const total = primary + secondary;
  const shapes: ParticleShape[] = ['strip', 'rect', 'dot'];

  return Array.from({ length: total }, (_, i) => {
    const wave: 1 | 2 = i < primary ? 1 : 2;
    const u = hashUnit(i + 1);
    const u2 = hashUnit(i + 17);
    const u3 = hashUnit(i + 41);
    const shape = shapes[i % 3];
    const angle = (Math.PI * 2 * i) / total + u * 0.55 - 0.27;
    const sizeBase = gentle ? 5 : 7;
    const size = sizeBase + Math.floor(u2 * (gentle ? 4 : 8));
    let height = size;
    let borderRadius = 2;
    if (shape === 'strip') {
      height = size * (2.4 + u3 * 1.8);
      borderRadius = 1.5;
    } else if (shape === 'dot') {
      height = size;
      borderRadius = size / 2;
    } else {
      height = size * (1.1 + u3 * 0.6);
      borderRadius = 2;
    }

    const burstPx = gentle
      ? 70 + u * 90
      : wave === 1
        ? 150 + u * 280
        : 110 + u * 200;
    const fallPx = gentle ? 80 + u2 * 70 : 200 + u2 * 280;
    const driftPx = (u3 - 0.5) * (gentle ? 40 : 110);

    return {
      key: `p${i}`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      shape,
      angle,
      burstPx,
      fallPx,
      driftPx,
      delay: wave === 1 ? Math.floor(u * 90) : SECONDARY_WAVE_MS + Math.floor(u * 120),
      size,
      height,
      borderRadius,
      spinDeg: (u2 > 0.5 ? 1 : -1) * (140 + Math.floor(u3 * 420)),
      wave,
    };
  });
}

/**
 * Full-screen confetti layer (sibling of the modal card) so particles are not
 * clipped by the card's overflow:hidden. pointerEvents none — never steals taps.
 */
function ConfettiBurst({
  active,
  reducedMotion,
  gentle,
}: {
  active: boolean;
  reducedMotion: boolean;
  gentle: boolean;
}) {
  const particles = useMemo(() => buildParticles(gentle), [gentle]);
  const progresses = useMemo(
    () => particles.map(() => new Animated.Value(0)),
    [particles]
  );
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    animRef.current?.stop?.();
    animRef.current = null;

    if (!active || reducedMotion) {
      progresses.forEach((v) => v.setValue(0));
      return;
    }

    progresses.forEach((v) => v.setValue(0));
    const duration = gentle ? GENTLE_DURATION_MS : FULL_DURATION_MS;

    const anim = Animated.parallel(
      progresses.map((v, i) =>
        Animated.timing(v, {
          toValue: 1,
          duration,
          delay: particles[i]?.delay ?? 0,
          // Burst then ease into a slower fall/fade.
          easing: Easing.bezier(0.16, 0.84, 0.28, 1),
          useNativeDriver: true,
        })
      )
    );
    animRef.current = anim;
    anim.start(({ finished }) => {
      if (finished) {
        // Hold at faded-out end state until overlay closes (cleanup below).
      }
    });

    return () => {
      anim.stop();
      animRef.current = null;
      progresses.forEach((v) => v.setValue(0));
    };
  }, [active, gentle, particles, progresses, reducedMotion]);

  if (reducedMotion || !active) return null;

  const { width: screenW, height: screenH } = Dimensions.get('window');
  // Origin near the checkmark (centred modal, upper third of the card).
  // Use transform-only animation (Android native-driver is unreliable with left/top + transform).
  const originY = screenH * 0.38;

  return (
    <View pointerEvents="none" style={styles.confettiLayer} accessibilityElementsHidden>
      <View style={[styles.confettiOrigin, { left: screenW / 2, top: originY }]} collapsable={false}>
        {particles.map((p, i) => {
          const t = progresses[i];
          const cos = Math.cos(p.angle);
          const sin = Math.sin(p.angle);
          // 0→0.22: radial explosion; 0.22→1: drift + gravity fall; opacity fades late.
          const translateX = t.interpolate({
            inputRange: [0, 0.22, 0.55, 1],
            outputRange: [
              0,
              cos * p.burstPx,
              cos * p.burstPx * 0.92 + p.driftPx * 0.55,
              cos * p.burstPx * 0.75 + p.driftPx,
            ],
          });
          const translateY = t.interpolate({
            inputRange: [0, 0.22, 0.55, 1],
            outputRange: [
              0,
              sin * p.burstPx * 0.85 - Math.abs(cos) * 18,
              sin * p.burstPx * 0.55 + p.fallPx * 0.45,
              sin * p.burstPx * 0.2 + p.fallPx,
            ],
          });
          const opacity = t.interpolate({
            inputRange: [0, 0.05, 0.45, 0.78, 1],
            outputRange: [0, 1, 1, 0.65, 0],
          });
          const rotate = t.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', `${p.spinDeg}deg`],
          });
          const scale = t.interpolate({
            inputRange: [0, 0.12, 1],
            outputRange: [0.35, 1.08, 0.92],
          });

          return (
            <Animated.View
              key={p.key}
              style={[
                styles.confettiBit,
                {
                  marginLeft: -p.size / 2,
                  marginTop: -p.height / 2,
                  backgroundColor: p.color,
                  width: p.size,
                  height: p.height,
                  borderRadius: p.borderRadius,
                  opacity,
                  transform: [{ translateX }, { translateY }, { rotate }, { scale }],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

function CommunityRipple({
  active,
  reducedMotion,
  color,
}: {
  active: boolean;
  reducedMotion: boolean;
  color: string;
}) {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    animRef.current?.stop?.();
    if (!active || reducedMotion) {
      a.setValue(0);
      b.setValue(0);
      return;
    }
    a.setValue(0);
    b.setValue(0);
    const anim = Animated.stagger(160, [
      Animated.timing(a, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(b, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    animRef.current = anim;
    anim.start();
    return () => {
      anim.stop();
      a.setValue(0);
      b.setValue(0);
    };
  }, [a, active, b, reducedMotion]);

  if (reducedMotion || !active) return null;

  const ring = (value: Animated.Value) => ({
    opacity: value.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.35, 0.22, 0] }),
    transform: [
      {
        scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.55, 2.1] }),
      },
    ],
  });

  return (
    <View pointerEvents="none" style={styles.rippleLayer}>
      <Animated.View style={[styles.rippleRing, { borderColor: color }, ring(a)]} />
      <Animated.View style={[styles.rippleRing, { borderColor: color }, ring(b)]} />
    </View>
  );
}

export default function ContributionCelebrationOverlay({
  visible,
  variant,
  onDismiss,
  forceReducedMotion,
}: Props) {
  const { darkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const emerald = resultEmeraldTone(darkMode);
  const reducedMotion = usePrefersReducedMotion(forceReducedMotion);
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const checkScale = useRef(new Animated.Value(0.6)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardLift = useRef(new Animated.Value(12)).current;
  const introAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const copy = variant ? copyForCelebrationVariant(variant) : null;
  const compact = variant === 'agreement_compact';
  /** Strong radial confetti only for full admitted-visible success. */
  const fullConfetti = variant === 'admitted_visible';

  useEffect(() => {
    introAnimRef.current?.stop?.();
    introAnimRef.current = null;

    if (!visible || !variant) {
      setSecondaryOpen(false);
      checkScale.setValue(0.6);
      cardOpacity.setValue(0);
      cardLift.setValue(12);
      return;
    }

    if (!reducedMotion && Platform.OS === 'android') {
      try {
        Vibration.vibrate(fullConfetti ? 18 : 12);
      } catch {
        /* optional acknowledgement */
      }
    }

    if (reducedMotion) {
      checkScale.setValue(1);
      cardOpacity.setValue(1);
      cardLift.setValue(0);
      return;
    }

    checkScale.setValue(0.45);
    cardOpacity.setValue(0);
    cardLift.setValue(compact ? 8 : 14);
    const intro = Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(cardLift, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(checkScale, {
          toValue: fullConfetti ? 1.14 : 1.08,
          duration: fullConfetti ? 360 : 320,
          easing: Easing.out(Easing.back(fullConfetti ? 1.7 : 1.4)),
          useNativeDriver: true,
        }),
        Animated.timing(checkScale, {
          toValue: 1,
          duration: 170,
          useNativeDriver: true,
        }),
      ]),
    ]);
    introAnimRef.current = intro;
    intro.start();

    return () => {
      intro.stop();
      introAnimRef.current = null;
    };
  }, [
    cardLift,
    cardOpacity,
    checkScale,
    compact,
    fullConfetti,
    reducedMotion,
    variant,
    visible,
  ]);

  useEffect(() => {
    if (!visible || !compact) return;
    const timer = setTimeout(() => onDismiss(), reducedMotion ? 1600 : 1400);
    return () => clearTimeout(timer);
  }, [compact, onDismiss, reducedMotion, visible]);

  if (!visible || !variant || !copy) return null;

  if (compact) {
    return (
      <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
        <Pressable
          style={[
            styles.compactBackdrop,
            {
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss acknowledgement"
        >
          <Animated.View
            style={[
              styles.compactCard,
              {
                backgroundColor: darkMode ? emerald.card : '#F7FCFA',
                borderColor: emerald.line,
                opacity: cardOpacity,
                transform: [{ translateY: cardLift }],
              },
            ]}
          >
            <View style={[styles.compactCheck, { backgroundColor: emerald.action }]}>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.compactTitle, { color: emerald.ink }]}>{copy.title}</Text>
          </Animated.View>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <CommunityRipple active={visible} reducedMotion={reducedMotion} color={emerald.action} />

        <Animated.View
          style={[
            styles.card,
            {
              // Concept A: soft-mint / teal-and-white modal (not a flat pure-white slab).
              backgroundColor: darkMode ? emerald.card : '#F7FCFA',
              borderColor: darkMode ? emerald.line : '#D5EBE4',
              opacity: cardOpacity,
              transform: [{ translateY: cardLift }],
            },
          ]}
          accessibilityViewIsModal
          accessibilityRole="summary"
          accessibilityLabel={`${copy.title}. ${copy.body}`}
        >
          <View style={styles.checkWrap}>
            <CommunityRipple active={visible} reducedMotion={reducedMotion} color="#27B899" />
            <Animated.View
              style={[
                styles.checkCircle,
                {
                  backgroundColor: emerald.action,
                  transform: [{ scale: checkScale }],
                  shadowColor: '#087565',
                },
              ]}
            >
              <Ionicons name="checkmark" size={42} color="#FFFFFF" />
            </Animated.View>
          </View>

          <Text style={[styles.title, { color: emerald.ink }]}>{copy.title}</Text>
          <Text style={[styles.body, { color: emerald.muted }]}>{copy.body}</Text>

          {copy.status ? (
            <View style={[styles.statusPill, { backgroundColor: darkMode ? '#1E4A40' : '#D7F6EC' }]}>
              <Ionicons name="leaf-outline" size={14} color={emerald.action} />
              <Text style={[styles.statusText, { color: emerald.action }]}>{copy.status}</Text>
            </View>
          ) : null}

          {copy.qualification ? (
            <Text style={[styles.qualification, { color: emerald.muted }]}>{copy.qualification}</Text>
          ) : null}

          {secondaryOpen && copy.secondaryDetail ? (
            <Text style={[styles.secondaryDetail, { color: emerald.muted, borderColor: emerald.line }]}>
              {copy.secondaryDetail}
            </Text>
          ) : null}

          <Pressable
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel={copy.primaryAction}
            style={[styles.primaryButton, { backgroundColor: emerald.action }]}
          >
            <Text style={styles.primaryLabel}>{copy.primaryAction}</Text>
          </Pressable>

          {copy.secondaryAction ? (
            <Pressable
              onPress={() => setSecondaryOpen((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={copy.secondaryAction}
              hitSlop={8}
              style={styles.secondaryButton}
            >
              <Text style={[styles.secondaryLabel, { color: emerald.action }]}>{copy.secondaryAction}</Text>
            </Pressable>
          ) : null}
        </Animated.View>

        {/*
          Confetti ABOVE the card (pointerEvents none) so the radial burst is visible
          around the checkmark / upper modal — not clipped by overflow:hidden and not
          trapped behind the opaque card fill. Taps still reach Keep exploring.
        */}
        <ConfettiBurst active={visible} reducedMotion={reducedMotion} gentle={!fullConfetti} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 28, 54, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    overflow: 'hidden',
    zIndex: 2,
    shadowColor: 'rgba(8,42,32,0.45)',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  checkWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  checkCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginTop: 4,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  statusPill: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  qualification: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  secondaryDetail: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'left',
    alignSelf: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  primaryButton: {
    marginTop: 22,
    alignSelf: 'stretch',
    minHeight: resultPresentation.tap.min,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    elevation: 24,
  },
  confettiOrigin: {
    position: 'absolute',
    width: 1,
    height: 1,
  },
  confettiBit: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  rippleLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rippleRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  compactBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 28, 54, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: 'rgba(8,42,32,0.35)',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  compactCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
});
