// TypeScript version of PLANET Pillar test script
// Can be run with: npx ts-node scripts/test-planet-pillar.ts

import { getCSVDatabaseService, initializeCSVDatabases } from '../src/services/csvDatabases/csvDatabaseService';
import { calculatePlanetPillar } from '../src/lib/truscoreEngine/pillars/planetPillar';
import { Product } from '../src/types/product';

const testProducts: Product[] = [
  {
    barcode: '1234567890123',
    brand_owner: 'Unilever',
    ecoscore_grade: 'b',
    palm_oil_analysis: {
      containsPalmOil: true,
      isPalmOilFree: false,
      isCertifiedSustainable: true,
      isNonSustainable: false,
      score: 0,
    },
    packagings: [
      { material: 'cardboard', recycling: 'recyclable' },
    ],
    origins_tags: ['en:potatoes'],
  },
  {
    barcode: '2345678901234',
    ecoscore_grade: 'e',
    palm_oil_analysis: {
      containsPalmOil: true,
      isPalmOilFree: false,
      isCertifiedSustainable: false,
      isNonSustainable: true,
      score: -8,
    },
    packagings: [
      { material: 'aluminum', recycling: 'unknown' },
    ],
    origins_tags: ['en:rice', 'en:thailand'],
  },
  {
    barcode: '3456789012345',
    ecoscore_grade: 'a',
    palm_oil_analysis: {
      containsPalmOil: false,
      isPalmOilFree: true,
      isCertifiedSustainable: false,
      isNonSustainable: false,
      score: 0,
    },
    packagings: [
      { material: 'cardboard', recycling: 'recyclable' },
      { material: 'paper', recycling: 'recyclable' },
    ],
    origins_tags: ['en:potatoes', 'en:local'],
  },
  {
    barcode: '4567890123456',
    ecoscore_grade: 'c',
    origins_tags: ['en:strawberries', 'en:usa'],
    packagings: [
      { material: 'plastic', recycling: 'recyclable' },
    ],
  },
];

async function testDatabaseQueries() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DATABASE QUERY TESTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  await initializeCSVDatabases();
  const service = getCSVDatabaseService();

  // Test EWG Dirty Dozen
  console.log('1. EWG Dirty Dozen:');
  console.log(`   Strawberries: ${service.isDirtyDozenCrop('strawberries') ? '✅' : '❌'}`);
  console.log(`   Spinach: ${service.isDirtyDozenCrop('spinach') ? '✅' : '❌'}`);
  console.log(`   Bananas: ${service.isDirtyDozenCrop('bananas') ? '❌ (should be false)' : '✅'}`);
  console.log('');

  // Test RSPO Certified
  console.log('2. RSPO Certified:');
  console.log(`   Unilever: ${service.isRSPOCertified('unilever') ? '✅' : '❌'}`);
  console.log(`   Nestle: ${service.isRSPOCertified('nestle') ? '✅' : '❌'}`);
  console.log(`   Unknown Brand: ${service.isRSPOCertified('unknown-brand') ? '❌ (should be false)' : '✅'}`);
  console.log('');

  // Test Idemat Eco-Cost
  console.log('3. Idemat Eco-Cost:');
  console.log(`   Aluminum: ${service.isHighEcoCostMaterial('aluminum') ? '✅' : '❌'}`);
  console.log(`   Cardboard: ${service.isHighEcoCostMaterial('cardboard') ? '❌ (should be false)' : '✅'}`);
  console.log('');

  // Test FAO Crop Data
  console.log('4. FAO Crop Data:');
  const riceData = service.queryFAOCropData('rice');
  console.log(`   Rice: ${riceData ? '✅' : '❌'} (water: ${riceData?.waterUsage || 'N/A'} L/kg)`);
  const potatoData = service.queryFAOCropData('potatoes');
  console.log(`   Potatoes: ${potatoData ? '✅' : '❌'} (water: ${potatoData?.waterUsage || 'N/A'} L/kg)`);
  console.log('');

  // Test USDA PDP
  console.log('5. USDA PDP:');
  const strawberryPDP = service.queryUSDAPDP('strawberries');
  console.log(`   Strawberries: ${strawberryPDP ? '✅' : '❌'} (residue: ${strawberryPDP?.residueLevel || 'N/A'})`);
  console.log('');

  // Test Farming Impact
  console.log('6. Farming Impact:');
  console.log(`   Rice (high impact): ${service.hasHighFarmingImpact('rice') ? '✅' : '❌'}`);
  console.log(`   Potatoes (low impact): ${service.hasHighFarmingImpact('potatoes') ? '❌ (should be false)' : '✅'}`);
  console.log('');

  // Test Agribalyse
  console.log('7. Agribalyse Fallback:');
  console.log(`   Beef (high carbon): ${service.hasHighCarbonFootprint('beef') ? '✅' : '❌'}`);
  console.log(`   Vegetables (low carbon): ${service.hasHighCarbonFootprint('vegetables') ? '❌ (should be false)' : '✅'}`);
  console.log('');
}

async function testPlanetPillar() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('PLANET PILLAR CALCULATION TESTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  testProducts.forEach((product, index) => {
    console.log(`Test ${index + 1}: ${product.barcode}`);
    const result = calculatePlanetPillar(product);
    
    console.log(`   Base Score: ${result.base}`);
    console.log(`   Final Score: ${result.score}`);
    console.log(`   Eco-Score: ${result.details.ecoscoreGrade || 'N/A'}`);
    console.log(`   Palm Oil Penalty: ${result.details.palmOilPenalty}`);
    console.log(`   Recyclable Bonus: ${result.details.recyclableBonus}`);
    console.log(`   Packaging Eco-Cost Penalty: ${result.details.packagingEcoCostPenalty}`);
    console.log(`   Farming Impact: ${result.details.farmingImpactAdjustment}`);
    console.log(`   Brand Overlay: ${result.details.brandOverlayPenalty}`);
    console.log(`   Adjustments: ${result.adjustments.length}`);
    
    result.adjustments.forEach(adj => {
      console.log(`      - ${adj.description}: ${adj.value > 0 ? '+' : ''}${adj.value} (${adj.type})`);
    });
    
    console.log('');
  });
}

async function main() {
  try {
    await testDatabaseQueries();
    await testPlanetPillar();
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ ALL TESTS COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

