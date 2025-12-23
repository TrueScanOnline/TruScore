/**
 * CARE Pillar End-to-End Testing Script
 * Tests real-world barcodes with the new CARE Pillar implementation
 * 
 * Run with: npx ts-node scripts/test-care-pillar-e2e.ts
 */

import { calculateCarePillar } from '../src/lib/truscoreEngine/pillars/carePillar';
import { Product } from '../src/types/product';
import { fetchProduct } from '../src/services/productService';

// Real-world barcodes for testing
const TEST_BARCODES = [
  {
    barcode: '3017620422003', // Nutella (Ferrero/Nestlé) - Known for labor violations
    description: 'Nutella - Nestlé/Ferrero (labor violations, palm oil)',
    expectedIssues: ['Labor violations (Nestlé)', 'Palm oil concerns'],
  },
  {
    barcode: '7613034626844', // Kit Kat (Nestlé) - Known for labor violations
    description: 'Kit Kat - Nestlé (labor violations in cocoa supply chain)',
    expectedIssues: ['Labor violations (Nestlé)', 'Child labor in cocoa'],
  },
  {
    barcode: '7622210989848', // Oreo (Mondelez) - Known for palm oil and labor issues
    description: 'Oreo - Mondelez (palm oil, labor concerns)',
    expectedIssues: ['Palm oil', 'Labor concerns'],
  },
  {
    barcode: '5000159461125', // Dove Chocolate (Mars) - Known for labor violations
    description: 'Dove Chocolate - Mars (labor violations in cocoa)',
    expectedIssues: ['Labor violations (Mars)', 'Cocoa supply chain'],
  },
  {
    barcode: '8712561725035', // Ben & Jerry\'s (Unilever) - Good ethics but parent company issues
    description: 'Ben & Jerry\'s - Unilever parent (animal testing parent, but good product ethics)',
    expectedIssues: ['Parent company (Unilever) animal testing'],
  },
];

interface TestResult {
  barcode: string;
  description: string;
  productFound: boolean;
  careScore: number;
  careBreakdown: {
    base: number;
    certificationBonus: number;
    animalCrueltyPenalty: number;
    laborViolationPenalty: number;
    recallPenalty: number;
    brandOverlayPenalty: number;
  };
  adjustments: Array<{
    description: string;
    value: number;
    type: 'positive' | 'negative' | 'neutral';
  }>;
  issues: string[];
  dataAvailability: {
    hasLabels: boolean;
    hasBrands: boolean;
    hasRecalls: boolean;
    hasOrigin: boolean;
  };
}

/**
 * Test a single barcode
 */
async function testBarcode(barcode: string, description: string): Promise<TestResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${description}`);
  console.log(`Barcode: ${barcode}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // Fetch product data
    console.log('📦 Fetching product data...');
    const product = await fetchProduct(barcode);
    
    if (!product) {
      console.log('❌ Product not found');
      return {
        barcode,
        description,
        productFound: false,
        careScore: 0,
        careBreakdown: {
          base: 0,
          certificationBonus: 0,
          animalCrueltyPenalty: 0,
          laborViolationPenalty: 0,
          recallPenalty: 0,
          brandOverlayPenalty: 0,
        },
        adjustments: [],
        issues: ['Product not found'],
        dataAvailability: {
          hasLabels: false,
          hasBrands: false,
          hasRecalls: false,
          hasOrigin: false,
        },
      };
    }

    console.log(`✅ Product found: ${product.product_name || 'Unknown'}`);
    console.log(`   Brand: ${product.brands || 'Unknown'}`);
    console.log(`   Labels: ${product.labels_tags?.length || 0} labels`);
    console.log(`   Recalls: ${product.recalls?.length || 0} recalls`);
    console.log(`   Origin: ${product.origins || product.manufacturing_places || 'Unknown'}`);

    // Calculate CARE Pillar
    console.log('\n📊 Calculating CARE Pillar score...');
    const careResult = calculateCarePillar(product);

    // Extract issues
    const issues: string[] = [];
    if (careResult.details.animalCrueltyPenalty > 0) {
      issues.push(`Animal cruelty penalty: -${careResult.details.animalCrueltyPenalty}`);
    }
    if (careResult.details.laborViolationPenalty > 0) {
      issues.push(`Labor violation penalty: -${careResult.details.laborViolationPenalty}`);
    }
    if (careResult.details.recallPenalty > 0) {
      issues.push(`Recall penalty: -${careResult.details.recallPenalty}`);
    }
    if (careResult.details.brandOverlayPenalty > 0) {
      issues.push(`Brand overlay penalty: -${careResult.details.brandOverlayPenalty}`);
    }

    // Display results
    console.log('\n📈 CARE Pillar Results:');
    console.log(`   Base Score: ${careResult.base}`);
    console.log(`   Certification Bonus: +${careResult.details.certificationBonus}`);
    console.log(`   Animal Cruelty Penalty: -${careResult.details.animalCrueltyPenalty}`);
    console.log(`   Labor Violation Penalty: -${careResult.details.laborViolationPenalty}`);
    console.log(`   Recall Penalty: -${careResult.details.recallPenalty}`);
    console.log(`   Brand Overlay Penalty: -${careResult.details.brandOverlayPenalty}`);
    console.log(`   ─────────────────────────────────────────`);
    console.log(`   FINAL CARE SCORE: ${careResult.score}/25`);

    console.log('\n📋 Adjustments:');
    careResult.adjustments.forEach(adj => {
      const sign = adj.value >= 0 ? '+' : '';
      const icon = adj.type === 'positive' ? '✅' : adj.type === 'negative' ? '❌' : 'ℹ️';
      console.log(`   ${icon} ${adj.description}: ${sign}${adj.value}`);
    });

    return {
      barcode,
      description,
      productFound: true,
      careScore: careResult.score,
      careBreakdown: {
        base: careResult.base,
        certificationBonus: careResult.details.certificationBonus,
        animalCrueltyPenalty: careResult.details.animalCrueltyPenalty,
        laborViolationPenalty: careResult.details.laborViolationPenalty,
        recallPenalty: careResult.details.recallPenalty,
        brandOverlayPenalty: careResult.details.brandOverlayPenalty,
      },
      adjustments: careResult.adjustments,
      issues,
      dataAvailability: {
        hasLabels: (product.labels_tags?.length || 0) > 0,
        hasBrands: !!product.brands,
        hasRecalls: (product.recalls?.length || 0) > 0,
        hasOrigin: !!(product.origins || product.manufacturing_places),
      },
    };
  } catch (error) {
    console.error(`❌ Error testing barcode ${barcode}:`, error);
    return {
      barcode,
      description,
      productFound: false,
      careScore: 0,
      careBreakdown: {
        base: 0,
        certificationBonus: 0,
        animalCrueltyPenalty: 0,
        laborViolationPenalty: 0,
        recallPenalty: 0,
        brandOverlayPenalty: 0,
      },
      adjustments: [],
      issues: [`Error: ${error instanceof Error ? error.message : String(error)}`],
      dataAvailability: {
        hasLabels: false,
        hasBrands: false,
        hasRecalls: false,
        hasOrigin: false,
      },
    };
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 CARE Pillar End-to-End Testing');
  console.log('Testing real-world barcodes with new CARE Pillar implementation\n');

  const results: TestResult[] = [];

  for (const testCase of TEST_BARCODES) {
    const result = await testBarcode(testCase.barcode, testCase.description);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'='.repeat(80)}\n`);

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.description}`);
    console.log(`   Barcode: ${result.barcode}`);
    if (result.productFound) {
      console.log(`   ✅ Product found`);
      console.log(`   CARE Score: ${result.careScore}/25`);
      if (result.issues.length > 0) {
        console.log(`   Issues detected: ${result.issues.join(', ')}`);
      } else {
        console.log(`   ✅ No violations detected`);
      }
      console.log(`   Data: Labels=${result.dataAvailability.hasLabels ? '✅' : '❌'} Brands=${result.dataAvailability.hasBrands ? '✅' : '❌'} Recalls=${result.dataAvailability.hasRecalls ? '✅' : '❌'} Origin=${result.dataAvailability.hasOrigin ? '✅' : '❌'}`);
    } else {
      console.log(`   ❌ Product not found`);
    }
    console.log('');
  });

  // Issues summary
  const productsFound = results.filter(r => r.productFound).length;
  const productsWithViolations = results.filter(r => r.productFound && r.issues.length > 0).length;
  const averageScore = results
    .filter(r => r.productFound)
    .reduce((sum, r) => sum + r.careScore, 0) / productsFound || 0;

  console.log(`${'='.repeat(80)}`);
  console.log('📈 STATISTICS');
  console.log(`${'='.repeat(80)}`);
  console.log(`Products found: ${productsFound}/${TEST_BARCODES.length}`);
  console.log(`Products with violations: ${productsWithViolations}`);
  console.log(`Average CARE score: ${averageScore.toFixed(2)}/25`);
  console.log(`${'='.repeat(80)}\n`);

  return results;
}

// Run tests if executed directly
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('✅ Testing complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    });
}

export { runTests, testBarcode, TEST_BARCODES };
