/**
 * Test FSANZ Database Conversion Script
 * 
 * This script tests the conversion process with sample data
 * to verify the import script works correctly.
 * 
 * Usage: node scripts/testConversion.js
 */

const fs = require('fs');
const path = require('path');
const { convertFSANZToJSON, parseCSV } = require('./importFSANZDatabase');

// Create sample test data
function createSampleData() {
  // Sample CSV data matching FSANZ format
  const sampleCSV = `GTIN,Product Name,Brand,Energy (kcal),Fat,Saturated Fat,Carbohydrates,Sugars,Protein,Salt,Sodium,Dietary Fiber,Ingredients,Package Size,Category
9300657003425,Test Product 1,Test Brand,250,10.5,5.2,30.2,15.0,8.5,1.2,480,3.5,"Water, Sugar, Salt",500ml,Beverages
94148152,Test Product 2,Another Brand,180,8.0,4.0,25.0,12.0,6.0,0.8,320,2.0,"Milk, Cocoa, Vanilla",1L,Dairy`;

  // Save to temporary file
  const testFile = path.join(__dirname, '../downloads/test-fsanz-sample.csv');
  fs.writeFileSync(testFile, sampleCSV);
  
  console.log('✅ Created sample test data:', testFile);
  return testFile;
}

// Run test
async function runTest() {
  try {
    console.log('🧪 Testing FSANZ Database Conversion...\n');
    
    // Create sample data
    const testFile = createSampleData();
    const outputFile = path.join(__dirname, '../data/test-fsanz-output.json');
    
    // Run conversion
    console.log('📝 Converting sample data...');
    const result = convertFSANZToJSON(testFile, outputFile, 'AU');
    
    // Verify output
    if (fs.existsSync(outputFile)) {
      const outputData = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
      const productCount = Object.keys(outputData).length;
      
      console.log('\n✅ Conversion Test PASSED!');
      console.log(`   Products converted: ${productCount}`);
      console.log(`   Output file: ${outputFile}`);
      
      // Check sample product
      const sampleProduct = outputData['9300657003425'];
      if (sampleProduct) {
        console.log('\n📦 Sample Product Data:');
        console.log(`   Name: ${sampleProduct.productName}`);
        console.log(`   Brand: ${sampleProduct.brand}`);
        console.log(`   Energy: ${sampleProduct.energyKcal} kcal`);
        console.log(`   Fat: ${sampleProduct.fat}g`);
      }
      
      // Cleanup
      fs.unlinkSync(testFile);
      console.log('\n🧹 Cleaned up test files');
      
      return true;
    } else {
      console.error('❌ Conversion Test FAILED: Output file not created');
      return false;
    }
  } catch (error) {
    console.error('❌ Conversion Test FAILED:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  runTest().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runTest };

