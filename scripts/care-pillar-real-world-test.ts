/**
 * CARE Pillar Real-World Barcode Testing
 * Tests 5 specific real-world barcodes with new CARE Pillar implementation
 * 
 * Run with: npx ts-node scripts/care-pillar-real-world-test.ts
 */

import { calculateEthicsPillar } from '../src/lib/truscoreEngine/pillars/ethicsPillar';
import { calculateTruScore } from '../src/lib/truscoreEngine';
import { Product } from '../src/types/product';
import { fetchProduct } from '../src/services/productService';

// Real-world barcodes that will be affected by CARE Pillar changes
const REAL_WORLD_TEST_CASES = [
  {
    barcode: '3017620422003', // Nutella (Ferrero) - Known for palm oil and labor issues
    description: 'Nutella Hazelnut Spread - Ferrero (Nestlé-related)',
    expectedChanges: [
      'Labor violations (Nestlé/Ferrero cocoa supply chain)',
      'Palm oil concerns',
      'Possible DOL violations (cocoa from West Africa)',
    ],
  },
  {
    barcode: '7613034626844', // Kit Kat (Nestlé) - Known for labor violations
    description: 'Kit Kat Chocolate Bar - Nestlé',
    expectedChanges: [
      'Major labor violations (Nestlé cocoa supply chain)',
      'Child labor in cocoa (DOL data)',
      'Walk Free GSI violations (West Africa)',
    ],
  },
  {
    barcode: '7622210989848', // Oreo (Mondelez) - Known for palm oil
    description: 'Oreo Cookies - Mondelez',
    expectedChanges: [
      'Palm oil concerns',
      'Labor concerns (Mondelez)',
    ],
  },
  {
    barcode: '5000159461125', // Dove Chocolate (Mars) - Known for labor violations
    description: 'Dove Chocolate Bar - Mars',
    expectedChanges: [
      'Labor violations (Mars cocoa supply chain)',
      'DOL violations (cocoa)',
    ],
  },
  {
    barcode: '8712561725035', // Ben & Jerry's (Unilever parent) - Good product, bad parent
    description: 'Ben & Jerry\'s Ice Cream - Unilever Parent',
    expectedChanges: [
      'Brand overlay penalty (Unilever animal testing)',
      'Mutually exclusive logic test (product itself is ethical)',
    ],
  },
];

interface TestResult {
  barcode: string;
  description: string;
  productFound: boolean;
  productName?: string;
  brand?: string;
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
  totalTruScore: number;
  truScoreBreakdown: {
    Body: number;
    Planet: number;
    Care: number;
    Open: number;
  };
  issues: string[];
  dataAvailability: {
    hasLabels: boolean;
    labelsCount: number;
    hasBrands: boolean;
    hasRecalls: boolean;
    recallsCount: number;
    hasOrigin: boolean;
    origin?: string;
  };
  databaseIssues: string[];
}

/**
 * Test a single barcode with detailed analysis
 */
async function testBarcodeDetailed(barcode: string, description: string, expectedChanges: string[]): Promise<TestResult> {
  console.log(`\n${'='.repeat(100)}`);
  console.log(`🧪 TESTING: ${description}`);
  console.log(`📦 Barcode: ${barcode}`);
  console.log(`${'='.repeat(100)}\n`);

  const databaseIssues: string[] = [];
  let product: Product | null = null;

  try {
    // Fetch product data
    console.log('📡 Fetching product data from databases...');
    const startTime = Date.now();
    product = await fetchProduct(barcode);
    const fetchTime = Date.now() - startTime;

    if (!product) {
      console.log('❌ Product not found in any database');
      databaseIssues.push('Product not found - may need to check database coverage');
      return createEmptyResult(barcode, description, databaseIssues);
    }

    console.log(`✅ Product found (${fetchTime}ms)`);
    console.log(`   Name: ${product.product_name || 'Unknown'}`);
    console.log(`   Brand: ${product.brands || 'Unknown'}`);
    console.log(`   Labels: ${product.labels_tags?.length || 0} certifications`);
    console.log(`   Recalls: ${product.recalls?.length || 0} recalls`);
    console.log(`   Origin: ${product.origins || product.manufacturing_places || 'Unknown'}`);
    console.log(`   Categories: ${product.categories || 'Unknown'}`);

    // Check data availability
    const hasLabels = (product.labels_tags?.length || 0) > 0;
    const hasRecalls = (product.recalls?.length || 0) > 0;
    const hasOrigin = !!(product.origins || product.manufacturing_places);

    if (!hasLabels) {
      databaseIssues.push('No certification labels found - may affect certification scoring');
    }
    if (!hasRecalls) {
      console.log('   ⚠️  No recalls data - recall penalties will not apply');
    }
    if (!hasOrigin) {
      databaseIssues.push('No origin data - DOL/Walk Free country-based checks may not work');
    }

    // Calculate CARE Pillar
    console.log('\n📊 Calculating CARE Pillar score...');
    const careResult = calculateEthicsPillar(product);

    // Calculate full TruScore for context
    const truScoreResult = calculateTruScore(product);

    // Extract issues
    const issues: string[] = [];
    if (careResult.details.animalCrueltyPenalty > 0) {
      const penaltyType = careResult.details.animalCrueltyPenalty === 15 ? 'Major' :
                         careResult.details.animalCrueltyPenalty === 8 ? 'Moderate' : 'Limited';
      issues.push(`${penaltyType} Animal Cruelty: -${careResult.details.animalCrueltyPenalty}`);
    }
    if (careResult.details.laborViolationPenalty > 0) {
      const penaltyType = careResult.details.laborViolationPenalty === 15 ? 'Major' :
                         careResult.details.laborViolationPenalty === 8 ? 'Moderate' : 'Limited';
      issues.push(`${penaltyType} Labor Violation: -${careResult.details.laborViolationPenalty}`);
    }
    if (careResult.details.recallPenalty > 0) {
      const recallClass = careResult.details.recallPenalty === 15 ? 'Class I' :
                          careResult.details.recallPenalty === 8 ? 'Class II' : 'Class III';
      issues.push(`Recall (${recallClass}): -${careResult.details.recallPenalty}`);
    }
    if (careResult.details.brandOverlayPenalty > 0) {
      issues.push(`Brand Overlay: -${careResult.details.brandOverlayPenalty}`);
    }

    // Display detailed results
    console.log('\n📈 CARE Pillar Detailed Breakdown:');
    console.log(`   Base Score: ${careResult.base}`);
    console.log(`   Certification Bonus: +${careResult.details.certificationBonus} (capped at +15)`);
    console.log(`   Animal Cruelty Penalty: -${careResult.details.animalCrueltyPenalty}`);
    console.log(`   Labor Violation Penalty: -${careResult.details.laborViolationPenalty}`);
    console.log(`   Recall Penalty: -${careResult.details.recallPenalty}`);
    console.log(`   Brand Overlay Penalty: -${careResult.details.brandOverlayPenalty}`);
    console.log(`   ─────────────────────────────────────────`);
    console.log(`   FINAL CARE SCORE: ${careResult.score}/25`);

    console.log('\n📋 All Adjustments:');
    careResult.adjustments.forEach((adj, idx) => {
      const sign = adj.value >= 0 ? '+' : '';
      const icon = adj.type === 'positive' ? '✅' : adj.type === 'negative' ? '❌' : 'ℹ️';
      console.log(`   ${idx + 1}. ${icon} ${adj.description}: ${sign}${adj.value}`);
    });

    console.log('\n🎯 Full TruScore Context:');
    console.log(`   Body: ${truScoreResult.breakdown.Body}/25`);
    console.log(`   Planet: ${truScoreResult.breakdown.Planet}/25`);
    console.log(`   Care: ${truScoreResult.breakdown.Care}/25`);
    console.log(`   Open: ${truScoreResult.breakdown.Open}/25`);
    console.log(`   ─────────────────────────────────────────`);
    console.log(`   TOTAL TRUSCORE: ${truScoreResult.truscore}/100`);

    // Compare with expected changes
    if (expectedChanges.length > 0) {
      console.log('\n🔍 Expected Changes Analysis:');
      expectedChanges.forEach(expected => {
        const found = issues.some(issue => issue.toLowerCase().includes(expected.toLowerCase().split(' ')[0]));
        console.log(`   ${found ? '✅' : '⚠️'} ${expected} ${found ? '(detected)' : '(not detected - may need data)'}`);
        if (!found) {
          databaseIssues.push(`Expected issue not detected: ${expected}`);
        }
      });
    }

    return {
      barcode,
      description,
      productFound: true,
      productName: product.product_name,
      brand: product.brands,
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
      totalTruScore: truScoreResult.truscore,
      truScoreBreakdown: truScoreResult.breakdown,
      issues,
      dataAvailability: {
        hasLabels,
        labelsCount: product.labels_tags?.length || 0,
        hasBrands: !!product.brands,
        hasRecalls,
        recallsCount: product.recalls?.length || 0,
        hasOrigin,
        origin: product.origins || product.manufacturing_places,
      },
      databaseIssues,
    };
  } catch (error) {
    console.error(`❌ Error testing barcode ${barcode}:`, error);
    databaseIssues.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return createEmptyResult(barcode, description, databaseIssues);
  }
}

function createEmptyResult(barcode: string, description: string, databaseIssues: string[]): TestResult {
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
    totalTruScore: 0,
    truScoreBreakdown: { Body: 0, Planet: 0, Care: 0, Open: 0 },
    issues: [],
    dataAvailability: {
      hasLabels: false,
      labelsCount: 0,
      hasBrands: false,
      hasRecalls: false,
      recallsCount: 0,
      hasOrigin: false,
    },
    databaseIssues,
  };
}

/**
 * Main test runner
 */
async function runRealWorldTests() {
  console.log('🧪 CARE Pillar Real-World Barcode Testing');
  console.log('Testing 5 specific barcodes with new CARE Pillar implementation\n');
  console.log('This will test:');
  console.log('  ✅ 3-tier violation systems (Limited/Moderate/Major)');
  console.log('  ✅ 3-tier recall system (Class I/II/III)');
  console.log('  ✅ 3-month recall window');
  console.log('  ✅ Mutually exclusive brand overlay logic');
  console.log('  ✅ DOL, Walk Free, BBFAW integrations');
  console.log('  ✅ New certifications (Ocean Wise, Friend of the Sea, GlobalG.A.P)');
  console.log('  ✅ Refined animal welfare certifications\n');

  const results: TestResult[] = [];

  for (const testCase of REAL_WORLD_TEST_CASES) {
    const result = await testBarcodeDetailed(
      testCase.barcode,
      testCase.description,
      testCase.expectedChanges
    );
    results.push(result);
    
    // Delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Generate comprehensive summary
  generateSummary(results);

  return results;
}

/**
 * Generate comprehensive test summary
 */
function generateSummary(results: TestResult[]) {
  console.log(`\n${'='.repeat(100)}`);
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log(`${'='.repeat(100)}\n`);

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.description}`);
    console.log(`   Barcode: ${result.barcode}`);
    
    if (result.productFound) {
      console.log(`   ✅ Product: ${result.productName || 'Unknown'}`);
      console.log(`   ✅ Brand: ${result.brand || 'Unknown'}`);
      console.log(`   📊 CARE Score: ${result.careScore}/25`);
      console.log(`   📊 Total TruScore: ${result.totalTruScore}/100`);
      console.log(`   📊 Breakdown: Body=${result.truScoreBreakdown.Body} Planet=${result.truScoreBreakdown.Planet} Care=${result.careScore} Open=${result.truScoreBreakdown.Open}`);
      
      if (result.issues.length > 0) {
        console.log(`   ⚠️  Issues Detected:`);
        result.issues.forEach(issue => console.log(`      • ${issue}`));
      } else {
        console.log(`   ✅ No violations detected`);
      }
      
      console.log(`   📦 Data Availability:`);
      console.log(`      • Labels: ${result.dataAvailability.hasLabels ? `✅ (${result.dataAvailability.labelsCount})` : '❌'}`);
      console.log(`      • Brands: ${result.dataAvailability.hasBrands ? '✅' : '❌'}`);
      console.log(`      • Recalls: ${result.dataAvailability.hasRecalls ? `✅ (${result.dataAvailability.recallsCount})` : '❌'}`);
      console.log(`      • Origin: ${result.dataAvailability.hasOrigin ? `✅ (${result.dataAvailability.origin})` : '❌'}`);
      
      if (result.databaseIssues.length > 0) {
        console.log(`   ⚠️  Database Issues:`);
        result.databaseIssues.forEach(issue => console.log(`      • ${issue}`));
      }
    } else {
      console.log(`   ❌ Product not found`);
      if (result.databaseIssues.length > 0) {
        console.log(`   ⚠️  Issues:`);
        result.databaseIssues.forEach(issue => console.log(`      • ${issue}`));
      }
    }
    console.log('');
  });

  // Statistics
  const productsFound = results.filter(r => r.productFound).length;
  const productsWithViolations = results.filter(r => r.productFound && r.issues.length > 0).length;
  const averageCareScore = results
    .filter(r => r.productFound)
    .reduce((sum, r) => sum + r.careScore, 0) / productsFound || 0;
  const averageTruScore = results
    .filter(r => r.productFound)
    .reduce((sum, r) => sum + r.totalTruScore, 0) / productsFound || 0;

  console.log(`${'='.repeat(100)}`);
  console.log('📈 STATISTICS');
  console.log(`${'='.repeat(100)}`);
  console.log(`Products found: ${productsFound}/${REAL_WORLD_TEST_CASES.length}`);
  console.log(`Products with violations: ${productsWithViolations}`);
  console.log(`Average CARE score: ${averageCareScore.toFixed(2)}/25`);
  console.log(`Average TruScore: ${averageTruScore.toFixed(2)}/100`);
  console.log(`${'='.repeat(100)}\n`);

  // Database Issues Summary
  const allDatabaseIssues = results.flatMap(r => r.databaseIssues);
  if (allDatabaseIssues.length > 0) {
    console.log(`${'='.repeat(100)}`);
    console.log('⚠️  DATABASE ACCESS & DATA RETRIEVAL ISSUES');
    console.log(`${'='.repeat(100)}\n`);
    
    const uniqueIssues = Array.from(new Set(allDatabaseIssues));
    uniqueIssues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue}`);
    });
    
    console.log(`\n💡 Recommendations:`);
    console.log(`   • Ensure product data includes origin/country information for DOL/Walk Free checks`);
    console.log(`   • Verify recall data includes FDA Class I/II/III classification`);
    console.log(`   • Check that brand names match database entries for violation detection`);
    console.log(`   • Consider enhancing product data with country codes for better matching`);
    console.log(`${'='.repeat(100)}\n`);
  } else {
    console.log(`✅ No database access issues detected\n`);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runRealWorldTests()
    .then(() => {
      console.log('✅ Testing complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    });
}

export { runRealWorldTests, testBarcodeDetailed, REAL_WORLD_TEST_CASES };
