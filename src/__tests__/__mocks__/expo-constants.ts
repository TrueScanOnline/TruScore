/** Jest mock — real expo-constants ships ESM that breaks the node test env without extra transforms. */
const Constants = {
  expoConfig: {
    version: '10.0.0',
    extra: {
      supportEmail: '',
      offApiContactEmail: '',
      offPublicContribution: '0',
      shareEventTelemetry: '0',
      localShareAnalytics: '0',
      legalDocumentsTestReady: '0',
      storeRelease: '0',
    },
  },
  nativeAppVersion: '10.0.0',
  manifest: null,
  manifest2: null,
  executionEnvironment: 'standalone',
};

export default Constants;
