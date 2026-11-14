/**
 * FM-01 — NOVA 3 header pictogram: preserved food in a jar/tin.
 * Presentation only. Does not affect NOVA classification or scoring.
 */

import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

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
      accessibilityLabel="Preserved food"
    >
      {/* Lid / seal */}
      <Rect x="7.5" y="2.5" width="9" height="2.2" rx="0.8" fill={color} opacity={0.95} />
      <Path
        d="M8.2 4.7h7.6c.7 0 1.2.4 1.3 1l.2 1.1H6.7l.2-1.1c.1-.6.6-1 1.3-1z"
        fill={color}
        opacity={0.85}
      />
      {/* Jar body */}
      <Path
        d="M6.6 7.2h10.8c.55 0 1 .4 1.05.95l.55 11.1c.05.9-.7 1.65-1.6 1.65H6.6c-.9 0-1.65-.75-1.6-1.65l.55-11.1c.05-.55.5-.95 1.05-.95z"
        fill={color}
        opacity={0.22}
        stroke={color}
        strokeWidth={1.35}
      />
      {/* Band label */}
      <Rect x="7.4" y="9.2" width="9.2" height="2.4" rx="0.6" fill={color} opacity={0.35} />
      {/* Vegetable elements inside */}
      <Ellipse cx="10.2" cy="14.6" rx="1.55" ry="1.15" fill={color} opacity={0.9} />
      <Ellipse cx="13.8" cy="15.4" rx="1.7" ry="1.25" fill={color} opacity={0.75} />
      <Circle cx="12" cy="13.3" r="1.05" fill={color} opacity={0.85} />
      <Path
        d="M10.2 13.4c-.15-.7.2-1.3.85-1.55M13.6 14.1c.1-.65.7-1.05 1.35-1.05"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
        opacity={0.9}
      />
    </Svg>
  );
}
