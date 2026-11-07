/**
 * Emerald Community Agreement control. Display-only; not Confidence.
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
import { communityAgreementScopeHint } from '../../communityAgreement/presentation';
import type { CommunityAgreementGroup } from '../../communityAgreement/types';
import type { SharedEvidenceSnapshot } from '../../evidenceAuthority/types';
import type { Product } from '../../types/product';

type Props = {
  group: CommunityAgreementGroup;
  product: Product | null | undefined;
  snapshot: SharedEvidenceSnapshot | null | undefined;
  onCorrect: () => void;
  correctEnabled: boolean;
};

export default function CommunityAgreementBar({
  group,
  product,
  snapshot,
  onCorrect,
  correctEnabled,
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
    if (!barcode || !local.eligible) {
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
  }, [barcode, group, local.eligible, local.revisionId]);

  const visible = agreementControlsVisible(local, {
    authorityEnv: snapshot?.authorityEnv || 'uat',
    barcode: barcode || '',
    variantKey: '',
    cardGroup: group,
    revisionId: remoteRevisionId,
    count: remoteCount ?? 0,
    eligible: remoteEligible,
  });

  const onAgree = useCallback(async () => {
    if (!barcode || !local.eligible || busy || hasAgreed) return;
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
  }, [barcode, busy, group, hasAgreed, local.eligible, local.revisionId]);

  if (!visible || remoteCount == null) return null;

  const countLabel =
    remoteCount === 1 ? '1 agree' : `${remoteCount} agree`;
  const scope = communityAgreementScopeHint(group, product);

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
      <Text style={[styles.kicker, { color: emerald.muted }]}>Community agreements</Text>
      <Text style={[styles.question, { color: emerald.ink }, compact && styles.questionCompact]}>
        Does this community-added information look correct?
      </Text>
      <Text style={[styles.scope, { color: emerald.muted }]}>{scope}</Text>
      <View style={[styles.row, compact && styles.rowStack]}>
        <Pressable
          onPress={onAgree}
          disabled={busy || hasAgreed}
          accessibilityRole="button"
          accessibilityLabel={hasAgreed ? 'You already agreed' : 'Agree'}
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
            <ActivityIndicator color={hasAgreed ? emerald.card : emerald.action} />
          ) : (
            <>
              <Ionicons
                name={hasAgreed ? 'thumbs-up' : 'thumbs-up-outline'}
                size={18}
                color={hasAgreed ? emerald.card : emerald.action}
              />
              <Text
                style={[
                  styles.btnText,
                  { color: hasAgreed ? emerald.card : emerald.action },
                ]}
              >
                Agree
              </Text>
            </>
          )}
        </Pressable>
        <Text
          style={[styles.count, { color: emerald.ink }]}
          accessibilityLabel={`${countLabel}. Community agreements`}
        >
          {countLabel}
        </Text>
        <Pressable
          onPress={() => {
            if (!correctEnabled) return;
            onCorrect();
          }}
          disabled={!correctEnabled}
          accessibilityRole="button"
          accessibilityLabel="Correct information"
          accessibilityState={{ disabled: !correctEnabled }}
          style={[
            styles.btn,
            {
              borderColor: correctEnabled ? emerald.action : emerald.line,
              opacity: correctEnabled ? 1 : 0.45,
              minHeight: 44,
              minWidth: 44,
            },
          ]}
        >
          <Ionicons
            name="thumbs-down-outline"
            size={18}
            color={correctEnabled ? emerald.action : emerald.muted}
          />
          <Text
            style={[
              styles.btnText,
              { color: correctEnabled ? emerald.action : emerald.muted },
            ]}
          >
            Correct information
          </Text>
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
  kicker: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  question: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  questionCompact: {
    fontSize: 14,
    lineHeight: 19,
  },
  scope: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 10,
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
  count: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 64,
  },
  error: {
    marginTop: 8,
    fontSize: 12,
  },
});
