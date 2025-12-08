const fs = require('fs');
const path = require('path');

const afcdPath = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'afcd.json');
const nzfcdPath = path.join(__dirname, '..', 'backend', 'vercel', 'data', 'nzfcd.json');
const reportPath = path.join(__dirname, '..', 'FSANZ_PRODUCT_COUNT_REPORT.txt');

let report = 'FSANZ PRODUCT COUNT REPORT\n';
report += '='.repeat(80) + '\n\n';

// Count AFCD
if (fs.existsSync(afcdPath)) {
  try {
    const afcd = JSON.parse(fs.readFileSync(afcdPath, 'utf8'));
    const validAFCD = afcd.filter(f => f.foodName && !f.foodName.match(/^Food \d+$/));
    report += `AFCD (Australia):\n`;
    report += `  Total entries: ${afcd.length.toLocaleString()}\n`;
    report += `  Valid foods: ${validAFCD.length.toLocaleString()}\n`;
    report += `  File size: ${(fs.statSync(afcdPath).size / 1024 / 1024).toFixed(2)} MB\n\n`;
  } catch (e) {
    report += `AFCD: Error reading file - ${e.message}\n\n`;
  }
} else {
  report += `AFCD: File not found at ${afcdPath}\n\n`;
}

// Count NZFCD
if (fs.existsSync(nzfcdPath)) {
  try {
    const nzfcd = JSON.parse(fs.readFileSync(nzfcdPath, 'utf8'));
    const validNZFCD = nzfcd.filter(f => f.foodName && !f.foodName.match(/^Food \d+$/));
    report += `NZFCD (New Zealand):\n`;
    report += `  Total entries: ${nzfcd.length.toLocaleString()}\n`;
    report += `  Valid foods: ${validNZFCD.length.toLocaleString()}\n`;
    report += `  File size: ${(fs.statSync(nzfcdPath).size / 1024 / 1024).toFixed(2)} MB\n\n`;
  } catch (e) {
    report += `NZFCD: Error reading file - ${e.message}\n\n`;
  }
} else {
  report += `NZFCD: File not found at ${nzfcdPath}\n\n`;
}

// Calculate total
try {
  const afcd = JSON.parse(fs.readFileSync(afcdPath, 'utf8'));
  const nzfcd = JSON.parse(fs.readFileSync(nzfcdPath, 'utf8'));
  const totalAFCD = afcd.filter(f => f.foodName && !f.foodName.match(/^Food \d+$/)).length;
  const totalNZFCD = nzfcd.filter(f => f.foodName && !f.foodName.match(/^Food \d+$/)).length;
  const total = totalAFCD + totalNZFCD;
  
  report += '='.repeat(80) + '\n';
  report += `TOTAL FSANZ PRODUCTS: ${total.toLocaleString()}\n`;
  report += '='.repeat(80) + '\n\n';
  
  if (total >= 21000) {
    report += `✅ SUCCESS: Found ${total.toLocaleString()} products (meets 21,000+ requirement!)\n`;
  } else {
    report += `⚠️  Found ${total.toLocaleString()} products (target was 21,000+)\n`;
    report += `   Need to process additional Excel files/tabs to reach 21,000+\n`;
  }
} catch (e) {
  report += `Error calculating total: ${e.message}\n`;
}

fs.writeFileSync(reportPath, report);
console.log(report);

