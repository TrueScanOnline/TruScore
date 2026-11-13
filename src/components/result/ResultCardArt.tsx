/**
 * W5-CARD-ART — decoration-only Result card backgrounds.
 * Non-interactive. No product text, scores, or governed meaning.
 * Prominence intentionally ~20–35% of Product Origins panels.
 */

import React, { useId, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

export type ResultCardArtMotif =
  | 'molecular'
  | 'paper'
  | 'nutrition'
  | 'ingredients'
  | 'discovery'
  | 'scoreAura'
  | 'heroGlow'
  | 'alertsSoft'
  | 'processing'
  | 'limitations'
  | 'insights';

type Props = {
  motif: ResultCardArtMotif;
  darkMode?: boolean;
  /** 0–1 opacity multiplier for restraint (default 1). */
  intensity?: number;
  borderRadius?: number;
};

function MotifSvg({
  motif,
  w,
  h,
  darkMode,
  intensity,
  uid,
}: {
  motif: ResultCardArtMotif;
  w: number;
  h: number;
  darkMode: boolean;
  intensity: number;
  uid: string;
}) {
  const a = (v: number) => Math.max(0, Math.min(1, v * intensity));

  if (motif === 'molecular') {
    // Subtle additive-inspired wash: pale sage/cream arcs + soft nodes (not a loud connect-the-dots diagram).
    const stroke = darkMode ? 'rgba(180,220,210,0.14)' : 'rgba(8,123,104,0.09)';
    const strokeSoft = darkMode ? 'rgba(180,220,210,0.08)' : 'rgba(14,138,116,0.06)';
    const node = darkMode ? 'rgba(180,220,210,0.12)' : 'rgba(8,123,104,0.07)';
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id={`${uid}-mol`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={darkMode ? '#1A322E' : '#FBF9F3'} stopOpacity={a(0.95)} />
            <Stop offset="45%" stopColor={darkMode ? '#1F3A35' : '#EEF6F2'} stopOpacity={a(0.7)} />
            <Stop offset="100%" stopColor={darkMode ? '#17302C' : '#E4F0EB'} stopOpacity={a(0.5)} />
          </LinearGradient>
          <RadialGradient id={`${uid}-molGlow`} cx="78%" cy="28%" r="55%">
            <Stop offset="0%" stopColor={darkMode ? '#2A4A44' : '#D7EBE3'} stopOpacity={a(0.35)} />
            <Stop offset="100%" stopColor={darkMode ? '#1A322E' : '#FBF9F3'} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={h} fill={`url(#${uid}-mol)`} />
        <Rect x={0} y={0} width={w} height={h} fill={`url(#${uid}-molGlow)`} />
        <G opacity={a(0.85)}>
          <Path
            d={`M ${w * 0.58} ${h * 0.08} C ${w * 0.72} ${h * 0.18}, ${w * 0.8} ${h * 0.12}, ${w * 0.98} ${h * 0.28}`}
            fill="none"
            stroke={stroke}
            strokeWidth={1.1}
          />
          <Path
            d={`M ${w * 0.64} ${h * 0.02} C ${w * 0.78} ${h * 0.22}, ${w * 0.9} ${h * 0.2}, ${w * 1.02} ${h * 0.4}`}
            fill="none"
            stroke={strokeSoft}
            strokeWidth={1}
          />
          <Path
            d={`M ${w * 0.7} ${h * 0.55} C ${w * 0.82} ${h * 0.48}, ${w * 0.92} ${h * 0.62}, ${w * 1.02} ${h * 0.72}`}
            fill="none"
            stroke={strokeSoft}
            strokeWidth={1}
          />
          <Circle cx={w * 0.78} cy={h * 0.2} r={2.1} fill={node} />
          <Circle cx={w * 0.9} cy={h * 0.32} r={1.7} fill={node} />
          <Circle cx={w * 0.84} cy={h * 0.62} r={1.9} fill={node} />
          <Ellipse
            cx={w * 0.92}
            cy={h * 0.48}
            rx={18}
            ry={11}
            fill="none"
            stroke={strokeSoft}
            strokeWidth={0.9}
          />
        </G>
      </Svg>
    );
  }

  if (motif === 'paper') {
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id={`${uid}-paper`} x1="0%" y1="0%" x2="90%" y2="100%">
            <Stop offset="0%" stopColor={darkMode ? '#1E3A34' : '#F7FFFC'} stopOpacity={a(1)} />
            <Stop offset="50%" stopColor={darkMode ? '#234840' : '#E7F7F0'} stopOpacity={a(0.75)} />
            <Stop offset="100%" stopColor={darkMode ? '#1A332E' : '#D8F0E6'} stopOpacity={a(0.55)} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={h} fill={`url(#${uid}-paper)`} />
        <Path
          d={`M ${w * 0.62} ${-4} H ${w + 4} V ${h * 0.42} C ${w * 0.86} ${h * 0.28}, ${w * 0.74} ${h * 0.12}, ${w * 0.62} ${-4} Z`}
          fill={darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)'}
          opacity={a(1)}
        />
        <Path
          d={`M ${w * 0.7} ${h * 0.55} H ${w + 6} V ${h + 4} H ${w * 0.55} C ${w * 0.68} ${h * 0.82}, ${w * 0.78} ${h * 0.68}, ${w * 0.7} ${h * 0.55} Z`}
          fill={darkMode ? 'rgba(39,184,153,0.18)' : 'rgba(8,123,104,0.1)'}
          opacity={a(1)}
        />
        <Rect
          x={w * 0.78}
          y={h * 0.12}
          width={w * 0.28}
          height={h * 0.34}
          rx={6}
          fill="none"
          stroke={darkMode ? 'rgba(201,231,223,0.28)' : 'rgba(8,123,104,0.16)'}
          strokeWidth={1.2}
          strokeDasharray="3 3"
          opacity={a(0.9)}
        />
      </Svg>
    );
  }

  if (motif === 'nutrition') {
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id={`${uid}-nut`} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={darkMode ? '#1A322E' : '#FFFFFF'} stopOpacity={a(0.95)} />
            <Stop offset="100%" stopColor={darkMode ? '#1F3A35' : '#F2FAF7'} stopOpacity={a(0.7)} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={h} fill={`url(#${uid}-nut)`} />
        {[0.18, 0.34, 0.5, 0.66, 0.82].map((y, i) => (
          <Line
            key={i}
            x1={w * 0.62}
            y1={h * y}
            x2={w * 0.96}
            y2={h * y}
            stroke={darkMode ? 'rgba(201,231,223,0.14)' : 'rgba(8,123,104,0.1)'}
            strokeWidth={1}
            opacity={a(1)}
          />
        ))}
        <Path
          d={`M ${w * 0.78} ${h * 0.08} V ${h * 0.92}`}
          stroke={darkMode ? 'rgba(201,231,223,0.12)' : 'rgba(8,123,104,0.08)'}
          strokeWidth={1}
          opacity={a(1)}
        />
      </Svg>
    );
  }

  if (motif === 'ingredients') {
    // Keep linework in the top-right only so it never crosses Processing Level / NOVA labels
    // that share this tall Ingredients card on Android (SVG can paint above siblings).
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id={`${uid}-ing`} x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={darkMode ? '#1C3832' : '#F5FBF8'} stopOpacity={a(0.9)} />
            <Stop offset="100%" stopColor={darkMode ? '#16302B' : '#EAF6F1'} stopOpacity={a(0.55)} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={h} fill={`url(#${uid}-ing)`} />
        <Path
          d={`M ${w * 0.72} ${h * 0.02} C ${w * 0.82} ${h * 0.1}, ${w * 0.9} ${h * 0.08}, ${w * 1.02} ${h * 0.16}`}
          fill="none"
          stroke={darkMode ? 'rgba(201,231,223,0.22)' : 'rgba(8,123,104,0.16)'}
          strokeWidth={1.4}
          opacity={a(1)}
        />
        <Path
          d={`M ${w * 0.78} ${h * 0.0} C ${w * 0.88} ${h * 0.12}, ${w * 0.95} ${h * 0.1}, ${w * 1.04} ${h * 0.22}`}
          fill="none"
          stroke={darkMode ? 'rgba(201,231,223,0.16)' : 'rgba(8,123,104,0.12)'}
          strokeWidth={1.1}
          opacity={a(1)}
        />
        <Circle
          cx={w * 0.9}
          cy={h * 0.12}
          r={22}
          fill="none"
          stroke={darkMode ? 'rgba(201,231,223,0.12)' : 'rgba(8,123,104,0.1)'}
          strokeWidth={1}
          opacity={a(1)}
        />
      </Svg>
    );
  }

  if (motif === 'discovery') {
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <RadialGradient id={`${uid}-disc`} cx="88%" cy="18%" rx="42%" ry="38%">
            <Stop offset="0%" stopColor={darkMode ? '#2A5A4E' : '#D9F5EC'} stopOpacity={a(0.7)} />
            <Stop offset="100%" stopColor={darkMode ? '#1A322E' : '#FFFFFF'} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={h} fill={darkMode ? '#1A322E' : '#FBFFFD'} fillOpacity={a(0.35)} />
        <Rect x={0} y={0} width={w} height={h} fill={`url(#${uid}-disc)`} />
        <Circle cx={w * 0.9} cy={h * 0.16} r={3} fill={darkMode ? 'rgba(201,231,223,0.45)' : 'rgba(8,123,104,0.28)'} opacity={a(1)} />
        <Circle cx={w * 0.82} cy={h * 0.28} r={2} fill={darkMode ? 'rgba(201,231,223,0.35)' : 'rgba(8,123,104,0.22)'} opacity={a(1)} />
        <Circle cx={w * 0.94} cy={h * 0.34} r={1.6} fill={darkMode ? 'rgba(201,231,223,0.3)' : 'rgba(8,123,104,0.18)'} opacity={a(1)} />
        <Path
          d={`M ${w * 0.78} ${h * 0.12} Q ${w * 0.88} ${h * 0.22} ${w * 0.96} ${h * 0.18}`}
          fill="none"
          stroke={darkMode ? 'rgba(201,231,223,0.2)' : 'rgba(8,123,104,0.14)'}
          strokeWidth={1}
          opacity={a(1)}
        />
      </Svg>
    );
  }

  if (motif === 'scoreAura') {
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <RadialGradient id={`${uid}-aura`} cx="50%" cy="42%" rx="48%" ry="42%">
            <Stop offset="0%" stopColor={darkMode ? '#2A5A4E' : '#E8FFF7'} stopOpacity={a(0.55)} />
            <Stop offset="55%" stopColor={darkMode ? '#1A322E' : '#F7FFFC'} stopOpacity={a(0.2)} />
            <Stop offset="100%" stopColor={darkMode ? '#142824' : '#FFFFFF'} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={h} fill={`url(#${uid}-aura)`} />
        <Ellipse
          cx={w * 0.5}
          cy={h * 0.4}
          rx={w * 0.28}
          ry={w * 0.28}
          fill="none"
          stroke={darkMode ? 'rgba(201,231,223,0.16)' : 'rgba(8,123,104,0.12)'}
          strokeWidth={1}
          opacity={a(1)}
        />
        <Ellipse
          cx={w * 0.5}
          cy={h * 0.4}
          rx={w * 0.38}
          ry={w * 0.38}
          fill="none"
          stroke={darkMode ? 'rgba(201,231,223,0.1)' : 'rgba(8,123,104,0.08)'}
          strokeWidth={1}
          strokeDasharray="2 4"
          opacity={a(1)}
        />
      </Svg>
    );
  }

  if (motif === 'heroGlow') {
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <RadialGradient id={`${uid}-hero`} cx="28%" cy="35%" rx="55%" ry="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={a(darkMode ? 0.12 : 0.45)} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={h} fill={`url(#${uid}-hero)`} />
        <Path
          d={`M ${w * 0.55} ${h + 4} C ${w * 0.72} ${h * 0.7}, ${w * 0.88} ${h * 0.78}, ${w + 4} ${h * 0.45} V ${h + 4} Z`}
          fill={darkMode ? 'rgba(39,184,153,0.18)' : 'rgba(8,123,104,0.1)'}
          opacity={a(1)}
        />
      </Svg>
    );
  }

  if (motif === 'processing') {
    // Soft industrial arcs — kept to the right so NOVA labels stay clear.
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id={`${uid}-proc`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={darkMode ? '#1A322E' : '#FFFFFF'} stopOpacity={a(0.55)} />
            <Stop offset="100%" stopColor={darkMode ? '#243832' : '#F4FAF7'} stopOpacity={a(0.4)} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={h} fill={`url(#${uid}-proc)`} />
        <Circle
          cx={w * 0.92}
          cy={h * 0.55}
          r={Math.min(42, h * 0.42)}
          fill="none"
          stroke={darkMode ? 'rgba(201,231,223,0.14)' : 'rgba(8,123,104,0.1)'}
          strokeWidth={1.2}
          opacity={a(1)}
        />
        <Circle
          cx={w * 0.92}
          cy={h * 0.55}
          r={Math.min(28, h * 0.28)}
          fill="none"
          stroke={darkMode ? 'rgba(201,231,223,0.1)' : 'rgba(8,123,104,0.08)'}
          strokeWidth={1}
          strokeDasharray="3 4"
          opacity={a(1)}
        />
      </Svg>
    );
  }

  if (motif === 'limitations') {
    // Quiet document lines — information / limitations surface.
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id={`${uid}-lim`} x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={darkMode ? '#1C3832' : '#F7FFFC'} stopOpacity={a(0.7)} />
            <Stop offset="100%" stopColor={darkMode ? '#16302B' : '#EEF8F3'} stopOpacity={a(0.4)} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={h} fill={`url(#${uid}-lim)`} />
        {[0.28, 0.42, 0.56, 0.7].map((y, i) => (
          <Line
            key={i}
            x1={w * 0.68}
            y1={h * y}
            x2={w * 0.94}
            y2={h * y}
            stroke={darkMode ? 'rgba(201,231,223,0.12)' : 'rgba(8,123,104,0.09)'}
            strokeWidth={1}
            opacity={a(1)}
          />
        ))}
        <Rect
          x={w * 0.78}
          y={h * 0.14}
          width={w * 0.2}
          height={h * 0.12}
          rx={3}
          fill="none"
          stroke={darkMode ? 'rgba(201,231,223,0.14)' : 'rgba(8,123,104,0.1)'}
          strokeWidth={1}
          opacity={a(0.9)}
        />
      </Svg>
    );
  }

  if (motif === 'insights') {
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <RadialGradient id={`${uid}-ins`} cx="88%" cy="22%" rx="40%" ry="36%">
            <Stop offset="0%" stopColor={darkMode ? '#2A5A4E' : '#DDF6EC'} stopOpacity={a(0.55)} />
            <Stop offset="100%" stopColor={darkMode ? '#1A322E' : '#FFFFFF'} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={w} height={h} fill={darkMode ? '#1A322E' : '#FBFFFD'} fillOpacity={a(0.3)} />
        <Rect x={0} y={0} width={w} height={h} fill={`url(#${uid}-ins)`} />
        <Path
          d={`M ${w * 0.82} ${h * 0.18} C ${w * 0.86} ${h * 0.1}, ${w * 0.94} ${h * 0.1}, ${w * 0.96} ${h * 0.2} C ${w * 0.94} ${h * 0.32}, ${w * 0.86} ${h * 0.38}, ${w * 0.82} ${h * 0.46} C ${w * 0.78} ${h * 0.38}, ${w * 0.7} ${h * 0.32}, ${w * 0.68} ${h * 0.2} C ${w * 0.7} ${h * 0.1}, ${w * 0.78} ${h * 0.1}, ${w * 0.82} ${h * 0.18} Z`}
          fill={darkMode ? 'rgba(201,231,223,0.1)' : 'rgba(8,123,104,0.08)'}
          opacity={a(1)}
        />
      </Svg>
    );
  }

  // alertsSoft — Did You Know / soft notice wash
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <LinearGradient id={`${uid}-al`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={darkMode ? '#1A322E' : '#FFFFFF'} stopOpacity={a(0.5)} />
          <Stop offset="100%" stopColor={darkMode ? '#203832' : '#F3FAF7'} stopOpacity={a(0.35)} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={w} height={h} fill={`url(#${uid}-al)`} />
      <Circle cx={w * 0.9} cy={h * 0.2} r={36} fill={darkMode ? 'rgba(201,231,223,0.08)' : 'rgba(8,123,104,0.06)'} opacity={a(1)} />
      <Path
        d={`M ${w * 0.72} ${h * 0.08} Q ${w * 0.84} ${h * 0.2} ${w * 0.96} ${h * 0.14}`}
        fill="none"
        stroke={darkMode ? 'rgba(201,231,223,0.16)' : 'rgba(8,123,104,0.12)'}
        strokeWidth={1}
        opacity={a(1)}
      />
    </Svg>
  );
}

export default function ResultCardArt({
  motif,
  darkMode = false,
  intensity = 1,
  borderRadius = 20,
}: Props) {
  const uid = useId().replace(/:/g, '');
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.width) > 0.5 || Math.abs(height - size.height) > 0.5) {
      setSize({ width, height });
    }
  };

  return (
    <View
      pointerEvents="none"
      collapsable={false}
      style={[styles.host, { borderRadius }]}
      onLayout={onLayout}
    >
      {size.width > 0 && size.height > 0 ? (
        <MotifSvg
          motif={motif}
          w={size.width}
          h={size.height}
          darkMode={darkMode}
          intensity={intensity}
          uid={`${uid}-${motif}`}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    // Sit under content. Android needs elevation:0 here plus a compositing surface on content.
    zIndex: 0,
    ...Platform.select({
      android: { elevation: 0 },
      default: {},
    }),
  },
});
