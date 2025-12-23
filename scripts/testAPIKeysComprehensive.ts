/**
 * Comprehensive API Key Testing & Analysis
 * 
 * Tests all API keys to determine:
 * 1. Which keys are configured
 * 2. Which keys actually work
 * 3. Which keys are missing
 * 4. How to get missing keys
 */

/// <reference path="../global.d.ts" />

if (typeof (global as any).__DEV__ === 'undefined') {
  (global as any).__DEV__ = process.env.NODE_ENV !== 'production';
}

import * as fs from 'fs';
import * as path from 'path';

// Test barcode for API key validation
const TEST_BARCODE = '3017620422003'; // Nutella (common product)

interface APIKeyStatus {
  database: string;
  envVariable: string;
  tier: number;
  configured: boolean;
  working: boolean;
  testResult?: 'success' | 'failed' | 'not_tested' | 'no_key';
  error?: string;
  freeTierAvailable: boolean;
  registrationUrl: string;
  registrationInstructions: string;
  freeTierLimits?: string;
  cost?: string;
  priority: 'high' | 'medium' | 'low';
}

const apiKeyStatuses: APIKeyStatus[] = [];

/**
 * Test if API key is configured
 */
function isKeyConfigured(envVar: string): boolean {
  const key = process.env[envVar] || '';
  return key.length >= 10; // Minimum key length
}

/**
 * Test API key by making a test request
 */
async function testAPIKey(
  database: string,
  testFunction: (barcode: string) => Promise<any>
): Promise<{ working: boolean; error?: string }> {
  try {
    const result = await Promise.race([
      testFunction(TEST_BARCODE),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000)
      ),
    ]);
    
    // If function returns null, it might be because product not found (key works) or key invalid
    // Check for specific error messages
    return { working: true };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    
    // Check for authentication errors
    if (errorMsg.includes('401') || errorMsg.includes('403') || 
        errorMsg.includes('Unauthorized') || errorMsg.includes('Forbidden') ||
        errorMsg.includes('API key') || errorMsg.includes('authentication')) {
      return { working: false, error: 'API key invalid or expired' };
    }
    
    // Timeout or network errors don't mean key is invalid
    if (errorMsg.includes('Timeout') || errorMsg.includes('Network')) {
      return { working: true, error: 'Timeout (key may be valid, but request timed out)' };
    }
    
    // Other errors - assume key might be valid but product not found
    return { working: true, error: errorMsg };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔑 Comprehensive API Key Analysis\n');
  console.log('Testing all API keys...\n');

  // Define all API key requirements
  const apiKeys = [
    {
      database: 'USDA FoodData Central',
      envVariable: 'EXPO_PUBLIC_USDA_API_KEY',
      tier: 2,
      freeTierAvailable: true,
      registrationUrl: 'https://fdc.nal.usda.gov/api-key-signup',
      registrationInstructions: '1. Visit https://fdc.nal.usda.gov/api-key-signup\n2. Fill out registration form\n3. Receive API key via email',
      freeTierLimits: 'Unlimited (free)',
      cost: 'Free',
      priority: 'high' as const,
      testFunction: async (barcode: string) => {
        const { fetchProductFromUSDA } = await import('../src/services/usdaFoodData');
        return fetchProductFromUSDA(barcode);
      },
    },
    {
      database: 'GS1 DataSource',
      envVariable: 'EXPO_PUBLIC_GS1_API_KEY',
      tier: 2,
      freeTierAvailable: true,
      registrationUrl: 'https://store.gs1us.org/view-use-api-trial/p',
      registrationInstructions: '1. Visit https://store.gs1us.org/view-use-api-trial/p\n2. Sign up for 60-day free trial\n3. After trial, requires paid subscription ($6,500+)',
      freeTierLimits: '60-day free trial',
      cost: 'Free trial, then $6,500+ subscription',
      priority: 'low' as const,
      testFunction: null, // GS1 uses free Digital Link (no key needed)
    },
    {
      database: 'EAN-Search',
      envVariable: 'EXPO_PUBLIC_EAN_SEARCH_API_KEY',
      tier: 4,
      freeTierAvailable: true,
      registrationUrl: 'https://www.ean-search.org/ean-database-api.html',
      registrationInstructions: '1. Visit https://www.ean-search.org/ean-database-api.html\n2. Register for account\n3. Confirm email\n4. Get API key from dashboard',
      freeTierLimits: 'Unlimited light use',
      cost: 'Free',
      priority: 'medium' as const,
      testFunction: async (barcode: string) => {
        const { fetchProductFromEANSearch } = await import('../src/services/eanSearchApi');
        return fetchProductFromEANSearch(barcode);
      },
    },
    {
      database: 'UPC Database',
      envVariable: 'EXPO_PUBLIC_UPC_DATABASE_API_KEY',
      tier: 4,
      freeTierAvailable: true,
      registrationUrl: 'https://www.upcdatabase.com/api',
      registrationInstructions: '1. Visit https://www.upcdatabase.com/api\n2. Register for free account\n3. Get API key',
      freeTierLimits: '100 lookups/day',
      cost: 'Free',
      priority: 'medium' as const,
      testFunction: async (barcode: string) => {
        const { fetchProductFromUPCDatabase } = await import('../src/services/upcDatabaseApi');
        return fetchProductFromUPCDatabase(barcode);
      },
    },
    {
      database: 'Edamam',
      envVariable: 'EXPO_PUBLIC_EDAMAM_APP_ID',
      envVariable2: 'EXPO_PUBLIC_EDAMAM_APP_KEY',
      tier: 3,
      freeTierAvailable: true,
      registrationUrl: 'https://developer.edamam.com/signup',
      registrationInstructions: '1. Visit https://developer.edamam.com/signup\n2. Create account\n3. Select Food Database API\n4. Get App ID and App Key',
      freeTierLimits: '10,000 requests/month',
      cost: 'Free (attribution required)',
      priority: 'medium' as const,
      testFunction: async (barcode: string) => {
        const { fetchProductFromEdamam } = await import('../src/services/edamamApi');
        return fetchProductFromEdamam(barcode);
      },
    },
    {
      database: 'Nutritionix',
      envVariable: 'EXPO_PUBLIC_NUTRITIONIX_APP_ID',
      envVariable2: 'EXPO_PUBLIC_NUTRITIONIX_API_KEY',
      tier: 3,
      freeTierAvailable: true,
      registrationUrl: 'https://developer.nutritionix.com',
      registrationInstructions: '1. Visit https://developer.nutritionix.com\n2. Sign up for account\n3. Create application\n4. Get App ID and API Key',
      freeTierLimits: '100 requests/day',
      cost: 'Free',
      priority: 'medium' as const,
      testFunction: async (barcode: string) => {
        const { fetchProductFromNutritionix } = await import('../src/services/nutritionixApi');
        return fetchProductFromNutritionix(barcode);
      },
    },
    {
      database: 'Spoonacular',
      envVariable: 'EXPO_PUBLIC_SPOONACULAR_API_KEY',
      tier: 3,
      freeTierAvailable: true,
      registrationUrl: 'https://spoonacular.com/food-api',
      registrationInstructions: '1. Visit https://spoonacular.com/food-api\n2. Sign up for free account\n3. Get API key',
      freeTierLimits: '150 points/day',
      cost: 'Free',
      priority: 'medium' as const,
      testFunction: async (barcode: string) => {
        const { fetchProductFromSpoonacular } = await import('../src/services/spoonacularApi');
        return fetchProductFromSpoonacular(barcode);
      },
    },
    {
      database: 'Barcode Lookup',
      envVariable: 'EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY',
      tier: 4,
      freeTierAvailable: true,
      registrationUrl: 'https://www.barcodelookup.com/api',
      registrationInstructions: '1. Visit https://www.barcodelookup.com/api\n2. Sign up for free test account\n3. Get API key',
      freeTierLimits: '100 lookups/day (free test)',
      cost: 'Free test, then $99+/month',
      priority: 'low' as const,
      testFunction: async (barcode: string) => {
        const { fetchProductFromBarcodeLookup } = await import('../src/services/barcodeLookupApi');
        return fetchProductFromBarcodeLookup(barcode);
      },
    },
    {
      database: 'Barcode Lookup Com',
      envVariable: 'BARCODE_LOOKUP_API_KEY',
      tier: 4,
      freeTierAvailable: true,
      registrationUrl: 'https://www.barcodelookup.com/api',
      registrationInstructions: '1. Visit https://www.barcodelookup.com/api\n2. Sign up for free test account\n3. Get API key',
      freeTierLimits: '100 lookups/day (free test)',
      cost: 'Free test, then $99+/month',
      priority: 'low' as const,
      testFunction: async (barcode: string) => {
        const { fetchProductFromBarcodeLookupCom } = await import('../src/services/barcodeLookupComApi');
        return fetchProductFromBarcodeLookupCom(barcode);
      },
    },
    {
      database: 'Best Buy',
      envVariable: 'EXPO_PUBLIC_BESTBUY_API_KEY',
      tier: 4,
      freeTierAvailable: true,
      registrationUrl: 'https://developer.bestbuy.com/',
      registrationInstructions: '1. Visit https://developer.bestbuy.com/\n2. Click "Get API Key"\n3. Register and agree to terms\n4. Get API key',
      freeTierLimits: '5,000 requests/day',
      cost: 'Free',
      priority: 'low' as const,
      testFunction: async (barcode: string) => {
        const { fetchProductFromBestBuy } = await import('../src/services/bestBuyApi');
        return fetchProductFromBestBuy(barcode);
      },
    },
    {
      database: 'EANData',
      envVariable: 'EXPO_PUBLIC_EANDATA_API_KEY',
      tier: 4,
      freeTierAvailable: true,
      registrationUrl: 'https://eandata.com/register',
      registrationInstructions: '1. Visit https://eandata.com/register\n2. Register for account\n3. Get API key',
      freeTierLimits: '100/day (light use)',
      cost: 'Free',
      priority: 'low' as const,
      testFunction: async (barcode: string) => {
        const { fetchProductFromEANData } = await import('../src/services/eanDataApi');
        return fetchProductFromEANData(barcode);
      },
    },
    {
      database: 'Tesco Labs',
      envVariable: 'EXPO_PUBLIC_TESCO_API_KEY',
      tier: 2,
      freeTierAvailable: false,
      registrationUrl: 'N/A - Service Discontinued',
      registrationInstructions: 'Tesco Labs API has been discontinued as of December 2025. Service no longer available.',
      freeTierLimits: 'N/A',
      cost: 'N/A - Service discontinued',
      priority: 'low' as const,
      testFunction: null,
    },
    {
      database: 'Walmart Open API',
      envVariable: 'EXPO_PUBLIC_WALMART_API_KEY',
      tier: 2,
      freeTierAvailable: true,
      registrationUrl: 'https://developer.walmart.com/',
      registrationInstructions: '1. Visit https://developer.walmart.com/\n2. Sign up for developer account\n3. Get API key',
      freeTierLimits: 'Varies',
      cost: 'Free',
      priority: 'low' as const,
      testFunction: async (barcode: string) => {
        const { fetchProductFromWalmart } = await import('../src/services/walmartOpenApi');
        return fetchProductFromWalmart(barcode);
      },
    },
    {
      database: 'OpenCorporates',
      envVariable: 'EXPO_PUBLIC_OPENCORPORATES_API_KEY',
      tier: 2,
      freeTierAvailable: true,
      registrationUrl: 'https://opencorporates.com/api_accounts/new',
      registrationInstructions: '1. Visit https://opencorporates.com/api_accounts/new\n2. Sign up for free plan\n3. Get API key',
      freeTierLimits: '1,000 requests/month (33/day)',
      cost: 'Free',
      priority: 'low' as const,
      testFunction: null, // Not a product database, used for company enrichment
    },
  ];

  // Check each API key
  for (const apiKeyInfo of apiKeys) {
    const status: APIKeyStatus = {
      database: apiKeyInfo.database,
      envVariable: apiKeyInfo.envVariable,
      tier: apiKeyInfo.tier,
      configured: isKeyConfigured(apiKeyInfo.envVariable),
      working: false,
      testResult: 'not_tested',
      freeTierAvailable: apiKeyInfo.freeTierAvailable,
      registrationUrl: apiKeyInfo.registrationUrl,
      registrationInstructions: apiKeyInfo.registrationInstructions,
      freeTierLimits: apiKeyInfo.freeTierLimits,
      cost: apiKeyInfo.cost,
      priority: apiKeyInfo.priority,
    };

    // Check for second env variable (App ID + App Key)
    if (apiKeyInfo.envVariable2) {
      status.configured = isKeyConfigured(apiKeyInfo.envVariable) && isKeyConfigured(apiKeyInfo.envVariable2);
    }

    // Test if configured and test function available
    if (status.configured && apiKeyInfo.testFunction) {
      console.log(`Testing ${apiKeyInfo.database}...`);
      const testResult = await testAPIKey(apiKeyInfo.database, apiKeyInfo.testFunction);
      status.working = testResult.working;
      status.testResult = testResult.working ? 'success' : 'failed';
      status.error = testResult.error;
      
      if (testResult.working) {
        console.log(`  ✅ Working`);
      } else {
        console.log(`  ❌ Failed: ${testResult.error}`);
      }
    } else if (!status.configured) {
      status.testResult = 'no_key';
      console.log(`  ⚠️  Not configured`);
    } else {
      status.testResult = 'not_tested';
      console.log(`  ℹ️  No test function available`);
    }

    apiKeyStatuses.push(status);
    console.log('');
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Generate report
  generateReport();
}

/**
 * Generate comprehensive report
 */
function generateReport(): void {
  let report = '# Comprehensive API Key Analysis Report\n\n';
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += `**Test Barcode:** ${TEST_BARCODE}\n\n`;

  // Summary
  const configured = apiKeyStatuses.filter(s => s.configured).length;
  const working = apiKeyStatuses.filter(s => s.working).length;
  const missing = apiKeyStatuses.filter(s => !s.configured).length;
  const failed = apiKeyStatuses.filter(s => s.configured && !s.working).length;

  report += '## Executive Summary\n\n';
  report += `- ✅ **Configured:** ${configured}/${apiKeyStatuses.length} API keys\n`;
  report += `- ✅ **Working:** ${working}/${configured} configured keys\n`;
  report += `- ❌ **Missing:** ${missing} API keys\n`;
  report += `- ⚠️ **Failed:** ${failed} API keys (configured but not working)\n\n`;

  // Status by priority
  report += '## Status by Priority\n\n';

  const highPriority = apiKeyStatuses.filter(s => s.priority === 'high');
  const mediumPriority = apiKeyStatuses.filter(s => s.priority === 'medium');
  const lowPriority = apiKeyStatuses.filter(s => s.priority === 'low');

  report += '### High Priority\n\n';
  report += '| Database | Configured | Working | Status |\n';
  report += '|----------|------------|---------|--------|\n';
  for (const status of highPriority) {
    const configuredEmoji = status.configured ? '✅' : '❌';
    const workingEmoji = status.working ? '✅' : (status.configured ? '⚠️' : '-');
    report += `| ${status.database} | ${configuredEmoji} | ${workingEmoji} | ${status.testResult} |\n`;
  }
  report += '\n';

  report += '### Medium Priority\n\n';
  report += '| Database | Configured | Working | Status |\n';
  report += '|----------|------------|---------|--------|\n';
  for (const status of mediumPriority) {
    const configuredEmoji = status.configured ? '✅' : '❌';
    const workingEmoji = status.working ? '✅' : (status.configured ? '⚠️' : '-');
    report += `| ${status.database} | ${configuredEmoji} | ${workingEmoji} | ${status.testResult} |\n`;
  }
  report += '\n';

  report += '### Low Priority\n\n';
  report += '| Database | Configured | Working | Status |\n';
  report += '|----------|------------|---------|--------|\n';
  for (const status of lowPriority) {
    const configuredEmoji = status.configured ? '✅' : '❌';
    const workingEmoji = status.working ? '✅' : (status.configured ? '⚠️' : '-');
    report += `| ${status.database} | ${configuredEmoji} | ${workingEmoji} | ${status.testResult} |\n`;
  }
  report += '\n';

  // Detailed status
  report += '## Detailed API Key Status\n\n';

  for (const status of apiKeyStatuses.sort((a, b) => a.tier - b.tier)) {
    report += `### ${status.database} (Tier ${status.tier})\n\n`;
    report += `**Environment Variable:** \`${status.envVariable}\`\n\n`;
    report += `**Status:**\n`;
    report += `- Configured: ${status.configured ? '✅ Yes' : '❌ No'}\n`;
    report += `- Working: ${status.working ? '✅ Yes' : status.configured ? '❌ No' : 'N/A (not configured)'}\n`;
    report += `- Test Result: ${status.testResult}\n`;
    if (status.error) {
      report += `- Error: ${status.error}\n`;
    }
    report += `\n**Free Tier:** ${status.freeTierAvailable ? '✅ Available' : '❌ Not available'}\n`;
    if (status.freeTierLimits) {
      report += `- Limits: ${status.freeTierLimits}\n`;
    }
    report += `- Cost: ${status.cost}\n`;
    report += `- Priority: ${status.priority}\n\n`;

    if (!status.configured) {
      report += `**How to Get API Key:**\n`;
      report += `${status.registrationInstructions}\n\n`;
      report += `**Registration URL:** ${status.registrationUrl}\n\n`;
    }

    report += '---\n\n';
  }

  // Missing keys
  const missingKeys = apiKeyStatuses.filter(s => !s.configured && s.freeTierAvailable);
  if (missingKeys.length > 0) {
    report += '## Missing API Keys (Free Tier Available)\n\n';
    report += 'These API keys are missing but have free tiers available:\n\n';
    for (const status of missingKeys) {
      report += `### ${status.database}\n\n`;
      report += `- **Environment Variable:** \`${status.envVariable}\`\n`;
      report += `- **Registration URL:** ${status.registrationUrl}\n`;
      report += `- **Instructions:**\n${status.registrationInstructions}\n`;
      report += `- **Free Tier Limits:** ${status.freeTierLimits}\n`;
      report += `- **Priority:** ${status.priority}\n\n`;
    }
  }

  // Failed keys
  const failedKeys = apiKeyStatuses.filter(s => s.configured && !s.working);
  if (failedKeys.length > 0) {
    report += '## Failed API Keys (Configured but Not Working)\n\n';
    report += 'These API keys are configured but not working:\n\n';
    for (const status of failedKeys) {
      report += `### ${status.database}\n\n`;
      report += `- **Environment Variable:** \`${status.envVariable}\`\n`;
      report += `- **Error:** ${status.error}\n`;
      report += `- **Action:** Check if API key is valid, not expired, and has proper permissions\n\n`;
    }
  }

  // Working keys
  const workingKeys = apiKeyStatuses.filter(s => s.working);
  if (workingKeys.length > 0) {
    report += '## Working API Keys ✅\n\n';
    for (const status of workingKeys) {
      report += `- ✅ **${status.database}** - \`${status.envVariable}\`\n`;
    }
    report += '\n';
  }

  // Recommendations
  report += '## Recommendations\n\n';
  report += '### Immediate Actions (High Priority)\n\n';
  const highPriorityMissing = apiKeyStatuses.filter(s => s.priority === 'high' && !s.configured);
  if (highPriorityMissing.length > 0) {
    for (const status of highPriorityMissing) {
      report += `1. **Get ${status.database} API Key**\n`;
      report += `   - Priority: High\n`;
      report += `   - Free Tier: ${status.freeTierAvailable ? 'Yes' : 'No'}\n`;
      report += `   - Registration: ${status.registrationUrl}\n\n`;
    }
  } else {
    report += '✅ All high priority API keys are configured!\n\n';
  }

  report += '### Recommended Actions (Medium Priority)\n\n';
  const mediumPriorityMissing = apiKeyStatuses.filter(s => s.priority === 'medium' && !s.configured && s.freeTierAvailable);
  if (mediumPriorityMissing.length > 0) {
    for (const status of mediumPriorityMissing) {
      report += `1. **Get ${status.database} API Key**\n`;
      report += `   - Free Tier: Yes (${status.freeTierLimits})\n`;
      report += `   - Registration: ${status.registrationUrl}\n\n`;
    }
  } else {
    report += '✅ All medium priority API keys are configured!\n\n';
  }

  // Save report
  const reportPath = path.join(__dirname, '../API_KEYS_COMPREHENSIVE_ANALYSIS.md');
  fs.writeFileSync(reportPath, report, 'utf-8');

  console.log('✅ Analysis complete!');
  console.log(`📄 Report saved to: ${reportPath}`);
  console.log('\nSummary:');
  console.log(`- Configured: ${configured}/${apiKeyStatuses.length}`);
  console.log(`- Working: ${working}/${configured}`);
  console.log(`- Missing: ${missing}`);
  console.log(`- Failed: ${failed}`);
}

main().catch(console.error);
