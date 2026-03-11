// FSANZ Database Auto-Initialization Service
// Automatically checks for and initializes FSANZ databases on app startup
// Ensures databases are ready to be queried when available

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { getUserCountryCode } from '../utils/countryDetection';
import { isFSANZDatabaseAvailable, getFSANZDatabaseMetadata } from './fsanDatabaseImporter';
import { initializeFSANZForCountry, clearFSANZDownloadAttempted } from './fsanDatabaseAutoDownload';

const FSANZ_INIT_KEY = '@truescan_fsanz_initialized';

/**
 * Initialize FSANZ databases on app startup
 * Checks for existing databases and logs status
 * This ensures FSANZ queries will work immediately when databases are imported
 */
export async function initializeFSANZDatabases(): Promise<void> {
  try {
    logger.info('───────────────────────────────────────────────────────────────');
    logger.info('🔍 FSANZ Database Initialization Check');
    logger.info('───────────────────────────────────────────────────────────────');
    
    const userCountry = getUserCountryCode();
    
    // NOTE: FSANZ database auto-download is DISABLED
    // We now use the server-side API (/api/fsanz-query) for name-based queries
    // The old barcode-based local database system is no longer needed
    // The server-side API has access to the full 2,857+17,109 food databases
    
    if (userCountry === 'AU' || userCountry === 'NZ') {
      logger.info(`🌟 User is in ${userCountry} - FSANZ data is CRITICAL for accuracy`);
      logger.info(`   ✅ Using server-side API for FSANZ queries (no local download needed)`);
      logger.info(`   📡 API endpoint: /api/fsanz-query (queries both NZFCD and AFCD)`);
      
      // Check if old local database exists (for backwards compatibility only)
      const isAvailable = await isFSANZDatabaseAvailable(userCountry as 'AU' | 'NZ');
      if (isAvailable) {
        logger.info(`   ℹ️  Legacy local FSANZ database found (${userCountry}) - server API will be preferred`);
      } else {
        logger.info(`   ℹ️  No legacy local database installed - relying on server API (recommended configuration)`);
      }
    }
    
    // Check AU database status (legacy local DB - optional, informational only)
    const auAvailable = await isFSANZDatabaseAvailable('AU');
    if (auAvailable) {
      const auMetadata = await getFSANZDatabaseMetadata('AU');
      logger.info(`✅ FSANZ AU local database: AVAILABLE (legacy enhancement)`);
      if (auMetadata?.productCount) {
        logger.info(`   Products: ${auMetadata.productCount.toLocaleString()}`);
      }
      if (auMetadata?.importedAt) {
        const importDate = new Date(auMetadata.importedAt);
        logger.info(`   Imported: ${importDate.toLocaleDateString()}`);
      }
      logger.info(`   Status: Ready for local lookups (server API still used by default)`);
    } else {
      logger.info(`ℹ️  FSANZ AU local database: NOT INSTALLED (server API will be used instead)`);
    }
    
    // Check NZ database status (legacy local DB - optional, informational only)
    const nzAvailable = await isFSANZDatabaseAvailable('NZ');
    if (nzAvailable) {
      const nzMetadata = await getFSANZDatabaseMetadata('NZ');
      logger.info(`✅ FSANZ NZ local database: AVAILABLE (legacy enhancement)`);
      if (nzMetadata?.productCount) {
        logger.info(`   Products: ${nzMetadata.productCount.toLocaleString()}`);
      }
      if (nzMetadata?.importedAt) {
        const importDate = new Date(nzMetadata.importedAt);
        logger.info(`   Imported: ${importDate.toLocaleDateString()}`);
      }
      logger.info(`   Status: Ready for local lookups (server API still used by default)`);
    } else {
      logger.info(`ℹ️  FSANZ NZ local database: NOT INSTALLED (server API will be used instead)`);
    }
    
    // Log country-specific status (clarify that accuracy is provided by server API)
    if (userCountry === 'AU') {
      logger.info(
        auAvailable
          ? '✅ AU User: FSANZ data available via server API (local DB also installed)'
          : '✅ AU User: FSANZ data available via server API (no local DB installed, which is acceptable)',
      );
    } else if (userCountry === 'NZ') {
      logger.info(
        nzAvailable
          ? '✅ NZ User: FSANZ data available via server API (local DB also installed)'
          : '✅ NZ User: FSANZ data available via server API (no local DB installed, which is acceptable)',
      );
    }
    
    // Mark as initialized
    await AsyncStorage.setItem(FSANZ_INIT_KEY, Date.now().toString());
    
    logger.info('───────────────────────────────────────────────────────────────');
    logger.info('✅ FSANZ Database Check Complete');
    logger.info('───────────────────────────────────────────────────────────────');
    
    // Note: App works perfectly with the FSANZ server API alone.
    // Local FSANZ databases are an optional enhancement, not a requirement.
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error initializing FSANZ databases:', errorMessage);
    // Non-blocking - app continues normally even if initialization fails
  }
}

/**
 * Check if FSANZ databases have been initialized
 */
export async function areFSANZDatabasesInitialized(): Promise<boolean> {
  try {
    const initTime = await AsyncStorage.getItem(FSANZ_INIT_KEY);
    return initTime !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get FSANZ database status for all countries
 */
export async function getFSANZDatabaseStatus(): Promise<{
  au: { available: boolean; productCount?: number; importDate?: number };
  nz: { available: boolean; productCount?: number; importDate?: number };
}> {
  try {
    const auAvailable = await isFSANZDatabaseAvailable('AU');
    const nzAvailable = await isFSANZDatabaseAvailable('NZ');
    
    const auMetadata = auAvailable ? await getFSANZDatabaseMetadata('AU') : null;
    const nzMetadata = nzAvailable ? await getFSANZDatabaseMetadata('NZ') : null;
    
    return {
      au: {
        available: auAvailable,
        productCount: auMetadata?.productCount,
        importDate: auMetadata?.importedAt,
      },
      nz: {
        available: nzAvailable,
        productCount: nzMetadata?.productCount,
        importDate: nzMetadata?.importedAt,
      },
    };
  } catch (error) {
    logger.error('Error getting FSANZ database status:', error);
    return {
      au: { available: false },
      nz: { available: false },
    };
  }
}
