/**
 * Debug script to analyze CARE pillar scoring issues
 * Tests with real products to see what data is available
 */

import * as fs from 'fs';
import * as path from 'path';

interface Product {
  barcode?: string;
  product_name?: string;
  labels_tags?: string[];
  brands?: string;
  brand_owner?: string;
  brands_tags?: string[];
  recalls?: any[];
  [key: string]: any;
}

// Fetch product data directly from Open Food Facts API
async function fetchProduct(barcode: string): Promise<Product | null> {
  try {
    const offUrl = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const offResponse = await fetch(offUrl, {
      headers: { 'User-Agent': 'TrueScan-FoodScanner/1.0' }
    });
    
    if (offResponse.ok) {
      const offData = await offResponse.json();
      if (offData.product) {
        return { ...offData.product, barcode, source: 'openfoodfacts' } as Product;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching barcode ${barcode}:`, error);
    return null;
  }
}

// Analyze CARE pillar data availability
function analyzeCarePillarData(product: Product) {
  const analysis: any = {
    barcode: product.barcode,
    productName: product.product_name || product.product_name_en || 'Unknown',
    labels_tags: product.labels_tags || [],
    labels_tags_count: (product.labels_tags || []).length,
    brands: product.brands || '',
    brand_owner: product.brand_owner || '',
    brands_tags: product.brands_tags || [],
    recalls: product.recalls || [],
    recalls_count: (product.recalls || []).length,
  };
  
  // Check for certifications in labels_tags
  const certificationPatterns = [
    { pattern: 'fair-trade', name: 'Fairtrade', expected: 'en:fair-trade' },
    { pattern: 'organic', name: 'Organic', expected: 'en:organic' },
    { pattern: 'rainforest', name: 'Rainforest Alliance', expected: 'en:rainforest-alliance' },
    { pattern: 'utz', name: 'UTZ', expected: 'en:utz' },
    { pattern: 'msc', name: 'MSC', expected: 'en:marine-stewardship-council' },
    { pattern: 'asc', name: 'ASC', expected: 'en:asc' },
    { pattern: 'rspo', name: 'RSPO', expected: 'en:roundtable-on-sustainable-palm-oil' },
    { pattern: 'rspca', name: 'RSPCA', expected: 'en:rspca' },
    { pattern: 'leaping-bunny', name: 'Leaping Bunny', expected: 'en:leaping-bunny' },
    { pattern: 'b-corp', name: 'B-Corp', expected: 'en:b-corp' },
    { pattern: 'cage-free', name: 'Cage-Free', expected: 'en:cage-free' },
    { pattern: 'free-range', name: 'Free-Range', expected: 'en:free-range' },
  ];
  
  const foundCertifications: string[] = [];
  const missingCertifications: string[] = [];
  
  certificationPatterns.forEach(({ pattern, name, expected }) => {
    const found = (product.labels_tags || []).some(tag => 
      tag.toLowerCase().includes(pattern.toLowerCase())
    );
    if (found) {
      foundCertifications.push(name);
      // Find the actual tag
      const actualTag = (product.labels_tags || []).find(tag => 
        tag.toLowerCase().includes(pattern.toLowerCase())
      );
      analysis[`cert_${pattern.replace('-', '_')}`] = {
        found: true,
        actualTag: actualTag,
        expectedTag: expected,
        matches: actualTag?.toLowerCase() === expected.toLowerCase(),
      };
    } else {
      missingCertifications.push(name);
      analysis[`cert_${pattern.replace('-', '_')}`] = {
        found: false,
        expectedTag: expected,
      };
    }
  });
  
  analysis.foundCertifications = foundCertifications;
  analysis.missingCertifications = missingCertifications;
  analysis.certificationDetectionRate = certificationPatterns.length > 0 
    ? (foundCertifications.length / certificationPatterns.length) * 100 
    : 0;
  
  // Check label matching logic
  const testLabels = [
    'en:fair-trade',
    'en:organic',
    'en:usda-organic',
    'en:eu-organic',
    'en:bio',
    'en:ecocert',
    'en:rainforest-alliance',
    'en:utz',
    'en:msc',
    'en:asc',
    'en:dolphin-safe',
    'en:roundtable-on-sustainable-palm-oil',
    'en:rspca',
    'en:leaping-bunny',
    'en:cruelty-free',
    'en:b-corp',
    'en:cage-free',
    'en:free-range',
  ];
  
  analysis.labelMatchingTest = testLabels.map(expectedLabel => {
    const hasLabel = (product.labels_tags || []).some((l: string) => 
      l.toLowerCase().includes(expectedLabel.toLowerCase())
    );
    const exactMatch = (product.labels_tags || []).includes(expectedLabel);
    return {
      expectedLabel,
      hasLabel,
      exactMatch,
      actualTags: (product.labels_tags || []).filter((l: string) => 
        l.toLowerCase().includes(expectedLabel.toLowerCase())
      ),
    };
  });
  
  return analysis;
}

// Main analysis function
async function analyzeProducts(barcodes: string[]) {
  const results: any[] = [];
  
  console.log(`Analyzing ${barcodes.length} products for CARE pillar data...\n`);
  
  for (let i = 0; i < barcodes.length; i++) {
    const barcode = barcodes[i];
    console.log(`[${i + 1}/${barcodes.length}] Processing: ${barcode}`);
    
    const product = await fetchProduct(barcode);
    
    if (!product) {
      console.log(`  ⚠️  Product not found\n`);
      continue;
    }
    
    const analysis = analyzeCarePillarData(product);
    results.push(analysis);
    
    console.log(`  Product: ${analysis.productName.substring(0, 50)}...`);
    console.log(`  Labels Tags: ${analysis.labels_tags_count} tags`);
    console.log(`  Labels: ${analysis.labels_tags.slice(0, 10).join(', ')}${analysis.labels_tags.length > 10 ? '...' : ''}`);
    console.log(`  Found Certifications: ${analysis.foundCertifications.length > 0 ? analysis.foundCertifications.join(', ') : 'NONE'}`);
    console.log(`  Brand: ${analysis.brands || 'N/A'}`);
    console.log(`  Brand Owner: ${analysis.brand_owner || 'N/A'}`);
    console.log(`  Recalls: ${analysis.recalls_count}`);
    console.log('');
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

// Generate diagnostic report
function generateDiagnosticReport(results: any[]) {
  const report: string[] = [];
  
  report.push('='.repeat(100));
  report.push('CARE PILLAR DIAGNOSTIC ANALYSIS REPORT');
  report.push('='.repeat(100));
  report.push('');
  report.push(`Analysis Date: ${new Date().toISOString()}`);
  report.push(`Total Products Analyzed: ${results.length}`);
  report.push('');
  
  // Summary statistics
  const productsWithLabels = results.filter(r => r.labels_tags_count > 0);
  const productsWithCertifications = results.filter(r => r.foundCertifications.length > 0);
  const avgLabelsPerProduct = results.reduce((sum, r) => sum + r.labels_tags_count, 0) / results.length;
  const avgCertificationsPerProduct = results.reduce((sum, r) => sum + r.foundCertifications.length, 0) / results.length;
  
  report.push('SUMMARY STATISTICS');
  report.push('-'.repeat(100));
  report.push(`Products with Labels Tags: ${productsWithLabels.length} (${((productsWithLabels.length / results.length) * 100).toFixed(1)}%)`);
  report.push(`Products with Certifications Detected: ${productsWithCertifications.length} (${((productsWithCertifications.length / results.length) * 100).toFixed(1)}%)`);
  report.push(`Average Labels per Product: ${avgLabelsPerProduct.toFixed(2)}`);
  report.push(`Average Certifications per Product: ${avgCertificationsPerProduct.toFixed(2)}`);
  report.push('');
  
  // Certification detection analysis
  report.push('CERTIFICATION DETECTION ANALYSIS');
  report.push('-'.repeat(100));
  
  const certStats: Record<string, { found: number; notFound: number; actualTags: string[] }> = {};
  
  results.forEach(result => {
    Object.keys(result).forEach(key => {
      if (key.startsWith('cert_')) {
        const certName = key.replace('cert_', '').replace('_', '-');
        if (!certStats[certName]) {
          certStats[certName] = { found: 0, notFound: 0, actualTags: [] };
        }
        if (result[key].found) {
          certStats[certName].found++;
          if (result[key].actualTag) {
            certStats[certName].actualTags.push(result[key].actualTag);
          }
        } else {
          certStats[certName].notFound++;
        }
      }
    });
  });
  
  Object.entries(certStats).forEach(([cert, stats]) => {
    const total = stats.found + stats.notFound;
    const detectionRate = total > 0 ? (stats.found / total) * 100 : 0;
    report.push(`${cert}: Found in ${stats.found}/${total} products (${detectionRate.toFixed(1)}%)`);
    if (stats.actualTags.length > 0) {
      const uniqueTags = [...new Set(stats.actualTags)];
      report.push(`  Actual tags found: ${uniqueTags.join(', ')}`);
    }
  });
  
  report.push('');
  
  // Label matching issues
  report.push('LABEL MATCHING ISSUES');
  report.push('-'.repeat(100));
  
  const matchingIssues: any[] = [];
  results.forEach(result => {
    if (result.labelMatchingTest) {
      result.labelMatchingTest.forEach((test: any) => {
        if (!test.hasLabel && !test.exactMatch) {
          // Check if similar tag exists
          const similarTags = (result.labels_tags || []).filter((tag: string) => {
            const tagLower = tag.toLowerCase();
            const expectedLower = test.expectedLabel.toLowerCase();
            // Check for partial matches
            return tagLower.includes(expectedLower.split(':')[1]?.split('-')[0] || '') ||
                   expectedLower.includes(tagLower.split(':')[1]?.split('-')[0] || '');
          });
          
          if (similarTags.length > 0) {
            matchingIssues.push({
              product: result.productName,
              expected: test.expectedLabel,
              similarTags: similarTags,
            });
          }
        }
      });
    }
  });
  
  if (matchingIssues.length > 0) {
    report.push(`Found ${matchingIssues.length} potential label matching issues:`);
    matchingIssues.slice(0, 20).forEach(issue => {
      report.push(`  Product: ${issue.product}`);
      report.push(`    Expected: ${issue.expected}`);
      report.push(`    Similar tags found: ${issue.similarTags.join(', ')}`);
    });
  } else {
    report.push('No obvious label matching issues detected.');
  }
  
  report.push('');
  
  // Detailed results
  report.push('='.repeat(100));
  report.push('DETAILED PRODUCT ANALYSIS');
  report.push('='.repeat(100));
  report.push('');
  
  results.forEach((result, index) => {
    report.push(`${index + 1}. Barcode: ${result.barcode}`);
    report.push(`   Product: ${result.productName}`);
    report.push(`   Labels Tags (${result.labels_tags_count}): ${result.labels_tags.join(', ')}`);
    report.push(`   Found Certifications: ${result.foundCertifications.length > 0 ? result.foundCertifications.join(', ') : 'NONE'}`);
    report.push(`   Brand: ${result.brands || 'N/A'}`);
    report.push(`   Brand Owner: ${result.brand_owner || 'N/A'}`);
    report.push(`   Recalls: ${result.recalls_count}`);
    report.push('');
  });
  
  return report.join('\n');
}

// Main execution
async function main() {
  // Test with a variety of products that might have certifications
  const testBarcodes = [
    '5449000000996', // Coca Cola
    '3017620422003', // Nutella (might have certifications)
    '7622300992675', // Belvita (might have certifications)
    '9310354982466', // Farm to Pot Organic Greek Yoghurt (should have organic)
    '894700010137', // Greek Yogurt
    '9300652010794', // Weet-Bix
    '9310272002253', // Milk
    '9310060011030', // ROLLED OATS (might have organic)
  ];
  
  const results = await analyzeProducts(testBarcodes);
  const report = generateDiagnosticReport(results);
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'TruScore logic', 'care-pillar-diagnostic-report.txt');
  fs.writeFileSync(reportPath, report, 'utf-8');
  
  console.log('\n' + '='.repeat(100));
  console.log('DIAGNOSTIC ANALYSIS COMPLETE');
  console.log('='.repeat(100));
  console.log(`Report saved to: ${reportPath}`);
  console.log('\n' + report);
}

main().catch(console.error);
