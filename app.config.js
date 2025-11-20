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
      associatedDomains: ['applinks:truescan.app'],
    },
    scheme: 'truescan',
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
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
        projectId: 'your-project-id-here',
      },
      // Qonversion Project Key - same for both iOS and Android
      // Secret Key is for server-side use only (webhooks, backend API)
      // Get keys from: https://dashboard.qonversion.io/settings
      qonversion: {
        projectKey: process.env.EXPO_PUBLIC_QONVERSION_PROJECT_KEY || 'Bdh8Y7krabWxjf_alA0bSRUlHn8W3W0_',
        // Legacy support for separate iOS/Android keys if needed
        iosKey: process.env.EXPO_PUBLIC_QONVERSION_IOS_KEY || process.env.EXPO_PUBLIC_QONVERSION_PROJECT_KEY || 'Bdh8Y7krabWxjf_alA0bSRUlHn8W3W0_',
        androidKey: process.env.EXPO_PUBLIC_QONVERSION_ANDROID_KEY || process.env.EXPO_PUBLIC_QONVERSION_PROJECT_KEY || 'Bdh8Y7krabWxjf_alA0bSRUlHn8W3W0_',
      },
      // USDA FoodData Central API Key
      // Get free API key at: https://fdc.nal.usda.gov/api-guide.html
      // Register at: https://fdc.nal.usda.gov/
      EXPO_PUBLIC_USDA_API_KEY: process.env.EXPO_PUBLIC_USDA_API_KEY || 'x0LhtQno5hZtVHfF8SasJqHyeE3oSSi2fJAyqpbU',
      // GS1 Data Source API Key (Optional - requires subscription or 60-day trial)
      // Note: GS1 requires a paid subscription or 60-day trial, not a free API key
      // Trial registration: https://store.gs1us.org/view-use-api-trial/p
      // Subscription: https://www.gs1us.org/tools/gs1-us-data-hub/gs1-us-apis
      // If you have a GS1 API key, add it here: EXPO_PUBLIC_GS1_API_KEY
      EXPO_PUBLIC_GS1_API_KEY: process.env.EXPO_PUBLIC_GS1_API_KEY || '',
    },
  },
};

