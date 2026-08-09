/**
 * Preflight: fail if any intended MVP EAS release profile lacks Asset=1.
 * Usage: npx ts-node --project scripts/tsconfig.json scripts/assert-mvp-release-dynamic-signals-asset.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  assertMvpReleaseProfilesHaveDynamicSignalsAsset,
  DYNAMIC_SIGNALS_ASSET_ENV_KEY,
} from '../src/config/mvpReleaseDynamicSignalsAsset';

function main(): void {
  const easPath = path.join(__dirname, '..', 'eas.json');
  const eas = JSON.parse(fs.readFileSync(easPath, 'utf8'));
  const result = assertMvpReleaseProfilesHaveDynamicSignalsAsset(eas);

  if (!result.ok) {
    console.error('[preflight] MVP Dynamic Signals Asset release assert FAILED:');
    for (const f of result.failures) {
      console.error(`  - ${f.profile}: ${f.reason}`);
    }
    process.exit(1);
  }

  console.log(
    `[preflight] OK — ${result.checkedProfiles.length} MVP release profiles have ${DYNAMIC_SIGNALS_ASSET_ENV_KEY}=1`
  );
  for (const p of result.checkedProfiles) {
    console.log(`  ✓ ${p}`);
  }
}

main();
