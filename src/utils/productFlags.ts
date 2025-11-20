// Product flags system - generates green (positive) and red (negative) flags
import { Product, ProductWithTrustScore } from '../types/product';
import { extractManufacturingCountry } from '../services/openFoodFacts';

export interface ProductFlag {
  type: 'green' | 'red';
  category: 'geopolitics' | 'news' | 'boycott' | 'sustainability' | 'ethics' | 'nutrition' | 'processing';
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high';
}

/**
 * Generate all flags for a product based on available data
 */
export function generateProductFlags(product: ProductWithTrustScore): ProductFlag[] {
  const flags: ProductFlag[] = [];

  // Sustainability flags
  flags.push(...generateSustainabilityFlags(product));

  // Ethics flags
  flags.push(...generateEthicsFlags(product));

  // Nutrition/Body Safety flags
  flags.push(...generateNutritionFlags(product));

  // Processing flags
  flags.push(...generateProcessingFlags(product));

  // Geopolitics flags (placeholder - would need external data source)
  flags.push(...generateGeopoliticsFlags(product));

  // Boycott flags (placeholder - would need external data source)
  flags.push(...generateBoycottFlags(product));

  // News flags (placeholder - would need external data source)
  flags.push(...generateNewsFlags(product));

  return flags;
}

/**
 * Generate sustainability-related flags
 */
function generateSustainabilityFlags(product: ProductWithTrustScore): ProductFlag[] {
  const flags: ProductFlag[] = [];

  // Eco-Score
  if (product.ecoscore_grade) {
    const grade = product.ecoscore_grade.toLowerCase();
    if (grade === 'a' || grade === 'b') {
      flags.push({
        type: 'green',
        category: 'sustainability',
        title: 'Excellent Eco-Score',
        description: `Eco-Score of ${grade.toUpperCase()} indicates minimal environmental impact`,
        severity: 'high',
      });
    } else if (grade === 'e' || grade === 'd') {
      flags.push({
        type: 'red',
        category: 'sustainability',
        title: 'Poor Eco-Score',
        description: `Eco-Score of ${grade.toUpperCase()} indicates significant environmental impact`,
        severity: grade === 'e' ? 'high' : 'medium',
      });
    }
  }

  // Palm oil
  const hasPalmOil = product.ingredients_analysis_tags?.some(tag => 
    tag.toLowerCase().includes('palm-oil') && !tag.toLowerCase().includes('palm-oil-free')
  );
  const isPalmOilFree = product.ingredients_analysis_tags?.some(tag => 
    tag.toLowerCase().includes('palm-oil-free')
  );

  if (hasPalmOil) {
    flags.push({
      type: 'red',
      category: 'sustainability',
      title: 'Contains Palm Oil',
      description: 'Palm oil production is linked to deforestation and biodiversity loss',
      severity: 'medium',
    });
  } else if (isPalmOilFree) {
    flags.push({
      type: 'green',
      category: 'sustainability',
      title: 'Palm Oil Free',
      description: 'This product does not contain palm oil',
      severity: 'low',
    });
  }

  // Packaging recyclability
  if (product.packaging_data?.isRecyclable) {
    flags.push({
      type: 'green',
      category: 'sustainability',
      title: 'Recyclable Packaging',
      description: 'Product packaging is recyclable',
      severity: 'low',
    });
  }

  // Carbon footprint
  if (product.ecoscore_data?.agribalyse?.co2_total) {
    const co2 = product.ecoscore_data.agribalyse.co2_total;
    if (co2 < 2) {
      flags.push({
        type: 'green',
        category: 'sustainability',
        title: 'Low Carbon Footprint',
        description: `CO2e per kg: ${co2.toFixed(1)}kg - below average`,
        severity: 'medium',
      });
    } else if (co2 > 5) {
      flags.push({
        type: 'red',
        category: 'sustainability',
        title: 'High Carbon Footprint',
        description: `CO2e per kg: ${co2.toFixed(1)}kg - above average`,
        severity: 'medium',
      });
    }
  }

  return flags;
}

/**
 * Generate ethics-related flags
 */
function generateEthicsFlags(product: ProductWithTrustScore): ProductFlag[] {
  const flags: ProductFlag[] = [];

  // Certifications
  if (product.certifications && product.certifications.length > 0) {
    const certNames = product.certifications.map(c => c.name).join(', ');
    flags.push({
      type: 'green',
      category: 'ethics',
      title: 'Ethical Certifications',
      description: `Certified: ${certNames}`,
      severity: 'medium',
    });
  }

  // Fair Trade
  const hasFairTrade = product.labels_tags?.some(tag => 
    tag.toLowerCase().includes('fair-trade') || tag.toLowerCase().includes('fairtrade')
  );
  if (hasFairTrade) {
    flags.push({
      type: 'green',
      category: 'ethics',
      title: 'Fair Trade Certified',
      description: 'Supports fair wages and working conditions for producers',
      severity: 'high',
    });
  }

  // Organic
  const hasOrganic = product.labels_tags?.some(tag => 
    tag.toLowerCase().includes('organic') || tag.toLowerCase().includes('bio')
  );
  if (hasOrganic) {
    flags.push({
      type: 'green',
      category: 'ethics',
      title: 'Organic Certified',
      description: 'Produced without synthetic pesticides and fertilizers',
      severity: 'medium',
    });
  }

  // Animal welfare (vegan/vegetarian)
  const isVegan = product.ingredients_analysis_tags?.some(tag => 
    tag.toLowerCase().includes('vegan')
  );
  const isVegetarian = product.ingredients_analysis_tags?.some(tag => 
    tag.toLowerCase().includes('vegetarian') && !tag.toLowerCase().includes('non-vegetarian')
  );

  if (isVegan) {
    flags.push({
      type: 'green',
      category: 'ethics',
      title: 'Vegan Product',
      description: 'No animal products or by-products',
      severity: 'low',
    });
  } else if (isVegetarian) {
    flags.push({
      type: 'green',
      category: 'ethics',
      title: 'Vegetarian Product',
      description: 'Suitable for vegetarians',
      severity: 'low',
    });
  }

  return flags;
}

/**
 * Generate nutrition-related flags
 */
function generateNutritionFlags(product: ProductWithTrustScore): ProductFlag[] {
  const flags: ProductFlag[] = [];

  // Nutri-Score
  if (product.nutriscore_grade) {
    const grade = product.nutriscore_grade.toLowerCase();
    if (grade === 'a' || grade === 'b') {
      flags.push({
        type: 'green',
        category: 'nutrition',
        title: 'Excellent Nutri-Score',
        description: `Nutri-Score of ${grade.toUpperCase()} indicates good nutritional quality`,
        severity: 'high',
      });
    } else if (grade === 'e') {
      flags.push({
        type: 'red',
        category: 'nutrition',
        title: 'Poor Nutri-Score',
        description: `Nutri-Score of ${grade.toUpperCase()} indicates low nutritional quality`,
        severity: 'high',
      });
    }
  }

  // Body Safety score
  if (product.trust_score_breakdown) {
    const bodySafety = product.trust_score_breakdown.body;
    if (bodySafety !== undefined && bodySafety >= 20) {
      flags.push({
        type: 'green',
        category: 'nutrition',
        title: 'High Body Safety Score',
        description: 'Product is generally safe and nutritious',
        severity: 'medium',
      });
    } else if (bodySafety !== undefined && bodySafety <= 10) {
      flags.push({
        type: 'red',
        category: 'nutrition',
        title: 'Low Body Safety Score',
        description: 'Contains ingredients that may be concerning for health',
        severity: 'high',
      });
    }
  }

  // High sugar
  if (product.nutrient_levels?.sugars === 'high') {
    flags.push({
      type: 'red',
      category: 'nutrition',
      title: 'High Sugar Content',
      description: 'Contains high levels of sugar',
      severity: 'medium',
    });
  }

  // High salt
  if (product.nutrient_levels?.salt === 'high') {
    flags.push({
      type: 'red',
      category: 'nutrition',
      title: 'High Salt Content',
      description: 'Contains high levels of salt/sodium',
      severity: 'medium',
    });
  }

  // High saturated fat
  if (product.nutrient_levels?.saturated_fat === 'high') {
    flags.push({
      type: 'red',
      category: 'nutrition',
      title: 'High Saturated Fat',
      description: 'Contains high levels of saturated fat',
      severity: 'medium',
    });
  }

  // Additives
  const highRiskAdditives = ['en:e102', 'en:e104', 'en:e110', 'en:e122', 'en:e124', 'en:e129',
                             'en:e211', 'en:e250', 'en:e251', 'en:e621', 'en:e951', 'en:e952'];
  const highRiskCount = product.additives_tags?.filter(tag =>
    highRiskAdditives.some(risk => tag.toLowerCase().includes(risk))
  ).length || 0;

  if (highRiskCount > 0) {
    flags.push({
      type: 'red',
      category: 'nutrition',
      title: 'Contains High-Risk Additives',
      description: `Contains ${highRiskCount} additive(s) flagged as potentially harmful`,
      severity: 'medium',
    });
  }

  // Allergens
  if (product.allergens_tags && product.allergens_tags.length > 0) {
    flags.push({
      type: 'red',
      category: 'nutrition',
      title: 'Contains Allergens',
      description: `Contains: ${product.allergens_tags.join(', ')}`,
      severity: 'low',
    });
  }

  return flags;
}

/**
 * Generate processing-related flags
 */
function generateProcessingFlags(product: ProductWithTrustScore): ProductFlag[] {
  const flags: ProductFlag[] = [];

  // NOVA classification
  if (product.nova_group === 1) {
    flags.push({
      type: 'green',
      category: 'processing',
      title: 'Unprocessed or Minimally Processed',
      description: 'NOVA Group 1 - natural or minimally processed foods',
      severity: 'high',
    });
  } else if (product.nova_group === 4) {
    flags.push({
      type: 'red',
      category: 'processing',
      title: 'Ultra-Processed Food',
      description: 'NOVA Group 4 - highly processed with many additives',
      severity: 'high',
    });
  }

  // Additive count
  if (product.additives_tags && product.additives_tags.length > 5) {
    flags.push({
      type: 'red',
      category: 'processing',
      title: 'Many Additives',
      description: `Contains ${product.additives_tags.length} additives`,
      severity: 'medium',
    });
  } else if (!product.additives_tags || product.additives_tags.length === 0) {
    flags.push({
      type: 'green',
      category: 'processing',
      title: 'No Additives',
      description: 'Contains no artificial additives',
      severity: 'low',
    });
  }

  return flags;
}

/**
 * Generate geopolitics-related flags (placeholder - requires external data)
 */
function generateGeopoliticsFlags(product: ProductWithTrustScore): ProductFlag[] {
  const flags: ProductFlag[] = [];

  const manufacturingCountry = extractManufacturingCountry(product);
  
  // Placeholder for geopolitics checks - would need external API/database
  // This is where you would check for:
  // - Products from countries with ongoing conflicts
  // - Products from regions with human rights concerns
  // - Products linked to geopolitical issues
  
  // Example check (would need actual data source):
  // const problematicCountries = ['RU', 'CN', ...]; // Would come from external source
  // if (manufacturingCountry && problematicCountries.includes(manufacturingCountry)) {
  //   flags.push({
  //     type: 'red',
  //     category: 'geopolitics',
  //     title: 'Geopolitical Concerns',
  //     description: `Product origin may be linked to geopolitical issues`,
  //     severity: 'medium',
  //   });
  // }

  return flags;
}

/**
 * Generate boycott-related flags (placeholder - requires external data)
 */
function generateBoycottFlags(product: ProductWithTrustScore): ProductFlag[] {
  const flags: ProductFlag[] = [];

  // Placeholder for boycott checks - would need external API/database
  // This is where you would check for:
  // - Brands/companies on boycott lists (BDS, etc.)
  // - Products from boycotted companies
  // - Consumer boycott campaigns
  
  // Example check (would need actual data source):
  // const boycottedBrands = ['Brand1', 'Brand2', ...]; // Would come from external source
  // if (product.brands && boycottedBrands.some(b => product.brands?.toLowerCase().includes(b.toLowerCase()))) {
  //   flags.push({
  //     type: 'red',
  //     category: 'boycott',
  //     title: 'Boycotted Brand',
  //     description: 'This brand is subject to consumer boycotts',
  //     severity: 'high',
  //   });
  // }

  return flags;
}

/**
 * Generate news-related flags (placeholder - requires external data)
 */
function generateNewsFlags(product: ProductWithTrustScore): ProductFlag[] {
  const flags: ProductFlag[] = [];

  // Placeholder for news checks - would need external API/database
  // This is where you would check for:
  // - Recent negative news about the product/brand
  // - Recalls and safety warnings
  // - Media coverage of issues
  
  // FDA recalls are already handled separately, but could add here:
  if (product.recalls && product.recalls.length > 0) {
    flags.push({
      type: 'red',
      category: 'news',
      title: 'Product Recall',
      description: `Active recall: ${product.recalls[0].reason}`,
      severity: 'high',
    });
  }

  return flags;
}

