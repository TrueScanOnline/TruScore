/**
 * Founder-locked Body additive L3 — in-app "About these additives".
 * Authority: L3 Content Closure Addendum 20260905 v1.1 (Body — Additives).
 * Shows every governed Body additive that fired for this product, not only the promoted story.
 */

import React, { useMemo } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import InfoModal from './InfoModal';
import {
  ABOUT_THESE_ADDITIVES_INTRO,
  ABOUT_THESE_ADDITIVES_TITLE,
  COLOUR_ADDITIVE_IDS,
  COLOUR_CLUSTER_EVIDENCE_STORY,
  COLOUR_CLUSTER_SOURCES,
  COLOUR_TILES,
  E171_SECTION,
  E250_SECTION,
  E951_SECTION,
  type AdditiveSourceLink,
} from '../config/bodyAdditivesL3Content';
import type { BodyV12AdjustmentId } from '../lib/truscoreEngine/pillars/bodyPillarV12Registry';
import { useTheme } from '../theme';

interface AboutTheseAdditivesModalProps {
  visible: boolean;
  onClose: () => void;
  /** All governed Body additive adjustment IDs that fired for this scan. */
  detectedAdditiveIds: readonly string[];
}

function SectionHeading({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.sectionHeading, { color: colors.text }]}>{children}</Text>;
}

function BodyText({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{children}</Text>;
}

function SourceLinks({ sources }: { sources: readonly AdditiveSourceLink[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sourceList}>
      {sources.map((source) => (
        <TouchableOpacity
          key={source.url}
          style={styles.sourceRow}
          onPress={() => Linking.openURL(source.url)}
          accessibilityRole="link"
        >
          <Ionicons name="open-outline" size={14} color={colors.primary} />
          <Text style={[styles.sourceLinkText, { color: colors.primary }]}>{source.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function MicroFactRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.microFactRow}>
      <Text style={[styles.microFactLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.microFactValue, { color: colors.textSecondary }]}>{value}</Text>
    </View>
  );
}

export default function AboutTheseAdditivesModal({
  visible,
  onClose,
  detectedAdditiveIds,
}: AboutTheseAdditivesModalProps) {
  const { colors } = useTheme();

  const activeIds = useMemo(() => {
    const set = new Set(detectedAdditiveIds);
    return {
      colour: COLOUR_ADDITIVE_IDS.filter((id) => set.has(id)),
      e171: set.has('body-v12-additive-e171'),
      e250: set.has('body-v12-additive-e250'),
      e951: set.has('body-v12-additive-e951'),
    };
  }, [detectedAdditiveIds]);

  const colourTiles = COLOUR_TILES.filter((tile) =>
    activeIds.colour.includes(tile.id as BodyV12AdjustmentId)
  );

  const hasAny =
    colourTiles.length > 0 || activeIds.e171 || activeIds.e250 || activeIds.e951;

  if (!hasAny) return null;

  return (
    <InfoModal
      visible={visible}
      onClose={onClose}
      title={ABOUT_THESE_ADDITIVES_TITLE}
      icon="flask-outline"
      iconColor={colors.primary}
    >
      <BodyText>{ABOUT_THESE_ADDITIVES_INTRO}</BodyText>

      {colourTiles.length > 0 && (
        <View style={styles.section}>
          <SectionHeading>Colour additives</SectionHeading>
          <BodyText>{COLOUR_CLUSTER_EVIDENCE_STORY}</BodyText>
          {colourTiles.map((tile) => (
            <View
              key={tile.id}
              style={[styles.tile, { borderColor: colors.border, backgroundColor: colors.background }]}
            >
              <View style={styles.tileHeader}>
                <View style={[styles.swatch, { backgroundColor: tile.swatch }]} />
                <Text style={[styles.tileTitle, { color: colors.text }]}>{tile.name}</Text>
              </View>
              <MicroFactRow label="What it is" value={tile.whatItIs} />
              <MicroFactRow label="Made from" value={tile.madeFrom} />
              <MicroFactRow label="Why used" value={tile.whyUsed} />
              <MicroFactRow label="US alias" value={tile.usAlias} />
            </View>
          ))}
          <SourceLinks sources={COLOUR_CLUSTER_SOURCES} />
        </View>
      )}

      {activeIds.e171 && (
        <View style={styles.section}>
          <SectionHeading>{E171_SECTION.title}</SectionHeading>
          {E171_SECTION.microFacts.map((fact) => (
            <MicroFactRow key={fact.label} label={fact.label} value={fact.value} />
          ))}
          <Text style={[styles.subheading, { color: colors.text }]}>Why we surfaced it</Text>
          <BodyText>{E171_SECTION.whySurfaced}</BodyText>
          <Text style={[styles.subheading, { color: colors.text }]}>Why did regulators reach different conclusions?</Text>
          <BodyText>{E171_SECTION.deeperExplanation}</BodyText>
          <Text style={[styles.subheading, { color: colors.text }]}>How the rules differ</Text>
          <BodyText>{E171_SECTION.rulesDiffer}</BodyText>
          <SourceLinks sources={E171_SECTION.sources} />
        </View>
      )}

      {activeIds.e250 && (
        <View style={styles.section}>
          <SectionHeading>{E250_SECTION.title}</SectionHeading>
          {E250_SECTION.microFacts.map((fact) => (
            <MicroFactRow key={fact.label} label={fact.label} value={fact.value} />
          ))}
          <Text style={[styles.subheading, { color: colors.text }]}>The trade-off</Text>
          <BodyText>{E250_SECTION.tradeOff}</BodyText>
          <Text style={[styles.subheading, { color: colors.text }]}>Context</Text>
          <BodyText>{E250_SECTION.context}</BodyText>
          <Text style={[styles.subheading, { color: colors.text }]}>How the rules differ</Text>
          <BodyText>{E250_SECTION.rulesDiffer}</BodyText>
          <SourceLinks sources={E250_SECTION.sources} />
        </View>
      )}

      {activeIds.e951 && (
        <View style={styles.section}>
          <SectionHeading>{E951_SECTION.title}</SectionHeading>
          {E951_SECTION.microFacts.map((fact) => (
            <MicroFactRow key={fact.label} label={fact.label} value={fact.value} />
          ))}
          <Text style={[styles.subheading, { color: colors.text }]}>Why do those findings sound contradictory?</Text>
          <BodyText>{E951_SECTION.contradiction}</BodyText>
          <Text style={[styles.subheading, { color: colors.text }]}>Deeper explanation</Text>
          <BodyText>{E951_SECTION.deeperExplanation}</BodyText>
          <SourceLinks sources={E951_SECTION.sources} />
        </View>
      )}
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    gap: 10,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  tile: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    gap: 4,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  microFactRow: {
    marginTop: 4,
  },
  microFactLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  microFactValue: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  sourceList: {
    marginTop: 10,
    gap: 6,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceLinkText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
