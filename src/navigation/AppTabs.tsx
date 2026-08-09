import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useTheme } from '../theme';
import ErrorBoundary from '../components/ErrorBoundary';
import { isMvpAlertsTabEnabled } from '../config/mvpRuntimeGates';
import type {
  ScanStackParamList,
  SearchStackParamList,
  HistoryStackParamList,
  FavouritesStackParamList,
  AlertsStackParamList,
} from './tabStackParamLists';

// Import screens
import ScanScreen from '../../app/index';
import SearchScreen from '../../app/search';
import HistoryScreen from '../../app/history';
import FavouritesScreen from '../../app/favourites';
import AlertsScreen from '../../app/alerts';
import ProfileScreen from '../../app/profile';
import ResultScreen from '../../app/result/[barcode]';

// Wrap screens with Error Boundaries
const ScanScreenWithBoundary = (props: any) => {
  return (
    <ErrorBoundary>
      <ScanScreen {...props} />
    </ErrorBoundary>
  );
};

const SearchScreenWithBoundary = (props: any) => {
  return (
    <ErrorBoundary>
      <SearchScreen {...props} />
    </ErrorBoundary>
  );
};

const HistoryScreenWithBoundary = (props: any) => {
  return (
    <ErrorBoundary>
      <HistoryScreen {...props} />
    </ErrorBoundary>
  );
};

const FavouritesScreenWithBoundary = (props: any) => {
  return (
    <ErrorBoundary>
      <FavouritesScreen {...props} />
    </ErrorBoundary>
  );
};

const ProfileScreenWithBoundary = (props: any) => {
  return (
    <ErrorBoundary>
      <ProfileScreen {...props} />
    </ErrorBoundary>
  );
};

const AlertsScreenWithBoundary = (props: any) => (
  <ErrorBoundary>
    <AlertsScreen {...props} />
  </ErrorBoundary>
);

const ResultScreenWithBoundary = (props: any) => (
  <ErrorBoundary>
    <ResultScreen {...props} />
  </ErrorBoundary>
);

const ScanStack = createNativeStackNavigator<ScanStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
const FavouritesStack = createNativeStackNavigator<FavouritesStackParamList>();
const AlertsStack = createNativeStackNavigator<AlertsStackParamList>();

function ScanStackNavigator() {
  return (
    <ScanStack.Navigator screenOptions={{ headerShown: false }}>
      <ScanStack.Screen name="ScanHome" component={ScanScreenWithBoundary} />
      <ScanStack.Screen name="Result" component={ResultScreenWithBoundary} />
    </ScanStack.Navigator>
  );
}

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="SearchHome" component={SearchScreenWithBoundary} />
      <SearchStack.Screen name="Result" component={ResultScreenWithBoundary} />
    </SearchStack.Navigator>
  );
}

function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
      <HistoryStack.Screen name="HistoryHome" component={HistoryScreenWithBoundary} />
      <HistoryStack.Screen name="Result" component={ResultScreenWithBoundary} />
    </HistoryStack.Navigator>
  );
}

function FavouritesStackNavigator() {
  return (
    <FavouritesStack.Navigator screenOptions={{ headerShown: false }}>
      <FavouritesStack.Screen name="FavouritesHome" component={FavouritesScreenWithBoundary} />
      <FavouritesStack.Screen name="Result" component={ResultScreenWithBoundary} />
    </FavouritesStack.Navigator>
  );
}

function AlertsStackNavigator() {
  return (
    <AlertsStack.Navigator screenOptions={{ headerShown: false }}>
      <AlertsStack.Screen name="AlertsHome" component={AlertsScreenWithBoundary} />
      <AlertsStack.Screen name="Result" component={ResultScreenWithBoundary} />
    </AlertsStack.Navigator>
  );
}

export type TabParamList = {
  Scan: NavigatorScreenParams<ScanStackParamList>;
  Search: NavigatorScreenParams<SearchStackParamList>;
  History: NavigatorScreenParams<HistoryStackParamList>;
  Favourites: NavigatorScreenParams<FavouritesStackParamList>;
  Alerts: NavigatorScreenParams<AlertsStackParamList>;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function AppTabs() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Configure system navigation bar on Android to work with app tabs
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Option 1: Hide the navigation bar completely (preferred by user)
      // This gives full control to app tabs
      NavigationBar.setVisibilityAsync('hidden').catch((error) => {
        console.log('Failed to hide navigation bar:', error);
        // Fallback: Configure navigation bar to be non-overlapping
        NavigationBar.setBehaviorAsync('overlay-swipe').catch(() => {
          // If that fails, configure navigation bar background to match app
          NavigationBar.setBackgroundColorAsync(colors.card).catch(() => {
            // Silent fallback - continue with safe area insets
          });
        });
      });
    }

    // Cleanup: restore navigation bar visibility when component unmounts
    return () => {
      if (Platform.OS === 'android') {
        NavigationBar.setVisibilityAsync('visible').catch(() => {
          // Silent cleanup - navigation bar will show when leaving app
        });
      }
    };
  }, [colors.card]);

  // Calculate tab bar height with safe area padding
  const tabBarHeight = 60 + insets.bottom;
  const tabBarPaddingBottom = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarScrollEnabled: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Scan':
              iconName = focused ? 'barcode' : 'barcode-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'History':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Favourites':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'Alerts':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: tabBarPaddingBottom,
          height: tabBarHeight,
          // Add elevation for Android to ensure tab bar stays above content
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        headerShown: false,
        lazy: false, // Pre-load all tabs immediately for instant switching
        unmountOnBlur: false, // Keep tabs mounted to preserve state and cache
        animationEnabled: false, // Disable animation for faster switching
      })}
    >
      <Tab.Screen
        name="Scan"
        component={ScanStackNavigator}
        options={{
          tabBarLabel: t('tabs.scan'),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStackNavigator}
        options={{
          tabBarLabel: t('tabs.search'),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStackNavigator}
        options={{
          tabBarLabel: t('tabs.history'),
        }}
      />
      <Tab.Screen
        name="Favourites"
        component={FavouritesStackNavigator}
        options={{
          tabBarLabel: t('tabs.favourites'),
        }}
      />
      {isMvpAlertsTabEnabled() ? (
        <Tab.Screen
          name="Alerts"
          component={AlertsStackNavigator}
          options={{
            tabBarLabel: t('tabs.alerts'),
          }}
        />
      ) : null}
      <Tab.Screen
        name="Settings"
        component={ProfileScreenWithBoundary}
        options={{
          tabBarLabel: t('tabs.settings'),
        }}
      />
    </Tab.Navigator>
  );
}

