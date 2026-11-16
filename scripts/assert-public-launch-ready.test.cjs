'use strict';
/** Regression checks for the public release lock. Requires only Node built-ins. */
const test = require('node:test');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const guard = path.join(root, 'scripts/assert-public-launch-ready.cjs');
function run(args, env={}) {
  const e={...process.env,...env};
  delete e.RVEEL_APPROVED_RELEASE_SHA;
  delete e.EAS_BUILD_PROFILE;
  delete e.EAS_BUILD;
  return cp.spawnSync(process.execPath,[guard,...args], { cwd:root,env:{...e,...env},encoding:'utf8' });
}
test('public release is BLOCKED by default, with no external signoff',()=>{
  const v=run(['--public']);
  assert.notEqual(v.status,0);
  assert.match(v.stderr,/PUBLIC RELEASE DENIED/);
  assert.match(v.stderr,/operating_entity_and_incorporation/);
});
test('EAS production is blocked even when invoked directly',()=>{
  const v=run([],{EAS_BUILD:'true',EAS_BUILD_PROFILE:'production'});
  assert.notEqual(v.status,0);
});
test('EAS preview (store distribution) is blocked',()=>{
  const v=run([],{EAS_BUILD:'true',EAS_BUILD_PROFILE:'preview'});
  assert.notEqual(v.status,0);
});
test('founder closed UAT profile remains available',()=>{
  const v=run([],{EAS_BUILD:'true',EAS_BUILD_PROFILE:'uat-founders-android'});
  assert.equal(v.status,0);
  assert.match(v.stdout,/Closed UAT/);
});
test('unknown EAS profile never bypasses public gate',()=>{
  const v=run([],{EAS_BUILD:'true',EAS_BUILD_PROFILE:'custom-release'});
  assert.notEqual(v.status,0);
});
test('status reminder is informative, not a false launch approval',()=>{
  const v=run(['--status']);
  assert.equal(v.status,0);
  assert.match(v.stdout,/RELEASE: BLOCKED/);
});
