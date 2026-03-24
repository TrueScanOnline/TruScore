/**
 * Individual Pillar Analysis Script
 * 
 * Analyzes a single pillar calculation for a barcode
 * 
 * Usage:
 *   npm run analyze-pillar -- body 9420020300194
 *   npm run analyze-pillar -- planet 9310055105850
 *   npm run analyze-pillar -- ethics 9310055105850
 *   npm run analyze-pillar -- open 9310055105850
 */

/// <reference path="../global.d.ts" />

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
import { calculateBodyPillar } from '../src/lib/truscoreEngine/pillars/bodyPillar';
import { calculatePlanetPillar } from '../src/lib/truscoreEngine/pillars/planetPillar';
import { calculateEthicsPillar } from '../src/lib/truscoreEngine/pillars/ethicsPillar';
import { calculateOpenPillar } from '../src/lib/truscoreEngine/pillars/openPillar';

type PillarType = 'body' | 'planet' | 'ethics' | 'open';

/**
 * Fetch product from Open Food Facts API directly
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

function printSection(title: string): void {
  console.log('\n' + '═'.repeat(70));
  console.log(`  ${title}`);
  console.log('═'.repeat(70) + '\n');
}

function printPillarResult(pillar: string, result: any): void {
  const percentage = (result.score / 25) * 100;
  const color = percentage >= 80 ? '🟢' : percentage >= 60 ? '🟡' : percentage >= 40 ? '🟠' : '🔴';
  
  console.log(`${color} [${pillar.toUpperCase()} Pillar] Final Score: ${result.score}/25 (${percentage.toFixed(1)}%)`);
  console.log(`\n   Base Score: ${result.base}/25`);
  
  if (result.adjustments.length > 0) {
    console.log(`\n   Adjustments:`);
    
    const positives = result.adjustments.filter((a: any) => a.type === 'positive');
    const negatives = result.adjustments.filter((a: any) => a.type === 'negative');
    const neutrals = result.adjustments.filter((a: any) => a.type === 'neutral');
    
    if (positives.length > 0) {
      console.log(`\n   ✅ Positive Points:`);
      positives.forEach((adj: any) => {
        const sign = adj.value >= 0 ? '+' : '';
        console.log(`      ${sign}${adj.value.toFixed(1)}  ${adj.description}`);
      });
    }
    
    if (negatives.length > 0) {
      console.log(`\n   ❌ Negative Points:`);
      negatives.forEach((adj: any) => {
        const sign = adj.value >= 0 ? '+' : '';
        console.log(`      ${sign}${adj.value.toFixed(1)}  ${adj.description}`);
      });
    }
    
    if (neutrals.length > 0) {
      console.log(`\n   ⚪ Baseline/Neutral:`);
      neutrals.forEach((adj: any) => {
        console.log(`      ${adj.value.toFixed(1)}  ${adj.description}`);
      });
    }
    
    // Calculate total adjustment
    const totalAdjustment = result.adjustments.reduce((sum: number, adj: any) => {
      return sum + adj.value;
    }, 0);
    
    console.log(`\n   Calculation: ${result.base} (base)`);
    if (totalAdjustment !== 0) {
      const sign = totalAdjustment >= 0 ? '+' : '';
      console.log(`                ${sign}${totalAdjustment.toFixed(1)} (adjustments)`);
    }
    console.log(`                = ${result.score.toFixed(1)} (capped at 0-25)`);
  }
  
  // Print details
  console.log(`\n   Details:`);
  Object.entries(result.details).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== 0) {
      console.log(`      ${key}: ${value}`);
    }
  });
  
  console.log('');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage:');
    console.log('  npm run analyze-pillar -- body 9420020300194');
    console.log('  npm run analyze-pillar -- planet 9310055105850');
    console.log('  npm run analyze-pillar -- ethics 9310055105850');
    console.log('  npm run analyze-pillar -- open 9310055105850');
    process.exit(1);
  }
  
  const pillarType = args[0].toLowerCase() as PillarType;
  const barcode = args[1];
  
  if (!['body', 'planet', 'ethics', 'open'].includes(pillarType)) {
    console.error(`❌ Invalid pillar type: ${pillarType}`);
    console.error('Valid types: body, planet, ethics, open');
    process.exit(1);
  }
  
  printSection(`${pillarType.toUpperCase()} Pillar Analysis`);
  console.log(`Barcode: ${barcode}\n`);
  
  try {
    console.log(`📊 Fetching product: ${barcode}...`);
    const product = await fetchProductFromOFF(barcode);
    
    if (!product) {
      console.error(`❌ Product not found: ${barcode}`);
      process.exit(1);
    }
    
    console.log(`✅ Product found: ${product.product_name || 'Unknown'}\n`);
    
    let result: any;
    switch (pillarType) {
      case 'body':
        result = calculateBodyPillar(product);
        break;
      case 'planet':
        result = calculatePlanetPillar(product);
        break;
      case 'ethics':
        result = calculateEthicsPillar(product);
        break;
      case 'open':
        result = calculateOpenPillar(product);
        break;
    }
    
    printPillarResult(pillarType, result);
    
    // Save result to JSON
    const outputFile = `pillar-analysis-${pillarType}-${barcode}-${Date.now()}.json`;
    require('fs').writeFileSync(outputFile, JSON.stringify({
      pillar: pillarType,
      barcode,
      productName: product.product_name,
      result,
    }, null, 2));
    console.log(`📄 Results saved to: ${outputFile}\n`);
    
  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

