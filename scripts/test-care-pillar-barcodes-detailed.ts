/**
 * Detailed CARE Pillar Test - Uses Actual Brand Database
 * Tests barcodes and identifies products with adjusted CARE scores
 */

import * as fs from 'fs';
import * as path from 'path';

// Import actual brand database and services
// Note: We'll need to adapt this for Node.js environment
const { getBrandData, hasRecallHistory } = require('../src/data/brandDatabase');
const { checkAnimalCruelty, hasHighImpactAnimalCruelty } = require('../src/services/animalCrueltyService');
const { checkLaborViolations, hasHighImpactLaborViolations } = require('../src/services/laborViolationsService');

interface Product {
  barcode?: string;
  product_name?: string;
  product_name_en?: string;
  labels_tags?: string[];
  brands?: string;
  brand_owner?: string;
  brands_tags?: string[];
  recalls?: Array<{
    recallId?: string;
    productName?: string;
    brand?: string;
    reason?: string;
    recallDate?: string;
    isActive?: boolean;
  }>;
  [key: string]: any;
}

// Calculate CARE pillar score using actual implementation logic
function calculateCarePillarScore(product: Product): {
  score: number;
  base: number;
  adjustments: Array<{ description: string; value: number; type: string; source: string }>;
  details: {
    certificationBonus: number;
    animalCrueltyPenalty: number;
    laborViolationPenalty: number;
    recallPenalty: number;
    brandOverlayPenalty: number;
  };
  dataSources: {
    labelsTags: { available: boolean; count: number; source: string };
    brands: { available: boolean; value: string; source: string };
    brandOwner: { available: boolean; value: string; source: string };
    recalls: { available: boolean; count: number; source: string };
    brandDatabase: { available: boolean; found: boolean; brandName: string; source: string };
  };
} {
  const adjustments: Array<{ description: string; value: number; type: string; source: string }> = [];
  let score = 15; // Base score
  const base = 15;
  
  const labels = (product.labels_tags || []).map((l: unknown) => 
    typeof l === 'string' ? l.toLowerCase() : ''
  ).filter(Boolean) as string[];
  const brands = (product.brands || '').toLowerCase();
  const brandName = brands.split(',')[0]?.trim() || '';
  
  // Track data sources
  const dataSources = {
    labelsTags: {
      available: labels.length > 0,
      count: labels.length,
      source: labels.length > 0 ? 'Open Food Facts (labels_tags)' : 'Not available',
    },
    brands: {
      available: !!brands,
      value: brands || 'N/A',
      source: brands ? 'Open Food Facts (brands)' : 'Not available',
    },
    brandOwner: {
      available: !!product.brand_owner,
      value: product.brand_owner || 'N/A',
      source: product.brand_owner ? 'Open Food Facts (brand_owner)' : 'Not available',
    },
    recalls: {
      available: (product.recalls?.length || 0) > 0,
      count: product.recalls?.length || 0,
      source: (product.recalls?.length || 0) > 0 ? 'Recalls API (FDA/CFIA/RASFF)' : 'Not fetched or no recalls',
    },
    brandDatabase: {
      available: true, // Brand database is always available (in-memory)
      found: false,
      brandName: brandName || 'N/A',
      source: 'In-memory brand database',
    },
  };
  
  // Helper: label matching
  const hasLabel = (pattern: string): boolean => {
    return labels.some((l: string) => l.includes(pattern.toLowerCase()));
  };
  
  // Certification bonuses (stacked, cap +15)
  let certificationBonus = 0;
  
  if (hasLabel('fair-trade')) {
    certificationBonus += 8;
    adjustments.push({
      description: 'Fairtrade certification',
      value: 8,
      type: 'positive',
      source: 'Open Food Facts (labels_tags: en:fair-trade)',
    });
  }
  
  // Regional Organic certifications
  const organicLabels = labels.filter((l: string) => 
    l.toLowerCase().includes('organic') || 
    l.toLowerCase().includes('usda-organic') ||
    l.toLowerCase().includes('eu-organic') ||
    l.toLowerCase().includes('bio') ||
    l.toLowerCase().includes('ecocert') ||
    l.toLowerCase().includes('aco-certified-organic')
  );
  if (organicLabels.length > 0) {
    certificationBonus += 7;
    adjustments.push({
      description: 'Organic certification',
      value: 7,
      type: 'positive',
      source: `Open Food Facts (labels_tags: ${organicLabels.join(', ')})`,
    });
  }
  
  if (hasLabel('rainforest-alliance')) {
    certificationBonus += 6;
    adjustments.push({
      description: 'Rainforest Alliance certification',
      value: 6,
      type: 'positive',
      source: 'Open Food Facts (labels_tags: en:rainforest-alliance)',
    });
  }
  
  if (hasLabel('utz')) {
    certificationBonus += 6;
    adjustments.push({
      description: 'UTZ certification',
      value: 6,
      type: 'positive',
      source: 'Open Food Facts (labels_tags: en:utz)',
    });
  }
  
  if (labels.some((l: string) => ['en:msc', 'en:asc', 'en:dolphin-safe'].includes(l))) {
    certificationBonus += 6;
    adjustments.push({
      description: 'MSC/ASC/Dolphin-Safe certification',
      value: 6,
      type: 'positive',
      source: 'Open Food Facts (labels_tags: MSC/ASC)',
    });
  }
  
  if (hasLabel('rspo') || hasLabel('roundtable-on-sustainable-palm-oil')) {
    certificationBonus += 6;
    adjustments.push({
      description: 'RSPO certification',
      value: 6,
      type: 'positive',
      source: 'Open Food Facts (labels_tags: RSPO)',
    });
  }
  
  if (hasLabel('rspca')) {
    certificationBonus += 5;
    adjustments.push({
      description: 'RSPCA certification',
      value: 5,
      type: 'positive',
      source: 'Open Food Facts (labels_tags: en:rspca)',
    });
  }
  
  if (hasLabel('leaping-bunny') || hasLabel('cruelty-free')) {
    certificationBonus += 5;
    adjustments.push({
      description: 'Leaping Bunny certification',
      value: 5,
      type: 'positive',
      source: 'Open Food Facts (labels_tags: leaping-bunny/cruelty-free)',
    });
  }
  
  if (labels.some((l: string) => l.toLowerCase().includes('b-corp') || l.toLowerCase().includes('bcorp'))) {
    certificationBonus += 5;
    adjustments.push({
      description: 'B-Corp certification',
      value: 5,
      type: 'positive',
      source: 'Open Food Facts (labels_tags: b-corp)',
    });
  }
  
  if (labels.some((l: string) => 
    l.toLowerCase().includes('cage-free') || 
    l.toLowerCase().includes('free-range')
  )) {
    certificationBonus += 4;
    adjustments.push({
      description: 'Cage-Free/Free-Range',
      value: 4,
      type: 'positive',
      source: 'Open Food Facts (labels_tags: cage-free/free-range)',
    });
  }
  
  // Apply certification bonus with stack cap of +15
  const cappedCertBonus = Math.min(certificationBonus, 15);
  if (cappedCertBonus > 0) {
    score += cappedCertBonus;
  }
  
  // Animal Cruelty penalties - use actual service
  let animalCrueltyPenalty = 0;
  if (brandName) {
    try {
      const animalCrueltyData = checkAnimalCruelty(product);
      if (animalCrueltyData.hasViolations) {
        if (animalCrueltyData.violationType === 'major') {
          animalCrueltyPenalty = 15;
          adjustments.push({
            description: 'Major animal cruelty violation',
            value: -animalCrueltyPenalty,
            type: 'negative',
            source: `Brand database (${animalCrueltyData.sources.join(', ')})`,
          });
          score -= animalCrueltyPenalty;
          dataSources.brandDatabase.found = true;
        } else if (animalCrueltyData.violationType === 'minor') {
          animalCrueltyPenalty = 5;
          adjustments.push({
            description: 'Minor animal cruelty violation',
            value: -animalCrueltyPenalty,
            type: 'negative',
            source: `Brand database (${animalCrueltyData.sources.join(', ')})`,
          });
          score -= animalCrueltyPenalty;
          dataSources.brandDatabase.found = true;
        }
      }
    } catch (error) {
      // Service error - skip
    }
  }
  
  // Labor Violations penalties - use actual service
  let laborViolationPenalty = 0;
  if (brandName) {
    try {
      const laborViolationData = checkLaborViolations(product);
      if (laborViolationData.hasViolations) {
        if (laborViolationData.violationType === 'major') {
          laborViolationPenalty = 15;
          adjustments.push({
            description: 'Major labor violation',
            value: -laborViolationPenalty,
            type: 'negative',
            source: `Brand database (${laborViolationData.sources.join(', ')})`,
          });
          score -= laborViolationPenalty;
          dataSources.brandDatabase.found = true;
        } else if (laborViolationData.violationType === 'minor') {
          laborViolationPenalty = 5;
          adjustments.push({
            description: 'Minor labor violation',
            value: -laborViolationPenalty,
            type: 'negative',
            source: `Brand database (${laborViolationData.sources.join(', ')})`,
          });
          score -= laborViolationPenalty;
          dataSources.brandDatabase.found = true;
        }
      }
    } catch (error) {
      // Service error - skip
    }
  }
  
  // Recalls penalty (within last 12 months)
  let recallPenalty = 0;
  let productHasRecallHistory = false;
  
  if (product.recalls && Array.isArray(product.recalls) && product.recalls.length > 0) {
    const now = Date.now();
    const twelveMonthsAgo = now - (12 * 30 * 24 * 60 * 60 * 1000);
    
    const recentRecalls = product.recalls.filter(recall => {
      if (!recall.isActive) return false;
      const recallDate = new Date(recall.recallDate || '').getTime();
      return recallDate >= twelveMonthsAgo;
    });
    
    if (recentRecalls.length > 0) {
      recallPenalty = 10;
      productHasRecallHistory = true;
      adjustments.push({
        description: `Product recalls (${recentRecalls.length} active recall(s) within last 12 months)`,
        value: -recallPenalty,
        type: 'negative',
        source: 'Recalls API (FDA/CFIA/RASFF)',
      });
      score -= recallPenalty;
    } else {
      productHasRecallHistory = product.recalls.length > 0;
    }
  }
  
  // Brand overlay penalty
  let brandOverlayPenalty = 0;
  if (brandName) {
    try {
      const brandData = getBrandData(brandName);
      const parentCompany = brandData?.parentCompany || product.brand_owner;
      
      if (brandData) {
        dataSources.brandDatabase.found = true;
      }
      
      const hasHighImpactAnimal = hasHighImpactAnimalCruelty(brandName) || 
        (parentCompany && hasHighImpactAnimalCruelty(parentCompany));
      const hasHighImpactLabor = hasHighImpactLaborViolations(brandName) || 
        (parentCompany && hasHighImpactLaborViolations(parentCompany));
      const hasBrandRecallHistory = productHasRecallHistory || 
        (brandName ? hasRecallHistory(brandName) : false) ||
        (parentCompany ? hasRecallHistory(parentCompany) : false);
      
      if (hasHighImpactAnimal || hasHighImpactLabor || hasBrandRecallHistory) {
        brandOverlayPenalty = 3;
        const reasons: string[] = [];
        if (hasHighImpactAnimal) reasons.push('animal cruelty');
        if (hasHighImpactLabor) reasons.push('labor violations');
        if (hasBrandRecallHistory) reasons.push('recall history');
        
        adjustments.push({
          description: `Brand/parent high-impact overlay (${reasons.join(', ')})`,
          value: -brandOverlayPenalty,
          type: 'negative',
          source: 'Brand database (high-impact brand/parent)',
        });
        score -= brandOverlayPenalty;
      }
    } catch (error) {
      // Service error - skip
    }
  }
  
  // Cap at 0-25
  score = Math.max(0, Math.min(25, Math.round(score)));
  
  return {
    score,
    base,
    adjustments,
    details: {
      certificationBonus: cappedCertBonus,
      animalCrueltyPenalty,
      laborViolationPenalty,
      recallPenalty,
      brandOverlayPenalty,
    },
    dataSources,
  };
}

// Fetch product data
async function fetchProduct(barcode: string): Promise<Product | null> {
  try {
    const offUrl = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const offResponse = await fetch(offUrl, {
      headers: { 'User-Agent': 'TrueScan-FoodScanner/1.0' }
    });
    
    if (offResponse.ok) {
      const offData = await offResponse.json();
      if (offData.product) {
        return { ...offData.product, barcode, source: 'openfoodfacts' } as Product;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Main analysis function
async function analyzeBarcodes(barcodes: string[]) {
  const results: Array<{
    barcode: string;
    productName: string;
    careScore: number;
    isDefault: boolean;
    adjustments: Array<{ description: string; value: number; type: string; source: string }>;
    dataSources: any;
    details: any;
  }> = [];
  
  console.log(`Analyzing ${barcodes.length} barcodes for CARE pillar scores...\n`);
  console.log('='.repeat(100));
  
  for (let i = 0; i < barcodes.length; i++) {
    const barcode = barcodes[i];
    console.log(`[${i + 1}/${barcodes.length}] Processing: ${barcode}`);
    
    const product = await fetchProduct(barcode);
    
    if (!product) {
      console.log(`  ⚠️  Product not found\n`);
      results.push({
        barcode,
        productName: 'NOT FOUND',
        careScore: 15,
        isDefault: true,
        adjustments: [],
        dataSources: {},
        details: {},
      });
      continue;
    }
    
    const productName = product.product_name || product.product_name_en || 'Unknown';
    const careResult = calculateCarePillarScore(product);
    const isDefault = careResult.score === 15;
    
    console.log(`  Product: ${productName.substring(0, 60)}...`);
    console.log(`  Brands: ${product.brands || 'N/A'}`);
    console.log(`  CARE Score: ${careResult.score}/25 ${isDefault ? '(DEFAULT)' : '(ADJUSTED)'}`);
    
    if (!isDefault) {
      console.log(`  Adjustments:`);
      careResult.adjustments.forEach(adj => {
        const sign = adj.value > 0 ? '+' : '';
        console.log(`    ${sign}${adj.value}: ${adj.description} [${adj.source}]`);
      });
    }
    console.log('');
    
    results.push({
      barcode,
      productName,
      careScore: careResult.score,
      isDefault,
      adjustments: careResult.adjustments,
      dataSources: careResult.dataSources,
      details: careResult.details,
    });
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

// Generate detailed report
function generateReport(results: any[]) {
  const report: string[] = [];
  
  report.push('='.repeat(100));
  report.push('CARE PILLAR SCORE ANALYSIS REPORT - DETAILED');
  report.push('='.repeat(100));
  report.push('');
  report.push(`Analysis Date: ${new Date().toISOString()}`);
  report.push(`Total Products Analyzed: ${results.length}`);
  report.push('');
  
  // Filter products with non-default scores
  const adjustedProducts = results.filter(r => !r.isDefault && r.careScore !== 15);
  const defaultProducts = results.filter(r => r.isDefault || r.careScore === 15);
  
  report.push('EXECUTIVE SUMMARY');
  report.push('-'.repeat(100));
  report.push(`Products with Adjusted CARE Scores: ${adjustedProducts.length} (${((adjustedProducts.length / results.length) * 100).toFixed(1)}%)`);
  report.push(`Products with Default CARE Score (15): ${defaultProducts.length} (${((defaultProducts.length / results.length) * 100).toFixed(1)}%)`);
  report.push('');
  
  // Score distribution
  const scoreDistribution: Record<number, number> = {};
  results.forEach(r => {
    scoreDistribution[r.careScore] = (scoreDistribution[r.careScore] || 0) + 1;
  });
  
  report.push('CARE Score Distribution:');
  Object.entries(scoreDistribution).sort((a, b) => Number(b[0]) - Number(a[0])).forEach(([score, count]) => {
    report.push(`  ${score}/25: ${count} product(s)`);
  });
  report.push('');
  
  // Detailed analysis of adjusted products
  report.push('='.repeat(100));
  report.push('PRODUCTS WITH ADJUSTED CARE SCORES (Non-Default)');
  report.push('='.repeat(100));
  report.push('');
  
  if (adjustedProducts.length === 0) {
    report.push('No products found with adjusted CARE scores.');
    report.push('All products scored the default 15 points.');
  } else {
    adjustedProducts.forEach((result, index) => {
      report.push(`${index + 1}. Barcode: ${result.barcode}`);
      report.push(`   Product: ${result.productName}`);
      report.push(`   CARE Score: ${result.careScore}/25 (Base: 15, Net Change: ${result.careScore > 15 ? '+' : ''}${result.careScore - 15})`);
      report.push(`   `);
      report.push(`   Score Breakdown:`);
      report.push(`     Base Score: 15`);
      report.push(`     Certification Bonus: +${result.details.certificationBonus}`);
      report.push(`     Animal Cruelty Penalty: -${result.details.animalCrueltyPenalty}`);
      report.push(`     Labor Violation Penalty: -${result.details.laborViolationPenalty}`);
      report.push(`     Recall Penalty: -${result.details.recallPenalty}`);
      report.push(`     Brand Overlay Penalty: -${result.details.brandOverlayPenalty}`);
      report.push(`   `);
      report.push(`   Adjustments Applied (with Database Sources):`);
      result.adjustments.forEach(adj => {
        const sign = adj.value > 0 ? '+' : '';
        report.push(`     ${sign}${adj.value}: ${adj.description}`);
        report.push(`       Source: ${adj.source}`);
      });
      report.push(`   `);
      report.push(`   Data Sources Used:`);
      report.push(`     - Labels Tags: ${result.dataSources.labelsTags.available ? 'YES' : 'NO'} (${result.dataSources.labelsTags.source})`);
      if (result.dataSources.labelsTags.available) {
        report.push(`       Count: ${result.dataSources.labelsTags.count} tags`);
      }
      report.push(`     - Brands: ${result.dataSources.brands.available ? 'YES' : 'NO'} (${result.dataSources.brands.source})`);
      if (result.dataSources.brands.available) {
        report.push(`       Value: "${result.dataSources.brands.value}"`);
      }
      report.push(`     - Brand Owner: ${result.dataSources.brandOwner.available ? 'YES' : 'NO'} (${result.dataSources.brandOwner.source})`);
      if (result.dataSources.brandOwner.available) {
        report.push(`       Value: "${result.dataSources.brandOwner.value}"`);
      }
      report.push(`     - Recalls: ${result.dataSources.recalls.available ? 'YES' : 'NO'} (${result.dataSources.recalls.source})`);
      if (result.dataSources.recalls.available) {
        report.push(`       Count: ${result.dataSources.recalls.count} recall(s)`);
      }
      report.push(`     - Brand Database: ${result.dataSources.brandDatabase.found ? 'FOUND' : 'NOT FOUND'} (${result.dataSources.brandDatabase.source})`);
      if (result.dataSources.brandDatabase.found) {
        report.push(`       Brand: "${result.dataSources.brandDatabase.brandName}"`);
      }
      report.push('');
    });
  }
  
  report.push('='.repeat(100));
  report.push('PRODUCTS WITH DEFAULT CARE SCORE (15)');
  report.push('='.repeat(100));
  report.push('');
  report.push(`Total: ${defaultProducts.length} products`);
  report.push('');
  report.push('These products scored the default 15 points because:');
  report.push('  - No certifications found in labels_tags (from Open Food Facts)');
  report.push('  - No animal cruelty violations detected (brand not in database or no violations)');
  report.push('  - No labor violations detected (brand not in database or no violations)');
  report.push('  - No recalls found or recalls not fetched (from Recalls API)');
  report.push('  - No brand overlay penalties applied (from brand database)');
  report.push('');
  
  return report.join('\n');
}

// Main execution
async function main() {
  const barcodes = [
    '894700010137',
    '9310354982466',
    '9300694335947',
    '9316417008890',
    '9310036039655',
    '5449000000996',
    '9310272002253',
    '9300675016902',
    '611269991000',
    '9341650001766',
    '9300650022898',
    '7622300992675',
    '793579769781',
    '9326666610553',
    '9310055105850',
    '9310055105904',
    '9300652014396',
    '9300652010794',
    '9300677006437',
    '9313010000801',
    '13000006408',
    '9310061462206',
    '9310061550101',
    '3017620422003',
    '9313958005890',
    '9310412003577',
    '9310047207180',
    '9343787099105',
    '9343787099104',
    '9310653105733',
    '9310354890006',
    '9300830060733',
    '9310988022378',
    '40000511281',
    '40000422068',
    '44000032210',
    '38000845017',
    '9310645350899',
    '8355030495',
    '9310645176833',
    '9342373000296',
    '9357107000251',
    '9320802000482',
    '9342373000395',
    '931839007104',
    '9315090200102',
    '9311208001241',
    '58449450023',
    '9310155305037',
    '9310060011030',
    '9315822010863',
    '5052675000989',
    '42272005024',
    '93100062212972',
    '9310645244846',
    '75919000069',
    '9317241301409',
    '803678000095',
    '9310645442532',
    '9340860006547',
    '9310645467740',
  ];
  
  // Remove duplicates
  const uniqueBarcodes = Array.from(new Set(barcodes));
  
  const results = await analyzeBarcodes(uniqueBarcodes);
  const report = generateReport(results);
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'TruScore logic', 'care-pillar-barcode-analysis-detailed.txt');
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log('\n' + '='.repeat(100));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(100));
  console.log(`Report saved to: ${reportPath}`);
  console.log('\n' + report);
}

main().catch(console.error);
