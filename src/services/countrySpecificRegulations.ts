// Country-Specific Regulatory Databases
// Provides country-specific additive regulations, allergen databases, and maximum permitted levels
// Used to adjust TruScore Body pillar based on local regulations

import { logger } from '../utils/logger';
import { getUserCountryCode, isEUCountry } from '../utils/countryDetection';

export interface AdditiveRegulation {
  eNumber: string;
  name: string;
  maxLevel?: number; // Maximum permitted level (if restricted)
  status: 'approved' | 'restricted' | 'banned' | 'unknown';
  countryCode: string;
}

export interface AllergenRegulation {
  allergen: string;
  mandatoryDeclaration: boolean;
  countryCode: string;
}

/**
 * Country-specific additive regulations
 * Maps E-numbers to country-specific restrictions
 */
const COUNTRY_ADDITIVE_REGULATIONS: Record<string, Record<string, AdditiveRegulation>> = {
  // AU/NZ (FSANZ)
  'AU': {
    // Example: Some additives restricted in AU/NZ
    'e102': { eNumber: 'e102', name: 'Tartrazine', status: 'approved', countryCode: 'AU' },
    'e104': { eNumber: 'e104', name: 'Quinoline Yellow', status: 'restricted', maxLevel: 100, countryCode: 'AU' },
  },
  'NZ': {
    // Same as AU (FSANZ covers both)
    'e102': { eNumber: 'e102', name: 'Tartrazine', status: 'approved', countryCode: 'NZ' },
    'e104': { eNumber: 'e104', name: 'Quinoline Yellow', status: 'restricted', maxLevel: 100, countryCode: 'NZ' },
  },
  // CA (Health Canada)
  'CA': {
    // Health Canada additive regulations
    'e102': { eNumber: 'e102', name: 'Tartrazine', status: 'approved', countryCode: 'CA' },
  },
  // US (FDA GRAS)
  'US': {
    // FDA GRAS list - most additives approved
    'e102': { eNumber: 'e102', name: 'FD&C Yellow 5', status: 'approved', countryCode: 'US' },
    'e110': { eNumber: 'e110', name: 'FD&C Yellow 6', status: 'approved', countryCode: 'US' },
  },
  // EU (EFSA)
  'EU': {
    // EU food additive database
    'e102': { eNumber: 'e102', name: 'Tartrazine', status: 'approved', countryCode: 'EU' },
    'e104': { eNumber: 'e104', name: 'Quinoline Yellow', status: 'restricted', maxLevel: 50, countryCode: 'EU' },
  },
};

/**
 * Country-specific allergen regulations
 */
const COUNTRY_ALLERGEN_REGULATIONS: Record<string, AllergenRegulation[]> = {
  'AU': [
    { allergen: 'peanuts', mandatoryDeclaration: true, countryCode: 'AU' },
    { allergen: 'tree nuts', mandatoryDeclaration: true, countryCode: 'AU' },
    { allergen: 'milk', mandatoryDeclaration: true, countryCode: 'AU' },
    { allergen: 'eggs', mandatoryDeclaration: true, countryCode: 'AU' },
    { allergen: 'fish', mandatoryDeclaration: true, countryCode: 'AU' },
    { allergen: 'shellfish', mandatoryDeclaration: true, countryCode: 'AU' },
    { allergen: 'soy', mandatoryDeclaration: true, countryCode: 'AU' },
    { allergen: 'wheat', mandatoryDeclaration: true, countryCode: 'AU' },
  ],
  'NZ': [
    // Same as AU (FSANZ covers both)
    { allergen: 'peanuts', mandatoryDeclaration: true, countryCode: 'NZ' },
    { allergen: 'tree nuts', mandatoryDeclaration: true, countryCode: 'NZ' },
    { allergen: 'milk', mandatoryDeclaration: true, countryCode: 'NZ' },
    { allergen: 'eggs', mandatoryDeclaration: true, countryCode: 'NZ' },
    { allergen: 'fish', mandatoryDeclaration: true, countryCode: 'NZ' },
    { allergen: 'shellfish', mandatoryDeclaration: true, countryCode: 'NZ' },
    { allergen: 'soy', mandatoryDeclaration: true, countryCode: 'NZ' },
    { allergen: 'wheat', mandatoryDeclaration: true, countryCode: 'NZ' },
  ],
  'CA': [
    { allergen: 'peanuts', mandatoryDeclaration: true, countryCode: 'CA' },
    { allergen: 'tree nuts', mandatoryDeclaration: true, countryCode: 'CA' },
    { allergen: 'milk', mandatoryDeclaration: true, countryCode: 'CA' },
    { allergen: 'eggs', mandatoryDeclaration: true, countryCode: 'CA' },
    { allergen: 'fish', mandatoryDeclaration: true, countryCode: 'CA' },
    { allergen: 'shellfish', mandatoryDeclaration: true, countryCode: 'CA' },
    { allergen: 'soy', mandatoryDeclaration: true, countryCode: 'CA' },
    { allergen: 'wheat', mandatoryDeclaration: true, countryCode: 'CA' },
    { allergen: 'sesame', mandatoryDeclaration: true, countryCode: 'CA' },
    { allergen: 'mustard', mandatoryDeclaration: true, countryCode: 'CA' },
  ],
  'US': [
    { allergen: 'peanuts', mandatoryDeclaration: true, countryCode: 'US' },
    { allergen: 'tree nuts', mandatoryDeclaration: true, countryCode: 'US' },
    { allergen: 'milk', mandatoryDeclaration: true, countryCode: 'US' },
    { allergen: 'eggs', mandatoryDeclaration: true, countryCode: 'US' },
    { allergen: 'fish', mandatoryDeclaration: true, countryCode: 'US' },
    { allergen: 'shellfish', mandatoryDeclaration: true, countryCode: 'US' },
    { allergen: 'soy', mandatoryDeclaration: true, countryCode: 'US' },
    { allergen: 'wheat', mandatoryDeclaration: true, countryCode: 'US' },
    { allergen: 'sesame', mandatoryDeclaration: true, countryCode: 'US' }, // Added in 2023
  ],
  'EU': [
    { allergen: 'peanuts', mandatoryDeclaration: true, countryCode: 'EU' },
    { allergen: 'tree nuts', mandatoryDeclaration: true, countryCode: 'EU' },
    { allergen: 'milk', mandatoryDeclaration: true, countryCode: 'EU' },
    { allergen: 'eggs', mandatoryDeclaration: true, countryCode: 'EU' },
    { allergen: 'fish', mandatoryDeclaration: true, countryCode: 'EU' },
    { allergen: 'shellfish', mandatoryDeclaration: true, countryCode: 'EU' },
    { allergen: 'soy', mandatoryDeclaration: true, countryCode: 'EU' },
    { allergen: 'wheat', mandatoryDeclaration: true, countryCode: 'EU' },
    { allergen: 'sesame', mandatoryDeclaration: true, countryCode: 'EU' },
    { allergen: 'mustard', mandatoryDeclaration: true, countryCode: 'EU' },
    { allergen: 'celery', mandatoryDeclaration: true, countryCode: 'EU' },
    { allergen: 'lupin', mandatoryDeclaration: true, countryCode: 'EU' },
    { allergen: 'molluscs', mandatoryDeclaration: true, countryCode: 'EU' },
  ],
};

/**
 * Get country-specific additive regulations
 */
export function getCountryAdditiveRegulations(countryCode: string | null): Record<string, AdditiveRegulation> {
  if (!countryCode) {
    return {};
  }

  const code = countryCode.toUpperCase();
  
  // Check if EU country
  if (isEUCountry(countryCode)) {
    return COUNTRY_ADDITIVE_REGULATIONS['EU'] || {};
  }

  return COUNTRY_ADDITIVE_REGULATIONS[code] || {};
}

/**
 * Get country-specific allergen regulations
 */
export function getCountryAllergenRegulations(countryCode: string | null): AllergenRegulation[] {
  if (!countryCode) {
    return [];
  }

  const code = countryCode.toUpperCase();
  
  // Check if EU country
  if (isEUCountry(countryCode)) {
    return COUNTRY_ALLERGEN_REGULATIONS['EU'] || [];
  }

  return COUNTRY_ALLERGEN_REGULATIONS[code] || [];
}

/**
 * Check if an additive is restricted in a specific country
 */
export function isAdditiveRestricted(eNumber: string, countryCode: string | null): boolean {
  const regulations = getCountryAdditiveRegulations(countryCode);
  const regulation = regulations[eNumber.toLowerCase()];
  
  if (!regulation) {
    return false; // Unknown status, assume not restricted
  }

  return regulation.status === 'restricted' || regulation.status === 'banned';
}

/**
 * Get additive penalty adjustment based on country regulations
 * Returns additional penalty if additive is restricted/banned in user's country
 */
export function getCountrySpecificAdditivePenalty(
  eNumber: string,
  countryCode: string | null
): number {
  const regulations = getCountryAdditiveRegulations(countryCode);
  const regulation = regulations[eNumber.toLowerCase()];
  
  if (!regulation) {
    return 0; // No country-specific penalty
  }

  if (regulation.status === 'banned') {
    return -5; // Additional penalty for banned additives
  } else if (regulation.status === 'restricted') {
    return -2; // Additional penalty for restricted additives
  }

  return 0;
}

