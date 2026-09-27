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
import { projectOffWriteFields } from '../ingredientsNutrition/nutritionSchema';
import { sha256Hex } from '../packetContribution/sha256';
import type { ContributionEvidence } from '../contributions/types';
import { deriveEvidenceFacts } from './subjects';
import type { AuthorityStore, AuthorityTx } from './store';
import type {
  AuthorityEnv,
  AuthorityRecordClass,
  DispatchRecord,
  EvidenceSubmissionInput,
  SharedEvidenceSnapshot,
  SubmissionOutcome,
  VersionRecord,
} from './types';

const ADMITTED_BY = 'wave4a-evidence-authority';

export type OffTransport = (input: {
  target: string;
  fields: Record<string, string>;
}) => Promise<{ ok: boolean; status: number }>;

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
      const gaps = deriveEvidenceFacts(input.facts).gaps;
      if (!input.sourceBytes?.length) {
        const outcome: SubmissionOutcome = {
          idempotencyKey: input.idempotencyKey,
          status: 'pending_source',
          versionIds: [],
          admissionSeqs: [],
          gaps,
          snapshot: null,
        };
        await tx.putSubmission({ key: input.idempotencyKey, contributorId, barcode: input.barcode, outcome });
        return outcome;
      }
      const actualHash = sha256Hex(input.sourceBytes);
      if (!input.declaredSha256 || input.declaredSha256 !== actualHash) {
        const outcome: SubmissionOutcome = {
          idempotencyKey: input.idempotencyKey,
          status: 'source_hash_mismatch',
          versionIds: [],
          admissionSeqs: [],
          gaps,
          snapshot: null,
        };
        await tx.putSubmission({ key: input.idempotencyKey, contributorId, barcode: input.barcode, outcome });
        return outcome;
      }
      const derived = deriveEvidenceFacts(input.facts);
      if (derived.facts.length === 0) {
        const outcome: SubmissionOutcome = {
          idempotencyKey: input.idempotencyKey,
          status: 'no_facts',
          versionIds: [],
          admissionSeqs: [],
          gaps: derived.gaps,
          snapshot: null,
        };
        await tx.putSubmission({ key: input.idempotencyKey, contributorId, barcode: input.barcode, outcome });
        return outcome;
      }
      const assetId = `asset_${randomBytes(6).toString('hex')}`;
      await tx.putAsset({
        assetId,
        sha256: actualHash,
        bytes: input.sourceBytes,
        contentType: input.contentType ?? null,
      });
      const versionIds: string[] = [];
      const admissionSeqs: number[] = [];
      const admittedForOff: VersionRecord[] = [];
      for (const fact of derived.facts) {
        const subject = await tx.ensureSubject({
          subjectId: `subject_${randomBytes(6).toString('hex')}`,
          barcode: input.barcode,
          domain: fact.domain,
          subjectKey: fact.subjectKey,
          createdAt: this.now(),
        });
        const versionNo = await tx.nextVersionNo(subject.subjectId);
        const regionId = fact.region ? `region_${randomBytes(4).toString('hex')}` : null;
        if (fact.region && regionId) {
          await tx.putRegion({ regionId, assetId, transform: fact.region });
        }
        const submitted = this.submittedEvidence(input.barcode, fact, versionNo, contributorId, assetId);
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
        const eligible =
          admitted.ok && isAssessmentEligibleForReceiver(admitted.evidence, receiverFor(fact.domain));
        const versionId = `ver_${randomBytes(6).toString('hex')}`;
        const admissionSeq = eligible ? await tx.nextAdmissionSeq() : null;
        const content: ContributionEvidence = {
          ...(admitted.ok ? admitted.evidence : submitted),
          productionEpoch: this.epoch,
          recordClass: this.config.authorityEnv === 'production' ? 'production' : undefined,
          canonicalPromoted: false,
          confirmations: [],
          disputes: [],
          evidenceId: submitted.evidenceId,
          evidenceVersion: versionNo,
        };
        if (!eligible) {
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
          admissionStatus: eligible ? 'admitted' : 'rejected',
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
          kind: eligible ? 'admitted' : 'rejected',
          actorId: ADMITTED_BY,
          detail: { reason: eligible ? 'server_wave4a_admission' : admitted.ok ? 'receiver_ineligible' : admitted.reason },
          createdAt: this.now(),
        });
        versionIds.push(versionId);
        if (admissionSeq != null) admissionSeqs.push(admissionSeq);
        if (eligible) admittedForOff.push(row);
      }
      await this.queueOffDispatch(tx, input.barcode, input.idempotencyKey, admittedForOff);
      const outcome: SubmissionOutcome = {
        idempotencyKey: input.idempotencyKey,
        status: admissionSeqs.length > 0 ? 'admitted' : 'rejected',
        versionIds,
        admissionSeqs,
        gaps: derived.gaps,
        snapshot: await this.snapshotFrom(tx, input.barcode),
      };
      await tx.putSubmission({ key: input.idempotencyKey, contributorId, barcode: input.barcode, outcome });
      return outcome;
    });
    await this.flushOff(outcome);
    if (outcome.snapshot && outcome.snapshot.offDispatch.some((row) => row.status === 'pending')) {
      return { ...outcome, snapshot: await this.snapshot(outcome.snapshot.barcode) };
    }
    return outcome;
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
    assetId: string
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
      imageUrl: `private://evidence/${assetId}`,
      sourceProvenance: fact.machineRunId,
      submitterId: contributorId,
      createdAt,
      admissionStatus: 'submitted',
    });
  }

  private async queueOffDispatch(
    tx: AuthorityTx,
    barcode: string,
    submissionKey: string,
    admitted: VersionRecord[]
  ): void {
    const rows = admitted.filter((row) => row.domain === 'ingredients_nutrition');
    if (rows.length === 0) return;
    const ingredients = rows.find((row) => row.content.ingredientsNutrition?.ingredientsText)?.content.ingredientsNutrition;
    const amounts = rows.flatMap((row) => row.content.ingredientsNutrition?.nutriments || []);
    const basis = rows.find((row) => row.content.ingredientsNutrition?.nutritionBasis)?.content.ingredientsNutrition
      ?.nutritionBasis;
    const fields = projectOffWriteFields({
      barcode,
      ingredientsText: ingredients?.ingredientsText,
      nutrition: basis && amounts.length > 0 ? { basis, amounts, nutritionComplete: false } : undefined,
    });
    if (!fields) return;
    const target = this.config.offTarget?.trim() || '';
    const productionOff = /world\.openfoodfacts\.org/i.test(target);
    const executable =
      this.config.offExecute === true &&
      !!target &&
      this.config.offCredentialsConfigured === true &&
      !productionOff;
    const row: DispatchRecord = {
      dispatchId: `off_${randomBytes(4).toString('hex')}`,
      submissionKey,
      versionId: rows[0].versionId,
      barcode,
      status: executable ? 'pending' : 'pending_unconfigured',
      target: target || null,
      fields,
      readBackStatus: 'not_run',
      createdAt: this.now(),
    };
    await tx.putDispatch(row);
  }

  private async flushOff(outcome: SubmissionOutcome): Promise<void> {
    const ready = (outcome.snapshot?.offDispatch || []).filter((row) => row.status === 'pending' && row.target);
    if (!this.config.offTransport || ready.length === 0) return;
    for (const row of ready) {
      const result = await this.config.offTransport({ target: row.target as string, fields: row.fields });
      await this.store.transaction(async (tx) => {
        await tx.updateDispatch(row.dispatchId, {
          status: result.ok ? 'sent' : 'failed_retryable',
          readBackStatus: 'not_run',
        });
      });
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
      })),
    };
  }
}
