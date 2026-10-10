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

const SHEETS = [
  { rotate: '-2.2deg', top: 0, shift: 8 },
  { rotate: '1.5deg', top: 8, shift: -5 },
  { rotate: '-0.7deg', top: 16, shift: 3 },
] as const;

function BackingSheet({
  color,
  rotate,
  top,
  shift,
}: {
  color: string;
  rotate: string;
  top: number;
  shift: number;
}) {
  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={[styles.sheet, { top, transform: [{ rotate }], marginLeft: shift, marginRight: -shift }]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 340 56">
        <Path
          d="M20 38C34 18 78 8 170 6C262 8 306 18 320 38C328 48 314 54 294 54H46C26 54 12 48 20 38Z"
          fill={resultPresentation.emerald.wallpaper.deep}
          fillOpacity="0.14"
          transform="translate(0 3)"
        />
        <Path
          d="M18 34C32 14 76 4 170 2C264 4 308 14 322 34C330 44 316 50 296 50H44C24 50 10 44 18 34Z"
          fill={color}
        />
        <Path
          d="M40 32C72 16 120 10 170 8C228 10 276 16 300 32"
          fill="none"
          stroke={resultPresentation.emerald.frameWash}
          strokeOpacity="0.85"
          strokeWidth="1.2"
        />
      </Svg>
    </View>
  );
}

export default function EmeraldScoreFrame({ heading, infoControl, children, confidence, dark = false }: Props) {
  const [height, setHeight] = useState(420);
  const ink = dark ? resultPresentation.emerald.ink.dark : resultPresentation.emerald.ink.light;
  const card = dark ? resultPresentation.emerald.card.dark : resultPresentation.emerald.card.light;
  const stack = resultPresentation.emerald.frameStack;
  const shoulder = Math.max(28, height - 24);
  return (
    <View style={styles.wrapper}>
      <View pointerEvents="none" accessible={false} style={styles.layers}>
        {SHEETS.map((sheet, index) => (
          <BackingSheet
            key={stack[index]}
            color={stack[index]}
            rotate={sheet.rotate}
            top={sheet.top}
            shift={sheet.shift}
          />
        ))}
      </View>
      <View
        style={styles.frame}
        onLayout={(e) => {
          const next = e.nativeEvent.layout.height;
          if (next > 0 && Math.abs(next - height) > 0.5) setHeight(next);
        }}
      >
        <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFillObject}>
          <Svg width="100%" height="100%" viewBox={`0 0 400 ${height}`} preserveAspectRatio="none">
            <Path
              d={`M0 28C28 24 72 6 132 2C176 0 224 0 268 2C328 6 372 24 400 28V${shoulder}C400 ${height - 8} 382 ${height} 364 ${height}H36C18 ${height} 0 ${height - 8} 0 ${shoulder}Z`}
              fill={card}
            />
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
  wrapper: { marginHorizontal: 16, marginTop: 28, marginBottom: 8 },
  layers: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: -resultPresentation.emerald.backingPeek,
    height: 72,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 52,
  },
  frame: {
    paddingHorizontal: 11,
    paddingTop: 10,
    paddingBottom: 8,
    shadowColor: '#0C4A3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginBottom: 2,
  },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600', flexShrink: 1 },
  confidence: { marginTop: 2 },
});
