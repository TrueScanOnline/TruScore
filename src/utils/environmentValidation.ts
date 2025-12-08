// Environment variable validation
// Ensures required environment variables are set in production

import { logger } from './logger';

interface EnvVarConfig {
  key: string;
  required: boolean;
  description: string;
  defaultValue?: string;
}

const ENV_VARS: EnvVarConfig[] = [
  {
    key: 'EXPO_PUBLIC_QONVERSION_PROJECT_KEY',
    required: false, // Optional - app works without it (free mode)
    description: 'Qonversion project key for premium subscriptions',
  },
  {
    key: 'EXPO_PUBLIC_USDA_API_KEY',
    required: false,
    description: 'USDA FoodData Central API key (optional - for US users)',
  },
  {
    key: 'EXPO_PUBLIC_GS1_API_KEY',
    required: false,
    description: 'GS1 Data Source API key (optional - requires subscription)',
  },
];

/**
 * Validate environment variables
 * Logs warnings for missing optional variables
 * Throws error for missing required variables in production
 */
export function validateEnvironment(): {
  isValid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production' || !__DEV__;

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.key];
    
    if (!value || value.trim() === '') {
      if (envVar.required) {
        missing.push(envVar.key);
        if (isProduction) {
          logger.error(`Missing required environment variable: ${envVar.key} - ${envVar.description}`);
        }
      } else {
        warnings.push(envVar.key);
        logger.debug(`Optional environment variable not set: ${envVar.key} - ${envVar.description}`);
      }
    }
  }

  if (missing.length > 0 && isProduction) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please set these variables before deploying to production.'
    );
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Get environment variable with validation
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value || value.trim() === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    logger.warn(`Environment variable ${key} is not set`);
    return '';
  }
  
  return value;
}

/**
 * Check if environment variable is set
 */
export function hasEnvVar(key: string): boolean {
  const value = process.env[key];
  return !!(value && value.trim() !== '');
}
