import { randomBytes } from 'crypto';
import { admitEvidence, isAssessmentEligibleForReceiver } from '../contributions/admissionContract';
import type { AssessmentReceiverId } from '../contributions/admissionTypes';
import { normalizeClaimKey, canonicalizeVariantKey } from '../contributions/evidenceVersion';
import {
  applyFounderAdminAction,
  confirmEvidence,
  createPendingEvidence,
  disputeEvidence,
} from '../contributions/lifecycle';
import { CURRENT_PRODUCTION_CONTRIBUTION_EPOCH } from '../contributions/productionEpoch';
import type { ContributionDisputeReason } from '../config/contributionPolicy';
import { registerIngredientsNutritionBodyReceiver } from '../ingredientsNutrition/bodyReceiver';
import {
  offNutrientWriteKey,
  projectOffWriteFields,
  type NutritionBasis,
} from '../ingredientsNutrition/nutritionSchema';
import type { NutritionAttribute } from '../ingredientsNutrition/nutritionSchema';
import { sha256Hex } from '../packetContribution/sha256';
import {
  MANUAL_TEXT_CONTENT_TYPE,
  canonicalManualOriginContent,
  manualTextSha256,
  manualTextSubmissionMatches,
  parseManualTextDocument,
  type ManualTextDraft,
} from './manualTextAsset';
import type { ContributionEvidence } from '../contributions/types';
import { deriveEvidenceFacts } from './subjects';
import type { AuthorityStore, AuthorityTx } from './store';
import type {
  AssetChunkRecord,
  AuthorityEnv,
  AuthorityRecordClass,
  DerivedFact,
  DispatchRecord,
  EvidenceSubmissionInput,
  OffFieldLineage,
  SharedEvidenceSnapshot,
  SubmissionOutcome,
  VersionRecord,
} from './types';

const ADMITTED_BY = 'wave4a-evidence-authority';
/** Live write endpoint. Staging world.openfoodfacts.net is not a dispatch target. */
export const OFF_LIVE_WRITE_TARGET = 'https://world.openfoodfacts.org/cgi/product_jqm2.pl';
export const OFF_LIVE_WRITE_HOSTNAME = 'world.openfoodfacts.org';
/** Full-quality phone originals stay bounded without recompression. */
export const MAX_EVIDENCE_ORIGINAL_BYTES = 32 * 1024 * 1024;
export const MAX_EVIDENCE_CHUNK_COUNT = 256;

/**
 * Unset uses the live .org write endpoint. Any other hostname, including
 * world.openfoodfacts.net, is rejected. Payload fields are unchanged.
 */
export function officialOffWriteTarget(raw?: string | null): string | null {
  const value = (raw ?? '').trim();
  if (!value) return OFF_LIVE_WRITE_TARGET;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    if (url.username || url.password) return null;
    if (url.hostname !== OFF_LIVE_WRITE_HOSTNAME) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** Automated test runners must not open a network write to live OFF. */
export function liveOffNetworkWriteAllowed(): boolean {
  if (process.env.JEST_WORKER_ID) return false;
  if (process.env.NODE_ENV === 'test') return false;
  return true;
}

export type OffTransport = (input: {
  target: string;
  fields: Record<string, string>;
}) => Promise<{ ok: boolean; status: number; note?: string }>;

export type AuthorityRuntimeConfig = {
  authorityEnv: AuthorityEnv;
  founderAdminToken?: string;
  offTarget?: string;
  offCredentialsConfigured?: boolean;
  offExecute?: boolean;
  offTransport?: OffTransport;
  now?: () => number;
};

function receiverFor(domain: VersionRecord['domain']): AssessmentReceiverId {
  if (domain === 'origins') return 'open_origins';
  if (domain === 'certifications') return 'ethics_certifications';
  if (domain === 'packet_claims') return 'claims_packet';
  return 'body_ingredients_nutrition';
}

function evidenceIdentity(params: {
  barcode: string;
  domain: string;
  claimKey: string;
  evidenceVersion: number;
  variantKey?: string;
}): string {
  const variant = canonicalizeVariantKey(params.variantKey);
  const variantPart = variant ? `|var:${variant}` : '';
  return `${params.barcode}|${params.domain}|${normalizeClaimKey(params.claimKey)}${variantPart}|v${params.evidenceVersion}`;
}

export class EvidenceAuthority {
  constructor(
    private readonly store: AuthorityStore,
    private readonly config: AuthorityRuntimeConfig
  ) {}

  get authorityEnv(): AuthorityEnv {
    return this.config.authorityEnv;
  }

  get epoch(): string {
    return this.config.authorityEnv === 'production' ? CURRENT_PRODUCTION_CONTRIBUTION_EPOCH : 'wave4a.uat';
  }

  get recordClass(): AuthorityRecordClass {
    return this.config.authorityEnv === 'production' ? 'production' : 'uat';
  }

  async issueCredential(): Promise<{ contributorId: string; token: string }> {
    const token = randomBytes(32).toString('hex');
    const contributorId = `rveel_${randomBytes(8).toString('hex')}`;
    await this.store.saveContributor({
      contributorId,
      tokenHash: sha256Hex(new TextEncoder().encode(token)),
      accountId: null,
      createdAt: this.now(),
    });
    return { contributorId, token };
  }

  async authenticate(token: string | null | undefined): Promise<string | null> {
    if (!token) return null;
    const found = await this.store.findContributorByTokenHash(sha256Hex(new TextEncoder().encode(token)));
    return found?.contributorId ?? null;
  }

  async linkAccount(contributorId: string, accountId: string): Promise<void> {
    await this.store.linkAccount(contributorId, accountId);
  }

  async submit(contributorId: string, input: EvidenceSubmissionInput): Promise<SubmissionOutcome> {
    registerIngredientsNutritionBodyReceiver();
    const outcome = await this.store.transaction(async (tx) => {
      const existing = await tx.getSubmission(input.idempotencyKey);
      if (existing) return existing;
      const derived = deriveEvidenceFacts(input.facts);
      const gaps = derived.gaps;
      const empty = (status: SubmissionOutcome['status']): SubmissionOutcome => ({
        idempotencyKey: input.idempotencyKey,
        status,
        versionIds: [],
        admissionSeqs: [],
        admittedUnitIds: [],
        gaps,
        snapshot: null,
      });
      if (derived.facts.length === 0) {
        const outcome = empty('no_facts');
        await tx.putSubmission({ key: input.idempotencyKey, contributorId, barcode: input.barcode, outcome });
        return outcome;
      }
      let sharedAssetId: string | null = null;
      if (input.contentType === MANUAL_TEXT_CONTENT_TYPE) {
        const outcome = empty('pending_source');
        await tx.putSubmission({ key: input.idempotencyKey, contributorId, barcode: input.barcode, outcome });
        return outcome;
      }
      if (input.sourceBytes?.length) {
        const actualHash = sha256Hex(input.sourceBytes);
        if (!input.declaredSha256 || input.declaredSha256 !== actualHash) {
          const outcome = empty('source_hash_mismatch');
          await tx.putSubmission({ key: input.idempotencyKey, contributorId, barcode: input.barcode, outcome });
          return outcome;
        }
        sharedAssetId = `asset_${randomBytes(6).toString('hex')}`;
        await tx.putAsset({
          assetId: sharedAssetId,
          sha256: actualHash,
          bytes: input.sourceBytes,
          contentType: input.contentType ?? null,
          contributorId,
          barcode: input.barcode,
        });
      }
      const resolved: Array<{ fact: DerivedFact; assetId: string; manualText: boolean }> = [];
      for (const fact of derived.facts) {
        const assetId = fact.finalizedAssetId || sharedAssetId;
        if (!assetId) {
          const outcome = empty('pending_source');
          await tx.putSubmission({ key: input.idempotencyKey, contributorId, barcode: input.barcode, outcome });
          return outcome;
        }
        let governedFact = fact;
        if (fact.finalizedAssetId) {
          const asset = await tx.getAsset(fact.finalizedAssetId);
          if (!asset?.verified) {
            const outcome = empty('source_not_finalized');
            await tx.putSubmission({ key: input.idempotencyKey, contributorId, barcode: input.barcode, outcome });
            return outcome;
          }
          if (asset.contributorId !== contributorId || asset.barcode !== input.barcode) {
            const outcome = empty('source_not_owned');
            await tx.putSubmission({ key: input.idempotencyKey, contributorId, barcode: input.barcode, outcome });
            return outcome;
          }
          if (asset.contentType === MANUAL_TEXT_CONTENT_TYPE) {
            const document = parseManualTextDocument(asset.bytes);
            const storedHash = sha256Hex(asset.bytes);
            const group = derived.facts.filter((item) => item.finalizedAssetId === fact.finalizedAssetId);
            const inputs = input.facts.filter((item) => item.finalizedAssetId === fact.finalizedAssetId);
            const absence =
              inputs.some((item) => item.packetAbsence === true) ||
              group.some((item) => item.subjectKey === 'packet_claims|absence|scope:whole_packet');
            if (
              !document ||
              storedHash !== asset.sha256 ||
              absence ||
              !manualTextSubmissionMatches({ document, inputs, derived: group, barcode: input.barcode })
            ) {
              const outcome = empty(absence || !document ? 'pending_source' : 'source_hash_mismatch');
              await tx.putSubmission({ key: input.idempotencyKey, contributorId, barcode: input.barcode, outcome });
              return outcome;
            }
            if (document.domain === 'origins') {
              const canonical = canonicalManualOriginContent(document);
              if (!canonical) {
                const outcome = empty('source_hash_mismatch');
                await tx.putSubmission({ key: input.idempotencyKey, contributorId, barcode: input.barcode, outcome });
                return outcome;
              }
              governedFact = {
                ...fact,
                exactWording: canonical.exactWording,
                claimValue: canonical.claimValue,
                originStructured: canonical.originStructured,
              };
            }
          }
        }
        const manualText = fact.finalizedAssetId
          ? (await tx.getAsset(fact.finalizedAssetId))?.contentType === MANUAL_TEXT_CONTENT_TYPE
          : false;
        resolved.push({
          fact: manualText
            ? { ...governedFact, region: undefined, machineRunId: undefined, derivedAssetId: undefined }
            : fact,
          assetId,
          manualText,
        });
      }
      const companionIds = [...new Set(input.facts.flatMap((item) => item.companionFinalizedAssetIds || []))];
      for (const companionId of companionIds) {
        const companion = await tx.getAsset(companionId);
        if (!companion?.verified || companion.contentType === MANUAL_TEXT_CONTENT_TYPE) {
          const outcome = empty('source_not_finalized');
          await tx.putSubmission({ key: input.idempotencyKey, contributorId, barcode: input.barcode, outcome });
          return outcome;
        }
        if (companion.contributorId !== contributorId || companion.barcode !== input.barcode) {
          const outcome = empty('source_not_owned');
          await tx.putSubmission({ key: input.idempotencyKey, contributorId, barcode: input.barcode, outcome });
          return outcome;
        }
      }
      const versionIds: string[] = [];
      const admissionSeqs: number[] = [];
      const admittedForOff: VersionRecord[] = [];
      const unitAdmission = new Map<string, boolean>();
      for (const { fact, assetId, manualText } of resolved) {
        const subject = await tx.ensureSubject({
          subjectId: `subject_${randomBytes(6).toString('hex')}`,
          barcode: input.barcode,
          domain: fact.domain,
          subjectKey: fact.subjectKey,
          createdAt: this.now(),
        });
        const versionNo = await tx.nextVersionNo(subject.subjectId);
        const regionId = !manualText && fact.region ? `region_${randomBytes(4).toString('hex')}` : null;
        if (!manualText && fact.region && regionId) {
          await tx.putRegion({ regionId, assetId, transform: fact.region });
        }
        const submitted = this.submittedEvidence(
          input.barcode,
          fact,
          versionNo,
          contributorId,
          assetId,
          manualText,
          companionsForUnit(input.facts, fact.unitId)
        );
        const shadow: ContributionEvidence = {
          ...submitted,
          productionEpoch: CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
          recordClass: 'production',
          admissionStatus: 'submitted',
          receiverEligibility: undefined,
          scoringEligible: false,
          canonicalPromoted: false,
        };
        const admitted = admitEvidence(shadow, {
          admissionReason: 'server_wave4a_admission',
          admittedBy: ADMITTED_BY,
          timestamp: this.now(),
        });
        const serverAdmitted = admitted.ok;
        const scoringEligible =
          serverAdmitted && isAssessmentEligibleForReceiver(admitted.evidence, receiverFor(fact.domain));
        const versionId = `ver_${randomBytes(6).toString('hex')}`;
        const admissionSeq = serverAdmitted ? await tx.nextAdmissionSeq() : null;
        const content: ContributionEvidence = {
          ...(serverAdmitted ? admitted.evidence : submitted),
          productionEpoch: this.epoch,
          recordClass: this.config.authorityEnv === 'production' ? 'production' : undefined,
          canonicalPromoted: false,
          confirmations: [],
          disputes: [],
          evidenceId: submitted.evidenceId,
          evidenceVersion: versionNo,
        };
        if (!serverAdmitted) {
          content.admissionStatus = 'rejected';
          content.admission = undefined;
        }
        const row: VersionRecord = {
          versionId,
          subjectId: subject.subjectId,
          subjectKey: fact.subjectKey,
          barcode: input.barcode,
          domain: fact.domain,
          versionNo,
          submissionKey: input.idempotencyKey,
          contributorId,
          content,
          sourceAssetId: assetId,
          regionId,
          admissionStatus: serverAdmitted ? 'admitted' : 'rejected',
          admissionSeq,
          governance: 'active',
          authorityEpoch: this.epoch,
          authorityRecordClass: this.recordClass,
          createdAt: this.now(),
        };
        await tx.insertVersion(row);
        await tx.appendEvent({
          eventId: `evt_${randomBytes(4).toString('hex')}`,
          versionId,
          kind: serverAdmitted ? 'admitted' : 'rejected',
          actorId: ADMITTED_BY,
          detail: {
            reason: serverAdmitted
              ? scoringEligible
                ? 'server_wave4a_admission'
                : 'admitted_not_scoring_eligible'
              : admitted.reason,
          },
          createdAt: this.now(),
        });
        versionIds.push(versionId);
        if (admissionSeq != null) admissionSeqs.push(admissionSeq);
        if (fact.unitId) {
          unitAdmission.set(fact.unitId, (unitAdmission.get(fact.unitId) ?? true) && serverAdmitted);
        }
        if (serverAdmitted && scoringEligible && fact.domain === 'ingredients_nutrition') admittedForOff.push(row);
      }
      await this.queueOffDispatch(tx, input.barcode, input.idempotencyKey, admittedForOff);
      const outcome: SubmissionOutcome = {
        idempotencyKey: input.idempotencyKey,
        status: admissionSeqs.length > 0 ? 'admitted' : 'rejected',
        versionIds,
        admissionSeqs,
        admittedUnitIds: [...unitAdmission.entries()].filter(([, admitted]) => admitted).map(([unitId]) => unitId),
        gaps: derived.gaps,
        snapshot: await this.snapshotFrom(tx, input.barcode),
      };
      await tx.putSubmission({ key: input.idempotencyKey, contributorId, barcode: input.barcode, outcome });
      return outcome;
    });
    // The admitted snapshot is the consumer acknowledgement. OFF dispatch is durable
    // follow-up work and must not delay this return.
    return outcome;
  }

  /**
   * Send eligible pending or failed OFF dispatches for a barcode.
   * Admission rows are not revised. A failed write stays failed_retryable.
   */
  async dispatchPendingOff(barcode: string): Promise<{ sent: number; failed: number }> {
    if (!this.config.offTransport || this.config.offExecute !== true) return { sent: 0, failed: 0 };
    const ready = (await this.snapshot(barcode)).offDispatch.filter(
      (row) => (row.status === 'pending' || row.status === 'failed_retryable') && row.target
    );
    let sent = 0;
    let failed = 0;
    for (const row of ready) {
      let result: { ok: boolean; status: number; note?: string };
      try {
        result = await this.config.offTransport({ target: row.target as string, fields: row.fields });
      } catch {
        result = { ok: false, status: 0, note: 'dispatch_continuation_failed' };
      }
      let applied = false;
      await this.store.transaction(async (tx) => {
        const current = (await tx.dispatchesForBarcode(barcode)).find((item) => item.dispatchId === row.dispatchId);
        if (!current || (current.status !== 'pending' && current.status !== 'failed_retryable')) return;
        await tx.updateDispatch(row.dispatchId, {
          status: result.ok ? 'sent' : 'failed_retryable',
          readBackStatus: result.note || 'not_run',
        });
        applied = true;
      });
      if (!applied) continue;
      if (result.ok) sent += 1;
      else failed += 1;
    }
    return { sent, failed };
  }

  async confirm(contributorId: string, versionId: string): Promise<{ ok: boolean; reason?: string }> {
    return this.store.transaction(async (tx) => {
      const version = await tx.getVersion(versionId);
      if (!version || version.admissionStatus !== 'admitted') return { ok: false, reason: 'version_not_admitted' };
      if (contributorId === version.contributorId) return { ok: false, reason: 'submitter_cannot_confirm' };
      if ((await tx.responsesForVersion(versionId)).some((item) => item.contributorId === contributorId)) {
        return { ok: false, reason: 'active_response_exists' };
      }
      const result = confirmEvidence(version.content, contributorId, this.now());
      if (!result.ok) return { ok: false, reason: result.reason };
      await tx.putResponse({
        responseId: `resp_${randomBytes(4).toString('hex')}`,
        versionId,
        contributorId,
        kind: 'confirm',
        active: true,
        createdAt: this.now(),
      });
      await tx.appendEvent({
        eventId: `evt_${randomBytes(4).toString('hex')}`,
        versionId,
        kind: 'confirmed',
        actorId: contributorId,
        detail: { evidenceVersion: version.versionNo },
        createdAt: this.now(),
      });
      return { ok: true };
    });
  }

  async dispute(
    contributorId: string,
    versionId: string,
    reason: ContributionDisputeReason = 'other'
  ): Promise<{ ok: boolean; reason?: string; governance?: string }> {
    return this.store.transaction(async (tx) => {
      const version = await tx.getVersion(versionId);
      if (!version || version.admissionStatus !== 'admitted') return { ok: false, reason: 'version_not_admitted' };
      if (contributorId === version.contributorId) return { ok: false, reason: 'submitter_cannot_dispute' };
      if ((await tx.responsesForVersion(versionId)).some((item) => item.contributorId === contributorId)) {
        return { ok: false, reason: 'active_response_exists' };
      }
      const result = disputeEvidence(version.content, contributorId, reason, this.now());
      if (!result.ok) return { ok: false, reason: result.reason };
      await tx.putResponse({
        responseId: `resp_${randomBytes(4).toString('hex')}`,
        versionId,
        contributorId,
        kind: 'dispute',
        active: true,
        createdAt: this.now(),
      });
      await tx.appendEvent({
        eventId: `evt_${randomBytes(4).toString('hex')}`,
        versionId,
        kind: 'disputed',
        actorId: contributorId,
        detail: { reason, evidenceVersion: version.versionNo },
        createdAt: this.now(),
      });
      const disputes = (await tx.responsesForVersion(versionId)).filter((item) => item.kind === 'dispute').length;
      if (disputes >= 2) {
        await tx.updateGovernance(versionId, 'review_required');
        await tx.appendEvent({
          eventId: `evt_${randomBytes(4).toString('hex')}`,
          versionId,
          kind: 'review_required',
          actorId: ADMITTED_BY,
          detail: { disputes },
          createdAt: this.now(),
        });
        return { ok: true, governance: 'review_required' };
      }
      return { ok: true, governance: 'active' };
    });
  }

  async govern(
    adminToken: string | undefined,
    versionId: string,
    action: 'withdraw' | 'suppress'
  ): Promise<{ ok: boolean; reason?: string }> {
    if (!this.config.founderAdminToken || adminToken !== this.config.founderAdminToken) {
      return { ok: false, reason: 'admin_unconfigured_or_rejected' };
    }
    return this.store.transaction(async (tx) => {
      const version = await tx.getVersion(versionId);
      if (!version) return { ok: false, reason: 'version_missing' };
      applyFounderAdminAction(version.content, action, this.now());
      await tx.updateGovernance(versionId, action === 'suppress' ? 'suppressed' : 'withdrawn');
      await tx.appendEvent({
        eventId: `evt_${randomBytes(4).toString('hex')}`,
        versionId,
        kind: action === 'suppress' ? 'suppressed' : 'withdrawn',
        actorId: 'founder-admin',
        detail: { action },
        createdAt: this.now(),
      });
      return { ok: true };
    });
  }

  async snapshot(barcode: string): Promise<SharedEvidenceSnapshot> {
    return this.store.transaction(async (tx) => this.snapshotFrom(tx, barcode));
  }

  async history(barcode: string): Promise<VersionRecord[]> {
    return this.store.transaction(async (tx) => tx.versionsForBarcode(barcode));
  }

  async events(versionId: string) {
    return this.store.transaction(async (tx) => tx.eventsForVersion(versionId));
  }

  private now(): number {
    return this.config.now ? this.config.now() : Date.now();
  }

  private submittedEvidence(
    barcode: string,
    fact: ReturnType<typeof deriveEvidenceFacts>['facts'][number],
    versionNo: number,
    contributorId: string,
    assetId: string,
    manualText = false,
    associatedSourceAssetIds: string[] = []
  ): ContributionEvidence {
    const createdAt = this.now();
    return createPendingEvidence({
      evidenceId: evidenceIdentity({
        barcode,
        domain: fact.domain,
        claimKey: fact.claimKey,
        evidenceVersion: versionNo,
        variantKey: fact.variantKey,
      }),
      barcode,
      domain: fact.domain,
      evidenceVersion: versionNo,
      claimKey: fact.claimKey,
      claimValue: fact.claimValue,
      variantKey: fact.variantKey,
      exactWording: fact.exactWording,
      labelsTags: fact.labelsTags,
      originStructured: fact.originStructured,
      ingredientsNutrition: fact.ingredientsNutrition,
      ...(manualText ? {} : { imageUrl: `private://evidence/${assetId}` }),
      ...(associatedSourceAssetIds.length > 0 ? { associatedSourceAssetIds } : {}),
      sourceProvenance: provenanceLabel(fact),
      submitterId: contributorId,
      createdAt,
      admissionStatus: 'submitted',
    });
  }

  private offPlan(): { target: string | null; execute: boolean } {
    if (this.config.authorityEnv !== 'uat') return { target: null, execute: false };
    const requested = officialOffWriteTarget(this.config.offTarget);
    if (!requested) return { target: null, execute: false };
    const execute = this.config.offExecute === true && this.config.offCredentialsConfigured === true;
    return { target: requested, execute };
  }

  private async queueOffDispatch(
    tx: AuthorityTx,
    barcode: string,
    submissionKey: string,
    admitted: VersionRecord[]
  ): Promise<void> {
    const rows = admitted.filter((row) => row.domain === 'ingredients_nutrition');
    if (rows.length === 0) return;
    const groups = new Map<string, VersionRecord[]>();
    for (const row of rows) {
      const nutrition = row.content.ingredientsNutrition;
      const amounts = nutrition?.nutriments || [];
      const basis = nutrition?.nutritionBasis;
      const key = amounts.length > 0 && basis ? `basis:${basis}` : nutrition?.ingredientsText ? 'ingredients_text' : '';
      if (!key) continue;
      const list = groups.get(key) || [];
      list.push(row);
      groups.set(key, list);
    }
    const plan = this.offPlan();
    for (const [key, group] of groups) {
      const basis = key.startsWith('basis:') ? (key.slice('basis:'.length) as NutritionBasis) : undefined;
      const ingredientsText =
        key === 'ingredients_text'
          ? group.find((row) => row.content.ingredientsNutrition?.ingredientsText)?.content.ingredientsNutrition
              ?.ingredientsText
          : undefined;
      const amounts = basis ? group.flatMap((row) => row.content.ingredientsNutrition?.nutriments || []) : [];
      const fields = projectOffWriteFields({
        barcode,
        ingredientsText,
        nutrition: basis && amounts.length > 0 ? { basis, amounts, nutritionComplete: false } : undefined,
      });
      if (!fields) continue;
      const lineage: OffFieldLineage[] = [];
      for (const row of group) {
        const nutrition = row.content.ingredientsNutrition;
        if (key === 'ingredients_text' && nutrition?.ingredientsText) {
          lineage.push({
            offField: 'ingredients_text',
            versionId: row.versionId,
            subjectKey: row.subjectKey,
            basis: 'ingredients_text',
          });
        }
        for (const amount of nutrition?.nutriments || []) {
          const basis = (nutrition?.nutritionBasis || 'per_100g') as NutritionBasis;
          lineage.push({
            offField: offNutrientWriteKey(amount.attribute as NutritionAttribute, basis),
            versionId: row.versionId,
            subjectKey: row.subjectKey,
            basis: nutrition?.nutritionBasis || key,
          });
        }
      }
      const row: DispatchRecord = {
        dispatchId: `off_${randomBytes(4).toString('hex')}`,
        submissionKey,
        versionId: group[0].versionId,
        barcode,
        status: plan.execute ? 'pending' : 'pending_unconfigured',
        target: plan.target,
        fields,
        lineage,
        readBackStatus: 'not_run',
        createdAt: this.now(),
      };
      await tx.putDispatch(row);
    }
  }

  private async snapshotFrom(
    tx: AuthorityTx,
    barcode: string
  ): Promise<SharedEvidenceSnapshot> {
    const versions = await tx.versionsForBarcode(barcode);
    const prevailing = new Map<string, VersionRecord>();
    for (const version of versions) {
      if (version.admissionStatus !== 'admitted') continue;
      if (version.governance === 'withdrawn' || version.governance === 'suppressed') continue;
      if (version.admissionSeq == null) continue;
      const current = prevailing.get(version.subjectKey);
      if (!current || (current.admissionSeq ?? 0) < version.admissionSeq) prevailing.set(version.subjectKey, version);
    }
    const dispatches = await tx.dispatchesForBarcode(barcode);
    return {
      barcode,
      authorityEnv: this.authorityEnv,
      epoch: this.epoch,
      recordClass: this.recordClass,
      generatedAt: this.now(),
      prevailing: [...prevailing.values()]
        .sort((a, b) => (a.admissionSeq ?? 0) - (b.admissionSeq ?? 0))
        .map((version) => ({
          subjectKey: version.subjectKey,
          versionId: version.versionId,
          versionNo: version.versionNo,
          admissionSeq: version.admissionSeq ?? 0,
          governance: version.governance === 'review_required' ? 'review_required' : 'active',
          evidence: version.content,
        })),
      offDispatch: dispatches.map((row) => ({
        dispatchId: row.dispatchId,
        versionId: row.versionId,
        status: row.status,
        target: row.target,
        readBackStatus: row.readBackStatus,
        fields: row.fields,
        lineage: row.lineage,
      })),
    };
  }

  async putAssetChunk(
    _chunk: AssetChunkRecord
  ): Promise<{ ok: true; stored: 'stored' | 'duplicate' } | { ok: false; reason: string }> {
    return { ok: false, reason: 'chunk_transport_retired' };
  }

  async finalizeAssetUpload(input: {
    uploadId: string;
    declaredSha256: string;
    contentType?: string;
    contributorId: string;
    barcode: string;
  }): Promise<{ ok: true; assetId: string; sha256: string } | { ok: false; reason: string }> {
    if (!input.contributorId || !input.barcode) return { ok: false, reason: 'source_not_owned' };
    if (input.contentType === MANUAL_TEXT_CONTENT_TYPE) {
      return { ok: false, reason: 'manual_text_not_an_image' };
    }
    return { ok: false, reason: 'chunk_transport_retired' };
  }

  async registerPrivateEvidenceImage(input: {
    contributorId: string;
    barcode: string;
    sha256: string;
    byteLength: number;
    width: number;
    height: number;
    profileId: string;
    profileVersion: number;
    lineageSha256: string;
    lineageByteLength: number;
    lineageWidth: number;
    lineageHeight: number;
    blobPathname: string;
  }): Promise<{ ok: true; assetId: string; sha256: string; duplicate: boolean } | { ok: false; reason: string }> {
    if (!input.contributorId || !input.barcode?.trim() || !input.sha256 || !input.blobPathname) {
      return { ok: false, reason: 'source_not_owned' };
    }
    if (input.byteLength < 1) return { ok: false, reason: 'source_hash_mismatch' };
    const barcode = input.barcode.trim();
    return this.store.transaction(async (tx) => {
      const existing = await tx.findVerifiedAssetByBinding({
        sha256: input.sha256,
        contributorId: input.contributorId,
        barcode,
        contentType: 'image/jpeg',
      });
      if (existing) return { ok: true, assetId: existing.assetId, sha256: existing.sha256, duplicate: true };
      const assetId = `asset_${randomBytes(6).toString('hex')}`;
      await tx.putAsset({
        assetId,
        sha256: input.sha256,
        bytes: null,
        byteLength: input.byteLength,
        contentType: 'image/jpeg',
        contributorId: input.contributorId,
        barcode,
        storageKind: 'private_blob',
        blobPathname: input.blobPathname,
        imageWidth: input.width,
        imageHeight: input.height,
        profileId: input.profileId,
        profileVersion: input.profileVersion,
        lineageSha256: input.lineageSha256,
        lineageByteLength: input.lineageByteLength,
        lineageWidth: input.lineageWidth,
        lineageHeight: input.lineageHeight,
      });
      return { ok: true, assetId, sha256: input.sha256, duplicate: false };
    });
  }

  async finalizeManualTextAsset(
    input: ManualTextDraft & { contributorId: string }
  ): Promise<
    | { ok: true; assetId: string; sha256: string; contentType: typeof MANUAL_TEXT_CONTENT_TYPE }
    | { ok: false; reason: string }
  > {
    if (!input.contributorId || !input.barcode?.trim()) return { ok: false, reason: 'source_not_owned' };
    if (input.packetAbsence === true) return { ok: false, reason: 'packet_absence_requires_packet_evidence' };
    const canonical = manualTextSha256({ ...input, barcode: input.barcode.trim() });
    if (!canonical) return { ok: false, reason: 'manual_text_incomplete' };
    const barcode = input.barcode.trim();
    return this.store.transaction(async (tx) => {
      const existing = await tx.findVerifiedAssetByBinding({
        sha256: canonical.sha256,
        contributorId: input.contributorId,
        barcode,
        contentType: MANUAL_TEXT_CONTENT_TYPE,
      });
      if (existing) {
        return { ok: true, assetId: existing.assetId, sha256: existing.sha256, contentType: MANUAL_TEXT_CONTENT_TYPE };
      }
      const assetId = `asset_${randomBytes(6).toString('hex')}`;
      await tx.putAsset({
        assetId,
        sha256: canonical.sha256,
        bytes: canonical.bytes,
        contentType: MANUAL_TEXT_CONTENT_TYPE,
        contributorId: input.contributorId,
        barcode,
      });
      return { ok: true, assetId, sha256: canonical.sha256, contentType: MANUAL_TEXT_CONTENT_TYPE };
    });
  }
}

function companionsForUnit(facts: EvidenceSubmissionInput['facts'], unitId: string | undefined): string[] {
  if (!unitId) return [];
  return [
    ...new Set(
      facts.filter((fact) => fact.unitId === unitId).flatMap((fact) => fact.companionFinalizedAssetIds || [])
    ),
  ];
}

function provenanceLabel(fact: DerivedFact): string | undefined {
  const parts = [
    fact.machineRunId,
    fact.derivedAssetId ? `derived:${fact.derivedAssetId}` : undefined,
    fact.region
      ? `region:${fact.region.x},${fact.region.y},${fact.region.width},${fact.region.height}`
      : undefined,
  ].filter((part): part is string => !!part);
  return parts.length > 0 ? parts.join('|') : undefined;
}
