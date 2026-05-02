const nativeIdentity = require('./src/config/productIdentity.expo.json');

module.exports = {
  expo: {
    name: nativeIdentity.appName,
    slug: 'truescan-food-scanner',
    version: '10.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#16a085', // Rveel brand color
    },
    assetBundlePatterns: ['**/*'],
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#16a085',
      },
      package: 'com.truescan.foodscanner',
      versionCode: 13, // v10.0.0 - Build 13 for Android APK testing
      permissions: [
        'CAMERA',
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'INTERNET',
        // Additional permissions from AndroidManifest.xml (may be added by native modules)
        'RECORD_AUDIO', // Added by expo-camera (optional, not used)
        'SYSTEM_ALERT_WINDOW', // For overlay windows if needed
        'VIBRATE', // For haptic feedback
      ],
      navigationBar: {
        // Configure navigation bar to work with app tabs
        // 'hidden' = hide completely (preferred for full app control)
        // 'insets-only' = show but respect safe area insets (fallback)
        visibility: 'hidden',
        backgroundColor: '#ffffff',
      },
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'truescan',
              host: 'barcode',
            },
            {
              scheme: 'https',
              host: 'truescan.app',
              pathPrefix: '/barcode',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.truescan.foodscanner',
      buildNumber: '26', // v10.0.0 - Build 26 for iOS user testing (iPhone 11 / App Store Connect / TestFlight)
      associatedDomains: ['applinks:truescan.app'],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: nativeIdentity.cameraPermission,
        NSLocationWhenInUseUsageDescription: nativeIdentity.locationWhenInUse,
        NSLocationAlwaysAndWhenInUseUsageDescription: nativeIdentity.locationAlways,
        // Note: NSMicrophoneUsageDescription not needed since we're not using video recording
        // URL schemes for sharing / canOpenURL (iOS). https:// URLs do not need entries; custom schemes do.
        LSApplicationQueriesSchemes: [
          'whatsapp',
          'sms',
          'tel',
          'mailto',
          'instagram',
          'snapchat',
          'tiktok',
          'fb',
          'facebook',
          'twitter',
          'tg',
        ],
      },
    },
    scheme: 'truescan',
    web: {
      favicon: './assets/favicon.png',
    },
    // Explicitly disable updates for Expo Go development
    // This prevents "Failed to download remote update" errors
    updates: {
      enabled: false,
      checkAutomatically: 'NEVER',
      fallbackToCacheTimeout: 0,
    },
    plugins: [
      'expo-font',
      'expo-sqlite',
      [
        'expo-camera',
        {
          cameraPermission: nativeIdentity.cameraPermission,
          // Note: Microphone permission is optional - only needed if using video recording
          // Setting to false prevents microphone permission request
          microphonePermission: false,
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            minSdkVersion: 24,
            // buildToolsVersion removed - let AGP auto-select (recommended for Expo SDK 53)
          },
          ios: {
            // iOS build settings for SDK 53 - minimum deployment target is 15.1 for SDK 53
            deploymentTarget: '15.1',
          },
        },
      ],
      // react-native-qonversion config plugin (if available)
      // Note: Qonversion may require manual native setup if config plugin not available
      // '@qonversion/react-native-plugin', // Uncomment if plugin is installed
    ],
    extra: {
      /** Public support inbox; set EXPO_PUBLIC_SUPPORT_EMAIL in EAS env / .env before store submission */
      supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || '',
      // EAS project ID - Required for EAS Build
      // Note: This is commented out for Expo Go development to prevent update errors
      // Uncomment when building with EAS Build for production
      eas: {
        projectId: '1ac14572-9608-42fa-aceb-c0e2a2f60687',
      },
      // Qonversion Project Key - same for both iOS and Android
      // Secret Key is for server-side use only (webhooks, backend API)
      // Get keys from: https://dashboard.qonversion.io/settings
      qonversion: {
        projectKey: process.env.EXPO_PUBLIC_QONVERSION_PROJECT_KEY || '',
        // Legacy support for separate iOS/Android keys if needed
        iosKey: process.env.EXPO_PUBLIC_QONVERSION_IOS_KEY || process.env.EXPO_PUBLIC_QONVERSION_PROJECT_KEY || '',
        androidKey: process.env.EXPO_PUBLIC_QONVERSION_ANDROID_KEY || process.env.EXPO_PUBLIC_QONVERSION_PROJECT_KEY || '',
      },
      // USDA FoodData Central API Key
      // Get free API key at: https://fdc.nal.usda.gov/api-guide.html
      // Register at: https://fdc.nal.usda.gov/
      EXPO_PUBLIC_USDA_API_KEY: (() => {
        const key = process.env.EXPO_PUBLIC_USDA_API_KEY;
        if (!key || key.length < 10) {
          if (process.env.EAS_BUILD === 'true' || process.env.NODE_ENV === 'production') {
            console.warn('[BUILD] EXPO_PUBLIC_USDA_API_KEY not set - USDA data will not be available');
          }
          return '';
        }
        return key;
      })(),
      // GS1 Data Source API Key (Optional - requires subscription or 60-day trial)
      // Note: GS1 requires a paid subscription or 60-day trial, not a free API key
      // Trial registration: https://store.gs1us.org/view-use-api-trial/p
      // Subscription: https://www.gs1us.org/tools/gs1-us-data-hub/gs1-us-apis
      // If you have a GS1 API key, add it here: EXPO_PUBLIC_GS1_API_KEY
      EXPO_PUBLIC_GS1_API_KEY: process.env.EXPO_PUBLIC_GS1_API_KEY || '',
      // EAN-Search.org API Key (Optional - free tier available)
      // Register at: https://www.ean-search.org/ean-database-api.html
      // Free tier: Requires registration, unlimited light use
      // If you have an EAN-Search API key, add it here: EXPO_PUBLIC_EAN_SEARCH_API_KEY
      EXPO_PUBLIC_EAN_SEARCH_API_KEY: process.env.EXPO_PUBLIC_EAN_SEARCH_API_KEY || '',
      // UPC Database API Key (Optional - free tier: 100 lookups/day)
      // Register at: https://www.upcdatabase.com/api
      // If you have a UPC Database API key, add it here: EXPO_PUBLIC_UPC_DATABASE_API_KEY
      EXPO_PUBLIC_UPC_DATABASE_API_KEY: process.env.EXPO_PUBLIC_UPC_DATABASE_API_KEY || '',
      // Edamam Food Database API (Optional - free tier: 10,000 requests/month)
      // Register at: https://developer.edamam.com/
      // Requires: App ID + App Key
      EXPO_PUBLIC_EDAMAM_APP_ID: process.env.EXPO_PUBLIC_EDAMAM_APP_ID || '',
      EXPO_PUBLIC_EDAMAM_APP_KEY: process.env.EXPO_PUBLIC_EDAMAM_APP_KEY || '',
      // Barcode Lookup API Key (Optional - free tier: 100 lookups/day)
      // Register at: https://www.barcodelookup.com/api
      // If you have a Barcode Lookup API key, add it here: EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY
      EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY: process.env.EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY || '',
      // Nutritionix API (Optional - free tier: 100 requests/day)
      // Register at: https://www.nutritionix.com/business/api
      // Requires: App ID + API Key
      EXPO_PUBLIC_NUTRITIONIX_APP_ID: process.env.EXPO_PUBLIC_NUTRITIONIX_APP_ID || '',
      EXPO_PUBLIC_NUTRITIONIX_API_KEY: process.env.EXPO_PUBLIC_NUTRITIONIX_API_KEY || '',
      // Spoonacular API Key (Optional - free tier: 150 points/day)
      // Register at: https://spoonacular.com/food-api
      // If you have a Spoonacular API key, add it here: EXPO_PUBLIC_SPOONACULAR_API_KEY
      EXPO_PUBLIC_SPOONACULAR_API_KEY: process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY || '',
      // Best Buy API Key (Optional - free tier: 5,000 requests/day)
      // Register at: https://developer.bestbuy.com/
      // If you have a Best Buy API key, add it here: EXPO_PUBLIC_BESTBUY_API_KEY
      EXPO_PUBLIC_BESTBUY_API_KEY: process.env.EXPO_PUBLIC_BESTBUY_API_KEY || '',
      // EANData API Key (Optional - free tier: Light use, e.g., 100/day)
      // Register at: https://eandata.com/feed/
      // If you have an EANData API key, add it here: EXPO_PUBLIC_EANDATA_API_KEY
      EXPO_PUBLIC_EANDATA_API_KEY: process.env.EXPO_PUBLIC_EANDATA_API_KEY || '',
      // Vercel Backend URL — must match src/config/backendConfig.ts production default unless overridden in .env / EAS.
      // Used for manual-products, share-event telemetry, etc.
      EXPO_PUBLIC_BACKEND_URL:
        process.env.EXPO_PUBLIC_BACKEND_URL || 'https://truscoreapi.vercel.app',
      // Open Food Facts API Credentials (Recommended for full functionality)
      // Create account at: https://world.openfoodfacts.org
      // Use your username (not email) as user_id
      // These credentials enable automatic product submission to Open Food Facts
      // Add to .env: EXPO_PUBLIC_OFF_USER_ID and EXPO_PUBLIC_OFF_PASSWORD
      EXPO_PUBLIC_OFF_USER_ID: process.env.EXPO_PUBLIC_OFF_USER_ID || '',
      EXPO_PUBLIC_OFF_PASSWORD: process.env.EXPO_PUBLIC_OFF_PASSWORD || '',
    },
  },
};

