// Packaging recyclability checker based on local recycling laws
// Determines if packaging materials meet country-specific recycling requirements

import { PackagingItem } from '../types/product';
import { getUserCountryCode } from './countryDetection';

/**
 * Check if a material type is recyclable according to local recycling laws
 * @param material - Material string (e.g., "en:plastic", "en:metal", "en:cardboard")
 * @param countryCode - Country code (e.g., "NZ", "AU", "US", "GB")
 * @returns true if recyclable according to local laws, false otherwise
 */
function isMaterialRecyclableLocally(material: string | undefined, countryCode: string | null): boolean {
  if (!material) return false;

  const materialLower = material.toLowerCase().replace(/^en:/, '');
  const country = countryCode?.toUpperCase() || 'GLOBAL';

  // Country-specific recycling rules
  const recyclingRules: Record<string, {
    recyclable: string[];
    notRecyclable: string[];
  }> = {
    'NZ': {
      recyclable: [
        'metal', 'aluminum', 'steel', 'tin', 'can',
        'glass', 'bottle', 'jar',
        'cardboard', 'paper', 'box',
        'plastic', 'pet', 'hdpe', 'bottle',
        'soft-plastic', 'bag', 'wrapper',
      ],
      notRecyclable: [
        'mixed-plastic', 'plastic-3', 'plastic-4', 'plastic-5', 'plastic-6', 'plastic-7',
        'polystyrene', 'styrofoam',
      ],
    },
    'AU': {
      recyclable: [
        'metal', 'aluminum', 'steel', 'tin', 'can',
        'glass', 'bottle', 'jar',
        'cardboard', 'paper', 'box',
        'plastic', 'pet', 'hdpe', 'bottle',
        'soft-plastic', 'bag', 'wrapper',
      ],
      notRecyclable: [
        'mixed-plastic', 'plastic-3', 'plastic-4', 'plastic-5', 'plastic-6', 'plastic-7',
        'polystyrene', 'styrofoam',
      ],
    },
    'US': {
      recyclable: [
        'metal', 'aluminum', 'steel', 'tin', 'can',
        'glass', 'bottle', 'jar',
        'cardboard', 'paper', 'box',
        'plastic', 'pet', 'hdpe', 'bottle',
      ],
      notRecyclable: [
        'plastic-3', 'plastic-4', 'plastic-5', 'plastic-6', 'plastic-7',
        'polystyrene', 'styrofoam',
        'bag', 'wrapper', // Plastic bags need special handling
      ],
    },
    'GB': {
      recyclable: [
        'metal', 'aluminum', 'steel', 'tin', 'can',
        'glass', 'bottle', 'jar',
        'cardboard', 'paper', 'box',
        'plastic', 'pet', 'bottle',
      ],
      notRecyclable: [
        'plastic-3', 'plastic-4', 'plastic-5', 'plastic-6', 'plastic-7',
        'polystyrene', 'styrofoam',
      ],
    },
    'GLOBAL': {
      recyclable: [
        'metal', 'aluminum', 'steel', 'tin', 'can',
        'glass', 'bottle', 'jar',
        'cardboard', 'paper', 'box',
        'plastic', 'pet', 'hdpe', 'bottle',
      ],
      notRecyclable: [
        'polystyrene', 'styrofoam',
      ],
    },
  };

  const rules = recyclingRules[country] || recyclingRules['GLOBAL'];

  // Check if material is explicitly not recyclable
  for (const notRecyclable of rules.notRecyclable) {
    if (materialLower.includes(notRecyclable)) {
      return false;
    }
  }

  // Check if material is recyclable
  for (const recyclable of rules.recyclable) {
    if (materialLower.includes(recyclable)) {
      return true;
    }
  }

  // Default: if we can't determine, return false (conservative approach)
  return false;
}

/**
 * Check if packaging items meet local recycling requirements
 * @param packagingItems - Array of packaging items
 * @param countryCode - Optional country code (will be detected if not provided)
 * @returns true if at least one packaging item is recyclable according to local laws
 */
export function meetsLocalRecyclingRequirements(
  packagingItems: PackagingItem[],
  countryCode?: string | null
): boolean {
  if (!packagingItems || packagingItems.length === 0) {
    return false;
  }

  const userCountry = countryCode || getUserCountryCode();

  // Check each packaging item
  for (const item of packagingItems) {
    // First check if item has explicit recycling tag
    if (item.recycling) {
      const recyclingLower = item.recycling.toLowerCase().replace(/^en:/, '');
      if (recyclingLower.includes('recyclable') && !recyclingLower.includes('non-recyclable')) {
        // Item is marked as recyclable - verify it meets local requirements
        if (isMaterialRecyclableLocally(item.material, userCountry)) {
          return true;
        }
      }
    }

    // Check material type against local recycling rules
    if (isMaterialRecyclableLocally(item.material, userCountry)) {
      return true;
    }
  }

  // If no items are recyclable according to local laws, return false
  return false;
}

/**
 * Get recyclability status for packaging based on local laws
 * @param packagingItems - Array of packaging items
 * @param countryCode - Optional country code (will be detected if not provided)
 * @returns Object with recyclability status and details
 */
export function getLocalRecyclabilityStatus(
  packagingItems: PackagingItem[],
  countryCode?: string | null
): {
  isRecyclable: boolean;
  recyclableItems: PackagingItem[];
  nonRecyclableItems: PackagingItem[];
  country: string | null;
} {
  if (!packagingItems || packagingItems.length === 0) {
    return {
      isRecyclable: false,
      recyclableItems: [],
      nonRecyclableItems: [],
      country: null,
    };
  }

  const userCountry = countryCode || getUserCountryCode();
  const recyclableItems: PackagingItem[] = [];
  const nonRecyclableItems: PackagingItem[] = [];

  for (const item of packagingItems) {
    const isRecyclable = isMaterialRecyclableLocally(item.material, userCountry);
    
    // Also check explicit recycling tag
    if (item.recycling) {
      const recyclingLower = item.recycling.toLowerCase().replace(/^en:/, '');
      if (recyclingLower.includes('recyclable') && !recyclingLower.includes('non-recyclable')) {
        if (isRecyclable) {
          recyclableItems.push(item);
        } else {
          nonRecyclableItems.push(item);
        }
      } else if (recyclingLower.includes('non-recyclable')) {
        nonRecyclableItems.push(item);
      } else if (isRecyclable) {
        recyclableItems.push(item);
      } else {
        nonRecyclableItems.push(item);
      }
    } else if (isRecyclable) {
      recyclableItems.push(item);
    } else {
      nonRecyclableItems.push(item);
    }
  }

  return {
    isRecyclable: recyclableItems.length > 0,
    recyclableItems,
    nonRecyclableItems,
    country: userCountry,
  };
}

