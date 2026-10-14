/** Result-only frame; heading, info and Confidence remain owned by existing callers. */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { resultPresentation } from '../../../theme/resultPresentation';

type Props = {
  heading: string;
  infoControl: React.ReactNode;
  children: React.ReactNode;
  confidence?: React.ReactNode;
  dark?: boolean;
};

const TAB = 34;
const RADIUS = 24;

function cardPath(height: number) {
  const T = TAB;
  const R = RADIUS;
  const H = Math.max(height, T + R * 2);
  return `M0 ${T + R} Q0 ${T} ${R} ${T} H60 C88 ${T} 98 2 132 1 H268 C302 2 312 ${T} 340 ${T} H${400 - R} Q400 ${T} 400 ${T + R} V${H - R} Q400 ${H} ${400 - R} ${H} H${R} Q0 ${H} 0 ${H - R} Z`;
}

const SHEETS = [
  { lift: 20, inset: 14, shift: -8, fill: '#FFFFFF', opacity: 0.22 },
  { lift: 13, inset: 8, shift: 6, fill: '#D9FFF1', opacity: 0.28 },
  { lift: 7, inset: 4, shift: -3, fill: '#FFFFFF', opacity: 0.42 },
] as const;

function GlassSheet({
  fill,
  opacity,
  inset,
  lift,
  shift,
}: {
  fill: string;
  opacity: number;
  inset: number;
  lift: number;
  shift: number;
}) {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={[styles.sheet, { left: -inset + shift, right: -inset - shift, top: -lift, height: 72 }]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 400 78" preserveAspectRatio="xMidYMin slice">
        <Path d={cardPath(220)} fill={fill} fillOpacity={opacity} stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="1" />
      </Svg>
    </View>
  );
}

export default function EmeraldScoreFrame({ heading, infoControl, children, confidence, dark = false }: Props) {
  const [height, setHeight] = useState(460);
  const ink = dark ? resultPresentation.emerald.ink.dark : resultPresentation.emerald.ink.light;
  const card = dark ? resultPresentation.emerald.card.dark : resultPresentation.emerald.card.light;
  return (
    <View style={styles.wrapper}>
      {SHEETS.map((sheet) => (
        <GlassSheet key={`${sheet.lift}-${sheet.shift}`} {...sheet} />
      ))}
      <View
        style={styles.frame}
        onLayout={(e) => {
          const next = e.nativeEvent.layout.height;
          if (next > 0 && Math.abs(next - height) > 0.5) setHeight(next);
        }}
      >
        <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFillObject}>
          <Svg width="100%" height="100%" viewBox={`0 0 400 ${height}`} preserveAspectRatio="none">
            <Path d={cardPath(height)} fill={card} />
          </Svg>
        </View>
        <View style={styles.header}>
          <Text style={[styles.heading, { color: ink }]}>{heading}</Text>
          {infoControl}
        </View>
        {children}
        {confidence ? <View style={styles.confidence}>{confidence}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginTop: 14, marginBottom: 8 },
  sheet: {
    position: 'absolute',
    overflow: 'hidden',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#0C4A3C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 1,
  },
  frame: {
    paddingHorizontal: 11,
    paddingTop: 8,
    paddingBottom: 8,
    shadowColor: '#0C4A3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    minHeight: TAB,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginBottom: 2,
  },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600', flexShrink: 1 },
  confidence: { marginTop: 2 },
});
