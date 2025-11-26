module.exports = {
  expo: {
    name: 'TrueScan',
    slug: 'truescan-food-scanner',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#16a085', // TrueScan brand color
    },
    assetBundlePatterns: ['**/*'],
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#16a085',
      },
      package: 'com.truescan.foodscanner',
      permissions: ['CAMERA'],
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
      buildNumber: '2', // Incremented from 1 (build 1 already submitted)
      associatedDomains: ['applinks:truescan.app'],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: 'TrueScan needs access to your camera to scan product barcodes for transparency info.',
        // Note: NSMicrophoneUsageDescription not needed since we're not using video recording
      },
    },
    scheme: 'truescan',
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-font',
      'expo-sqlite',
      [
        'expo-camera',
        {
          cameraPermission: 'TrueScan needs access to your camera to scan product barcodes for transparency info.',
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
            buildToolsVersion: '34.0.4',
          },
        },
      ],
    ],
    extra: {
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
    },
  },
};

