/**
 * Canonical S25 “About these Additives” destination.
 * Merged Body-6 + standard catalogue list. Caller-aware Back / X→Result.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import InfoModal from './InfoModal';
import {
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
import {
  buildRenderList,
  getSourceProfile,
  getSurfaceCopy,
  type S25MergedDetection,
  type S25RenderListItem,
} from '../s25';
import { glyphForSourceProfile } from '../s25/glyphs';
import { useTheme } from '../theme';

export type AboutTheseAdditivesCaller = 'result' | 'body' | 'open';

export interface AboutTheseAdditivesModalProps {
  visible: boolean;
  onClose: () => void;
  /** Restore the exact prior L3/L2 surface (Body or Open). Omitted for Result entry. */
  onBack?: () => void;
  caller: AboutTheseAdditivesCaller;
  merged: S25MergedDetection;
  ingredientsText?: string | null;
  /** Canonical additive IDs (and/or colour members) to expand + scroll to. */
  focusAdditiveIds?: readonly string[];
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

function ProfileGlyph({ glyphKey }: { glyphKey: string }) {
  const { colors } = useTheme();
  return (
    <Ionicons name={glyphForSourceProfile(glyphKey)} size={16} color={colors.textSecondary} />
  );
}

function StandardExpanded({ item }: { item: S25RenderListItem }) {
  const { colors } = useTheme();
  const entry = item.entry;
  const profile = getSourceProfile(entry.source_preparation_profile);
  const functionUnknown = getSurfaceCopy('function_unknown');
  const sourceSectionTitle = getSurfaceCopy('source_preparation_section_title');
  const evidenceTitle = getSurfaceCopy('evidence_section_title');

  const facts = [
    { label: entry.fact_1_label, copy: entry.fact_1_copy },
    { label: entry.fact_2_label, copy: entry.fact_2_copy },
    { label: entry.fact_3_label, copy: entry.fact_3_copy },
  ].filter((f) => f.label.trim() && f.copy.trim());

  const evidenceLinks: AdditiveSourceLink[] = [];
  if (entry.evidence_enabled && entry.evidence_source_count >= 1) {
    evidenceLinks.push({
      label: entry.evidence_source_1_link_label,
      url: entry.evidence_source_1_url,
    });
  }
  if (entry.evidence_enabled && entry.evidence_source_count >= 2) {
    evidenceLinks.push({
      label: entry.evidence_source_2_link_label,
      url: entry.evidence_source_2_url,
    });
  }

  return (
    <View style={styles.expandedBlock}>
      {entry.expanded_summary ? <BodyText>{entry.expanded_summary}</BodyText> : null}

      {item.declaredClass ? (
        <View style={styles.subBlock}>
          <Text style={[styles.subheading, { color: colors.text }]}>
            {item.declaredClass.consumer_label}
          </Text>
          {item.declaredClass.render_mode === 'EXPLAIN' &&
          item.declaredClass.consumer_purpose_copy ? (
            <BodyText>{item.declaredClass.consumer_purpose_copy}</BodyText>
          ) : null}
        </View>
      ) : (
        <BodyText>{functionUnknown}</BodyText>
      )}

      {profile && entry.source_preparation_render_mode === 'STANDARD_PROFILE_AND_COPY' ? (
        <View style={styles.subBlock}>
          <View style={styles.profileRow}>
            <ProfileGlyph glyphKey={profile.glyph_key} />
            <Text style={[styles.subheading, { color: colors.text }]}>
              {sourceSectionTitle}: {profile.consumer_label}
            </Text>
          </View>
          {entry.source_preparation_copy ? (
            <BodyText>{entry.source_preparation_copy}</BodyText>
          ) : null}
        </View>
      ) : null}

      {facts.map((f) => (
        <MicroFactRow key={f.label} label={f.label} value={f.copy} />
      ))}

      {entry.evidence_enabled && entry.evidence_copy ? (
        <View style={styles.subBlock}>
          <Text style={[styles.subheading, { color: colors.text }]}>{evidenceTitle}</Text>
          <BodyText>{entry.evidence_copy}</BodyText>
          <SourceLinks sources={evidenceLinks} />
        </View>
      ) : null}
    </View>
  );
}

function Body6Expanded({
  item,
  colourLedgerIds,
}: {
  item: S25RenderListItem;
  colourLedgerIds: readonly string[];
}) {
  const { colors } = useTheme();
  const colourSet = new Set(colourLedgerIds);
  const colourTiles = COLOUR_TILES.filter((tile) =>
    colourSet.has(tile.id as BodyV12AdjustmentId)
  );

  if (item.colourGroupIds && item.colourGroupIds.length > 0) {
    return (
      <View style={styles.expandedBlock}>
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
    );
  }

  if (item.additiveId === 'e171') {
    return (
      <View style={styles.expandedBlock}>
        {E171_SECTION.microFacts.map((fact) => (
          <MicroFactRow key={fact.label} label={fact.label} value={fact.value} />
        ))}
        <Text style={[styles.subheading, { color: colors.text }]}>Why we surfaced it</Text>
        <BodyText>{E171_SECTION.whySurfaced}</BodyText>
        <Text style={[styles.subheading, { color: colors.text }]}>
          Why did regulators reach different conclusions?
        </Text>
        <BodyText>{E171_SECTION.deeperExplanation}</BodyText>
        <Text style={[styles.subheading, { color: colors.text }]}>How the rules differ</Text>
        <BodyText>{E171_SECTION.rulesDiffer}</BodyText>
        <SourceLinks sources={E171_SECTION.sources} />
      </View>
    );
  }

  if (item.additiveId === 'e250') {
    return (
      <View style={styles.expandedBlock}>
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
    );
  }

  if (item.additiveId === 'e951') {
    return (
      <View style={styles.expandedBlock}>
        {E951_SECTION.microFacts.map((fact) => (
          <MicroFactRow key={fact.label} label={fact.label} value={fact.value} />
        ))}
        <Text style={[styles.subheading, { color: colors.text }]}>
          Why do those findings sound contradictory?
        </Text>
        <BodyText>{E951_SECTION.contradiction}</BodyText>
        <Text style={[styles.subheading, { color: colors.text }]}>Deeper explanation</Text>
        <BodyText>{E951_SECTION.deeperExplanation}</BodyText>
        <SourceLinks sources={E951_SECTION.sources} />
      </View>
    );
  }

  return null;
}

function entryFocusKey(item: S25RenderListItem): string {
  if (item.colourGroupIds?.length) return 'colour-group';
  return item.additiveId;
}

function shouldFocusItem(item: S25RenderListItem, focusIds: readonly string[]): boolean {
  if (focusIds.length === 0) return false;
  if (item.colourGroupIds?.length) {
    return focusIds.some((id) => item.colourGroupIds!.includes(id) || id === item.additiveId);
  }
  return focusIds.includes(item.additiveId);
}

export default function AboutTheseAdditivesModal({
  visible,
  onClose,
  onBack,
  caller,
  merged,
  ingredientsText,
  focusAdditiveIds = [],
}: AboutTheseAdditivesModalProps) {
  const { colors } = useTheme();
  const items = useMemo(
    () => buildRenderList(merged, ingredientsText),
    [merged, ingredientsText]
  );

  const colourLedgerIds = useMemo(() => {
    const colourCanon = new Set(
      (focusAdditiveIds.length
        ? focusAdditiveIds
        : merged.body6Ids
      ).filter((id) => ['e102', 'e110', 'e129'].includes(id))
    );
    // Always show all fired colours in the group, not only focused ones.
    for (const id of merged.body6Ids) {
      if (['e102', 'e110', 'e129'].includes(id)) colourCanon.add(id);
    }
    return COLOUR_ADDITIVE_IDS.filter((lid) => {
      const canon = lid.replace('body-v12-additive-', '');
      return colourCanon.has(canon);
    });
  }, [merged.body6Ids, focusAdditiveIds]);

  const initialExpanded = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (shouldFocusItem(item, focusAdditiveIds)) {
        set.add(entryFocusKey(item));
      }
    }
    return set;
  }, [items, focusAdditiveIds]);

  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);
  const [scrollToY, setScrollToY] = useState<number | undefined>(undefined);
  const yByKey = useRef<Record<string, number>>({});

  useEffect(() => {
    if (visible) {
      setExpanded(new Set(initialExpanded));
      // Defer scroll until layout
      requestAnimationFrame(() => {
        const focusKey = [...initialExpanded][0];
        if (focusKey && yByKey.current[focusKey] != null) {
          setScrollToY(yByKey.current[focusKey]);
        } else {
          setScrollToY(undefined);
        }
      });
    }
  }, [visible, initialExpanded]);

  if (!visible || merged.renderedAdditiveIds.length === 0) return null;

  const title = getSurfaceCopy('surface_title') || 'About these Additives';
  const intro = getSurfaceCopy('surface_intro');

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const showBack = caller === 'body' || caller === 'open';

  return (
    <InfoModal
      visible={visible}
      onClose={onClose}
      onBack={showBack ? onBack : undefined}
      title={title}
      icon="beaker-outline"
      iconColor={colors.primary}
      scrollToY={scrollToY}
    >
      <BodyText>{intro}</BodyText>

      {items.map((item) => {
        const key = entryFocusKey(item);
        const isOpen = expanded.has(key);
        const profile =
          !item.isBody6 && item.entry.source_preparation_render_mode === 'STANDARD_PROFILE_AND_COPY'
            ? getSourceProfile(item.entry.source_preparation_profile)
            : undefined;

        return (
          <View
            key={key}
            style={[styles.entry, { borderColor: colors.border }]}
            onLayout={(e: LayoutChangeEvent) => {
              yByKey.current[key] = e.nativeEvent.layout.y;
            }}
          >
            <TouchableOpacity
              onPress={() => toggle(key)}
              style={styles.entryHeader}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
            >
              <View style={styles.entryHeaderText}>
                <Text style={[styles.entryTitle, { color: colors.text }]}>
                  {item.colourGroupIds && item.colourGroupIds.length > 1
                    ? 'Colour additives'
                    : item.entry.entry_title}
                </Text>
                {item.entry.tile_summary ? (
                  <Text style={[styles.tileSummary, { color: colors.textSecondary }]}>
                    {item.entry.tile_summary}
                  </Text>
                ) : null}
                {profile ? (
                  <View style={styles.profileRow}>
                    <ProfileGlyph glyphKey={profile.glyph_key} />
                    <Text style={[styles.profileLabel, { color: colors.textSecondary }]}>
                      {profile.consumer_label}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {isOpen ? (
              item.isBody6 ? (
                <Body6Expanded item={item} colourLedgerIds={colourLedgerIds} />
              ) : (
                <StandardExpanded item={item} />
              )
            ) : null}
          </View>
        );
      })}
    </InfoModal>
  );
}

const styles = StyleSheet.create({
  entry: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  entryHeaderText: {
    flex: 1,
    gap: 4,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  tileSummary: {
    fontSize: 14,
    lineHeight: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  profileLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  expandedBlock: {
    marginTop: 12,
    gap: 8,
  },
  subBlock: {
    marginTop: 8,
    gap: 4,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
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
