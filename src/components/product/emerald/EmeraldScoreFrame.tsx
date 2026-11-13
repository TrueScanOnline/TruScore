/** Result-only frame; heading, info and Confidence remain owned by existing callers. */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { resultPresentation } from '../../../theme/resultPresentation';
import ResultCardArt from '../../result/ResultCardArt';

type Props = {
  heading: string;
  infoControl: React.ReactNode;
  children: React.ReactNode;
  confidence?: React.ReactNode;
  dark?: boolean;
};

/** Decorative top tab only — heading sits in the card body below it. */
const TAB = 30;
const RADIUS = 24;
/** Clearance under the decorative tab — enough so the heading is not cramped. */
const TAB_CLEARANCE = 32;
/** Leave room so the proud rim stroke is not clipped at the SVG edge. */
const PAD = 6;
/** Backing side peeks — leave alone when widening the front face. */
const BACKING_INSET = 18;
/** Front card inset; 0 = full wrapper width; backing peeks stay on BACKING_INSET. */
const FACE_INSET = 0;

function cardPath(height: number, inset = 0) {
  const T = TAB + inset;
  const top = 4 + inset;
  const R = Math.max(10, RADIUS - inset * 0.35);
  const W = 400 - inset * 2;
  const H = Math.max(height, T + R * 2) - inset;
  const x0 = inset;
  return [
    `M${x0} ${T + R}`,
    `Q${x0} ${T} ${x0 + R} ${T}`,
    `H${70 + inset}`,
    `C${95 + inset} ${T} ${108 + inset} ${top} ${140 + inset} ${top}`,
    `H${260 - inset}`,
    `C${292 - inset} ${top} ${305 - inset} ${T} ${330 - inset} ${T}`,
    `H${W - R + inset}`,
    `Q${W + inset} ${T} ${W + inset} ${T + R}`,
    `V${H - R}`,
    `Q${W + inset} ${H} ${W - R + inset} ${H}`,
    `H${x0 + R}`,
    `Q${x0} ${H} ${x0} ${H - R}`,
    'Z',
  ].join(' ');
}

/**
 * Two complete cards waiting behind the Rveel Score face — neat fan, quieter fills.
 * Locked original (header peeks only): design/wave5/preserve/Original-score-card-*
 */
const BACKING = [
  { shiftY: -30, side: 'left' as const, fill: '#E6E0D4', stroke: '#9E9688' },
  { shiftY: -15, side: 'right' as const, fill: '#9FCBBC', stroke: '#3F7F6C' },
] as const;

function BackingCard({
  height,
  fill,
  stroke,
  shiftY,
  side,
}: {
  height: number;
  fill: string;
  stroke: string;
  shiftY: number;
  side: 'left' | 'right';
}) {
  const h = Math.max(height, 220);
  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={[
        styles.backing,
        {
          top: shiftY,
          height: h,
          left: side === 'left' ? 0 : BACKING_INSET,
          right: side === 'right' ? 0 : BACKING_INSET,
        },
      ]}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 400 ${h}`} preserveAspectRatio="none">
        <Path d={cardPath(h)} fill={fill} stroke={stroke} strokeWidth="1.8" />
      </Svg>
    </View>
  );
}

export default function EmeraldScoreFrame({ heading, infoControl, children, confidence, dark = false }: Props) {
  const [height, setHeight] = useState(460);
  const ink = dark ? resultPresentation.emerald.ink.dark : resultPresentation.emerald.ink.light;
  const card = dark ? resultPresentation.emerald.card.dark : resultPresentation.emerald.card.light;
  const rim = dark ? '#8ADCC7' : '#074F42';
  const faceFill = dark ? card : 'url(#emerald-score-face)';
  const vbH = height + PAD * 2;
  return (
    <View style={styles.wrapper}>
      {BACKING.map((sheet) => (
        <BackingCard key={`${sheet.shiftY}-${sheet.fill}`} height={height} {...sheet} />
      ))}
      <View
        style={styles.frame}
        onLayout={(e) => {
          const next = e.nativeEvent.layout.height;
          if (next > 0 && Math.abs(next - height) > 0.5) setHeight(next);
        }}
      >
        <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFillObject}>
          <Svg
            width="100%"
            height="100%"
            viewBox={`${-PAD} ${-PAD} ${400 + PAD * 2} ${vbH}`}
            preserveAspectRatio="none"
          >
            <Defs>
              {/* Soft mint wash — light enough that pillar colours stay dominant. */}
              <LinearGradient id="emerald-score-face" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#F2F8F5" />
                <Stop offset="0.5" stopColor="#E8F2ED" />
                <Stop offset="1" stopColor="#DCEBE4" />
              </LinearGradient>
            </Defs>
            <Path d={cardPath(height)} fill={faceFill} />
            <Path d={cardPath(height, 1.2)} fill="none" stroke={rim} strokeWidth="5" />
          </Svg>
        </View>
        <View style={styles.frameInner}>
          <ResultCardArt motif="scoreAura" darkMode={!!dark} intensity={0.85} borderRadius={18} />
          <View style={styles.tabSpacer} accessible={false} />
          <View style={styles.header}>
            <Text style={[styles.heading, { color: ink }]} numberOfLines={1}>
              {heading}
            </Text>
            {infoControl ? <View style={styles.headerActions}>{infoControl}</View> : null}
          </View>
          <View style={styles.contentAboveArt}>{children}</View>
          {confidence ? <View style={styles.confidence}>{confidence}</View> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Nominal Hero→Score separation ~9pt after decorative shiftY (−30): was ~18pt at marginTop 36.
  wrapper: { marginHorizontal: 10, marginTop: 27, marginBottom: 10, overflow: 'visible' },
  backing: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'visible',
    shadowColor: '#0C4A3C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  frame: {
    marginHorizontal: FACE_INSET,
    shadowColor: '#06281F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  frameInner: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    overflow: 'hidden',
    borderRadius: 20,
  },
  contentAboveArt: {
    position: 'relative',
    zIndex: 1,
  },
  tabSpacer: {
    height: TAB_CLEARANCE,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
    marginBottom: 2,
    zIndex: 1,
  },
  heading: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 4,
  },
  confidence: { marginTop: 2, zIndex: 1 },
});
