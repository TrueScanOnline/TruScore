// Score Highlight Override Rules
// This file allows developers to add specific rules that prevent certain highlights
// from being displayed when they would be inaccurate or misleading.

import { ProductWithTrustScore } from '../types/product';
import { ProductFlag } from '../utils/productFlags';
import { isAlcoholicProduct } from '../utils/alcoholHighlightClassification';

/**
 * Rule condition - matches products based on various criteria
 */
export interface OverrideRuleCondition {
  // Match if product categories contain any of these keywords (case-insensitive)
  categories?: string[];
  
  // Match if product name contains any of these keywords (case-insensitive)
  productNameKeywords?: string[];
  
  // Match if ingredients text contains any of these keywords (case-insensitive)
  ingredientsKeywords?: string[];
  
  // Match if labels_tags contain any of these tags (case-insensitive)
  labelsTags?: string[];
  
  // Match if additives_tags contain any of these tags (case-insensitive)
  additivesTags?: string[];
  
  // Match if allergens_tags contain any of these tags (case-insensitive)
  // Useful for detecting animal products (e.g., 'en:milk', 'en:eggs', 'en:fish')
  allergensTags?: string[];
  
  // Match if product has specific NOVA group
  novaGroup?: number;
  
  // Match if product has alcohol content
  hasAlcohol?: boolean;
}

/**
 * Rule action - what to do when condition matches
 */
export interface OverrideRuleAction {
  // Exclude flags with these exact titles (case-insensitive)
  excludeFlagTitles?: string[];
  
  // Exclude flags with titles containing these keywords (case-insensitive)
  excludeFlagTitleKeywords?: string[];
  
  // Exclude flags from these categories
  excludeFlagCategories?: ProductFlag['category'][];
  
  // Exclude flags of specific type
  excludeFlagTypes?: ('green' | 'red')[];
}

/**
 * Complete override rule
 */
export interface ScoreHighlightOverrideRule {
  // Rule name/description (for documentation/debugging)
  name: string;
  
  // Condition that must match for rule to apply
  condition: OverrideRuleCondition;
  
  // Action to take when condition matches
  action: OverrideRuleAction;
  
  // Optional: priority (higher = checked first, default: 0)
  priority?: number;
}

/**
 * Check if a product matches a rule condition
 * Uses PURE OR logic: if ANY condition matches, the rule applies
 * This means: categories OR productNameKeywords OR ingredientsKeywords OR labelsTags OR 
 * additivesTags OR allergensTags OR novaGroup OR hasAlcohol - if ANY match, return true
 */
function matchesCondition(product: ProductWithTrustScore, condition: OverrideRuleCondition): boolean {
  // Track if ANY condition matches (pure OR logic)
  let hasAnyMatch = false;
  let hasAnyCondition = false;
  
  // Check categories
  if (condition.categories && condition.categories.length > 0) {
    hasAnyCondition = true;
    const productCategories = product.categories_tags?.map(c => c.toLowerCase()) || [];
    const matchesCategory = condition.categories.some(keyword => 
      productCategories.some(cat => cat.includes(keyword.toLowerCase()))
    );
    if (matchesCategory) hasAnyMatch = true;
  }
  
  // Check product name keywords
  if (condition.productNameKeywords && condition.productNameKeywords.length > 0) {
    hasAnyCondition = true;
    const productName = (product.product_name || product.product_name_en || '').toLowerCase();
    const matchesName = condition.productNameKeywords.some(keyword => 
      productName.includes(keyword.toLowerCase())
    );
    if (matchesName) hasAnyMatch = true;
  }
  
  // Check ingredients keywords
  if (condition.ingredientsKeywords && condition.ingredientsKeywords.length > 0) {
    hasAnyCondition = true;
    const ingredients = (product.ingredients_text || product.ingredients_text_en || '').toLowerCase();
    const matchesIngredients = condition.ingredientsKeywords.some(keyword => 
      ingredients.includes(keyword.toLowerCase())
    );
    if (matchesIngredients) hasAnyMatch = true;
  }
  
  // Check labels_tags
  if (condition.labelsTags && condition.labelsTags.length > 0) {
    hasAnyCondition = true;
    const productLabels = product.labels_tags?.map(l => l.toLowerCase()) || [];
    const matchesLabel = condition.labelsTags.some(tag => 
      productLabels.some(label => label.includes(tag.toLowerCase()))
    );
    if (matchesLabel) hasAnyMatch = true;
  }
  
  // Check additives_tags
  if (condition.additivesTags && condition.additivesTags.length > 0) {
    hasAnyCondition = true;
    const productAdditives = product.additives_tags?.map(a => a.toLowerCase()) || [];
    const matchesAdditive = condition.additivesTags.some(tag => 
      productAdditives.some(additive => additive.includes(tag.toLowerCase()))
    );
    if (matchesAdditive) hasAnyMatch = true;
  }
  
  // Check allergens_tags
  if (condition.allergensTags && condition.allergensTags.length > 0) {
    hasAnyCondition = true;
    const productAllergens = product.allergens_tags?.map(a => a.toLowerCase()) || [];
    const matchesAllergen = condition.allergensTags.some(tag => 
      productAllergens.some(allergen => allergen.includes(tag.toLowerCase()))
    );
    if (matchesAllergen) hasAnyMatch = true;
  }
  
  // Check NOVA group (OR logic - if specified and matches, it's a match)
  if (condition.novaGroup !== undefined) {
    hasAnyCondition = true;
    if (product.nova_group === condition.novaGroup) {
      hasAnyMatch = true;
    }
  }
  
  if (condition.hasAlcohol !== undefined) {
    hasAnyCondition = true;
    const detectedAlcohol = isAlcoholicProduct(product);
    if (condition.hasAlcohol === true && detectedAlcohol) {
      hasAnyMatch = true;
    } else if (condition.hasAlcohol === false && !detectedAlcohol) {
      hasAnyMatch = true;
    }
  }
  
  // Pure OR logic: if we have any conditions and at least one matches, return true
  // If we have conditions but none match, return false
  // If we have no conditions at all, return true (matches everything - though this shouldn't happen)
  if (hasAnyCondition) {
    return hasAnyMatch;
  }
  
  return true; // No conditions specified - matches everything (shouldn't happen in practice)
}

/**
 * Check if a flag should be excluded based on rule action
 */
function shouldExcludeFlag(flag: ProductFlag, action: OverrideRuleAction): boolean {
  // Check exact title match
  if (action.excludeFlagTitles && action.excludeFlagTitles.length > 0) {
    const flagTitleLower = flag.title.toLowerCase();
    if (action.excludeFlagTitles.some(title => flagTitleLower === title.toLowerCase())) {
      return true;
    }
  }
  
  // Check title keyword match
  if (action.excludeFlagTitleKeywords && action.excludeFlagTitleKeywords.length > 0) {
    const flagTitleLower = flag.title.toLowerCase();
    if (action.excludeFlagTitleKeywords.some(keyword => flagTitleLower.includes(keyword.toLowerCase()))) {
      return true;
    }
  }
  
  // Check category match
  if (action.excludeFlagCategories && action.excludeFlagCategories.length > 0) {
    if (action.excludeFlagCategories.includes(flag.category)) {
      return true;
    }
  }
  
  // Check type match
  if (action.excludeFlagTypes && action.excludeFlagTypes.length > 0) {
    if (action.excludeFlagTypes.includes(flag.type)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Apply override rules to filter flags
 */
export function applyOverrideRules(
  flags: ProductFlag[],
  product: ProductWithTrustScore,
  rules: ScoreHighlightOverrideRule[] = DEFAULT_OVERRIDE_RULES
): ProductFlag[] {
  // Sort rules by priority (higher first)
  const sortedRules = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  let filteredFlags = [...flags];
  
  // Apply each rule
  for (const rule of sortedRules) {
    // Special handling for Rule 0: Check if ingredients card is displayed
    if (rule.name === 'Exclude "No Additives" when Ingredients card is not displayed') {
      if (!hasIngredientsCard(product)) {
        // No ingredients card - exclude "No Additives" flags
        filteredFlags = filteredFlags.filter(flag => !shouldExcludeFlag(flag, rule.action));
      }
      continue;
    }
    
    if (matchesCondition(product, rule.condition)) {
      // Rule matches - apply action
      filteredFlags = filteredFlags.filter(flag => !shouldExcludeFlag(flag, rule.action));
    }
  }
  
  return filteredFlags;
}

/**
 * DEFAULT OVERRIDE RULES
 * 
 * Add your custom rules here. Rules are checked in priority order (higher priority first).
 * 
 * Example rules:
 * - Alcohol products should not show "High Body Safety Score"
 * - Fish/Tuna products should not show "Vegan Product"
 */
/**
 * Check if product has ingredients card displayed
 * Ingredients card is shown if ingredients_text exists and is valid (not just a barcode)
 */
function hasIngredientsCard(product: ProductWithTrustScore): boolean {
  const ingredientsText = product.ingredients_text?.trim() || '';
  if (!ingredientsText || ingredientsText.length < 10) return false;
  
  // Check if entire text is just a barcode pattern
  const isBarcodePattern = /^\d{8,14}$/.test(ingredientsText.replace(/\s/g, ''));
  if (isBarcodePattern) return false;
  
  return true;
}

export const DEFAULT_OVERRIDE_RULES: ScoreHighlightOverrideRule[] = [
  // Rule 0: If no Ingredients card is displayed, don't show "No Additives" highlight
  {
    name: 'Exclude "No Additives" when Ingredients card is not displayed',
    priority: 15, // Higher priority - check this first
    condition: {
      // This will be checked programmatically in applyOverrideRules
    } as OverrideRuleCondition,
    action: {
      excludeFlagTitles: ['No Additives'],
      excludeFlagTitleKeywords: ['no additives'],
    },
  },
  // Rule 1: Alcohol products should not show "High Body Safety Score" or "No artificial additives"
  {
    name: 'Exclude "High Body Safety Score" and "No artificial additives" for alcohol products',
    priority: 10,
    condition: {
      hasAlcohol: true,
    },
    action: {
      excludeFlagTitles: ['High Body Safety Score', 'No Additives', 'No artificial additives'],
      excludeFlagTitleKeywords: ['body safety', 'no additives', 'artificial additives'],
    },
  },
  
  // Rule 2: Fish/Seafood products should not show "Vegan Product"
  {
    name: 'Exclude "Vegan Product" for fish/seafood products',
    priority: 10,
    condition: {
      categories: ['fish', 'seafood', 'tuna', 'salmon', 'sardines', 'anchovies', 'mackerel', 'cod', 'haddock', 'prawns', 'shrimp', 'crab', 'lobster', 'oysters', 'mussels'],
      productNameKeywords: ['tuna', 'salmon', 'fish', 'seafood', 'sardine', 'anchovy', 'mackerel', 'cod', 'haddock', 'prawn', 'shrimp', 'crab', 'lobster', 'oyster', 'mussel'],
      ingredientsKeywords: ['tuna', 'salmon', 'fish', 'seafood', 'sardine', 'anchovy', 'mackerel', 'cod', 'haddock', 'prawn', 'shrimp', 'crab', 'lobster', 'oyster', 'mussel'],
      allergensTags: ['fish', 'crustaceans', 'shellfish'], // Check allergens_tags for more reliable detection
    },
    action: {
      excludeFlagTitles: ['Vegan Product', 'Vegetarian Product'],
      excludeFlagTitleKeywords: ['vegan', 'vegetarian'],
    },
  },
  
  // Rule 3: Meat products should not show "Vegan Product" or "Vegetarian Product"
  {
    name: 'Exclude "Vegan/Vegetarian Product" for meat products',
    priority: 10,
    condition: {
      categories: ['meat', 'beef', 'pork', 'chicken', 'lamb', 'turkey', 'duck', 'bacon', 'ham', 'sausage'],
      productNameKeywords: ['beef', 'pork', 'chicken', 'lamb', 'turkey', 'duck', 'bacon', 'ham', 'sausage', 'meat'],
      ingredientsKeywords: ['beef', 'pork', 'chicken', 'lamb', 'turkey', 'duck', 'bacon', 'ham', 'sausage', 'meat'],
      // Note: Meat products typically don't have allergen tags, so we rely on categories/name/ingredients
    },
    action: {
      excludeFlagTitles: ['Vegan Product', 'Vegetarian Product'],
      excludeFlagTitleKeywords: ['vegan', 'vegetarian'],
    },
  },
  
  // Rule 4: Dairy products should not show "Vegan Product"
  {
    name: 'Exclude "Vegan Product" for dairy products',
    priority: 10,
    condition: {
      categories: ['dairy', 'milk', 'cheese', 'yogurt', 'butter', 'cream'],
      productNameKeywords: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'dairy'],
      ingredientsKeywords: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'dairy', 'lactose'],
      allergensTags: ['milk', 'dairy', 'lactose'], // Check allergens_tags for more reliable detection
    },
    action: {
      excludeFlagTitles: ['Vegan Product'],
      excludeFlagTitleKeywords: ['vegan'],
    },
  },
  
  // Rule 5: Eggs should not show "Vegan Product"
  {
    name: 'Exclude "Vegan Product" for egg products',
    priority: 10,
    condition: {
      categories: ['eggs', 'egg'],
      productNameKeywords: ['egg'],
      ingredientsKeywords: ['egg'],
      allergensTags: ['egg', 'eggs'], // Check allergens_tags for more reliable detection
    },
    action: {
      excludeFlagTitles: ['Vegan Product'],
      excludeFlagTitleKeywords: ['vegan'],
    },
  },
];

