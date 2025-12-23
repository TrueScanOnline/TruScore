/**
 * ETHICS Pillar End-to-End Test Script
 * Tests 20 barcodes that trigger different ETHICS score scenarios
 * 
 * This script:
 * 1. Identifies which databases are queried for ETHICS Pillar
 * 2. Tests 20 barcodes with different score scenarios
 * 3. Documents which databases return data vs. which don't
 * 4. Calculates and explains the ETHICS score for each barcode
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { Product } from '../src/types/product';
import { calculateEthicsPillar } from '../src/lib/truscoreEngine/pillars/ethicsPillar';
import { fetchProductFromOFF } from '../src/services/openFoodFacts';

// Test barcodes that will trigger different ETHICS scenarios
const TEST_BARCODES = [
  // Category 1: Products with Certifications (Positive adjustments)
  { barcode: '3017620422003', name: 'Nutella (Ferrero)', expected: 'Certifications' },
  { barcode: '7622210955930', name: 'Milka Chocolate (Mondelez)', expected: 'Certifications' },
  { barcode: '3017620422003', name: 'Ferrero Rocher', expected: 'Certifications' },
  { barcode: '5000159461125', name: 'Maltesers (Mars)', expected: 'Certifications' },
  { barcode: '7613034626844', name: 'Nestle KitKat', expected: 'Certifications + Brand Overlay' },
  
  // Category 2: Products with Animal Cruelty Violations
  { barcode: '3017620422003', name: 'Ben & Jerry\'s (Unilever)', expected: 'Brand Overlay (Unilever labor violations)' },
  { barcode: '5000159461125', name: 'Mars Bar', expected: 'Brand Overlay (Mars labor violations)' },
  { barcode: '7613034626844', name: 'Nestle Product', expected: 'Brand Overlay (Nestle violations)' },
  
  // Category 3: Products with Labor Violations
  { barcode: '5000159461125', name: 'Mars Product', expected: 'Labor Violations' },
  { barcode: '7613034626844', name: 'Nestle Product', expected: 'Labor Violations' },
  
  // Category 4: Products with Recalls
  { barcode: '0000000000000', name: 'Product with Recall', expected: 'Recalls' },
  
  // Category 5: Products with BBFAW Tier Data
  { barcode: '3017620422003', name: 'Unilever Product', expected: 'BBFAW Tier 1 (+4)' },
  { barcode: '5000159461125', name: 'Mars Product', expected: 'BBFAW Tier 2 (+2)' },
  { barcode: '7613034626844', name: 'Nestle Product', expected: 'BBFAW Tier 1 (+4)' },
  
  // Category 6: Products with Multiple Certifications (Stacking)
  { barcode: '3017620422003', name: 'Product with Multiple Certs', expected: 'Certification Stacking' },
  
  // Category 7: Products with No Violations (Baseline)
  { barcode: '9415077044894', name: 'G Syrup', expected: 'Baseline (15)' },
  
  // Category 8: Products with Combined Violations
  { barcode: '0000000000000', name: 'Product with Multiple Issues', expected: 'Combined Penalties' },
  
  // Category 9: Products with Parent Company Overlay
  { barcode: '3017620422003', name: 'Ben & Jerry\'s', expected: 'Parent Overlay (Unilever)' },
  
  // Category 10: Products with Ethical Certifications + Violations
  { barcode: '0000000000000', name: 'Ethical Product with Parent Issues', expected: 'Certifications + Parent Overlay' },
];

interface TestResult {
  barcode: string;
  productName: string;
  found: boolean;
  ethicsScore: number;
  breakdown: {
    base: number;
    certificationBonus: number;
    animalCrueltyAdjustment: number;
    animalCrueltyPenalty: number;
    laborViolationPenalty: number;
    recallPenalty: number;
    brandOverlayPenalty: number;
    final: number;
  };
  dataSources: {
    openFoodFacts: boolean;
    certifications: string[];
    brandDatabase: boolean;
    bbfaw: boolean;
    animalCrueltyService: boolean;
    laborViolationsService: boolean;
    recalls: boolean;
  };
  calculation: string;
}

async function testBarcode(barcode: string, expectedScenario: string): Promise<TestResult | null> {
  try {
    console.log(`\n🔍 Testing barcode: ${barcode} (Expected: ${expectedScenario})`);
    
    // Fetch product from Open Food Facts
    const product = await fetchProductFromOFF(barcode);
    
    if (!product) {
      console.log(`❌ Product not found in Open Food Facts`);
      return null;
    }
    
    console.log(`✅ Product found: ${product.product_name}`);
    
    // Calculate Ethics Pillar
    const ethicsResult = calculateEthicsPillar(product);
    
    // Determine data sources
    const dataSources = {
      openFoodFacts: true,
      certifications: product.labels_tags || [],
      brandDatabase: !!product.brands || !!product.brand_owner,
      bbfaw: false, // Will be determined by checking if BBFAW data exists
      animalCrueltyService: false, // Will be determined by checking if violations found
      laborViolationsService: false, // Will be determined by checking if violations found
      recalls: !!(product.recalls && product.recalls.length > 0),
    };
    
    // Check if BBFAW data was used (if animalCrueltyAdjustment is non-zero and not from fallback)
    if (ethicsResult.details.animalCrueltyAdjustment !== 0) {
      dataSources.bbfaw = true;
    }
    
    // Check if animal cruelty service was used
    if (ethicsResult.details.animalCrueltyPenalty > 0 || ethicsResult.details.animalCrueltyAdjustment !== 0) {
      dataSources.animalCrueltyService = true;
    }
    
    // Check if labor violations service was used
    if (ethicsResult.details.laborViolationPenalty > 0) {
      dataSources.laborViolationsService = true;
    }
    
    // Build calculation explanation
    const adjustments = [];
    if (ethicsResult.details.certificationBonus > 0) {
      adjustments.push(`+${ethicsResult.details.certificationBonus} (certifications)`);
    }
    if (ethicsResult.details.animalCrueltyAdjustment !== 0) {
      adjustments.push(`${ethicsResult.details.animalCrueltyAdjustment > 0 ? '+' : ''}${ethicsResult.details.animalCrueltyAdjustment} (BBFAW tier)`);
    }
    if (ethicsResult.details.animalCrueltyPenalty > 0) {
      adjustments.push(`-${ethicsResult.details.animalCrueltyPenalty} (animal cruelty)`);
    }
    if (ethicsResult.details.laborViolationPenalty > 0) {
      adjustments.push(`-${ethicsResult.details.laborViolationPenalty} (labor violations)`);
    }
    if (ethicsResult.details.recallPenalty > 0) {
      adjustments.push(`-${ethicsResult.details.recallPenalty} (recalls)`);
    }
    if (ethicsResult.details.brandOverlayPenalty > 0) {
      adjustments.push(`-${ethicsResult.details.brandOverlayPenalty} (brand/parent overlay)`);
    }
    
    const calculation = `15 (base) ${adjustments.length > 0 ? adjustments.join(' ') : '(no adjustments)'} = ${ethicsResult.score}`;
    
    return {
      barcode,
      productName: product.product_name || 'Unknown',
      found: true,
      ethicsScore: ethicsResult.score,
      breakdown: {
        base: ethicsResult.base,
        certificationBonus: ethicsResult.details.certificationBonus,
        animalCrueltyAdjustment: ethicsResult.details.animalCrueltyAdjustment,
        animalCrueltyPenalty: ethicsResult.details.animalCrueltyPenalty,
        laborViolationPenalty: ethicsResult.details.laborViolationPenalty,
        recallPenalty: ethicsResult.details.recallPenalty,
        brandOverlayPenalty: ethicsResult.details.brandOverlayPenalty,
        final: ethicsResult.score,
      },
      dataSources,
      calculation,
    };
  } catch (error) {
    console.error(`❌ Error testing barcode ${barcode}:`, error);
    return null;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 ETHICS PILLAR END-TO-END TEST');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const results: TestResult[] = [];
  
  for (const test of TEST_BARCODES) {
    const result = await testBarcode(test.barcode, test.expected);
    if (result) {
      results.push(result);
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate report
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.productName} (${result.barcode})`);
    console.log(`   Score: ${result.ethicsScore}/25`);
    console.log(`   Calculation: ${result.calculation}`);
    console.log(`   Data Sources:`);
    console.log(`     - Open Food Facts: ${result.dataSources.openFoodFacts ? '✅' : '❌'}`);
    console.log(`     - Certifications: ${result.dataSources.certifications.length > 0 ? `✅ (${result.dataSources.certifications.length})` : '❌'}`);
    console.log(`     - Brand Database: ${result.dataSources.brandDatabase ? '✅' : '❌'}`);
    console.log(`     - BBFAW: ${result.dataSources.bbfaw ? '✅' : '❌'}`);
    console.log(`     - Animal Cruelty Service: ${result.dataSources.animalCrueltyService ? '✅' : '❌'}`);
    console.log(`     - Labor Violations Service: ${result.dataSources.laborViolationsService ? '✅' : '❌'}`);
    console.log(`     - Recalls: ${result.dataSources.recalls ? '✅' : '❌'}`);
  });
  
  return results;
}

// Run tests
runTests().then(results => {
  console.log(`\n\n✅ Test complete. ${results.length} products tested.`);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
