/**
 * Wave 5 Emerald visual correction — pure presentation.
 * Values, labels and actions are passed from the current governed helpers.
 */
import React, { useId, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, PixelRatio } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Path,
  Circle,
  ClipPath,
  G,
} from 'react-native-svg';
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

function num(value: number) {
  return (Math.round(value * 10) / 10).toString();
}

function flapPath(width: number, height: number) {
  const ax = 0.549 * width;
  return [
    `M${num(ax)} 0`,
    `C${num(0.8 * width)} ${num(0.13 * height)} ${num(0.92 * width)} ${num(0.362 * height)} ${num(width)} ${num(0.58 * height)}`,
    `C${num(0.88 * width)} ${num(0.42 * height)} ${num(0.72 * width)} ${num(0.319 * height)} ${num(0.594 * width)} ${num(0.188 * height)}`,
    `C${num(0.537 * width)} ${num(0.13 * height)} ${num(0.503 * width)} ${num(0.058 * height)} ${num(ax)} 0`,
    'Z',
  ].join(' ');
}

function TileArt({
  pillar,
  dark,
  prefix,
  width,
  height,
}: {
  pillar: EmeraldPillarKey;
  dark: boolean;
  prefix: string;
  width: number;
  height: number;
}) {
  const role = emeraldVisual[pillar];
  const art = resultPresentation.emerald;
  const shades = dark ? role.dark : role.light;
  const W = Math.max(width, 1);
  const H = Math.max(height, 1);
  const ax = 0.549 * W;
  const underlay = `M${num(ax)} 0 H${num(W - 22)} A22 22 0 0 1 ${num(W)} 22 V${num(0.58 * H)} C${num(0.92 * W)} ${num(0.362 * H)} ${num(0.8 * W)} ${num(0.13 * H)} ${num(ax)} 0 Z`;
  const flap = flapPath(W, H);
  const foldLine = `M${num(ax)} 0 C${num(0.8 * W)} ${num(0.13 * H)} ${num(0.92 * W)} ${num(0.362 * H)} ${num(W)} ${num(0.58 * H)}`;
  const flapLight = dark ? art.foldDark[1] : '#FFFFFF';
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${num(W)} ${num(H)}`}>
      <Defs>
        <ClipPath id={`${prefix}-clip`}>
          <Rect x="0" y="0" width={W} height={H} rx="22" />
        </ClipPath>
        <LinearGradient id={`${prefix}-tile`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0" stopColor={shades[0]} />
          <Stop offset="0.42" stopColor={shades[0]} />
          <Stop offset="0.74" stopColor={shades[1]} />
          <Stop offset="1" stopColor={shades[2]} />
        </LinearGradient>
        <RadialGradient id={`${prefix}-wash`} cx="20%" cy="15%" r="70%">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.45" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id={`${prefix}-under`} x1="100%" y1="0%" x2="55%" y2="45%">
          <Stop offset="0" stopColor={role.icon} stopOpacity="1" />
          <Stop offset="1" stopColor={role.icon} stopOpacity="0.78" />
        </LinearGradient>
        <LinearGradient id={`${prefix}-shadow`} x1="80%" y1="20%" x2="50%" y2="60%">
          <Stop offset="0" stopColor="#0C3227" stopOpacity="0.18" />
          <Stop offset="1" stopColor="#0C3227" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id={`${prefix}-flap`} x1="80%" y1="20%" x2="55%" y2="50%">
          <Stop offset="0" stopColor={flapLight} />
          <Stop offset="0.55" stopColor={flapLight} />
          <Stop offset="1" stopColor={shades[1]} />
        </LinearGradient>
      </Defs>
      <G clipPath={`url(#${prefix}-clip)`}>
        <Rect x="0" y="0" width={W} height={H} rx="22" fill={`url(#${prefix}-tile)`} />
        <Rect x="0" y="0" width={W} height={H} rx="22" fill={`url(#${prefix}-wash)`} />
        <Path d={underlay} fill={`url(#${prefix}-under)`} />
        <Path d={flap} fill={`url(#${prefix}-shadow)`} transform="translate(-4 5)" />
        <Path d={flap} fill={`url(#${prefix}-flap)`} />
        <Path d={foldLine} fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.9" />
        <Rect
          x="1"
          y="1"
          width={Math.max(W - 2, 0)}
          height={Math.max(H - 2, 0)}
          rx="21"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeOpacity="0.7"
        />
      </G>
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
  const stroke = resultPresentation.emerald.arcStroke;
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
              <Stop offset="1" stopColor={dark ? '#24382F' : '#E9EEF0'} />
            </LinearGradient>
            <LinearGradient id={`${prefix}-face`} x1="30%" y1="0%" x2="70%" y2="100%">
              <Stop stopColor={dark ? '#3A5648' : '#FFFFFF'} />
              <Stop offset="1" stopColor={dark ? '#24382F' : '#F2F4F5'} />
            </LinearGradient>
          </Defs>
          <Circle cx="72" cy="76" r="68" fill={dark ? '#041C16' : '#0C4A3C'} opacity="0.16" />
          <Circle cx="72" cy="72" r="71" fill={`url(#${prefix}-rim)`} />
          <Circle cx="72" cy="72" r="60" fill="none" stroke={dark ? '#2A4036' : '#EEF2F3'} strokeWidth="10" />
          <Circle cx="72" cy="72" r="55" fill={`url(#${prefix}-face)`} />
          <Path
            d="M44 52C56 38 88 38 100 52"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={dark ? 0.16 : 0.7}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {rated && value !== 0 && (
            <Circle
              cx="72"
              cy="72"
              r={radius}
              fill="none"
              stroke={colour}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={circumference * (1 - Math.max(0, Math.min(100, value!)) / 100)}
              rotation="-90"
              originX="72"
              originY="72"
            />
          )}
          {kind === 'nr' && (
            <>
              <Path
                d="M56 58C56 40 90 37 90 58C90 73 72 73 72 88"
                stroke={neutral}
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
              />
              <Circle cx="72" cy="106" r="6.5" fill={neutral} />
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
  const { width: windowWidth, fontScale: windowFontScale } = useWindowDimensions();
  const fontScale = Math.max(windowFontScale, PixelRatio.getFontScale());
  const [gridWidth, setGridWidth] = useState(Math.max(0, windowWidth - 56));
  const prefix = useId().replace(/:/g, '');
  const measured = gridWidth > 0 ? gridWidth : Math.max(0, windowWidth - 56);
  // Two ordinary tiles plus the gap need about 232dp. Below that, or at large text, stack.
  // A normal phone grid is often near 300dp after 16dp page margins and the card inset.
  // Width under 320 must not stack at font scale 1.0.
  // Android reports a 1.3 font scale as 1.29999995, which misses a raw >= 1.3 check.
  const reflow = Math.round(fontScale * 100) >= 130 || (measured > 0 && measured < 232);
  const single = measured > 0 && measured < 200;
  const gap = resultPresentation.emerald.tileGap;
  const tileWidth = single ? measured : Math.floor((measured - gap) / 2);
  const discSize = reflow
    ? Math.min(measured || 160, Math.round(112 * Math.max(fontScale, 1)))
    : Math.round((measured || 300) * resultPresentation.emerald.medallionGridRatio);
  const tileHeight = resultPresentation.emerald.tileHeight;
  const gridHeight = tileHeight * 2 + gap;
  const chevron = resultPresentation.emerald.type.chevron;
  const ink = dark ? resultPresentation.emerald.ink.dark : resultPresentation.emerald.ink.light;
  const muted = dark ? resultPresentation.emerald.muted.dark : resultPresentation.emerald.muted.light;
  const card = dark ? resultPresentation.emerald.card.dark : resultPresentation.emerald.card.light;
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
          const role = emeraldVisual[pillar.key];
          const tileTop = index >= 2 ? tileHeight + gap : 0;
          const socketRadius = discSize / 2 + 8;
          const clearanceAt = (centerY: number) => {
            const dy = centerY - gridHeight / 2;
            if (Math.abs(dy) >= socketRadius) return 16;
            const reach = Math.sqrt(socketRadius * socketRadius - dy * dy);
            const edge = measured / 2 + (right ? reach : -reach);
            const tileEdge = right ? tileWidth + gap : tileWidth;
            const overlap = right ? edge - (tileWidth + gap) : tileEdge - edge;
            return Math.max(16, overlap + 8);
          };
          const iconInset = reflow ? 16 : clearanceAt(tileTop + 14 + resultPresentation.emerald.type.pillarIcon / 2);
          const textInset = reflow ? 16 : clearanceAt(tileTop + tileHeight - 14 - 23);
          const besideRoom = tileWidth - 16 - textInset;
          const chevronBeside = !right && besideRoom >= 14 + chevron + 72;
          const tileStyle = [
            styles.tile,
            { width: tileWidth },
            reflow
              ? { minHeight: tileHeight }
              : {
                  height: tileHeight,
                  position: 'absolute' as const,
                  left: right ? tileWidth + gap : 0,
                  top: index >= 2 ? tileHeight + gap : 0,
                },
          ];
          const content = (
            <>
              <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFillObject}>
                <TileArt
                  pillar={pillar.key}
                  dark={dark}
                  prefix={`${prefix}-${pillar.key}`}
                  width={tileWidth}
                  height={tileHeight}
                />
              </View>
              <View style={styles.tileCopy}>
                <View style={{ paddingLeft: right ? iconInset : 16, paddingRight: right ? 16 : iconInset }}>
                  <MaterialCommunityIcons
                    name={role.glyph}
                    size={resultPresentation.emerald.type.pillarIcon}
                    color={dark ? resultPresentation.emerald.discIconOnDark : role.icon}
                  />
                </View>
                <View
                  style={[
                    styles.copyBlock,
                    { paddingLeft: right ? textInset : 16, paddingRight: right ? 14 : 16 },
                  ]}
                >
                  <View style={styles.copyText}>
                    <Text style={[styles.label, { color: ink }]}>{pillar.label}</Text>
                    <Text style={[styles.value, { color: ink }]}>{pillar.valueText}</Text>
                    {pillar.onPress && !right && !chevronBeside ? (
                      <Ionicons name="chevron-forward" size={chevron} color={ink} />
                    ) : null}
                  </View>
                  {pillar.onPress && (right || chevronBeside) ? (
                    <Ionicons name="chevron-forward" size={chevron} color={ink} style={styles.chevronBeside} />
                  ) : null}
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
            pointerEvents="auto"
            onStartShouldSetResponder={() => true}
            style={{
              position: 'absolute',
              left: (measured - discSize) / 2 - 8,
              top: (gridHeight - discSize) / 2 - 8,
              width: discSize + 16,
              height: discSize + 16,
              borderRadius: (discSize + 16) / 2,
              backgroundColor: card,
            }}
          />
        )}
        {!reflow && (
          <View
            style={{
              position: 'absolute',
              left: (measured - discSize) / 2,
              top: (gridHeight - discSize) / 2,
              zIndex: 2,
            }}
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
  tileCopy: { flex: 1, paddingTop: 14, paddingBottom: 14 },
  copyBlock: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copyText: { flexShrink: 1 },
  chevronBeside: { marginLeft: 14 },
  label: {
    fontSize: resultPresentation.emerald.type.pillarName,
    lineHeight: resultPresentation.emerald.type.pillarNameLine,
    fontWeight: '700',
  },
  value: {
    fontSize: resultPresentation.emerald.type.pillarValue,
    lineHeight: resultPresentation.emerald.type.pillarValueLine,
    fontWeight: '500',
  },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F4F5',
    shadowColor: '#0C3227',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  discCopy: { alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: 8 },
  score: {
    fontSize: resultPresentation.emerald.type.score,
    lineHeight: resultPresentation.emerald.type.scoreLine,
    fontWeight: '800',
  },
  denominator: {
    fontSize: resultPresentation.emerald.type.denominator,
    lineHeight: resultPresentation.emerald.type.denominatorLine,
    fontWeight: '700',
  },
  band: {
    fontSize: resultPresentation.emerald.type.band,
    lineHeight: resultPresentation.emerald.type.bandLine,
    fontWeight: '800',
    textAlign: 'center',
  },
  checking: { fontSize: 34, lineHeight: 42 },
  reflowDisc: { alignItems: 'center', marginBottom: 12 },
  explanation: { marginTop: 12 },
  statusTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  statusBody: { fontSize: 15, lineHeight: 21, marginTop: 6 },
});
