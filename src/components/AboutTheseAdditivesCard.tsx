/**
 * Conditional Result card — “About these Additives”.
 * Renders only when renderedAdditiveIds.length ≥ 1. Neutral glyph; no RAG/risk framing.
 * Wave 3 UAT corrective: count N is visually primary with a one-shot 0→N reveal.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { getSurfaceCopy } from '../s25/loadAsset';
import { S25_ADDITIVE_COUNT_GLYPH } from '../s25/glyphs';

interface AboutTheseAdditivesCardProps {
  count: number;
  onPress: () => void;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => {
      if (mounted) setReduced(Boolean(v));
    });
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => {
      setReduced(Boolean(v));
    });
    return () => {
      mounted = false;
      // RN typings vary across versions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sub as any)?.remove?.();
    };
  }, []);
  return reduced;
}

function AdditiveCountReveal({ count }: { count: number }) {
  const { colors } = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const anim = useRef(new Animated.Value(reducedMotion ? count : 0)).current;
  const [display, setDisplay] = useState(reducedMotion ? count : 0);
  const announcedRef = useRef<number | null>(null);

  useEffect(() => {
    if (count < 1) return;
    if (reducedMotion) {
      setDisplay(count);
      anim.setValue(count);
      if (announcedRef.current !== count) {
        announcedRef.current = count;
        const label = count === 1 ? '1 additive identified' : `${count} additives identified`;
        AccessibilityInfo.announceForAccessibility?.(label);
      }
      return;
    }

    anim.setValue(0);
    setDisplay(0);
    const id = anim.addListener(({ value }) => {
      setDisplay(Math.round(value));
    });
    Animated.timing(anim, {
      toValue: count,
      duration: 750,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setDisplay(count);
        if (announcedRef.current !== count) {
          announcedRef.current = count;
          const label = count === 1 ? '1 additive identified' : `${count} additives identified`;
          AccessibilityInfo.announceForAccessibility?.(label);
        }
      }
    });
    return () => {
      anim.removeListener(id);
      anim.stopAnimation();
    };
  }, [count, reducedMotion, anim]);

  const unit = display === 1 ? 'additive identified' : 'additives identified';

  return (
    <View
      style={styles.countBlock}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${count} ${count === 1 ? 'additive' : 'additives'} identified`}
    >
      <Text style={[styles.countNumber, { color: colors.text }]}>{display}</Text>
      <Text style={[styles.countUnit, { color: colors.textSecondary }]}>{unit}</Text>
    </View>
  );
}

export default function AboutTheseAdditivesCard({ count, onPress }: AboutTheseAdditivesCardProps) {
  const { colors } = useTheme();
  if (count < 1) return null;

  const title = getSurfaceCopy('surface_title') || 'About these Additives';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.96 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${count} ${count === 1 ? 'additive' : 'additives'} identified`}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          <Ionicons name={S25_ADDITIVE_COUNT_GLYPH} size={28} color={colors.primary} />
          <View style={styles.textCol}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <AdditiveCountReveal count={count} />
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  textCol: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  countBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  countNumber: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 40,
    fontVariant: ['tabular-nums'],
  },
  countUnit: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
});
