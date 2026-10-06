import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme';
import CountryPicker from './CountryPicker';
import { originCountrySlots, placeFromCountrySlots, governedOriginCountryNames } from '../contribution/originCountrySelection';
import {
  activateDevicePrivateByteStore,
  addManualEvidenceUnit,
  getSession,
  handoffReviewedUnits,
  openSessionForProduct,
  runExtraction,
  upsertSession,
  abstainingExtractionProducer,
  type ExtractionProducer,
  type PacketContributionSession,
} from '../packetContribution';
import { listSubmissionResumeAttention, retryParkedEvidenceSubmission, transmitPrevailingClosure, transmitSessionToAuthority } from '../evidenceAuthority/device';
import { acceptLocalCapture, evidenceImageStatus, resumeEvidenceImages, retryParkedEvidenceImage } from '../evidenceImage/pipeline';
import { visibleEvidenceImages } from '../evidenceImage/projection';
import { beginModalTrace, finishModalTrace } from '../evidenceAuthority/contributionTrace';
import {
  NUTRITION_FIELDS,
  type NutritionAttribute,
  type NutritionBasis,
} from '../ingredientsNutrition/nutritionSchema';
import { PRODUCT_ORIGINS_CLAIM_TYPES, type ProductOriginsClaimType } from '../origins/governedFacts';
import type { OriginPercentageQualifier } from '../config/contributionPolicy';
import { capturedOriginQualifications } from '../contributions/originStructured';
import { ceasedPrevailingSubjectKeys, correctionClosureFacts } from '../contribution/correctionClosure';
import {
  PACKET_ABSENCE_CONSUMER_COPY,
  CONTRIBUTION_NOTICE_PARTIAL,
  CONTRIBUTION_NOTICE_SAVED,
  type ContributionEntryContext,
} from '../contribution/resultContributionActions';
import {
  NUTRITION_CONTRIBUTION_BASES,
  nutritionAmountsToSubmit,
  originDraftSignature,
  originRowsToSubmit,
  retainedAfterPartialAdmission,
  type NutritionSourcePrefill,
  type OriginContributionDraft,
} from '../contribution/governedDisplayProjection';
import type { SupportCoverage } from '../packetContribution/types';
import type { SharedEvidenceSnapshot } from '../evidenceAuthority/types';

type Preview = {
  tempKey: string;
  uri: string;
  source: 'camera' | 'gallery';
  bytes: Uint8Array;
  journeyId: string;
  entryContext: string;
};

type OriginDraft = OriginContributionDraft & { intent: 'new' | 'edited' };

const EMPTY_ORIGIN: OriginDraft = {
  claimType: null,
  wording: '',
  place: '',
  ingredient: '',
  percentage: '',
  intent: 'new',
};

const QUALIFIER_LABELS: { value: OriginPercentageQualifier; label: string }[] = [
  { value: 'at_least', label: 'At least' },
  { value: 'exactly', label: 'Exactly' },
  { value: 'more_than', label: 'More than' },
  { value: 'less_than', label: 'Less than' },
];

const ORIGIN_LABELS: Record<ProductOriginsClaimType, string> = {
  produced_in: 'Product of',
  grown_in: 'Grown in',
  made_in: 'Made in',
  packed_in: 'Packed in',
  ingredient_origin: 'Ingredient from',
};

const JOURNEY: Record<
  ContributionEntryContext,
  {
    header: string;
    instruction: string;
    manual: string;
    review: string;
    submit: string;
    another?: string;
  }
> = {
  ingredients: {
    header: 'Ingredients',
    instruction: 'Photograph the ingredients list, or choose a photo you already took.',
    manual: 'Enter ingredients',
    review: 'Ingredients',
    submit: 'Submit ingredients',
  },
  nutrition: {
    header: 'Nutrition',
    instruction: 'Photograph the nutrition information panel, or choose a photo you already took.',
    manual: 'Enter nutrition',
    review: 'Nutrition',
    submit: 'Submit nutrition',
  },
  origins: {
    header: 'Product Origins',
    instruction: 'Photograph the origin statement on the pack, or choose a photo you already took.',
    manual: 'Enter origin statement',
    review: 'Product Origins',
    submit: 'Submit product origins',
    another: 'Add another origin statement',
  },
  packetClaims: {
    header: 'Packet information',
    instruction: 'Photograph the claim or certification on the pack, or choose a photo you already took.',
    manual: 'Type what the pack says',
    review: 'Packet information',
    submit: 'Submit packet information',
    another: 'Add another claim',
  },
  certifications: {
    header: 'Packet information',
    instruction: 'Photograph the claim or certification on the pack, or choose a photo you already took.',
    manual: 'Type what the pack says',
    review: 'Packet information',
    submit: 'Submit packet information',
    another: 'Add another certification',
  },
};

function packetInformationContext(context: ContributionEntryContext): boolean {
  return context === 'packetClaims' || context === 'certifications';
}

function contributionSurface(context: ContributionEntryContext): string {
  return packetInformationContext(context) ? 'packetInformation' : context;
}

function contextForProposal(
  domain: string | undefined,
  section: 'ingredients' | 'nutrition' | undefined
): ContributionEntryContext | null {
  if (domain === 'ingredients_nutrition') return section === 'nutrition' ? 'nutrition' : 'ingredients';
  if (domain === 'origins') return 'origins';
  if (domain === 'packet_claims') return 'packetClaims';
  if (domain === 'certifications') return 'certifications';
  return null;
}

export default function PacketContributionModal({
  visible,
  barcode,
  variantKey,
  entryContext,
  initialIngredients,
  initialNutrition,
  initialOriginContext,
  knownOffOrigin,
  initialClaims,
  initialCertifications,
  packetAbsenceAvailable = true,
  openOnForm = false,
  producer = abstainingExtractionProducer,
  onClose,
  onSharedEvidenceAdmitted,
  onSharedEvidenceFailed,
}: {
  visible: boolean;
  barcode: string;
  variantKey?: string;
  entryContext: ContributionEntryContext;
  initialIngredients?: string;
  initialNutrition?: NutritionSourcePrefill;
  initialOriginContext?: OriginContributionDraft[];
  knownOffOrigin?: string | null;
  initialClaims?: string[];
  initialCertifications?: string[];
  packetAbsenceAvailable?: boolean;
  openOnForm?: boolean;
  producer?: ExtractionProducer;
  onClose: () => void;
  onSharedEvidenceAdmitted?: (snapshot: SharedEvidenceSnapshot | null, complete: boolean) => void | Promise<void>;
  onSharedEvidenceFailed?: () => void;
}) {
  const { colors } = useTheme();
  const [session, setSession] = useState<PacketContributionSession | null>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [surfaceJourneyId, setSurfaceJourneyId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<'capture' | 'entry' | 'review'>('capture');
  const [ingredientsText, setIngredientsText] = useState(initialIngredients || '');
  const [basis, setBasis] = useState<NutritionBasis | null>(null);
  const [amounts, setAmounts] = useState<Partial<Record<NutritionAttribute, string>>>({});
  const [sodiumUnit, setSodiumUnit] = useState<'mg' | 'g'>('mg');
  const [origins, setOrigins] = useState<OriginDraft[]>([EMPTY_ORIGIN]);
  const [countryBlanks, setCountryBlanks] = useState<number[]>([0]);
  const [claims, setClaims] = useState<string[]>(['']);
  const [certs, setCerts] = useState<string[]>(['']);
  const [absence, setAbsence] = useState(false);
  const [skippedProposals, setSkippedProposals] = useState<string[]>([]);
  const [includedContexts, setIncludedContexts] = useState<ContributionEntryContext[]>([entryContext]);
  const [proposalSupport, setProposalSupport] = useState<Partial<Record<ContributionEntryContext, SupportCoverage>>>({});
  const [activeContext, setActiveContext] = useState<ContributionEntryContext>(entryContext);
  const [nutritionEdited, setNutritionEdited] = useState<NutritionAttribute[]>([]);
  const [partialNotice, setPartialNotice] = useState<string | null>(null);
  const [submissionAttention, setSubmissionAttention] = useState<{ idempotencyKey: string; interruptedAt: number }[]>([]);
  const initialIngredientsRef = useRef(initialIngredients);
  const initialNutritionRef = useRef(initialNutrition);
  const initialOriginContextRef = useRef(initialOriginContext);
  const knownOffOriginRef = useRef(knownOffOrigin);
  const initialClaimsRef = useRef(initialClaims);
  const initialCertificationsRef = useRef(initialCertifications);
  const openOnFormRef = useRef(openOnForm);
  const nutritionBaselineRef = useRef<NutritionSourcePrefill>({ basis: 'per_100g', amounts: {}, sodiumUnit: 'mg' });
  initialIngredientsRef.current = initialIngredients;
  initialNutritionRef.current = initialNutrition;
  initialOriginContextRef.current = initialOriginContext;
  knownOffOriginRef.current = knownOffOrigin;
  initialClaimsRef.current = initialClaims;
  initialCertificationsRef.current = initialCertifications;
  openOnFormRef.current = openOnForm;

  useEffect(() => {
    if (!visible) {
      setPreviews([]);
      setSurfaceJourneyId(null);
      return;
    }
    let cancelled = false;
    setPreviews([]);
    setSurfaceJourneyId(`journey_${barcode}_${entryContext}_${Date.now()}`);
    setPhase(openOnFormRef.current ? 'entry' : 'capture');
    setActiveContext(entryContext);
    setIncludedContexts(packetInformationContext(entryContext) ? ['packetClaims', 'certifications'] : [entryContext]);
    setIngredientsText(initialIngredientsRef.current || '');
    const nutrition = initialNutritionRef.current;
    const mvpNutrition: NutritionSourcePrefill = {
      basis: 'per_100g',
      amounts: nutrition?.amounts ?? {},
      sodiumUnit: nutrition?.sodiumUnit ?? 'mg',
    };
    nutritionBaselineRef.current = mvpNutrition;
    setBasis('per_100g');
    setAmounts(mvpNutrition.amounts);
    setSodiumUnit(mvpNutrition.sodiumUnit);
    setNutritionEdited([]);
    const governedOrigins = (initialOriginContextRef.current || []).map((row) => ({
      ...row,
      intent: 'edited' as const,
      percentageNotStated: row.percentage.trim().length === 0,
    }));
    const offPlace = knownOffOriginRef.current || '';
    const originRows: OriginDraft[] =
      governedOrigins.length > 0
        ? governedOrigins
        : offPlace
          ? [
              {
                ...EMPTY_ORIGIN,
                place: offPlace,
                wording: offPlace,
                intent: 'edited',
                percentageNotStated: true,
              },
            ]
          : [EMPTY_ORIGIN];
    if (originRows[0]?.intent === 'edited' && !originRows[0].baseline) {
      originRows[0] = { ...originRows[0], baseline: originDraftSignature(originRows[0]) };
    }
    setOrigins(originRows);
    setCountryBlanks(originRows.map(() => 0));
    const claimRows = (initialClaimsRef.current || []).map((row) => row.trim()).filter((row) => row.length > 0);
    const certRows = (initialCertificationsRef.current || []).map((row) => row.trim()).filter((row) => row.length > 0);
    setClaims(claimRows.length > 0 ? claimRows : ['']);
    setCerts(certRows.length > 0 ? certRows : ['']);
    setAbsence(false);
    setSkippedProposals([]);
    setProposalSupport({});
    setPartialNotice(null);
    (async () => {
      await activateDevicePrivateByteStore();
      const opened = await openSessionForProduct({ barcode, variantKey });
      if (!cancelled) setSession(opened);
    })().catch(() => {
      if (!cancelled) setSession(null);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, barcode, variantKey, entryContext]);

  useEffect(() => {
    if (!visible || !session || busy) return undefined;
    void resumeEvidenceImages();
    const refreshAttention = () => {
      void listSubmissionResumeAttention().then((rows) => {
        setSubmissionAttention(rows.filter((row) => row.sessionId === session.sessionId));
      });
    };
    refreshAttention();
    const timer = setInterval(() => {
      void getSession(session.sessionId).then((next) => {
        if (next) setSession(next);
      });
      refreshAttention();
    }, 1000);
    return () => clearInterval(timer);
  }, [visible, session?.sessionId, busy]);

  const displayedPreviews = useMemo(
    () =>
      visibleEvidenceImages(
        previews,
        surfaceJourneyId ? { journeyId: surfaceJourneyId, entryContext: contributionSurface(activeContext) } : null
      ),
    [previews, surfaceJourneyId, activeContext]
  );
  const targeted = useMemo(
    () =>
      (session?.sourceAssets || []).filter((asset) =>
        displayedPreviews.some((preview) => preview.tempKey === asset.assetId)
      ),
    [session, displayedPreviews]
  );
  const showReadPhotos = producer.kind !== 'abstaining' && targeted.length > 0;
  const proposals = useMemo(() => {
    if (producer.kind === 'abstaining' || !session) return [];
    return session.extractionRuns.flatMap((run) =>
      run.observations
        .map((observation) => ({
          id: observation.observationId,
          text: observation.text,
          support: observation.support,
          context: contextForProposal(observation.proposedDomain, observation.proposedSection),
        }))
        .filter(
          (item): item is { id: string; text: string; support: SupportCoverage; context: ContributionEntryContext } =>
            item.context !== null && !includedContexts.includes(item.context) && !skippedProposals.includes(item.id)
        )
    );
  }, [producer.kind, session, includedContexts, skippedProposals]);

  const acceptPhoto = async (uri: string, source: 'camera' | 'gallery', width: number, height: number) => {
    if (!surfaceJourneyId) return;
    const accepted = await acceptLocalCapture({
      sessionId: session!.sessionId,
      uri,
      source,
      width,
      height,
    });
    const latest = await getSession(session!.sessionId);
    if (latest) setSession(latest);
    setPreviews((current) => [
      ...current,
      {
        tempKey: accepted.assetId,
        uri: accepted.fileUri,
        source,
        bytes: new Uint8Array(),
        journeyId: surfaceJourneyId,
        entryContext: contributionSurface(activeContext),
      },
    ]);
  };

  const captureCamera = async () => {
    if (!session) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const shot = await ImagePicker.launchCameraAsync({ quality: 1, exif: false });
    if (shot.canceled || !shot.assets[0]) return;
    const asset = shot.assets[0];
    setBusy(true);
    try {
      await acceptPhoto(asset.uri, 'camera', asset.width || 0, asset.height || 0);
    } finally {
      setBusy(false);
    }
  };

  const captureGallery = async () => {
    if (!session) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      allowsMultipleSelection: true,
      exif: false,
    });
    if (picked.canceled || picked.assets.length === 0) return;
    setBusy(true);
    try {
      for (const asset of picked.assets) {
        await acceptPhoto(asset.uri, 'gallery', asset.width || 0, asset.height || 0);
      }
    } finally {
      setBusy(false);
    }
  };

  const retake = async (preview: Preview) => {
    if (!session) return;
    const latest = await getSession(session.sessionId);
    if (!latest) return;
    const next = await upsertSession({
      ...latest,
      sourceAssets: latest.sourceAssets.filter((item) => item.assetId !== preview.tempKey),
      units: latest.units.filter((unit) => unit.support.sourceAssetId !== preview.tempKey),
    });
    setSession(next);
    setPreviews((current) => current.filter((item) => item.tempKey !== preview.tempKey));
  };

  const readPhotos = async () => {
    if (!session || producer.kind === 'abstaining') return;
    setBusy(true);
    try {
      const extracted = await runExtraction({ sessionId: session.sessionId, producer });
      setSession(extracted.session);
    } finally {
      setBusy(false);
    }
  };

  const acceptProposal = (proposal: {
    id: string;
    text: string;
    support: SupportCoverage;
    context: ContributionEntryContext;
  }) => {
    const next = packetInformationContext(proposal.context)
      ? (['packetClaims', 'certifications'] as ContributionEntryContext[])
      : [proposal.context];
    setIncludedContexts((rows) => [...new Set([...rows, ...next])]);
    setProposalSupport((current) => ({ ...current, [proposal.context]: proposal.support }));
    if (proposal.context === 'ingredients') {
      setIngredientsText((current) => current.trim() || proposal.text);
    } else if (proposal.context === 'packetClaims') {
      setClaims((rows) => (rows.length === 1 && !rows[0].trim() ? [proposal.text] : [...rows, proposal.text]));
    } else if (proposal.context === 'certifications') {
      setCerts((rows) => (rows.length === 1 && !rows[0].trim() ? [proposal.text] : [...rows, proposal.text]));
    } else if (proposal.context === 'origins') {
      setOrigins((rows) => {
        const empty = rows.length === 1 && !rows[0].wording.trim() && !rows[0].place.trim();
        const drafted = { ...EMPTY_ORIGIN, wording: proposal.text };
        return empty ? [drafted] : [...rows, drafted];
      });
    }
    setActiveContext(proposal.context);
    setPhase('review');
  };

  const supportFor = (context?: ContributionEntryContext) => {
    if (context && proposalSupport[context]) return proposalSupport[context];
    const asset = targeted[0];
    if (asset) return { coverage: 'whole_image' as const, sourceAssetId: asset.assetId };
    return { coverage: 'whole_image' as const, sourceAssetId: 'manual-text-only' };
  };

  const markReviewed = async (unitId: string) => {
    const latest = await getSession(session!.sessionId);
    if (!latest) return;
    await upsertSession({
      ...latest,
      units: latest.units.map((unit) =>
        unit.unitId === unitId ? { ...unit, status: 'reviewed' as const, reviewAction: 'manual_entry' as const } : unit
      ),
    });
  };

  const submit = async () => {
    if (!session) return;
    const trace = beginModalTrace(Platform.OS);
    trace.mark('submit_tap');
    setBusy(true);
    try {
      trace.mark('local_handoff_begin');
      const created: string[] = [];
      const observations: { unitId: string; label: string; kind: 'ingredients' | 'nutrition' | 'origin' | 'claim' | 'cert' | 'absence'; index: number }[] = [];
      const contexts = includedContexts;
      const closure = correctionClosureFacts({
        ...(contexts.includes('ingredients')
          ? { initialIngredients: initialIngredientsRef.current, ingredientsText }
          : {}),
        ...(contexts.includes('nutrition')
          ? {
              initialNutrition: nutritionBaselineRef.current,
              nutrition: { basis: basis || nutritionBaselineRef.current.basis, amounts, sodiumUnit },
            }
          : {}),
        ...(contexts.includes('origins')
          ? { initialOrigins: initialOriginContextRef.current, origins }
          : {}),
        ...(contexts.includes('packetClaims') || contexts.includes('certifications')
          ? {
              initialClaims: initialClaimsRef.current,
              claims,
              initialCertifications: initialCertificationsRef.current,
              certifications: certs,
            }
          : {}),
      });
      const ceased = ceasedPrevailingSubjectKeys(closure.baseline, closure.represented);
      const freshWordings = (current: string[], initial: string[] | undefined) => {
        const remaining = new Map<string, number>();
        for (const row of initial || []) {
          const text = row.trim();
          if (!text) continue;
          remaining.set(text, (remaining.get(text) || 0) + 1);
        }
        const fresh: string[] = [];
        for (const row of current) {
          const text = row.trim();
          if (!text) continue;
          const count = remaining.get(text) || 0;
          if (count > 0) remaining.set(text, count - 1);
          else fresh.push(text);
        }
        return fresh;
      };
      if (contexts.includes('ingredients')) {
        const text = ingredientsText.trim();
        const initialText = (initialIngredientsRef.current || '').trim();
        if (text && text !== initialText) {
          const unit = await addManualEvidenceUnit({
            sessionId: session.sessionId,
            domain: 'ingredients_nutrition',
            section: 'ingredients',
            statement: text,
            support: supportFor('ingredients'),
          });
          created.push(unit.unitId);
          observations.push({ unitId: unit.unitId, label: text, kind: 'ingredients', index: 0 });
        }
      }
      if (contexts.includes('nutrition') && basis) {
        const stated = nutritionAmountsToSubmit(
          { basis, amounts, sodiumUnit },
          nutritionBaselineRef.current,
          nutritionEdited
        );
        if (stated.length > 0) {
          const unit = await addManualEvidenceUnit({
            sessionId: session.sessionId,
            domain: 'ingredients_nutrition',
            section: 'nutrition',
            statement: 'Nutrition facts',
            nutritionBasis: basis,
            nutritionAmounts: stated,
            support: supportFor('nutrition'),
          });
          created.push(unit.unitId);
          observations.push({
            unitId: unit.unitId,
            label: stated.map((amount) => `${amount.attribute} ${amount.value} ${amount.unit}`).join(', '),
            kind: 'nutrition',
            index: 0,
          });
        }
      }
      if (contexts.includes('origins')) {
        const originRows = originRowsToSubmit(origins);
        for (let index = 0; index < originRows.length; index += 1) {
          const row = originRows[index];
          const places = governedOriginCountryNames(row.place);
          const wording = row.wording.trim();
          if (!wording || places.length === 0) continue;
          const percentage = Number(row.percentage);
          const statedPercentage = !row.percentageNotStated && Number.isFinite(percentage) && row.percentage.trim();
          const qualifications = capturedOriginQualifications({
            local: row.local === true,
            imported: row.imported === true,
            multiple: false,
          });
          const unit = await addManualEvidenceUnit({
            sessionId: session.sessionId,
            domain: 'origins',
            statement: wording,
            originClaimType: row.claimType,
            originCountry: places[0],
            originCountries: places.length > 1 ? places : undefined,
            ingredientSubject: row.claimType === 'ingredient_origin' ? row.ingredient.trim() : undefined,
            originPercentage: statedPercentage ? percentage : undefined,
            originPercentageQualifier: statedPercentage ? row.qualifier : undefined,
            originQualification: qualifications.originQualification,
            originQualifications: qualifications.originQualifications,
            percentageNotStated: row.percentageNotStated === true && !statedPercentage,
            support: supportFor('origins'),
          });
          created.push(unit.unitId);
          observations.push({ unitId: unit.unitId, label: wording, kind: 'origin', index });
        }
      }
      if (contexts.includes('packetClaims') || contexts.includes('certifications')) {
        const positiveClaims = claims.map((claim) => claim.trim()).filter((claim) => claim.length > 0);
        const positiveCerts = certs.map((cert) => cert.trim()).filter((cert) => cert.length > 0);
        const absenceOnly = absence && positiveClaims.length === 0 && positiveCerts.length === 0;
        if (absenceOnly && targeted.length > 0) {
          const unit = await addManualEvidenceUnit({
            sessionId: session.sessionId,
            domain: 'packet_claims',
            statement: '',
            packetAbsenceAffirmation: true,
            support: { coverage: 'whole_image', sourceAssetId: targeted[0].assetId },
          });
          created.push(unit.unitId);
          observations.push({ unitId: unit.unitId, label: PACKET_ABSENCE_CONSUMER_COPY, kind: 'absence', index: 0 });
        }
        if (!absenceOnly) {
          const freshClaims = freshWordings(claims, initialClaimsRef.current);
          const freshCerts = freshWordings(certs, initialCertificationsRef.current);
          const claimIndexes = new Map<string, number[]>();
          claims.forEach((claim, index) => {
            const text = claim.trim();
            if (!text) return;
            const rows = claimIndexes.get(text) || [];
            rows.push(index);
            claimIndexes.set(text, rows);
          });
          const certIndexes = new Map<string, number[]>();
          certs.forEach((cert, index) => {
            const text = cert.trim();
            if (!text) return;
            const rows = certIndexes.get(text) || [];
            rows.push(index);
            certIndexes.set(text, rows);
          });
          for (const text of freshClaims) {
            const index = claimIndexes.get(text)?.shift() ?? 0;
            const unit = await addManualEvidenceUnit({
              sessionId: session.sessionId,
              domain: 'packet_claims',
              statement: text,
              support: supportFor('packetClaims'),
            });
            created.push(unit.unitId);
            observations.push({ unitId: unit.unitId, label: text, kind: 'claim', index });
          }
          for (const text of freshCerts) {
            const index = certIndexes.get(text)?.shift() ?? 0;
            const unit = await addManualEvidenceUnit({
              sessionId: session.sessionId,
              domain: 'certifications',
              statement: text,
              support: supportFor('certifications'),
            });
            created.push(unit.unitId);
            observations.push({ unitId: unit.unitId, label: text, kind: 'cert', index });
          }
        }
      }
      if (created.length === 0) {
        trace.mark('local_handoff_end', 'none');
        if (ceased.length === 0) return;
        const closed = await transmitPrevailingClosure(barcode, ceased, trace);
        if (!closed.admitted) {
          setPartialNotice(CONTRIBUTION_NOTICE_SAVED);
          onSharedEvidenceFailed?.();
          return;
        }
        await onSharedEvidenceAdmitted?.(closed.snapshot, true);
        trace.mark('modal_close');
        onClose();
        return;
      }
      const latest = await getSession(session.sessionId);
      if (latest) {
        await upsertSession({
          ...latest,
          units: latest.units.map((unit) => {
            if (!created.includes(unit.unitId)) return unit;
            const support = reviewedUnitSupport({
              unitId: unit.unitId,
              packetAbsence: unit.packetAbsenceAffirmation === true,
              photos: targeted.map((asset) => ({
                assetId: asset.assetId,
                imagePhase: asset.imagePhase,
                remoteAssetId: asset.remoteAssetId,
              })),
            });
            return {
              ...unit,
              support: { coverage: 'whole_image' as const, sourceAssetId: support.sourceAssetId },
              ...(support.companionSourceAssetIds
                ? { companionSourceAssetIds: support.companionSourceAssetIds }
                : { companionSourceAssetIds: undefined }),
            };
          }),
        });
      }
      for (const unitId of created) await markReviewed(unitId);
      const handed = await handoffReviewedUnits({
        sessionId: session.sessionId,
        persistRemote: false,
      });
      const submitted = handed.filter((item) => item.outcome === 'submitted');
      trace.mark('local_handoff_end', submitted.length > 0 ? 'ok' : 'none');
      if (submitted.length === 0) {
        setPartialNotice(CONTRIBUTION_NOTICE_SAVED);
        onSharedEvidenceFailed?.();
        return;
      }
      const transmitted = await transmitSessionToAuthority(session.sessionId, trace, ceased);
      if (transmitted.pendingImage) {
        const parked = targeted.some((asset) => asset.imagePhase === 'parked_after_interrupted_resume');
        setPartialNotice(parked ? 'This photo needs attention.' : 'Preparing photo…');
        if (parked) setPhase('capture');
        return;
      }
      if (!transmitted.admitted) {
        setPartialNotice(CONTRIBUTION_NOTICE_SAVED);
        onSharedEvidenceFailed?.();
        return;
      }
      setPreviews([]);
      const retained = retainedAfterPartialAdmission(observations, transmitted.admittedUnitIds);
      await onSharedEvidenceAdmitted?.(transmitted.snapshot, retained.complete);
      if (retained.complete) {
        trace.mark('modal_close');
        onClose();
        return;
      }
      const held = await getSession(session.sessionId);
      if (held) {
        const refusedIds = new Set(retained.refused.map((row) => row.unitId));
        await upsertSession({
          ...held,
          units: held.units.map((unit) => (refusedIds.has(unit.unitId) ? { ...unit, status: 'open' as const } : unit)),
        });
      }
      const admittedKinds = new Set(retained.admitted.map((row) => row.kind));
      if (admittedKinds.has('ingredients')) setIngredientsText('');
      if (admittedKinds.has('nutrition')) {
        setAmounts({});
        setBasis(null);
        setNutritionEdited([]);
      }
      if (admittedKinds.has('absence')) setAbsence(false);
      const admittedClaims = new Set(retained.admitted.filter((row) => row.kind === 'claim').map((row) => row.index));
      const admittedCerts = new Set(retained.admitted.filter((row) => row.kind === 'cert').map((row) => row.index));
      const admittedOrigins = new Set(retained.admitted.filter((row) => row.kind === 'origin').map((row) => row.index));
      if (admittedClaims.size > 0) setClaims((rows) => rows.map((row, index) => (admittedClaims.has(index) ? '' : row)));
      if (admittedCerts.size > 0) setCerts((rows) => rows.map((row, index) => (admittedCerts.has(index) ? '' : row)));
      if (admittedOrigins.size > 0) {
        setOrigins((rows) => {
          const remaining = originRowsToSubmit(rows).filter((_, index) => !admittedOrigins.has(index));
          const next =
            remaining.length > 0
              ? remaining.map((row) => ({ ...row, intent: row.intent || 'edited' }))
              : [EMPTY_ORIGIN];
          setCountryBlanks(next.map(() => 0));
          return next;
        });
      }
      setPartialNotice(
        `${CONTRIBUTION_NOTICE_PARTIAL} Not added: ${retained.refused.map((row) => row.label).join('; ')}`
      );
      setPhase('review');
    } catch {
      trace.mark('submit_failed', 'failed');
      onSharedEvidenceFailed?.();
    } finally {
      trace.flush('modal_finally');
      finishModalTrace();
      setBusy(false);
    }
  };

  const needsAttention = (session?.sourceAssets || []).filter((asset) => asset.imagePhase === 'parked_after_interrupted_resume');

  const retryPhoto = async (assetId: string) => {
    if (!session) return;
    setBusy(true);
    try {
      await retryParkedEvidenceImage(session.sessionId, assetId);
      const latest = await getSession(session.sessionId);
      if (latest) setSession(latest);
    } finally {
      setBusy(false);
    }
  };

  const retrySubmission = async (idempotencyKey: string) => {
    setBusy(true);
    try {
      await retryParkedEvidenceSubmission(idempotencyKey);
      if (session) {
        const rows = await listSubmissionResumeAttention();
        setSubmissionAttention(rows.filter((row) => row.sessionId === session.sessionId));
      }
    } finally {
      setBusy(false);
    }
  };

  const journey = JOURNEY[activeContext];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        style={[styles.page, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: 48 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={[styles.header, { color: colors.text }]}>{journey.header}</Text>
        {phase === 'capture' ? (
          <View>
            <Text style={[styles.body, { color: colors.text }]}>{journey.instruction}</Text>
            <View style={styles.row}>
              <TouchableOpacity onPress={captureCamera} style={styles.button} accessibilityRole="button">
                <Text style={styles.buttonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={captureGallery} style={styles.button} accessibilityRole="button">
                <Text style={styles.buttonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
            {targeted.filter((asset) => asset.imagePhase !== 'parked_after_interrupted_resume' && evidenceImageStatus(asset)).map((asset) => (
              <Text key={asset.assetId} style={{ color: colors.text }}>
                {evidenceImageStatus(asset)}
              </Text>
            ))}
            {needsAttention.map((asset) => (
              <View key={`attention-${asset.assetId}`}>
                <Text style={{ color: colors.text }}>
                  {evidenceImageStatus(asset)}
                </Text>
                <TouchableOpacity onPress={() => void retryPhoto(asset.assetId)} style={styles.button} accessibilityRole="button">
                  <Text style={styles.buttonText}>Retry photo</Text>
                </TouchableOpacity>
              </View>
            ))}
            {submissionAttention.map((item) => (
              <View key={item.idempotencyKey}>
                <Text style={{ color: colors.text }}>This send needs attention.</Text>
                <TouchableOpacity onPress={() => void retrySubmission(item.idempotencyKey)} style={styles.button} accessibilityRole="button">
                  <Text style={styles.buttonText}>Retry send</Text>
                </TouchableOpacity>
              </View>
            ))}
            {displayedPreviews.map((preview) => (
              <View key={preview.tempKey} style={styles.previewRow}>
                <Image source={{ uri: preview.uri }} style={styles.thumb} />
                <TouchableOpacity onPress={() => retake(preview)}>
                  <Text style={{ color: colors.primary }}>Retake</Text>
                </TouchableOpacity>
              </View>
            ))}
            {showReadPhotos ? (
              <TouchableOpacity onPress={readPhotos} style={styles.button}>
                <Text style={styles.buttonText}>Read photos</Text>
              </TouchableOpacity>
            ) : null}
            {proposals.length > 0 ? (
              <View>
                <Text style={[styles.body, { color: colors.text }]}>Also found on this photo</Text>
                {proposals.map((proposal) => (
                  <View key={proposal.id} style={styles.row}>
                    <Text style={{ color: colors.text }}>{proposal.text}</Text>
                    <TouchableOpacity onPress={() => acceptProposal(proposal)}>
                      <Text style={{ color: colors.primary }}>Review</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSkippedProposals((rows) => [...rows, proposal.id])}>
                      <Text style={{ color: colors.primary }}>Skip</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}
            <TouchableOpacity
              onPress={() => setPhase('entry')}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{journey.manual}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {phase === 'entry' || phase === 'review' ? (
          <View>
            {phase === 'review'
              ? displayedPreviews.map((preview) => (
                  <View key={preview.tempKey} style={styles.previewRow}>
                    <Image source={{ uri: preview.uri }} style={styles.thumb} />
                    <TouchableOpacity onPress={() => retake(preview)}>
                      <Text style={{ color: colors.primary }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))
              : null}
            <TouchableOpacity
              onPress={() => {
                if (phase === 'review' && activeContext !== entryContext) {
                  setActiveContext(entryContext);
                  setPhase('entry');
                  return;
                }
                setPhase(phase === 'review' ? 'entry' : 'capture');
              }}
            >
              <Text style={{ color: colors.primary }}>Back</Text>
            </TouchableOpacity>
            {activeContext === 'ingredients' ? (
              <View>
                <TextInput
                  value={ingredientsText}
                  onChangeText={setIngredientsText}
                  multiline
                  placeholder="Ingredients"
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                />
                <TouchableOpacity onPress={() => setIngredientsText('')}>
                  <Text style={{ color: colors.primary }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {activeContext === 'nutrition' ? (
              <View>
                <Text style={{ color: colors.text }}>{NUTRITION_CONTRIBUTION_BASES[0].label}</Text>
                {NUTRITION_FIELDS.map((field) => (
                  <View key={field.attribute}>
                    <Text style={{ color: colors.text }}>{field.packetConcept}</Text>
                    <TextInput
                      value={amounts[field.attribute] || ''}
                      onChangeText={(value) => {
                        setNutritionEdited((current) =>
                          current.includes(field.attribute) ? current : [...current, field.attribute]
                        );
                        setAmounts((current) => ({ ...current, [field.attribute]: value }));
                      }}
                      keyboardType="decimal-pad"
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    />
                    {field.attribute === 'sodium' ? (
                      <View style={styles.row}>
                        <TouchableOpacity
                          onPress={() => {
                            setSodiumUnit('mg');
                            setNutritionEdited((current) => (current.includes('sodium') ? current : [...current, 'sodium']));
                            setAmounts((current) => {
                              if (sodiumUnit !== 'g') return current;
                              const grams = Number(current.sodium);
                              if (!Number.isFinite(grams)) return current;
                              return { ...current, sodium: String(grams * 1000) };
                            });
                          }}
                        >
                          <Text style={{ color: sodiumUnit === 'mg' ? colors.primary : colors.text }}>mg</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            setSodiumUnit('g');
                            setNutritionEdited((current) => (current.includes('sodium') ? current : [...current, 'sodium']));
                            setAmounts((current) => {
                              if (sodiumUnit !== 'mg') return current;
                              const milligrams = Number(current.sodium);
                              if (!Number.isFinite(milligrams)) return current;
                              return { ...current, sodium: String(milligrams / 1000) };
                            });
                          }}
                        >
                          <Text style={{ color: sodiumUnit === 'g' ? colors.primary : colors.text }}>g</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={{ color: colors.textSecondary }}>{field.acceptedUnits[0]}</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : null}
            {activeContext === 'origins'
              ? origins.map((row, index) => (
                  <View key={`${row.evidenceId || row.claimType || 'origin'}-${index}`}>
                    <Text style={[styles.header, { color: colors.text, fontSize: 18 }]}>
                      {origins.length > 1 ? `Origin statement ${index + 1}` : 'Origin statement'}
                    </Text>
                    <Text style={{ color: colors.text }}>What does the pack say?</Text>
                    <TextInput
                      value={row.wording}
                      onChangeText={(value) =>
                        setOrigins((rows) => rows.map((item, itemIndex) => (itemIndex === index ? { ...item, wording: value } : item)))
                      }
                      multiline
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    />
                    <Text style={{ color: colors.text }}>Type of origin statement</Text>
                    <View style={styles.row}>
                      {PRODUCT_ORIGINS_CLAIM_TYPES.map((claimType) => (
                        <TouchableOpacity
                          key={claimType}
                          onPress={() =>
                            setOrigins((rows) => rows.map((item, itemIndex) => (itemIndex === index ? { ...item, claimType } : item)))
                          }
                        >
                          <Text style={{ color: row.claimType === claimType ? colors.primary : colors.text }}>
                            {ORIGIN_LABELS[claimType]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {row.claimType === 'ingredient_origin' ? (
                      <View>
                        <Text style={{ color: colors.text }}>Ingredient named on the pack</Text>
                        <TextInput
                          value={row.ingredient}
                          onChangeText={(value) =>
                            setOrigins((rows) => rows.map((item, itemIndex) => (itemIndex === index ? { ...item, ingredient: value } : item)))
                          }
                          placeholder="Ingredient named on the pack"
                          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                        />
                      </View>
                    ) : null}
                    <Text style={{ color: colors.text }}>Country</Text>
                    {originCountrySlots(row.place, countryBlanks[index] ?? 0).map((slot, slotIndex, slots) => (
                      <View key={`${index}-country-${slotIndex}`}>
                        <CountryPicker
                          selectedCountry={slot}
                          onSelect={(country) => {
                            const blanks = countryBlanks[index] ?? 0;
                            const current = originCountrySlots(row.place, blanks);
                            const fillingBlank = current[slotIndex] == null;
                            const next = current.map((item, itemIndex) => (itemIndex === slotIndex ? country : item));
                            setOrigins((rows) =>
                              rows.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, place: placeFromCountrySlots(next) } : item
                              )
                            );
                            if (fillingBlank && governedOriginCountryNames(row.place).length > 0 && blanks > 0) {
                              setCountryBlanks((counts) =>
                                counts.map((count, itemIndex) =>
                                  itemIndex === index ? Math.max(0, count - 1) : count
                                )
                              );
                            }
                          }}
                          placeholder="Select country"
                        />
                        {slots.length > 1 ? (
                          <TouchableOpacity
                            onPress={() => {
                              const blanks = countryBlanks[index] ?? 0;
                              const current = originCountrySlots(row.place, blanks);
                              if (current.length <= 1) return;
                              const removed = current[slotIndex];
                              const next = current.filter((_, itemIndex) => itemIndex !== slotIndex);
                              setOrigins((rows) =>
                                rows.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, place: placeFromCountrySlots(next) } : item
                                )
                              );
                              if (removed == null) {
                                setCountryBlanks((counts) =>
                                  counts.map((count, itemIndex) =>
                                    itemIndex === index ? Math.max(0, count - 1) : count
                                  )
                                );
                              }
                            }}
                          >
                            <Text style={{ color: colors.primary }}>Remove country</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ))}
                    <TouchableOpacity
                      onPress={() =>
                        setCountryBlanks((counts) => {
                          const next = counts.slice();
                          while (next.length <= index) next.push(0);
                          next[index] = (next[index] ?? 0) + 1;
                          return next;
                        })
                      }
                    >
                      <Text style={{ color: colors.primary }}>Add another country</Text>
                    </TouchableOpacity>
                    <Text style={{ color: colors.text }}>Percentage</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setOrigins((rows) =>
                          rows.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, percentageNotStated: true, percentage: '', qualifier: undefined }
                              : item
                          )
                        )
                      }
                    >
                      <Text style={{ color: row.percentageNotStated ? colors.primary : colors.text }}>Not stated</Text>
                    </TouchableOpacity>
                    {row.percentageNotStated ? null : (
                    <TextInput
                      value={row.percentage}
                      onChangeText={(value) =>
                        setOrigins((rows) =>
                          rows.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, percentage: value, percentageNotStated: false } : item
                          )
                        )
                      }
                      keyboardType="decimal-pad"
                      placeholder="Percentage on the pack"
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    />
                    )}
                    {row.percentageNotStated ? null : (
                    <View style={styles.row}>
                      {QUALIFIER_LABELS.map((item) => (
                        <TouchableOpacity
                          key={item.value}
                          onPress={() =>
                            setOrigins((rows) =>
                              rows.map((entry, itemIndex) =>
                                itemIndex === index ? { ...entry, qualifier: item.value } : entry
                              )
                            )
                          }
                        >
                          <Text style={{ color: row.qualifier === item.value ? colors.primary : colors.text }}>{item.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    )}
                    <View style={styles.row}>
                      <TouchableOpacity
                        onPress={() =>
                          setOrigins((rows) =>
                            rows.map((entry, itemIndex) =>
                              itemIndex === index ? { ...entry, local: !entry.local } : entry
                            )
                          )
                        }
                      >
                        <Text style={{ color: row.local ? colors.primary : colors.text }}>Local</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          setOrigins((rows) =>
                            rows.map((entry, itemIndex) =>
                              itemIndex === index ? { ...entry, imported: !entry.imported } : entry
                            )
                          )
                        }
                      >
                        <Text style={{ color: row.imported ? colors.primary : colors.text }}>Imported</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setOrigins((rows) => {
                          const remaining = rows.filter((_, itemIndex) => itemIndex !== index);
                          return remaining.length > 0 ? remaining : [EMPTY_ORIGIN];
                        });
                        setCountryBlanks((counts) => {
                          const remaining = counts.filter((_, itemIndex) => itemIndex !== index);
                          return remaining.length > 0 ? remaining : [0];
                        });
                      }}
                    >
                      <Text style={{ color: colors.primary }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))
              : null}
            {activeContext === 'origins' && journey.another ? (
              <TouchableOpacity
                onPress={() => {
                  setOrigins((rows) => [...rows, EMPTY_ORIGIN]);
                  setCountryBlanks((counts) => [...counts, 0]);
                }}
              >
                <Text style={{ color: colors.primary }}>{journey.another}</Text>
              </TouchableOpacity>
            ) : null}
            {packetInformationContext(activeContext) ? (
              <View>
                {claims.map((claim, index) => (
                  <View key={`claim-${index}`}>
                    <Text style={{ color: colors.text }}>Claim on the pack</Text>
                    <TextInput
                      value={claim}
                      onChangeText={(value) => {
                        if (value.trim()) setAbsence(false);
                        setClaims((rows) => rows.map((item, itemIndex) => (itemIndex === index ? value : item)));
                      }}
                      placeholder="Claim on the pack"
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    />
                    <TouchableOpacity onPress={() => setClaims((rows) => rows.filter((_, itemIndex) => itemIndex !== index))}>
                      <Text style={{ color: colors.primary }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity onPress={() => setClaims((rows) => [...rows, ''])}>
                  <Text style={{ color: colors.primary }}>Add another claim</Text>
                </TouchableOpacity>
                {certs.map((cert, index) => (
                  <View key={`cert-${index}`}>
                    <Text style={{ color: colors.text }}>Certification shown on the pack</Text>
                    <TextInput
                      value={cert}
                      onChangeText={(value) => {
                        if (value.trim()) setAbsence(false);
                        setCerts((rows) => rows.map((item, itemIndex) => (itemIndex === index ? value : item)));
                      }}
                      placeholder="Certification shown on the pack"
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    />
                    <TouchableOpacity onPress={() => setCerts((rows) => rows.filter((_, itemIndex) => itemIndex !== index))}>
                      <Text style={{ color: colors.primary }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity onPress={() => setCerts((rows) => [...rows, ''])}>
                  <Text style={{ color: colors.primary }}>Add another certification</Text>
                </TouchableOpacity>
                {packetAbsenceAvailable && targeted.length > 0 && claims.every((claim) => !claim.trim()) && certs.every((cert) => !cert.trim()) ? (
                  <TouchableOpacity
                    onPress={() => {
                      setAbsence(true);
                      setClaims(['']);
                      setCerts(['']);
                    }}
                  >
                    <Text style={{ color: absence ? colors.primary : colors.text }}>{PACKET_ABSENCE_CONSUMER_COPY}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
            <TouchableOpacity onPress={submit} style={styles.button} accessibilityRole="button">
              <Text style={styles.buttonText}>{journey.submit}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {partialNotice ? <Text style={{ color: colors.text }}>{partialNotice}</Text> : null}
        {busy ? <ActivityIndicator /> : null}
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: colors.primary }}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { padding: 16, gap: 12 },
  header: { fontSize: 22, fontWeight: '700' },
  body: { fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  button: { backgroundColor: '#16a085', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  buttonText: { color: '#fff', fontWeight: '600' },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 72, height: 72, borderRadius: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 8, minHeight: 44 },
});
