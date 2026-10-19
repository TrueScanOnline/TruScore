import React, { useEffect, useRef, useState } from 'react';
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
  const [textWidths, setTextWidths] = useState<number[] | null>(null);
  const [reserved, setReserved] = useState<Record<string, number>>({});
  const [tighten, setTighten] = useState(1);
  const labelKey = labels.map((row) => row.key).join('\n');

  useEffect(() => {
    setTextWidths(null);
    setReserved({});
    setTighten(1);
  }, [labelKey]);

  const fitted =
    textWidths && contentWidth > 0
      ? packetClaimLabelFontSize({
          contentWidth,
          lines: labels.map((row, index) => ({
            textWidthAtMax: textWidths[index] || 0,
            reservedWidth: reserved[row.key] ?? (row.mark ? 50 : 0),
          })),
        })
      : PACKET_CLAIM_LABEL_MAX_FONT_SIZE;
  const fontSize = Math.min(
    PACKET_CLAIM_LABEL_MAX_FONT_SIZE,
    Math.max(8, Math.round(fitted * tighten * 10) / 10)
  );

  return (
    <View style={styles.block} onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)}>
      <ClaimTextMeasurer
        texts={labels.map((row) => row.text)}
        fontSize={PACKET_CLAIM_LABEL_MAX_FONT_SIZE}
        onWidths={(next) =>
          setTextWidths((current) =>
            current && current.length === next.length && current.every((value, index) => value === next[index])
              ? current
              : next
          )
        }
      />
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
              ellipsizeMode="tail"
              onTextLayout={(event) => {
                const visible = event.nativeEvent.lines.map((line) => line.text).join('');
                const clipped = visible.includes('…') || visible.includes('...');
                if (clipped) {
                  setTighten((value) => (value <= 0.45 ? value : Math.round(value * 0.9 * 100) / 100));
                }
              }}
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

function ClaimTextMeasurer({
  texts,
  fontSize,
  onWidths,
}: {
  texts: string[];
  fontSize: number;
  onWidths: (widths: number[]) => void;
}) {
  const widths = useRef<number[]>([]);
  const signature = texts.join('\n');

  useEffect(() => {
    widths.current = new Array(texts.length).fill(0);
  }, [signature, texts.length]);

  return (
    <View style={styles.measurer} pointerEvents="none" accessible={false}>
      {texts.map((text, index) => (
        <Text
          key={`${signature}:${index}`}
          style={[styles.measureText, { fontSize, lineHeight: packetClaimLabelLineHeight(fontSize) }]}
          onTextLayout={(event) => {
            const lineWidth = event.nativeEvent.lines.reduce((sum, line) => sum + line.width, 0);
            widths.current[index] = lineWidth;
            if (widths.current.length !== texts.length) return;
            if (widths.current.some((value, lineIndex) => value <= 0 && texts[lineIndex].length > 0)) return;
            onWidths(widths.current.slice());
          }}
        >
          {text}
        </Text>
      ))}
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
  measurer: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    top: 0,
    width: 4000,
  },
  measureText: {
    fontWeight: '700',
    textAlign: 'left',
  },
});
