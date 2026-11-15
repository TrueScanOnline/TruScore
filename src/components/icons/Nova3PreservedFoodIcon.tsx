/**
 * FM-01 — NOVA 3 header pictogram: simple preserve jar with lid off.
 * Presentation only. Does not affect NOVA classification or scoring.
 * Tuned for legibility at 24–26px in #FFA500. No SVG transforms (RN-SVG safe).
 */

import React from 'react';
import Svg, { Ellipse, Path } from 'react-native-svg';

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
      accessibilityLabel="Preserve jar with lid off"
    >
      {/* Jar body — rounded preserve silhouette */}
      <Path
        d="M6.2 9.1h11.6c.55 0 .98.42 1.02.97l.4 9.55c.05.85-.62 1.58-1.47 1.58H7.25c-.85 0-1.52-.73-1.47-1.58l.4-9.55c.04-.55.47-.97 1.02-.97z"
        fill={color}
        opacity={0.16}
        stroke={color}
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      {/* Open mouth / rim */}
      <Ellipse cx="12" cy="9.05" rx="5.85" ry="1.5" fill="none" stroke={color} strokeWidth={1.7} />
      {/* Preserve fill */}
      <Path
        d="M7.2 13.5h9.6l.22 5.15c.03.48-.35.87-.83.87H7.81c-.48 0-.86-.39-.83-.87L7.2 13.5z"
        fill={color}
        opacity={0.58}
      />
      <Ellipse cx="12" cy="13.65" rx="4.5" ry="1.05" fill={color} opacity={0.9} />
      {/* Lid off — separate piece above-right of the open mouth (no transform) */}
      <Path
        d="M9.1 4.85 L19.2 1.75 L19.85 3.95 L9.75 7.05 Z"
        fill={color}
      />
      {/* Lid knob / top cap */}
      <Path
        d="M11.15 3.55 L17.85 1.45 L18.25 2.85 L11.55 4.95 Z"
        fill={color}
      />
    </Svg>
  );
}
