import React, { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  PixelRatio,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Svg, { ClipPath, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Colors } from '../../theme/colors';
import { resultEmeraldTone, resultHeroFace, resultPresentation } from '../../theme/resultPresentation';
import { heroArrangement } from './heroArrangement';
import { DOG_EAR_FOLD, dogEarCut } from './emerald/dogEar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO = resultPresentation.emerald.hero;

function n(value: number) {
  return (Math.round(value * 10) / 10).toString();
}

function accentBand(width: number, height: number) {
  return [
    `M${n(width)} ${n(height * 0.58)}`,
    `C${n(width * 0.84)} ${n(height * 0.7)} ${n(width * 0.68)} ${n(height * 0.84)} ${n(width * 0.46)} ${n(height)}`,
    `L${n(width)} ${n(height)}`,
    'Z',
  ].join(' ');
}

function longestWord(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .reduce((best, part) => (part.length > best.length ? part : best), '');
}

/** Card face + cut corner underlay only — peel is drawn above content so it can sit over the name. */
function HeroSurface({ width, height, dark }: { width: number; height: number; dark: boolean }) {
  const face = resultHeroFace(dark);
  const prefix = dark ? 'hero-d' : 'hero-l';
  const fold = Math.max(HERO.fold, DOG_EAR_FOLD);
  const radius = HERO.radius;
  if (width < 8 || height < 8) return null;
  const { face: surface } = dogEarCut(width, height, radius, fold);
  return (
    <Svg width={width} height={height} pointerEvents="none">
      <Defs>
        <ClipPath id={`${prefix}-card`}>
          <Rect x="0" y="0" width={width} height={height} rx={radius} />
        </ClipPath>
        <ClipPath id={`${prefix}-face`}>
          <Path d={surface} />
        </ClipPath>
        <LinearGradient id={`${prefix}-mint`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0" stopColor={face.gradient[0]} />
          <Stop offset="1" stopColor={face.gradient[1]} />
        </LinearGradient>
        <RadialGradient id={`${prefix}-accent`} cx="100%" cy="100%" rx="52%" ry="68%" fx="100%" fy="100%">
          <Stop offset="0" stopColor={face.accent} stopOpacity={dark ? 0.42 : 0.24} />
          <Stop offset="0.55" stopColor={face.accent} stopOpacity={dark ? 0.16 : 0.1} />
          <Stop offset="1" stopColor={face.accent} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} rx={radius} fill={face.foldBack} clipPath={`url(#${prefix}-card)`} />
      <Path d={surface} fill={`url(#${prefix}-mint)`} />
      <Rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill={`url(#${prefix}-accent)`}
        clipPath={`url(#${prefix}-face)`}
      />
      <Path d={accentBand(width, height)} fill={face.accent} opacity={dark ? 0.28 : 0.22} clipPath={`url(#${prefix}-face)`} />
    </Svg>
  );
}

/** Dog-ear peel drawn above brand/name so text never paints over the fold. */
function HeroDogEarPeel({ width, height, dark }: { width: number; height: number; dark: boolean }) {
  const face = resultHeroFace(dark);
  const prefix = dark ? 'hero-peel-d' : 'hero-peel-l';
  const fold = Math.max(HERO.fold, DOG_EAR_FOLD);
  const radius = HERO.radius;
  if (width < 8 || height < 8) return null;
  const { cutX, flap, cast, crease } = dogEarCut(width, height, radius, fold);
  return (
    <Svg width={width} height={height} pointerEvents="none">
      <Defs>
        <LinearGradient id={`${prefix}-fold`} x1="0%" y1="0%" x2="80%" y2="100%">
          <Stop offset="0" stopColor={face.foldFace[0]} />
          <Stop offset="1" stopColor={face.foldFace[1]} />
        </LinearGradient>
        <LinearGradient id={`${prefix}-shadow`} x1="80%" y1="10%" x2="40%" y2="70%">
          <Stop offset="0" stopColor="#000000" stopOpacity={dark ? 0.82 : 0.7} />
          <Stop offset="0.4" stopColor="#041510" stopOpacity={dark ? 0.55 : 0.48} />
          <Stop offset="1" stopColor="#0C3227" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={cast} fill="#000000" opacity={0.55} transform={`translate(${n(cutX)} 0)`} />
      <Path d={flap} fill="#000000" opacity={0.32} transform={`translate(${n(cutX - 8)} 16)`} />
      <Path d={flap} fill={`url(#${prefix}-shadow)`} opacity={0.7} transform={`translate(${n(cutX - 6)} 11)`} />
      <Path d={flap} fill={`url(#${prefix}-shadow)`} opacity={0.9} transform={`translate(${n(cutX - 3)} 6)`} />
      <Path d={flap} fill={`url(#${prefix}-shadow)`} opacity={1} transform={`translate(${n(cutX - 1.5)} 3)`} />
      <Path d={flap} fill={`url(#${prefix}-fold)`} transform={`translate(${n(cutX)} 0)`} />
      <Path d={crease} fill="none" stroke="#041510" strokeWidth="2.4" strokeOpacity="0.35" />
      <Path d={crease} fill="none" stroke="#FFFFFF" strokeWidth="1.4" strokeOpacity="0.9" />
    </Svg>
  );
}

export interface ProductHeroSectionProps {
  colors: Colors;
  darkMode: boolean;
  imageUrl?: string | null;
  productName: string;
  brandText?: string | null;
  isUserContributed: boolean;
  onTakePhoto: () => void;
  /** i18n */
  takePhotoLabel: string;
  userContributedLabel: string;
  heroImageA11y: string;
  expandHint: string;
  loadErrorLabel: string;
  retryLabel: string;
  closeLightboxLabel: string;
  onDisplayed?: () => void;
  /** Result-owned favourite and share controls. */
  actions?: ReactNode;
}

function ProductImageLightbox({
  visible,
  uri,
  onClose,
  closeLabel,
}: {
  visible: boolean;
  uri: string;
  onClose: () => void;
  closeLabel: string;
}) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const pinchStartScale = useSharedValue(1);

  useEffect(() => {
    if (!visible) {
      scale.value = 1;
      pinchStartScale.value = 1;
    }
  }, [visible]);

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      pinchStartScale.value = scale.value;
    })
    .onUpdate((e) => {
      const next = pinchStartScale.value * e.scale;
      scale.value = Math.min(Math.max(next, 1), 4);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
      pinchStartScale.value = 1;
    });

  const composed = Gesture.Simultaneous(pinchGesture, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" />
      <GestureHandlerRootView style={styles.lightboxRoot}>
        <View style={[styles.lightboxHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.lightboxCloseBtn}
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name={resultPresentation.icons.close} size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>
        <GestureDetector gesture={composed}>
          <Animated.View style={[styles.lightboxImageWrap, animatedStyle]}>
            <ExpoImage
              source={{ uri }}
              style={styles.lightboxImage}
              contentFit="contain"
              transition={200}
              cachePolicy="memory-disk"
            />
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

export default function ProductHeroSection({
  colors,
  darkMode,
  imageUrl,
  productName,
  brandText,
  isUserContributed,
  onTakePhoto,
  takePhotoLabel,
  userContributedLabel,
  heroImageA11y,
  expandHint,
  loadErrorLabel,
  retryLabel,
  closeLightboxLabel,
  onDisplayed,
  actions,
}: ProductHeroSectionProps) {
  const { width: windowWidth, fontScale: windowFontScale } = useWindowDimensions();
  const fontScale = Math.max(windowFontScale, PixelRatio.getFontScale());
  const [cardWidth, setCardWidth] = useState(Math.max(0, windowWidth - resultPresentation.emerald.space.page * 2));
  const [surface, setSurface] = useState({ w: 0, h: 0 });
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>(() =>
    imageUrl?.trim() ? 'loading' : 'idle'
  );
  const [retryNonce, setRetryNonce] = useState(0);
  const [lightboxVisible, setLightboxVisible] = useState(false);

  const hasUrl = !!(imageUrl && imageUrl.trim());
  const imageKey = `${imageUrl ?? ''}:${retryNonce}`;
  const [trackedImageKey, setTrackedImageKey] = useState(imageKey);
  if (trackedImageKey !== imageKey) {
    setTrackedImageKey(imageKey);
    setLoadState(hasUrl ? 'loading' : 'idle');
  }

  const tone = resultEmeraldTone(darkMode);
  const face = resultHeroFace(darkMode);
  const laid = heroArrangement({
    cardWidth: cardWidth || windowWidth - resultPresentation.emerald.space.page * 2,
    fontScale,
    pad: HERO.pad,
    gap: HERO.gap,
    photoWidth: HERO.photo.width,
    photoHeight: HERO.photo.height,
    photoMinWidth: HERO.photo.minWidth,
    textMin: HERO.textMin,
    stackFontScale: HERO.stackFontScale,
  });
  const innerW = Math.max(0, laid.photoW - HERO.photo.inset * 2);
  const innerH = Math.max(0, laid.photoH - HERO.photo.inset * 2);

  const openLightbox = useCallback(() => {
    if (hasUrl && loadState === 'loaded') {
      setLightboxVisible(true);
    }
  }, [hasUrl, loadState]);

  const handleRetry = useCallback(() => {
    setRetryNonce((n) => n + 1);
    setLoadState('loading');
  }, []);

  const photo = (
    <View
      style={[
        styles.photo,
        {
          width: laid.photoW,
          height: laid.photoH,
          backgroundColor: face.photo,
          borderRadius: HERO.photo.radius,
          padding: HERO.photo.inset,
        },
      ]}
    >
      {!hasUrl ? (
        <TouchableOpacity
          style={[styles.photoFill, { width: innerW, height: innerH }]}
          onPress={onTakePhoto}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={takePhotoLabel}
        >
          <Ionicons name={resultPresentation.icons.capture} size={28} color={face.action} />
        </TouchableOpacity>
      ) : loadState === 'error' ? (
        <View style={[styles.photoFill, { width: innerW, height: innerH }]} accessibilityLabel={loadErrorLabel}>
          <Ionicons name={resultPresentation.icons.imageError} size={26} color={tone.muted} />
        </View>
      ) : (
        <Pressable
          onPress={openLightbox}
          disabled={loadState !== 'loaded'}
          style={[styles.photoFill, { width: innerW, height: innerH }]}
          accessibilityRole="imagebutton"
          accessibilityLabel={heroImageA11y}
          accessibilityHint={expandHint}
        >
          {loadState === 'loading' && (
            <View style={[styles.skeletonOverlay, { backgroundColor: face.photo }]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
          <ExpoImage
            key={`${imageUrl}-${retryNonce}`}
            source={{ uri: imageUrl! }}
            style={[styles.heroImage, { width: innerW, height: innerH }]}
            contentFit="contain"
            transition={280}
            cachePolicy="memory-disk"
            onLoad={() => {
              setLoadState('loaded');
              onDisplayed?.();
            }}
            onError={() => setLoadState('error')}
          />
        </Pressable>
      )}
    </View>
  );

  /** Same proud rim as EmeraldScoreFrame. */
  const rim = darkMode ? '#8ADCC7' : '#074F42';
  const fold = Math.max(HERO.fold, DOG_EAR_FOLD);
  // Peel draws above copy, so text may tuck slightly under the ear. Keep a light
  // inset so glyphs don't start under the crease; do not reserve the full fold.
  const foldClearance = Math.round(fold * 0.28);
  const nameProbe = useMemo(() => longestWord(productName), [productName]);
  const [copyWidth, setCopyWidth] = useState(0);
  const [nameSize, setNameSize] = useState<number>(HERO.type.name);
  const nameMin = Math.round(HERO.type.name * 0.5);
  const nameContentWidth = Math.max(0, copyWidth - foldClearance);

  useEffect(() => {
    setNameSize(HERO.type.name);
  }, [productName, copyWidth, laid.textW]);

  const nameLineHeight = Math.round(nameSize * (HERO.type.nameLine / HERO.type.name));

  const shrinkNameIfWordSplit = useCallback(
    (lines: readonly { text: string }[]) => {
      if (!lines || lines.length < 2 || nameSize <= nameMin) return;
      for (let i = 0; i < lines.length - 1; i++) {
        const end = lines[i]?.text ?? '';
        const next = lines[i + 1]?.text ?? '';
        if (!end || !next) continue;
        const endCh = end[end.length - 1];
        const nextCh = next[0];
        // Letter/digit into letter/digit across a line = a single word was split.
        if (/[0-9A-Za-zÀ-ÿ]/.test(endCh) && /[0-9A-Za-zÀ-ÿ]/.test(nextCh)) {
          setNameSize((size) => Math.max(nameMin, size - 1));
          return;
        }
      }
    },
    [nameMin, nameSize]
  );

  return (
    <View
      style={styles.heroStrip}
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        if (next > 0 && Math.abs(next - cardWidth) > 0.5) setCardWidth(next);
      }}
    >
      <View
        style={[
          styles.shadowWrap,
          {
            shadowOpacity: darkMode ? 0.28 : 0.11,
            backgroundColor: face.gradient[0],
          },
        ]}
      >
        <View
          style={[styles.surface, { borderColor: rim }]}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            if (width > 0 && height > 0 && (Math.abs(width - surface.w) > 0.5 || Math.abs(height - surface.h) > 0.5)) {
              setSurface({ w: width, h: height });
            }
          }}
        >
          <View
            pointerEvents="none"
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={StyleSheet.absoluteFill}
          >
            <HeroSurface width={surface.w} height={surface.h} dark={darkMode} />
          </View>
          <View style={[styles.body, laid.stack ? styles.bodyStack : styles.bodyRow]}>
            {photo}
            <View
              style={[
                styles.copy,
                {
                  flexGrow: laid.stack ? 0 : 1,
                  // Keep brand/name clear of the top-right fold; peel may still sit above slightly.
                  paddingRight: foldClearance,
                },
              ]}
              onLayout={(event) => {
                const next = event.nativeEvent.layout.width;
                if (next > 0 && Math.abs(next - copyWidth) > 0.5) setCopyWidth(next);
              }}
            >
              {nameProbe ? (
                <Text
                  pointerEvents="none"
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                  style={[styles.nameProbe, { fontSize: nameSize, fontWeight: '700' }]}
                  onLayout={(event) => {
                    const avail = nameContentWidth || Math.max(0, laid.textW - foldClearance);
                    if (event.nativeEvent.layout.width > avail + 0.5 && nameSize > nameMin) {
                      setNameSize((size) => Math.max(nameMin, size - 1));
                    }
                  }}
                >
                  {nameProbe}
                </Text>
              ) : null}
              {brandText ? (
                <Text style={[styles.brand, { color: face.action }]} numberOfLines={1} ellipsizeMode="tail">
                  {brandText}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.productName,
                  {
                    color: face.name,
                    marginTop: brandText ? HERO.type.nameGap : 0,
                    fontSize: nameSize,
                    lineHeight: nameLineHeight,
                  },
                ]}
                {...(Platform.OS === 'android'
                  ? { textBreakStrategy: 'simple' as const, android_hyphenationFrequency: 'none' as const }
                  : {})}
                onTextLayout={(event) => shrinkNameIfWordSplit(event.nativeEvent.lines)}
              >
                {productName}
              </Text>
              {actions ? <View style={styles.actions}>{actions}</View> : null}
              {!hasUrl ? (
                <TouchableOpacity
                  onPress={onTakePhoto}
                  accessibilityRole="button"
                  accessibilityLabel={takePhotoLabel}
                  style={styles.captureLabelHit}
                >
                  <Text style={[styles.captureImageText, { color: face.action }]}>{takePhotoLabel}</Text>
                </TouchableOpacity>
              ) : null}
              {isUserContributed && (
                <View
                  style={[
                    styles.userContributedBadge,
                    { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                  ]}
                >
                  <Ionicons name={resultPresentation.icons.contributed} size={14} color={colors.primary} />
                  <Text style={[styles.userContributedText, { color: colors.primary }]}>{userContributedLabel}</Text>
                </View>
              )}
              {hasUrl && loadState === 'error' ? (
                <View>
                  <Text style={[styles.errorText, { color: tone.muted }]}>{loadErrorLabel}</Text>
                  <View style={styles.errorActions}>
                    <TouchableOpacity
                      onPress={handleRetry}
                      style={[styles.retryBtn, { borderColor: face.action }]}
                      accessibilityRole="button"
                      accessibilityLabel={retryLabel}
                    >
                      <Text style={[styles.retryBtnText, { color: face.action }]}>{retryLabel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={onTakePhoto}
                      style={[styles.retryBtn, { borderColor: tone.line }]}
                      accessibilityRole="button"
                      accessibilityLabel={takePhotoLabel}
                    >
                      <Text style={[styles.retryBtnText, { color: face.name }]}>{takePhotoLabel}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
          <View
            pointerEvents="none"
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={styles.peelOverlay}
          >
            <HeroDogEarPeel width={surface.w} height={surface.h} dark={darkMode} />
          </View>
        </View>
      </View>

      {hasUrl && imageUrl ? (
        <ProductImageLightbox
          visible={lightboxVisible}
          uri={imageUrl}
          onClose={() => setLightboxVisible(false)}
          closeLabel={closeLightboxLabel}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heroStrip: {
    marginHorizontal: resultPresentation.emerald.space.page,
    marginBottom: HERO.below,
  },
  shadowWrap: {
    borderRadius: HERO.radius,
    shadowColor: '#0C4A3C',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  surface: {
    borderRadius: HERO.radius,
    borderWidth: 4,
    overflow: 'hidden',
    padding: HERO.pad,
  },
  body: {
    gap: HERO.gap,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bodyStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  nameProbe: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    top: 0,
    fontWeight: '700',
  },
  peelOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  photo: {
    overflow: 'hidden',
  },
  photoFill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {},
  actions: {
    marginTop: HERO.type.actionGap,
    alignSelf: 'flex-start',
  },
  captureLabelHit: {
    alignSelf: 'flex-start',
    minHeight: resultPresentation.tap.min,
    justifyContent: 'center',
    marginTop: 4,
  },
  captureImageText: {
    fontSize: resultPresentation.type.meta,
    fontWeight: '700',
  },
  errorText: {
    fontSize: resultPresentation.type.meta,
    marginTop: 8,
  },
  errorActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  retryBtn: {
    minHeight: resultPresentation.tap.min,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: resultPresentation.radius.chip,
    borderWidth: 1,
    justifyContent: 'center',
  },
  retryBtnText: {
    fontSize: resultPresentation.type.meta,
    fontWeight: '700',
  },
  productName: {
    fontSize: HERO.type.name,
    fontWeight: '700',
    lineHeight: HERO.type.nameLine,
  },
  userContributedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: resultPresentation.radius.chip,
    borderWidth: 1,
    gap: 4,
    marginTop: 8,
  },
  userContributedText: {
    fontSize: resultPresentation.type.meta,
    fontWeight: '600',
  },
  brand: {
    fontSize: HERO.type.brand,
    lineHeight: HERO.type.brandLine,
    fontWeight: '700',
    letterSpacing: HERO.type.brandTracking,
    textTransform: 'uppercase',
  },
  lightboxRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  lightboxHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  lightboxCloseBtn: {
    padding: 8,
  },
  lightboxImageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  lightboxImage: {
    width: SCREEN_WIDTH - 24,
    height: SCREEN_HEIGHT * 0.72,
  },
});
