/**
 * Server mirror of MVP preselected-only consumer contribution policy.
 *
 * Founder 2026-11-17 default-deny; founder 2026-11-18 corrective reaffirms it
 * after the rejected free-form restore. Must reject prohibited writes before
 * storage / finalisation.
 *
 * RVEEL_MVP_PRESELECTED_ONLY=0 deactivates (post-MVP founder approval only).
 * Ordinary consumers have no bypass. Founder-admin bypass requires matching
 * RVEEL_FOUNDER_ADMIN_TOKEN on X-Rveel-Founder-Admin (explicit, not consumer-reachable).
 */

export const MVP_CONTRIBUTION_INPUT_POLICY_VERSION = 'mvp_preselected_only_v1_20261118';

export function isMvpPreselectedOnlyPolicyActiveServer(): boolean {
  return process.env.RVEEL_MVP_PRESELECTED_ONLY !== '0';
}

export function founderAdminAuthorizesMvpPolicyBypass(
  adminHeader: string | string[] | undefined,
  founderAdminToken: string | undefined
): boolean {
  if (!isMvpPreselectedOnlyPolicyActiveServer()) return true;
  if (!founderAdminToken || founderAdminToken.length < 8) return false;
  const header = Array.isArray(adminHeader) ? adminHeader[0] : adminHeader;
  return typeof header === 'string' && header === founderAdminToken;
}

export function rejectConsumerPhotoUploadIfPolicyActive(params: {
  adminHeader?: string | string[];
  founderAdminToken?: string;
}): { ok: true } | { ok: false; status: number; error: string; policyVersion: string } {
  if (
    founderAdminAuthorizesMvpPolicyBypass(params.adminHeader, params.founderAdminToken)
  ) {
    return { ok: true };
  }
  if (!isMvpPreselectedOnlyPolicyActiveServer()) return { ok: true };
  return {
    ok: false,
    status: 403,
    error: 'mvp_preselected_only_photo_upload_forbidden',
    policyVersion: MVP_CONTRIBUTION_INPUT_POLICY_VERSION,
  };
}

export function rejectConsumerManualProductWriteIfPolicyActive(params: {
  adminHeader?: string | string[];
  founderAdminToken?: string;
}): { ok: true } | { ok: false; status: number; error: string; policyVersion: string } {
  if (
    founderAdminAuthorizesMvpPolicyBypass(params.adminHeader, params.founderAdminToken)
  ) {
    return { ok: true };
  }
  if (!isMvpPreselectedOnlyPolicyActiveServer()) return { ok: true };
  return {
    ok: false,
    status: 403,
    error: 'mvp_preselected_only_manual_product_write_forbidden',
    policyVersion: MVP_CONTRIBUTION_INPUT_POLICY_VERSION,
  };
}

/** EA actions that remain permitted for ordinary authenticated contributors under MVP. */
const MVP_PERMITTED_EA_ACTIONS = new Set([
  'contribution-trace',
  'issue-credential',
  'confirm',
  'dispute',
  'evidence-image-profile',
  'finalize-packet-absence-attestation',
  'submit',
]);

/** EA actions that are always prohibited for ordinary consumers under MVP. */
const MVP_FORBIDDEN_EA_ACTIONS = new Set([
  'authorize-evidence-image',
  'finalize-evidence-image',
  'finalize-manual-text',
  'upload-asset-chunk',
  'finalize-asset',
]);

export function rejectEvidenceAuthorityActionIfPolicyActive(params: {
  action: string;
  adminHeader?: string | string[];
  founderAdminToken?: string;
  /** When action === 'submit', true if any fact uses a photo / manual_text / non-attestation source. */
  submitUsesProhibitedSource?: boolean;
}): { ok: true } | { ok: false; status: number; error: string; policyVersion: string } {
  if (
    founderAdminAuthorizesMvpPolicyBypass(params.adminHeader, params.founderAdminToken)
  ) {
    return { ok: true };
  }
  if (!isMvpPreselectedOnlyPolicyActiveServer()) return { ok: true };

  if (MVP_FORBIDDEN_EA_ACTIONS.has(params.action)) {
    return {
      ok: false,
      status: 403,
      error: 'mvp_preselected_only_evidence_action_forbidden',
      policyVersion: MVP_CONTRIBUTION_INPUT_POLICY_VERSION,
    };
  }

  if (params.action === 'submit' && params.submitUsesProhibitedSource === true) {
    return {
      ok: false,
      status: 403,
      error: 'mvp_preselected_only_evidence_submit_forbidden',
      policyVersion: MVP_CONTRIBUTION_INPUT_POLICY_VERSION,
    };
  }

  if (params.action && !MVP_PERMITTED_EA_ACTIONS.has(params.action) && params.action !== 'withdraw' && params.action !== 'suppress') {
    // Unknown write-like actions fail closed under MVP.
    if (params.action !== '') {
      return {
        ok: false,
        status: 403,
        error: 'mvp_preselected_only_evidence_action_forbidden',
        policyVersion: MVP_CONTRIBUTION_INPUT_POLICY_VERSION,
      };
    }
  }

  return { ok: true };
}

/**
 * Submit is allowed only for packet-absence attestation facts (FM-03R) or
 * closure-only ceasedSubjectKeys without source bytes / image assets.
 */
export function submitPayloadUsesProhibitedMvpSource(body: {
  sourceBase64?: unknown;
  facts?: unknown;
}): boolean {
  if (typeof body.sourceBase64 === 'string' && body.sourceBase64.length > 0) return true;
  if (!Array.isArray(body.facts)) return false;
  for (const raw of body.facts) {
    if (!raw || typeof raw !== 'object') return true;
    const fact = raw as Record<string, unknown>;
    if (fact.packetAbsence === true) {
      // Attestation path: must not also carry arbitrary wording as evidence.
      if (typeof fact.exactWording === 'string' && fact.exactWording.trim().length > 0) return true;
      if (typeof fact.observedWording === 'string' && fact.observedWording.trim().length > 0) return true;
      continue;
    }
    // Any non-absence fact is free-form / photo / structured-with-manual-text under current contracts.
    return true;
  }
  return false;
}
