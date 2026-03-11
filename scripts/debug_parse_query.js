const fs = require('fs');
const lines = fs.readFileSync('real_barcode_batch_results_full.txt','utf8').split(/\r?\n/);
const block = lines.slice(167,205).join('\n');
console.log(block);
try {
  const obj = JSON.parse(block);
  console.log('PARSED', obj.barcode, obj.databases.length);
} catch (e) {
  console.error('PARSE ERROR', e.message);
}
