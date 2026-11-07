/**
 * Emerald Community Agreement control. Display-only; not Confidence.
 * WP09-R1: entire surface requires settlement + Change eligibility.
 * W5-UI-11: compact question + Agree/Correct only (no Community-added card copy).
 * W5-UI-12: count inside Agree; Correct information gains a trailing chevron.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { resultEmeraldTone } from '../../theme/resultPresentation';
import {
  agreementControlsVisible,
  fetchCommunityAgreement,
  localAgreementEligibility,
  submitCommunityAgreement,
} from '../../communityAgreement/client';
import { agreementCountOrange } from '../../communityAgreement/agreementCountOrange';
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
};

export default function CommunityAgreementBar({
  group,
  product,
  snapshot,
  surfaceEnabled,
  onRevalidateSurface,
  onCorrect,
}: Props) {
  const { darkMode } = useTheme();
  const emerald = resultEmeraldTone(darkMode);
  const { fontScale } = useWindowDimensions();
  const compact = fontScale > 1.15;

  const local = localAgreementEligibility(group, product, snapshot);
  const [remoteCount, setRemoteCount] = useState<number | null>(null);
  const [remoteRevisionId, setRemoteRevisionId] = useState<string>('');
  const [remoteEligible, setRemoteEligible] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const barcode = product?.barcode;

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
  }, [barcode, busy, group, hasAgreed, local.eligible, local.revisionId, onRevalidateSurface]);

  if (!visible || remoteCount == null) return null;

  const inkOnAgree = hasAgreed ? emerald.card : emerald.action;
  const countColor = agreementCountOrange(darkMode, hasAgreed);
  const agreeA11y =
    hasAgreed
      ? `You already agreed. ${remoteCount} agree`
      : `Agree. ${remoteCount} agree`;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: emerald.chevronCircle,
          borderColor: emerald.line,
        },
      ]}
      accessibilityRole="summary"
    >
      <Text style={[styles.question, { color: emerald.ink }, compact && styles.questionCompact]}>
        Does this look correct?
      </Text>
      <View style={[styles.row, compact && styles.rowStack]}>
        <Pressable
          onPress={onAgree}
          disabled={busy || hasAgreed}
          accessibilityRole="button"
          accessibilityLabel={agreeA11y}
          accessibilityState={{ disabled: busy || hasAgreed, selected: hasAgreed }}
          style={[
            styles.btn,
            {
              borderColor: emerald.action,
              backgroundColor: hasAgreed ? emerald.action : 'transparent',
              minHeight: 44,
              minWidth: 44,
            },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={inkOnAgree} />
          ) : (
            <>
              <Ionicons
                name={hasAgreed ? 'thumbs-up' : 'thumbs-up-outline'}
                size={18}
                color={inkOnAgree}
              />
              <Text
                style={[styles.countInBtn, { color: countColor }, compact && styles.countInBtnCompact]}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                {String(remoteCount)}
              </Text>
              <Text style={[styles.btnText, { color: inkOnAgree }, compact && styles.btnTextCompact]}>
                Agree
              </Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={() => {
            if (onRevalidateSurface() !== true) return;
            onCorrect();
          }}
          accessibilityRole="button"
          accessibilityLabel="Correct information"
          style={[
            styles.btn,
            {
              borderColor: emerald.action,
              minHeight: 44,
              minWidth: 44,
            },
          ]}
        >
          <Ionicons name="thumbs-down-outline" size={18} color={emerald.action} />
          <Text style={[styles.btnText, { color: emerald.action }, compact && styles.btnTextCompact]}>
            Correct information
          </Text>
          <Ionicons name="chevron-forward" size={18} color={emerald.action} />
        </Pressable>
      </View>
      {error ? <Text style={[styles.error, { color: emerald.question }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  question: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 10,
  },
  questionCompact: {
    fontSize: 14,
    lineHeight: 19,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  rowStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnTextCompact: {
    fontSize: 13,
  },
  countInBtn: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    minWidth: 12,
    textAlign: 'center',
  },
  countInBtnCompact: {
    fontSize: 14,
  },
  error: {
    marginTop: 8,
    fontSize: 12,
  },
});
