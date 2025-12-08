// Utility functions to parse text input into structured product data
// Used by ManualProductEntryModal to convert user text input into proper data structures

/**
 * Parse allergens and additives text into structured tags
 * Handles formats like:
 * - "E260, E300, Contains: Milk, Eggs"
 * - "E-numbers: E412, E415. Allergens: Wheat, Soy"
 * - "en:e260, en:e300, contains: milk, eggs"
 */
export function parseAllergensAndAdditives(text: string): {
  allergens_tags: string[];
  additives_tags: string[];
} {
  if (!text || !text.trim()) {
    return { allergens_tags: [], additives_tags: [] };
  }

  const allergens: Set<string> = new Set();
  const additives: Set<string> = new Set();
  
  const normalizedText = text.toLowerCase().trim();
  
  // Common allergen keywords
  const allergenKeywords = [
    'contains:',
    'allergens:',
    'may contain:',
    'contains',
    'allergen',
  ];
  
  // Common additive keywords
  const additiveKeywords = [
    'e-number',
    'e-numbers',
    'additives:',
    'additive',
  ];
  
  // Split by common delimiters
  const parts = normalizedText
    .split(/[,;|]/)
    .map(part => part.trim())
    .filter(part => part.length > 0);
  
  let inAllergenSection = false;
  let inAdditiveSection = false;
  
  for (const part of parts) {
    // Check if this part starts an allergen section
    if (allergenKeywords.some(keyword => part.startsWith(keyword))) {
      inAllergenSection = true;
      inAdditiveSection = false;
      const allergenList = part.replace(/^(contains|allergens|may contain):?\s*/i, '').trim();
      if (allergenList) {
        parseAllergenList(allergenList, allergens);
      }
      continue;
    }
    
    // Check if this part starts an additive section
    if (additiveKeywords.some(keyword => part.startsWith(keyword))) {
      inAdditiveSection = true;
      inAllergenSection = false;
      const additiveList = part.replace(/^(e-number|e-numbers|additives):?\s*/i, '').trim();
      if (additiveList) {
        parseAdditiveList(additiveList, additives);
      }
      continue;
    }
    
    // Try to detect E-numbers (format: E123, e123, en:e123, E-123)
    const eNumberMatch = part.match(/\b(en:)?e-?(\d+[a-z]?)\b/i);
    if (eNumberMatch && eNumberMatch[2]) {
      const eNumber = `en:e${eNumberMatch[2].toLowerCase()}`;
      additives.add(eNumber);
      inAdditiveSection = true;
      inAllergenSection = false;
      continue;
    }
    
    // If we're in an allergen section, treat as allergen
    if (inAllergenSection) {
      const allergenTag = formatAllergenTag(part);
      if (allergenTag) {
        allergens.add(allergenTag);
      }
    }
    // If we're in an additive section, try to parse as additive
    else if (inAdditiveSection) {
      parseAdditiveList(part, additives);
    }
    // Otherwise, try to detect what it is
    else {
      // Check if it's an E-number
      const eNumberMatchElse = part.match(/\b(en:)?e-?(\d+[a-z]?)\b/i);
      if (eNumberMatchElse && eNumberMatchElse[2]) {
        const eNumber = `en:e${eNumberMatchElse[2].toLowerCase()}`;
        additives.add(eNumber);
      }
      // Check if it looks like an allergen (common allergen names)
      else if (isCommonAllergen(part)) {
        const allergenTag = formatAllergenTag(part);
        if (allergenTag) {
          allergens.add(allergenTag);
        }
      }
    }
  }
  
  return {
    allergens_tags: Array.from(allergens),
    additives_tags: Array.from(additives),
  };
}

/**
 * Parse a list of allergens from text
 */
function parseAllergenList(text: string, allergens: Set<string>): void {
  const allergenParts = text.split(/[,\s]+/).filter(p => p.length > 0);
  for (const part of allergenParts) {
    const allergenTag = formatAllergenTag(part);
    if (allergenTag) {
      allergens.add(allergenTag);
    }
  }
}

/**
 * Format allergen name into tag format (en:allergen-name)
 */
function formatAllergenTag(text: string): string | null {
  if (!text || text.length < 2) return null;
  
  // Common allergen mappings
  const allergenMap: Record<string, string> = {
    'milk': 'en:milk',
    'egg': 'en:eggs',
    'eggs': 'en:eggs',
    'fish': 'en:fish',
    'shellfish': 'en:crustaceans',
    'crustaceans': 'en:crustaceans',
    'tree nuts': 'en:nuts',
    'nuts': 'en:nuts',
    'peanuts': 'en:peanuts',
    'wheat': 'en:wheat',
    'soy': 'en:soya',
    'soya': 'en:soya',
    'soybean': 'en:soya',
    'soybeans': 'en:soya',
    'sesame': 'en:sesame-seeds',
    'sesame seeds': 'en:sesame-seeds',
    'mustard': 'en:mustard',
    'celery': 'en:celery',
    'lupin': 'en:lupin',
    'lupins': 'en:lupin',
    'sulphites': 'en:sulphites',
    'sulfites': 'en:sulphites',
    'sulphur dioxide': 'en:sulphites',
    'sulfur dioxide': 'en:sulphites',
  };
  
  const normalized = text.toLowerCase().trim();
  
  // Check exact match first
  if (allergenMap[normalized]) {
    return allergenMap[normalized];
  }
  
  // Check if it already has en: prefix
  if (normalized.startsWith('en:')) {
    return normalized;
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(allergenMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  // Convert to tag format: "milk" -> "en:milk"
  const tag = normalized.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return tag ? `en:${tag}` : null;
}

/**
 * Check if text looks like a common allergen
 */
function isCommonAllergen(text: string): boolean {
  const commonAllergens = [
    'milk', 'egg', 'eggs', 'fish', 'shellfish', 'nuts', 'peanuts',
    'wheat', 'soy', 'soya', 'sesame', 'mustard', 'celery', 'lupin',
    'sulphites', 'sulfites',
  ];
  const normalized = text.toLowerCase();
  return commonAllergens.some(allergen => normalized.includes(allergen));
}

/**
 * Parse a list of additives from text
 */
function parseAdditiveList(text: string, additives: Set<string>): void {
  // Extract all E-numbers from text
  const eNumberRegex = /\b(en:)?e-?(\d+[a-z]?)\b/gi;
  let match;
  
  while ((match = eNumberRegex.exec(text)) !== null) {
    if (match[2]) {
      const eNumber = `en:e${match[2].toLowerCase()}`;
      additives.add(eNumber);
    }
  }
}

/**
 * Parse packaging/recycling text into structured PackagingData
 * Handles formats like:
 * - "Plastic bottle - recyclable"
 * - "Cardboard box - recyclable, Plastic wrap - non-recyclable"
 * - "Bottle: recyclable, Box: recyclable"
 */
export function parsePackagingData(text: string): {
  packaging_data?: {
    items: Array<{
      material?: string;
      shape?: string;
      recycling?: string;
      [key: string]: any;
    }>;
    isRecyclable: boolean;
    isReusable: boolean;
    isBiodegradable: boolean;
    recyclabilityScore: number;
  };
} {
  if (!text || !text.trim()) {
    return {};
  }

  const items: Array<{
    material?: string;
    shape?: string;
    recycling?: string;
    [key: string]: any;
  }> = [];
  
  let isRecyclable = false;
  let recyclableCount = 0;
  let totalCount = 0;
  
  const normalizedText = text.toLowerCase().trim();
  
  // Common packaging keywords
  const recyclableKeywords = ['recyclable', 'recycle', 'recycling'];
  const nonRecyclableKeywords = ['non-recyclable', 'non recyclable', 'not recyclable', 'unrecyclable'];
  const reusableKeywords = ['reusable', 'reuse', 'refillable', 'refill'];
  const biodegradableKeywords = ['biodegradable', 'compostable'];
  
  // Material keywords
  const materialMap: Record<string, string> = {
    'plastic': 'en:plastic',
    'cardboard': 'en:cardboard',
    'paper': 'en:paper',
    'glass': 'en:glass',
    'metal': 'en:metal',
    'aluminum': 'en:aluminium',
    'aluminium': 'en:aluminium',
    'tin': 'en:metal',
    'foil': 'en:aluminium',
    'styrofoam': 'en:expanded-polystyrene',
    'polystyrene': 'en:expanded-polystyrene',
  };
  
  // Shape keywords
  const shapeMap: Record<string, string> = {
    'bottle': 'en:bottle',
    'can': 'en:can',
    'jar': 'en:jar',
    'box': 'en:box',
    'carton': 'en:carton',
    'wrap': 'en:wrapping',
    'bag': 'en:bag',
    'pouch': 'en:pouch',
    'tube': 'en:tube',
    'container': 'en:container',
  };
  
  // Split by common delimiters
  const parts = normalizedText
    .split(/[,;|]/)
    .map(part => part.trim())
    .filter(part => part.length > 0);
  
  for (const part of parts) {
    totalCount++;
    const item: {
      material?: string;
      shape?: string;
      recycling?: string;
      [key: string]: any;
    } = {};
    
    // Detect material
    for (const [key, value] of Object.entries(materialMap)) {
      if (part.includes(key)) {
        item.material = value;
        break;
      }
    }
    
    // Detect shape
    for (const [key, value] of Object.entries(shapeMap)) {
      if (part.includes(key)) {
        item.shape = value;
        break;
      }
    }
    
    // Detect recyclability
    if (recyclableKeywords.some(keyword => part.includes(keyword))) {
      item.recycling = 'en:recyclable';
      isRecyclable = true;
      recyclableCount++;
    } else if (nonRecyclableKeywords.some(keyword => part.includes(keyword))) {
      item.recycling = 'en:non-recyclable';
    }
    
    // Detect reusability
    if (reusableKeywords.some(keyword => part.includes(keyword))) {
      // Could add reuse tracking here if needed
    }
    
    // Only add item if it has at least one property
    if (Object.keys(item).length > 0) {
      items.push(item);
    }
  }
  
  // Calculate recyclability score (0-100)
  const recyclabilityScore = totalCount > 0
    ? Math.round((recyclableCount / totalCount) * 100)
    : isRecyclable ? 100 : 0;
  
  // Determine if biodegradable (heuristic)
  const isBiodegradable = biodegradableKeywords.some(keyword => 
    normalizedText.includes(keyword)
  );
  
  // Determine if reusable (heuristic)
  const isReusable = reusableKeywords.some(keyword => 
    normalizedText.includes(keyword)
  );
  
  return {
    packaging_data: {
      items,
      isRecyclable,
      isReusable,
      isBiodegradable,
      recyclabilityScore,
    },
  };
}
