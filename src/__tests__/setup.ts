/**
 * Jest Setup File
 * Configures test environment and mocks
 */

// R-8 / wave4aSharedAuthority: PostgresAuthorityStore imports synced backend modules.
// `backend/vercel/truescan-src` is gitignored; sync from `src/` when absent so clean checkouts pass.
(() => {
  try {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const { spawnSync } = require('child_process') as typeof import('child_process');
    const marker = path.join(
      process.cwd(),
      'backend',
      'vercel',
      'truescan-src',
      'evidenceAuthority',
      'schemaReady.ts'
    );
    if (!fs.existsSync(marker)) {
      const script = path.join(process.cwd(), 'backend', 'vercel', 'scripts', 'syncTruescanSrc.cjs');
      if (fs.existsSync(script)) {
        spawnSync(process.execPath, [script], { stdio: 'ignore' });
      }
    }
  } catch {
    /* leave sync optional; suites that need it will fail loudly */
  }
})();

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Expo modules are mocked via moduleNameMapper in jest.config.js
// This ensures they're properly handled as ES modules

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set up global fetch mock
global.fetch = jest.fn();

// Unit suites that exercise contribution menus assume an entitled UAT path.
// Production/store builds remain default-OFF via app.config.js / eas.json.
// Founder 2026-11-18 restore: match pre-containment test entitlement; preselected-only is opt-in.
if (process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION === undefined) {
  process.env.EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION = '0';
}
if (process.env.EXPO_PUBLIC_MVP_PRESELECTED_ONLY === undefined) {
  process.env.EXPO_PUBLIC_MVP_PRESELECTED_ONLY = '1';
}
if (process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV === undefined) {
  process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = 'uat';
}
if (process.env.EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS === undefined) {
  process.env.EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS = '0';
}

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

