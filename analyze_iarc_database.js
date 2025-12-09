// Analyze IARC Database Excel File
// Reads and analyzes the structure of the IARC Monographs database

const fs = require('fs');
const path = require('path');

async function analyzeIARCDatabase() {
  const filePath = path.join(__dirname, 'TruScore logic', 'Agents Classified by the IARC Monographs, Volumes 1–140 (1).xlsx');
  
  console.log('='.repeat(80));
  console.log('IARC DATABASE ANALYSIS');
  console.log('='.repeat(80));
  console.log();
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ERROR: File not found: ${filePath}`);
      return;
    }
    
    console.log(`✅ File found: ${filePath}`);
    const stats = fs.statSync(filePath);
    console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log();
    
    // Try to use xlsx library if available
    let XLSX;
    try {
      XLSX = require('xlsx');
    } catch (e) {
      console.log('⚠️  xlsx library not found. Installing...');
      const { execSync } = require('child_process');
      try {
        execSync('npm install xlsx', { stdio: 'inherit' });
        XLSX = require('xlsx');
      } catch (installError) {
        console.log('❌ ERROR: Could not install xlsx library.');
        console.log('   Please run: npm install xlsx');
        return;
      }
    }
    
    // Read Excel file
    console.log('Reading Excel file...');
    const workbook = XLSX.readFile(filePath);
    
    console.log(`✅ File loaded successfully!`);
    console.log(`   Total sheets: ${workbook.SheetNames.length}`);
    console.log();
    
    // Analyze each sheet
    workbook.SheetNames.forEach((sheetName, index) => {
      console.log('='.repeat(80));
      console.log(`SHEET ${index + 1}: ${sheetName}`);
      console.log('='.repeat(80));
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: null });
      
      console.log(`\nTotal rows: ${data.length}`);
      
      if (data.length > 0) {
        // Get column names from first row
        const columns = Object.keys(data[0]);
        console.log(`Total columns: ${columns.length}`);
        console.log();
        
        // Display column names
        console.log('COLUMN STRUCTURE:');
        columns.forEach((col, i) => {
          console.log(`  ${i + 1}. ${col}`);
        });
        console.log();
        
        // Display sample data
        console.log('SAMPLE DATA (First 5 rows):');
        console.log('-'.repeat(80));
        data.slice(0, 5).forEach((row, i) => {
          console.log(`\nRow ${i + 1}:`);
          columns.forEach(col => {
            const value = row[col];
            if (value !== null && value !== undefined) {
              const displayValue = String(value).length > 100 
                ? String(value).substring(0, 100) + '...' 
                : String(value);
              console.log(`  ${col}: ${displayValue}`);
            }
          });
        });
        console.log();
        
        // Analyze IARC Group distribution
        console.log('IARC GROUP ANALYSIS:');
        const groupColumns = columns.filter(col => 
          col.toLowerCase().includes('group') || 
          col.toLowerCase().includes('classification') ||
          col.toLowerCase().includes('iarc') ||
          col.toLowerCase().includes('category')
        );
        
        if (groupColumns.length > 0) {
          groupColumns.forEach(col => {
            const groups = {};
            data.forEach(row => {
              const value = row[col];
              if (value !== null && value !== undefined) {
                const group = String(value).trim();
                groups[group] = (groups[group] || 0) + 1;
              }
            });
            
            console.log(`\n  Column: ${col}`);
            Object.entries(groups)
              .sort((a, b) => b[1] - a[1])
              .forEach(([group, count]) => {
                console.log(`    ${group}: ${count}`);
              });
          });
        } else {
          console.log('  ⚠️  No obvious "Group" column found.');
          console.log('  Checking all columns for IARC classifications...');
          
          columns.forEach(col => {
            const sampleValues = data.slice(0, 20)
              .map(row => String(row[col] || ''))
              .filter(v => v.length > 0);
            
            const hasIARCGroups = sampleValues.some(v => 
              /group\s*[12]?[ab]?/i.test(v) || 
              /2a|2b|group\s*1/i.test(v) ||
              /carcinogenic/i.test(v)
            );
            
            if (hasIARCGroups) {
              console.log(`\n  Possible IARC column: ${col}`);
              console.log(`    Sample values: ${sampleValues.slice(0, 5).join(', ')}`);
            }
          });
        }
        console.log();
        
        // Find substance/agent name columns
        console.log('SUBSTANCE/AGENT COLUMNS:');
        const nameColumns = columns.filter(col => 
          col.toLowerCase().includes('agent') ||
          col.toLowerCase().includes('substance') ||
          col.toLowerCase().includes('name') ||
          col.toLowerCase().includes('chemical') ||
          col.toLowerCase().includes('compound')
        );
        
        if (nameColumns.length > 0) {
          nameColumns.forEach(col => {
            console.log(`  - ${col}`);
            const sample = data[0] && data[0][col] ? String(data[0][col]).substring(0, 100) : 'N/A';
            console.log(`    Sample: ${sample}`);
          });
        } else {
          console.log('  ⚠️  No obvious name columns found.');
          if (columns.length > 0) {
            console.log(`  First column: ${columns[0]}`);
            const sample = data[0] && data[0][columns[0]] 
              ? String(data[0][columns[0]]).substring(0, 100) 
              : 'N/A';
            console.log(`  Sample: ${sample}`);
          }
        }
        console.log();
        
        // Export structure
        const structure = {
          sheetName,
          totalRows: data.length,
          totalColumns: columns.length,
          columns: columns,
          sampleRow: data[0] || {},
          iarcGroups: groupColumns,
          nameColumns: nameColumns
        };
        
        const outputFile = `iarc_database_structure_${index + 1}.json`;
        fs.writeFileSync(outputFile, JSON.stringify(structure, null, 2), 'utf8');
        console.log(`✅ Structure exported to: ${outputFile}`);
        console.log();
      }
    });
    
    console.log('='.repeat(80));
    console.log('ANALYSIS COMPLETE');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
    console.error(error);
  }
}

// Run analysis
analyzeIARCDatabase();

