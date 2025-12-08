const fs = require('fs');
const path = require('path');

console.log('=== INSPECTING DATABASES ===\n');

// Check NZ database
try {
  const nzPath = path.join(__dirname, 'nzfcd.json');
  console.log('NZ Database:', nzPath);
  console.log('File exists:', fs.existsSync(nzPath));
  
  if (fs.existsSync(nzPath)) {
    const nzData = JSON.parse(fs.readFileSync(nzPath, 'utf8'));
    console.log('Type:', Array.isArray(nzData) ? 'Array' : typeof nzData);
    if (Array.isArray(nzData)) {
      console.log('Length:', nzData.length);
      if (nzData.length > 0) {
        const first = nzData[0];
        console.log('First entry keys:', Object.keys(first).join(', '));
        console.log('\nFirst entry (first 10 fields):');
        Object.entries(first).slice(0, 10).forEach(([key, value]) => {
          const valStr = typeof value === 'string' ? value.substring(0, 50) : String(value);
          console.log(`  ${key}: ${valStr}`);
        });
        
        // Find a milk entry
        const milkEntry = nzData.find(entry => {
          return Object.values(entry).some(val => 
            typeof val === 'string' && val.toLowerCase().includes('milk')
          );
        });
        if (milkEntry) {
          console.log('\n=== FOUND MILK ENTRY ===');
          Object.entries(milkEntry).forEach(([key, value]) => {
            if (typeof value === 'string' && value.toLowerCase().includes('milk')) {
              console.log(`  ${key}: ${value}`);
            }
          });
        }
      }
    }
  }
} catch (error) {
  console.error('Error reading NZ database:', error.message);
}

console.log('\n---\n');

// Check AU database
try {
  const auPath = path.join(__dirname, 'afcd.json');
  console.log('AU Database:', auPath);
  console.log('File exists:', fs.existsSync(auPath));
  
  if (fs.existsSync(auPath)) {
    const auData = JSON.parse(fs.readFileSync(auPath, 'utf8'));
    console.log('Type:', Array.isArray(auData) ? 'Array' : typeof auData);
    if (Array.isArray(auData)) {
      console.log('Length:', auData.length);
      if (auData.length > 0) {
        const first = auData[0];
        console.log('First entry keys:', Object.keys(first).join(', '));
        console.log('\nFirst entry (first 10 fields):');
        Object.entries(first).slice(0, 10).forEach(([key, value]) => {
          const valStr = typeof value === 'string' ? value.substring(0, 50) : String(value);
          console.log(`  ${key}: ${valStr}`);
        });
      }
    }
  }
} catch (error) {
  console.error('Error reading AU database:', error.message);
}
