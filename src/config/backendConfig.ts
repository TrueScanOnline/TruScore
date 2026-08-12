// Backend Configuration
// Centralized configuration for all backend URLs
// Update this file when Vercel deployment URL changes

/**
 * Get the Vercel backend URL
 * Priority:
 * 1. Environment variable (EXPO_PUBLIC_BACKEND_URL)
 * 2. Default fallback (update this after deployment)
 */
export function getBackendUrl(): string {
  // Backend URL - Priority:
  // 1. Environment variable (EXPO_PUBLIC_BACKEND_URL from .env)
  // 2. Default fallback (deployed backend URL)
  // ✅ Using truscoreapi.vercel.app - verified working with database (no authentication required)
  let backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://truscoreapi.vercel.app';
  
  // CRITICAL: Reject known preview deployment URLs (they require authentication)
  // Known production URLs (verified working - no authentication):
  const PRODUCTION_URLS = [
    'https://truscoreapi.vercel.app', // ✅ Primary production (verified working with database)
    'https://vercel-murex-alpha.vercel.app', // ✅ Fallback (verified working)
    'https://vercel-q30j4fdjt-leightons-projects-d328c774.vercel.app', // ⚠️ May require auth
    'https://vercel-48au9bmeu-leightons-projects-d328c774.vercel.app', // ⚠️ May require auth
  ];
  
  // Check if URL is a known preview deployment (not in production list)
  const isKnownProduction = PRODUCTION_URLS.some(url => {
    const domain = url.split('/')[2];
    return backendUrl.includes(domain);
  });
  const isPreviewUrl = backendUrl.includes('truscoreapi-') && backendUrl.includes('-5ziw2940v-'); // Specific preview URL
  
  if (isPreviewUrl) {
    // Changed from ERROR to DEBUG to reduce log verbosity
    // This is expected behavior - preview URLs require auth, so we fallback to production
    if (__DEV__) {
      console.debug('[BackendConfig] Preview deployment URL detected - using production fallback');
    }
    // Use latest production URL
    backendUrl = PRODUCTION_URLS[0];
  }
  
  if (backendUrl.includes('YOUR-VERCEL-URL')) {
    console.warn('[BackendConfig] ⚠️  Backend URL not configured! Update EXPO_PUBLIC_BACKEND_URL or getBackendUrl() default');
  }
  
  // Only log backend URL in debug mode to reduce verbosity
  if (__DEV__) {
    console.debug(`[BackendConfig] Using backend URL: ${backendUrl}`);
  }
  return backendUrl;
}

/**
 * API Endpoints
 */
export const BackendEndpoints = {
  // User Data Submission
  manualProducts: (url: string) => `${url}/api/manual-products`,
  userPrices: (url: string) => `${url}/api/user-prices`,
  uploadPhoto: (url: string) => `${url}/api/upload-photo`,
  manufacturingCountry: (url: string) => `${url}/api/manufacturing-country`,
  contributionEvidence: (url: string) => `${url}/api/contribution-evidence`,
  /** Optional telemetry from app after a successful share (no PII). */
  shareEvent: (url: string) => `${url}/api/share-event`,
  
  // Existing APIs
  nzPrices: (url: string) => `${url}/api/nz-prices`,
  fsanzQuery: (url: string) => `${url}/api/fsanz-query`,
  fsanzDatabase: (url: string) => `${url}/api/fsanz-database`,
  foodAtlasQuery: (url: string) => `${url}/api/foodatlas-query`,
};
