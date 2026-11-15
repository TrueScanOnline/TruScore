/**
 * FM-01 — NOVA 3 header pictogram: preserve jar with a spoon.
 * Presentation only. Does not affect NOVA classification or scoring.
 * Geometry tuned so jar + spoon stay distinct at 24–26px (not a wrench).
 */

import React from 'react';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
};

export default function Nova3PreservedFoodIcon({ size = 24, color = '#FFA500' }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityRole="image"
      accessibilityLabel="Preserved food jar with spoon"
    >
      {/* Wide jar body — dominant silhouette at small sizes */}
      <Path
        d="M5.8 9h12.4c.6 0 1.05.45 1.1 1.05l.4 9.2c.05.9-.7 1.65-1.6 1.65H6.9c-.9 0-1.65-.75-1.6-1.65l.4-9.2C5.75 9.45 6.2 9 5.8 9z"
        fill={color}
        opacity={0.18}
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      {/* Lid stack */}
      <Rect x="7.2" y="6.4" width="9.6" height="2.7" rx="0.75" fill={color} />
      <Rect x="8.6" y="4.8" width="6.8" height="1.9" rx="0.55" fill={color} />
      {/* Preserve fill block */}
      <Path
        d="M6.7 13.6h10.6l.2 5.1c.02.5-.38.9-.88.9H7.38c-.5 0-.9-.4-.88-.9l.2-5.1z"
        fill={color}
        opacity={0.62}
      />
      {/* Surface of preserve */}
      <Ellipse cx="12" cy="14.2" rx="4.2" ry="1.15" fill={color} opacity={0.85} />
      {/* Spoon bowl — large round head (reads as utensil, not tool jaw) */}
      <Ellipse cx="15.1" cy="9.6" rx="2.55" ry="2.15" fill={color} />
      <Ellipse cx="15.1" cy="9.6" rx="1.25" ry="1" fill="none" stroke={color} strokeWidth={1.15} opacity={0.35} />
      {/* Short spoon handle — short enough not to read as a spanner shaft */}
      <Path d="M16.7 8.15 L20.2 4.2" stroke={color} strokeWidth={2.05} strokeLinecap="round" />
      {/* Handle tip nub */}
      <Ellipse cx="20.35" cy="4.05" rx="0.95" ry="0.7" fill={color} />
    </Svg>
  );
}
