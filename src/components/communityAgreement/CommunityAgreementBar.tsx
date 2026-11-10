/**
 * Emerald Community Agreement control. Display-only; not Confidence.
 * WP09-R1: entire surface requires settlement + Change eligibility.
 * W5-UI-11: no Community-added card copy.
 * W5-UI-13: minimal integrated confirmation bar (question + thumbs ± count).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { resultEmeraldTone, resultPresentation } from '../../theme/resultPresentation';
import {
  agreementControlsVisible,
  fetchCommunityAgreement,
  localAgreementEligibility,
  submitCommunityAgreement,
} from '../../communityAgreement/client';
import { AGREEMENT_ACCENT } from '../../communityAgreement/agreementAgreeButtonStyle';
import type { CommunityAgreementGroup } from '../../communityAgreement/types';
import type { SharedEvidenceSnapshot } from '../../evidenceAuthority/types';
import type { Product } from '../../types/product';

type Props = {
  group: CommunityAgreementGroup;
  product: Product | null | undefined;
  snapshot: SharedEvidenceSnapshot | null | undefined;
  /** Settlement + Change gate for the whole component (Agree and Correct). */
  surfaceEnabled: boolean;
  /** Re-check the gate immediately before Agree / Correct. */
  onRevalidateSurface: () => boolean;
  onCorrect: () => void;
  /**
   * Presentation-only hook after a successful server ack.
   * W5-CD-01: parent may show a compact acknowledgement. Never decides agreement truth.
   */
  onAgreementRecorded?: (detail: { barcode: string; group: CommunityAgreementGroup; revisionId: string }) => void;
};

function agreementCountPhrase(count: number): string {
  return count === 1 ? '1 person agrees' : `${count} people agree`;
}

function agreeAccessibilityLabel(hasAgreed: boolean, count: number): string {
  const phrase = agreementCountPhrase(count);
  return hasAgreed ? `You already agreed. ${phrase}` : `Agree with this information. ${phrase}`;
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

export default function CommunityAgreementBar({
  group,
  product,
  snapshot,
  surfaceEnabled,
  onRevalidateSurface,
  onCorrect,
  onAgreementRecorded,
}: Props) {
  const { darkMode } = useTheme();
  const emerald = resultEmeraldTone(darkMode);
  const { fontScale } = useWindowDimensions();
  const stackControls = fontScale > 1.15;
  const reducedMotion = usePrefersReducedMotion();
  const agreeScale = useRef(new Animated.Value(1)).current;

  const local = localAgreementEligibility(group, product, snapshot);
  const [remoteCount, setRemoteCount] = useState<number | null>(null);
  const [remoteRevisionId, setRemoteRevisionId] = useState<string>('');
  const [remoteEligible, setRemoteEligible] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const barcode = product?.barcode;
  const agreeAccent = darkMode ? emerald.action : AGREEMENT_ACCENT;

  useEffect(() => {
    if (!barcode || !local.eligible || surfaceEnabled !== true) {
      setRemoteEligible(false);
      setRemoteCount(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const remote = await fetchCommunityAgreement({
        barcode,
        cardGroup: group,
        withCredential: true,
      });
      if (cancelled) return;
      if (!remote) {
        setRemoteEligible(false);
        setRemoteCount(null);
        return;
      }
      setRemoteRevisionId(remote.revisionId);
      setRemoteEligible(remote.eligible === true);
      setRemoteCount(typeof remote.count === 'number' ? remote.count : 0);
      setHasAgreed(remote.hasAgreed === true);
    })();
    return () => {
      cancelled = true;
    };
  }, [barcode, group, local.eligible, local.revisionId, surfaceEnabled]);

  const playAgreeConfirmation = useCallback(() => {
    if (reducedMotion) {
      agreeScale.setValue(1);
      return;
    }
    agreeScale.setValue(1);
    Animated.sequence([
      Animated.timing(agreeScale, {
        toValue: 1.12,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(agreeScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [agreeScale, reducedMotion]);

  const visible = agreementControlsVisible(
    local,
    {
      authorityEnv: snapshot?.authorityEnv || 'uat',
      barcode: barcode || '',
      variantKey: '',
      cardGroup: group,
      revisionId: remoteRevisionId,
      count: remoteCount ?? 0,
      eligible: remoteEligible,
    },
    surfaceEnabled === true
  );

  const onAgree = useCallback(async () => {
    if (!barcode || !local.eligible || busy || hasAgreed) return;
    if (onRevalidateSurface() !== true) {
      setError('This product is still updating. Try again when the score has settled.');
      setRemoteEligible(false);
      return;
    }
    setBusy(true);
    setError(null);
    const outcome = await submitCommunityAgreement({
      barcode,
      cardGroup: group,
      expectedRevisionId: local.revisionId,
    });
    setBusy(false);
    if (!outcome.ok) {
      if (outcome.reason === 'stale_revision') {
        setError('Information was updated. Refresh and try again.');
        setRemoteEligible(false);
        return;
      }
      if (outcome.reason === 'self_agreement_not_allowed') {
        setError('You contributed this information, so you cannot agree with it.');
        return;
      }
      if (outcome.reason === 'offline_or_network' || outcome.reason === 'offline_or_credential') {
        setError('Could not send agreement. Check your connection.');
        return;
      }
      setError('Could not record agreement.');
      return;
    }
    setRemoteCount(outcome.body.count);
    setRemoteRevisionId(outcome.body.revisionId);
    setHasAgreed(true);
    playAgreeConfirmation();
    onAgreementRecorded?.({
      barcode,
      group,
      revisionId: outcome.body.revisionId || local.revisionId,
    });
  }, [
    barcode,
    busy,
    group,
    hasAgreed,
    local.eligible,
    local.revisionId,
    onAgreementRecorded,
    onRevalidateSurface,
    playAgreeConfirmation,
  ]);

  if (!visible || remoteCount == null) return null;

  const agreeA11y = agreeAccessibilityLabel(hasAgreed, remoteCount);

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={[styles.divider, { backgroundColor: emerald.line }]} />
      <View style={[styles.row, stackControls && styles.rowStack]}>
        <Text
          style={[styles.question, { color: emerald.ink }, stackControls && styles.questionCompact]}
          numberOfLines={stackControls ? 3 : 2}
        >
          Does this look right?
        </Text>
        <View style={styles.controls}>
          <Pressable
            onPress={onAgree}
            disabled={busy || hasAgreed}
            accessibilityRole="button"
            accessibilityLabel={agreeA11y}
            accessibilityState={{ disabled: busy || hasAgreed, selected: hasAgreed }}
            hitSlop={4}
            style={styles.agreeHit}
          >
            {busy ? (
              <ActivityIndicator color={agreeAccent} />
            ) : (
              <Animated.View
                style={[styles.agreeCluster, { transform: [{ scale: agreeScale }] }]}
              >
                <Ionicons
                  name={hasAgreed ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={20}
                  color={agreeAccent}
                />
                <Text
                  style={[
                    styles.countText,
                    { color: agreeAccent },
                    stackControls && styles.countTextCompact,
                  ]}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  {String(remoteCount)}
                </Text>
              </Animated.View>
            )}
          </Pressable>
          <Pressable
            onPress={() => {
              if (onRevalidateSurface() !== true) return;
              onCorrect();
            }}
            accessibilityRole="button"
            accessibilityLabel="Correct information"
            accessibilityHint="Opens the existing information correction process."
            hitSlop={4}
            style={[
              styles.correctHit,
              {
                borderColor: emerald.line,
                backgroundColor: darkMode
                  ? resultPresentation.stoneSoft.dark
                  : resultPresentation.stoneSoft.light,
              },
            ]}
          >
            <Ionicons name="thumbs-down-outline" size={20} color={emerald.question} />
          </Pressable>
        </View>
      </View>
      {error ? <Text style={[styles.error, { color: emerald.question }]}>{error}</Text> : null}
    </View>
  );
}

const TAP = resultPresentation.tap.min;

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    paddingTop: 0,
    paddingBottom: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  question: {
    flexShrink: 1,
    flexGrow: 1,
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 18,
  },
  questionCompact: {
    fontSize: 13,
    lineHeight: 17,
    marginBottom: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  agreeHit: {
    minWidth: TAP,
    minHeight: TAP,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countText: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    minWidth: 10,
    textAlign: 'left',
  },
  countTextCompact: {
    fontSize: 14,
  },
  correctHit: {
    minWidth: TAP,
    minHeight: TAP,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginTop: 8,
    fontSize: 12,
  },
});
