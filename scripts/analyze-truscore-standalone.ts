/// <reference path="../global.d.ts" />

/**
 * Standalone TruScore Analysis Script
 * Provides step-by-step breakdown of TruScore calculation for multiple barcodes
 * 
 * This version doesn't depend on React Native modules and works in Node.js
 * 
 * Usage:
 *   npm run analyze-truscore -- 9420020300194 1234567890123
 *   npm run analyze-truscore -- --file barcodes.txt
 * 
 * Output: Detailed PowerShell-style logs showing exact calculation for each pillar
 */

// Set up Node.js environment globals BEFORE any imports
if (typeof (global as any).__DEV__ === 'undefined') {
  (global as any).__DEV__ = process.env.NODE_ENV !== 'production';
}

// Mock Expo modules before importing anything that uses them
const Module = require('module');
const originalRequireModule = Module._load;

Module._load = function(request: string, parent: any) {
  if (request === 'expo-localization') {
    return {
      getLocales: () => [{ regionCode: 'US', languageTag: 'en-US' }],
    };
  }
  return originalRequireModule.apply(this, arguments);
};

import { Product } from '../src/types/product';
import { calculateTruScore } from '../src/lib/truscoreEngine/index';
import { calculateBodyPillar } from '../src/lib/truscoreEngine/pillars/bodyPillar';
import { calculatePlanetPillar } from '../src/lib/truscoreEngine/pillars/planetPillar';
import { calculateCarePillar } from '../src/lib/truscoreEngine/pillars/carePillar';
import { calculateOpenPillar } from '../src/lib/truscoreEngine/pillars/openPillar';
import * as fs from 'fs';

interface DetailedBreakdown {
  pillar: string;
  base: number;
  adjustments: Array<{
    description: string;
    value: number;
    type: 'positive' | 'negative' | 'neutral';
  }>;
  final: number;
}

interface AnalysisResult {
  barcode: string;
  productName?: string;
  truScore: number;
  breakdown: {
    Body: DetailedBreakdown;
    Planet: DetailedBreakdown;
    Care: DetailedBreakdown;
    Open: DetailedBreakdown;
  };
  productData: {
    nutriscore_grade?: string;
    ecoscore_grade?: string;
    nova_group?: number;
    additives_count: number;
    additives_tags?: string[];
    hasIngredients: boolean;
    ingredientsLength: number;
    hasPalmOil: boolean;
    certifications: string[];
    labels: string[];
    hasOrigin: boolean;
    recalls?: any[];
  };
  error?: string;
}

/**
 * Fetch product from Open Food Facts API directly (no React Native dependencies)
 */
async function fetchProductFromOFF(barcode: string): Promise<Product | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 0 || !data.product) {
      return null;
    }
    
    const product = data.product;
    
    // Convert OFF product to our Product format
    return {
      barcode: product.code || barcode,
      product_name: product.product_name || product.product_name_en || '',
      brands: product.brands || '',
      categories: product.categories || '',
      categories_tags: product.categories_tags || [],
      labels_tags: product.labels_tags || [],
      ingredients_text: product.ingredients_text || '',
      ingredients_analysis_tags: product.ingredients_analysis_tags || [],
      additives_tags: product.additives_tags || [],
      nutriscore_grade: product.nutriscore_grade,
      nutriscore_score: product.nutriscore_score,
      ecoscore_grade: product.ecoscore_grade,
      ecoscore_score: product.ecoscore_score,
      nova_group: product.nova_groups_tags?.[0] ? parseInt(product.nova_groups_tags[0].replace('en:', '')) : undefined,
      nutriments: product.nutriments || {},
      image_url: product.image_url || product.image_front_url || '',
      origins: product.origins || '',
      origins_tags: product.origins_tags || [],
      manufacturing_places: product.manufacturing_places || '',
      manufacturing_places_tags: product.manufacturing_places_tags || [],
      packagings: product.packagings || [],
      certifications: product.certifications_tags?.map((tag: string) => ({ name: tag.replace('en:', '') })) || [],
      source: 'openfoodfacts',
    } as Product;
  } catch (error) {
    console.error(`Error fetching product ${barcode}:`, error);
    return null;
  }
}

function calculateDetailedBreakdown(product: Product, result: any): AnalysisResult['breakdown'] {
  // Use the new modular pillar system for accurate breakdown
  const bodyResult = calculateBodyPillar(product);
  const planetResult = calculatePlanetPillar(product);
  const careResult = calculateCarePillar(product);
  const openResult = calculateOpenPillar(product);
  
  return {
    Body: {
      pillar: 'Body',
      base: bodyResult.base,
      adjustments: bodyResult.adjustments,
      final: bodyResult.score,
    },
    Planet: {
      pillar: 'Planet',
      base: planetResult.base,
      adjustments: planetResult.adjustments,
      final: planetResult.score,
    },
    Care: {
      pillar: 'Care',
      base: careResult.base,
      adjustments: careResult.adjustments,
      final: careResult.score,
    },
    Open: {
      pillar: 'Open',
      base: openResult.base,
      adjustments: openResult.adjustments,
      final: openResult.score,
    },
  };
}

// Legacy function - kept for reference but not used
function calculateDetailedBreakdownLegacy(product: Product, result: any): AnalysisResult['breakdown'] {
  const text = (product.ingredients_text || '').toLowerCase();
  const analysisTags = (product.ingredients_analysis_tags || []).filter((tag: unknown) => 
    typeof tag === 'string'
  ) as string[];
  const productLabels = (product.labels_tags || []).map((l: unknown) => 
    typeof l === 'string' ? l.toLowerCase() : ''
  ).filter(Boolean) as string[];
  const packagings = product.packagings || [];
  
  // Helper functions
  const hasTerm = (term: string): boolean => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(text);
  };
  const hasLabel = (pattern: string): boolean => {
    return productLabels.some((l: string) => l.includes(pattern.toLowerCase()));
  };
  
  // Body Pillar
  const bodyAdjustments: DetailedBreakdown['adjustments'] = [];
  let bodyBase = 15;
  
  if (product.nutriscore_grade) {
    const gradeMapping: Record<string, number> = { a: 25, b: 20, c: 15, d: 10, e: 5 };
    const gradeValue = gradeMapping[product.nutriscore_grade.toLowerCase()] || 15;
    bodyBase = gradeValue;
    bodyAdjustments.push({
      description: `Nutri-Score Grade ${product.nutriscore_grade.toUpperCase()}`,
      value: gradeValue,
      type: 'positive',
    });
  } else {
    bodyAdjustments.push({
      description: 'No Nutri-Score available (baseline)',
      value: 15,
      type: 'neutral',
    });
  }
  
  // Additive penalties (detailed calculation)
  const additivesCount = product.additives_tags?.length || 0;
  if (additivesCount > 0) {
    // Estimate based on typical penalties (safe: -0.5, caution: -1.5, avoid: -3)
    // Average assumption: -1.5 per additive, capped at 15
    const estimatedPenalty = Math.min(additivesCount * 1.5, 15);
    bodyAdjustments.push({
      description: `${additivesCount} additive(s) (estimated penalty: -1.5 each, capped at -15)`,
      value: -estimatedPenalty,
      type: 'negative',
    });
  }
  
  // Risky tags
  const riskyCount = analysisTags.filter((t: string) =>
    ['carcinogenic', 'endocrine', 'irritant', 'ewg-high-hazard'].some((x) =>
      t.toLowerCase().includes(x)
    )
  ).length;
  if (riskyCount > 0) {
    bodyAdjustments.push({
      description: `${riskyCount} risky tag(s) (carcinogenic, endocrine, irritant, EWG high-hazard)`,
      value: -riskyCount * 4,
      type: 'negative',
    });
  }
  
  // Irritants
  const IRRITANTS = ['paraben', 'phthalate', 'sulfate', 'triclosan', 'formaldehyde', 'peg', 'silicone', 'phenoxyethanol'];
  if (IRRITANTS.some((i) => hasTerm(i))) {
    bodyAdjustments.push({
      description: 'Contains irritants (paraben, phthalate, sulfate, etc.)',
      value: -10,
      type: 'negative',
    });
  }
  
  // Fragrance
  if (['parfum', 'fragrance', 'aroma'].some((a) => hasTerm(a))) {
    bodyAdjustments.push({
      description: 'Contains fragrance/parfum',
      value: -10,
      type: 'negative',
    });
  }
  
  // NOVA adjustments
  if (product.nova_group === 1) {
    bodyAdjustments.push({ description: 'NOVA Group 1 (unprocessed)', value: 3, type: 'positive' });
  } else if (product.nova_group === 3) {
    bodyAdjustments.push({ description: 'NOVA Group 3 (processed)', value: -3, type: 'negative' });
  } else if (product.nova_group === 4) {
    bodyAdjustments.push({ description: 'NOVA Group 4 (ultra-processed)', value: -8, type: 'negative' });
  }
  
  // Planet Pillar
  const planetAdjustments: DetailedBreakdown['adjustments'] = [];
  let planetBase = 15;
  
  if (product.ecoscore_grade) {
    const gradeMapping: Record<string, number> = { a: 25, b: 20, c: 15, d: 10, e: 5 };
    const gradeValue = gradeMapping[product.ecoscore_grade.toLowerCase()] || 15;
    planetBase = gradeValue;
    planetAdjustments.push({
      description: `Eco-Score Grade ${product.ecoscore_grade.toUpperCase()}`,
      value: gradeValue,
      type: 'positive',
    });
  } else {
    planetAdjustments.push({
      description: 'No Eco-Score available (baseline)',
      value: 15,
      type: 'neutral',
    });
  }
  
  // Palm oil
  const hasPalmOil = product.palm_oil_analysis?.containsPalmOil || 
                     product.ingredients_analysis_tags?.some(t => t.includes('palm-oil')) || false;
  const isCertifiedSustainable = product.palm_oil_analysis?.isCertifiedSustainable || false;
  if (hasPalmOil) {
    if (isCertifiedSustainable) {
      planetAdjustments.push({
        description: 'Contains palm oil (certified sustainable)',
        value: -5,
        type: 'negative',
      });
    } else {
      planetAdjustments.push({
        description: 'Contains palm oil (non-certified)',
        value: -8,
        type: 'negative',
      });
    }
  }
  
  // Recyclable packaging
  if (packagings.length > 0) {
    // Simplified: assume recyclable if packaging exists
    // Actual calculation uses getLocalRecyclabilityStatus
    planetAdjustments.push({
      description: `Recyclable packaging (${packagings.length} item(s))`,
      value: 5,
      type: 'positive',
    });
  }
  
  // Care Pillar
  const careAdjustments: DetailedBreakdown['adjustments'] = [];
  const careBase = 15;
  
  careAdjustments.push({
    description: 'Base score (assumes ethical until violations)',
    value: 15,
    type: 'neutral',
  });
  
  // Certifications
  const certifications = product.certifications?.map(c => c.name) || [];
  
  let certBonus = 0;
  if (productLabels.some(l => l.includes('fair-trade'))) {
    certBonus += 8;
    careAdjustments.push({ description: 'Fairtrade certification', value: 8, type: 'positive' });
  }
  if (productLabels.some(l => l.includes('organic'))) {
    certBonus += 7;
    careAdjustments.push({ description: 'Organic certification', value: 7, type: 'positive' });
  }
  if (productLabels.some(l => l.includes('rainforest-alliance'))) {
    certBonus += 6;
    careAdjustments.push({ description: 'Rainforest Alliance', value: 6, type: 'positive' });
  }
  
  // Recalls
  if (product.recalls && product.recalls.length > 0) {
    careAdjustments.push({
      description: 'Product recalls',
      value: -10,
      type: 'negative',
    });
  }
  
  // Open Pillar
  const openAdjustments: DetailedBreakdown['adjustments'] = [];
  const openBase = 15;
  
  openAdjustments.push({
    description: 'Base score (assumes transparent until hidden)',
    value: 15,
    type: 'neutral',
  });
  
  // Ingredients
  const ingredientsText = product.ingredients_text || '';
  const ingredientsLength = ingredientsText.trim().length;
  
  if (!ingredientsText || ingredientsLength === 0) {
    openAdjustments.push({
      description: 'No ingredients listed',
      value: -5,
      type: 'negative',
    });
  } else if (ingredientsLength >= 100) {
    openAdjustments.push({
      description: 'Full ingredients disclosure',
      value: 15,
      type: 'positive',
    });
  } else if (ingredientsLength >= 80) {
    openAdjustments.push({
      description: 'Partial ingredients disclosure (>80%)',
      value: 10,
      type: 'positive',
    });
  } else if (ingredientsLength >= 50) {
    openAdjustments.push({
      description: 'Partial ingredients disclosure (50-80%)',
      value: 5,
      type: 'positive',
    });
  }
  
  // Hidden terms
  const HIDDEN_TERMS = [
    'parfum', 'fragrance', 'aroma', 'flavor', 'flavour',
    'natural flavor', 'natural flavour', 'artificial flavor', 'artificial flavour',
    'natural flavoring', 'natural flavouring', 'artificial flavoring', 'artificial flavouring',
    'proprietary', 'proprietary blend',
  ];
  const hiddenCount = HIDDEN_TERMS.filter((t) => {
    const regex = new RegExp(`\\b${t}\\b`, 'i');
    return regex.test(ingredientsText);
  }).length;
  if (hiddenCount >= 3) {
    openAdjustments.push({
      description: `${hiddenCount} hidden ingredient term(s) (parfum, fragrance, aroma, flavor, proprietary, etc.)`,
      value: -20,
      type: 'negative',
    });
  } else if (hiddenCount >= 1) {
    openAdjustments.push({
      description: `${hiddenCount} hidden ingredient term(s) (parfum, fragrance, aroma, flavor, proprietary, etc.)`,
      value: -10,
      type: 'negative',
    });
  }
  
  // Sophistication bonus
  if (ingredientsLength > 0 && hiddenCount === 0) {
    const nova = product.nova_group;
    const isNOVA12 = nova === 1 || nova === 2;
    if (isNOVA12) {
      openAdjustments.push({
        description: 'Sophistication bonus (zero hidden ingredients + NOVA 1-2)',
        value: 5,
        type: 'positive',
      });
    }
  }
  
  // Origin
  const hasOrigin = !!(product.origins || product.manufacturing_places || 
                      (product.origins_tags && product.origins_tags.length > 0) ||
                      (product.manufacturing_places_tags && product.manufacturing_places_tags.length > 0));
  if (!hasOrigin) {
    openAdjustments.push({
      description: 'No origin information',
      value: -8,
      type: 'negative',
    });
  }
  
  return {
    Body: {
      pillar: 'Body',
      base: bodyBase,
      adjustments: bodyAdjustments,
      final: result.breakdown.Body,
    },
    Planet: {
      pillar: 'Planet',
      base: planetBase,
      adjustments: planetAdjustments,
      final: result.breakdown.Planet,
    },
    Care: {
      pillar: 'Care',
      base: careBase,
      adjustments: careAdjustments,
      final: result.breakdown.Care,
    },
    Open: {
      pillar: 'Open',
      base: openBase,
      adjustments: openAdjustments,
      final: result.breakdown.Open,
    },
  };
}

function printSection(title: string): void {
  console.log('\n' + '═'.repeat(70));
  console.log(`  ${title}`);
  console.log('═'.repeat(70) + '\n');
}

function printPillarBreakdown(pillar: DetailedBreakdown): void {
  const percentage = (pillar.final / 25) * 100;
  const color = percentage >= 80 ? '🟢' : percentage >= 60 ? '🟡' : percentage >= 40 ? '🟠' : '🔴';
  
  console.log(`${color} [${pillar.pillar} Pillar] Final Score: ${pillar.final}/25 (${percentage.toFixed(1)}%)`);
  console.log(`\n   Base Score: ${pillar.base}/25`);
  
  if (pillar.adjustments.length > 0) {
    console.log(`\n   Adjustments:`);
    
    const positives = pillar.adjustments.filter(a => a.type === 'positive');
    const negatives = pillar.adjustments.filter(a => a.type === 'negative');
    const neutrals = pillar.adjustments.filter(a => a.type === 'neutral');
    
    if (positives.length > 0) {
      console.log(`\n   ✅ Positive Points:`);
      positives.forEach(adj => {
        const sign = adj.value >= 0 ? '+' : '';
        console.log(`      ${sign}${adj.value.toFixed(1)}  ${adj.description}`);
      });
    }
    
    if (negatives.length > 0) {
      console.log(`\n   ❌ Negative Points:`);
      negatives.forEach(adj => {
        const sign = adj.value >= 0 ? '+' : '';
        console.log(`      ${sign}${adj.value.toFixed(1)}  ${adj.description}`);
      });
    }
    
    if (neutrals.length > 0) {
      console.log(`\n   ⚪ Baseline/Neutral:`);
      neutrals.forEach(adj => {
        console.log(`      ${adj.value.toFixed(1)}  ${adj.description}`);
      });
    }
    
    // Calculate total adjustment
    const totalAdjustment = pillar.adjustments.reduce((sum, adj) => {
      if (adj.type === 'positive') return sum + adj.value;
      if (adj.type === 'negative') return sum + adj.value;
      return sum;
    }, 0);
    
    console.log(`\n   Calculation: ${pillar.base} (base)`);
    if (totalAdjustment !== 0) {
      const sign = totalAdjustment >= 0 ? '+' : '';
      console.log(`                ${sign}${totalAdjustment.toFixed(1)} (adjustments)`);
    }
    console.log(`                = ${pillar.final.toFixed(1)} (capped at 0-25)`);
  }
  
  console.log('');
}

async function analyzeBarcode(barcode: string): Promise<AnalysisResult> {
  try {
    console.log(`📊 Fetching product: ${barcode}...`);
    
    const product = await fetchProductFromOFF(barcode);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    console.log(`✅ Product found: ${product.product_name || 'Unknown'}\n`);
    
    // Calculate TruScore
    const result = calculateTruScore(product);
    
    // Calculate detailed breakdown
    const breakdown = calculateDetailedBreakdown(product, result);
    
    return {
      barcode,
      productName: product.product_name,
      truScore: result.truscore,
      breakdown,
      productData: {
        nutriscore_grade: product.nutriscore_grade,
        ecoscore_grade: product.ecoscore_grade,
        nova_group: product.nova_group,
        additives_count: product.additives_tags?.length || 0,
        additives_tags: product.additives_tags,
        hasIngredients: !!product.ingredients_text,
        ingredientsLength: product.ingredients_text?.length || 0,
        hasPalmOil: product.ingredients_analysis_tags?.some(t => t.includes('palm-oil')) || false,
        certifications: product.certifications?.map(c => c.name) || [],
        labels: product.labels_tags || [],
        hasOrigin: result.hasOrigin || false,
        recalls: product.recalls,
      },
    };
  } catch (error) {
    return {
      barcode,
      error: error instanceof Error ? error.message : String(error),
      truScore: 0,
      breakdown: {
        Body: { pillar: 'Body', base: 0, adjustments: [], final: 0 },
        Planet: { pillar: 'Planet', base: 0, adjustments: [], final: 0 },
        Care: { pillar: 'Care', base: 0, adjustments: [], final: 0 },
        Open: { pillar: 'Open', base: 0, adjustments: [], final: 0 },
      },
      productData: {
        additives_count: 0,
        hasIngredients: false,
        ingredientsLength: 0,
        hasPalmOil: false,
        certifications: [],
        labels: [],
        hasOrigin: false,
      },
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  let barcodes: string[] = [];
  
  // Parse arguments
  if (args.includes('--file')) {
    const fileIndex = args.indexOf('--file');
    const filePath = args[fileIndex + 1];
    if (filePath && fs.existsSync(filePath)) {
      barcodes = fs.readFileSync(filePath, 'utf8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    } else {
      console.error('❌ File not found:', filePath);
      process.exit(1);
    }
  } else if (args.includes('--barcodes')) {
    const barcodesIndex = args.indexOf('--barcodes');
    const barcodesStr = args[barcodesIndex + 1];
    barcodes = barcodesStr.split(',').map(b => b.trim());
  } else {
    // Use remaining args as barcodes
    barcodes = args.filter(arg => !arg.startsWith('--'));
  }
  
  if (barcodes.length === 0) {
    console.log('Usage:');
    console.log('  npm run analyze-truscore -- 9420020300194 1234567890123');
    console.log('  npm run analyze-truscore -- --file barcodes.txt');
    console.log('  npm run analyze-truscore -- --barcodes 9420020300194,1234567890123');
    process.exit(1);
  }
  
  printSection('TruScore Detailed Analysis');
  console.log(`Analyzing ${barcodes.length} barcode(s)...\n`);
  
  const results: AnalysisResult[] = [];
  
  for (const barcode of barcodes) {
    printSection(`Barcode: ${barcode}`);
    
    const result = await analyzeBarcode(barcode);
    results.push(result);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}\n`);
      continue;
    }
    
    console.log(`📦 Product: ${result.productName || 'Unknown'}`);
    console.log(`\n🎯 TruScore: ${result.truScore}/100\n`);
    
    // Print detailed breakdown for each pillar
    printPillarBreakdown(result.breakdown.Body);
    printPillarBreakdown(result.breakdown.Planet);
    printPillarBreakdown(result.breakdown.Care);
    printPillarBreakdown(result.breakdown.Open);
    
    // Product data summary
    console.log('📋 Product Data Summary:');
    console.log(`   Nutri-Score: ${result.productData.nutriscore_grade || 'N/A'}`);
    console.log(`   Eco-Score: ${result.productData.ecoscore_grade || 'N/A'}`);
    console.log(`   NOVA Group: ${result.productData.nova_group || 'N/A'}`);
    console.log(`   Additives: ${result.productData.additives_count}`);
    console.log(`   Ingredients: ${result.productData.hasIngredients ? `${result.productData.ingredientsLength} chars` : 'Not available'}`);
    console.log(`   Palm Oil: ${result.productData.hasPalmOil ? 'Yes' : 'No'}`);
    console.log(`   Certifications: ${result.productData.certifications.length > 0 ? result.productData.certifications.join(', ') : 'None'}`);
    console.log(`   Origin: ${result.productData.hasOrigin ? 'Available' : 'Not available'}`);
    console.log(`   Recalls: ${result.productData.recalls?.length || 0}\n`);
  }
  
  // Summary
  printSection('Summary');
  const successful = results.filter(r => !r.error);
  const avgScore = successful.length > 0 
    ? successful.reduce((sum, r) => sum + r.truScore, 0) / successful.length 
    : 0;
  
  console.log(`Analyzed: ${successful.length}/${barcodes.length} successful`);
  console.log(`Average TruScore: ${avgScore.toFixed(1)}/100\n`);
  
  // Save results to JSON
  const outputFile = `truscore-analysis-${Date.now()}.json`;
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
  console.log(`📄 Results saved to: ${outputFile}\n`);
}

if (require.main === module) {
  main().catch(console.error);
}

export { analyzeBarcode };
export type { AnalysisResult };

