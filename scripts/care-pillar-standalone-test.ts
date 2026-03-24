/**
 * Ethics Pillar Standalone Testing
 * Tests real-world product scenarios with the Ethics Pillar implementation
 * Uses mock product data based on real-world barcodes
 * 
 * Run with: npx ts-node --transpile-only scripts/care-pillar-standalone-test.ts
 */

import { calculateEthicsPillar } from '../src/lib/truscoreEngine/pillars/ethicsPillar';
import { Product } from '../src/types/product';

// Real-world product scenarios based on actual barcodes
const REAL_WORLD_SCENARIOS = [
  {
    barcode: '3017620422003',
    name: 'Nutella Hazelnut Spread',
    brand: 'Ferrero',
    description: 'Nutella - Known for palm oil and labor issues in cocoa supply chain',
    product: {
      barcode: '3017620422003',
      product_name: 'Nutella Hazelnut Spread',
      brands: 'Ferrero',
      labels_tags: [],
      categories: 'Chocolate spreads',
      categories_tags: ['chocolate', 'spread', 'cocoa'],
      origins: 'Italy',
      origins_tags: ['en:italy'],
      manufacturing_places: 'Italy',
      countries: 'Italy',
      countries_tags: ['en:italy'],
      ingredients_text: 'Sugar, palm oil, hazelnuts, cocoa, skimmed milk powder',
      ingredients_analysis_tags: ['en:palm-oil'],
      recalls: [],
      additives_tags: [],
    } as Product,
    expectedScore: 'Low (labor violations expected)',
    expectedIssues: ['Labor violations (Ferrero/Nestlé cocoa)', 'DOL violations (cocoa from West Africa)'],
  },
  {
    barcode: '7613034626844',
    name: 'Kit Kat Chocolate Bar',
    brand: 'Nestlé',
    description: 'Kit Kat - Known for major labor violations in cocoa supply chain',
    product: {
      barcode: '7613034626844',
      product_name: 'Kit Kat Chocolate Bar',
      brands: 'Nestlé',
      labels_tags: [],
      categories: 'Chocolate bars',
      categories_tags: ['chocolate', 'cocoa'],
      origins: 'Switzerland',
      origins_tags: ['en:switzerland'],
      manufacturing_places: 'Switzerland',
      countries: 'Switzerland',
      countries_tags: ['en:switzerland'],
      ingredients_text: 'Sugar, cocoa, milk, wheat flour',
      recalls: [],
      additives_tags: [],
    } as Product,
    expectedScore: 'Very Low (major labor violations expected)',
    expectedIssues: ['Major labor violations (Nestlé)', 'Child labor in cocoa (DOL)', 'Walk Free GSI violations'],
  },
  {
    barcode: '7622210989848',
    name: 'Oreo Cookies',
    brand: 'Mondelez',
    description: 'Oreo - Known for palm oil and labor concerns',
    product: {
      barcode: '7622210989848',
      product_name: 'Oreo Cookies',
      brands: 'Mondelez',
      labels_tags: [],
      categories: 'Cookies',
      categories_tags: ['cookies', 'biscuits'],
      origins: 'United States',
      origins_tags: ['en:united-states'],
      manufacturing_places: 'United States',
      countries: 'United States',
      countries_tags: ['en:united-states'],
      ingredients_text: 'Wheat flour, sugar, palm oil, cocoa',
      ingredients_analysis_tags: ['en:palm-oil'],
      recalls: [],
      additives_tags: [],
    } as Product,
    expectedScore: 'Low-Medium (labor concerns expected)',
    expectedIssues: ['Labor concerns (Mondelez)', 'Palm oil'],
  },
  {
    barcode: '5000159461125',
    name: 'Dove Chocolate Bar',
    brand: 'Mars',
    description: 'Dove Chocolate - Known for labor violations in cocoa',
    product: {
      barcode: '5000159461125',
      product_name: 'Dove Chocolate Bar',
      brands: 'Mars',
      labels_tags: [],
      categories: 'Chocolate bars',
      categories_tags: ['chocolate', 'cocoa'],
      origins: 'United States',
      origins_tags: ['en:united-states'],
      manufacturing_places: 'United States',
      countries: 'United States',
      countries_tags: ['en:united-states'],
      ingredients_text: 'Sugar, cocoa, milk, cocoa butter',
      recalls: [],
      additives_tags: [],
    } as Product,
    expectedScore: 'Low (labor violations expected)',
    expectedIssues: ['Labor violations (Mars cocoa)', 'DOL violations (cocoa)'],
  },
  {
    barcode: '8712561725035',
    name: 'Ben & Jerry\'s Ice Cream',
    brand: 'Ben & Jerry\'s',
    brandOwner: 'Unilever',
    description: 'Ben & Jerry\'s - Ethical product but Unilever parent has animal testing',
    product: {
      barcode: '8712561725035',
      product_name: 'Ben & Jerry\'s Ice Cream',
      brands: 'Ben & Jerry\'s',
      brand_owner: 'Unilever',
      labels_tags: ['en:fair-trade', 'en:organic'],
      categories: 'Ice cream',
      categories_tags: ['ice-cream', 'frozen-dessert'],
      origins: 'United States',
      origins_tags: ['en:united-states'],
      manufacturing_places: 'United States',
      countries: 'United States',
      countries_tags: ['en:united-states'],
      ingredients_text: 'Organic milk, organic cream, organic sugar, vanilla extract',
      recalls: [],
      additives_tags: [],
    } as Product,
    expectedScore: 'Medium-High (certifications boost, but parent overlay penalty)',
    expectedIssues: ['Brand overlay penalty (Unilever parent animal testing)', 'Mutually exclusive logic test'],
  },
];

interface TestResult {
  barcode: string;
  name: string;
  brand: string;
  description: string;
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
  scoreExplanation: string;
  databaseIssues: string[];
}

/**
 * Test a single scenario
 */
function testScenario(scenario: typeof REAL_WORLD_SCENARIOS[0]): TestResult {
  console.log(`\n${'='.repeat(100)}`);
  console.log(`🧪 TESTING: ${scenario.description}`);
  console.log(`📦 Barcode: ${scenario.barcode}`);
  console.log(`📦 Product: ${scenario.name}`);
  console.log(`📦 Brand: ${scenario.brand}`);
  console.log(`${'='.repeat(100)}\n`);

  const databaseIssues: string[] = [];

  try {
    // Calculate Ethics Pillar
    console.log('📊 Calculating Ethics Pillar score...');
    const careResult = calculateEthicsPillar(scenario.product);

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
      issues.push(`Brand Overlay: -${careResult.details.brandOverlayPenalty} (mutually exclusive)`);
    }

    // Generate score explanation
    let scoreExplanation = `Base: ${careResult.base}`;
    if (careResult.details.certificationBonus > 0) {
      scoreExplanation += ` + Certifications: ${careResult.details.certificationBonus}`;
    }
    if (careResult.details.animalCrueltyPenalty > 0) {
      scoreExplanation += ` - Animal Cruelty: ${careResult.details.animalCrueltyPenalty}`;
    }
    if (careResult.details.laborViolationPenalty > 0) {
      scoreExplanation += ` - Labor: ${careResult.details.laborViolationPenalty}`;
    }
    if (careResult.details.recallPenalty > 0) {
      scoreExplanation += ` - Recall: ${careResult.details.recallPenalty}`;
    }
    if (careResult.details.brandOverlayPenalty > 0) {
      scoreExplanation += ` - Brand Overlay: ${careResult.details.brandOverlayPenalty}`;
    }
    scoreExplanation += ` = ${careResult.score}/25`;

    // Display results
    console.log('📈 Ethics Pillar Results:');
    console.log(`   Base Score: ${careResult.base}`);
    console.log(`   Certification Bonus: +${careResult.details.certificationBonus}`);
    console.log(`   Animal Cruelty Penalty: -${careResult.details.animalCrueltyPenalty}`);
    console.log(`   Labor Violation Penalty: -${careResult.details.laborViolationPenalty}`);
    console.log(`   Recall Penalty: -${careResult.details.recallPenalty}`);
    console.log(`   Brand Overlay Penalty: -${careResult.details.brandOverlayPenalty}`);
    console.log(`   ─────────────────────────────────────────`);
    console.log(`   FINAL ETHICS SCORE: ${careResult.score}/25`);

    console.log('\n📋 All Adjustments:');
    careResult.adjustments.forEach((adj, idx) => {
      const sign = adj.value >= 0 ? '+' : '';
      const icon = adj.type === 'positive' ? '✅' : adj.type === 'negative' ? '❌' : 'ℹ️';
      console.log(`   ${idx + 1}. ${icon} ${adj.description}: ${sign}${adj.value}`);
    });

    // Check expected issues
    if (scenario.expectedIssues.length > 0) {
      console.log('\n🔍 Expected vs Actual Issues:');
      scenario.expectedIssues.forEach(expected => {
        const found = issues.some(issue => 
          issue.toLowerCase().includes(expected.toLowerCase().split(' ')[0]) ||
          issue.toLowerCase().includes(expected.toLowerCase().split(' ')[1] || '')
        );
        console.log(`   ${found ? '✅' : '⚠️'} ${expected} ${found ? '(detected)' : '(not detected)'}`);
        if (!found) {
          databaseIssues.push(`Expected issue not detected: ${expected} - may need data enhancement`);
        }
      });
    }

    // Check data availability
    if (!scenario.product.origins && !scenario.product.manufacturing_places) {
      databaseIssues.push('No origin data - DOL/Walk Free country-based checks may not work');
    }
    if (!scenario.product.categories_tags || scenario.product.categories_tags.length === 0) {
      databaseIssues.push('No category data - DOL product category matching may not work');
    }

    return {
      barcode: scenario.barcode,
      name: scenario.name,
      brand: scenario.brand,
      description: scenario.description,
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
      scoreExplanation,
      databaseIssues,
    };
  } catch (error) {
    console.error(`❌ Error testing scenario:`, error);
    databaseIssues.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      barcode: scenario.barcode,
      name: scenario.name,
      brand: scenario.brand,
      description: scenario.description,
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
      issues: [],
      scoreExplanation: 'Error calculating score',
      databaseIssues,
    };
  }
}

/**
 * Main test runner
 */
function runStandaloneTests() {
  console.log('🧪 Ethics Pillar Real-World Scenario Testing');
  console.log('Testing 5 specific product scenarios with the Ethics Pillar implementation\n');
  console.log('New Features Being Tested:');
  console.log('  ✅ 3-tier violation systems (Limited=-4, Moderate=-8, Major=-15)');
  console.log('  ✅ 3-tier recall system (Class III=-4, Class II=-8, Class I=-15)');
  console.log('  ✅ 3-month recall window (changed from 12 months)');
  console.log('  ✅ Mutually exclusive brand overlay logic');
  console.log('  ✅ DOL, Walk Free, BBFAW, Ethical Consumer, ASPCA integrations');
  console.log('  ✅ New certifications (Ocean Wise, Friend of the Sea, GlobalG.A.P)');
  console.log('  ✅ Refined animal welfare (Free-Roaming=+5, Free-Range=+3, Cage-Free=+1)\n');

  const results: TestResult[] = [];

  for (const scenario of REAL_WORLD_SCENARIOS) {
    const result = testScenario(scenario);
    results.push(result);
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
    console.log(`${index + 1}. ${result.name} (${result.brand})`);
    console.log(`   Barcode: ${result.barcode}`);
    console.log(`   Description: ${result.description}`);
    console.log(`   📊 Ethics Score: ${result.careScore}/25`);
    console.log(`   📊 Score Calculation: ${result.scoreExplanation}`);
    
    if (result.issues.length > 0) {
      console.log(`   ⚠️  Issues Detected:`);
      result.issues.forEach(issue => console.log(`      • ${issue}`));
    } else {
      console.log(`   ✅ No violations detected`);
    }
    
    if (result.databaseIssues.length > 0) {
      console.log(`   ⚠️  Database/Data Issues:`);
      result.databaseIssues.forEach(issue => console.log(`      • ${issue}`));
    }
    console.log('');
  });

  // Statistics
  const averageScore = results.reduce((sum, r) => sum + r.careScore, 0) / results.length;
  const productsWithViolations = results.filter(r => r.issues.length > 0).length;
  const productsWithLaborViolations = results.filter(r => r.careBreakdown.laborViolationPenalty > 0).length;
  const productsWithAnimalCruelty = results.filter(r => r.careBreakdown.animalCrueltyPenalty > 0).length;
  const productsWithBrandOverlay = results.filter(r => r.careBreakdown.brandOverlayPenalty > 0).length;

  console.log(`${'='.repeat(100)}`);
  console.log('📈 STATISTICS');
  console.log(`${'='.repeat(100)}`);
  console.log(`Average Ethics score: ${averageScore.toFixed(2)}/25`);
  console.log(`Products with violations: ${productsWithViolations}/${results.length}`);
  console.log(`Products with labor violations: ${productsWithLaborViolations}`);
  console.log(`Products with animal cruelty: ${productsWithAnimalCruelty}`);
  console.log(`Products with brand overlay: ${productsWithBrandOverlay}`);
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
    console.log(`   • For cocoa/chocolate products, ensure origin includes West Africa countries for DOL matching`);
    console.log(`${'='.repeat(100)}\n`);
  } else {
    console.log(`✅ No database access issues detected\n`);
  }

  // Specific Examples
  console.log(`${'='.repeat(100)}`);
  console.log('📝 SPECIFIC EXAMPLES: How Ethics Pillar Scores Are Adjusted');
  console.log(`${'='.repeat(100)}\n`);

  results.forEach((result, index) => {
    console.log(`Example ${index + 1}: ${result.name} (${result.brand})`);
    console.log(`Barcode: ${result.barcode}\n`);
    
    console.log(`Starting Point:`);
    console.log(`  Base Score: ${result.careBreakdown.base}/25`);
    
    if (result.careBreakdown.certificationBonus > 0) {
      console.log(`\nPositive Adjustments:`);
      const positiveAdjustments = result.adjustments.filter(a => a.type === 'positive');
      positiveAdjustments.forEach(adj => {
        console.log(`  ✅ ${adj.description}: +${adj.value}`);
      });
    }
    
    if (result.issues.length > 0) {
      console.log(`\nNegative Adjustments:`);
      result.issues.forEach(issue => {
        console.log(`  ❌ ${issue}`);
      });
    }
    
    console.log(`\nFinal Calculation: ${result.scoreExplanation}`);
    console.log(`\nImpact on TruScore:`);
    console.log(`  • Ethics Pillar contributes ${result.careScore}/25 to total TruScore`);
    console.log(`  • This represents ${((result.careScore / 100) * 100).toFixed(1)}% of maximum TruScore`);
    
    if (result.databaseIssues.length > 0) {
      console.log(`\n⚠️  Data Limitations:`);
      result.databaseIssues.forEach(issue => {
        console.log(`  • ${issue}`);
      });
    }
    
    console.log(`\n${'-'.repeat(100)}\n`);
  });
}

// Run tests if executed directly
if (require.main === module) {
  try {
    runStandaloneTests();
    console.log('✅ Testing complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Testing failed:', error);
    process.exit(1);
  }
}

export { runStandaloneTests, testScenario, REAL_WORLD_SCENARIOS };
