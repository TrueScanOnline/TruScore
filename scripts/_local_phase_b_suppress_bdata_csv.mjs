import fs from 'fs';

const aliasPath = 'workstreamB/b-data/populated-from-repo-v0/input/benchmark_alias_maps.csv';
const aliasLines = fs.readFileSync(aliasPath, 'utf8').split(/\r?\n/);
const aliasOut = aliasLines.filter((l) => {
  if (!l) return true;
  const lower = l.toLowerCase();
  if (!lower.includes(',ktc,')) return true;
  if (lower.includes('arnott') || lower.includes('birds eye') || lower.includes(',birds eye,') || lower.includes('birdseye')) {
    return false;
  }
  return true;
});
fs.writeFileSync(aliasPath, aliasOut.join('\n'));
console.log('alias maps', aliasLines.length, '->', aliasOut.length);

const brandPath = 'workstreamB/b-data/populated-from-repo-v0/input/benchmark_brand_maps.csv';
const brandLines = fs.readFileSync(brandPath, 'utf8').split(/\r?\n/);
const brandOut = brandLines.filter((l) => {
  if (!l) return true;
  const lower = l.toLowerCase();
  if (lower.includes('bbfaw') && lower.includes('tulip')) return false;
  return true;
});
fs.writeFileSync(brandPath, brandOut.join('\n'));
console.log('brand maps', brandLines.length, '->', brandOut.length);
