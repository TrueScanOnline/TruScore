import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  PACKET_CLAIM_LABEL_MAX_FONT_SIZE,
  packetClaimLabelFontSize,
  packetClaimLabelLineHeight,
} from './packetClaimsLabelFit';

const MARK_GAP = 10;

export type PacketClaimLabelRow = {
  key: string;
  kind: 'label';
  text: string;
  mark: React.ReactNode | null;
};

export type PacketClaimHeadingRow = {
  key: string;
  kind: 'heading';
  text: string;
  color: string;
};

type Row = PacketClaimLabelRow | PacketClaimHeadingRow;

export default function PacketClaimsFittedLabels({
  rows,
  color,
}: {
  rows: Row[];
  color: string;
}) {
  const labels = rows.filter((row): row is PacketClaimLabelRow => row.kind === 'label');
  const [contentWidth, setContentWidth] = useState(0);
  const [reserved, setReserved] = useState<Record<string, number>>({});
  const labelKey = labels.map((row) => `${row.key}:${row.text}`).join('\n');

  useEffect(() => {
    setReserved({});
  }, [labelKey]);

  const fontSize =
    contentWidth > 0
      ? packetClaimLabelFontSize({
          contentWidth,
          lines: labels.map((row) => ({
            letterCount: row.text.length,
            reservedWidth: reserved[row.key] ?? (row.mark ? 50 : 0),
          })),
        })
      : PACKET_CLAIM_LABEL_MAX_FONT_SIZE;

  return (
    <View
      style={styles.block}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        setContentWidth((current) => (current === width ? current : width));
      }}
    >
      {rows.map((row) =>
        row.kind === 'heading' ? (
          <Text key={row.key} style={[styles.heading, { color: row.color }]}>
            {row.text}
          </Text>
        ) : (
          <View key={row.key} style={styles.row}>
            {row.mark ? (
              <View
                style={reserved[row.key] === 0 ? styles.collapsedMark : styles.mark}
                onLayout={(event) => {
                  const width = event.nativeEvent.layout.width;
                  const next = width > 0 ? width + MARK_GAP : 0;
                  setReserved((current) => (current[row.key] === next ? current : { ...current, [row.key]: next }));
                }}
              >
                {row.mark}
              </View>
            ) : null}
            <Text
              numberOfLines={1}
              ellipsizeMode="clip"
              style={[
                styles.label,
                {
                  color,
                  fontSize,
                  lineHeight: packetClaimLabelLineHeight(fontSize),
                },
              ]}
            >
              {row.text}
            </Text>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignSelf: 'stretch',
    width: '100%',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  mark: {
    marginRight: MARK_GAP,
    flexShrink: 0,
  },
  collapsedMark: {
    width: 0,
    marginRight: 0,
    overflow: 'hidden',
  },
  label: {
    flex: 1,
    flexShrink: 1,
    fontWeight: '700',
    textAlign: 'left',
  },
  heading: {
    alignSelf: 'stretch',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'left',
  },
});
