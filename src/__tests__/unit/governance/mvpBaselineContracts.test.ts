/**
 * Permanent MVP baseline regression contracts.
 * Fail the build if approved recovery contracts silently disappear.
 * Does not certify device journeys — companion to FOUNDER_APPROVED_MVP_FUNCTIONAL_BASELINE.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { isMvpPreselectedOnlyConsumerPolicyActive } from '../../../config/mvpContributionInputPolicy';
import { CORRECT_STRUCTURED_UNAVAILABLE_BODY } from '../../../communityAgreement/correctUnavailableCopy';
import { CLAIMS_PACKET_ABSENCE_PILLAR_LABEL } from '../../../lib/scoreHighlights/highlightContributionLinks';

const root = path.join(__dirname, '../../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

describe('MVP baseline permanent contracts', () => {
  it('keeps preselected-only active by default', () => {
    expect(isMvpPreselectedOnlyConsumerPolicyActive()).toBe(true);
  });

  it('keeps FM-03R consumer label', () => {
    expect(CLAIMS_PACKET_ABSENCE_PILLAR_LABEL).toBe('There are no claims on the packet');
  });

  it('keeps Agree≠Change surfaceGate contract', () => {
    const gate = read('communityAgreement/surfaceGate.ts');
    expect(gate).toContain('publicationAllowsAgreement');
    expect(gate).toMatch(/destination:\s*change\.ok \? change\.destination : null/);
  });

  it('keeps dual-thumbs Correct unavailable path (no silent hide)', () => {
    const bar = read('components/communityAgreement/CommunityAgreementBar.tsx');
    expect(bar).toContain('onCorrectUnavailable');
    expect(bar).toContain('thumbs-down-outline');
    expect(CORRECT_STRUCTURED_UNAVAILABLE_BODY).toMatch(/does not change/i);
  });

  it('keeps Packet Claims shareable item and Result wiring', () => {
    const types = read('features/sharing/types.ts');
    const result = read('../app/result/[barcode].tsx');
    expect(types).toContain("'packetClaims'");
    expect(result).toContain("handleShare('packetClaims')");
    expect(result).toContain('Share packet claims');
  });

  it('keeps transmit reconcile helpers', () => {
    const device = read('evidenceAuthority/device.ts');
    const assessment = read('evidenceAuthority/assessment.ts');
    expect(device).toContain('reconcileFailedTransmit');
    expect(assessment).toContain('fetchAuthoritativeSnapshot');
  });

  it('keeps canonical baseline document in repo', () => {
    const baseline = fs.readFileSync(
      path.join(__dirname, '../../../../docs/governance/FOUNDER_APPROVED_MVP_FUNCTIONAL_BASELINE.md'),
      'utf8'
    );
    expect(baseline).toContain('publicReleaseStatus');
    expect(baseline).toContain('preselected-only');
  });
});
