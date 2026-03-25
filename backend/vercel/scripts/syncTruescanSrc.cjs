/**
 * Copy repo `src/` into `backend/vercel/truescan-src/` so Vercel CLI deploys
 * (which only uploads this directory) includes TruScore pillar code.
 *
 * Run from repo:  npm run sync-truescan-src --prefix backend/vercel
 * Or:            cd backend/vercel && npm run sync-truescan-src
 */
const fs = require('fs');
const path = require('path');

const vercelRoot = path.join(__dirname, '..');
const repoRoot = path.resolve(vercelRoot, '..', '..');
const srcDir = path.join(repoRoot, 'src');
const destDir = path.join(vercelRoot, 'truescan-src');

if (!fs.existsSync(srcDir)) {
  console.error('[syncTruescanSrc] Cannot find app src:', srcDir);
  console.error('  Run this from backend/vercel after clone (repo root must contain src/).');
  process.exit(1);
}

fs.rmSync(destDir, { recursive: true, force: true });
fs.cpSync(srcDir, destDir, { recursive: true });
console.log('[syncTruescanSrc] Copied', srcDir, '->', destDir);
