/**
 * Detailed CARE Pillar Test - Uses Actual Implementation Logic
 * Tests barcodes and provides detailed breakdown of score adjustments
 */

import * as fs from 'fs';
import * as path from 'path';

// Import actual brand database and services
// We'll need to create a simplified version that works in Node.js

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

// Simplified brand database lookup (matches actual implementation)
const KNOWN_CRUEL_BRANDS = new Set([
  'unilever', 'procter & gamble', 'p&g', 'procter and gamble',
  'l\'oreal', 'loreal', 'estee lauder', 'estée lauder',
  'colgate-palmolive', 'colgate', 'johnson & johnson', 'j&j',
  'reckitt', 'reckitt benckiser', 'rb', 'henkel', 'beiersdorf',
  'shiseido', 'kao', 'sc johnson', 'clorox', 'church & dwight',
  'coty', 'revlon', 'avon', 'mary kay', 'amway',
]);

const KNOWN_LABOR_VIOLATION_BRANDS = new Set([
  'nestle', 'nestlé', 'mars', 'hershey', 'ferrero', 'mondelez',
  'lindt', 'godiva', 'ghirardelli', 'cadbury',
]);

function normalizeBrandName(brand: string): string {
  if (!brand || typeof brand !== 'string') {
    return '';
  }
  
  return brand
    .toLowerCase()
    .trim()
    .replace(/[.,;:!?'"()\[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b&\b/g, 'and')
    .replace(/\bp&g\b/g, 'procter and gamble')
    .replace(/\bj&j\b/g, 'johnson and johnson')
    .replace(/\binc\b/g, '')
    .replace(/\bllc\b/g, '')
    .replace(/\bltd\b/g, '')
    .replace(/\bcorp\b/g, '')
    .replace(/\bco\b/g, '')
    .trim();
}

function checkBrandForViolations(brandName: string): {
  hasAnimalCruelty: boolean;
  hasLaborViolations: boolean;
  brandMatched: string | null;
} {
  if (!brandName) {
    return { hasAnimalCruelty: false, hasLaborViolations: false, brandMatched: null };
  }
  
  const normalized = normalizeBrandName(brandName);
  const brandParts = normalized.split(',').map(b => b.trim()).filter(Boolean);
  
  // Check first brand (primary brand)
  const primaryBrand = brandParts[0] || normalized;
  
  // Check for animal cruelty
  let hasAnimalCruelty = false;
  let hasLaborViolations = false;
  let brandMatched: string | null = null;
  
  for (const cruelBrand of KNOWN_CRUEL_BRANDS) {
    if (primaryBrand.includes(cruelBrand) || cruelBrand.includes(primaryBrand)) {
      hasAnimalCruelty = true;
      brandMatched = cruelBrand;
      break;
    }
  }
  
  // Check for labor violations
  for (const laborBrand of KNOWN_LABOR_VIOLATION_BRANDS) {
    if (primaryBrand.includes(laborBrand) || laborBrand.includes(primaryBrand)) {
      hasLaborViolations = true;
      if (!brandMatched) brandMatched = laborBrand;
      break;
    }
  }
  
  return { hasAnimalCruelty, hasLaborViolations, brandMatched };
}

// Calculate CARE pillar score with detailed breakdown
function calculateCarePillarDetailed(product: Product): {
  score: number;
  base: number;
  adjustments: Array<{
    description: string;
    value: number;
    type: string;
    dataSource: string;
    dataAvailable: boolean;
  }>;
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
    brandDatabase: { available: boolean; matched: boolean; brandMatched: string | null; source: string };
  };
} {
  const adjustments: Array<{
    description: string;
    value: number;
    type: string;
    dataSource: string;
    dataAvailable: boolean;
  }> = [];
  let score = 15;
  const base = 15;
  
  const labels = (product.labels_tags || []).map((l: unknown) => 
    typeof l === 'string' ? l.toLowerCase() : ''
  ).filter(Boolean) as string[];
  const brands = product.brands || '';
  const brandOwner = product.brand_owner || '';
  
  // Track data sources
  const dataSources = {
    labelsTags: {
      available: labels.length > 0,
      count: labels.length,
      source: 'Open Food Facts API (labels_tags field)',
    },
    brands: {
      available: !!brands,
      value: brands || 'N/A',
      source: 'Open Food Facts API (brands field)',
    },
    brandOwner: {
      available: !!brandOwner,
      value: brandOwner || 'N/A',
      source: 'Open Food Facts API (brand_owner field)',
    },
    recalls: {
      available: (product.recalls?.length || 0) > 0,
      count: product.recalls?.length || 0,
      source: 'Recalls API (FDA/CFIA/RASFF) - fetched before TruScore calculation',
    },
    brandDatabase: {
      available: true, // Always available (in-memory)
      matched: false,
      brandMatched: null as string | null,
      source: 'In-memory brand database (brandDatabase.ts)',
    },
  };
  
  // Helper: label matching
  const hasLabel = (pattern: string): boolean => {
    return labels.some((l: string) => l.includes(pattern.toLowerCase()));
  };
  
  // Certification bonuses
  let certificationBonus = 0;
  
  if (hasLabel('fair-trade')) {
    certificationBonus += 8;
    adjustments.push({
      description: 'Fairtrade certification',
      value: 8,
      type: 'positive',
      dataSource: 'Open Food Facts (labels_tags contains "fair-trade")',
      dataAvailable: dataSources.labelsTags.available,
    });
  }
  
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
      description: `Organic certification (${organicLabels.join(', ')})`,
      value: 7,
      type: 'positive',
      dataSource: `Open Food Facts (labels_tags contains organic pattern: ${organicLabels.join(', ')})`,
      dataAvailable: dataSources.labelsTags.available,
    });
  }
  
  if (hasLabel('rainforest-alliance')) {
    certificationBonus += 6;
    adjustments.push({
      description: 'Rainforest Alliance certification',
      value: 6,
      type: 'positive',
      dataSource: 'Open Food Facts (labels_tags contains "rainforest-alliance")',
      dataAvailable: dataSources.labelsTags.available,
    });
  }
  
  if (hasLabel('utz')) {
    certificationBonus += 6;
    adjustments.push({
      description: 'UTZ certification',
      value: 6,
      type: 'positive',
      dataSource: 'Open Food Facts (labels_tags contains "utz")',
      dataAvailable: dataSources.labelsTags.available,
    });
  }
  
  if (labels.some((l: string) => ['en:msc', 'en:asc', 'en:dolphin-safe'].includes(l))) {
    certificationBonus += 6;
    adjustments.push({
      description: 'MSC/ASC/Dolphin-Safe certification',
      value: 6,
      type: 'positive',
      dataSource: 'Open Food Facts (labels_tags contains MSC/ASC/Dolphin-Safe)',
      dataAvailable: dataSources.labelsTags.available,
    });
  }
  
  if (hasLabel('rspo') || hasLabel('roundtable-on-sustainable-palm-oil')) {
    certificationBonus += 6;
    adjustments.push({
      description: 'RSPO certification',
      value: 6,
      type: 'positive',
      dataSource: 'Open Food Facts (labels_tags contains "rspo" or "roundtable-on-sustainable-palm-oil")',
      dataAvailable: dataSources.labelsTags.available,
    });
  }
  
  if (hasLabel('rspca')) {
    certificationBonus += 5;
    adjustments.push({
      description: 'RSPCA certification',
      value: 5,
      type: 'positive',
      dataSource: 'Open Food Facts (labels_tags contains "rspca")',
      dataAvailable: dataSources.labelsTags.available,
    });
  }
  
  if (hasLabel('leaping-bunny') || hasLabel('cruelty-free')) {
    certificationBonus += 5;
    adjustments.push({
      description: 'Leaping Bunny certification',
      value: 5,
      type: 'positive',
      dataSource: 'Open Food Facts (labels_tags contains "leaping-bunny" or "cruelty-free")',
      dataAvailable: dataSources.labelsTags.available,
    });
  }
  
  if (labels.some((l: string) => l.toLowerCase().includes('b-corp') || l.toLowerCase().includes('bcorp'))) {
    certificationBonus += 5;
    adjustments.push({
      description: 'B-Corp certification',
      value: 5,
      type: 'positive',
      dataSource: 'Open Food Facts (labels_tags contains "b-corp" or "bcorp")',
      dataAvailable: dataSources.labelsTags.available,
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
      dataSource: 'Open Food Facts (labels_tags contains "cage-free" or "free-range")',
      dataAvailable: dataSources.labelsTags.available,
    });
  }
  
  const cappedCertBonus = Math.min(certificationBonus, 15);
  if (cappedCertBonus > 0) {
    score += cappedCertBonus;
  }
  
  // Animal Cruelty and Labor Violations (only if brand is available)
  let animalCrueltyPenalty = 0;
  let laborViolationPenalty = 0;
  
  if (brands) {
    const violationCheck = checkBrandForViolations(brands);
    dataSources.brandDatabase.matched = violationCheck.hasAnimalCruelty || violationCheck.hasLaborViolations;
    dataSources.brandDatabase.brandMatched = violationCheck.brandMatched;
    
    if (violationCheck.hasAnimalCruelty) {
      animalCrueltyPenalty = 15;
      adjustments.push({
        description: `Major animal cruelty violation (brand: ${violationCheck.brandMatched})`,
        value: -animalCrueltyPenalty,
        type: 'negative',
        dataSource: `Brand Database (brandDatabase.ts) - matched brand: ${violationCheck.brandMatched}`,
        dataAvailable: dataSources.brandDatabase.available,
      });
      score -= animalCrueltyPenalty;
    }
    
    if (violationCheck.hasLaborViolations) {
      laborViolationPenalty = 15;
      adjustments.push({
        description: `Major labor violation (brand: ${violationCheck.brandMatched})`,
        value: -laborViolationPenalty,
        type: 'negative',
        dataSource: `Brand Database (brandDatabase.ts) - matched brand: ${violationCheck.brandMatched}`,
        dataAvailable: dataSources.brandDatabase.available,
      });
      score -= laborViolationPenalty;
    }
  }
  
  // Recalls penalty
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
        dataSource: 'Recalls API (FDA/CFIA/RASFF) - fetched before TruScore calculation',
        dataAvailable: dataSources.recalls.available,
      });
      score -= recallPenalty;
    } else {
      productHasRecallHistory = product.recalls.length > 0;
    }
  }
  
  // Brand overlay penalty
  let brandOverlayPenalty = 0;
  if (brands) {
    const violationCheck = checkBrandForViolations(brands);
    if (violationCheck.hasAnimalCruelty || violationCheck.hasLaborViolations || productHasRecallHistory) {
      brandOverlayPenalty = 3;
      const reasons: string[] = [];
      if (violationCheck.hasAnimalCruelty) reasons.push('animal cruelty');
      if (violationCheck.hasLaborViolations) reasons.push('labor violations');
      if (productHasRecallHistory) reasons.push('recall history');
      
      adjustments.push({
        description: `Brand/parent high-impact overlay (${reasons.join(', ')})`,
        value: -brandOverlayPenalty,
        type: 'negative',
        dataSource: `Brand Database (brandDatabase.ts) + Recalls API`,
        dataAvailable: dataSources.brandDatabase.available || dataSources.recalls.available,
      });
      score -= brandOverlayPenalty;
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

// Main analysis
async function main() {
  const barcodes = [
    '894700010137', '9310354982466', '9300694335947', '9316417008890', '9310036039655',
    '5449000000996', '9310272002253', '9300675016902', '611269991000', '9341650001766',
    '9300650022898', '7622300992675', '793579769781', '9326666610553', '9310055105850',
    '9310055105904', '9300652014396', '9300652010794', '9300677006437', '9313010000801',
    '13000006408', '9310061462206', '9310061550101', '3017620422003', '9313958005890',
    '9310412003577', '9310047207180', '9343787099105', '9343787099104', '9310653105733',
    '9310354890006', '9300830060733', '9310988022378', '40000511281', '40000422068',
    '44000032210', '38000845017', '9310645350899', '8355030495', '9310645176833',
    '9342373000296', '9357107000251', '9320802000482', '9342373000395', '931839007104',
    '9315090200102', '9311208001241', '58449450023', '9310155305037', '9310060011030',
    '9315822010863', '5052675000989', '42272005024', '93100062212972', '9310645244846',
    '75919000069', '9317241301409', '803678000095', '9310645442532', '9340860006547',
    '9310645467740',
  ];
  
  const uniqueBarcodes = Array.from(new Set(barcodes));
  const results: any[] = [];
  
  console.log(`Testing ${uniqueBarcodes.length} barcodes for CARE pillar score changes...\n`);
  
  for (let i = 0; i < uniqueBarcodes.length; i++) {
    const barcode = uniqueBarcodes[i];
    console.log(`[${i + 1}/${uniqueBarcodes.length}] ${barcode}`);
    
    const product = await fetchProduct(barcode);
    if (!product) {
      results.push({ barcode, productName: 'NOT FOUND', careScore: 15, isDefault: true });
      continue;
    }
    
    const productName = product.product_name || product.product_name_en || 'Unknown';
    const careResult = calculateCarePillarDetailed(product);
    const isDefault = careResult.score === 15;
    
    if (!isDefault) {
      console.log(`  ✓ ADJUSTED: ${careResult.score}/25 (was 15, change: ${careResult.score > 15 ? '+' : ''}${careResult.score - 15})`);
    }
    
    results.push({
      barcode,
      productName,
      careScore: careResult.score,
      isDefault,
      adjustments: careResult.adjustments,
      details: careResult.details,
      dataSources: careResult.dataSources,
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate detailed report
  const adjustedProducts = results.filter(r => !r.isDefault && r.careScore !== 15);
  
  const report: string[] = [];
  report.push('='.repeat(100));
  report.push('CARE PILLAR SCORE CHANGES - DETAILED ANALYSIS');
  report.push('='.repeat(100));
  report.push('');
  report.push(`Analysis Date: ${new Date().toISOString()}`);
  report.push(`Total Products: ${results.length}`);
  report.push(`Products with Score Changes: ${adjustedProducts.length}`);
  report.push(`Products with Default Score (15): ${results.length - adjustedProducts.length}`);
  report.push('');
  
  if (adjustedProducts.length > 0) {
    report.push('='.repeat(100));
    report.push('PRODUCTS WITH CARE SCORE CHANGES');
    report.push('='.repeat(100));
    report.push('');
    
    adjustedProducts.forEach((result, index) => {
      const change = result.careScore - 15;
      report.push(`${index + 1}. Barcode: ${result.barcode}`);
      report.push(`   Product: ${result.productName}`);
      report.push(`   CARE Score: ${result.careScore}/25 (Base: 15, Change: ${change > 0 ? '+' : ''}${change})`);
      report.push('');
      report.push(`   SCORE BREAKDOWN:`);
      report.push(`     Base Score: 15`);
      report.push(`     Certification Bonus: +${result.details.certificationBonus}`);
      report.push(`     Animal Cruelty Penalty: -${result.details.animalCrueltyPenalty}`);
      report.push(`     Labor Violation Penalty: -${result.details.laborViolationPenalty}`);
      report.push(`     Recall Penalty: -${result.details.recallPenalty}`);
      report.push(`     Brand Overlay Penalty: -${result.details.brandOverlayPenalty}`);
      report.push(`     Final Score: ${result.careScore}/25`);
      report.push('');
      report.push(`   ADJUSTMENTS APPLIED:`);
      if (result.adjustments.length === 0) {
        report.push(`     (No adjustments - this shouldn't happen if score changed)`);
      } else {
        result.adjustments.forEach(adj => {
          const sign = adj.value > 0 ? '+' : '';
          report.push(`     ${sign}${adj.value}: ${adj.description}`);
          report.push(`       └─ Data Source: ${adj.dataSource}`);
          report.push(`       └─ Data Available: ${adj.dataAvailable ? 'YES' : 'NO'}`);
        });
      }
      report.push('');
      report.push(`   DATABASE ACCESS DETAILS:`);
      report.push(`     Labels Tags:`);
      report.push(`       Available: ${result.dataSources.labelsTags.available ? 'YES' : 'NO'}`);
      report.push(`       Count: ${result.dataSources.labelsTags.count}`);
      report.push(`       Source: ${result.dataSources.labelsTags.source}`);
      report.push(`     Brands:`);
      report.push(`       Available: ${result.dataSources.brands.available ? 'YES' : 'NO'}`);
      report.push(`       Value: ${result.dataSources.brands.value}`);
      report.push(`       Source: ${result.dataSources.brands.source}`);
      report.push(`     Brand Owner:`);
      report.push(`       Available: ${result.dataSources.brandOwner.available ? 'YES' : 'NO'}`);
      report.push(`       Value: ${result.dataSources.brandOwner.value}`);
      report.push(`       Source: ${result.dataSources.brandOwner.source}`);
      report.push(`     Recalls:`);
      report.push(`       Available: ${result.dataSources.recalls.available ? 'YES' : 'NO'}`);
      report.push(`       Count: ${result.dataSources.recalls.count}`);
      report.push(`       Source: ${result.dataSources.recalls.source}`);
      report.push(`     Brand Database:`);
      report.push(`       Available: ${result.dataSources.brandDatabase.available ? 'YES' : 'NO'} (always available - in-memory)`);
      report.push(`       Brand Matched: ${result.dataSources.brandDatabase.matched ? 'YES' : 'NO'}`);
      report.push(`       Matched Brand: ${result.dataSources.brandDatabase.brandMatched || 'N/A'}`);
      report.push(`       Source: ${result.dataSources.brandDatabase.source}`);
      report.push('');
      report.push('   '.repeat(50));
      report.push('');
    });
  } else {
    report.push('No products found with adjusted CARE scores.');
    report.push('All products scored the default 15 points.');
  }
  
  const reportText = report.join('\n');
  const reportPath = path.join(__dirname, '..', 'TruScore logic', 'care-pillar-score-changes-detailed.txt');
  fs.writeFileSync(reportPath, reportText, 'utf-8');
  
  console.log('\n' + '='.repeat(100));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(100));
  console.log(`Products with score changes: ${adjustedProducts.length}`);
  console.log(`Report saved to: ${reportPath}`);
  console.log('\n' + reportText);
}

main().catch(console.error);
