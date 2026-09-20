import fs from 'fs';

const ktcPaths = [
  'src/data/ethics/ktcBrandAliasMap.json',
  'Database files/ETHICS Pillar/KTC folder/ktcBrandAliasMap.json',
];

for (const p of ktcPaths) {
  const rows = JSON.parse(fs.readFileSync(p, 'utf8'));
  const before = rows.length;
  const filtered = rows.filter((r) => {
    const b = String(r.canonical_brand || '');
    return b !== "Arnott's" && b !== 'Birds Eye';
  });
  console.log(p, before, '->', filtered.length, 'removed', before - filtered.length);
  fs.writeFileSync(p, JSON.stringify(filtered, null, 2) + '\n');
}

const bbfawPaths = [
  'src/data/ethics/brandAliasMap.json',
  'Database files/ETHICS Pillar/BBFAW folder/brandAliasMap.json',
];

for (const p of bbfawPaths) {
  const rows = JSON.parse(fs.readFileSync(p, 'utf8'));
  const before = rows.length;
  const filtered = rows.filter((r) => String(r.canonical_brand || '') !== 'Tulip');
  const cleaned = filtered.map((r) => {
    const parent = String(r.parent_entity_exact || '');
    if (!parent.includes('Danish Crown')) return r;
    const aliases = String(r.aliases_csv || '')
      .split(',')
      .map((s) => s.trim())
      .filter((a) => a && a.toLowerCase() !== 'tulip');
    return { ...r, aliases_csv: aliases.join(',') };
  });
  console.log(p, before, '->', cleaned.length, 'removed', before - cleaned.length);
  fs.writeFileSync(p, JSON.stringify(cleaned, null, 2) + '\n');
}
