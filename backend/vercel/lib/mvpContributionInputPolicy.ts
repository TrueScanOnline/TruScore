/**
 * Server mirror of MVP preselected-only consumer contribution policy.
 *
 * Default-deny photos / free text / VLM. Permitted writes:
 * - FM-03R packet-absence attestation
 * - Structured Product Origins (claim type + governed country; no statement /
 *   free text / photo) — founder P0 2026-11-18 restore under MVP restrictions
 *
 * RVEEL_MVP_PRESELECTED_ONLY=0 deactivates (post-MVP founder approval only).
 * Founder-admin bypass requires matching RVEEL_FOUNDER_ADMIN_TOKEN.
 */

export const MVP_CONTRIBUTION_INPUT_POLICY_VERSION = 'mvp_preselected_only_v1_20261118';

const STRUCTURED_ORIGIN_CLAIM_TYPES = new Set([
  'grown_in',
  'produced_in',
  'made_in',
  'packed_in',
]);

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
  'finalize-manual-text', // narrowed below to structured Origins only
  'submit',
]);

/** EA actions that are always prohibited for ordinary consumers under MVP. */
const MVP_FORBIDDEN_EA_ACTIONS = new Set([
  'authorize-evidence-image',
  'finalize-evidence-image',
  'upload-asset-chunk',
  'finalize-asset',
]);

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Structured Origins finalize body: claim type + country, no free-text statement,
 * no typed percentage, no ingredient free text, no photo fields.
 */
export function isStructuredOriginsManualTextBody(body: Record<string, unknown>): boolean {
  if (body.domain !== 'origins') return false;
  if (body.packetAbsence === true) return false;
  if (!STRUCTURED_ORIGIN_CLAIM_TYPES.has(String(body.originClaimType || ''))) return false;
  const countries = Array.isArray(body.originCountries)
    ? body.originCountries.filter((c) => typeof c === 'string' && c.trim().length > 0)
    : [];
  const primary = typeof body.originCountry === 'string' ? body.originCountry.trim() : '';
  if (!primary && countries.length === 0) return false;
  if (nonEmptyString(body.statement)) return false;
  if (nonEmptyString(body.ingredientsText)) return false;
  if (nonEmptyString(body.observedWording)) return false;
  if (nonEmptyString(body.ingredientSubject)) return false;
  if (typeof body.originPercentage === 'number') return false;
  if (nonEmptyString(body.originPercentageQualifier)) return false;
  // percentageNotStated may be true or omitted (treated as not stated when no %).
  return true;
}

export function rejectEvidenceAuthorityActionIfPolicyActive(params: {
  action: string;
  adminHeader?: string | string[];
  founderAdminToken?: string;
  /** When action === 'submit', true if any fact uses a photo / free-text / non-attestation / non-structured-origins source. */
  submitUsesProhibitedSource?: boolean;
  /** Raw POST body — used to narrow finalize-manual-text to structured Origins. */
  body?: Record<string, unknown>;
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

  if (params.action === 'finalize-manual-text') {
    if (params.body && isStructuredOriginsManualTextBody(params.body)) {
      return { ok: true };
    }
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

  if (
    params.action &&
    !MVP_PERMITTED_EA_ACTIONS.has(params.action) &&
    params.action !== 'withdraw' &&
    params.action !== 'suppress'
  ) {
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

function factIsStructuredOriginsOnly(fact: Record<string, unknown>): boolean {
  if (fact.domain !== 'origins') return false;
  if (fact.packetAbsence === true) return false;
  if (nonEmptyString(fact.exactWording)) return false;
  if (nonEmptyString(fact.observedWording)) return false;
  if (nonEmptyString(fact.claimValue) === false && !fact.originStructured) {
    // claimValue often carries country; originStructured is preferred.
  }
  const structured = fact.originStructured;
  if (!structured || typeof structured !== 'object') return false;
  const row = structured as Record<string, unknown>;
  if (!STRUCTURED_ORIGIN_CLAIM_TYPES.has(String(row.claimType || ''))) return false;
  const country =
    (typeof row.primaryCountry === 'string' && row.primaryCountry.trim()) ||
    (Array.isArray(row.countries) &&
      row.countries.find((c) => typeof c === 'string' && c.trim().length > 0));
  if (!country) return false;
  if (typeof row.ingredientOriginPercentage === 'number') return false;
  if (nonEmptyString(row.percentageQualifier)) return false;
  if (nonEmptyString(row.ingredientSubject)) return false;
  return true;
}

/**
 * Submit is allowed for:
 * - packet-absence attestation facts (FM-03R)
 * - structured Origins facts (claim type + country, no free text)
 * - closure-only ceasedSubjectKeys without source bytes
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
      if (typeof fact.exactWording === 'string' && fact.exactWording.trim().length > 0) return true;
      if (typeof fact.observedWording === 'string' && fact.observedWording.trim().length > 0) return true;
      continue;
    }
    if (factIsStructuredOriginsOnly(fact)) continue;
    return true;
  }
  return false;
}
