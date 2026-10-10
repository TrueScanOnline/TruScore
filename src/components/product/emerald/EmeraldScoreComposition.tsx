/**
 * Wave 5 Emerald visual correction — pure presentation.
 * Values, labels and actions are passed from the current governed helpers.
 */
import React, { useId, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle } from 'react-native-svg';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { resultPresentation } from '../../../theme/resultPresentation';

export type EmeraldPillarKey = 'Body' | 'Planet' | 'Ethics' | 'Open';
export type EmeraldPillar = {
  key: EmeraldPillarKey;
  label: string;
  valueText: string;
  accessibilityLabel: string;
  onPress?: () => void;
};
type Props = {
  kind: 'scored' | 'nr' | 'checking';
  /** Pass presentation.score only when kind is scored. No fallback. */
  publishedScore?: number;
  scoreColour: string;
  scoreLabel?: string;
  title?: string;
  explanation?: string;
  pillars: EmeraldPillar[];
  dark?: boolean;
};

const emeraldVisual = resultPresentation.emerald.pillars;

function TileArt({ pillar, dark, prefix }: { pillar: EmeraldPillarKey; dark: boolean; prefix: string }) {
  const role = emeraldVisual[pillar];
  const art = resultPresentation.emerald;
  const shades = dark ? role.dark : role.light;
  const undersideLight = dark ? art.foldDark[1] : '#FFFFFF';
  const undersideDark = dark ? art.foldDark[2] : shades[1];
  return (
    <Svg width="100%" height="100%" viewBox="0 0 164 118" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={`${prefix}-tile`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0" stopColor={shades[0]} />
          <Stop offset="0.42" stopColor={shades[0]} />
          <Stop offset="0.74" stopColor={shades[1]} />
          <Stop offset="1" stopColor={shades[2]} />
        </LinearGradient>
        <LinearGradient id={`${prefix}-fold`} x1="100%" y1="0%" x2="20%" y2="100%">
          <Stop offset="0" stopColor={undersideLight} />
          <Stop offset="0.55" stopColor={shades[0]} />
          <Stop offset="1" stopColor={undersideDark} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="164" height="118" rx="20" fill={`url(#${prefix}-tile)`} />
      <Path
        d="M116 0C110 18 124 32 146 36C160 38 164 30 164 20C158 32 140 32 126 24C112 16 108 8 116 0Z"
        fill={art.foldShade}
        opacity={dark ? 0.28 : 0.14}
      />
      <Path
        d="M128 0C120 12 132 24 150 28C162 31 164 22 164 12L164 0Z"
        fill={`url(#${prefix}-fold)`}
      />
      <Path
        d="M128 0C120 12 132 24 150 28C162 31 164 22 164 12"
        fill="none"
        stroke={dark ? '#E7F4EE' : '#FFFFFF'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function Disc({ kind, value, colour, label, diameter, dark }: {
  kind: Props['kind'];
  value?: number;
  colour: string;
  label?: string;
  diameter: number;
  dark: boolean;
}) {
  const prefix = useId().replace(/:/g, '');
  const radius = resultPresentation.emerald.arcRadius;
  const circumference = 2 * Math.PI * radius;
  const rated = kind === 'scored' && typeof value === 'number' && Number.isFinite(value);
  const neutral = dark ? resultPresentation.emerald.discNeutral.dark : resultPresentation.emerald.discNeutral.light;
  return (
    <View
      style={[styles.disc, { width: diameter, height: diameter, borderRadius: diameter / 2 }]}
      pointerEvents="auto"
      onStartShouldSetResponder={() => true}
    >
      <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFillObject}>
        <Svg width="100%" height="100%" viewBox="0 0 144 144">
          <Defs>
            <LinearGradient id={`${prefix}-rim`} x1="20%" y1="0%" x2="80%" y2="100%">
              <Stop stopColor={dark ? '#6E8B7E' : '#FFFFFF'} />
              <Stop offset="1" stopColor={dark ? '#24382F' : '#D5DEE2'} />
            </LinearGradient>
            <LinearGradient id={`${prefix}-face`} x1="30%" y1="0%" x2="70%" y2="100%">
              <Stop stopColor={dark ? '#3A5648' : '#FFFFFF'} />
              <Stop offset="1" stopColor={dark ? '#24382F' : '#E6EBED'} />
            </LinearGradient>
          </Defs>
          <Circle cx="72" cy="76" r="68" fill={dark ? '#041C16' : '#0C4A3C'} opacity="0.16" />
          <Circle cx="72" cy="72" r="70" fill={`url(#${prefix}-rim)`} />
          <Circle cx="72" cy="72" r="66" fill={dark ? '#2A4036' : '#E4EEEC'} />
          <Circle cx="72" cy="72" r="57" fill={`url(#${prefix}-face)`} />
          <Path d="M40 48C52 34 92 34 104 50" fill="none" stroke="#FFFFFF" strokeOpacity={dark ? 0.16 : 0.7} strokeWidth="3" strokeLinecap="round" />
          {rated && (
            <>
              {value !== 0 && (
                <Circle
                  cx="72"
                  cy="72"
                  r={radius}
                  fill="none"
                  stroke={colour}
                  strokeWidth={resultPresentation.emerald.arcStroke}
                  strokeLinecap="round"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={circumference * (1 - Math.max(0, Math.min(100, value!)) / 100)}
                  rotation="-90"
                  originX="72"
                  originY="72"
                />
              )}
            </>
          )}
          {kind === 'nr' && (
            <>
              <Path d="M56 58C56 40 90 37 90 58C90 73 72 73 72 88" stroke={neutral} strokeWidth="10" strokeLinecap="round" fill="none" />
              <Circle cx="72" cy="106" r="5" fill={neutral} />
            </>
          )}
        </Svg>
      </View>
      {rated ? (
        <View style={styles.discCopy} accessible accessibilityLabel={`${value}/100. ${label || ''}`}>
          <Text style={[styles.score, { color: colour }]}>{value}</Text>
          <Text style={[styles.denominator, { color: colour }]}>/100</Text>
          <Text style={[styles.band, { color: colour }]}>{label}</Text>
        </View>
      ) : kind === 'checking' ? (
        <Text style={[styles.checking, { color: neutral }]}>—</Text>
      ) : null}
    </View>
  );
}

export default function EmeraldScoreComposition({
  kind,
  publishedScore,
  scoreColour,
  scoreLabel,
  title,
  explanation,
  pillars,
  dark = false,
}: Props) {
  const { width: windowWidth, fontScale } = useWindowDimensions();
  const [gridWidth, setGridWidth] = useState(Math.max(0, windowWidth - 56));
  const prefix = useId().replace(/:/g, '');
  const measured = gridWidth > 0 ? gridWidth : Math.max(0, windowWidth - 56);
  // Two ordinary tiles plus the gap need about 232dp. Below that, or at large text, stack.
  // A normal phone grid is often near 300dp after 16dp page margins and the card inset.
  // Width under 320 must not stack at font scale 1.0.
  const reflow = fontScale >= 1.3 || (measured > 0 && measured < 232);
  const single = measured > 0 && measured < 200;
  const gap = resultPresentation.emerald.tileGap;
  const tileWidth = single ? measured : Math.floor((measured - gap) / 2);
  const discSize = reflow
    ? Math.min(measured || 160, Math.round(112 * Math.max(fontScale, 1)))
    : Math.round((measured || 300) * resultPresentation.emerald.medallionGridRatio);
  const edgePad = 12;
  const outerInset = reflow ? 12 : Math.max(edgePad, discSize / 2 - gap / 2);
  const tileHeight = resultPresentation.emerald.tileHeight;
  const gridHeight = tileHeight * 2 + gap;
  const ink = dark ? resultPresentation.emerald.ink.dark : resultPresentation.emerald.ink.light;
  const muted = dark ? resultPresentation.emerald.muted.dark : resultPresentation.emerald.muted.light;
  const disc = <Disc kind={kind} value={publishedScore} colour={scoreColour} label={scoreLabel} diameter={discSize} dark={dark} />;

  return (
    <View
      onLayout={(e) => {
        const next = e.nativeEvent.layout.width;
        if (next > 0 && Math.abs(next - gridWidth) > 0.5) setGridWidth(next);
      }}
    >
      {reflow && <View style={styles.reflowDisc}>{disc}</View>}
      <View
        style={[
          styles.grid,
          reflow ? { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap } : { height: gridHeight },
        ]}
      >
        {pillars.map((pillar, index) => {
          const right = index % 2 === 1;
          const lower = index >= 2;
          const role = emeraldVisual[pillar.key];
          const tileStyle = [
            styles.tile,
            { width: tileWidth },
            reflow
              ? { minHeight: tileHeight }
              : {
                  height: tileHeight,
                  position: 'absolute' as const,
                  left: right ? tileWidth + gap : 0,
                  top: lower ? tileHeight + gap : 0,
                },
          ];
          const content = (
            <>
              <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFillObject}>
                <TileArt pillar={pillar.key} dark={dark} prefix={`${prefix}-${pillar.key}`} />
              </View>
              <View
                style={[
                  styles.tileCopy,
                  reflow
                    ? styles.reflowCopy
                    : {
                        alignItems: right ? 'flex-end' : 'flex-start',
                        justifyContent: lower ? 'flex-end' : 'flex-start',
                        paddingLeft: right ? outerInset : edgePad,
                        paddingRight: right ? edgePad : outerInset,
                        paddingTop: lower ? 8 : 12,
                      },
                ]}
              >
                <MaterialCommunityIcons
                  name={role.glyph}
                  size={resultPresentation.emerald.type.pillarIcon}
                  color={dark ? resultPresentation.emerald.discIconOnDark : role.icon}
                />
                <Text style={[styles.label, { color: ink, textAlign: right && !reflow ? 'right' : 'left' }]}>
                  {pillar.label}
                </Text>
                <View style={[styles.valueRow, right && !reflow ? styles.valueRowEnd : null]}>
                  <Text style={[styles.value, { color: ink }]}>{pillar.valueText}</Text>
                  {pillar.onPress && <Ionicons name="chevron-forward" size={15} color={ink} />}
                </View>
              </View>
            </>
          );
          return pillar.onPress ? (
            <TouchableOpacity
              key={pillar.key}
              style={tileStyle}
              onPress={pillar.onPress}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={pillar.accessibilityLabel}
            >
              {content}
            </TouchableOpacity>
          ) : (
            <View key={pillar.key} style={tileStyle} accessible accessibilityLabel={pillar.accessibilityLabel}>
              {content}
            </View>
          );
        })}
        {!reflow && (
          <View
            style={{ position: 'absolute', left: (measured - discSize) / 2, top: (gridHeight - discSize) / 2 }}
            pointerEvents="box-none"
          >
            {disc}
          </View>
        )}
      </View>
      {kind !== 'scored' && (
        <View style={styles.explanation}>
          <Text style={[styles.statusTitle, { color: ink }]}>{title}</Text>
          <Text style={[styles.statusBody, { color: muted }]}>{explanation}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { position: 'relative' },
  tile: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  tileCopy: { flex: 1, paddingVertical: 10 },
  reflowCopy: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  label: {
    fontSize: resultPresentation.emerald.type.pillarName,
    lineHeight: resultPresentation.emerald.type.pillarNameLine,
    fontWeight: '600',
    marginTop: 2,
  },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 1 },
  valueRowEnd: { alignSelf: 'flex-end' },
  value: {
    fontSize: resultPresentation.emerald.type.pillarValue,
    lineHeight: resultPresentation.emerald.type.pillarValueLine,
    fontWeight: '600',
  },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF1F3',
    shadowColor: '#0C3227',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },
  discCopy: { alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: 12 },
  score: {
    fontSize: resultPresentation.emerald.type.score,
    lineHeight: resultPresentation.emerald.type.scoreLine,
    fontWeight: '700',
  },
  denominator: {
    fontSize: resultPresentation.emerald.type.denominator,
    lineHeight: resultPresentation.emerald.type.denominatorLine,
    fontWeight: '600',
  },
  band: {
    fontSize: resultPresentation.emerald.type.band,
    lineHeight: resultPresentation.emerald.type.bandLine,
    fontWeight: '600',
    textAlign: 'center',
  },
  checking: { fontSize: 34, lineHeight: 42 },
  reflowDisc: { alignItems: 'center', marginBottom: 12 },
  explanation: { marginTop: 12 },
  statusTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  statusBody: { fontSize: 15, lineHeight: 21, marginTop: 6 },
});
