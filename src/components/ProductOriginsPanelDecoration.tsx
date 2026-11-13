/**
 * Decoration-only artwork for Product Origins Concept V2 panels.
 * Contains no product text, flags, countries, or percentages.
 */

import React, { useId, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

type Props = {
  width: number;
  height: number;
  darkMode?: boolean;
};

function dottedArcPath(cx: number, cy: number, rx: number, ry: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const steps = 28;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = startDeg + ((endDeg - startDeg) * i) / steps;
    const x = cx + rx * Math.cos(toRad(t));
    const y = cy + ry * Math.sin(toRad(t));
    d += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

export default function ProductOriginsPanelDecoration({ width, height, darkMode = false }: Props) {
  const uid = useId().replace(/:/g, '');
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);

  const palette = darkMode
    ? {
        mintTop: '#1A3F38',
        mintMid: '#164A40',
        aqua: '#1F8A78',
        deep: '#0E5C4E',
        stroke: 'rgba(220,255,245,0.28)',
        strokeSoft: 'rgba(220,255,245,0.16)',
        orbit: 'rgba(255,255,255,0.35)',
        waveDeep: '#0A6B5A',
        waveMid: '#14A88F',
        waveBright: '#5EEAD4',
        waveWhite: 'rgba(255,255,255,0.55)',
      }
    : {
        mintTop: '#F7FFFD',
        mintMid: '#CFF8EB',
        aqua: '#4FDFC4',
        deep: '#00B892',
        stroke: 'rgba(255,255,255,0.55)',
        strokeSoft: 'rgba(255,255,255,0.32)',
        orbit: 'rgba(255,255,255,0.7)',
        waveDeep: '#016B54',
        waveMid: '#00C49A',
        waveBright: '#7FFBE6',
        waveWhite: 'rgba(255,255,255,0.92)',
      };

  const globe = useMemo(() => {
    const cx = w * 0.74;
    const cy = h * 0.26;
    const r = Math.min(w, h) * 0.52;
    return { cx, cy, r };
  }, [w, h]);

  const orbit = useMemo(
    () => dottedArcPath(globe.cx, globe.cy, globe.r * 1.05, globe.r * 0.62, -35, 210),
    [globe]
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id={`${uid}-panel`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={darkMode ? 0 : 1} />
            <Stop offset="12%" stopColor={palette.mintTop} />
            <Stop offset="36%" stopColor={palette.mintMid} />
            <Stop offset="62%" stopColor={palette.aqua} stopOpacity="0.95" />
            <Stop offset="100%" stopColor={palette.deep} stopOpacity="0.95" />
          </LinearGradient>
          <RadialGradient id={`${uid}-glow`} cx="88%" cy="86%" rx="58%" ry="60%">
            <Stop offset="0%" stopColor="#B8FFFB" stopOpacity={darkMode ? 0.3 : 0.9} />
            <Stop offset="30%" stopColor="#00D9C8" stopOpacity={darkMode ? 0.28 : 0.7} />
            <Stop offset="100%" stopColor="#00B892" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={`${uid}-tl`} cx="12%" cy="10%" rx="42%" ry="38%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={darkMode ? 0.08 : 0.95} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id={`${uid}-sheen`} x1="8%" y1="0%" x2="65%" y2="70%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={darkMode ? 0.06 : 0.65} />
            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id={`${uid}-wave`} x1="40%" y1="30%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={palette.waveBright} stopOpacity="0.15" />
            <Stop offset="40%" stopColor={palette.waveMid} stopOpacity="0.75" />
            <Stop offset="100%" stopColor={palette.waveDeep} stopOpacity="0.95" />
          </LinearGradient>
        </Defs>

        <Path
          d={`M 22 0 H ${w - 22} Q ${w} 0 ${w} 22 V ${h - 22} Q ${w} ${h} ${w - 22} ${h} H 22 Q 0 ${h} 0 ${h - 22} V 22 Q 0 0 22 0 Z`}
          fill={`url(#${uid}-panel)`}
        />
        <Path
          d={`M 22 0 H ${w - 22} Q ${w} 0 ${w} 22 V ${h - 22} Q ${w} ${h} ${w - 22} ${h} H 22 Q 0 ${h} 0 ${h - 22} V 22 Q 0 0 22 0 Z`}
          fill={`url(#${uid}-glow)`}
        />
        <Path
          d={`M 22 0 H ${w - 22} Q ${w} 0 ${w} 22 V ${h - 22} Q ${w} ${h} ${w - 22} ${h} H 22 Q 0 ${h} 0 ${h - 22} V 22 Q 0 0 22 0 Z`}
          fill={`url(#${uid}-tl)`}
        />
        <Path
          d={`M 22 0 H ${w - 22} Q ${w} 0 ${w} 22 V ${h - 22} Q ${w} ${h} ${w - 22} ${h} H 22 Q 0 ${h} 0 ${h - 22} V 22 Q 0 0 22 0 Z`}
          fill={`url(#${uid}-sheen)`}
        />

        {/* Large globe — upper right (watermark weight) */}
        <G opacity={0.9}>
          <Circle
            cx={globe.cx}
            cy={globe.cy}
            r={globe.r}
            fill="none"
            stroke={palette.stroke}
            strokeWidth={0.9}
          />
          <Ellipse
            cx={globe.cx}
            cy={globe.cy}
            rx={globe.r * 0.38}
            ry={globe.r}
            fill="none"
            stroke={palette.strokeSoft}
            strokeWidth={0.75}
          />
          <Ellipse
            cx={globe.cx}
            cy={globe.cy}
            rx={globe.r * 0.72}
            ry={globe.r}
            fill="none"
            stroke={palette.strokeSoft}
            strokeWidth={0.7}
          />
          <Ellipse
            cx={globe.cx}
            cy={globe.cy - globe.r * 0.42}
            rx={globe.r * 0.72}
            ry={globe.r * 0.22}
            fill="none"
            stroke={palette.strokeSoft}
            strokeWidth={0.7}
          />
          <Ellipse
            cx={globe.cx}
            cy={globe.cy}
            rx={globe.r * 0.98}
            ry={globe.r * 0.34}
            fill="none"
            stroke={palette.stroke}
            strokeWidth={0.8}
          />
          <Ellipse
            cx={globe.cx}
            cy={globe.cy + globe.r * 0.4}
            rx={globe.r * 0.74}
            ry={globe.r * 0.24}
            fill="none"
            stroke={palette.strokeSoft}
            strokeWidth={0.7}
          />
          <Path
            d={orbit}
            fill="none"
            stroke={palette.orbit}
            strokeWidth={1.15}
            strokeDasharray="0.9 4.2"
            strokeLinecap="round"
            opacity={0.95}
          />
        </G>

        {/* Lower-right flowing accents — sharper layered swashes */}
        <G>
          <Path
            d={`M ${w * 0.38} ${h + 10}
                C ${w * 0.52} ${h * 0.68}, ${w * 0.68} ${h * 0.74}, ${w * 0.94} ${h * 0.48}
                C ${w * 1.08} ${h * 0.66}, ${w * 1.02} ${h * 1.08}, ${w * 0.58} ${h + 22}
                Z`}
            fill={`url(#${uid}-wave)`}
            opacity={0.98}
          />
          <Path
            d={`M ${w * 0.5} ${h + 8}
                C ${w * 0.66} ${h * 0.78}, ${w * 0.84} ${h * 0.84}, ${w * 1.05} ${h * 0.62}
                C ${w * 1.12} ${h * 0.88}, ${w * 0.92} ${h * 1.1}, ${w * 0.64} ${h + 16}
                Z`}
            fill={palette.waveDeep}
            opacity={0.7}
          />
          <Path
            d={`M ${w * 0.62} ${h + 4}
                C ${w * 0.78} ${h * 0.86}, ${w * 0.92} ${h * 0.9}, ${w * 1.08} ${h * 0.74}
                C ${w * 1.1} ${h * 0.95}, ${w * 0.95} ${h * 1.06}, ${w * 0.74} ${h + 10}
                Z`}
            fill={palette.waveMid}
            opacity={0.55}
          />
          <Path
            d={`M ${w * 0.44} ${h * 0.9}
                C ${w * 0.6} ${h * 0.74}, ${w * 0.8} ${h * 0.68}, ${w * 0.98} ${h * 0.5}`}
            fill="none"
            stroke={palette.waveWhite}
            strokeWidth={2.1}
            strokeLinecap="round"
            opacity={0.95}
          />
          <Path
            d={`M ${w * 0.52} ${h * 0.96}
                C ${w * 0.7} ${h * 0.82}, ${w * 0.88} ${h * 0.8}, ${w * 1.02} ${h * 0.66}`}
            fill="none"
            stroke={palette.waveBright}
            strokeWidth={1.7}
            strokeLinecap="round"
            opacity={0.9}
          />
          <Path
            d={`M ${w * 0.64} ${h * 1.0}
                C ${w * 0.8} ${h * 0.88}, ${w * 0.94} ${h * 0.88}, ${w * 1.06} ${h * 0.76}`}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.35}
            strokeLinecap="round"
            opacity={0.8}
          />
        </G>
      </Svg>
    </View>
  );
}
