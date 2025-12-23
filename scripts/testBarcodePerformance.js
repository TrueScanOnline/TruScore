/**
 * TrueScan Barcode Performance Test Script
 * 
 * This script tests barcode lookup performance and generates detailed logs
 * showing performance metrics, data sources, and TruScore pillar breakdowns.
 * 
 * Usage (from PowerShell):
 *   .\scripts\testBarcodePerformance.ps1 -Barcodes "9300633910198","0726684754229"
 * 
 * Or directly with Node.js:
 *   node scripts/testBarcodePerformance.js 9300633910198 0726684754229
 */

// Note: This is a simplified version. The actual implementation will need
// to work with the React Native/Expo environment. For now, we'll create
// a test runner that can be executed in a Node.js test environment.

const path = require('path');

// Since we're in a React Native environment, we need to use a different approach
// This script will be called from PowerShell which will handle the Node.js execution

async function testBarcode(barcode) {
  const startTime = Date.now();
  const results = {
    barcode: barcode,
    timestamp: new Date().toISOString(),
    performance: {},
    product: null,
    truScore: null,
    dataSources: {},
    pillarBreakdown: {},
    errors: []
  };

  try {
    // Import the services (this will work in a Node.js test environment)
    // In production, these would be React Native modules
    const { fetchProductOptimized } = require('../src/services/productServiceOptimized');
    const { calculateTruScore } = require('../src/lib/truscoreEngine');
    
    // Test product fetch performance
    const fetchStart = Date.now();
    console.log(`[TEST] Testing barcode: ${barcode}`);
    
    const product = await fetchProductOptimized(
      barcode,
      true, // useCache
      false, // isPremium
      false, // isOffline
      (progress) => {
        console.log(`[PROGRESS] ${progress.phase}`);
      }
    );
    
    const fetchTime = Date.now() - fetchStart;
    results.performance.fetchTime = fetchTime;
    results.performance.fetchTimeFormatted = `${fetchTime}ms`;
    
    if (!product) {
      results.errors.push('Product not found');
      return results;
    }
    
    results.product = {
      barcode: product.barcode,
      product_name: product.product_name,
      source: product.source,
      quality: product.quality,
      completion: product.completion,
      hasNutrition: !!(product.nutriments && Object.keys(product.nutriments).length > 0),
      hasIngredients: !!(product.ingredients_text && product.ingredients_text.length > 0),
      hasImage: !!(product.image_url),
      hasAllergens: !!(product.allergens && product.allergens.length > 0),
      hasAdditives: !!(product.additives && product.additives.length > 0),
      hasOrigin: !!(product.origins && product.origins.length > 0),
      hasCertifications: !!(product.labels_tags && product.labels_tags.length > 0)
    };
    
    // Data sources
    results.dataSources = {
      primarySource: product.source,
      nutritionSource: product.nutriments ? (product.source || 'unknown') : null,
      ingredientsSource: product.ingredients_text ? (product.source || 'unknown') : null,
      allergensSource: product.allergens ? (product.source || 'unknown') : null,
      additivesSource: product.additives ? (product.source || 'unknown') : null,
      originSource: product.origins ? (product.source || 'unknown') : null,
      certificationsSource: product.labels_tags ? (product.source || 'unknown') : null,
      imageSource: product.image_url ? (product.source || 'unknown') : null
    };
    
    // Test TruScore calculation performance
    const truScoreStart = Date.now();
    const truScoreResult = calculateTruScore(product);
    const truScoreTime = Date.now() - truScoreStart;
    
    results.performance.truScoreTime = truScoreTime;
    results.performance.truScoreTimeFormatted = `${truScoreTime}ms`;
    results.performance.totalTime = fetchTime + truScoreTime;
    results.performance.totalTimeFormatted = `${fetchTime + truScoreTime}ms`;
    
    // TruScore results
    results.truScore = {
      overall: truScoreResult.truscore,
      breakdown: truScoreResult.breakdown,
      hasNutriScore: truScoreResult.hasNutriScore,
      hasEcoScore: truScoreResult.hasEcoScore,
      hasOrigin: truScoreResult.hasOrigin,
      insights: truScoreResult.insights || []
    };
    
    // Detailed pillar breakdown
    if (truScoreResult.pillarDetails) {
      results.pillarBreakdown = {
        body: {
          score: truScoreResult.pillarDetails.body.score,
          base: truScoreResult.pillarDetails.body.base,
          adjustments: truScoreResult.pillarDetails.body.adjustments || [],
          details: truScoreResult.pillarDetails.body.details || {},
          dataSources: {
            nutrition: product.nutriments ? product.source : null,
            nutriScore: product.nutriscore_grade ? product.source : null,
            additives: product.additives ? product.source : null,
            nova: product.nova_group ? product.source : null
          }
        },
        planet: {
          score: truScoreResult.pillarDetails.planet.score,
          base: truScoreResult.pillarDetails.planet.base,
          adjustments: truScoreResult.pillarDetails.planet.adjustments || [],
          details: truScoreResult.pillarDetails.planet.details || {},
          dataSources: {
            ecoscore: product.ecoscore_grade ? product.source : null,
            palmOil: product.ingredients_text ? product.source : null,
            packaging: product.packaging_data ? product.source : null
          }
        },
        care: {
          score: truScoreResult.pillarDetails.care.score,
          base: truScoreResult.pillarDetails.care.base,
          adjustments: truScoreResult.pillarDetails.care.adjustments || [],
          details: truScoreResult.pillarDetails.care.details || {},
          dataSources: {
            certifications: product.labels_tags ? product.source : null,
            recalls: product.recalls ? product.source : null,
            brandData: product.brands ? 'internal_brand_database' : null
          }
        },
        open: {
          score: truScoreResult.pillarDetails.open.score,
          base: truScoreResult.pillarDetails.open.base,
          adjustments: truScoreResult.pillarDetails.open.adjustments || [],
          details: truScoreResult.pillarDetails.open.details || {},
          dataSources: {
            ingredients: product.ingredients_text ? product.source : null,
            origin: product.origins ? product.source : null,
            brandOwner: product.brand_owner ? product.source : null
          }
        }
      };
    }
    
    // Ingredients data source
    results.dataSources.ingredients = {
      source: product.ingredients_text ? product.source : null,
      length: product.ingredients_text ? product.ingredients_text.length : 0,
      hasHiddenTerms: product.ingredients_text ? (
        /parfum|flavor|flavour|proprietary blend|secret formula|essence|spice|extract/i.test(product.ingredients_text)
      ) : false
    };
    
    // Nutrition data source
    results.dataSources.nutrition = {
      source: product.nutriments ? product.source : null,
      fieldsCount: product.nutriments ? Object.keys(product.nutriments).length : 0,
      hasEnergy: !!(product.nutriments && product.nutriments['energy-kcal']),
      hasMacros: !!(product.nutriments && (
        product.nutriments.proteins || 
        product.nutriments.carbohydrates || 
        product.nutriments.fat
      ))
    };
    
    // Allergens & Additives data source
    results.dataSources.allergensAdditives = {
      allergensSource: product.allergens ? product.source : null,
      allergensCount: product.allergens ? product.allergens.length : 0,
      additivesSource: product.additives ? product.source : null,
      additivesCount: product.additives ? product.additives.length : 0,
      allergensTags: product.allergens_tags || [],
      additivesTags: product.additives_tags || []
    };
    
    // Country of origin data source
    results.dataSources.countryOfOrigin = {
      source: product.origins ? product.source : null,
      origins: product.origins || [],
      originsTags: product.origins_tags || [],
      manufacturingPlaces: product.manufacturing_places || [],
      manufacturingPlacesTags: product.manufacturing_places_tags || []
    };
    
    // Score highlights (insights)
    results.dataSources.scoreHighlights = {
      source: 'truScore_engine',
      insights: truScoreResult.insights || [],
      insightsCount: truScoreResult.insights ? truScoreResult.insights.length : 0
    };
    
    console.log(`[TEST] ✅ Completed: ${barcode} - ${fetchTime + truScoreTime}ms`);
    
  } catch (error) {
    results.errors.push({
      message: error.message,
      stack: error.stack
    });
    console.error(`[TEST] ❌ Error testing ${barcode}:`, error.message);
  }
  
  return results;
}

// Main execution
(async () => {
  const barcodes = process.argv.slice(2);
  
  if (barcodes.length === 0) {
    console.error('Usage: node testBarcodePerformance.js <barcode1> [barcode2] [barcode3] ...');
    process.exit(1);
  }
  
  const allResults = {
    testRun: {
      timestamp: new Date().toISOString(),
      barcodesTested: barcodes.length,
      totalTime: 0
    },
    results: []
  };
  
  const overallStart = Date.now();
  
  for (const barcode of barcodes) {
    const result = await testBarcode(barcode);
    allResults.results.push(result);
  }
  
  const overallTime = Date.now() - overallStart;
  allResults.testRun.totalTime = overallTime;
  allResults.testRun.totalTimeFormatted = `${overallTime}ms`;
  
  // Output JSON
  console.log(JSON.stringify(allResults, null, 2));
})().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});









