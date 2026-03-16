/**
 * Sync ETHICS Pillar data from source of truth to app bundle
 *
 * SOURCE OF TRUTH: Database files/ETHICS Pillar/
 * DESTINATION: src/data/ethics/ (bundled with app)
 *
 * Run before build/start: yarn sync-ethics-data
 * Or: npx ts-node --project scripts/tsconfig.json scripts/syncEthicsPillarData.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'Database files', 'ETHICS Pillar');
const DEST_DIR = path.join(ROOT, 'src', 'data', 'ethics');

interface SyncEntry {
  source: string;
  dest: string;
  required: boolean;
}

const SYNC_ENTRIES: SyncEntry[] = [
  {
    source: path.join(SOURCE_DIR, 'bbfaw-2024-data.json'),
    dest: path.join(DEST_DIR, 'bbfaw2024Canonical.json'),
    required: true,
  },
  {
    source: path.join(SOURCE_DIR, 'brandAliasMap.json'),
    dest: path.join(DEST_DIR, 'brandAliasMap.json'),
    required: true,
  },
  {
    source: path.join(SOURCE_DIR, 'bbfawParents.json'),
    dest: path.join(DEST_DIR, 'bbfawParents.json'),
    required: true,
  },
];

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main(): void {
  console.log('ETHICS Pillar Data Sync');
  console.log('========================');
  console.log('Source (truth):', SOURCE_DIR);
  console.log('Destination:', DEST_DIR);
  console.log('');

  ensureDir(DEST_DIR);

  let ok = true;
  for (const entry of SYNC_ENTRIES) {
    if (!fs.existsSync(entry.source)) {
      if (entry.required) {
        console.error('ERROR: Required file not found:', entry.source);
        ok = false;
      } else {
        console.warn('Skip (optional, not found):', entry.source);
      }
      continue;
    }

    const content = fs.readFileSync(entry.source, 'utf-8');
    fs.writeFileSync(entry.dest, content, 'utf-8');
    console.log('Synced:', path.basename(entry.source), '->', path.relative(ROOT, entry.dest));
  }

  if (!ok) {
    console.error('\nSome required files are missing. Run extraction scripts first:');
    console.error('  yarn extract-bbfaw2024      # Creates bbfaw-2024-data.json');
    console.error('  yarn extract-bbfaw-mapping  # Creates brandAliasMap.json, bbfawParents.json');
    process.exit(1);
  }

  console.log('\nDone. ETHICS pillar data is now synced from Database files/ETHICS Pillar.');
}

main();
