/**
 * Comprehensive Test Analysis Script
 * 
 * Analyzes all three test scenarios:
 * 1. General batch (100-200 barcodes)
 * 2. Region-specific (US/EU/AU/NZ)
 * 3. Ethics-focused (50 barcodes)
 * 
 * Generates detailed reports with:
 * - Per-pillar hit rates by database
 * - Real-world success/failure table per DB
 * - Cost vs contribution ranking
 * - Ethics Pillar specific analysis
 */

const fs = require('fs');
const path = require('path');

// Test result files
const TEST_FILES = {
  general: 'general_batch_results.json',
  us: 'region_us_results.json',
  eu: 'region_eu_results.json',
  au_nz: 'region_au_nz_results.json',
  ethics: 'ethics_focused_results.json'
};

// Extract JSON from full text files (handles cases where JSON is embedded in logs)
function extractJSON(filePath) {
  try {
    // First try the full text file
    const fullTextPath = filePath.replace('.json', '_full.txt');
    if (fs.existsSync(fullTextPath)) {
      const fullContent = fs.readFileSync(fullTextPath, 'utf8');
      
      // Look for JSON object starting with "testRun"
      const jsonStart = fullContent.indexOf('"testRun"');
      if (jsonStart > 0) {
        // Find the opening brace before "testRun"
        let braceStart = jsonStart;
        while (braceStart > 0 && fullContent[braceStart] !== '{') {
          braceStart--;
        }
        
        // Find the matching closing brace
        let braceCount = 0;
        let braceEnd = braceStart;
        for (let i = braceStart; i < fullContent.length; i++) {
          if (fullContent[i] === '{') braceCount++;
          if (fullContent[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              braceEnd = i;
              break;
            }
          }
        }
        
        if (braceEnd > braceStart) {
          const jsonStr = fullContent.substring(braceStart, braceEnd + 1);
          return JSON.parse(jsonStr);
        }
      }
    }
    
    // Fallback to JSON file
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Try to parse as-is first
      try {
        return JSON.parse(content);
      } catch (e) {
        // Extract JSON from text (look for JSON object boundaries)
        const jsonStart = content.indexOf('"testRun"');
        if (jsonStart > 0) {
          let braceStart = jsonStart;
          while (braceStart > 0 && content[braceStart] !== '{') {
            braceStart--;
          }
          
          let braceCount = 0;
          let braceEnd = braceStart;
          for (let i = braceStart; i < content.length; i++) {
            if (content[i] === '{') braceCount++;
            if (content[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                braceEnd = i;
                break;
              }
            }
          }
          
          if (braceEnd > braceStart) {
            const jsonStr = content.substring(braceStart, braceEnd + 1);
            return JSON.parse(jsonStr);
          }
        }
      }
    }
    
    throw new Error('Could not extract JSON');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

// Analyze a single test result file
function analyzeTestResults(testName, data) {
  if (!data || !data.results || !Array.isArray(data.results)) {
    return null;
  }

  const results = data.results;
  const total = results.length;
  
  // Counts
  const found = results.filter(r => r.product !== null).length;
  const notFound = total - found;
  
  // Primary source counts
  const primaryCounts = new Map();
  const allSourceCounts = new Map();
  const databaseQueriedCounts = new Map();
  
  // Pillar data availability
  const pillarData = {
    body: { nutrition: 0, nutriScore: 0, additives: 0, nova: 0 },
    planet: { ecoscore: 0, palmOil: 0, packaging: 0 },
    ethics: { certifications: 0, recalls: 0, brandData: 0, adjusted: 0 },
    open: { ingredients: 0, origin: 0, brandOwner: 0 }
  };
  
  // Ethics-specific tracking
  const ethicsSignals = {
    withCertifications: 0,
    withAdjustedScore: 0,
    withRecalls: 0,
    withLaborViolations: 0,
    withAnimalCruelty: 0,
    withBrandOverlay: 0
  };
  
  // Pillar scores (for found products)
  const pillarScores = {
    body: [],
    planet: [],
    ethics: [],
    open: []
  };
  
  // Database contribution tracking
  const dbContributions = new Map();
  
  for (const r of results) {
    // Primary source
    if (r.dataSources && r.dataSources.primarySource) {
      const source = r.dataSources.primarySource.toLowerCase().replace(/\s+/g, '');
      primaryCounts.set(source, (primaryCounts.get(source) || 0) + 1);
    }
    
    // All sources
    if (r.dataSources && r.dataSources.allSources) {
      for (const source of r.dataSources.allSources) {
        const normalized = source.toLowerCase().replace(/\s+/g, '');
        allSourceCounts.set(normalized, (allSourceCounts.get(normalized) || 0) + 1);
      }
    }
    
    // Databases queried
    if (r.dataSources && r.dataSources.databasesQueried) {
      for (const db of r.dataSources.databasesQueried) {
        const normalized = db.toLowerCase().replace(/\s+/g, '');
        databaseQueriedCounts.set(normalized, (databaseQueriedCounts.get(normalized) || 0) + 1);
      }
    }
    
    // Track database contributions
    if (r.product) {
      const sources = r.dataSources?.allSources || [];
      for (const source of sources) {
        const normalized = source.toLowerCase().replace(/\s+/g, '');
        if (!dbContributions.has(normalized)) {
          dbContributions.set(normalized, {
            name: source,
            primaryHits: 0,
            anyContribution: 0,
            attempted: 0
          });
        }
        dbContributions.get(normalized).anyContribution++;
      }
      
      if (r.dataSources?.primarySource) {
        const normalized = r.dataSources.primarySource.toLowerCase().replace(/\s+/g, '');
        if (dbContributions.has(normalized)) {
          dbContributions.get(normalized).primaryHits++;
        }
      }
    }
    
    // Pillar data availability
    if (r.pillarBreakdown) {
      // Body
      if (r.pillarBreakdown.body) {
        if (r.pillarBreakdown.body.dataSources?.nutrition) pillarData.body.nutrition++;
        if (r.pillarBreakdown.body.dataSources?.nutriScore) pillarData.body.nutriScore++;
        if (r.pillarBreakdown.body.dataSources?.additives) pillarData.body.additives++;
        if (r.pillarBreakdown.body.dataSources?.nova) pillarData.body.nova++;
        if (r.pillarBreakdown.body.score !== undefined) pillarScores.body.push(r.pillarBreakdown.body.score);
      }
      
      // Planet
      if (r.pillarBreakdown.planet) {
        if (r.pillarBreakdown.planet.dataSources?.ecoscore) pillarData.planet.ecoscore++;
        if (r.pillarBreakdown.planet.dataSources?.palmOil) pillarData.planet.palmOil++;
        if (r.pillarBreakdown.planet.dataSources?.packaging) pillarData.planet.packaging++;
        if (r.pillarBreakdown.planet.score !== undefined) pillarScores.planet.push(r.pillarBreakdown.planet.score);
      }
      
      // Ethics
      if (r.pillarBreakdown.care) {
        if (r.pillarBreakdown.care.dataSources?.certifications) pillarData.ethics.certifications++;
        if (r.pillarBreakdown.care.dataSources?.recalls) pillarData.ethics.recalls++;
        if (r.pillarBreakdown.care.dataSources?.brandData) pillarData.ethics.brandData++;
        
        const base = r.pillarBreakdown.care.base || 15;
        const score = r.pillarBreakdown.care.score || 15;
        if (score !== base) pillarData.ethics.adjusted++;
        
        if (r.pillarBreakdown.care.score !== undefined) pillarScores.ethics.push(r.pillarBreakdown.care.score);
        
        // Ethics-specific signals
        if (r.pillarBreakdown.care.details) {
          if (r.pillarBreakdown.care.details.certificationBonus > 0) ethicsSignals.withCertifications++;
          if (r.pillarBreakdown.care.details.recallPenalty > 0) {
            ethicsSignals.withRecalls++;
            ethicsSignals.withAdjustedScore++;
          }
          if (r.pillarBreakdown.care.details.laborViolationPenalty > 0) {
            ethicsSignals.withLaborViolations++;
            ethicsSignals.withAdjustedScore++;
          }
          if (r.pillarBreakdown.care.details.animalCrueltyPenalty > 0) {
            ethicsSignals.withAnimalCruelty++;
            ethicsSignals.withAdjustedScore++;
          }
          if (r.pillarBreakdown.care.details.brandOverlayPenalty > 0) {
            ethicsSignals.withBrandOverlay++;
            ethicsSignals.withAdjustedScore++;
          }
        }
      }
      
      // Open
      if (r.pillarBreakdown.open) {
        if (r.pillarBreakdown.open.dataSources?.ingredients) pillarData.open.ingredients++;
        if (r.pillarBreakdown.open.dataSources?.origin) pillarData.open.origin++;
        if (r.pillarBreakdown.open.dataSources?.brandOwner) pillarData.open.brandOwner++;
        if (r.pillarBreakdown.open.score !== undefined) pillarScores.open.push(r.pillarBreakdown.open.score);
      }
    }
    
    // Product-level certifications
    if (r.product && r.product.hasCertifications) {
      ethicsSignals.withCertifications++;
    }
  }
  
  // Calculate statistics
  const stats = {
    total,
    found,
    notFound,
    foundRate: total > 0 ? (found / total * 100).toFixed(1) : '0.0',
    primaryCounts: Object.fromEntries(primaryCounts),
    allSourceCounts: Object.fromEntries(allSourceCounts),
    databaseQueriedCounts: Object.fromEntries(databaseQueriedCounts),
    pillarData,
    ethicsSignals,
    pillarScores: {
      body: pillarScores.body.length > 0 ? {
        avg: (pillarScores.body.reduce((a, b) => a + b, 0) / pillarScores.body.length).toFixed(1),
        min: Math.min(...pillarScores.body),
        max: Math.max(...pillarScores.body),
        count: pillarScores.body.length
      } : null,
      planet: pillarScores.planet.length > 0 ? {
        avg: (pillarScores.planet.reduce((a, b) => a + b, 0) / pillarScores.planet.length).toFixed(1),
        min: Math.min(...pillarScores.planet),
        max: Math.max(...pillarScores.planet),
        count: pillarScores.planet.length
      } : null,
      ethics: pillarScores.ethics.length > 0 ? {
        avg: (pillarScores.ethics.reduce((a, b) => a + b, 0) / pillarScores.ethics.length).toFixed(1),
        min: Math.min(...pillarScores.ethics),
        max: Math.max(...pillarScores.ethics),
        count: pillarScores.ethics.length
      } : null,
      open: pillarScores.open.length > 0 ? {
        avg: (pillarScores.open.reduce((a, b) => a + b, 0) / pillarScores.open.length).toFixed(1),
        min: Math.min(...pillarScores.open),
        max: Math.max(...pillarScores.open),
        count: pillarScores.open.length
      } : null
    },
    dbContributions: Array.from(dbContributions.values())
  };
  
  return stats;
}

// Generate markdown report
function generateReport(testName, stats, allStats) {
  if (!stats) {
    return `# ${testName} Test Analysis\n\n**Error:** Could not analyze test results.\n\n`;
  }
  
  const lines = [
    `# ${testName} Test Analysis`,
    '',
    `**Generated:** ${new Date().toISOString()}`,
    `**Barcodes Tested:** ${stats.total}`,
    `**Products Found:** ${stats.found}`,
    `**Not Found:** ${stats.notFound}`,
    '',
    '## Overall Success',
    `- Product found rate: ${stats.found}/${stats.total} (${stats.foundRate}%)`,
    '',
    '## Primary Source Hit Rates',
    '| Database | Primary Hits | Rate |',
    '|---|---:|---:|'
  ];
  
  // Sort primary counts
  const sortedPrimary = Object.entries(stats.primaryCounts)
    .sort((a, b) => b[1] - a[1]);
  
  for (const [db, count] of sortedPrimary) {
    const rate = ((count / stats.total) * 100).toFixed(1);
    lines.push(`| ${db} | ${count} | ${rate}% |`);
  }
  
  lines.push('');
  lines.push('## Per-Pillar Data Availability');
  lines.push('');
  
  // Body Pillar
  lines.push('### Body Pillar Data Sources');
  lines.push('| Source | Nutrition | Nutri-Score | Additives | NOVA |');
  lines.push('|---|---:|---:|---:|---:|');
  lines.push(`| Found Products | ${stats.pillarData.body.nutrition} | ${stats.pillarData.body.nutriScore} | ${stats.pillarData.body.additives} | ${stats.pillarData.body.nova} |`);
  
  // Planet Pillar
  lines.push('');
  lines.push('### Planet Pillar Data Sources');
  lines.push('| Source | Eco-Score | Palm Oil | Packaging |');
  lines.push('|---|---:|---:|---:|');
  lines.push(`| Found Products | ${stats.pillarData.planet.ecoscore} | ${stats.pillarData.planet.palmOil} | ${stats.pillarData.planet.packaging} |`);
  
  // Ethics Pillar
  lines.push('');
  lines.push('### Ethics Pillar Data Sources');
  lines.push('| Source | Certifications | Recalls | Brand Data | Adjusted Score |');
  lines.push('|---|---:|---:|---:|---:|');
  lines.push(`| Found Products | ${stats.pillarData.ethics.certifications} | ${stats.pillarData.ethics.recalls} | ${stats.pillarData.ethics.brandData} | ${stats.pillarData.ethics.adjusted} |`);
  
  // Ethics-specific signals
  lines.push('');
  lines.push('### Ethics Pillar Signals');
  lines.push(`- Products with certifications: ${stats.ethicsSignals.withCertifications}/${stats.total} (${((stats.ethicsSignals.withCertifications / stats.total) * 100).toFixed(1)}%)`);
  lines.push(`- Products with adjusted ethics score: ${stats.ethicsSignals.withAdjustedScore}/${stats.total} (${((stats.ethicsSignals.withAdjustedScore / stats.total) * 100).toFixed(1)}%)`);
  lines.push(`- Products with recalls: ${stats.ethicsSignals.withRecalls}/${stats.total} (${((stats.ethicsSignals.withRecalls / stats.total) * 100).toFixed(1)}%)`);
  lines.push(`- Products with labor violations: ${stats.ethicsSignals.withLaborViolations}/${stats.total} (${((stats.ethicsSignals.withLaborViolations / stats.total) * 100).toFixed(1)}%)`);
  lines.push(`- Products with animal cruelty issues: ${stats.ethicsSignals.withAnimalCruelty}/${stats.total} (${((stats.ethicsSignals.withAnimalCruelty / stats.total) * 100).toFixed(1)}%)`);
  lines.push(`- Products with brand overlay penalties: ${stats.ethicsSignals.withBrandOverlay}/${stats.total} (${((stats.ethicsSignals.withBrandOverlay / stats.total) * 100).toFixed(1)}%)`);
  
  // Open Pillar
  lines.push('');
  lines.push('### Open Pillar Data Sources');
  lines.push('| Source | Ingredients | Origin | Brand Owner |');
  lines.push('|---|---:|---:|---:|');
  lines.push(`| Found Products | ${stats.pillarData.open.ingredients} | ${stats.pillarData.open.origin} | ${stats.pillarData.open.brandOwner} |`);
  
  // Pillar Score Summary
  if (stats.pillarScores.body || stats.pillarScores.planet || stats.pillarScores.ethics || stats.pillarScores.open) {
    lines.push('');
    lines.push('## Pillar Score Summary (Found Products Only)');
    lines.push('| Pillar | Count | Avg | Min | Max |');
    lines.push('|---|---:|---:|---:|---:|');
    
    if (stats.pillarScores.body) {
      lines.push(`| Body | ${stats.pillarScores.body.count} | ${stats.pillarScores.body.avg} | ${stats.pillarScores.body.min} | ${stats.pillarScores.body.max} |`);
    }
    if (stats.pillarScores.planet) {
      lines.push(`| Planet | ${stats.pillarScores.planet.count} | ${stats.pillarScores.planet.avg} | ${stats.pillarScores.planet.min} | ${stats.pillarScores.planet.max} |`);
    }
    if (stats.pillarScores.ethics) {
      lines.push(`| Ethics | ${stats.pillarScores.ethics.count} | ${stats.pillarScores.ethics.avg} | ${stats.pillarScores.ethics.min} | ${stats.pillarScores.ethics.max} |`);
    }
    if (stats.pillarScores.open) {
      lines.push(`| Open | ${stats.pillarScores.open.count} | ${stats.pillarScores.open.avg} | ${stats.pillarScores.open.min} | ${stats.pillarScores.open.max} |`);
    }
  }
  
  // Database Contributions
  lines.push('');
  lines.push('## Database Contributions');
  lines.push('| Database | Primary Hits | Any Contribution | Attempted |');
  lines.push('|---|---:|---:|---:|');
  
  const sortedContributions = stats.dbContributions
    .sort((a, b) => (b.primaryHits + b.anyContribution) - (a.primaryHits + a.anyContribution));
  
  for (const db of sortedContributions) {
    const attempted = stats.databaseQueriedCounts[db.name.toLowerCase().replace(/\s+/g, '')] || stats.total;
    lines.push(`| ${db.name} | ${db.primaryHits} | ${db.anyContribution} | ${attempted} |`);
  }
  
  // Cost vs Contribution
  lines.push('');
  lines.push('## Cost vs Contribution Ranking');
  lines.push('Databases sorted by contribution efficiency (contribution / attempted).');
  lines.push('');
  lines.push('| Database | Attempted | Primary Hits | Any Contribution | Efficiency |');
  lines.push('|---|---:|---:|---:|---:|');
  
  const efficiencyRanking = stats.dbContributions.map(db => {
    const attempted = stats.databaseQueriedCounts[db.name.toLowerCase().replace(/\s+/g, '')] || stats.total;
    const efficiency = attempted > 0 ? ((db.anyContribution / attempted) * 100).toFixed(1) : '0.0';
    return { ...db, attempted, efficiency: parseFloat(efficiency) };
  }).sort((a, b) => b.efficiency - a.efficiency);
  
  for (const db of efficiencyRanking) {
    lines.push(`| ${db.name} | ${db.attempted} | ${db.primaryHits} | ${db.anyContribution} | ${db.efficiency}% |`);
  }
  
  // Zero contribution databases
  const zeroContribution = efficiencyRanking.filter(db => db.anyContribution === 0 && db.primaryHits === 0);
  if (zeroContribution.length > 0) {
    lines.push('');
    lines.push('### Databases with Zero Contribution');
    lines.push('These databases were queried but returned no useful data:');
    lines.push('');
    for (const db of zeroContribution) {
      lines.push(`- **${db.name}**: attempted ${db.attempted}, contribution 0`);
    }
  }
  
  return lines.join('\n');
}

// Main execution
function main() {
  console.log('Analyzing comprehensive test results...\n');
  
  const allStats = {};
  const reports = {};
  
  // Analyze each test
  for (const [testName, fileName] of Object.entries(TEST_FILES)) {
    const filePath = path.join(__dirname, '..', fileName);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: ${fileName} not found, skipping...`);
      continue;
    }
    
    console.log(`Analyzing ${testName}...`);
    const data = extractJSON(filePath);
    const stats = analyzeTestResults(testName, data);
    
    if (stats) {
      allStats[testName] = stats;
      reports[testName] = generateReport(testName, stats, allStats);
      
      // Write individual report
      const reportPath = path.join(__dirname, '..', `${testName}_ANALYSIS.md`);
      fs.writeFileSync(reportPath, reports[testName]);
      console.log(`  ✓ Generated ${reportPath}`);
    }
  }
  
  // Generate master summary
  console.log('\nGenerating master summary...');
  const masterReport = generateMasterSummary(allStats, reports);
  const masterPath = path.join(__dirname, '..', 'COMPREHENSIVE_TEST_ANALYSIS.md');
  fs.writeFileSync(masterPath, masterReport);
  console.log(`  ✓ Generated ${masterPath}`);
  
  console.log('\n✅ Analysis complete!');
}

function generateMasterSummary(allStats, reports) {
  const lines = [
    '# Comprehensive Barcode Test Analysis - Master Summary',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    '',
    '## Overview',
    '',
    'This report summarizes the results of three comprehensive test scenarios:',
    '1. **General Batch**: 100-200 diverse barcodes',
    '2. **Region-Specific**: US, EU, and AU/NZ barcodes',
    '3. **Ethics-Focused**: 50 known ethical/recall-heavy brand barcodes',
    '',
    '---',
    ''
  ];
  
  // Test summaries
  for (const [testName, stats] of Object.entries(allStats)) {
    if (!stats) continue;
    
    lines.push(`## ${testName.toUpperCase()} Test Summary`);
    lines.push('');
    lines.push(`- **Barcodes Tested:** ${stats.total}`);
    lines.push(`- **Products Found:** ${stats.found} (${stats.foundRate}%)`);
    lines.push(`- **Products Not Found:** ${stats.notFound}`);
    lines.push('');
    
    // Top databases
    const topDbs = Object.entries(stats.primaryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    if (topDbs.length > 0) {
      lines.push('**Top 5 Primary Sources:**');
      for (const [db, count] of topDbs) {
        const rate = ((count / stats.total) * 100).toFixed(1);
        lines.push(`- ${db}: ${count} hits (${rate}%)`);
      }
      lines.push('');
    }
    
    // Ethics-specific summary
    if (testName === 'ethics') {
      lines.push('### Ethics Pillar Performance');
      lines.push(`- Products with certifications: ${stats.ethicsSignals.withCertifications}/${stats.total} (${((stats.ethicsSignals.withCertifications / stats.total) * 100).toFixed(1)}%)`);
      lines.push(`- Products with adjusted ethics score: ${stats.ethicsSignals.withAdjustedScore}/${stats.total} (${((stats.ethicsSignals.withAdjustedScore / stats.total) * 100).toFixed(1)}%)`);
      lines.push(`- Products with recalls: ${stats.ethicsSignals.withRecalls}/${stats.total} (${((stats.ethicsSignals.withRecalls / stats.total) * 100).toFixed(1)}%)`);
      lines.push(`- Products with labor violations: ${stats.ethicsSignals.withLaborViolations}/${stats.total} (${((stats.ethicsSignals.withLaborViolations / stats.total) * 100).toFixed(1)}%)`);
      lines.push(`- Products with animal cruelty issues: ${stats.ethicsSignals.withAnimalCruelty}/${stats.total} (${((stats.ethicsSignals.withAnimalCruelty / stats.total) * 100).toFixed(1)}%)`);
      lines.push('');
    }
    
    lines.push('---');
    lines.push('');
  }
  
  // Cross-test analysis
  lines.push('## Cross-Test Database Performance');
  lines.push('');
  lines.push('### Overall Database Hit Rates (All Tests Combined)');
  lines.push('');
  
  // Aggregate database stats
  const dbAggregate = new Map();
  let totalBarcodes = 0;
  
  for (const [testName, stats] of Object.entries(allStats)) {
    if (!stats) continue;
    totalBarcodes += stats.total;
    
    for (const [db, count] of Object.entries(stats.primaryCounts)) {
      if (!dbAggregate.has(db)) {
        dbAggregate.set(db, { primaryHits: 0, anyContribution: 0, attempted: 0 });
      }
      dbAggregate.get(db).primaryHits += count;
    }
    
    for (const db of stats.dbContributions) {
      const normalized = db.name.toLowerCase().replace(/\s+/g, '');
      if (!dbAggregate.has(normalized)) {
        dbAggregate.set(normalized, { primaryHits: 0, anyContribution: 0, attempted: 0 });
      }
      dbAggregate.get(normalized).anyContribution += db.anyContribution;
      dbAggregate.get(normalized).attempted += stats.total;
    }
  }
  
  lines.push('| Database | Total Primary Hits | Total Contributions | Attempted | Efficiency |');
  lines.push('|---|---:|---:|---:|---:|');
  
  const sortedAggregate = Array.from(dbAggregate.entries())
    .map(([db, stats]) => ({
      name: db,
      ...stats,
      efficiency: stats.attempted > 0 ? ((stats.anyContribution / stats.attempted) * 100).toFixed(1) : '0.0'
    }))
    .sort((a, b) => parseFloat(b.efficiency) - parseFloat(a.efficiency));
  
  for (const db of sortedAggregate) {
    lines.push(`| ${db.name} | ${db.primaryHits} | ${db.anyContribution} | ${db.attempted} | ${db.efficiency}% |`);
  }
  
  // Zero contribution databases
  const zeroContribution = sortedAggregate.filter(db => db.anyContribution === 0);
  if (zeroContribution.length > 0) {
    lines.push('');
    lines.push('### Databases with Zero Contribution Across All Tests');
    lines.push('');
    for (const db of zeroContribution) {
      lines.push(`- **${db.name}**: attempted ${db.attempted} times, 0 contributions`);
    }
  }
  
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Detailed Reports');
  lines.push('');
  lines.push('For detailed analysis of each test scenario, see:');
  for (const testName of Object.keys(allStats)) {
    lines.push(`- [${testName.toUpperCase()} Analysis](./${testName}_ANALYSIS.md)`);
  }
  
  return lines.join('\n');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { analyzeTestResults, generateReport, generateMasterSummary };
