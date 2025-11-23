// FSANZ Database CDN Service
// Handles downloading pre-converted JSON files from CDN/server
// This is the recommended approach for automatic updates

import * as FileSystem from 'expo-file-system/legacy';
import { logger } from '../utils/logger';
import { importFSANZDatabaseFromJSON, getFSANZDatabaseMetadata } from './fsanDatabaseImport';
import { getCachePath } from '../utils/fileSystemHelper';
import { createTimeoutSignal } from '../utils/timeoutHelper';

/**
 * CDN Configuration
 * Replace these URLs with your actual CDN/server URLs where pre-converted JSON files are hosted
 * 
 * Recommended setup:
 * 1. Download FSANZ databases from official websites
 * 2. Convert to JSON using the conversion script
 * 3. Host JSON files on CDN (e.g., AWS S3, Cloudflare, GitHub Releases)
 * 4. Update these URLs to point to your CDN
 */
const FSANZ_CDN_CONFIG = {
  // Example URLs - replace with your actual CDN URLs
  AU: {
    latest: 'https://your-cdn.com/fsanz-au-latest.json',
    versioned: 'https://your-cdn.com/fsanz-au-v{version}.json',
    manifest: 'https://your-cdn.com/fsanz-au-manifest.json', // Contains version, size, checksum
  },
  NZ: {
    latest: 'https://your-cdn.com/fsanz-nz-latest.json',
    versioned: 'https://your-cdn.com/fsanz-nz-v{version}.json',
    manifest: 'https://your-cdn.com/fsanz-nz-manifest.json',
  },
};

interface DatabaseManifest {
  version: string;
  productCount: number;
  fileSize: number;
  checksum: string; // SHA-256 hash
  lastUpdated: string; // ISO date string
  downloadUrl: string;
}

/**
 * Fetch database manifest to check for updates
 */
async function fetchManifest(country: 'AU' | 'NZ'): Promise<DatabaseManifest | null> {
  try {
    const manifestUrl = FSANZ_CDN_CONFIG[country].manifest;
    
    const response = await fetch(manifestUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TrueScan-FoodScanner/1.0.0',
      },
      signal: createTimeoutSignal(10000), // 10 second timeout
    });
    
    if (!response.ok) {
      logger.warn(`Failed to fetch manifest for ${country}: ${response.status}`);
      return null;
    }
    
    const manifest: DatabaseManifest = await response.json();
    return manifest;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching manifest for ${country}:`, errorMessage);
    return null;
  }
}

/**
 * Check if database needs update by comparing versions
 */
export async function checkDatabaseVersion(country: 'AU' | 'NZ'): Promise<{
  needsUpdate: boolean;
  currentVersion?: string;
  latestVersion?: string;
  manifest?: DatabaseManifest;
}> {
  try {
    // Get current database metadata
    const { getFSANZDatabaseMetadata } = await import('./fsanDatabaseImport');
    const currentMetadata = await getFSANZDatabaseMetadata(country);
    
    // Fetch latest manifest
    const manifest = await fetchManifest(country);
    
    if (!manifest) {
      return {
        needsUpdate: false,
        currentVersion: currentMetadata ? 'unknown' : undefined,
      };
    }
    
    // Compare versions (if current metadata has version info)
    // For now, we'll check if database exists and manifest has newer date
    const needsUpdate: boolean = !currentMetadata || 
      (manifest.lastUpdated ? (new Date(manifest.lastUpdated) > new Date(currentMetadata.importDate)) : false);
    
    return {
      needsUpdate,
      currentVersion: currentMetadata ? 'unknown' : undefined,
      latestVersion: manifest.version,
      manifest,
    };
  } catch (error) {
    logger.error(`Error checking database version for ${country}:`, error);
    return {
      needsUpdate: false,
    };
  }
}

/**
 * Download and import database from CDN
 */
export async function downloadFromCDN(
  country: 'AU' | 'NZ',
  url?: string
): Promise<{ success: boolean; productCount?: number; error?: string }> {
  try {
    const downloadUrl = url || FSANZ_CDN_CONFIG[country].latest;
    
    logger.info(`Downloading FSANZ ${country} database from CDN: ${downloadUrl}`);
    
    // Download JSON file
    const downloadPath = getCachePath(`fsanz-${country.toLowerCase()}-download.json`);
    const downloadResult = await FileSystem.downloadAsync(
      downloadUrl,
      downloadPath
    );
    
    if (downloadResult.status !== 200) {
      throw new Error(`Download failed with status ${downloadResult.status}`);
    }
    
    // Read JSON content
    const jsonContent = await FileSystem.readAsStringAsync(downloadResult.uri);
    
    // Validate JSON
    try {
      JSON.parse(jsonContent);
    } catch {
      throw new Error('Downloaded file is not valid JSON');
    }
    
    // Import into app
    const { importFSANZDatabaseFromJSON } = await import('./fsanDatabaseImport');
    const importResult = await importFSANZDatabaseFromJSON(jsonContent, country);
    
    // Clean up temp file
    await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
    
    if (importResult.success) {
      logger.info(`✅ Successfully downloaded and imported FSANZ ${country} database: ${importResult.productCount} products`);
    }
    
    return importResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error downloading from CDN for ${country}:`, errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update database from CDN if newer version available
 */
export async function updateFromCDNIfNeeded(country: 'AU' | 'NZ'): Promise<{
  updated: boolean;
  productCount?: number;
  error?: string;
}> {
  try {
    // Check if update is needed
    const versionCheck = await checkDatabaseVersion(country);
    
    if (!versionCheck.needsUpdate) {
      logger.debug(`FSANZ ${country} database is up to date`);
      return {
        updated: false,
      };
    }
    
    // Download and import
    const manifest = versionCheck.manifest;
    const downloadUrl = manifest?.downloadUrl || FSANZ_CDN_CONFIG[country].latest;
    
    const result = await downloadFromCDN(country, downloadUrl);
    
    return {
      updated: result.success,
      productCount: result.productCount,
      error: result.error,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      updated: false,
      error: errorMessage,
    };
  }
}

/**
 * Get CDN configuration (for settings/UI)
 */
export function getCDNConfig() {
  return FSANZ_CDN_CONFIG;
}

/**
 * Update CDN URLs (for admin/settings)
 */
export function updateCDNConfig(country: 'AU' | 'NZ', config: Partial<typeof FSANZ_CDN_CONFIG.AU>) {
  FSANZ_CDN_CONFIG[country] = {
    ...FSANZ_CDN_CONFIG[country],
    ...config,
  };
  logger.info(`Updated CDN config for ${country}`);
}

