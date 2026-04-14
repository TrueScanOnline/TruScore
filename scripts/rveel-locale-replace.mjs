/**
 * One-off style pass for Phase 1 public rebrand in locale JSON.
 * Run from repo root: node scripts/rveel-locale-replace.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const localesDir = path.join(root, 'src', 'i18n', 'locales');
const files = ['en.json', 'fr.json', 'es.json'];

function transform(raw) {
  let s = raw;
  s = s.replace(/TruScore/g, 'Rveel Score');
  s = s.replace(/TrueScore/g, 'Rveel Score');
  s = s.replace(/TrueScan/g, 'Rveel');
  s = s.replace(/TruScan/g, 'Rveel');
  s = s.replace(/Trust Score/g, 'Rveel Score');
  s = s.replace(/trust score/g, 'Rveel Score');
  // Do not replace "TrustScore" inside JSON keys (e.g. minTrustScore) — only spaced product phrase
  s = s.replace(/Rveel Score Score/g, 'Rveel Score');
  return s;
}

for (const f of files) {
  const p = path.join(localesDir, f);
  const before = fs.readFileSync(p, 'utf8');
  const after = transform(before);
  if (before !== after) {
    fs.writeFileSync(p, after, 'utf8');
    console.log('updated', f);
  } else {
    console.log('unchanged', f);
  }
}
