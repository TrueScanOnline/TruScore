import React, { useId } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { resultPresentation } from '../../theme/resultPresentation';

/**
 * Noninteractive Result wallpaper. Decorative only: it does not score, publish, or receive taps.
 * Depth stays inside the locked wallpaper tokens. A darker palette is a founder decision.
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
      style={[StyleSheet.absoluteFill, { backgroundColor: wall.deep }]}
    >
      <Svg width={width} height={height} viewBox="0 0 393 851" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`${id}-base`} x1="0" y1="0" x2="0.2" y2="1">
            <Stop offset="0" stopColor={wall.light} />
            <Stop offset="0.12" stopColor={wall.light} />
            <Stop offset="0.3" stopColor={wall.main} />
            <Stop offset="0.45" stopColor={wall.main} />
            <Stop offset="0.6" stopColor={wall.deep} />
            <Stop offset="1" stopColor={wall.deep} />
          </LinearGradient>
          <LinearGradient id={`${id}-vignette`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.55" stopColor="#000000" stopOpacity="0" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0.28" />
          </LinearGradient>
        </Defs>
        <Rect width="393" height="851" fill={`url(#${id}-base)`} />
        <Path d="M-20 120C20 40 80 20 150-20H-20Z" fill="#FFFFFF" opacity="0.14" />
        <Path d="M330 260C390 320 400 420 410 520C360 480 340 360 330 260Z" fill="#FFFFFF" opacity="0.1" />
        <Rect width="393" height="851" fill={`url(#${id}-vignette)`} />
      </Svg>
    </View>
  );
}
