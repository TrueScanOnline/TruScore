/**
 * Test Care Pillar Brand Overlay Tiered Penalties
 * 
 * Tests the fix for brand overlay penalties using tiered -4/-8/-15 instead of flat -3
 * 
 * Usage: npx ts-node scripts/testCarePillarBrandOverlay.ts
 */

/// <reference path="../global.d.ts" />

if (typeof (global as any).__DEV__ === 'undefined') {
  (global as any).__DEV__ = process.env.NODE_ENV !== 'production';
}

import { Product } from '../src/types/product';
import { calculateCarePillar } from '../src/lib/truscoreEngine/pillars/carePillar';
import { checkLaborViolations } from '../src/services/laborViolationsService';
import { checkAnimalCruelty } from '../src/services/animalCrueltyService';
import { getBrandData } from '../src/data/brandDatabase';

interface TestCase {
  name: string;
  product: Product;
  expectedOverlayPenalty: number;
  expectedSeverity: 'limited' | 'moderate' | 'major' | 'none';
  description: string;
}

// Test cases
const testCases: TestCase[] = [
  {
    name: 'Ben & Jerry\'s (Unilever Parent)',
    product: {
      barcode: '0768085120126',
      product_name: 'Ben & Jerry\'s Chocolate Fudge Brownie Ice Cream',
      brands: 'Ben & Jerry\'s',
      brand_owner: 'Unilever',
      labels_tags: ['en:fair-trade', 'en:organic', 'en:rspo'],
      ingredients_text: 'cream, sugar, cocoa, vanilla',
      nutriments: {},
      source: 'openfoodfacts',
    },
    expectedOverlayPenalty: 15, // Major labor violations (Unilever/Kenyan tea workers)
    expectedSeverity: 'major',
    description: 'Ethical product (Fairtrade + Organic) with Unilever parent having major labor violations',
  },
  {
    name: 'Kit Kat (Nestlé Parent)',
    product: {
      barcode: '7622210967162',
      product_name: 'Kit Kat Chocolate Bar',
      brands: 'Kit Kat',
      brand_owner: 'Nestlé',
      labels_tags: [],
      ingredients_text: 'sugar, cocoa, milk',
      nutriments: {},
      source: 'openfoodfacts',
    },
    expectedOverlayPenalty: 15, // Major labor violations (Nestlé/cocoa child labor)
    expectedSeverity: 'major',
    description: 'Product with Nestlé parent having major labor violations (cocoa child labor)',
  },
  {
    name: 'Product with Moderate Parent Violations',
    product: {
      barcode: 'TEST001',
      product_name: 'Test Product Moderate',
      brands: 'Test Brand',
      brand_owner: 'Moderate Violation Parent',
      labels_tags: [],
      ingredients_text: 'ingredients',
      nutriments: {},
      source: 'test',
    },
    expectedOverlayPenalty: 8, // Moderate violations
    expectedSeverity: 'moderate',
    description: 'Product with parent having moderate labor violations',
  },
  {
    name: 'Product with Limited Parent Violations',
    product: {
      barcode: 'TEST002',
      product_name: 'Test Product Limited',
      brands: 'Test Brand',
      brand_owner: 'Limited Violation Parent',
      labels_tags: [],
      ingredients_text: 'ingredients',
      nutriments: {},
      source: 'test',
    },
    expectedOverlayPenalty: 4, // Limited violations
    expectedSeverity: 'limited',
    description: 'Product with parent having limited labor violations',
  },
  {
    name: 'Product with No Parent Violations',
    product: {
      barcode: 'TEST003',
      product_name: 'Test Product Clean',
      brands: 'Test Brand',
      brand_owner: 'Clean Parent',
      labels_tags: [],
      ingredients_text: 'ingredients',
      nutriments: {},
      source: 'test',
    },
    expectedOverlayPenalty: 0, // No violations
    expectedSeverity: 'none',
    description: 'Product with parent having no violations',
  },
];

/**
 * Check Unilever data in brand database
 */
function checkUnileverData() {
  console.log('\n' + '='.repeat(60));
  console.log('CHECKING UNILEVER DATA IN BRAND DATABASE');
  console.log('='.repeat(60) + '\n');

  const unileverData = getBrandData('Unilever');
  
  if (!unileverData) {
    console.log('❌ Unilever NOT found in brand database');
    console.log('   Action: Add Unilever to brand database with labor violation data');
    return false;
  }

  console.log('✅ Unilever found in brand database');
  console.log(`   Name: ${unileverData.name}`);
  console.log(`   Parent Company: ${unileverData.parentCompany || 'N/A'}`);
  console.log(`   Labor Practices: ${unileverData.laborPractices || 'N/A'}`);
  console.log(`   Animal Testing: ${unileverData.animalTesting || false}`);
  console.log(`   Recall History: ${unileverData.recallHistory || false}`);
  console.log(`   Aliases: ${unileverData.aliases?.join(', ') || 'None'}`);

  // Check labor violations service
  console.log('\n   Checking labor violations service...');
  const testProduct: Product = {
    barcode: 'TEST',
    product_name: 'Test',
    brands: 'Unilever',
    source: 'test',
  };
  
  const laborData = checkLaborViolations(testProduct);
  console.log(`   Labor Violations Detected: ${laborData.hasViolations}`);
  console.log(`   Violation Type: ${laborData.violationType}`);
  console.log(`   Violations: ${laborData.violations.join(', ') || 'None'}`);
  console.log(`   Sources: ${laborData.sources.join(', ') || 'None'}`);

  // Check animal cruelty service
  console.log('\n   Checking animal cruelty service...');
  const animalData = checkAnimalCruelty(testProduct);
  console.log(`   Animal Cruelty Detected: ${animalData.hasViolations}`);
  console.log(`   Violation Type: ${animalData.violationType}`);
  console.log(`   Violations: ${animalData.violations.join(', ') || 'None'}`);

  return true;
}

/**
 * Test a single product
 */
function testProduct(testCase: TestCase): {
  passed: boolean;
  actualScore: number;
  actualOverlayPenalty: number;
  actualSeverity: string;
  details: any;
} {
  console.log(`\nTesting: ${testCase.name}`);
  console.log(`  Description: ${testCase.description}`);
  
  const result = calculateCarePillar(testCase.product);
  const actualOverlayPenalty = result.details.brandOverlayPenalty;
  
  // Determine actual severity from penalty
  let actualSeverity: string;
  if (actualOverlayPenalty === 15) {
    actualSeverity = 'major';
  } else if (actualOverlayPenalty === 8) {
    actualSeverity = 'moderate';
  } else if (actualOverlayPenalty === 4) {
    actualSeverity = 'limited';
  } else {
    actualSeverity = 'none';
  }

  const passed = 
    actualOverlayPenalty === testCase.expectedOverlayPenalty &&
    actualSeverity === testCase.expectedSeverity;

  console.log(`  Expected Overlay Penalty: -${testCase.expectedOverlayPenalty} (${testCase.expectedSeverity})`);
  console.log(`  Actual Overlay Penalty: -${actualOverlayPenalty} (${actualSeverity})`);
  console.log(`  Care Score: ${result.score}/25`);
  console.log(`  Base: ${result.base}`);
  console.log(`  Certification Bonus: +${result.details.certificationBonus}`);
  console.log(`  Animal Cruelty Penalty: -${result.details.animalCrueltyPenalty}`);
  console.log(`  Labor Violation Penalty: -${result.details.laborViolationPenalty}`);
  console.log(`  Recall Penalty: -${result.details.recallPenalty}`);
  console.log(`  Brand Overlay Penalty: -${result.details.brandOverlayPenalty}`);
  console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);

  if (!passed) {
    console.log(`  ⚠️  Mismatch: Expected ${testCase.expectedSeverity} (-${testCase.expectedOverlayPenalty}), got ${actualSeverity} (-${actualOverlayPenalty})`);
  }

  return {
    passed,
    actualScore: result.score,
    actualOverlayPenalty,
    actualSeverity,
    details: result.details,
  };
}

/**
 * Main test execution
 */
async function main() {
  console.log('🧪 Testing Care Pillar Brand Overlay Tiered Penalties\n');
  console.log('='.repeat(60));
  console.log('TEST SUITE: Brand Overlay Penalty Fix Verification');
  console.log('='.repeat(60));

  // Step 1: Check Unilever data
  const unileverFound = checkUnileverData();

  // Step 2: Run test cases
  console.log('\n' + '='.repeat(60));
  console.log('RUNNING TEST CASES');
  console.log('='.repeat(60));

  const results = testCases.map(testCase => ({
    testCase,
    result: testProduct(testCase),
  }));

  // Step 3: Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.result.passed).length;
  const failed = results.filter(r => !r.result.passed).length;
  const total = results.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);

  // Detailed results
  console.log('\nDetailed Results:');
  results.forEach(({ testCase, result }) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`  ${status} ${testCase.name}:`);
    console.log(`     Expected: -${testCase.expectedOverlayPenalty} (${testCase.expectedSeverity})`);
    console.log(`     Actual: -${result.actualOverlayPenalty} (${result.actualSeverity})`);
    console.log(`     Care Score: ${result.actualScore}/25`);
  });

  // Ben & Jerry's specific analysis
  const benJerrysResult = results.find(r => r.testCase.name.includes('Ben & Jerry'));
  if (benJerrysResult) {
    console.log('\n' + '='.repeat(60));
    console.log('BEN & JERRY\'S SPECIFIC ANALYSIS');
    console.log('='.repeat(60));
    console.log(`\nExpected Score: 10/25 (25 base + 15 certs - 15 overlay)`);
    console.log(`Actual Score: ${benJerrysResult.result.actualScore}/25`);
    console.log(`Brand Overlay Penalty: -${benJerrysResult.result.actualOverlayPenalty}`);
    
    if (benJerrysResult.result.actualOverlayPenalty === 15) {
      console.log('\n✅ SUCCESS: Ben & Jerry\'s correctly receives -15 brand overlay penalty');
      console.log('   This reflects Unilever\'s major labor violations (Kenyan tea workers)');
    } else if (benJerrysResult.result.actualOverlayPenalty === 3) {
      console.log('\n❌ FAILURE: Still using legacy -3 penalty');
      console.log('   Fix may not be applied or Unilever data not detected');
    } else if (benJerrysResult.result.actualOverlayPenalty === 0) {
      console.log('\n⚠️  WARNING: No brand overlay penalty applied');
      console.log('   Possible reasons:');
      console.log('   - Unilever not detected as parent company');
      console.log('   - Unilever labor violations not in database');
      console.log('   - Mutually exclusive logic preventing overlay');
    } else {
      console.log(`\n⚠️  WARNING: Unexpected penalty: -${benJerrysResult.result.actualOverlayPenalty}`);
      console.log('   Expected -15 for major violations');
    }
  }

  // Unilever data status
  console.log('\n' + '='.repeat(60));
  console.log('UNILEVER DATA STATUS');
  console.log('='.repeat(60));
  
  if (!unileverFound) {
    console.log('\n❌ Unilever NOT in brand database');
    console.log('   Action Required: Add Unilever with labor violation data');
    console.log('   This is needed for Ben & Jerry\'s to receive correct penalty');
  } else {
    console.log('\n✅ Unilever found in brand database');
    console.log('   Verify labor violation data is correct for Kenyan tea workers issue');
  }

  // Recommendations
  console.log('\n' + '='.repeat(60));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(60));
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check:');
    console.log('   1. Brand database has correct violation data');
    console.log('   2. Labor violations service detects violations correctly');
    console.log('   3. Parent company is correctly identified');
  }
  
  if (!unileverFound || benJerrysResult?.result.actualOverlayPenalty !== 15) {
    console.log('\n📝 For Ben & Jerry\'s to work correctly:');
    console.log('   1. Ensure Unilever is in brand database');
    console.log('   2. Set laborPractices: "poor" for Unilever');
    console.log('   3. Add Unilever to MAJOR_LABOR_VIOLATION_BRANDS if needed');
    console.log('   4. Verify parent company detection works (Ben & Jerry\'s → Unilever)');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Test Complete!');
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
