// FSANZ Database Automatic Download Service
// Automatically downloads and installs FSANZ databases for NZ/AU users on first launch
// Ensures databases are always available for these critical markets

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { getUserCountryCode } from '../utils/countryDetection';
import { importFSANZDatabase, isFSANZDatabaseAvailable } from './fsanDatabaseImporter';
import { FSANZDatabase } from './fsanDatabaseImporter';

const FSANZ_DOWNLOAD_KEY = '@truescan_fsanz_download_status';
const FSANZ_DOWNLOAD_ATTEMPTED_KEY = '@truescan_fsanz_download_attempted';

// FSANZ Database Download URLs
// NOTE: Auto-download is DISABLED - we now use server-side API (/api/fsanz-query)
// These URLs are kept for backwards compatibility but should not be used
// The server-side API has access to the full 2,857+17,109 food databases
const FSANZ_DATABASE_URLS = {
  AU: process.env.EXPO_PUBLIC_FSANZ_AU_URL || 'https://your-cdn.com/fsanz-au.json',
  NZ: process.env.EXPO_PUBLIC_FSANZ_NZ_URL || 'https://your-cdn.com/fsanz-nz.json',
};

/**
 * Automatically download and install FSANZ database for NZ/AU users
 * Runs on first app launch for these users
 */
export async function autoDownloadFSANZDatabase(country: 'AU' | 'NZ'): Promise<{
  success: boolean;
  message: string;
  productCount?: number;
}> {
  // AUTO-DOWNLOAD DISABLED: We now use server-side API (/api/fsanz-query)
  // The old barcode-based local database system is no longer needed
  // The server-side API has access to the full 2,857+17,109 food databases
  logger.info(`ℹ️  FSANZ ${country} auto-download is disabled - using server-side API instead`);
  logger.info(`   📡 All FSANZ queries go to /api/fsanz-query (queries both NZFCD and AFCD)`);
  
  return {
    success: true,
    message: 'Using server-side API - no local download needed',
    productCount: 0, // Not applicable - using server API
  };
  
  /* DISABLED CODE - Kept for reference
  try {
    // Check if database already exists
    const isAvailable = await isFSANZDatabaseAvailable(country);
    if (isAvailable) {
      logger.info(`✅ FSANZ ${country} database already available - skipping download`);
      return {
        success: true,
        message: 'Database already available',
      };
    }

    // REMOVED: Retry blocking logic - always allow download attempts
    // This ensures NZ/AU users can get the database immediately when endpoint is fixed
    // The download will succeed if endpoint is working, fail gracefully if not

    const downloadUrl = FSANZ_DATABASE_URLS[country];
    
    // Check if URL is configured
    if (!downloadUrl || downloadUrl.includes('your-cdn.com')) {
      logger.warn(`FSANZ ${country} database download URL not configured`);
      logger.info(`To enable auto-download, set EXPO_PUBLIC_FSANZ_${country}_URL environment variable`);
      logger.info(`Or host the JSON file and update FSANZ_DATABASE_URLS in fsanDatabaseAutoDownload.ts`);
      
      return {
        success: false,
        message: 'Download URL not configured - database can be manually imported via Settings',
      };
    }

    logger.info(`📥 Starting automatic download of FSANZ ${country} database...`);
    logger.info(`   URL: ${downloadUrl}`);

    // Use fetch instead of FileSystem.downloadAsync to avoid 401 issues
    // FileSystem.downloadAsync sometimes has issues with Vercel endpoints
    logger.info(`   Making fetch request to: ${downloadUrl}`);
    
    let response: Response;
    try {
      response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TrueScan-Mobile/1.0.0',
          'X-Requested-With': 'XMLHttpRequest',
        },
        // Don't include Content-Type for GET requests - can cause issues
      });
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      logger.error(`   Fetch error: ${errorMessage}`);
      throw new Error(`Network error: ${errorMessage}`);
    }

    logger.info(`   Response status: ${response.status} ${response.statusText}`);
    logger.info(`   Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);

    if (!response.ok) {
      // Try to get error body for better debugging
      let errorBody = '';
      try {
        errorBody = await response.text();
        logger.error(`   Error response body: ${errorBody.substring(0, 200)}`);
      } catch (e) {
        // Ignore error reading body
      }
      throw new Error(`Download failed with status ${response.status} ${response.statusText}${errorBody ? `: ${errorBody.substring(0, 100)}` : ''}`);
    }

    // Get content length from headers
    const contentLength = response.headers.get('content-length');
    const sizeMB = contentLength ? (parseInt(contentLength, 10) / 1024 / 1024).toFixed(2) : '0.00';
    logger.info(`✅ Downloaded FSANZ ${country} database (${sizeMB}MB)`);

    // Parse JSON directly from response
    const databaseData: FSANZDatabase = await response.json();

    // Import the database (even if empty - allows future population)
    logger.info(`📦 Importing FSANZ ${country} database...`);
    const importResult = await importFSANZDatabase(databaseData, country);

    if (!importResult.success) {
      // Only fail if it's a real error, not just empty database
      if (importResult.error && !importResult.error.includes('empty')) {
        throw new Error(importResult.error || 'Import failed');
      } else {
        // Empty database is OK - mark as successful so we don't retry constantly
        logger.info(`⚠️  FSANZ ${country} database is empty but imported successfully (ready for future data)`);
      }
    }

    // No file cleanup needed - we used fetch instead of FileSystem

    // Mark download as successful
    await AsyncStorage.setItem(`${FSANZ_DOWNLOAD_KEY}_${country}`, Date.now().toString());
    // Clear any old attempt flags
    const downloadAttemptedKey = `${FSANZ_DOWNLOAD_ATTEMPTED_KEY}_${country}`;
    await AsyncStorage.removeItem(downloadAttemptedKey);

    logger.info(`✅ Successfully downloaded and imported FSANZ ${country} database: ${importResult.productCount?.toLocaleString()} products`);

    return {
      success: true,
      message: `Successfully imported ${importResult.productCount?.toLocaleString()} products`,
      productCount: importResult.productCount,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error auto-downloading FSANZ ${country} database:`, errorMessage);
    
    // Don't block future attempts - allow retry on next app launch
    // This ensures users get the database as soon as endpoint is fixed

    return {
      success: false,
      message: `Download failed: ${errorMessage}. Will retry on next app launch.`,
    };
  }
  */ // END DISABLED CODE
}

/**
 * Initialize FSANZ databases for NZ/AU users automatically
 * Downloads if not already available
 */
export async function initializeFSANZForCountry(): Promise<void> {
  try {
    const userCountry = getUserCountryCode();
    
    if (userCountry !== 'AU' && userCountry !== 'NZ') {
      // Not AU/NZ user, skip
      return;
    }

    logger.info(`───────────────────────────────────────────────────────────────`);
    logger.info(`📥 FSANZ Database Auto-Download for ${userCountry}`);
    logger.info(`───────────────────────────────────────────────────────────────`);

    // Check if already available
    const isAvailable = await isFSANZDatabaseAvailable(userCountry as 'AU' | 'NZ');
    
    if (isAvailable) {
      logger.info(`✅ FSANZ ${userCountry} database already available`);
      return;
    }

    // Attempt automatic download
    logger.info(`🔍 FSANZ ${userCountry} database not found - attempting automatic download...`);
    
    const result = await autoDownloadFSANZDatabase(userCountry as 'AU' | 'NZ');
    
    if (result.success) {
      logger.info(`✅ FSANZ ${userCountry} database automatically downloaded and installed`);
      logger.info(`   Products: ${result.productCount?.toLocaleString() || 'N/A'}`);
    } else {
      logger.warn(`⚠️  FSANZ ${userCountry} database auto-download failed: ${result.message}`);
      logger.info(`   Database will be automatically downloaded on next app launch`);
      logger.info(`   Source: ${userCountry === 'AU' ? 'https://www.foodstandards.gov.au/' : 'https://www.mpi.govt.nz/'}`);
    }

    logger.info(`───────────────────────────────────────────────────────────────`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error initializing FSANZ for country:', errorMessage);
    // Non-blocking - app continues normally
  }
}

/**
 * Check if FSANZ database was auto-downloaded
 */
export async function wasFSANZAutoDownloaded(country: 'AU' | 'NZ'): Promise<boolean> {
  try {
    const downloadTime = await AsyncStorage.getItem(`${FSANZ_DOWNLOAD_KEY}_${country}`);
    return downloadTime !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Clear the download attempted flag to force a retry
 * Useful when endpoint is fixed and user wants to retry immediately
 */
export async function clearFSANZDownloadAttempted(country: 'AU' | 'NZ'): Promise<void> {
  try {
    const downloadAttemptedKey = `${FSANZ_DOWNLOAD_ATTEMPTED_KEY}_${country}`;
    await AsyncStorage.removeItem(downloadAttemptedKey);
    logger.info(`✅ Cleared FSANZ ${country} download attempted flag - retry will be allowed`);
  } catch (error) {
    logger.error(`Error clearing FSANZ ${country} download attempted flag:`, error);
  }
}

/**
 * Force retry download (clears attempted flag and downloads immediately)
 */
export async function forceRetryFSANZDownload(country: 'AU' | 'NZ'): Promise<{
  success: boolean;
  message: string;
  productCount?: number;
}> {
  // Clear the attempted flag first
  await clearFSANZDownloadAttempted(country);
  
  // Then attempt download
  logger.info(`🔄 Force retrying FSANZ ${country} database download...`);
  return autoDownloadFSANZDatabase(country);
}
