/**
 * W5 Product Origins — Concept V2 declaration panel (presentation only).
 * Renders existing consumer line values; does not interpret origins or invent facts.
 */

import React, { useId, useMemo, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import CountryFlag from './CountryFlag';
import ProductOriginsPanelDecoration from './ProductOriginsPanelDecoration';
import { splitOriginContinuationForEmphasis } from '../origins/productOriginsCard';
import { resultEmeraldTone } from '../theme/resultPresentation';

type Props = {
  /** When omitted/empty, the V2 panel still renders (e.g. OFF country) without inventing a Made in/Product of ribbon. */
  statement?: string | null;
  country: string;
  continuation?: string | null;
  packWording?: string;
  darkMode?: boolean;
  /** OFF-only lockups were historically centred; declaration lines stay start-aligned. */
  flagAlign?: 'start' | 'center';
};

const RIBBON_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Made in': 'business-outline',
  'Product of': 'cube-outline',
  'Grown in': 'leaf-outline',
  'Packed in': 'archive-outline',
  'Ingredient from': 'nutrition-outline',
  'Processed in': 'construct-outline',
};

const RIBBON_HEIGHT = 36;
const RIBBON_TAIL = 20;

function OriginsRibbon({
  label,
  icon,
  darkMode,
  panelWidth,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  darkMode: boolean;
  panelWidth: number;
}) {
  const uid = useId().replace(/:/g, '');
  // Reference ribbons span ~50% of panel; keep content left, tip bright.
  const bodyW = panelWidth > 0 ? Math.round(Math.min(Math.max(panelWidth * 0.52, 168), panelWidth * 0.62)) : 180;
  const totalW = bodyW + RIBBON_TAIL;
  const midY = RIBBON_HEIGHT / 2;

  return (
    <View style={[styles.ribbonWrap, { width: totalW }]}>
      <Svg width={totalW} height={RIBBON_HEIGHT + 6} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <LinearGradient id={`${uid}-rib`} x1="0%" y1="50%" x2="100%" y2="50%">
            <Stop offset="0%" stopColor={darkMode ? '#084E43' : '#023C34'} />
            <Stop offset="28%" stopColor={darkMode ? '#0A6B5A' : '#056356'} />
            <Stop offset="55%" stopColor={darkMode ? '#0F9B84' : '#0B9F84'} />
            <Stop offset="78%" stopColor={darkMode ? '#2DD4BF' : '#2BE0C4'} />
            <Stop offset="100%" stopColor={darkMode ? '#99F6E4' : '#8AFFF0'} />
          </LinearGradient>
          <LinearGradient id={`${uid}-ribHi`} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.34" />
            <Stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.06" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
          </LinearGradient>
          <LinearGradient id={`${uid}-tip`} x1="0%" y1="0%" x2="100%" y2="50%">
            <Stop offset="0%" stopColor="#2BE0C4" stopOpacity="0.05" />
            <Stop offset="45%" stopColor="#7AFFE8" stopOpacity="0.55" />
            <Stop offset="100%" stopColor="#E6FFFB" stopOpacity="0.95" />
          </LinearGradient>
        </Defs>
        <Path
          d={`M 6 6 H ${bodyW + 2} L ${bodyW + RIBBON_TAIL + 2} ${midY + 4} L ${bodyW - 1} ${RIBBON_HEIGHT + 2} H 6 Q 1 ${RIBBON_HEIGHT + 2} 1 ${RIBBON_HEIGHT - 4} V 12 Q 1 6 6 6 Z`}
          fill="rgba(0,30,24,0.32)"
        />
        <Path
          d={`M 8 2 H ${bodyW} L ${bodyW + RIBBON_TAIL} ${midY} L ${bodyW} ${RIBBON_HEIGHT - 2} H 8 Q 2 ${RIBBON_HEIGHT - 2} 2 ${RIBBON_HEIGHT - 8} V 8 Q 2 2 8 2 Z`}
          fill={`url(#${uid}-rib)`}
        />
        <Path
          d={`M 8 2 H ${bodyW} L ${bodyW + RIBBON_TAIL} ${midY} L ${bodyW} ${RIBBON_HEIGHT - 2} H 8 Q 2 ${RIBBON_HEIGHT - 2} 2 ${RIBBON_HEIGHT - 8} V 8 Q 2 2 8 2 Z`}
          fill={`url(#${uid}-ribHi)`}
        />
        {/* Bright fold/tip accent near chevron */}
        <Path
          d={`M ${bodyW - 18} 3 H ${bodyW} L ${bodyW + RIBBON_TAIL} ${midY} L ${bodyW} ${RIBBON_HEIGHT - 3} H ${bodyW - 18} Z`}
          fill={`url(#${uid}-tip)`}
        />
        <Path
          d={`M 10 4.5 H ${bodyW - 22}`}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={1.3}
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.ribbonContent}>
        <Ionicons name={icon} size={16} color="#FFFFFF" />
        <Text style={styles.ribbonText} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {label}
        </Text>
      </View>
    </View>
  );
}

export default function ProductOriginsDeclarationPanel({
  statement,
  country,
  continuation = null,
  packWording,
  darkMode = false,
  flagAlign = 'start',
}: Props) {
  const emerald = resultEmeraldTone(darkMode);
  const { fontScale } = useWindowDimensions();
  const ribbonLabel = typeof statement === 'string' ? statement.trim() : '';
  const showRibbon = ribbonLabel.length > 0;
  const icon = (showRibbon ? RIBBON_ICON[ribbonLabel] : undefined) ?? 'earth-outline';
  const parts = useMemo(
    () => (continuation ? splitOriginContinuationForEmphasis(continuation) : null),
    [continuation]
  );
  const compact = fontScale > 1.2;
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.width) > 0.5 || Math.abs(height - size.height) > 0.5) {
      setSize({ width, height });
    }
  };

  return (
    <View
      style={[
        styles.shell,
        {
          shadowColor: darkMode ? '#000' : '#0A7A68',
        },
      ]}
    >
      <View
        onLayout={onLayout}
        style={[
          styles.panel,
          compact ? styles.panelCompact : null,
          !showRibbon ? styles.panelOffOnly : null,
          {
            borderColor: darkMode ? 'rgba(180,240,220,0.22)' : 'rgba(255,255,255,0.85)',
            backgroundColor: darkMode ? '#164A40' : '#E8FBF4',
          },
        ]}
      >
        {size.width > 0 && size.height > 0 ? (
          <ProductOriginsPanelDecoration width={size.width} height={size.height} darkMode={darkMode} />
        ) : null}

        {/* fine internal highlight ring */}
        <View
          pointerEvents="none"
          style={[
            styles.innerHighlight,
            { borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)' },
          ]}
        />

        {showRibbon ? (
          <OriginsRibbon label={ribbonLabel} icon={icon} darkMode={!!darkMode} panelWidth={size.width} />
        ) : null}

        <View style={styles.body}>
          <CountryFlag
            appearance="hero"
            align={flagAlign}
            nameColor={emerald.ink}
            country={country}
          />
          {parts ? (
            <Text style={[styles.continuation, { color: emerald.ink }]} maxFontSizeMultiplier={1.4}>
              {parts.prefix}
              {parts.emphasis ? <Text style={styles.continuationEmphasis}>{parts.emphasis}</Text> : null}
              {parts.suffix}
            </Text>
          ) : null}
          {packWording ? (
            <Text style={[styles.packWording, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
              {packWording}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginTop: 12,
    borderRadius: 22,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.16,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
      },
      android: {
        elevation: 5,
      },
      default: {},
    }),
  },
  panel: {
    borderRadius: 22,
    paddingTop: 14,
    paddingBottom: 18,
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1.25,
  },
  panelCompact: {
    paddingTop: 12,
    paddingBottom: 14,
  },
  panelOffOnly: {
    paddingTop: 18,
    paddingBottom: 18,
  },
  innerHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 21,
    borderWidth: 1,
    margin: 1,
  },
  ribbonWrap: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    marginLeft: -6,
    height: RIBBON_HEIGHT + 6,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#03352C',
        shadowOpacity: 0.28,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  ribbonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 28,
    paddingVertical: 7,
    alignSelf: 'flex-start',
    zIndex: 1,
    maxWidth: '78%',
  },
  ribbonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  body: {
    gap: 10,
    zIndex: 1,
    paddingRight: 8,
  },
  continuation: {
    fontSize: 15.5,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'left',
    letterSpacing: 0.1,
  },
  continuationEmphasis: {
    fontWeight: '800',
  },
  packWording: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
    textAlign: 'left',
  },
});
