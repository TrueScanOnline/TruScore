import React, { useId } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { resultPresentation } from '../../theme/resultPresentation';

/**
 * Noninteractive Result wallpaper. Decorative only: it does not score, publish, or receive taps.
 * Deep emerald is limited to a small lower accent so the page stays luminous.
 */
export default function EmeraldWallpaper() {
  const { width, height } = useWindowDimensions();
  const id = useId().replace(/:/g, '');
  const wall = resultPresentation.emerald.wallpaper;
  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { backgroundColor: wall.main }]}
    >
      <Svg width={width} height={height} viewBox="0 0 393 851" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`${id}-base`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={wall.light} />
            <Stop offset="0.62" stopColor={wall.main} />
            <Stop offset="1" stopColor={wall.main} />
          </LinearGradient>
          <LinearGradient id={`${id}-veil`} x1="1" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="393" height="851" fill={`url(#${id}-base)`} />
        <Path
          d="M-50-30C40 80 150-10 250 70C330 130 390 40 460-10V-40H-50Z"
          fill={wall.light}
          opacity="0.55"
        />
        <Path
          d="M-40 180C70 90 150 250 250 160C340 80 400 200 450 150C360 250 220 140 120 210C40 260-20 230-40 180Z"
          fill={`url(#${id}-veil)`}
        />
        <Path
          d="M-30 430C90 340 200 500 340 390C400 350 440 430 470 400V520C320 600 140 470-30 560Z"
          fill="#FFFFFF"
          opacity="0.1"
        />
        <Path
          d="M300 700C360 640 430 690 460 760V870H250C270 800 250 740 300 700Z"
          fill={wall.deep}
          opacity="0.55"
        />
      </Svg>
    </View>
  );
}
