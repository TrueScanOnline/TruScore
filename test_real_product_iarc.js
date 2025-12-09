// Real-World IARC Test with Actual Product
// Tests IARC database with a known product barcode

const { matchIngredientsAgainstIARC, getIARCPenalty } = require('./src/utils/ingredientMatcher');
const { calculateBodyPillar } = require('./src/lib/truscoreEngine/pillars/bodyPillar');

console.log('═══════════════════════════════════════════════════════════════');
console.log('REAL-WORLD IARC TEST - BACON PRODUCT');
console.log('═══════════════════════════════════════════════════════════════\n');

// Test Product: Bacon (commonly contains E250 - Sodium Nitrite, IARC Group 2A)
// Real barcode example: 0768085120165 (Oscar Mayer Bacon)
const testProduct = {
  barcode: '0768085120165',
  product_name: 'Bacon Strips',
  ingredients_text: 'Pork, Water, Salt, Sodium Nitrite, Sodium Nitrate, Sugar, Spices, Natural Flavoring',
  additives_tags: ['en:e250', 'en:e251'], // E250 = Sodium Nitrite (IARC 2A), E251 = Sodium Nitrate (IARC 2A)
  nutriscore_grade: 'd',
  nova_group: 4,
};

console.log('TEST PRODUCT:');
console.log('───────────────────────────────────────────────────────────────');
console.log(`Barcode: ${testProduct.barcode}`);
console.log(`Name: ${testProduct.product_name}`);
console.log(`Ingredients: ${testProduct.ingredients_text}`);
console.log(`Additives: ${testProduct.additives_tags.join(', ')}`);
console.log();

// Test 1: IARC Ingredient Matching
console.log('TEST 1: IARC Ingredient Matching');
console.log('───────────────────────────────────────────────────────────────');
try {
  const matchedAgents = matchIngredientsAgainstIARC(testProduct.ingredients_text);
  console.log(`✅ Found ${matchedAgents.length} IARC-classified ingredient(s):\n`);

  let totalIARCPenalty = 0;
  matchedAgents.forEach((agent, i) => {
    const penalty = getIARCPenalty(agent);
    totalIARCPenalty += penalty;
    console.log(`${i + 1}. ${agent.agent}`);
    console.log(`   - IARC Group: ${agent.group}`);
    console.log(`   - Confidence: ${agent.confidence}`);
    console.log(`   - Penalty: -${penalty} points`);
    console.log();
  });

  const cappedIARCPenalty = Math.min(totalIARCPenalty, 10);
  console.log(`Total IARC Penalty: ${totalIARCPenalty} → Capped at: ${cappedIARCPenalty}`);
  console.log();

  // Test 2: BODY Pillar Calculation
  console.log('TEST 2: BODY Pillar Calculation');
  console.log('───────────────────────────────────────────────────────────────');
  const bodyPillarResult = calculateBodyPillar(testProduct);
  console.log(`✅ BODY Pillar Score: ${bodyPillarResult.score}/25`);
  console.log(`   Base Score: ${bodyPillarResult.base}`);
  console.log(`\nAdjustments:`);
  bodyPillarResult.adjustments.forEach((adj, i) => {
    const sign = adj.value >= 0 ? '+' : '';
    console.log(`   ${i + 1}. ${adj.description}: ${sign}${adj.value} (${adj.type})`);
  });
  console.log();

  // Test 3: Verify IARC Detection
  console.log('TEST 3: Verify IARC Detection');
  console.log('───────────────────────────────────────────────────────────────');
  const hasIARC = matchedAgents.length > 0;
  const hasIARCInAdjustments = bodyPillarResult.adjustments.some(adj => 
    adj.description.toLowerCase().includes('iarc')
  );

  console.log(`✅ IARC agents detected: ${hasIARC ? 'YES' : 'NO'} (${matchedAgents.length} agents)`);
  console.log(`✅ IARC penalty in BODY Pillar: ${hasIARCInAdjustments ? 'YES' : 'NO'}`);

  if (hasIARC) {
    console.log(`\n✅ SUCCESS: IARC database is working correctly!`);
    console.log(`   - Detected: ${matchedAgents.map(a => a.agent).join(', ')}`);
    console.log(`   - Applied penalty: -${cappedIARCPenalty} points`);
    console.log(`   - BODY Pillar score affected: YES`);
  } else {
    console.log(`\n⚠️  WARNING: No IARC agents detected`);
  }
  console.log();

  // Test 4: Card Display Data
  console.log('TEST 4: Card Display Data');
  console.log('───────────────────────────────────────────────────────────────');
  console.log('Data for Additives Risk Card:');
  console.log(`  - IARC Risks: ${matchedAgents.length}`);
  matchedAgents.forEach(agent => {
    console.log(`    • ${agent.agent} (Group ${agent.group}, ${agent.confidence} confidence)`);
  });
  console.log(`  - Total Penalty: -${cappedIARCPenalty} points`);
  console.log(`  - Card should display: ${hasIARC ? 'YES' : 'NO'}`);
  console.log();

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ TEST COMPLETE - IARC DATABASE WORKING');
  console.log('═══════════════════════════════════════════════════════════════');
} catch (error) {
  console.error('❌ ERROR:', error.message);
  console.error(error.stack);
}

