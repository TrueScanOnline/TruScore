/**
 * TruScore Analysis Script
 * Analyzes TruScore calculation for multiple barcodes with detailed breakdown
 * 
 * Usage:
 *   npm run analyze-truscore -- 9420020300194 1234567890123
 *   npm run analyze-truscore -- --file barcodes.txt
 *   npm run analyze-truscore -- --barcodes 9420020300194,1234567890123
 * 
 * Output: Detailed logs showing TruScore calculation for each barcode
 */

import { fetchProduct } from '../src/services/productService';
import { calculateTruScore } from '../src/lib/truscoreEngine';
import { Product } from '../src/types/product';
import * as fs from 'fs';
import * as path from 'path';

interface AnalysisResult {
  barcode: string;
  productName?: string;
  truScore: number;
  breakdown: {
    Body: number;
    Planet: number;
    Ethics: number;
    Open: number;
  };
  hasNutriScore: boolean;
  hasEcoScore: boolean;
  hasOrigin: boolean;
  bodyDetails: {
    base: number;
    nutriscoreGrade?: string;
    nutriscoreValue?: number;
    additivePenalty: number;
    riskyTagsPenalty: number;
    irritantPenalty: number;
    fragrancePenalty: number;
    novaBonus: number;
    final: number;
  };
  planetDetails: {
    base: number;
    ecoscoreGrade?: string;
    ecoscoreAdjustment?: number;
    packagingFallbackPoints?: number;
    final: number;
  };
  ethicsDetails: {
    base: number;
    certificationBonus: number;
    cruelParentPenalty: number;
    recallPenalty: number;
    final: number;
  };
  openDetails: {
    base: number;
    ingredientsScore: number;
    hiddenTermsPenalty: number;
    listingClarityBonus: number;
    originPenalty: number;
    final: number;
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

function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

function formatPercentage(value: number, max: number = 25): string {
  return `${formatNumber((value / max) * 100)}%`;
}

function getColorCode(percentage: number): string {
  if (percentage >= 80) return '🟢'; // Green
  if (percentage >= 60) return '🟡'; // Yellow
  if (percentage >= 40) return '🟠'; // Orange
  return '🔴'; // Red
}

function printSection(title: string): void {
  console.log('\n' + '═'.repeat(70));
  console.log(`  ${title}`);
  console.log('═'.repeat(70) + '\n');
}

function printPillarDetails(
  pillarName: string,
  score: number,
  maxScore: number,
  details: any
): void {
  const percentage = (score / maxScore) * 100;
  const color = getColorCode(percentage);
  
  console.log(`${color} [${pillarName} Pillar] Score: ${score}/${maxScore} (${formatPercentage(score, maxScore)})`);
  console.log(`    Base Score: ${formatNumber(details.base)}`);
  
  // Show positive contributions
  const positives: string[] = [];
  if (details.nutriscoreValue !== undefined && details.nutriscoreValue > 0) {
    positives.push(`Nutri-Score (${details.nutriscoreGrade}): +${formatNumber(details.nutriscoreValue)}`);
  }
  if (details.ecoscoreValue !== undefined && details.ecoscoreValue > 0) {
    positives.push(`Eco-Score (${details.ecoscoreGrade}): +${formatNumber(details.ecoscoreValue)}`);
  }
  if (details.ecoscoreAdjustment !== undefined && details.ecoscoreAdjustment > 0) {
    positives.push(`Eco-Score (${details.ecoscoreGrade}): +${formatNumber(details.ecoscoreAdjustment)}`);
  }
  if (details.certificationBonus > 0) {
    positives.push(`Certifications: +${formatNumber(details.certificationBonus)}`);
  }
  if (details.packagingFallbackPoints > 0) {
    positives.push(`Packaging fallback: +${formatNumber(details.packagingFallbackPoints)}`);
  }
  if (details.listingClarityBonus > 0) {
    positives.push(`Listing clarity bonus: +${formatNumber(details.listingClarityBonus)}`);
  }
  if (details.novaBonus > 0) {
    positives.push(`NOVA Bonus: +${formatNumber(details.novaBonus)}`);
  }
  if (details.ingredientsScore > 0) {
    positives.push(`Ingredients Disclosure: +${formatNumber(details.ingredientsScore)}`);
  }
  
  if (positives.length > 0) {
    console.log(`    ✅ Positive Points:`);
    positives.forEach(p => console.log(`       + ${p}`));
  }
  
  // Show negative contributions
  const negatives: string[] = [];
  if (details.additiveElementDeduction > 0) {
    negatives.push(`Additives (MVP): -${formatNumber(details.additiveElementDeduction)}`);
  }
  if (details.riskyTagsPenalty > 0) {
    negatives.push(`Risky Tags: -${formatNumber(details.riskyTagsPenalty)}`);
  }
  if (details.irritantPenalty > 0) {
    negatives.push(`Irritants: -${formatNumber(details.irritantPenalty)}`);
  }
  if (details.fragrancePenalty > 0) {
    negatives.push(`Fragrance: -${formatNumber(details.fragrancePenalty)}`);
  }
  if (details.ecoscoreAdjustment !== undefined && details.ecoscoreAdjustment < 0) {
    negatives.push(`Eco-Score (${details.ecoscoreGrade}): ${formatNumber(details.ecoscoreAdjustment)}`);
  }
  if (details.cruelParentPenalty > 0) {
    negatives.push(`Cruel Parent: -${formatNumber(details.cruelParentPenalty)}`);
  }
  if (details.recallPenalty > 0) {
    negatives.push(`Recalls: -${formatNumber(details.recallPenalty)}`);
  }
  if (details.hiddenTermsPenalty > 0) {
    negatives.push(`Hidden Terms: -${formatNumber(details.hiddenTermsPenalty)}`);
  }
  if (details.originPenalty > 0) {
    negatives.push(`No Origin: -${formatNumber(details.originPenalty)}`);
  }
  if (details.ingredientsScore < 0) {
    negatives.push(`No Ingredients: ${formatNumber(details.ingredientsScore)}`);
  }
  if (details.novaBonus < 0) {
    negatives.push(`NOVA Penalty: ${formatNumber(details.novaBonus)}`);
  }
  
  if (negatives.length > 0) {
    console.log(`    ❌ Negative Points:`);
    negatives.forEach(n => console.log(`       - ${n}`));
  }
  
  console.log(`    Final: ${formatNumber(details.final)} (capped at 0-${maxScore})`);
}

async function analyzeBarcode(barcode: string): Promise<AnalysisResult> {
  try {
    console.log(`\n📊 Fetching product: ${barcode}...`);
    
    const product = await fetchProduct(barcode, true, false, false);
    
    if (!product) {
      return {
        barcode,
        error: 'Product not found',
        truScore: 0,
        breakdown: { Body: 0, Planet: 0, Ethics: 0, Open: 0 },
        hasNutriScore: false,
        hasEcoScore: false,
        hasOrigin: false,
        bodyDetails: { base: 0, additivePenalty: 0, riskyTagsPenalty: 0, irritantPenalty: 0, fragrancePenalty: 0, novaBonus: 0, final: 0 },
        planetDetails: { base: 0, final: 0 },
        ethicsDetails: { base: 0, certificationBonus: 0, cruelParentPenalty: 0, recallPenalty: 0, final: 0 },
        openDetails: { base: 0, ingredientsScore: 0, hiddenTermsPenalty: 0, listingClarityBonus: 0, originPenalty: 0, final: 0 },
        productData: { additives_count: 0, hasIngredients: false, ingredientsLength: 0, hasPalmOil: false, certifications: [], labels: [], hasOrigin: false },
      };
    }
    
    console.log(`✅ Product found: ${product.product_name || 'Unknown'}`);
    
    // Calculate TruScore
    const result = calculateTruScore(product);
    
    // Extract detailed information for analysis
    // Note: The actual calculation happens inside calculateTruScore, so we'll reconstruct the details
    // based on the product data and final scores
    
    const bodyDetails = {
      base: result.breakdown.Body,
      nutriscoreGrade: product.nutriscore_grade,
      nutriscoreValue: product.nutriscore_grade ? 
        ({ a: 25, b: 20, c: 15, d: 10, e: 5 } as any)[product.nutriscore_grade.toLowerCase()] : undefined,
      additivePenalty: 0, // Will be calculated
      riskyTagsPenalty: 0,
      irritantPenalty: 0,
      fragrancePenalty: 0,
      novaBonus: product.nova_group === 1 ? 3 : product.nova_group === 3 ? -3 : product.nova_group === 4 ? -8 : 0,
      final: result.breakdown.Body,
    };
    
    const pPlanet = result.pillarDetails?.planet;
    const planetDetails = {
      base: pPlanet?.base ?? 15,
      ecoscoreGrade: pPlanet?.details?.ecoscoreGrade,
      ecoscoreAdjustment: pPlanet?.details?.ecoscoreAdjustment,
      packagingFallbackPoints: pPlanet?.details?.packagingFallbackPoints,
      final: result.breakdown.Planet,
    };
    
    const ethicsDetails = {
      base: result.pillarDetails?.ethics?.base ?? 15,
      certificationBonus: 0,
      cruelParentPenalty: 0,
      recallPenalty: product.recalls && product.recalls.length > 0 ? 10 : 0,
      final: result.breakdown.Ethics,
    };
    
    const od = result.pillarDetails?.open;
    const openDetails = {
      base: od?.base ?? 15,
      ingredientsScore: od?.details?.ingredientsScore ?? 0,
      hiddenTermsPenalty: od?.details?.hiddenTermsPenalty ?? 0,
      listingClarityBonus: od?.details?.listingClarityBonus ?? 0,
      originPenalty: od?.details?.originPenalty ?? 0,
      final: result.breakdown.Open,
    };
    
    return {
      barcode,
      productName: product.product_name,
      truScore: result.truscore,
      breakdown: result.breakdown,
      hasNutriScore: result.hasNutriScore || false,
      hasEcoScore: result.hasEcoScore || false,
      hasOrigin: result.hasOrigin || false,
      bodyDetails,
      planetDetails,
      ethicsDetails,
      openDetails,
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
      breakdown: { Body: 0, Planet: 0, Ethics: 0, Open: 0 },
      hasNutriScore: false,
      hasEcoScore: false,
      hasOrigin: false,
      bodyDetails: { base: 0, additivePenalty: 0, riskyTagsPenalty: 0, irritantPenalty: 0, fragrancePenalty: 0, novaBonus: 0, final: 0 },
      planetDetails: { base: 0, final: 0 },
      ethicsDetails: { base: 0, certificationBonus: 0, cruelParentPenalty: 0, recallPenalty: 0, final: 0 },
      openDetails: { base: 0, ingredientsScore: 0, hiddenTermsPenalty: 0, listingClarityBonus: 0, originPenalty: 0, final: 0 },
      productData: { additives_count: 0, hasIngredients: false, ingredientsLength: 0, hasPalmOil: false, certifications: [], labels: [], hasOrigin: false },
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
  
  printSection('TruScore Analysis Tool');
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
    
    console.log(`\n📦 Product: ${result.productName || 'Unknown'}`);
    console.log(`\n🎯 TruScore: ${result.truScore}/100 ${getColorCode((result.truScore / 100) * 100)}\n`);
    
    // Print detailed breakdown for each pillar
    printPillarDetails('Body', result.breakdown.Body, 25, result.bodyDetails);
    printPillarDetails('Planet', result.breakdown.Planet, 25, result.planetDetails);
    printPillarDetails('Ethics', result.breakdown.Ethics, 25, result.ethicsDetails);
    printPillarDetails('Open', result.breakdown.Open, 25, result.openDetails);
    
    // Product data summary
    console.log('\n📋 Product Data Summary:');
    console.log(`   Nutri-Score: ${result.productData.nutriscore_grade || 'N/A'}`);
    console.log(`   Eco-Score: ${result.productData.ecoscore_grade || 'N/A'}`);
    console.log(`   NOVA Group: ${result.productData.nova_group || 'N/A'}`);
    console.log(`   Additives: ${result.productData.additives_count}`);
    console.log(`   Ingredients: ${result.productData.hasIngredients ? `${result.productData.ingredientsLength} chars` : 'Not available'}`);
    console.log(`   Palm Oil: ${result.productData.hasPalmOil ? 'Yes' : 'No'}`);
    console.log(`   Certifications: ${result.productData.certifications.length > 0 ? result.productData.certifications.join(', ') : 'None'}`);
    console.log(`   Origin: ${result.productData.hasOrigin ? 'Available' : 'Not available'}`);
    console.log(`   Recalls: ${result.productData.recalls?.length || 0}`);
  }
  
  // Summary
  printSection('Summary');
  const successful = results.filter(r => !r.error);
  const avgScore = successful.length > 0 
    ? successful.reduce((sum, r) => sum + r.truScore, 0) / successful.length 
    : 0;
  
  console.log(`Analyzed: ${successful.length}/${barcodes.length} successful`);
  console.log(`Average TruScore: ${formatNumber(avgScore)}/100\n`);
  
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

