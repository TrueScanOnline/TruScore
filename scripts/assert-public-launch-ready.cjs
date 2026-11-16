'use strict';
/**
 * RVEEL PUBLIC RELEASE LOCK — legal, territory and licensing decisions are NOT YET APPROVED.
 * Blocks public EAS builds and release scripts. Closed UAT builds remain possible.
 * This check is not a substitute for counsel or store-level release controls.
 */
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const REGISTRY = path.join(ROOT, 'docs/legal/MVP_PUBLIC_LAUNCH_GATE.json');
const REQUIRED = [
  'operating_entity_and_incorporation',
  'territory_nz_counsel_review',
  'territory_au_counsel_review',
  'manufacturer_liability_and_misleading_claims',
  'privacy_and_cross_border_processing',
  'published_terms_and_privacy',
  'versioned_legal_acceptance',
  'monitored_support_privacy_and_disputes',
  'manufacturer_dispute_and_hold_uat',
  'off_database_and_image_reuse',
  'off_contribution_permissions_and_api_identity',
  'bbfaw_ktc_and_certification_rights',
  'retention_deletion_and_breach_response',
  'full_device_backend_share_regression',
  'app_store_disclosures_and_public_domain',
];
const CLOSED_UAT = new Set([
  'development', 'uat-dynamic-signals-ios', 'uat-dynamic-signals-android',
  'uat-founders-android', 'uat-founders-ios',
]);
const valid = s => typeof s === 'string' && s.trim().length > 0;
function actualSourceCommit() {
  if (valid(process.env.EAS_BUILD_GIT_COMMIT_HASH)) return process.env.EAS_BUILD_GIT_COMMIT_HASH.trim();
  try { return cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return ''; }
}
function inspect() {
  const errors = [];
  let gate;
  try { gate = JSON.parse(fs.readFileSync(REGISTRY, 'utf8')); }
  catch (e) { return ['Cannot read legal launch registry: ' + e.message]; }
  if (gate.schemaVersion !== 1) errors.push('Unknown launch registry schema');
  if (gate.publicReleaseStatus !== 'CLEARED') errors.push('Public release explicitly BLOCKED');
  for (const m of ['NZ', 'AU']) if (!gate.initialMarkets?.includes(m)) errors.push('Market ' + m + ' is not approved');
  for (const field of ['registeredName', 'incorporationCountry', 'registrationIdentifier'])
    if (!valid(gate.legalEntity?.[field])) errors.push('Company identification missing: ' + field);
  const byId = new Map((Array.isArray(gate.requirements) ? gate.requirements : []).map(x => [x.id, x]));
  for (const id of REQUIRED) {
    const v = byId.get(id);
    if (!v || v.status !== 'APPROVED' || !valid(v.evidenceRef) || !valid(v.reviewer) || !valid(v.reviewedAt))
      errors.push('Unresolved legal/operational control: ' + id);
  }
  for (const role of ['founder', 'qualifiedCounsel']) {
    const v = gate.finalApproval?.[role];
    if (!v || v.status !== 'APPROVED' || !valid(v.name) || !valid(v.evidenceRef) || !valid(v.approvedAt))
      errors.push('Independent ' + role + ' approval missing');
  }
  // A repository edit alone CANNOT authorize public launch. The protected release
  // environment must attest to the exact Git SHA being built, outside source control.
  const sha = actualSourceCommit();
  const external = process.env.RVEEL_APPROVED_RELEASE_SHA || '';
  if (!/^[a-f0-9]{40}$/i.test(sha)) errors.push('Build source SHA unverified');
  if (!/^[a-f0-9]{40}$/i.test(external) || external.toLowerCase() !== sha.toLowerCase())
    errors.push('No protected external approval for this exact release Git SHA');
  if (!valid(gate.releaseCandidateSourceRef)) errors.push('Release candidate evidence/source reference not approved');
  return errors;
}
function main() {
  const flags = new Set(process.argv.slice(2));
  const profile = process.env.EAS_BUILD_PROFILE || '';
  const easBuild = process.env.EAS_BUILD === 'true' || Boolean(profile);
  // A named UAT profile is not sufficient if a future edit changes its runtime flags.
  // Refuse the UAT exception unless the checked-in EAS profile explicitly preserves
  // non-store runtime and closed prelaunch UAT semantics.
  let verifiedClosedUat = false;
  if (CLOSED_UAT.has(profile)) {
    try {
      const eas = JSON.parse(fs.readFileSync(path.join(ROOT, 'eas.json'), 'utf8'));
      const conf = eas.build?.[profile];
      verifiedClosedUat =
        conf?.env?.EXPO_PUBLIC_STORE_RELEASE === '0' &&
        conf?.env?.EXPO_PUBLIC_CLOSED_PRELAUNCH_VISUAL_UAT === '1';
    } catch { verifiedClosedUat = false; }
  }
  const publicRelease = flags.has('--public') || flags.has('--release') || (easBuild && !verifiedClosedUat);
  if (flags.has('--status') && !publicRelease) {
    const errors = inspect();
    console.log(errors.length ? '[RVEEL MVP LEGAL RELEASE: BLOCKED]' : '[RVEEL MVP legal registry: check passed]');
    errors.forEach(e => console.log(' - ' + e));
    return;
  }
  if (!publicRelease) {
    console.log('[RVEEL] Closed UAT/development permitted; PUBLIC RELEASE REMAINS BLOCKED.');
    return;
  }
  const errors = inspect();
  if (errors.length) {
    console.error('[RVEEL PUBLIC RELEASE DENIED] ' + errors.length + ' missing controls:');
    errors.forEach(e => console.error(' - ' + e));
    console.error('Do not submit or distribute publicly. Incorporation, jurisdiction, counsel, licences, policies and technical UAT require documented approval.');
    process.exitCode = 1;
    return;
  }
  console.log('[RVEEL] Source preflight passed. Store and founder release approval still required.');
}
main();
