/**
 * CF-06: admitted contribution recoverable after client acknowledgement failure.
 * Source-contract test — does not invent admission.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('transmit reconcileFailedTransmit (CF-06)', () => {
  const devicePath = path.join(__dirname, '../../../evidenceAuthority/device.ts');
  const assessmentPath = path.join(__dirname, '../../../evidenceAuthority/assessment.ts');
  const device = fs.readFileSync(devicePath, 'utf8');
  const assessment = fs.readFileSync(assessmentPath, 'utf8');

  it('exposes authoritative snapshot fetch for reconcile without local invent', () => {
    expect(assessment).toContain('export async function fetchAuthoritativeSnapshot');
    expect(device).toContain('reconcileFailedTransmit');
    expect(device).toContain('unitMatchesPrevailing');
    expect(device).toContain('notifyEvidenceAdmission');
  });

  it('requires every sendable unit to match prevailing before acknowledging success', () => {
    expect(device).toMatch(
      /if \(!sendable\.every\(\(unit\) => unitMatchesPrevailing\(unit, snapshot\)\)\) return null;/
    );
  });

  it('does not mark admitted when snapshot fetch fails', () => {
    expect(device).toMatch(/async function reconcileFailedTransmit[\s\S]*catch \{\s*return null;/);
  });
});
