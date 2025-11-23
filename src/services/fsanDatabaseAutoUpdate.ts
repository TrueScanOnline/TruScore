// FSANZ Database Automatic Update Service
// Handles automatic downloading and updating of FSANZ databases

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { logger } from '../utils/logger';
import { getUserCountryCode } from '../utils/countryDetection';
import { importFSANZDatabaseFromJSON, getFSANZDatabaseMetadata } from './fsanDatabaseImport';
import { getCachePath } from '../utils/fileSystemHelper';

const FSANZ_UPDATE_CHECK_KEY = '@truescan_fsanz_last_update_check';
const FSANZ_UPDATE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const FSANZ_AUTO_UPDATE_ENABLED_KEY = '@truescan_fsanz_auto_update_enabled';

// FSANZ database download URLs (these may need to be updated if FSANZ changes their structure)
// Note: FSANZ doesn't provide direct JSON APIs, so we'll need to download Excel/CSV and convert
const FSANZ_DATABASE_URLS = {
  AU: {
    // Primary: FSANZ Branded Food Database
    primary: 'https://www.foodstandards.gov.au/science/monitoringnutrients/Branded-food-database/Pages/default.aspx',
    // Alternative: AFCD database
    alternative: 'https://www.foodstandards.gov.au/science/monitoringnutrients/afcd/Pages/default.aspx',
    // If FSANZ provides direct download links, add them here
    directDownload: null, // Will be populated if available
  },
  NZ: {
    // MPI Food Composition Database
    primary: 'https://www.mpi.govt.nz/food-safety/food-monitoring-and-surveillance/food-composition-database/',
    directDownload: null, // Will be populated if available
  },
};

/**
 * Check if auto-update is enabled
 * Defaults to true (enabled) for new users - users can opt-out if they prefer
 */
export async function isAutoUpdateEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(FSANZ_AUTO_UPDATE_ENABLED_KEY);
    // If no value exists (first launch), default to true (enabled)
    // If value exists, return the stored preference
    if (enabled === null) {
      return true; // Default to enabled for new users
    }
    return enabled === 'true';
  } catch {
    return true; // Default to enabled if error (better UX - users can disable if needed)
  }
}

/**
 * Enable or disable auto-update
 */
export async function setAutoUpdateEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(FSANZ_AUTO_UPDATE_ENABLED_KEY, String(enabled));
  logger.info(`FSANZ auto-update ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Get the last update check timestamp
 */
async function getLastUpdateCheck(): Promise<number | null> {
  try {
    const timestamp = await AsyncStorage.getItem(FSANZ_UPDATE_CHECK_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Set the last update check timestamp
 */
async function setLastUpdateCheck(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(FSANZ_UPDATE_CHECK_KEY, String(timestamp));
}

/**
 * Check if it's time to check for updates
 */
async function shouldCheckForUpdate(): Promise<boolean> {
  const lastCheck = await getLastUpdateCheck();
  if (!lastCheck) {
    return true; // Never checked, check now
  }
  
  const now = Date.now();
  const timeSinceLastCheck = now - lastCheck;
  
  return timeSinceLastCheck >= FSANZ_UPDATE_INTERVAL;
}

/**
 * Download FSANZ database from URL
 * Since FSANZ doesn't provide direct JSON APIs, this attempts to:
 * 1. Download Excel/CSV file if direct link available
 * 2. Convert to JSON
 * 3. Import into app
 */
async function downloadFSANZDatabase(country: 'AU' | 'NZ'): Promise<{ success: boolean; productCount?: number; error?: string }> {
  try {
    logger.info(`Starting automatic FSANZ ${country} database download...`);
    
    // Check if we have a direct download URL
    const urlConfig = FSANZ_DATABASE_URLS[country];
    
    if (!urlConfig.directDownload) {
      // No direct download URL available
      // FSANZ typically requires manual download from their website
      logger.warn(`No direct download URL available for FSANZ ${country}. Manual download required.`);
      
      return {
        success: false,
        error: 'Direct download not available. Please download manually from FSANZ website.',
      };
    }
    
    // Download the file
    const CACHE_DIR = getCachePath('truescan/');
    const downloadResult = await FileSystem.downloadAsync(
      urlConfig.directDownload!,
      `${CACHE_DIR}fsanz-${country.toLowerCase()}-temp.xlsx`
    );
    
    if (downloadResult.status !== 200) {
      throw new Error(`Download failed with status ${downloadResult.status}`);
    }
    
    // Read the downloaded file
    const fileContent = await FileSystem.readAsStringAsync(downloadResult.uri);
    
    // Convert Excel to JSON (simplified - in production, use the conversion script)
    // For now, we'll need to use a server-side conversion or pre-converted JSON
    logger.warn('Excel conversion requires server-side processing. Using pre-converted JSON if available.');
    
    // Clean up temp file
    await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
    
    return {
      success: false,
      error: 'Automatic conversion not yet implemented. Please use manual import.',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error downloading FSANZ ${country} database:`, errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Download pre-converted JSON from a CDN or server
 * This is the recommended approach: host pre-converted JSON files on a server/CDN
 */
async function downloadPreConvertedJSON(country: 'AU' | 'NZ'): Promise<{ success: boolean; productCount?: number; error?: string }> {
  try {
    // TODO: Replace with actual CDN/server URL where pre-converted JSON files are hosted
    const jsonUrl = `https://your-cdn.com/fsanz-${country.toLowerCase()}-latest.json`;
    
    logger.info(`Downloading pre-converted FSANZ ${country} JSON from ${jsonUrl}...`);
    
    // Download JSON file
    const downloadPath = getCachePath(`fsanz-${country.toLowerCase()}-latest.json`);
    const downloadResult = await FileSystem.downloadAsync(
      jsonUrl,
      downloadPath
    );
    
    if (downloadResult.status !== 200) {
      throw new Error(`Download failed with status ${downloadResult.status}`);
    }
    
    // Read JSON content
    const jsonContent = await FileSystem.readAsStringAsync(downloadResult.uri);
    
    // Import into app
    const importResult = await importFSANZDatabaseFromJSON(jsonContent, country);
    
    // Clean up temp file
    await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
    
    if (importResult.success) {
      logger.info(`✅ Successfully auto-updated FSANZ ${country} database: ${importResult.productCount} products`);
    }
    
    return importResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error downloading pre-converted JSON for ${country}:`, errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check for FSANZ database updates
 * This is the main function that should be called periodically
 */
export async function checkForUpdates(country?: 'AU' | 'NZ'): Promise<{
  checked: boolean;
  updated: boolean;
  countries: Array<{ country: 'AU' | 'NZ'; success: boolean; productCount?: number; error?: string }>;
}> {
  try {
    // Check if auto-update is enabled
    const enabled = await isAutoUpdateEnabled();
    if (!enabled) {
      logger.debug('FSANZ auto-update is disabled');
      return {
        checked: false,
        updated: false,
        countries: [],
      };
    }
    
    // Check if it's time to check for updates
    if (!(await shouldCheckForUpdate())) {
      logger.debug('Not time to check for FSANZ updates yet');
      return {
        checked: false,
        updated: false,
        countries: [],
      };
    }
    
    // Update last check timestamp
    await setLastUpdateCheck(Date.now());
    
    // Determine which countries to check
    const countriesToCheck: Array<'AU' | 'NZ'> = [];
    if (country) {
      countriesToCheck.push(country);
    } else {
      const userCountry = getUserCountryCode();
      if (userCountry === 'AU' || userCountry === 'NZ') {
        countriesToCheck.push(userCountry);
      } else {
        // Check both if user is not in AU/NZ (for testing or global users)
        countriesToCheck.push('AU', 'NZ');
      }
    }
    
    logger.info(`Checking for FSANZ database updates for: ${countriesToCheck.join(', ')}`);
    
    // Check for updates for each country
    const results = await Promise.allSettled(
      countriesToCheck.map(async (c) => {
        // Try pre-converted JSON first (recommended approach)
        let result = await downloadPreConvertedJSON(c);
        
        // If that fails and we have direct download, try that
        if (!result.success && FSANZ_DATABASE_URLS[c].directDownload) {
          result = await downloadFSANZDatabase(c);
        }
        
        return {
          country: c,
          ...result,
        };
      })
    );
    
    const countries = results.map((r) => 
      r.status === 'fulfilled' ? r.value : { country: 'AU' as 'AU' | 'NZ', success: false, error: 'Promise rejected' }
    );
    
    const updated = countries.some((c) => c.success);
    
    return {
      checked: true,
      updated,
      countries,
    };
  } catch (error) {
    logger.error('Error checking for FSANZ updates:', error);
    return {
      checked: false,
      updated: false,
      countries: [],
    };
  }
}

/**
 * Initialize automatic update system
 * Call this on app startup
 */
export async function initializeAutoUpdate(): Promise<void> {
  try {
    const enabled = await isAutoUpdateEnabled();
    if (!enabled) {
      logger.debug('FSANZ auto-update not enabled, skipping initialization');
      return;
    }
    
    logger.info('Initializing FSANZ automatic update system...');
    
    // Check for updates on startup (if enough time has passed)
    const updateResult = await checkForUpdates();
    
    if (updateResult.updated) {
      logger.info('FSANZ databases updated on startup');
    } else if (updateResult.checked) {
      logger.info('FSANZ databases checked, no updates available');
    }
  } catch (error) {
    logger.error('Error initializing FSANZ auto-update:', error);
  }
}

/**
 * Set up periodic update checks
 * This should be called once when the app starts
 */
export function setupPeriodicUpdates(intervalMinutes: number = 60 * 24 * 7): void {
  // Check every 7 days by default
  const intervalMs = intervalMinutes * 60 * 1000;
  
  setInterval(async () => {
    try {
      await checkForUpdates();
    } catch (error) {
      logger.error('Error in periodic FSANZ update check:', error);
    }
  }, intervalMs);
  
  logger.info(`FSANZ periodic update checks set up (every ${intervalMinutes} minutes)`);
}

/**
 * Force immediate update check (manual trigger)
 */
export async function forceUpdateCheck(): Promise<{
  success: boolean;
  countries: Array<{ country: 'AU' | 'NZ'; success: boolean; productCount?: number; error?: string }>;
}> {
  // Reset last check timestamp to force immediate check
  await AsyncStorage.removeItem(FSANZ_UPDATE_CHECK_KEY);
  
  const result = await checkForUpdates();
  
  return {
    success: result.updated,
    countries: result.countries,
  };
}

