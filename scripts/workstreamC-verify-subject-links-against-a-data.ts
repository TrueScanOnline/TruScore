/**
 * Read-only verification: subject link tokens vs A-Data v0.14 (or path you pass).
 * Does not mutate A-Data. No force-hit / binding CLI flags — only directory paths.
 *
 * Usage:
 *   npx ts-node --project scripts/tsconfig.json scripts/workstreamC-verify-subject-links-against-a-data.ts
 *   npx ts-node --project scripts/tsconfig.json scripts/workstreamC-verify-subject-links-against-a-data.ts <packInputRoot> <aDataInputRoot>
 */

import fs from 'fs';
import path from 'path';
import { parseCsv } from '../src/identity/workstreamA/csv';
import { loadADataMaps } from '../src/workstreamC/skeleton/buildSkeletonPublicationRecords';

const root = path.resolve(__dirname, '..');
const defaultPack = path.join(root, 'workstreamC', 'c-data', 'v0.4', 'input');
const defaultA = path.join(root, 'workstreamA', 'a-data', 'wave1-v0.15', 'input');

function main(): void {
  const packRoot = path.resolve(process.argv[2] ?? defaultPack);
  const aRoot = path.resolve(process.argv[3] ?? defaultA);
  const maps = loadADataMaps(aRoot);
  const links = parseCsv(fs.readFileSync(path.join(packRoot, 'signal_subject_links.csv'), 'utf8'));

  let ok = 0;
  let fixture = 0;
  const issues: string[] = [];

  for (const link of links) {
    const st = link.subject_type ?? '';
    const sid = link.subject_id ?? '';
    const lid = link.link_id ?? '';
    if (st === 'brand') {
      const b = maps.brandsById.get(sid);
      if (!b) issues.push(`${lid}: missing brand ${sid}`);
      else if (b.review_state !== 'reviewed') issues.push(`${lid}: brand ${sid} review_state=${b.review_state}`);
      else ok += 1;
    } else if (st === 'parent') {
      const p = maps.parentsById.get(sid);
      if (!p) issues.push(`${lid}: missing parent ${sid}`);
      else if (p.review_state !== 'reviewed') issues.push(`${lid}: parent ${sid} review_state=${p.review_state}`);
      else ok += 1;
    } else if (st === 'product_family') {
      fixture += 1;
      if (sid === 'SOURCE_PRODUCT_ALFAMINO_400G') ok += 1;
      else issues.push(`${lid}: unknown product_family token ${sid}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        packRoot,
        aDataRoot: aRoot,
        links_checked: links.length,
        brand_parent_ok: ok,
        product_family_fixtures: fixture,
        issues,
        exit_ok: issues.length === 0,
      },
      null,
      2
    )
  );
  process.exit(issues.length === 0 ? 0 : 1);
}

main();
