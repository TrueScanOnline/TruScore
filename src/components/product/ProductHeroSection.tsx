import React, { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Colors } from '../../theme/colors';
import { resultEmeraldTone, resultPresentation } from '../../theme/resultPresentation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PHOTO = resultPresentation.emerald.identity.photo;

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

  const tone = resultEmeraldTone(darkMode);

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
    <View style={[styles.photo, { backgroundColor: darkMode ? '#243832' : '#F4F7F6' }]}>
      {!hasUrl ? (
        <TouchableOpacity
          style={styles.photoFill}
          onPress={onTakePhoto}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={takePhotoLabel}
        >
          <Ionicons name={resultPresentation.icons.capture} size={28} color={tone.muted} />
        </TouchableOpacity>
      ) : loadState === 'error' ? (
        <View style={styles.photoFill} accessibilityLabel={loadErrorLabel}>
          <Ionicons name={resultPresentation.icons.imageError} size={26} color={tone.muted} />
        </View>
      ) : (
        <Pressable
          onPress={openLightbox}
          disabled={loadState !== 'loaded'}
          style={styles.photoFill}
          accessibilityRole="imagebutton"
          accessibilityLabel={heroImageA11y}
          accessibilityHint={expandHint}
        >
          {loadState === 'loading' && (
            <View style={[styles.skeletonOverlay, { backgroundColor: darkMode ? '#243832' : '#F4F7F6' }]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
          <ExpoImage
            key={`${imageUrl}-${retryNonce}`}
            source={{ uri: imageUrl! }}
            style={[styles.heroImage, { opacity: loadState === 'loaded' ? 1 : 0 }]}
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

  return (
    <View style={styles.heroStrip}>
      <View
        style={[
          styles.identityCard,
          {
            backgroundColor: tone.card,
            borderColor: tone.line,
            shadowColor: '#0C4A3C',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: darkMode ? 0.28 : 0.12,
            shadowRadius: 8,
            elevation: 2,
          },
        ]}
      >
        {photo}
        <View style={styles.identityCopy}>
          <Text
            style={[styles.productName, { color: tone.ink }]}
          >
            {productName}
          </Text>
          {brandText ? (
            <Text
              style={[styles.brand, { color: tone.muted }]}
            >
              {brandText}
            </Text>
          ) : null}
          {!hasUrl ? (
            <TouchableOpacity
              onPress={onTakePhoto}
              accessibilityRole="button"
              accessibilityLabel={takePhotoLabel}
              style={styles.captureLabelHit}
            >
              <Text style={[styles.captureImageText, { color: tone.action }]}>{takePhotoLabel}</Text>
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
                  style={[styles.retryBtn, { borderColor: tone.action }]}
                  accessibilityRole="button"
                  accessibilityLabel={retryLabel}
                >
                  <Text style={[styles.retryBtnText, { color: tone.action }]}>{retryLabel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onTakePhoto}
                  style={[styles.retryBtn, { borderColor: tone.line }]}
                  accessibilityRole="button"
                  accessibilityLabel={takePhotoLabel}
                >
                  <Text style={[styles.retryBtnText, { color: tone.ink }]}>{takePhotoLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
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
    marginBottom: 12,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: resultPresentation.emerald.space.photoPad,
    minHeight: resultPresentation.emerald.identity.minHeight,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  photo: {
    width: PHOTO,
    height: PHOTO,
    borderRadius: resultPresentation.radius.photo,
    overflow: 'hidden',
  },
  photoFill: {
    width: PHOTO,
    height: PHOTO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: PHOTO,
    height: PHOTO,
  },
  captureLabelHit: {
    alignSelf: 'flex-start',
    minHeight: resultPresentation.tap.min,
    justifyContent: 'center',
  },
  captureImageText: {
    fontSize: resultPresentation.type.meta,
    fontWeight: '700',
  },
  errorText: {
    fontSize: resultPresentation.type.meta,
    marginTop: 4,
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
    fontSize: resultPresentation.emerald.identity.name,
    fontWeight: '700',
    lineHeight: resultPresentation.emerald.identity.nameLine,
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
    marginTop: 6,
  },
  userContributedText: {
    fontSize: resultPresentation.type.meta,
    fontWeight: '600',
  },
  brand: {
    fontSize: resultPresentation.emerald.identity.brand,
    lineHeight: resultPresentation.emerald.identity.brandLine,
    marginTop: 2,
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
