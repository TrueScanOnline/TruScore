/**
 * Validate a Workstream B pack directory (expects input/ and writes output/).
 *
 * Usage: npx ts-node --project scripts/tsconfig.json scripts/workstreamB-validate-pack.ts <packRoot> [template|populated]
 */
import path from 'path';
import { runWorkstreamBScaffold } from '../src/workstreamB/frozenBenchmarkHardening/bScaffoldRunner';

const packRoot = path.resolve(process.argv[2] ?? '');
const mode = process.argv[3] === 'populated' ? 'populated' : 'template';

if (!packRoot) {
  // eslint-disable-next-line no-console
  console.error('Usage: workstreamB-validate-pack <packRoot> [template|populated]');
  process.exit(2);
}

const result = runWorkstreamBScaffold(packRoot, { mode });
// eslint-disable-next-line no-console
console.log(JSON.stringify({ ok: result.ok, ...result }, null, 2));
process.exit(result.ok ? 0 : 1);
