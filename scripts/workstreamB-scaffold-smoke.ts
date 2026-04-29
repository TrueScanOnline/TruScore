/**
 * Smoke: template Workstream B pack + scaffold outputs (writes under pack output/).
 */
import path from 'path';
import { writeTemplatePack, runWorkstreamBScaffold, ensureDirectory } from '../src/workstreamB/frozenBenchmarkHardening/bScaffoldRunner';

const root = path.resolve(__dirname, '..');
const packRoot = path.join(root, 'workstreamB', 'b-data', 'template-v0');

ensureDirectory(packRoot);
writeTemplatePack(packRoot);
const result = runWorkstreamBScaffold(packRoot, { mode: 'template' });

// eslint-disable-next-line no-console
console.log(JSON.stringify({ ok: result.ok, paths: result }, null, 2));
