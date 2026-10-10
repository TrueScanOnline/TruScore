import React from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/**
 * Decorative layers behind the Score card. They have no tap target and no score meaning.
 */
export default function EmeraldScoreBacking({ width }: { width: number }) {
  const height = Math.max(96, Math.round(width * (120 / 400)));
  return (
    <Svg
      pointerEvents="none"
      accessible={false}
      width={width}
      height={height}
      viewBox="0 0 400 120"
      style={{ position: 'absolute', top: 2, left: 0 }}
    >
      <Defs>
        <LinearGradient id="emeraldBackJade" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#D7F3EA" />
          <Stop offset="1" stopColor="#C9EBD8" />
        </LinearGradient>
        <LinearGradient id="emeraldBackLavender" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#E7F7F1" />
          <Stop offset="1" stopColor="#E4DCF8" />
        </LinearGradient>
      </Defs>
      <Path
        d="M6 44Q4 21 29 20L326 2Q360 0 383 29L395 100H6Z"
        fill="url(#emeraldBackJade)"
        stroke="#FFFFFF"
        strokeOpacity={0.55}
      />
      <Path
        d="M8 98V40Q10 7 55 14L347 21Q387 23 392 58V105Z"
        fill="url(#emeraldBackLavender)"
        stroke="#FFFFFF"
        strokeOpacity={0.45}
      />
    </Svg>
  );
}
