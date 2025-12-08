/**
 * Backend Configuration Verification Script
 * 
 * Verifies that backend is properly configured for production use.
 * 
 * Checks:
 * - Backend URL is configured
 * - Database is configured (Postgres or MongoDB)
 * - Photo storage is configured (Vercel Blob or Cloudinary)
 * - Backend API endpoints are accessible
 * - Database connection is working
 */

/**
 * Get backend URL from environment or default
 */
function getBackendUrl(): string {
  // Try to read from .env file first
  let backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  
  // If not in environment, try to read from .env file
  if (!backendUrl) {
    try {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(__dirname, '..', '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/EXPO_PUBLIC_BACKEND_URL=(.+)/);
        if (match) {
          backendUrl = match[1].trim();
        }
      }
    } catch (error) {
      // Ignore errors reading .env
    }
  }
  
  // Default to deployed backend URL
  const defaultUrl = backendUrl || 'https://vercel-leightons-projects-d328c774.vercel.app';
  
  if (defaultUrl.includes('YOUR-VERCEL-URL')) {
    console.warn('[BackendConfig] ⚠️  Backend URL not configured! Update EXPO_PUBLIC_BACKEND_URL or set it in .env');
  }
  
  return defaultUrl;
}

/**
 * API Endpoints
 */
const BackendEndpoints = {
  manualProducts: (url: string) => `${url}/api/manual-products`,
  userPrices: (url: string) => `${url}/api/user-prices`,
  uploadPhoto: (url: string) => `${url}/api/upload-photo`,
  manufacturingCountry: (url: string) => `${url}/api/manufacturing-country`,
};

interface VerificationResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

const results: VerificationResult[] = [];

function addResult(check: string, status: 'pass' | 'fail' | 'warning', message: string, details?: string) {
  results.push({ check, status, message, details });
}

async function verifyBackendUrl(): Promise<void> {
  try {
    const backendUrl = getBackendUrl();
    
    if (backendUrl.includes('YOUR-VERCEL-URL') || !backendUrl.startsWith('http')) {
      addResult(
        'Backend URL Configuration',
        'fail',
        'Backend URL is not configured',
        'Set EXPO_PUBLIC_BACKEND_URL environment variable or update getBackendUrl() default'
      );
      return;
    }

    // Test if backend is accessible
    try {
      const response = await fetch(`${backendUrl}/api/manual-products?barcode=TEST`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 400 || response.status === 200) {
        // 400 is OK (missing barcode), 200 is OK (endpoint exists)
        addResult(
          'Backend URL Configuration',
          'pass',
          `Backend is accessible at ${backendUrl}`,
          `Status: ${response.status}`
        );
      } else {
        addResult(
          'Backend URL Configuration',
          'warning',
          `Backend responded with unexpected status: ${response.status}`,
          'Backend may not be properly deployed'
        );
      }
    } catch (error) {
      addResult(
        'Backend URL Configuration',
        'fail',
        'Backend is not accessible',
        error instanceof Error ? error.message : String(error)
      );
    }
  } catch (error) {
    addResult(
      'Backend URL Configuration',
      'fail',
      'Error checking backend URL',
      error instanceof Error ? error.message : String(error)
    );
  }
}

async function verifyDatabaseConfiguration(): Promise<void> {
  // Note: This check can only be done server-side
  // For client-side, we can only check if backend endpoints respond correctly
  
  try {
    const backendUrl = getBackendUrl();
    
    // Try to submit test data to check if database is working
    const testData = {
      barcode: `VERIFY_${Date.now()}`,
      country: 'Test Country',
      userId: 'verification_script',
    };

    try {
      const response = await fetch(BackendEndpoints.manufacturingCountry(backendUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success !== false) {
          addResult(
            'Database Configuration',
            'pass',
            'Database appears to be configured and working',
            'Test submission succeeded'
          );
        } else {
          addResult(
            'Database Configuration',
            'warning',
            'Backend responded but submission may have failed',
            result.error || 'Unknown error'
          );
        }
      } else {
        const errorText = await response.text();
        if (errorText.includes('database') || errorText.includes('Database')) {
          addResult(
            'Database Configuration',
            'fail',
            'Database may not be configured',
            `Backend error: ${errorText.substring(0, 200)}`
          );
        } else {
          addResult(
            'Database Configuration',
            'warning',
            'Could not verify database configuration',
            `Status: ${response.status}`
          );
        }
      }
    } catch (error) {
      addResult(
        'Database Configuration',
        'warning',
        'Could not test database connection',
        'This check requires backend to be accessible'
      );
    }
  } catch (error) {
    addResult(
      'Database Configuration',
      'warning',
      'Error checking database',
      error instanceof Error ? error.message : String(error)
    );
  }
}

async function verifyPhotoStorageConfiguration(): Promise<void> {
  try {
    const backendUrl = getBackendUrl();
    
    // Try to upload a small test image
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; // 1x1 pixel PNG
    
    try {
      const response = await fetch(BackendEndpoints.uploadPhoto(backendUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: `VERIFY_${Date.now()}`,
          imageType: 'front',
          imageBase64: testImageBase64,
          mimeType: 'image/png',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.url) {
          addResult(
            'Photo Storage Configuration',
            'pass',
            'Photo storage is configured and working',
            `Photo URL: ${result.url.substring(0, 50)}...`
          );
        } else {
          addResult(
            'Photo Storage Configuration',
            'warning',
            'Photo upload may not be fully configured',
            result.error || 'Upload succeeded but no URL returned'
          );
        }
      } else {
        const errorText = await response.text();
        if (errorText.includes('storage') || errorText.includes('blob') || errorText.includes('cloudinary')) {
          addResult(
            'Photo Storage Configuration',
            'fail',
            'Photo storage may not be configured',
            `Backend error: ${errorText.substring(0, 200)}`
          );
        } else {
          addResult(
            'Photo Storage Configuration',
            'warning',
            'Could not verify photo storage',
            `Status: ${response.status}`
          );
        }
      }
    } catch (error) {
      addResult(
        'Photo Storage Configuration',
        'warning',
        'Could not test photo storage',
        'This check requires backend to be accessible'
      );
    }
  } catch (error) {
    addResult(
      'Photo Storage Configuration',
      'warning',
      'Error checking photo storage',
      error instanceof Error ? error.message : String(error)
    );
  }
}

async function verifyApiEndpoints(): Promise<void> {
  try {
    const backendUrl = getBackendUrl();
    const endpoints = [
      { name: 'Manual Products', url: BackendEndpoints.manualProducts(backendUrl) },
      { name: 'Manufacturing Country', url: BackendEndpoints.manufacturingCountry(backendUrl) },
      { name: 'Photo Upload', url: BackendEndpoints.uploadPhoto(backendUrl) },
      { name: 'User Prices', url: BackendEndpoints.userPrices(backendUrl) },
    ];

    const endpointResults: string[] = [];

    for (const endpoint of endpoints) {
      try {
        // Use OPTIONS to check if endpoint exists (CORS preflight)
        const response = await fetch(endpoint.url, {
          method: 'OPTIONS',
        });

        if (response.ok || response.status === 405) {
          // 405 (Method Not Allowed) is OK - endpoint exists
          endpointResults.push(`✅ ${endpoint.name}`);
        } else {
          endpointResults.push(`⚠️ ${endpoint.name} (${response.status})`);
        }
      } catch (error) {
        endpointResults.push(`❌ ${endpoint.name} (unreachable)`);
      }
    }

    const allPassed = endpointResults.every(r => r.startsWith('✅'));
    const someFailed = endpointResults.some(r => r.startsWith('❌'));

    addResult(
      'API Endpoints',
      allPassed ? 'pass' : someFailed ? 'fail' : 'warning',
      `${endpointResults.length} endpoints checked`,
      endpointResults.join(', ')
    );
  } catch (error) {
    addResult(
      'API Endpoints',
      'fail',
      'Error checking API endpoints',
      error instanceof Error ? error.message : String(error)
    );
  }
}

function printResults(): void {
  console.log('\n' + '='.repeat(60));
  console.log('Backend Configuration Verification Report');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const failed = results.filter(r => r.status === 'fail').length;

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    const statusColor = result.status === 'pass' ? '\x1b[32m' : result.status === 'warning' ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`${icon} ${statusColor}${result.check}${reset}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${result.details}`);
    }
    console.log();
  });

  console.log('='.repeat(60));
  console.log(`Summary: ${passed} passed, ${warnings} warnings, ${failed} failed`);
  console.log('='.repeat(60) + '\n');

  if (failed > 0) {
    console.log('❌ CRITICAL: Some checks failed. Please fix these before deploying to production.\n');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  WARNING: Some checks have warnings. Review and fix if needed.\n');
  } else {
    console.log('✅ All checks passed! Backend is properly configured.\n');
  }
}

async function main() {
  console.log('Starting backend configuration verification...\n');

  await verifyBackendUrl();
  await verifyDatabaseConfiguration();
  await verifyPhotoStorageConfiguration();
  await verifyApiEndpoints();

  printResults();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

export { main as verifyBackendConfig };

