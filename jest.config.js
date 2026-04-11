/**
 * Jest Configuration for User Contribution Tests
 * Configured to handle Expo modules and ES modules
 */

module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    // Transform Expo modules and other ES modules
    'node_modules/(?!(expo|@expo|expo-|@react-native|react-native|@unimodules|unimodules|sentry-expo|native-base|react-clone-referenced-element|@react-native-community|react-navigation|@react-navigation|@react-native-async-storage|@react-native-community/netinfo)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock Expo modules that use ES modules
    '^expo-localization$': '<rootDir>/src/__tests__/__mocks__/expo-localization.ts',
    '^expo-file-system$': '<rootDir>/src/__tests__/__mocks__/expo-file-system.ts',
    '^expo-image-picker$': '<rootDir>/src/__tests__/__mocks__/expo-image-picker.ts',
    '^expo-sqlite$': '<rootDir>/src/__tests__/__mocks__/expo-sqlite.ts',
    '^expo-sqlite/build/index$': '<rootDir>/src/__tests__/__mocks__/expo-sqlite.ts',
    '^expo-linking$': '<rootDir>/src/__tests__/__mocks__/expo-linking.ts',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};
