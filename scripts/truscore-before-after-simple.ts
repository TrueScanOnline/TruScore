/**
 * Simplified Before/After TruScore Analysis Script
 * 
 * Compares TruScore calculations using old vs new pillar logic
 * Uses direct API calls and simplified calculations to avoid React Native dependencies
 */

import * as fs from 'fs';
import * as path from 'path';

interface Product {
  barcode?: string;
  product_name?: string;
  product_name_en?: string;
  nutriscore_grade?: string;
  ecoscore_grade?: string;
  nova_group?: number;
  ingredients_text?: string;
  ingredients_analysis_tags?: string[];
  additives_tags?: string[];
  labels_tags?: string[];
  origins_tags?: string[];
  origins?: string;
  manufacturing_places_tags?: string[];
  manufacturing_places?: string;
  brand_owner?: string;
  brands?: string;
  brands_tags?: string[];
  palm_oil_analysis?: {
    containsPalmOil?: boolean;
    isPalmOilFree?: boolean;
    isCertifiedSustainable?: boolean;
  };
  packagings?: Array<{ material?: string }>;
  nutriments?: Record<string, any>;
  serving_size?: string;
  source?: string;
  [key: string]: any;
}

// OLD LOGIC - Body Pillar
function calculateBodyPillarOld(product: Product): number {
  let score = 15; // Base score
  
  // OLD Nutri-Score: A=+10, B=+5, C=0, D=-5, E=-10
  if (product.nutriscore_grade) {
    const ns = product.nutriscore_grade.toLowerCase();
    const gradeMapping: Record<string, number> = { a: 25, b: 20, c: 15, d: 10, e: 5 };
    const nutriscoreValue = gradeMapping[ns] || 15;
    const adjustment = nutriscoreValue - 15;
    score += adjustment;
  }
  
  // OLD NOVA: 1=+3, 2=0, 3=-3, 4=-8
  const nova = product.nova_group;
  if (nova === 1) {
    score += 3;
  } else if (nova === 3) {
    score -= 3;
  } else if (nova === 4) {
    score -= 8;
  }
  
  // Cap at 2-25
  score = Math.max(2, Math.min(25, Math.round(score)));
  
  return score;
}

// NEW LOGIC - Body Pillar
function calculateBodyPillarNew(product: Product): number {
  let score = 15; // Base score
  
  // NEW Nutri-Score: A=+7, B=+3, C=0, D=-3, E=-7
  if (product.nutriscore_grade) {
    const ns = product.nutriscore_grade.toLowerCase();
    const gradeMapping: Record<string, number> = { a: 22, b: 18, c: 15, d: 12, e: 8 };
    const nutriscoreValue = gradeMapping[ns] || 15;
    const adjustment = nutriscoreValue - 15;
    score += adjustment;
  }
  
  // NEW NOVA: 1=+3, 2=+1, 3=-1, 4=-6
  const nova = product.nova_group;
  if (nova === 1) {
    score += 3;
  } else if (nova === 2) {
    score += 1;
  } else if (nova === 3) {
    score -= 1;
  } else if (nova === 4) {
    score -= 6;
  }
  
  // Cap at 2-25
  score = Math.max(2, Math.min(25, Math.round(score)));
  
  return score;
}

// OLD LOGIC - Planet Pillar
function calculatePlanetPillarOld(product: Product): number {
  let score = 15; // Base score
  
  // OLD Eco-Score: A=+10, B=+5, C=0, D=-5, E=-10
  if (product.ecoscore_grade) {
    const es = product.ecoscore_grade.toLowerCase();
    const gradeMapping: Record<string, number> = { a: 25, b: 20, c: 15, d: 10, e: 5 };
    const ecoscoreValue = gradeMapping[es] || 15;
    const adjustment = ecoscoreValue - 15;
    score += adjustment;
  }
  
  // OLD Palm oil: Non-certified=-8, RSPO=0
  if (product.palm_oil_analysis?.containsPalmOil && !product.palm_oil_analysis.isPalmOilFree) {
    if (!product.palm_oil_analysis.isCertifiedSustainable) {
      score -= 8;
    }
  }
  
  // OLD Packaging: All recyclable=+5, some=+2 (simplified)
  // OLD High eco-cost: -5 (simplified)
  
  // Cap at 0-25
  score = Math.max(0, Math.min(25, Math.round(score)));
  
  return score;
}

// NEW LOGIC - Planet Pillar
function calculatePlanetPillarNew(product: Product): number {
  let score = 15; // Base score
  
  // NEW Eco-Score: A=+7, B=+3, C=0, D=-3, E=-7
  if (product.ecoscore_grade) {
    const es = product.ecoscore_grade.toLowerCase();
    const gradeMapping: Record<string, number> = { a: 22, b: 18, c: 15, d: 12, e: 8 };
    const ecoscoreValue = gradeMapping[es] || 15;
    const adjustment = ecoscoreValue - 15;
    score += adjustment;
  }
  
  // NEW Palm oil: Non-sust=-8, RSPO=0, brand overlay=-4 (simplified)
  if (product.palm_oil_analysis?.containsPalmOil && !product.palm_oil_analysis.isPalmOilFree) {
    if (!product.palm_oil_analysis.isCertifiedSustainable) {
      score -= 8;
    }
  }
  
  // NEW Packaging: Full recycle=+3, partial=+1, high eco-cost=-6 (simplified)
  
  // Cap at 0-25
  score = Math.max(0, Math.min(25, Math.round(score)));
  
  return score;
}

// OLD LOGIC - Open Pillar
function calculateOpenPillarOld(product: Product): number {
  let score = 15; // Base score
  const ingredientsText = product.ingredients_text || '';
  const ingredientsLength = ingredientsText.trim().length;
  
  // OLD Ingredients disclosure: Complex length-based
  if (!ingredientsText || ingredientsLength === 0) {
    score -= 5;
  } else if (ingredientsLength < 50) {
    score -= 5;
  } else if (ingredientsLength < 100) {
    score -= 5;
  }
  
  // OLD Hidden terms: 1=-5, 2=-10, >=3=-15
  const hiddenTerms = ['parfum', 'fragrance', 'aroma', 'natural flavor', 'proprietary blend'];
  const hiddenCount = hiddenTerms.filter(t => 
    new RegExp(`\\b${t}\\b`, 'i').test(ingredientsText.toLowerCase())
  ).length;
  
  if (hiddenCount >= 3) {
    score -= 15;
  } else if (hiddenCount === 2) {
    score -= 10;
  } else if (hiddenCount === 1) {
    score -= 5;
  }
  
  // OLD Zero hidden: +5 for NOVA 1-2, +2 for others
  if (hiddenCount === 0) {
    const nova = product.nova_group;
    if (nova === 1 || nova === 2) {
      score += 5;
    } else {
      score += 2;
    }
  }
  
  // OLD Origins: No origin=-8
  const hasOrigin = !!(product.origins_tags && product.origins_tags.length > 0) ||
                   !!(product.origins && product.origins.trim().length > 0);
  if (!hasOrigin) {
    score -= 8;
  }
  
  // OLD Brand ownership: Hidden/opaque parent=-5
  if (!product.brand_owner) {
    score -= 5;
  }
  
  // Cap at 0-25
  score = Math.max(0, Math.min(25, Math.round(score)));
  
  return score;
}

// NEW LOGIC - Open Pillar
function calculateOpenPillarNew(product: Product): number {
  let score = 15; // Base score
  const ingredientsText = product.ingredients_text || '';
  const ingredientsLength = ingredientsText.trim().length;
  
  // NEW Ingredients disclosure: Present=+2, none=-3
  if (!ingredientsText || ingredientsLength === 0) {
    score -= 3;
  } else {
    score += 2; // Present = +2
  }
  
  // NEW Hidden terms: 1=-4, 2=-8, >=3=-11; NOVA>=3 adds +1
  const hiddenTerms = ['parfum', 'fragrance', 'aroma', 'natural flavor', 'proprietary blend'];
  let hiddenCount = hiddenTerms.filter(t => 
    new RegExp(`\\b${t}\\b`, 'i').test(ingredientsText.toLowerCase())
  ).length;
  
  // NOVA amplification
  if (product.nova_group !== undefined && product.nova_group >= 3) {
    hiddenCount += 1;
  }
  
  if (hiddenCount >= 3) {
    score -= 11;
  } else if (hiddenCount === 2) {
    score -= 8;
  } else if (hiddenCount === 1) {
    score -= 4;
  }
  
  // NEW Zero hidden: +4 for NOVA 1-2, +2 for NOVA 3-4
  const actualHiddenCount = hiddenTerms.filter(t => 
    new RegExp(`\\b${t}\\b`, 'i').test(ingredientsText.toLowerCase())
  ).length;
  if (actualHiddenCount === 0) {
    const nova = product.nova_group;
    if (nova === 1 || nova === 2) {
      score += 4;
    } else {
      score += 2;
    }
  }
  
  // NEW Nutritional Information: Complete=+3, partial=+1, none=-3 (simplified)
  const hasNutrients = product.nutriments && Object.keys(product.nutriments).length > 0;
  if (!hasNutrients) {
    score -= 3;
  } else {
    // Check if complete (has _100g keys)
    const hasPer100g = Object.keys(product.nutriments).some(key => key.includes('_100g'));
    if (hasPer100g) {
      score += 3;
    } else {
      score += 1;
    }
  }
  
  // NEW Origins: No origin=-4, complete=+4 bonus
  const hasOrigin = !!(product.origins_tags && product.origins_tags.length > 0) ||
                 !!(product.origins && product.origins.trim().length > 0);
  if (!hasOrigin) {
    score -= 4;
  } else {
    // Check if complete (has both tags and string)
    const isComplete = (product.origins_tags && product.origins_tags.length > 0 && product.origins) ||
                      (product.origins_tags && product.origins_tags.length > 1);
    if (isComplete) {
      score += 4;
    }
  }
  
  // NEW Brand ownership: Hidden/opaque parent=-3
  if (!product.brand_owner) {
    score -= 3;
  }
  
  // Cap at 0-25
  score = Math.max(0, Math.min(25, Math.round(score)));
  
  return score;
}

// Calculate Care Pillar (unchanged, simplified)
function calculateCarePillar(product: Product): number {
  // Simplified - Care pillar logic is complex, use base 15 for comparison
  return 15;
}

// Fetch product data directly from Open Food Facts API
async function fetchProduct(barcode: string): Promise<Product | null> {
  try {
    // Try Open Food Facts first
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
    
    // Try Open Beauty Facts
    const obfUrl = `https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`;
    const obfResponse = await fetch(obfUrl, {
      headers: { 'User-Agent': 'TrueScan-FoodScanner/1.0' }
    });
    
    if (obfResponse.ok) {
      const obfData = await obfResponse.json();
      if (obfData.product) {
        return { ...obfData.product, barcode, source: 'openbeautyfacts' } as Product;
      }
    }
    
    // Try Open Products Facts
    const opfUrl = `https://world.openproductsfacts.org/api/v2/product/${barcode}.json`;
    const opfResponse = await fetch(opfUrl, {
      headers: { 'User-Agent': 'TrueScan-FoodScanner/1.0' }
    });
    
    if (opfResponse.ok) {
      const opfData = await opfResponse.json();
      if (opfData.product) {
        return { ...opfData.product, barcode, source: 'openproductsfacts' } as Product;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching barcode ${barcode}:`, error);
    return null;
  }
}

// Calculate scores
function calculateTruScoreOld(product: Product) {
  const body = calculateBodyPillarOld(product);
  const planet = calculatePlanetPillarOld(product);
  const open = calculateOpenPillarOld(product);
  const care = calculateCarePillar(product);
  
  const total = body + planet + open + care;
  return {
    total: Math.max(0, Math.min(100, Math.round(total))),
    body,
    planet,
    open,
    care,
  };
}

function calculateTruScoreNew(product: Product) {
  const body = calculateBodyPillarNew(product);
  const planet = calculatePlanetPillarNew(product);
  const open = calculateOpenPillarNew(product);
  const care = calculateCarePillar(product);
  
  const total = body + planet + open + care;
  return {
    total: Math.max(0, Math.min(100, Math.round(total))),
    body,
    planet,
    open,
    care,
  };
}

// Main analysis function
async function analyzeBarcodes(barcodes: string[]) {
  const results: Array<{
    barcode: string;
    productName: string;
    oldScore: { total: number; body: number; planet: number; open: number; care: number };
    newScore: { total: number; body: number; planet: number; open: number; care: number };
    difference: { total: number; body: number; planet: number; open: number; care: number };
  }> = [];
  
  console.log(`Analyzing ${barcodes.length} barcodes...\n`);
  
  for (let i = 0; i < barcodes.length; i++) {
    const barcode = barcodes[i];
    console.log(`[${i + 1}/${barcodes.length}] Processing barcode: ${barcode}`);
    
    const product = await fetchProduct(barcode);
    
    if (!product) {
      console.log(`  ⚠️  Product not found\n`);
      results.push({
        barcode,
        productName: 'NOT FOUND',
        oldScore: { total: 0, body: 0, planet: 0, open: 0, care: 0 },
        newScore: { total: 0, body: 0, planet: 0, open: 0, care: 0 },
        difference: { total: 0, body: 0, planet: 0, open: 0, care: 0 },
      });
      continue;
    }
    
    const productName = product.product_name || product.product_name_en || 'Unknown';
    console.log(`  Product: ${productName.substring(0, 50)}...`);
    
    const oldScore = calculateTruScoreOld(product);
    const newScore = calculateTruScoreNew(product);
    
    const difference = {
      total: newScore.total - oldScore.total,
      body: newScore.body - oldScore.body,
      planet: newScore.planet - oldScore.planet,
      open: newScore.open - oldScore.open,
      care: newScore.care - oldScore.care,
    };
    
    console.log(`  Old: ${oldScore.total} (B:${oldScore.body} P:${oldScore.planet} O:${oldScore.open} C:${oldScore.care})`);
    console.log(`  New: ${newScore.total} (B:${newScore.body} P:${oldScore.planet} O:${newScore.open} C:${newScore.care})`);
    console.log(`  Diff: ${difference.total > 0 ? '+' : ''}${difference.total} (B:${difference.body > 0 ? '+' : ''}${difference.body} P:${difference.planet > 0 ? '+' : ''}${difference.planet} O:${difference.open > 0 ? '+' : ''}${difference.open} C:${difference.care > 0 ? '+' : ''}${difference.care})\n`);
    
    results.push({
      barcode,
      productName,
      oldScore,
      newScore,
      difference,
    });
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

// Generate report
function generateReport(results: any[]) {
  const report: string[] = [];
  
  report.push('='.repeat(100));
  report.push('TRUSCORE BEFORE/AFTER ANALYSIS REPORT');
  report.push('='.repeat(100));
  report.push('');
  report.push(`Analysis Date: ${new Date().toISOString()}`);
  report.push(`Total Products Analyzed: ${results.length}`);
  report.push('');
  
  // Summary statistics
  const validResults = results.filter(r => r.oldScore.total > 0 || r.newScore.total > 0);
  const totalDiff = validResults.reduce((sum, r) => sum + r.difference.total, 0);
  const avgDiff = validResults.length > 0 ? totalDiff / validResults.length : 0;
  const bodyDiff = validResults.length > 0 ? validResults.reduce((sum, r) => sum + r.difference.body, 0) / validResults.length : 0;
  const planetDiff = validResults.length > 0 ? validResults.reduce((sum, r) => sum + r.difference.planet, 0) / validResults.length : 0;
  const openDiff = validResults.length > 0 ? validResults.reduce((sum, r) => sum + r.difference.open, 0) / validResults.length : 0;
  
  report.push('SUMMARY STATISTICS');
  report.push('-'.repeat(100));
  report.push(`Average Total Score Change: ${avgDiff > 0 ? '+' : ''}${avgDiff.toFixed(2)}`);
  report.push(`Average Body Pillar Change: ${bodyDiff > 0 ? '+' : ''}${bodyDiff.toFixed(2)}`);
  report.push(`Average Planet Pillar Change: ${planetDiff > 0 ? '+' : ''}${planetDiff.toFixed(2)}`);
  report.push(`Average Open Pillar Change: ${openDiff > 0 ? '+' : ''}${openDiff.toFixed(2)}`);
  report.push('');
  
  const increased = validResults.filter(r => r.difference.total > 0).length;
  const decreased = validResults.filter(r => r.difference.total < 0).length;
  const unchanged = validResults.filter(r => r.difference.total === 0).length;
  
  report.push(`Products with Increased Scores: ${increased} (${validResults.length > 0 ? ((increased / validResults.length) * 100).toFixed(1) : 0}%)`);
  report.push(`Products with Decreased Scores: ${decreased} (${validResults.length > 0 ? ((decreased / validResults.length) * 100).toFixed(1) : 0}%)`);
  report.push(`Products with Unchanged Scores: ${unchanged} (${validResults.length > 0 ? ((unchanged / validResults.length) * 100).toFixed(1) : 0}%)`);
  report.push('');
  
  // Detailed results
  report.push('='.repeat(100));
  report.push('DETAILED RESULTS');
  report.push('='.repeat(100));
  report.push('');
  
  results.forEach((result, index) => {
    report.push(`${index + 1}. Barcode: ${result.barcode}`);
    report.push(`   Product: ${result.productName}`);
    report.push(`   OLD Score: ${result.oldScore.total}/100 (Body: ${result.oldScore.body}, Planet: ${result.oldScore.planet}, Open: ${result.oldScore.open}, Care: ${result.oldScore.care})`);
    report.push(`   NEW Score: ${result.newScore.total}/100 (Body: ${result.newScore.body}, Planet: ${result.newScore.planet}, Open: ${result.newScore.open}, Care: ${result.newScore.care})`);
    report.push(`   DIFFERENCE: ${result.difference.total > 0 ? '+' : ''}${result.difference.total} (Body: ${result.difference.body > 0 ? '+' : ''}${result.difference.body}, Planet: ${result.difference.planet > 0 ? '+' : ''}${result.difference.planet}, Open: ${result.difference.open > 0 ? '+' : ''}${result.difference.open}, Care: ${result.difference.care > 0 ? '+' : ''}${result.difference.care})`);
    report.push('');
  });
  
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
  
  const results = await analyzeBarcodes(barcodes);
  const report = generateReport(results);
  
  // Save report to file
  const reportPath = path.join(__dirname, '..', 'TruScore logic', 'truscore-before-after-report.txt');
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log('\n' + '='.repeat(100));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(100));
  console.log(`Report saved to: ${reportPath}`);
  console.log('\n' + report);
}

main().catch(console.error);
