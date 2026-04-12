/// <reference path="../global.d.ts" />

// Initialize Expo/React Native globals BEFORE anything else
// MUST be done before any imports that use them
if (typeof (global as any).__DEV__ === 'undefined') {
  (global as any).__DEV__ = process.env.NODE_ENV !== 'production';
}

// Set Expo environment variables
if (!process.env.EXPO_OS) {
  process.env.EXPO_OS = 'node';
}

// Initialize React Native globals (required by Expo)
// ErrorUtils is a React Native global used by Expo
if (typeof global !== 'undefined' && !(global as any).ErrorUtils) {
  (global as any).ErrorUtils = {
    getGlobalHandler: () => null,
    setGlobalHandler: () => {},
    reportFatalError: () => {},
    reportError: () => {},
    applyWithGuard: (fn: any, context: any, args: any[]) => {
      try {
        return fn.apply(context, args);
      } catch (e) {
        (global as any).ErrorUtils.reportFatalError(e);
        throw e;
      }
    },
    applyWithGuardIfNeeded: (fn: any, context: any, args: any[]) => {
      return (global as any).ErrorUtils.applyWithGuard(fn, context, args);
    },
    inGuard: () => false,
    guard: (fn: any) => {
      return (global as any).ErrorUtils.applyWithGuard(fn, null, []);
    },
  };
}

// Initialize globalThis.expo for Expo modules
if (typeof globalThis !== 'undefined' && !globalThis.expo) {
  class MockNativeModule {
    addListener() { return { remove: () => {} } as any; }
    removeListener() { return this; }
    removeAllListeners() { return this; }
    emit() { return false; }
    listenerCount() { return 0; }
  }
  globalThis.expo = {
    NativeModule: MockNativeModule as any,
    ExpoModulesCore: {},
  };
}

// Mock Expo/React Native modules before importing anything that uses them
// This is ONLY for Node.js test environment - does NOT affect Android/iOS builds
const Module = require('module');
const originalRequireModule = Module._load;

Module._load = function(request: string, parent: any) {
  // CRITICAL: Mock expo-modules-core FIRST (before anything else that might import it)
  if (request === 'expo-modules-core' || request.includes('expo-modules-core')) {
    // Ensure globalThis.expo exists before returning the mock
    if (typeof globalThis !== 'undefined' && !globalThis.expo) {
      const MockNativeModule = class {};
      globalThis.expo = {
        NativeModule: MockNativeModule,
        ExpoModulesCore: {},
      } as any;
    }
    const MockNativeModule = class {};
    const mockExpoModulesCore = {
      NativeModule: MockNativeModule,
      default: MockNativeModule,
      requireNativeModule: () => ({}),
      requireOptionalNativeModule: () => ({}),
      Platform: {
        OS: 'node',
        select: (obj: any) => {
          // Platform.select - returns the value for the current platform or default
          return obj.node || obj.default || obj.native || obj.web || null;
        },
      },
      // Add all common expo-modules-core exports
      EventEmitter: class EventEmitter {
        addListener() { return this; }
        removeListener() { return this; }
        emit() { return false; }
      },
      SyntheticPlatformEmitter: {
        addListener: () => ({}),
        removeListener: () => {},
        emit: () => {},
      },
    };
    return mockExpoModulesCore;
  }
  
  // Mock expo-linking (uses expo-modules-core)
  if (request === 'expo-linking') {
    return {
      createURL: () => '',
      parse: () => ({}),
      makeUrl: () => '',
      canOpenURL: async () => false,
      openURL: async () => {},
      openSettings: async () => {},
      getInitialURL: async () => null,
    };
  }
  
  // Mock expo package itself (prevents loading Expo components)
  if (request === 'expo' || request.startsWith('expo/')) {
    return {
      registerRootComponent: () => {},
      requireNativeModule: () => ({}),
      requireOptionalNativeModule: () => ({}),
      Updates: {
        checkForUpdateAsync: async () => ({ isAvailable: false }),
        fetchUpdateAsync: async () => {},
        reloadAsync: async () => {},
      },
    };
  }
  
  // Mock expo-sqlite (uses expo requireNativeModule)
  if (request === 'expo-sqlite') {
    const mockDatabase = {
      transaction: async (callback: any) => {},
      executeSql: async () => ({ rows: { _array: [], length: 0 }, insertId: null, rowsAffected: 0 }),
      close: async () => {},
      closeSync: () => {},
      getAllSync: () => [],
      runSync: () => ({ lastInsertRowId: 0, changes: 0 }),
      execSync: () => {},
      withTransactionAsync: async (fn: any) => await fn(),
      withExclusiveTransactionAsync: async (fn: any) => await fn(),
    };
    return {
      default: {
        openDatabase: () => mockDatabase,
        openDatabaseAsync: async () => mockDatabase,
      },
    };
  }
  
  // Mock expo-constants (uses expo-modules-core)
  if (request === 'expo-constants') {
    return {
      default: {
        appOwnership: null,
        expoVersion: '49.0.0',
        installationId: 'test-installation-id',
        sessionId: 'test-session-id',
        platform: { ios: {}, android: {} },
        manifest: {},
        nativeAppVersion: null,
        nativeBuildVersion: null,
        systemVersion: null,
      },
    };
  }
  
  // Mock expo-localization
  if (request === 'expo-localization') {
    const testRegion = (process.env.TEST_REGION || 'US').toUpperCase();
    const langTag = `en-${testRegion}`;
    return {
      getLocales: () => [{ regionCode: testRegion, languageTag: langTag }],
      getCalendars: () => [],
    };
  }
  // Mock expo-file-system
  if (request === 'expo-file-system') {
    return {
      cacheDirectory: '/tmp/truescan/',
      documentDirectory: '/tmp/truescan/',
      makeDirectoryAsync: async () => {},
      readAsStringAsync: async () => '',
      writeAsStringAsync: async () => {},
      deleteAsync: async () => {},
      getInfoAsync: async () => ({ exists: false }),
      downloadAsync: async () => ({ uri: '', status: 200, headers: {} }),
    };
  }
  // Mock react-native (only for Node.js environment)
  if (request === 'react-native') {
    return {
      Platform: { OS: 'node', select: (obj: any) => obj.node || obj.default || null },
      Dimensions: { get: () => ({ width: 800, height: 600 }) },
      StyleSheet: {
        create: (styles: any) => styles,
        flatten: (style: any) => style,
        compose: (...styles: any[]) => ({}),
        absoluteFill: {},
        absoluteFillObject: {},
        hairlineWidth: 1,
      },
      View: () => null,
      Text: () => null,
      Image: () => null,
      ScrollView: () => null,
      TouchableOpacity: () => null,
      ActivityIndicator: () => null,
    };
  }
  // Mock @react-native-async-storage/async-storage
  if (request === '@react-native-async-storage/async-storage') {
    const AsyncStorage = {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
      clear: async () => {},
      getAllKeys: async () => [],
      multiGet: async () => [],
      multiSet: async () => {},
      multiRemove: async () => {},
    };
    return AsyncStorage;
  }
  // Mock react-native-qonversion
  if (request === 'react-native-qonversion') {
    return {
      default: {
        checkEntitlements: async () => ({}),
        products: async () => [],
        purchase: async () => ({}),
        restore: async () => {},
      },
    };
  }
  return originalRequireModule.apply(this, arguments);
};

/**
 * TrueScan Barcode Performance Test Script
 * 
 * Tests barcode lookup performance and generates detailed logs showing:
 * - Performance metrics (fetch time, TruScore calculation time)
 * - Data sources for all product information
 * - Detailed breakdown of each of the 4 TruScore pillars
 * - Source attribution for ingredients, nutrition, allergens, etc.
 * 
 * Usage (from PowerShell):
 *   .\scripts\testBarcodePerformance.ps1 -Barcodes "9300633910198","0726684754229"
 *   .\scripts\testBarcodePerformance.ps1 -InputFile ".\barcodes\barcodes-88.txt"
 * 
 * Or directly with npm:
 *   npm run test:barcode-performance -- 9300633910198 0726684754229
 *   npm run test:barcode-performance -- --file barcodes/barcodes-88.txt --out reports/test_results.json
 *   (writes test_results.csv for Excel; test_results.html for browser/Word unless --no-html)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fetchProduct } from '../src/services/productService';
import { calculateTruScore } from '../src/lib/truscoreEngine';
import { Product, ProductWithTrustScore } from '../src/types/product';
import { logger } from '../src/utils/logger';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** One CSV field (quoted) for Excel compatibility. */
function csvCell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

/** Summary table as CSV — open directly in Microsoft Excel. */
function buildBarcodeSummaryCsv(results: TestResult[]): string {
  const header = [
    '#',
    'Barcode',
    'Product name',
    'Primary source',
    'Fetch ms',
    'Score calc ms',
    'Total ms',
    'TruScore',
    'Body',
    'Planet',
    'Ethics',
    'Open',
    'Status',
    'Errors',
  ];
  const lines = [header.map(csvCell).join(',')];
  results.forEach((r, i) => {
    const ts = r.truScore;
    const status =
      r.errors.length > 0 ? 'Error' : ts ? 'OK' : 'No score';
    const errText = r.errors.map((e) => e.message).join('; ');
    lines.push(
      [
        i + 1,
        r.barcode,
        r.product?.product_name ?? '',
        r.product?.source ?? '',
        r.performance.fetchTime,
        r.performance.truScoreTime,
        r.performance.totalTime,
        ts?.overall ?? '',
        ts?.breakdown.Body ?? '',
        ts?.breakdown.Planet ?? '',
        ts?.breakdown.Ethics ?? '',
        ts?.breakdown.Open ?? '',
        status,
        errText,
      ]
        .map(csvCell)
        .join(',')
    );
  });
  // UTF-8 BOM so Excel on Windows shows accents correctly
  return '\ufeff' + lines.join('\r\n');
}

/** Single-file HTML report for sharing (all barcodes on one page). */
function buildBarcodeReportHtml(payload: {
  testRun: {
    timestamp: string;
    barcodesTested: number;
    totalTime: number;
    totalTimeFormatted: string;
    inputFile: string | null;
    outputFile: string | null;
  };
  results: TestResult[];
}): string {
  const { testRun, results } = payload;
  const rows = results
    .map((r, i) => {
      const name = r.product?.product_name ?? '—';
      const src = r.product?.source ?? '—';
      const err = r.errors.length ? escapeHtml(r.errors.map((e) => e.message).join('; ')) : '';
      const status =
        r.errors.length > 0
          ? `<span class="bad">Error</span><div class="err">${err}</div>`
          : r.truScore
            ? '<span class="ok">OK</span>'
            : '<span class="warn">No score</span>';
      const ts = r.truScore;
      return `<tr>
  <td>${i + 1}</td>
  <td class="mono">${escapeHtml(r.barcode)}</td>
  <td>${escapeHtml(name)}</td>
  <td class="mono small">${escapeHtml(src)}</td>
  <td class="num">${r.performance.fetchTimeFormatted || '—'}</td>
  <td class="num">${r.performance.truScoreTimeFormatted || '—'}</td>
  <td class="num">${r.performance.totalTimeFormatted || '—'}</td>
  <td class="num">${ts ? ts.overall : '—'}</td>
  <td class="num">${ts ? ts.breakdown.Body : '—'}</td>
  <td class="num">${ts ? ts.breakdown.Planet : '—'}</td>
  <td class="num">${ts ? ts.breakdown.Ethics : '—'}</td>
  <td class="num">${ts ? ts.breakdown.Open : '—'}</td>
  <td>${status}</td>
</tr>`;
    })
    .join('\n');

  const detailsBlocks = results
    .map((r) => {
      const title = `${r.barcode} — ${r.product?.product_name ?? 'Not found'}`;
      let inner = '';
      if (r.pillarBreakdown) {
        const pillars: Array<keyof TestResult['pillarBreakdown']> = ['body', 'planet', 'ethics', 'open'];
        for (const key of pillars) {
          const p = r.pillarBreakdown![key];
          const label = key.toUpperCase();
          inner += `<h4>${label} (${p.score}/25, base ${p.base})</h4><ul>`;
          for (const adj of p.adjustments || []) {
            inner += `<li>${escapeHtml(adj.description)} <strong>(${adj.value})</strong></li>`;
          }
          inner += `</ul>`;
        }
      } else if (r.errors.length) {
        inner = `<p class="bad">${escapeHtml(r.errors.map((e) => e.message).join('; '))}</p>`;
      } else {
        inner = '<p>No pillar breakdown.</p>';
      }
      const primary = r.dataSources?.primarySource ?? '—';
      const allSrc = (r.dataSources?.allSources ?? []).join(', ') || '—';
      return `<details class="card">
<summary><strong>${escapeHtml(title)}</strong> · ${escapeHtml(primary)} · sources: ${escapeHtml(allSrc)}</summary>
<div class="detail-body">${inner}</div>
</details>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>TrueScan barcode report — ${testRun.barcodesTested} items</title>
  <style>
    :root { font-family: system-ui, Segoe UI, Roboto, sans-serif; }
    body { margin: 1rem 1.25rem 3rem; color: #1a1a1a; line-height: 1.45; }
    h1 { font-size: 1.35rem; margin-bottom: 0.25rem; }
    .meta { color: #555; font-size: 0.9rem; margin-bottom: 1.25rem; }
    .meta code { background: #f0f0f0; padding: 0.1em 0.35em; border-radius: 4px; }
    table { border-collapse: collapse; width: 100%; font-size: 0.82rem; margin: 1rem 0 2rem; }
    th, td { border: 1px solid #ccc; padding: 0.35rem 0.5rem; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; position: sticky; top: 0; z-index: 1; }
    .num { text-align: right; white-space: nowrap; }
    .mono { font-family: ui-monospace, Consolas, monospace; }
    .small { font-size: 0.78rem; max-width: 8rem; word-break: break-all; }
    .ok { color: #0a7; font-weight: 600; }
    .warn { color: #a60; }
    .bad { color: #c12; font-weight: 600; }
    .err { font-size: 0.75rem; color: #666; margin-top: 0.25rem; max-width: 14rem; }
    details.card { border: 1px solid #ddd; border-radius: 8px; margin-bottom: 0.5rem; padding: 0.35rem 0.6rem; background: #fafafa; }
    details.card summary { cursor: pointer; }
    .detail-body { padding: 0.5rem 0 0.25rem 0.5rem; font-size: 0.85rem; }
    .detail-body h4 { margin: 0.75rem 0 0.25rem; font-size: 0.9rem; }
    .detail-body ul { margin: 0.25rem 0 0.5rem 1rem; }
  </style>
</head>
<body>
  <h1>TrueScan barcode batch report</h1>
  <div class="meta">
    Generated <strong>${escapeHtml(testRun.timestamp)}</strong><br />
    Barcodes: <strong>${testRun.barcodesTested}</strong> · Total run time: <strong>${escapeHtml(testRun.totalTimeFormatted)}</strong><br />
    ${testRun.inputFile ? `Input: <code>${escapeHtml(testRun.inputFile)}</code><br />` : ''}
    ${testRun.outputFile ? `JSON: <code>${escapeHtml(testRun.outputFile)}</code>` : ''}
  </div>
  <h2>Summary</h2>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Barcode</th><th>Product</th><th>Source</th>
        <th>Fetch</th><th>Score calc</th><th>Total</th>
        <th>TruScore</th><th>Body</th><th>Planet</th><th>Ethics</th><th>Open</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <h2>Per-barcode detail</h2>
  <p style="font-size:0.9rem;color:#555;">Expand a row for pillar adjustments and data-source summary.</p>
  ${detailsBlocks}
</body>
</html>`;
}

/** Parse CLI: barcodes as positional args; --file / -f / --from-file <path>; --out / -o / --output <path> */
function parseBarcodeScriptArgs(argv: string[]): {
  barcodes: string[];
  inputFile: string | null;
  outputFile: string | null;
  htmlFile: string | null;
  noHtml: boolean;
} {
  const positional: string[] = [];
  let inputFile: string | null = null;
  let outputFile: string | null = null;
  let htmlFile: string | null = null;
  let noHtml = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file' || a === '-f' || a === '--from-file') {
      inputFile = argv[++i] ?? null;
      if (!inputFile) {
        console.error(`${a} requires a file path`);
        process.exit(1);
      }
    } else if (a === '--out' || a === '-o' || a === '--output') {
      outputFile = argv[++i] ?? null;
      if (!outputFile) {
        console.error(`${a} requires a file path`);
        process.exit(1);
      }
    } else if (a === '--html') {
      htmlFile = argv[++i] ?? null;
      if (!htmlFile) {
        console.error(`${a} requires a file path`);
        process.exit(1);
      }
    } else if (a === '--no-html') {
      noHtml = true;
    } else if (a.startsWith('-')) {
      console.error(`Unknown option: ${a}`);
      process.exit(1);
    } else {
      positional.push(a);
    }
  }

  let barcodes = [...positional];
  if (inputFile) {
    const resolved = path.resolve(inputFile);
    if (!fs.existsSync(resolved)) {
      console.error(`Input file not found: ${resolved}`);
      process.exit(1);
    }
    const content = fs.readFileSync(resolved, 'utf-8');
    const fromFile = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));
    barcodes = barcodes.concat(fromFile);
  }

  return { barcodes, inputFile, outputFile, htmlFile, noHtml };
}

interface TestResult {
  barcode: string;
  timestamp: string;
  performance: {
    fetchTime: number;
    fetchTimeFormatted: string;
    truScoreTime: number;
    truScoreTimeFormatted: string;
    totalTime: number;
    totalTimeFormatted: string;
  };
  product: {
    barcode: string;
    product_name: string;
    source: string;
    quality: number;
    completion: number;
    hasNutrition: boolean;
    hasIngredients: boolean;
    hasImage: boolean;
    hasAllergens: boolean;
    hasAdditives: boolean;
    hasOrigin: boolean;
    hasCertifications: boolean;
  } | null;
  truScore: {
    overall: number;
    breakdown: {
      Body: number;
      Planet: number;
      Ethics: number;
      Open: number;
    };
    hasNutriScore: boolean;
    hasEcoScore: boolean;
    hasOrigin: boolean;
    insights: string[];
  } | null;
  dataSources: {
    primarySource: string | null;
    allSources: string[]; // All databases that contributed data
    databasesQueried: string[]; // All databases that were queried
    nutrition: {
      source: string | null;
      sources: string[]; // All sources that provided nutrition data
      fieldsCount: number;
      hasEnergy: boolean;
      hasMacros: boolean;
    };
    ingredients: {
      source: string | null;
      sources: string[]; // All sources that provided ingredients
      length: number;
      hasHiddenTerms: boolean;
    };
    allergensAdditives: {
      allergensSource: string | null;
      allergensSources: string[]; // All sources that provided allergens
      allergensCount: number;
      additivesSource: string | null;
      additivesSources: string[]; // All sources that provided additives
      additivesCount: number;
      allergensTags: string[];
      additivesTags: string[];
    };
    countryOfOrigin: {
      source: string | null;
      sources: string[]; // All sources that provided origin data
      origins: string[];
      originsTags: string[];
      manufacturingPlaces: string[];
      manufacturingPlacesTags: string[];
    };
    scoreHighlights: {
      source: string;
      insights: string[];
      insightsCount: number;
    };
  };
  pillarBreakdown: {
    body: {
      score: number;
      base: number;
      adjustments: Array<{
        description: string;
        value: number;
        type: 'positive' | 'negative' | 'neutral';
      }>;
      details: any;
      dataSources: {
        nutrition: string | null;
        nutriScore: string | null;
        additives: string | null;
        nova: string | null;
      };
    };
    planet: {
      score: number;
      base: number;
      adjustments: Array<{
        description: string;
        value: number;
        type: 'positive' | 'negative' | 'neutral';
      }>;
      details: any;
      dataSources: {
        ecoscore: string | null;
        palmOil: string | null;
        packaging: string | null;
      };
    };
    ethics: {
      score: number;
      base: number;
      adjustments: Array<{
        description: string;
        value: number;
        type: 'positive' | 'negative' | 'neutral';
      }>;
      details: any;
      dataSources: {
        certifications: string | null;
        recalls: string | null;
        brandData: string | null;
      };
    };
    open: {
      score: number;
      base: number;
      adjustments: Array<{
        description: string;
        value: number;
        type: 'positive' | 'negative' | 'neutral';
      }>;
      details: any;
      dataSources: {
        ingredients: string | null;
        origin: string | null;
        brandOwner: string | null;
      };
    };
  } | null;
  errors: Array<{
    message: string;
    stack?: string;
  }>;
}

async function testBarcode(barcode: string): Promise<TestResult> {
  const startTime = Date.now();
  const results: TestResult = {
    barcode: barcode,
    timestamp: new Date().toISOString(),
    performance: {
      fetchTime: 0,
      fetchTimeFormatted: '',
      truScoreTime: 0,
      truScoreTimeFormatted: '',
      totalTime: 0,
      totalTimeFormatted: '',
    },
    product: null,
    truScore: null,
    dataSources: {
      primarySource: null,
      allSources: [],
      databasesQueried: [],
      nutrition: {
        source: null,
        sources: [],
        fieldsCount: 0,
        hasEnergy: false,
        hasMacros: false,
      },
      ingredients: {
        source: null,
        sources: [],
        length: 0,
        hasHiddenTerms: false,
      },
      allergensAdditives: {
        allergensSource: null,
        allergensSources: [],
        allergensCount: 0,
        additivesSource: null,
        additivesSources: [],
        additivesCount: 0,
        allergensTags: [],
        additivesTags: [],
      },
      countryOfOrigin: {
        source: null,
        sources: [],
        origins: [],
        originsTags: [],
        manufacturingPlaces: [],
        manufacturingPlacesTags: [],
      },
      scoreHighlights: {
        source: 'truScore_engine',
        insights: [],
        insightsCount: 0,
      },
    },
    pillarBreakdown: null,
    errors: [],
  };

  try {
    // Test product fetch performance
    const fetchStart = Date.now();
    console.log(`[TEST] Testing barcode: ${barcode}`);
    
    const product = await fetchProduct(
      barcode,
      true, // useCache
      false, // isPremium
      false  // isOffline
    );
    
    const fetchTime = Date.now() - fetchStart;
    results.performance.fetchTime = fetchTime;
    results.performance.fetchTimeFormatted = `${fetchTime}ms`;
    
    if (!product) {
      results.errors.push({ message: 'Product not found' });
      return results;
    }
    
    results.product = {
      barcode: product.barcode,
      product_name: product.product_name || 'Unknown',
      source: product.source || 'unknown',
      quality: product.quality || 0,
      completion: product.completion || 0,
      hasNutrition: !!(product.nutriments && Object.keys(product.nutriments).length > 0),
      hasIngredients: !!(product.ingredients_text && product.ingredients_text.length > 0),
      hasImage: !!(product.image_url),
      hasAllergens: !!(product.allergens && product.allergens.length > 0),
      hasAdditives: !!(product.additives && product.additives.length > 0),
      hasOrigin: !!(product.origins && product.origins.length > 0),
      hasCertifications: !!(product.labels_tags && product.labels_tags.length > 0),
    };
    
    // Extract all sources from product.source (can be comma-separated or +-separated)
    const primarySource = product.source || null;
    const allSources = primarySource 
      ? primarySource.split(/[+,]/).map(s => s.trim()).filter(Boolean)
      : [];
    
    results.dataSources.primarySource = primarySource;
    results.dataSources.allSources = allSources;
    results.dataSources.databasesQueried = allSources; // In a full implementation, this would track all queried DBs
    
    // Nutrition data source - check which sources typically provide nutrition
    const nutritionSources: string[] = [];
    if (product.nutriments && Object.keys(product.nutriments).length > 0) {
      // Open Food Facts, USDA, Health Canada, UK FSA, EFSA, FSANZ provide nutrition
      if (allSources.some(s => ['openfoodfacts', 'usda', 'healthcanada', 'ukfsa', 'efsa', 'nzfcd', 'afcd', 'fsanz'].includes(s.toLowerCase()))) {
        nutritionSources.push(...allSources.filter(s => ['openfoodfacts', 'usda', 'healthcanada', 'ukfsa', 'efsa', 'nzfcd', 'afcd', 'fsanz'].includes(s.toLowerCase())));
      } else {
        nutritionSources.push(allSources[0] || 'unknown');
      }
    }
    
    results.dataSources.nutrition = {
      source: nutritionSources[0] || null,
      sources: nutritionSources,
      fieldsCount: product.nutriments ? Object.keys(product.nutriments).length : 0,
      hasEnergy: !!(product.nutriments && (product.nutriments['energy-kcal_100g'] || product.nutriments['energy-kcal'] || product.nutriments['energy-kj_100g'])),
      hasMacros: !!(product.nutriments && (
        product.nutriments.proteins_100g || product.nutriments.proteins ||
        product.nutriments.carbohydrates_100g || product.nutriments.carbohydrates || 
        product.nutriments.fat_100g || product.nutriments.fat
      )),
    };
    
    // Ingredients data source
    const ingredientsSources: string[] = [];
    if (product.ingredients_text && product.ingredients_text.length > 0) {
      // Most sources can provide ingredients, but OFF is primary
      if (allSources.some(s => ['openfoodfacts', 'openbeautyfacts', 'web_search'].includes(s.toLowerCase()))) {
        ingredientsSources.push(...allSources.filter(s => ['openfoodfacts', 'openbeautyfacts', 'web_search'].includes(s.toLowerCase())));
      } else {
        ingredientsSources.push(allSources[0] || 'unknown');
      }
    }
    
    results.dataSources.ingredients = {
      source: ingredientsSources[0] || null,
      sources: ingredientsSources,
      length: product.ingredients_text ? product.ingredients_text.length : 0,
      hasHiddenTerms: product.ingredients_text ? (
        /parfum|fragrance|aroma|flavor|flavour|proprietary blend|secret formula|essence|spice|extract/i.test(product.ingredients_text)
      ) : false,
    };
    
    // Allergens & Additives data source
    const allergensSources: string[] = [];
    const additivesSources: string[] = [];
    
    if (product.allergens || (product.allergens_tags && product.allergens_tags.length > 0)) {
      // Open Food Facts, Open Beauty Facts, government databases provide allergen info
      if (allSources.some(s => ['openfoodfacts', 'openbeautyfacts', 'usda', 'healthcanada', 'ukfsa', 'efsa'].includes(s.toLowerCase()))) {
        allergensSources.push(...allSources.filter(s => ['openfoodfacts', 'openbeautyfacts', 'usda', 'healthcanada', 'ukfsa', 'efsa'].includes(s.toLowerCase())));
      } else {
        allergensSources.push(allSources[0] || 'unknown');
      }
    }
    
    if (product.additives || (product.additives_tags && product.additives_tags.length > 0)) {
      // Open Food Facts is primary for additives
      if (allSources.some(s => ['openfoodfacts', 'openbeautyfacts'].includes(s.toLowerCase()))) {
        additivesSources.push(...allSources.filter(s => ['openfoodfacts', 'openbeautyfacts'].includes(s.toLowerCase())));
      } else {
        additivesSources.push(allSources[0] || 'unknown');
      }
    }
    
    results.dataSources.allergensAdditives = {
      allergensSource: allergensSources[0] || null,
      allergensSources: allergensSources,
      allergensCount: product.allergens_tags ? product.allergens_tags.length : (product.allergens ? 1 : 0),
      additivesSource: additivesSources[0] || null,
      additivesSources: additivesSources,
      additivesCount: product.additives_tags ? product.additives_tags.length : (product.additives ? product.additives.length : 0),
      allergensTags: product.allergens_tags || [],
      additivesTags: product.additives_tags || [],
    };
    
    // Country of origin data source
    const originSources: string[] = [];
    const hasOrigin = !!(product.origins || (product.origins_tags && product.origins_tags.length > 0) ||
                        product.manufacturing_places || (product.manufacturing_places_tags && product.manufacturing_places_tags.length > 0));
    
    if (hasOrigin) {
      // Open Food Facts, user contributions, web search can provide origin
      if (allSources.some(s => ['openfoodfacts', 'openbeautyfacts', 'web_search', 'user_contributed'].includes(s.toLowerCase()))) {
        originSources.push(...allSources.filter(s => ['openfoodfacts', 'openbeautyfacts', 'web_search', 'user_contributed'].includes(s.toLowerCase())));
      } else {
        originSources.push(allSources[0] || 'unknown');
      }
    }
    
    results.dataSources.countryOfOrigin = {
      source: originSources[0] || null,
      sources: originSources,
      origins: typeof product.origins === 'string' ? [product.origins] : (product.origins || []),
      originsTags: product.origins_tags || [],
      manufacturingPlaces: typeof product.manufacturing_places === 'string' ? [product.manufacturing_places] : (product.manufacturing_places || []),
      manufacturingPlacesTags: product.manufacturing_places_tags || [],
    };
    
    // Test TruScore calculation performance
    const truScoreStart = Date.now();
    const truScoreResult = calculateTruScore(product);
    const truScoreTime = Date.now() - truScoreStart;
    
    results.performance.truScoreTime = truScoreTime;
    results.performance.truScoreTimeFormatted = `${truScoreTime}ms`;
    results.performance.totalTime = fetchTime + truScoreTime;
    results.performance.totalTimeFormatted = `${fetchTime + truScoreTime}ms`;
    
    // TruScore results
    // Convert Insight[] to string[] by extracting the reason property
    const insightsAsStrings = truScoreResult.insights 
      ? truScoreResult.insights.map(insight => insight.reason || String(insight))
      : [];
    
    results.truScore = {
      overall: truScoreResult.truscore,
      breakdown: truScoreResult.breakdown,
      hasNutriScore: truScoreResult.hasNutriScore || false,
      hasEcoScore: truScoreResult.hasEcoScore || false,
      hasOrigin: truScoreResult.hasOrigin || false,
      insights: insightsAsStrings,
    };
    
    // Detailed pillar breakdown
    if (truScoreResult.pillarDetails) {
      results.pillarBreakdown = {
        body: {
          score: truScoreResult.pillarDetails.body.score,
          base: truScoreResult.pillarDetails.body.base,
          adjustments: truScoreResult.pillarDetails.body.adjustments || [],
          details: truScoreResult.pillarDetails.body.details || {},
          dataSources: {
            nutrition: product.nutriments ? (product.source || null) : null,
            nutriScore: product.nutriscore_grade ? (product.source || null) : null,
            additives: product.additives ? (product.source || null) : null,
            nova: product.nova_group ? (product.source || null) : null,
          },
        },
        planet: {
          score: truScoreResult.pillarDetails.planet.score,
          base: truScoreResult.pillarDetails.planet.base,
          adjustments: truScoreResult.pillarDetails.planet.adjustments || [],
          details: truScoreResult.pillarDetails.planet.details || {},
          dataSources: {
            ecoscore: product.ecoscore_grade ? (product.source || null) : null,
            palmOil: product.ingredients_text ? (product.source || null) : null,
            packaging: product.packaging_data ? (product.source || null) : null,
          },
        },
        ethics: {
          score: truScoreResult.pillarDetails.ethics.score,
          base: truScoreResult.pillarDetails.ethics.base,
          adjustments: truScoreResult.pillarDetails.ethics.adjustments || [],
          details: truScoreResult.pillarDetails.ethics.details || {},
          dataSources: {
            certifications: product.labels_tags ? (product.source || null) : null,
            recalls: product.recalls ? (product.source || null) : null,
            brandData: product.brands ? 'internal_brand_database' : null,
          },
        },
        open: {
          score: truScoreResult.pillarDetails.open.score,
          base: truScoreResult.pillarDetails.open.base,
          adjustments: truScoreResult.pillarDetails.open.adjustments || [],
          details: truScoreResult.pillarDetails.open.details || {},
          dataSources: {
            ingredients: product.ingredients_text ? (product.source || null) : null,
            origin: product.origins ? (product.source || null) : null,
            brandOwner: product.brand_owner ? (product.source || null) : null,
          },
        },
      };
    }
    
    // Score highlights (insights)
    // Convert Insight[] to string[] by extracting the reason property
    const insightsForHighlights = truScoreResult.insights 
      ? truScoreResult.insights.map(insight => insight.reason || String(insight))
      : [];
    
    results.dataSources.scoreHighlights = {
      source: 'truScore_engine',
      insights: insightsForHighlights,
      insightsCount: insightsForHighlights.length,
    };
    
    console.log(`[TEST] ✅ Completed: ${barcode} - ${fetchTime + truScoreTime}ms`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    results.errors.push({
      message: errorMessage,
      stack: errorStack,
    });
    console.error(`[TEST] ❌ Error testing ${barcode}:`, errorMessage);
  }
  
  return results;
}

// Main execution
(async () => {
  const { barcodes, inputFile, outputFile: outputFileArg, htmlFile: htmlFileArg, noHtml } =
    parseBarcodeScriptArgs(process.argv.slice(2));

  if (barcodes.length === 0) {
    console.error('Usage: ts-node scripts/testBarcodePerformance.ts <barcode1> [barcode2] ...');
    console.error('   or: ts-node scripts/testBarcodePerformance.ts --file <path-to-txt> [--out <path.json>]');
    console.error('Or: npm run test:barcode-performance -- --file barcodes/barcodes-88.txt --out reports/test_results.json');
    process.exit(1);
  }

  const defaultReportPath = path.join(process.cwd(), 'reports', 'test_results.json');
  const outputFile =
    outputFileArg ?? (inputFile ? defaultReportPath : null);
  const writeJsonToDisk = Boolean(outputFile);

  const allResults = {
    testRun: {
      timestamp: new Date().toISOString(),
      barcodesTested: barcodes.length,
      totalTime: 0,
      totalTimeFormatted: '',
      inputFile: inputFile ? path.resolve(inputFile) : null,
      outputFile: outputFile ? path.resolve(outputFile) : null,
    },
    results: [] as TestResult[],
  };
  
  const overallStart = Date.now();
  
  for (const barcode of barcodes) {
    const result = await testBarcode(barcode);
    allResults.results.push(result);
  }
  
  const overallTime = Date.now() - overallStart;
  allResults.testRun.totalTime = overallTime;
  allResults.testRun.totalTimeFormatted = `${overallTime}ms`;

  if (writeJsonToDisk && outputFile) {
    const absOut = path.resolve(outputFile);
    fs.mkdirSync(path.dirname(absOut), { recursive: true });
    fs.writeFileSync(absOut, JSON.stringify(allResults, null, 2), 'utf-8');
    console.log(`\n[OK] Wrote JSON report: ${absOut}`);
    allResults.testRun.outputFile = absOut;

    if (absOut.toLowerCase().endsWith('.json')) {
      const csvPath = absOut.replace(/\.json$/i, '.csv');
      fs.writeFileSync(csvPath, buildBarcodeSummaryCsv(allResults.results), 'utf-8');
      console.log(`[OK] Wrote CSV (open in Excel): ${csvPath}`);
    }

    if (!noHtml) {
      const htmlPath = htmlFileArg
        ? path.resolve(htmlFileArg)
        : absOut.toLowerCase().endsWith('.json')
          ? absOut.replace(/\.json$/i, '.html')
          : null;
      if (htmlPath) {
        fs.writeFileSync(htmlPath, buildBarcodeReportHtml(allResults), 'utf-8');
        console.log(`[OK] Wrote HTML report (single file to share): ${htmlPath}`);
      }
    }
  } else {
    console.log('\n========================================');
    console.log('TEST RESULTS (JSON)');
    console.log('========================================\n');
    console.log(JSON.stringify(allResults, null, 2));
  }

  // Also output human-readable summary
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================\n');
  
  for (const result of allResults.results) {
    console.log(`\n📦 Barcode: ${result.barcode}`);
    console.log(`   Product: ${result.product?.product_name || 'Not found'}`);
    console.log(`   Source: ${result.product?.source || 'N/A'}`);
    console.log(`\n⏱️  Performance:`);
    console.log(`   Fetch Time: ${result.performance.fetchTimeFormatted}`);
    console.log(`   TruScore Time: ${result.performance.truScoreTimeFormatted}`);
    console.log(`   Total Time: ${result.performance.totalTimeFormatted}`);
    
    if (result.truScore) {
      console.log(`\n🏆 TruScore: ${result.truScore.overall}/100`);
      console.log(`   Body: ${result.truScore.breakdown.Body}/25`);
      console.log(`   Planet: ${result.truScore.breakdown.Planet}/25`);
      console.log(`   Ethics: ${result.truScore.breakdown.Ethics}/25`);
      console.log(`   Open: ${result.truScore.breakdown.Open}/25`);
    }
    
    if (result.pillarBreakdown) {
      console.log(`\n📊 Pillar Breakdown:`);
      
      console.log(`\n   BODY Pillar (${result.pillarBreakdown.body.score}/25):`);
      console.log(`      Base Score: ${result.pillarBreakdown.body.base}/25 (starting point)`);
      console.log(`      Final Score: ${result.pillarBreakdown.body.score}/25`);
      console.log(`      Calculation:`);
      console.log(`        1. Start with base score: ${result.pillarBreakdown.body.base}`);
      result.pillarBreakdown.body.adjustments.forEach((adj, idx) => {
        const sign = adj.type === 'positive' ? '+' : (adj.value < 0 ? '' : '-');
        const value = Math.abs(adj.value);
        console.log(`        ${idx + 2}. ${sign}${value} points: ${adj.description}`);
      });
      console.log(`      Data Sources Used:`);
      console.log(`        - Nutrition Data: ${result.pillarBreakdown.body.dataSources.nutrition || 'N/A'}`);
      console.log(`        - Nutri-Score Grade: ${result.pillarBreakdown.body.dataSources.nutriScore || 'N/A'}`);
      console.log(`        - Additives Information: ${result.pillarBreakdown.body.dataSources.additives || 'N/A'}`);
      console.log(`        - NOVA Processing Level: ${result.pillarBreakdown.body.dataSources.nova || 'N/A'}`);
      if (result.pillarBreakdown.body.details) {
        console.log(`      Details:`);
        if (result.pillarBreakdown.body.details.nutriscoreGrade) {
          console.log(`        - Nutri-Score: ${result.pillarBreakdown.body.details.nutriscoreGrade.toUpperCase()} (value: ${result.pillarBreakdown.body.details.nutriscoreValue || 'N/A'})`);
        }
        if (result.pillarBreakdown.body.details.additiveElementDeduction !== undefined) {
          console.log(`        - Additive element (MVP): -${result.pillarBreakdown.body.details.additiveElementDeduction} points`);
        }
        if (result.pillarBreakdown.body.details.novaAdjustment !== undefined && result.pillarBreakdown.body.details.novaAdjustment !== 0) {
          console.log(`        - NOVA Adjustment: ${result.pillarBreakdown.body.details.novaAdjustment > 0 ? '+' : ''}${result.pillarBreakdown.body.details.novaAdjustment} points`);
        }
      }
      
      console.log(`\n   PLANET Pillar (${result.pillarBreakdown.planet.score}/25):`);
      console.log(`      Base Score: ${result.pillarBreakdown.planet.base}/25 (starting point)`);
      console.log(`      Final Score: ${result.pillarBreakdown.planet.score}/25`);
      console.log(`      Calculation:`);
      console.log(`        1. Start with base score: ${result.pillarBreakdown.planet.base}`);
      result.pillarBreakdown.planet.adjustments.forEach((adj, idx) => {
        const sign = adj.type === 'positive' ? '+' : (adj.value < 0 ? '' : '-');
        const value = Math.abs(adj.value);
        console.log(`        ${idx + 2}. ${sign}${value} points: ${adj.description}`);
      });
      console.log(`      Data Sources Used:`);
      console.log(`        - Eco-Score Grade: ${result.pillarBreakdown.planet.dataSources.ecoscore || 'N/A'}`);
      console.log(`        - Palm Oil Analysis: ${result.pillarBreakdown.planet.dataSources.palmOil || 'N/A'}`);
      console.log(`        - Packaging Information: ${result.pillarBreakdown.planet.dataSources.packaging || 'N/A'}`);
      if (result.pillarBreakdown.planet.details) {
        console.log(`      Details:`);
        const pd = result.pillarBreakdown.planet.details as Record<string, unknown>;
        if (pd.ecoscoreGrade) {
          console.log(
            `        - Eco-Score: ${String(pd.ecoscoreGrade).toUpperCase()} (adjustment: ${pd.ecoscoreAdjustment ?? 'N/A'})`
          );
        }
        if (pd.packagingFallbackPoints !== undefined && Number(pd.packagingFallbackPoints) > 0) {
          console.log(`        - Packaging fallback: +${pd.packagingFallbackPoints} (jurisdiction: ${pd.packagingJurisdiction ?? 'n/a'})`);
        }
        console.log(`        - Palm on Planet (MVP): ${pd.palmOilPlanetAdjustment ?? 0} pts`);
      }
      
      console.log(`\n   ETHICS Pillar (${result.pillarBreakdown.ethics.score}/25):`);
      console.log(`      Base Score: ${result.pillarBreakdown.ethics.base}/25 (starting point)`);
      console.log(`      Final Score: ${result.pillarBreakdown.ethics.score}/25`);
      console.log(`      Calculation:`);
      console.log(`        1. Start with base score: ${result.pillarBreakdown.ethics.base}`);
      result.pillarBreakdown.ethics.adjustments.forEach((adj, idx) => {
        const sign = adj.type === 'positive' ? '+' : (adj.value < 0 ? '' : '-');
        const value = Math.abs(adj.value);
        console.log(`        ${idx + 2}. ${sign}${value} points: ${adj.description}`);
      });
      console.log(`      Data Sources Used:`);
      console.log(`        - Certifications: ${result.pillarBreakdown.ethics.dataSources.certifications || 'N/A'}`);
      console.log(`        - Product Recalls: ${result.pillarBreakdown.ethics.dataSources.recalls || 'N/A'}`);
      console.log(`        - Brand/Parent Company Data: ${result.pillarBreakdown.ethics.dataSources.brandData || 'N/A'}`);
      if (result.pillarBreakdown.ethics.details) {
        console.log(`      Details:`);
        if (result.pillarBreakdown.ethics.details.certificationBonus !== undefined && result.pillarBreakdown.ethics.details.certificationBonus > 0) {
          console.log(`        - Certification Bonus: +${result.pillarBreakdown.ethics.details.certificationBonus} points`);
        }
        if (result.pillarBreakdown.ethics.details.animalCrueltyPenalty !== undefined && result.pillarBreakdown.ethics.details.animalCrueltyPenalty > 0) {
          console.log(`        - Animal Cruelty Penalty: -${result.pillarBreakdown.ethics.details.animalCrueltyPenalty} points`);
        }
        if (result.pillarBreakdown.ethics.details.laborViolationPenalty !== undefined && result.pillarBreakdown.ethics.details.laborViolationPenalty > 0) {
          console.log(`        - Labor Violation Penalty: -${result.pillarBreakdown.ethics.details.laborViolationPenalty} points`);
        }
        if (result.pillarBreakdown.ethics.details.recallPenalty !== undefined && result.pillarBreakdown.ethics.details.recallPenalty > 0) {
          console.log(`        - Recall Penalty: -${result.pillarBreakdown.ethics.details.recallPenalty} points`);
        }
      }
      
      console.log(`\n   OPEN Pillar (${result.pillarBreakdown.open.score}/25):`);
      console.log(`      Base Score: ${result.pillarBreakdown.open.base}/25 (starting point)`);
      console.log(`      Final Score: ${result.pillarBreakdown.open.score}/25`);
      console.log(`      Calculation:`);
      console.log(`        1. Start with base score: ${result.pillarBreakdown.open.base}`);
      result.pillarBreakdown.open.adjustments.forEach((adj, idx) => {
        const sign = adj.type === 'positive' ? '+' : (adj.value < 0 ? '' : '-');
        const value = Math.abs(adj.value);
        console.log(`        ${idx + 2}. ${sign}${value} points: ${adj.description}`);
      });
      console.log(`      Data Sources Used:`);
      console.log(`        - Ingredients List: ${result.pillarBreakdown.open.dataSources.ingredients || 'N/A'}`);
      console.log(`        - Country of Origin: ${result.pillarBreakdown.open.dataSources.origin || 'N/A'}`);
      console.log(`        - Brand Owner/Parent Company: ${result.pillarBreakdown.open.dataSources.brandOwner || 'N/A'}`);
      if (result.pillarBreakdown.open.details) {
        console.log(`      Details:`);
        if (result.pillarBreakdown.open.details.ingredientsLength !== undefined) {
          console.log(`        - Ingredients Length: ${result.pillarBreakdown.open.details.ingredientsLength} characters`);
          console.log(`        - Ingredients Score: ${result.pillarBreakdown.open.details.ingredientsScore || 0} points`);
        }
        if (result.pillarBreakdown.open.details.hiddenTermsCount !== undefined && result.pillarBreakdown.open.details.hiddenTermsCount > 0) {
          console.log(`        - Hidden Terms Found: ${result.pillarBreakdown.open.details.hiddenTermsCount}`);
          console.log(`        - Hidden Terms Penalty: -${result.pillarBreakdown.open.details.hiddenTermsPenalty || 0} points`);
        }
        if (result.pillarBreakdown.open.details.listingClarityBonus !== undefined && result.pillarBreakdown.open.details.listingClarityBonus > 0) {
          console.log(`        - Listing clarity bonus: +${result.pillarBreakdown.open.details.listingClarityBonus} points`);
        }
        if (result.pillarBreakdown.open.details.originPenalty !== undefined && result.pillarBreakdown.open.details.originPenalty > 0) {
          console.log(`        - Origin Penalty: -${result.pillarBreakdown.open.details.originPenalty} points`);
        }
      }
    }
    
    console.log(`\n📋 Data Sources:`);
    console.log(`   Primary Source: ${result.dataSources.primarySource || 'N/A'}`);
    console.log(`   All Sources: ${result.dataSources.allSources.length > 0 ? result.dataSources.allSources.join(', ') : 'N/A'}`);
    console.log(`   Databases Queried: ${result.dataSources.databasesQueried.length > 0 ? result.dataSources.databasesQueried.join(', ') : 'N/A'}`);
    console.log(`\n   Ingredients:`);
    console.log(`      Source(s): ${result.dataSources.ingredients.sources.length > 0 ? result.dataSources.ingredients.sources.join(', ') : 'N/A'}`);
    console.log(`      Length: ${result.dataSources.ingredients.length} characters`);
    console.log(`      Has Hidden Terms: ${result.dataSources.ingredients.hasHiddenTerms ? 'Yes' : 'No'}`);
    console.log(`\n   Nutrition:`);
    console.log(`      Source(s): ${result.dataSources.nutrition.sources.length > 0 ? result.dataSources.nutrition.sources.join(', ') : 'N/A'}`);
    console.log(`      Fields: ${result.dataSources.nutrition.fieldsCount}`);
    console.log(`      Has Energy: ${result.dataSources.nutrition.hasEnergy ? 'Yes' : 'No'}`);
    console.log(`      Has Macros: ${result.dataSources.nutrition.hasMacros ? 'Yes' : 'No'}`);
    console.log(`\n   Allergens & Additives:`);
    console.log(`      Allergens Source(s): ${result.dataSources.allergensAdditives.allergensSources.length > 0 ? result.dataSources.allergensAdditives.allergensSources.join(', ') : 'N/A'}`);
    console.log(`      Allergens Count: ${result.dataSources.allergensAdditives.allergensCount}`);
    console.log(`      Allergens Tags: ${result.dataSources.allergensAdditives.allergensTags.length > 0 ? result.dataSources.allergensAdditives.allergensTags.join(', ') : 'None'}`);
    console.log(`      Additives Source(s): ${result.dataSources.allergensAdditives.additivesSources.length > 0 ? result.dataSources.allergensAdditives.additivesSources.join(', ') : 'N/A'}`);
    console.log(`      Additives Count: ${result.dataSources.allergensAdditives.additivesCount}`);
    console.log(`      Additives Tags: ${result.dataSources.allergensAdditives.additivesTags.slice(0, 10).join(', ')}${result.dataSources.allergensAdditives.additivesTags.length > 10 ? '...' : ''}`);
    console.log(`\n   Country of Origin:`);
    console.log(`      Source(s): ${result.dataSources.countryOfOrigin.sources.length > 0 ? result.dataSources.countryOfOrigin.sources.join(', ') : 'N/A'}`);
    console.log(`      Origins: ${result.dataSources.countryOfOrigin.origins.length > 0 ? result.dataSources.countryOfOrigin.origins.join(', ') : 'N/A'}`);
    console.log(`      Origins Tags: ${result.dataSources.countryOfOrigin.originsTags.length > 0 ? result.dataSources.countryOfOrigin.originsTags.join(', ') : 'None'}`);
    console.log(`      Manufacturing Places: ${result.dataSources.countryOfOrigin.manufacturingPlaces.length > 0 ? result.dataSources.countryOfOrigin.manufacturingPlaces.join(', ') : 'N/A'}`);
    console.log(`      Manufacturing Places Tags: ${result.dataSources.countryOfOrigin.manufacturingPlacesTags.length > 0 ? result.dataSources.countryOfOrigin.manufacturingPlacesTags.join(', ') : 'None'}`);
    console.log(`\n   Score Highlights:`);
    console.log(`      Source: ${result.dataSources.scoreHighlights.source}`);
    console.log(`      Insights Count: ${result.dataSources.scoreHighlights.insightsCount}`);
    if (result.dataSources.scoreHighlights.insights.length > 0) {
      result.dataSources.scoreHighlights.insights.forEach((insight, idx) => {
        console.log(`      ${idx + 1}. ${insight}`);
      });
    }
    
    if (result.errors.length > 0) {
      console.log(`\n❌ Errors: ${result.errors.length}`);
      result.errors.forEach(err => {
        console.log(`   - ${err.message}`);
      });
    }
  }
  
  console.log(`\n\n⏱️  Total Test Time: ${allResults.testRun.totalTimeFormatted}`);
  console.log(`📊 Barcodes Tested: ${allResults.testRun.barcodesTested}`);
  console.log('');
  
})().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

