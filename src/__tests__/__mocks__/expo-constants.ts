/** Jest mock — real expo-constants ships ESM that breaks the node test env without extra transforms. */
const Constants = {
  expoConfig: {
    extra: {
      supportEmail: 'support@example.test',
    },
  },
  manifest: null,
  manifest2: null,
  executionEnvironment: 'standalone',
};

export default Constants;
