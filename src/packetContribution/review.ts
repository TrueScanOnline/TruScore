import { getSession, upsertSession } from './sessionStore';
import type {
  EvidenceUnitDomain,
  PacketContributionSession,
  PacketEvidenceUnit,
  ReviewAction,
  ReviewDisposition,
  SupportCoverage,
} from './types';

const ACTIONS: Record<Exclude<ReviewDisposition, null> | 'unclassified', ReviewAction[]> = {
  A: ['accept', 'set_aside'],
  B: ['acknowledge_correction', 'set_aside'],
  C: ['choose_option', 'set_aside'],
  D: ['recapture', 'manual_entry', 'set_aside'],
  unclassified: ['recapture', 'manual_entry', 'set_aside'],
};

export function actionsPermitted(disposition: ReviewDisposition): ReviewAction[] {
  if (disposition === null) return ACTIONS.unclassified;
  return ACTIONS[disposition];
}

export function supportIsBounded(session: PacketContributionSession, support: SupportCoverage): boolean {
  const source = session.sourceAssets.find((asset) => asset.assetId === support.sourceAssetId);
  if (!source) return false;
  if (support.coverage === 'whole_image') {
    return source.framing === 'targeted';
  }
  const derived = session.derivedAssets.find((asset) => asset.derivedAssetId === support.derivedAssetId);
  return !!derived && derived.sourceAssetId === source.assetId && derived.transform.kind === 'region';
}

export async function addManualEvidenceUnit(params: {
  sessionId: string;
  domain: EvidenceUnitDomain;
  statement: string;
  support: SupportCoverage;
  disposition?: ReviewDisposition;
  section?: 'ingredients' | 'nutrition';
  nutritionAmounts?: import('../ingredientsNutrition/nutritionSchema').StatedNutritionAmount[];
  nutritionBasis?: import('../ingredientsNutrition/nutritionSchema').NutritionBasis;
  originClaimType?: import('../config/contributionPolicy').OriginClaimType;
  originCountry?: string;
  originCountries?: string[];
  ingredientSubject?: string;
  originPercentage?: number;
  originPercentageQualifier?: import('../config/contributionPolicy').OriginPercentageQualifier;
  originQualification?: import('../contributions/originStructured').OriginQualification;
  originQualifications?: import('../contributions/originStructured').OriginLocalImported[];
  percentageNotStated?: boolean;
  packetAbsenceAffirmation?: boolean;
}): Promise<PacketEvidenceUnit> {
  const session = await getSession(params.sessionId);
  if (!session) throw new Error('packet_session_missing');
  const statement = params.statement.trim();
  if (!statement && !params.nutritionAmounts?.length && params.packetAbsenceAffirmation !== true) {
    throw new Error('manual_statement_required');
  }
  const unit: PacketEvidenceUnit = {
    unitId: `eu_manual_${session.sessionId}_${session.units.length + 1}`,
    sessionId: session.sessionId,
    domain: params.domain,
    statement: statement || (params.packetAbsenceAffirmation ? '' : 'Nutrition facts'),
    packetAbsenceAffirmation: params.packetAbsenceAffirmation === true,
    support: params.support,
    origin: 'manual',
    extractionRunId: null,
    observationId: null,
    disposition: params.disposition ?? null,
    status: 'open',
    section: params.section,
    nutritionAmounts: params.nutritionAmounts,
    nutritionBasis: params.nutritionBasis,
    originClaimType: params.originClaimType,
    originCountry: params.originCountry,
    originCountries: params.originCountries,
    ingredientSubject: params.ingredientSubject,
    originPercentage: params.originPercentage,
    originPercentageQualifier: params.originPercentageQualifier,
    originQualification: params.originQualification,
    originQualifications: params.originQualifications,
    percentageNotStated: params.percentageNotStated === true,
  };
  await upsertSession({ ...session, units: [...session.units, unit] });
  return unit;
}

export async function applyReviewAction(params: {
  sessionId: string;
  unitId: string;
  action: ReviewAction;
  correctionText?: string;
  chosenOption?: string;
}): Promise<PacketEvidenceUnit> {
  const session = await getSession(params.sessionId);
  if (!session) throw new Error('packet_session_missing');
  const unit = session.units.find((item) => item.unitId === params.unitId);
  if (!unit) throw new Error('evidence_unit_missing');
  if (!actionsPermitted(unit.disposition).includes(params.action)) {
    throw new Error('review_action_not_permitted_for_disposition');
  }
  if (params.action !== 'set_aside' && !supportIsBounded(session, unit.support)) {
    throw new Error('evidence_unit_not_bounded_to_source');
  }
  const next: PacketEvidenceUnit = {
    ...unit,
    reviewAction: params.action,
    status: params.action === 'set_aside' ? 'set_aside' : 'reviewed',
    correctionText: params.correctionText?.trim() || unit.correctionText,
    chosenOption: params.chosenOption?.trim() || unit.chosenOption,
    statement:
      params.action === 'acknowledge_correction' && params.correctionText?.trim()
        ? params.correctionText.trim()
        : params.action === 'choose_option' && params.chosenOption?.trim()
          ? params.chosenOption.trim()
          : params.action === 'manual_entry' && params.correctionText?.trim()
            ? params.correctionText.trim()
            : unit.statement,
  };
  await upsertSession({
    ...session,
    units: session.units.map((item) => (item.unitId === unit.unitId ? next : item)),
  });
  return next;
}

/** Later verticals call this. 4A.1 does not infer A/B/C/D from packet content. */
export async function assignReviewDisposition(params: {
  sessionId: string;
  unitId: string;
  disposition: Exclude<ReviewDisposition, null>;
}): Promise<PacketEvidenceUnit> {
  const session = await getSession(params.sessionId);
  if (!session) throw new Error('packet_session_missing');
  const unit = session.units.find((item) => item.unitId === params.unitId);
  if (!unit) throw new Error('evidence_unit_missing');
  const next = { ...unit, disposition: params.disposition };
  await upsertSession({
    ...session,
    units: session.units.map((item) => (item.unitId === unit.unitId ? next : item)),
  });
  return next;
}
