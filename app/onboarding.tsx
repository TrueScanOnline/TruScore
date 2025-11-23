import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useTheme } from '../src/theme';
import { RootStackParamList } from './_layout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const slides = [
  {
    key: 'transparency',
    icon: 'leaf-outline' as const,
    titleKey: 'onboarding.slide1.title',
    descriptionKey: 'onboarding.slide1.description',
  },
  {
    key: 'trust',
    icon: 'shield-checkmark-outline' as const,
    titleKey: 'onboarding.slide2.title',
    descriptionKey: 'onboarding.slide2.description',
  },
  {
    key: 'privacy',
    icon: 'lock-closed-outline' as const,
    titleKey: 'onboarding.slide3.title',
    descriptionKey: 'onboarding.slide3.description',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { setHasCompletedOnboarding } = useSettingsStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (slideIndex !== currentSlide) {
      setCurrentSlide(slideIndex);
    }
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      scrollViewRef.current?.scrollTo({
        x: nextSlide * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentSlide(nextSlide);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      const prevSlide = currentSlide - 1;
      scrollViewRef.current?.scrollTo({
        x: prevSlide * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentSlide(prevSlide);
    }
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  const handleComplete = async () => {
    try {
      console.log('[Onboarding] Completing onboarding, setting hasCompletedOnboarding to true');
      await setHasCompletedOnboarding(true);
      
      // Verify it was saved
      const current = useSettingsStore.getState();
      console.log('[Onboarding] After save, hasCompletedOnboarding:', current.hasCompletedOnboarding);
      
      // Navigate to Main screen (which contains the Scan tab) using reset to clear the navigation stack
      console.log('[Onboarding] Navigating to Main screen (Scan tab)...');
      
      // Use reset to properly clear the stack and navigate to Main with Scan tab
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main', params: { screen: 'Scan' } }],
        })
      );
      
      console.log('[Onboarding] Navigation reset command sent');
    } catch (error) {
      console.error('[Onboarding] Error completing onboarding:', error);
      // Try navigation anyway with reset
      try {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main', params: { screen: 'Scan' } }],
          })
        );
      } catch (navError) {
        console.error('[Onboarding] Navigation reset error:', navError);
        // Last resort: try replace
        try {
          navigation.replace('Main', { screen: 'Scan' });
        } catch (replaceError) {
          console.error('[Onboarding] Navigation replace error:', replaceError);
          // Final fallback: navigate
          navigation.navigate('Main', { screen: 'Scan' });
        }
      }
    }
  };

  const handleDotPress = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
    setCurrentSlide(index);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
          {t('common.cancel')}
        </Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={{
          width: SCREEN_WIDTH * slides.length,
          flexGrow: 1,
        }}
      >
        {slides.map((slide, index) => (
          <View key={slide.key} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.slideContent}>
              <Ionicons name={slide.icon} size={100} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>{t(slide.titleKey)}</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {t(slide.descriptionKey)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dots Indicator */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              currentSlide === index && { ...styles.dotActive, backgroundColor: colors.primary },
              { backgroundColor: currentSlide === index ? colors.primary : colors.border },
            ]}
            onPress={() => handleDotPress(index)}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentSlide > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handlePrevious}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={[styles.backButtonText, { color: colors.primary }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: colors.primary },
            currentSlide === 0 && styles.nextButtonFull,
          ]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentSlide === slides.length - 1
              ? t('onboarding.getStarted')
              : t('common.ok')}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingTop: 120,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
