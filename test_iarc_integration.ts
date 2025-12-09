// Test IARC Integration
// Tests the complete IARC database integration

import { IARC_AGENT_DATABASE, getIARCInfo, findIARCInIngredients, getTotalAgentCount } from './src/data/iarcAgents';
import { matchIngredientsAgainstIARC, getIARCPenalty } from './src/utils/ingredientMatcher';

console.log('═══════════════════════════════════════════════════════════════');
console.log('IARC INTEGRATION TEST');
console.log('═══════════════════════════════════════════════════════════════\n');

// Test 1: Database loaded
console.log('TEST 1: Database Loading');
console.log('───────────────────────────────────────────────────────────────');
const totalAgents = getTotalAgentCount();
console.log(`✅ Total IARC agents loaded: ${totalAgents}`);

const groups = { '1': 0, '2A': 0, '2B': 0, '3': 0, '4': 0 };
IARC_AGENT_DATABASE.forEach(agent => {
  groups[agent.group as keyof typeof groups]++;
});
console.log(`   Group 1: ${groups['1']}`);
console.log(`   Group 2A: ${groups['2A']}`);
console.log(`   Group 2B: ${groups['2B']}`);
console.log(`   Group 3: ${groups['3']}`);
console.log(`   Group 4: ${groups['4']}`);
console.log();

// Test 2: Direct lookup
console.log('TEST 2: Direct Lookup');
console.log('───────────────────────────────────────────────────────────────');
const formaldehyde = getIARCInfo('Formaldehyde');
if (formaldehyde) {
  console.log(`✅ Found: ${formaldehyde.agent} (Group ${formaldehyde.group})`);
  console.log(`   Penalty: ${getIARCPenalty(formaldehyde)}`);
} else {
  console.log('❌ Formaldehyde not found');
}
console.log();

// Test 3: Ingredient matching
console.log('TEST 3: Ingredient Matching');
console.log('───────────────────────────────────────────────────────────────');

const testIngredients = [
  'Water, Sodium Nitrite, Formaldehyde, Sugar',
  'Bacon with E250 (Sodium Nitrite)',
  'Product contains BHA and BHT antioxidants',
  'Aspartame, Acesulfame K, Sucralose',
];

testIngredients.forEach((ingredients, i) => {
  console.log(`\nTest ${i + 1}: "${ingredients}"`);
  const matches = matchIngredientsAgainstIARC(ingredients);
  if (matches.length > 0) {
    console.log(`  ✅ Found ${matches.length} IARC-classified ingredient(s):`);
    matches.forEach(match => {
      console.log(`     - ${match.agent} (Group ${match.group}, ${match.confidence} confidence, penalty: ${getIARCPenalty(match)})`);
    });
  } else {
    console.log('  ⚠️  No IARC-classified ingredients found');
  }
});
console.log();

// Test 4: Full text search
console.log('TEST 4: Full Text Search');
console.log('───────────────────────────────────────────────────────────────');
const textSearch = findIARCInIngredients('This product contains formaldehyde and sodium nitrite');
console.log(`✅ Found ${textSearch.length} matches in full text search`);
textSearch.forEach(agent => {
  console.log(`   - ${agent.agent} (Group ${agent.group})`);
});
console.log();

// Test 5: Penalty calculation
console.log('TEST 5: Penalty Calculation');
console.log('───────────────────────────────────────────────────────────────');
const testAgents = [
  { group: '1' as const, agent: 'Formaldehyde' },
  { group: '2A' as const, agent: 'Sodium Nitrite' },
  { group: '2B' as const, agent: 'BHA' },
  { group: '3' as const, agent: 'Some Agent' },
  { group: '4' as const, agent: 'Safe Agent' },
];

testAgents.forEach(testAgent => {
  const penalty = getIARCPenalty(testAgent);
  console.log(`   Group ${testAgent.group}: ${penalty} points`);
});
console.log();

// Test 6: Real-world product example
console.log('TEST 6: Real-World Product Example');
console.log('───────────────────────────────────────────────────────────────');
const realProduct = 'Water, Sodium Nitrite, Sodium Nitrate, Salt, Sugar, Spices, Formaldehyde (preservative)';
const realMatches = matchIngredientsAgainstIARC(realProduct);
console.log(`Product: "${realProduct}"`);
console.log(`\n✅ Found ${realMatches.length} IARC-classified ingredient(s):`);
let totalPenalty = 0;
realMatches.forEach(match => {
  const penalty = getIARCPenalty(match);
  totalPenalty += penalty;
  console.log(`   - ${match.agent} (Group ${match.group}): -${penalty} points`);
});
const cappedPenalty = Math.min(totalPenalty, 10);
console.log(`\n   Total penalty: ${totalPenalty} → Capped at: ${cappedPenalty}`);
console.log();

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ ALL TESTS COMPLETE');
console.log('═══════════════════════════════════════════════════════════════');

