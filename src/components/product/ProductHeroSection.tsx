import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Colors } from '../../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** ~84% of screen width — within the 72–88% “retail hero” band */
const STAGE_WIDTH = Math.min(Math.round(SCREEN_WIDTH * 0.84), SCREEN_WIDTH - 24);
const STAGE_MIN_HEIGHT = Math.round(Math.max(260, SCREEN_WIDTH * 0.58));
const STAGE_RADIUS = 22;

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
            <Ionicons name="close" size={28} color="#ffffff" />
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
}: ProductHeroSectionProps) {
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>(() =>
    imageUrl?.trim() ? 'loading' : 'idle'
  );
  const [retryNonce, setRetryNonce] = useState(0);
  const [lightboxVisible, setLightboxVisible] = useState(false);

  const hasUrl = !!(imageUrl && imageUrl.trim());

  useEffect(() => {
    if (hasUrl) {
      setLoadState('loading');
    } else {
      setLoadState('idle');
    }
  }, [hasUrl, imageUrl, retryNonce]);

  const gradientColors = useMemo((): [string, string, string] => {
    return darkMode
      ? ['#383838', '#2c2c2c', '#242424']
      : ['#fafcfd', '#f1f3f6', '#e9ecf1'];
  }, [darkMode]);

  const heroStripBg = darkMode ? '#181818' : '#f2f3f5';

  const stageBorder = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)';

  const openLightbox = useCallback(() => {
    if (hasUrl && loadState === 'loaded') {
      setLightboxVisible(true);
    }
  }, [hasUrl, loadState]);

  const handleRetry = useCallback(() => {
    setRetryNonce((n) => n + 1);
    setLoadState('loading');
  }, []);

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: darkMode ? 0.35 : 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  });

  return (
    <View
      style={[
        styles.heroStrip,
        {
          backgroundColor: heroStripBg,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.stageOuter,
          {
            width: STAGE_WIDTH,
            minHeight: STAGE_MIN_HEIGHT,
            borderRadius: STAGE_RADIUS,
            borderColor: stageBorder,
            ...shadowStyle,
          },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: STAGE_RADIUS }]}
        />

        {!hasUrl ? (
          <TouchableOpacity
            style={styles.stageInnerCenter}
            onPress={onTakePhoto}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={takePhotoLabel}
          >
            <Ionicons name="camera-outline" size={56} color={colors.textTertiary} />
            <Text style={[styles.captureImageText, { color: colors.textSecondary }]}>{takePhotoLabel}</Text>
          </TouchableOpacity>
        ) : loadState === 'error' ? (
          <View style={styles.stageInnerCenter}>
            <Ionicons name="image-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{loadErrorLabel}</Text>
            <View style={styles.errorActions}>
              <TouchableOpacity
                onPress={handleRetry}
                style={[styles.retryBtn, { borderColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel={retryLabel}
              >
                <Text style={[styles.retryBtnText, { color: colors.primary }]}>{retryLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onTakePhoto}
                style={[styles.retryBtn, { borderColor: colors.border }]}
                accessibilityRole="button"
                accessibilityLabel={takePhotoLabel}
              >
                <Text style={[styles.retryBtnText, { color: colors.text }]}>{takePhotoLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={openLightbox}
            disabled={loadState !== 'loaded'}
            style={styles.stageInnerCenter}
            accessibilityRole="imagebutton"
            accessibilityLabel={heroImageA11y}
            accessibilityHint={expandHint}
          >
            {loadState === 'loading' && (
              <View style={[styles.skeletonOverlay, { backgroundColor: darkMode ? '#2a2a2a' : '#e8eaed' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
            <ExpoImage
              key={`${imageUrl}-${retryNonce}`}
              source={{ uri: imageUrl! }}
              style={[styles.heroImage, { opacity: loadState === 'loaded' ? 1 : 0 }]}
              contentFit="contain"
              transition={280}
              cachePolicy="memory-disk"
              onLoad={() => setLoadState('loaded')}
              onError={() => setLoadState('error')}
            />
            {loadState === 'loaded' && (
              <View style={styles.expandHint} pointerEvents="none">
                <Ionicons name="expand-outline" size={14} color={darkMode ? '#e0e0e0' : '#555'} />
                <Text style={[styles.expandHintText, { color: darkMode ? '#ccc' : '#555' }]}>{expandHint}</Text>
              </View>
            )}
          </Pressable>
        )}
      </View>

      {hasUrl && imageUrl ? (
        <ProductImageLightbox
          visible={lightboxVisible}
          uri={imageUrl}
          onClose={() => setLightboxVisible(false)}
          closeLabel={closeLightboxLabel}
        />
      ) : null}

      <View style={styles.productNameContainer}>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
          {productName}
        </Text>
        {isUserContributed && (
          <View
            style={[
              styles.userContributedBadge,
              { backgroundColor: colors.primary + '20', borderColor: colors.primary },
            ]}
          >
            <Ionicons name="person-circle-outline" size={14} color={colors.primary} />
            <Text style={[styles.userContributedText, { color: colors.primary }]}>{userContributedLabel}</Text>
          </View>
        )}
      </View>
      {brandText ? (
        <Text style={[styles.brand, { color: colors.textSecondary }]}>{brandText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heroStrip: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  stageOuter: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  stageInnerCenter: {
    flex: 1,
    width: '100%',
    minHeight: STAGE_MIN_HEIGHT - 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  skeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: STAGE_RADIUS,
  },
  heroImage: {
    width: STAGE_WIDTH - 24,
    height: STAGE_MIN_HEIGHT - 32,
  },
  captureImageText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  expandHint: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  expandHintText: {
    fontSize: 11,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  errorActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  productNameContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 30,
  },
  userContributedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    marginTop: 6,
  },
  userContributedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  brand: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
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
