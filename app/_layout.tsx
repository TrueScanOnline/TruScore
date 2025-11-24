import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, useColorScheme } from 'react-native';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import '../src/i18n'; // Initialize i18n
import { linking, parseBarcodeFromUrl } from '../src/utils/linking';
import ErrorBoundary from '../src/components/ErrorBoundary';
import { errorReporting } from '../src/services/errorReporting';

// Import screens
import ResultScreen from './result/[barcode]';
import SettingsScreen from './settings';
import OnboardingScreen from './onboarding';
import SubscriptionScreen from './subscription';
import ValuesScreen from './values';
import AppTabs from '../src/navigation/AppTabs';

// Import stores
import { useScanStore } from '../src/store/useScanStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useFavoritesStore } from '../src/store/useFavoritesStore';
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';

// Import TabParamList for nested Main navigation
import type { TabParamList } from '../src/navigation/AppTabs';

// Create stack navigator type
export type RootStackParamList = {
  Onboarding: undefined;
  Main: {
    screens?: {
      Scan?: undefined;
      Search?: undefined;
      History?: undefined;
      Favourites?: undefined;
      Profile?: undefined;
    };
  } | { screen: keyof TabParamList } | undefined;
  Result: { barcode: string };
  Settings: undefined;
  Subscription: undefined;
  Values: undefined;
  Favourites: undefined;
  Search: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootLayout() {
  const { initializeStore: initSettings, darkMode } = useSettingsStore();
  const { initializeStore: initScan } = useScanStore();
  const { initializeStore: initFavorites } = useFavoritesStore();
  const { initialize: initSubscription } = useSubscriptionStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true); // Default to true - show onboarding until we know otherwise
  const systemColorScheme = useColorScheme();
  
  // Use dark mode from settings, or fallback to system preference
  const isDarkMode = darkMode ?? (systemColorScheme === 'dark');

  useEffect(() => {
    // Initialize both stores (load cached data) and check for deep links
    const initialize = async () => {
      console.log('[RootLayout] Starting initialization...');
      console.log('[RootLayout] Initial showOnboarding state:', showOnboarding);
      
      try {
        // Initialize error reporting (Sentry) early - TEMPORARILY DISABLED
        // TODO: Uncomment when Sentry is installed: await errorReporting.initialize();
        // Error reporting is optional and will be enabled when @sentry/react-native is installed
        
        // Initialize FSANZ auto-update system (non-blocking)
        import('../src/services/fsanDatabaseAutoUpdate').then(({ initializeFSANZAutoUpdate }) => {
          initializeFSANZAutoUpdate().catch(err => {
            console.log('[RootLayout] FSANZ auto-update initialization error (non-critical):', err);
          });
        });
        
        // Initialize settings store first - this loads from AsyncStorage
        await initSettings();
        
        // Wait a tick to ensure Zustand state is fully updated after async set
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Check stored value AFTER initialization completes
        const settings = useSettingsStore.getState();
        
        // FORCE CHECK: Explicitly check if hasCompletedOnboarding is true
        // Show onboarding ONLY if hasCompletedOnboarding is NOT explicitly true
        const hasCompleted = settings.hasCompletedOnboarding === true;
        const shouldShowOnboarding = !hasCompleted;
        
        console.log('[RootLayout] Onboarding decision:', {
          hasCompletedOnboarding: settings.hasCompletedOnboarding,
          type: typeof settings.hasCompletedOnboarding,
          isTrue: hasCompleted,
          shouldShow: shouldShowOnboarding,
          willShowOnboarding: shouldShowOnboarding,
          allSettings: settings,
        });
        
        // FORCE UPDATE: Set the state explicitly
        setShowOnboarding(shouldShowOnboarding);
        
        // Initialize scan store
        await initScan();
        
        // Initialize favorites store
        await initFavorites();
        
        // Initialize subscription store
        await initSubscription();
        
        // Check for initial deep link (but don't let it override onboarding)
        const url = await Linking.getInitialURL();
        if (url && !shouldShowOnboarding) { // Only process deep link if not showing onboarding
          const barcode = parseBarcodeFromUrl(url);
          if (barcode) {
            setInitialUrl(barcode);
          }
        }
        
        setIsInitializing(false);
        console.log('[RootLayout] Initialization complete. showOnboarding:', shouldShowOnboarding, 'initialRoute:', shouldShowOnboarding ? 'Onboarding' : 'Scan');
      } catch (error) {
        console.error('[RootLayout] Initialization error:', error);
        // On error, default to showing onboarding
        setShowOnboarding(true);
        setIsInitializing(false);
      }
    };
    initialize();

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const barcode = parseBarcodeFromUrl(url);
      if (barcode) {
        setInitialUrl(barcode);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (isInitializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDarkMode ? '#121212' : '#fff',
        }}
      >
        <ActivityIndicator size="large" color="#16a085" />
      </View>
    );
  }

  // Determine initial route based on onboarding status
  // Default to Onboarding until we know the user has completed it
  const initialRoute = showOnboarding ? 'Onboarding' : 'Main';
  
  console.log('[RootLayout] Rendering navigator with:', {
    showOnboarding,
    initialRoute,
    isInitializing,
  });

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer
            linking={showOnboarding ? undefined : linking as any} // Disable linking during onboarding
            onReady={() => {
              console.log('[RootLayout] NavigationContainer ready. showOnboarding:', showOnboarding);
              // Navigate to result if we have a deep link barcode (only after onboarding)
              if (initialUrl && !showOnboarding) {
                // Navigation will be handled automatically by the linking config
                console.log('[RootLayout] Deep link detected:', initialUrl);
              }
            }}
            fallback={<ActivityIndicator size="large" color="#16a085" />}
          >
            <ErrorBoundary>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  presentation: 'card',
                }}
                initialRouteName={initialRoute}
              >
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Main" component={AppTabs} />
                <Stack.Screen 
                  name="Result" 
                  component={ResultScreen}
                  options={{
                    presentation: 'modal', // Makes it a modal so tabs show underneath
                  }}
                />
                <Stack.Screen 
                  name="Settings" 
                  component={SettingsScreen}
                  options={{
                    presentation: 'modal',
                  }}
                />
                <Stack.Screen 
                  name="Subscription" 
                  component={SubscriptionScreen}
                  options={{
                    presentation: 'modal',
                  }}
                />
                <Stack.Screen 
                  name="Values" 
                  component={ValuesScreen}
                  options={{
                    presentation: 'modal',
                    headerShown: true,
                    title: 'Values Preferences',
                  }}
                />
              </Stack.Navigator>
            </ErrorBoundary>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          </NavigationContainer>
          <Toast />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default RootLayout;

