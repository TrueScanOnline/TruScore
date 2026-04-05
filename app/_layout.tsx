import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, useColorScheme, AppState } from 'react-native';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import '../src/i18n'; // Initialize i18n
import { linking, parseBarcodeFromUrl } from '../src/utils/linking';
import ErrorBoundary from '../src/components/ErrorBoundary';
import { errorReporting } from '../src/services/errorReporting';

// Import screens
import SettingsScreen from './settings';
import OnboardingScreen from './onboarding';
import SubscriptionScreen from './subscription';
import MethodologyScreen from './methodology';
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
  Main: NavigatorScreenParams<TabParamList> | undefined;
  /** Advanced / developer tools (FSANZ import, etc.) — not the main Settings tab */
  DeveloperSettings: undefined;
  Subscription: undefined;
  Methodology: undefined;
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
    // Uses systematic initialization manager instead of uncoordinated .then() chains
    const initialize = async () => {
      console.log('[RootLayout] Starting initialization...');
      console.log('[RootLayout] Initial showOnboarding state:', showOnboarding);
      
      try {
        // Use systematic initialization manager
        const { appInitializationManager } = await import('../src/services/appInitializationManager');
        
        // Register all initialization tasks with proper dependencies
        appInitializationManager.registerTasks([
          {
            name: 'environmentValidation',
            task: async () => {
              const { validateEnvironment } = await import('../src/utils/environmentValidation');
              const validation = validateEnvironment();
              if (!validation.isValid) {
                console.warn('[RootLayout] Environment validation warnings:', validation.warnings);
              }
            },
            critical: false,
          },
          {
            name: 'rateLimiter',
            task: async () => {
              const { initializeRateLimits } = await import('../src/utils/rateLimiter');
              initializeRateLimits();
            },
            critical: false,
          },
          {
            name: 'csvDatabases',
            task: async () => {
              const { initializeCSVDatabases } = await import('../src/services/csvDatabases/csvDatabaseService');
              await initializeCSVDatabases();
            },
            critical: false, // Non-critical - PLANET Pillar can work without it
          },
          {
            name: 'settingsStore',
            task: async () => {
              await initSettings();
            },
            critical: true, // Critical - needed for onboarding decision
          },
          {
            name: 'scanStore',
            task: async () => {
              await initScan();
            },
            dependencies: ['settingsStore'],
            critical: false,
          },
          {
            name: 'favoritesStore',
            task: async () => {
              await initFavorites();
            },
            dependencies: ['settingsStore'],
            critical: false,
          },
          {
            name: 'subscriptionStore',
            task: async () => {
              await initSubscription();
              // Verify initialization succeeded
              const { isInitialized, error } = useSubscriptionStore.getState();
              if (!isInitialized && error) {
                console.warn('[RootLayout] Subscription initialization failed:', error);
                // App continues in free mode - this is acceptable, don't throw
              }
            },
            dependencies: ['settingsStore'],
            critical: false, // Non-critical - app works in free mode
            retries: 1,
          },
          {
            name: 'fsanDatabaseInitializer',
            task: async () => {
              const { initializeFSANZDatabases } = await import('../src/services/fsanDatabaseInitializer');
              await initializeFSANZDatabases();
            },
            critical: false,
          },
          {
            name: 'fsanDatabaseAutoUpdate',
            task: async () => {
              const { initializeFSANZAutoUpdate } = await import('../src/services/fsanDatabaseAutoUpdate');
              await initializeFSANZAutoUpdate();
            },
            critical: false,
          },
        ]);

        // Execute all initialization tasks
        await appInitializationManager.initialize();
        
        // Check stored value AFTER initialization completes (no setTimeout needed)
        // Zustand state is immediately available after await
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
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      const barcode = parseBarcodeFromUrl(url);
      if (barcode) {
        setInitialUrl(barcode);
      }
    });

    // Refresh subscription status when app comes to foreground
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground - refresh subscription status
        const { checkSubscriptionStatus } = useSubscriptionStore.getState();
        checkSubscriptionStatus().catch(err => {
          console.warn('[RootLayout] Failed to refresh subscription status:', err);
        });
      }
    });

    return () => {
      linkingSubscription.remove();
      appStateSubscription.remove();
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
                  name="DeveloperSettings" 
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
                  name="Methodology"
                  component={MethodologyScreen}
                  options={{
                    presentation: 'modal',
                    headerShown: true,
                    title: 'TruScan Methodology',
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

