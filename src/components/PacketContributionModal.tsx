import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme';
import { resultEmeraldCard, resultEmeraldTone, resultPresentation } from '../theme/resultPresentation';
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
import { acknowledgedUnitRevisions, listSubmissionResumeAttention, retryParkedEvidenceSubmission, reusableReviewedUnit, transmitPrevailingClosure, transmitSessionToAuthority } from '../evidenceAuthority/device';
import { acceptLocalCapture, evidenceImageStatus, readableEvidenceFileUri, resumeEvidenceImages, retryParkedEvidenceImage } from '../evidenceImage/pipeline';
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
import {
  contributionTransportFailureNotice,
  prepareVisibleContribution,
} from '../contribution/visibleContribution';
import { reviewedUnitSupport } from '../contribution/submissionReadiness';
import {
  ceasedOriginsRemovedFromForm,
  originRemovalClosesWithoutReplacement,
  originChangeLine,
  originRowsForJourney,
  packetRowVisible,
  type ContributionSurfaceMode,
} from '../contribution/consumerSurface';
import { countryFlagEmoji } from '../utils/countryFlagEmoji';
import {
  PACKET_ABSENCE_CONSUMER_COPY,
  CONTRIBUTION_NOTICE_PARTIAL,
  type ContributionEntryContext,
} from '../contribution/resultContributionActions';
import {
  NUTRITION_CONTRIBUTION_BASES,
  originDraftSignature,
  originRowsToSubmit,
  retainedAfterPartialAdmission,
  type NutritionSourcePrefill,
  type OriginContributionDraft,
} from '../contribution/governedDisplayProjection';
import type { SupportCoverage } from '../packetContribution/types';
import type { SharedEvidenceSnapshot } from '../evidenceAuthority/types';
import {
  CLOSER_PHOTO_ACTION,
  CLOSER_PHOTO_BODY,
  CLOSER_PHOTO_TITLE,
  isSameCurrentProposition,
  PACKET_REVIEW_CHANGE,
  PACKET_REVIEW_PROMPT,
  PACKET_REVIEW_REMOVE,
  PACKET_REVIEW_YES,
  resolvePacketObservation,
  type PacketResolution,
} from '../certifications/resolveCertification';
import { searchDiscoveryCatalogue, type DiscoverySuggestion } from '../certifications/discoveryCatalogue';
import {
  PACKET_ADD_ANOTHER,
  PACKET_ADD_WORDING,
  PACKET_INPUT_INSTRUCTION,
  PACKET_WORDING_FIELD,
  addPendingObservation,
  certificationStatementForSelection,
  choosePacketSuggestion,
  pendingContributionLists,
  removePendingObservation,
  replacePendingLiteral,
  type PendingPacketObservation,
} from '../certifications/pendingPacketObservation';
import { recordUnresolvedObservation } from '../certifications/unresolvedMarkCandidates';
import CertificationMark from './CertificationMark';

type Preview = {
  /** Same value as the session source asset id. Required by EvidenceSurfaceImage. */
  assetId: string;
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

function textField(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function safeOrigin(row: OriginDraft | null | undefined): OriginDraft {
  return {
    ...(row || EMPTY_ORIGIN),
    wording: textField(row?.wording),
    place: textField(row?.place),
    ingredient: textField(row?.ingredient),
    percentage: textField(row?.percentage),
  };
}

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
    instruction: PACKET_INPUT_INSTRUCTION,
    manual: PACKET_WORDING_FIELD,
    review: 'Packet information',
    submit: 'Submit packet information',
  },
  certifications: {
    header: 'Packet information',
    instruction: PACKET_INPUT_INSTRUCTION,
    manual: PACKET_WORDING_FIELD,
    review: 'Packet information',
    submit: 'Submit packet information',
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
  surfaceMode = 'change',
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
  surfaceMode?: ContributionSurfaceMode;
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
  const { darkMode } = useTheme();
  const insets = useSafeAreaInsets();
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
  const [packetQuery, setPacketQuery] = useState('');
  const [pending, setPending] = useState<PendingPacketObservation[]>([]);
  const pendingRef = useRef<PendingPacketObservation[]>([]);
  const pendingTouchedRef = useRef(false);
  const [editingPendingId, setEditingPendingId] = useState<string | null>(null);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const packetInputRef = useRef<TextInput>(null);
  const [acceptedProposals, setAcceptedProposals] = useState<string[]>([]);
  const [editingOrigin, setEditingOrigin] = useState<number | null>(null);
  const [certScopes, setCertScopes] = useState<Record<string, { certificationScope?: string; certificationScopeSubject?: string }>>({});
  const [absence, setAbsence] = useState(false);
  const [skippedProposals, setSkippedProposals] = useState<string[]>([]);
  const [includedContexts, setIncludedContexts] = useState<ContributionEntryContext[]>([entryContext]);
  const [proposalSupport, setProposalSupport] = useState<Partial<Record<ContributionEntryContext, SupportCoverage>>>({});
  const [activeContext, setActiveContext] = useState<ContributionEntryContext>(entryContext);
  const emerald = resultEmeraldTone(!!darkMode);
  const ink = emerald.ink;
  const muted = emerald.muted;
  const action = emerald.action;
  const line = emerald.line;
  const pageBg = resultPresentation.canvas[darkMode ? 'dark' : 'light'];
  const fieldBg = emerald.card;
  const filledButton = [
    styles.button,
    {
      backgroundColor: resultPresentation.emerald.action.light,
      borderRadius: 22,
      minHeight: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  ];
  const phaseCard = [resultEmeraldCard(!!darkMode), styles.phaseCard];
  const [partialNotice, setPartialNotice] = useState<string | null>(null);
  const [submissionAttention, setSubmissionAttention] = useState<{ idempotencyKey: string; interruptedAt: number }[]>([]);
  const initialIngredientsRef = useRef(initialIngredients);
  const initialNutritionRef = useRef(initialNutrition);
  const initialOriginContextRef = useRef(initialOriginContext);
  const knownOffOriginRef = useRef(knownOffOrigin);
  const initialClaimsRef = useRef(initialClaims);
  const initialCertificationsRef = useRef(initialCertifications);
  const openOnFormRef = useRef(openOnForm);
  const surfaceModeRef = useRef(surfaceMode);
  const openedOriginsRef = useRef<OriginDraft[]>([]);
  const nutritionBaselineRef = useRef<NutritionSourcePrefill>({ basis: 'per_100g', amounts: {}, sodiumUnit: 'mg' });
  initialIngredientsRef.current = initialIngredients;
  initialNutritionRef.current = initialNutrition;
  initialOriginContextRef.current = initialOriginContext;
  knownOffOriginRef.current = knownOffOrigin;
  initialClaimsRef.current = initialClaims;
  initialCertificationsRef.current = initialCertifications;
  openOnFormRef.current = openOnForm;
  surfaceModeRef.current = surfaceMode;

  useEffect(() => {
    if (!visible) {
      setPreviews([]);
      setSurfaceJourneyId(null);
      return;
    }
    let cancelled = false;
    setPreviews([]);
    setSurfaceJourneyId(`journey_${barcode}_${entryContext}_${Date.now()}`);
    setPhase(packetInformationContext(entryContext) || openOnFormRef.current ? 'entry' : 'capture');
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
    const governedOrigins = (initialOriginContextRef.current || []).map((row) => ({
      ...row,
      intent: 'edited' as const,
      percentageNotStated: row.percentage.trim().length === 0,
    }));
    const offPlace = knownOffOriginRef.current || '';
    const originRows: OriginDraft[] = originRowsForJourney(surfaceModeRef.current, governedOrigins, offPlace).map(
      (row) => ({ ...row, intent: row.intent === 'edited' ? 'edited' : 'new' })
    );
    if (originRows[0]?.intent === 'edited' && !originRows[0].baseline) {
      originRows[0] = { ...originRows[0], baseline: originDraftSignature(originRows[0]) };
    }
    openedOriginsRef.current =
      surfaceModeRef.current === 'change' ? originRows.filter((row) => row.claimType && row.place.trim()) : [];
    setOrigins(originRows);
    setCountryBlanks(originRows.map(() => 0));
    const claimRows = (initialClaimsRef.current || []).map((row) => row.trim()).filter((row) => row.length > 0);
    const certRows = (initialCertificationsRef.current || []).map((row) => row.trim()).filter((row) => row.length > 0);
    setClaims(claimRows.length > 0 ? claimRows : ['']);
    setCerts(certRows.length > 0 ? certRows : ['']);
    setPacketQuery('');
    pendingRef.current = [];
    pendingTouchedRef.current = false;
    setPending([]);
    setEditingPendingId(null);
    setPermissionNotice(null);
    setAcceptedProposals([]);
    setEditingOrigin(null);
    setCertScopes({});
    setAbsence(false);
    setSkippedProposals([]);
    setProposalSupport({});
    setPartialNotice(null);
    (async () => {
      await activateDevicePrivateByteStore();
      const opened = await openSessionForProduct({ barcode, variantKey });
      if (cancelled) return;
      setSession(opened);
      if (packetInformationContext(entryContext)) {
        if (pendingTouchedRef.current) {
          await upsertSession({ ...opened, pendingObservations: pendingRef.current });
        } else {
        const restored = (opened.pendingObservations || []).filter((row) => row.literalWording.trim() || row.canonicalName);
        if (restored.length > 0) {
          pendingRef.current = restored;
          setPending(restored);
        }
        else if (surfaceModeRef.current === 'change') {
          let rows: PendingPacketObservation[] = [];
          for (const claim of initialClaimsRef.current || []) {
            if (!packetRowVisible('change', claim, [])) continue;
            rows = addPendingObservation(rows, { literalWording: claim, source: 'manual' }).rows;
          }
          for (const cert of initialCertificationsRef.current || []) {
            if (!packetRowVisible('change', cert, [])) continue;
            const resolved = resolvePacketObservation({ observedWording: cert });
            rows = addPendingObservation(
              rows,
              resolved.kind === 'certification'
                ? {
                    literalWording: cert,
                    source: 'manual',
                    productionCertificationId: resolved.certificationId,
                    canonicalName: resolved.displayName,
                  }
                : { literalWording: cert, source: 'manual' }
            ).rows;
          }
          pendingRef.current = rows;
          setPending(rows);
        }
        }
        const photos: Preview[] = [];
        for (const asset of opened.sourceAssets || []) {
          const uri = await readableEvidenceFileUri(asset.privateKey);
          if (!uri || cancelled) continue;
          photos.push({
            assetId: asset.assetId,
            tempKey: asset.assetId,
            uri,
            source: asset.source,
            bytes: new Uint8Array(),
            journeyId: `journey_${barcode}_${entryContext}_restored`,
            entryContext: 'packetInformation',
          });
        }
        if (!cancelled && photos.length > 0) setPreviews(photos);
      }
    })().catch(() => {
      if (!cancelled) setSession(null);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, barcode, variantKey, entryContext, surfaceMode]);

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
  const packetSuggestions = useMemo(() => searchDiscoveryCatalogue(packetQuery), [packetQuery]);
  const proposals = useMemo(() => {
    if (producer.kind === 'abstaining' || !session) return [];
    const currentWordings = [...(initialClaimsRef.current || []), ...(initialCertificationsRef.current || [])];
    return session.extractionRuns.flatMap((run) =>
      run.observations.flatMap((observation) => {
        if (skippedProposals.includes(observation.observationId) || acceptedProposals.includes(observation.observationId)) {
          return [];
        }
        const context = contextForProposal(observation.proposedDomain, observation.proposedSection);
        const packetObservation =
          packetInformationContext(entryContext) &&
          (context == null || context === 'packetClaims' || context === 'certifications');
        if (packetObservation) {
          const resolution = resolvePacketObservation({
            observedWording: observation.text,
            visualMark: observation.visualMark,
            ambiguity: observation.ambiguity,
            proposedCertificationId: observation.proposedCertificationId,
            proposedFamilyName: observation.proposedFamilyName,
            scopeClass: observation.scopeClass,
            scopeSubject: observation.scopeSubject,
          });
          if (resolution.kind === 'wording' && !resolution.observedWording.trim()) return [];
          if (
            (resolution.kind === 'certification' || resolution.kind === 'wording') &&
            isSameCurrentProposition(resolution, currentWordings)
          ) {
            return [];
          }
          return [
            {
              id: observation.observationId,
              text: observation.text,
              support: observation.support,
              context: (context || 'packetClaims') as ContributionEntryContext,
              resolution,
              scopeClass: observation.scopeClass,
              scopeSubject: observation.scopeSubject,
            },
          ];
        }
        if (context == null || includedContexts.includes(context)) return [];
        return [
          {
            id: observation.observationId,
            text: observation.text,
            support: observation.support,
            context,
            resolution: undefined as PacketResolution | undefined,
            scopeClass: undefined as string | undefined,
            scopeSubject: undefined as string | undefined,
          },
        ];
      })
    );
  }, [producer.kind, session, includedContexts, skippedProposals, acceptedProposals, entryContext]);

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
        assetId: accepted.assetId,
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
    if (!permission.granted) {
      setPermissionNotice('Camera access is off. You can type the wording from the pack, or allow camera access in your phone settings.');
      return;
    }
    setPermissionNotice(null);
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
    if (!permission.granted) {
      setPermissionNotice('Photo library access is off. You can type the wording from the pack, or allow photo access in your phone settings.');
      return;
    }
    setPermissionNotice(null);
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

  const rememberCertificationScope = (
    statement: string,
    scope: { certificationScope?: string; certificationScopeSubject?: string } | undefined
  ) => {
    if (!scope?.certificationScope || scope.certificationScope === 'unresolved') return;
    setCertScopes((current) => ({ ...current, [statement]: scope }));
  };

  const acceptPacketResolution = (proposalId: string, resolution: PacketResolution, support: SupportCoverage) => {
    if (resolution.kind === 'closer_photo' || resolution.kind === 'shortlist') return;
    setAcceptedProposals((rows) => (rows.includes(proposalId) ? rows : [...rows, proposalId]));
    setProposalSupport((current) => ({ ...current, packetClaims: support, certifications: support }));
    setIncludedContexts((rows) => [...new Set([...rows, 'packetClaims' as const, 'certifications' as const])]);
    setAbsence(false);
    if (resolution.kind === 'certification') {
      const statement = resolution.observedWording.trim() || resolution.displayName;
      setCerts((rows) => {
        const filled = rows.map((row) => row.trim()).filter((row) => row.length > 0);
        return filled.includes(statement) ? filled : [...filled, statement];
      });
      rememberCertificationScope(statement, {
        certificationScope: resolution.scopeClass,
        certificationScopeSubject: resolution.scopeSubject,
      });
      return;
    }
    setClaims((rows) => {
      const filled = rows.map((row) => row.trim()).filter((row) => row.length > 0);
      return filled.includes(resolution.observedWording) ? filled : [...filled, resolution.observedWording];
    });
  };

  const rememberPending = async (rows: PendingPacketObservation[]) => {
    pendingRef.current = rows;
    pendingTouchedRef.current = true;
    setPending(rows);
    if (!session) return;
    const latest = await getSession(session.sessionId);
    if (!latest) return;
    await upsertSession({ ...latest, pendingObservations: rows });
  };

  const noteProposalAccepted = (proposalId?: string) => {
    if (!proposalId) return;
    setAcceptedProposals((rows) => (rows.includes(proposalId) ? rows : [...rows, proposalId]));
  };

  const addLiteralWording = (
    wording: string,
    source: PendingPacketObservation['source'] = 'manual',
    proposalId?: string
  ) => {
    const next = addPendingObservation(pending, { literalWording: wording, source });
    if (!next.added) {
      setPartialNotice('That’s already in the list.');
      return;
    }
    noteProposalAccepted(proposalId);
    setAbsence(false);
    setPacketQuery('');
    setPartialNotice(null);
    void rememberPending(next.rows);
  };

  const addSelectedCertification = (
    productionId: string,
    canonicalName: string,
    literal: string,
    source: PendingPacketObservation['source'] = 'manual',
    proposalId?: string
  ) => {
    if (!productionId) return;
    const next = addPendingObservation(pending, {
      literalWording: literal.trim() || canonicalName,
      source,
      productionCertificationId: productionId,
      canonicalName,
    });
    if (!next.added) {
      setPartialNotice('That’s already in the list.');
      return;
    }
    noteProposalAccepted(proposalId);
    setAbsence(false);
    setPacketQuery('');
    setPartialNotice(null);
    void rememberPending(next.rows);
  };

  const chooseSuggestion = (hit: DiscoverySuggestion) => {
    const next = choosePacketSuggestion(pending, hit, packetQuery);
    setPacketQuery(next.fieldText);
    if (!next.added) {
      setPartialNotice('That’s already in the list.');
      return;
    }
    setAbsence(false);
    setPartialNotice(null);
    void rememberPending(next.rows);
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
    if (!session) {
      setPartialNotice('This form is still opening. Submit again in a moment.');
      return;
    }
    const trace = beginModalTrace(Platform.OS);
    trace.mark('submit_tap');
    setBusy(true);
    try {
      trace.mark('local_handoff_begin');
      const created: string[] = [];
      const observations: { unitId: string; label: string; kind: 'ingredients' | 'nutrition' | 'origin' | 'claim' | 'cert' | 'absence'; index: number }[] = [];
      const contexts = includedContexts;
      const packetDraft = packetInformationContext(entryContext) ? pendingContributionLists(pending, packetQuery) : null;
      const originRowsNow = origins.map((row) => safeOrigin(row));
      const openedOriginsNow = openedOriginsRef.current.map((row) => safeOrigin(row));
      const removedOriginKeys = ceasedOriginsRemovedFromForm(openedOriginsNow, originRowsNow);
      const decision = prepareVisibleContribution({
        contexts,
        ingredientsText: textField(ingredientsText),
        initialIngredients: textField(initialIngredientsRef.current),
        nutrition: {
          basis: basis || nutritionBaselineRef.current.basis,
          amounts: Object.fromEntries(
            Object.entries(amounts).map(([key, value]) => [key, textField(value)])
          ) as typeof amounts,
          sodiumUnit,
        },
        nutritionBaseline: {
          ...nutritionBaselineRef.current,
          amounts: Object.fromEntries(
            Object.entries(nutritionBaselineRef.current.amounts || {}).map(([key, value]) => [key, textField(value)])
          ) as typeof amounts,
        },
        origins: originRowsNow,
        claims: packetDraft ? packetDraft.claims.map((row) => textField(row)) : claims.map((row) => textField(row)),
        initialClaims: (initialClaimsRef.current || []).map((row) => textField(row)),
        certifications: packetDraft ? packetDraft.certifications.map((row) => textField(row)) : certs.map((row) => textField(row)),
        initialCertifications: (initialCertificationsRef.current || []).map((row) => textField(row)),
        pendingPacketWording: packetDraft ? '' : textField(packetQuery),
        catalogueName: undefined,
        absence,
        hasPhotoForAbsence: targeted.length > 0,
      });
      if (decision.status !== 'ready') {
        if (
          decision.status === 'incomplete' &&
          originRemovalClosesWithoutReplacement(decision.messages, removedOriginKeys, contexts)
        ) {
          const closed = await transmitPrevailingClosure(barcode, removedOriginKeys, trace);
          trace.mark('local_handoff_end', closed.admitted ? 'ok' : 'none');
          if (!closed.admitted) {
            setPartialNotice(contributionTransportFailureNotice());
            onSharedEvidenceFailed?.();
            return;
          }
          await onSharedEvidenceAdmitted?.(closed.snapshot, true);
          trace.mark('modal_close');
          onClose();
          return;
        }
        trace.mark('local_handoff_end', 'none');
        setPartialNotice(decision.status === 'incomplete' ? decision.messages.join('\n') : decision.message);
        return;
      }
      const ceased = [...new Set([...decision.ceasedSubjectKeys, ...removedOriginKeys])];
      if (decision.ingredientsText) {
        const text = decision.ingredientsText;
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
      if (decision.nutritionAmounts.length > 0 && decision.nutritionBasis) {
        const stated = decision.nutritionAmounts;
        const unit = await addManualEvidenceUnit({
          sessionId: session.sessionId,
          domain: 'ingredients_nutrition',
          section: 'nutrition',
          statement: 'Nutrition facts',
          nutritionBasis: decision.nutritionBasis,
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
      for (let index = 0; index < decision.origins.length; index += 1) {
        const row = decision.origins[index];
        const places = governedOriginCountryNames(row.place);
        const wording = textField(row.wording).trim();
        if (places.length === 0) continue;
        const percentageText = textField(row.percentage);
        const percentage = Number(percentageText);
        const statedPercentage = !row.percentageNotStated && Number.isFinite(percentage) && percentageText.trim();
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
        observations.push({
          unitId: unit.unitId,
          label: wording || `${ORIGIN_LABELS[row.claimType]} ${places[0]}`,
          kind: 'origin',
          index,
        });
      }
      if (decision.absence && targeted[0]) {
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
      const openSession = await getSession(session.sessionId);
      const acknowledged = await acknowledgedUnitRevisions();
      const reuseReviewed = (domain: 'packet_claims' | 'certifications', statement: string) =>
        openSession ? reusableReviewedUnit(openSession.units, acknowledged, domain, statement) : undefined;
      for (const text of decision.claims) {
        const existing = reuseReviewed('packet_claims', text);
        if (existing) {
          created.push(existing.unitId);
          observations.push({ unitId: existing.unitId, label: text, kind: 'claim', index: 0 });
          continue;
        }
        recordUnresolvedObservation(text);
        const unit = await addManualEvidenceUnit({
          sessionId: session.sessionId,
          domain: 'packet_claims',
          statement: text,
          support: supportFor('packetClaims'),
        });
        created.push(unit.unitId);
        observations.push({ unitId: unit.unitId, label: text, kind: 'claim', index: 0 });
      }
      for (const text of decision.certifications) {
        const scope = certScopes[text];
        const literal = packetDraft?.literalsByStatement[text];
        const productionId = packetDraft?.productionByStatement[text];
        const existing = reuseReviewed('certifications', text);
        if (existing) {
          created.push(existing.unitId);
          observations.push({ unitId: existing.unitId, label: text, kind: 'cert', index: 0 });
          continue;
        }
        const unit = await addManualEvidenceUnit({
          sessionId: session.sessionId,
          domain: 'certifications',
          statement: text,
          support: supportFor('certifications'),
          ...(literal && literal !== text ? { packetLiteral: literal } : {}),
          ...(productionId ? { productionCertificationId: productionId } : {}),
          ...(scope?.certificationScope ? { certificationScope: scope.certificationScope } : {}),
          ...(scope?.certificationScopeSubject ? { certificationScopeSubject: scope.certificationScopeSubject } : {}),
        });
        created.push(unit.unitId);
        observations.push({ unitId: unit.unitId, label: text, kind: 'cert', index: 0 });
      }
      if (created.length === 0) {
        trace.mark('local_handoff_end', 'none');
        if (ceased.length === 0) {
          setPartialNotice(contributionTransportFailureNotice());
          onSharedEvidenceFailed?.();
          return;
        }
        const closed = await transmitPrevailingClosure(barcode, ceased, trace);
        if (!closed.admitted) {
          setPartialNotice(contributionTransportFailureNotice());
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
        setPartialNotice(contributionTransportFailureNotice());
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
        setPartialNotice(contributionTransportFailureNotice());
        onSharedEvidenceFailed?.();
        return;
      }
      setPreviews([]);
      const retained = retainedAfterPartialAdmission(observations, transmitted.admittedUnitIds);
      await onSharedEvidenceAdmitted?.(transmitted.snapshot, retained.complete);
      if (retained.complete) {
        if (session) {
          const latest = await getSession(session.sessionId);
          if (latest) await upsertSession({ ...latest, pendingObservations: [] });
        }
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
      }
      if (admittedKinds.has('absence')) setAbsence(false);
      const admittedClaims = new Set(retained.admitted.filter((row) => row.kind === 'claim').map((row) => row.index));
      const admittedCerts = new Set(retained.admitted.filter((row) => row.kind === 'cert').map((row) => row.index));
      const admittedOrigins = new Set(retained.admitted.filter((row) => row.kind === 'origin').map((row) => row.index));
      if (packetInformationContext(entryContext)) {
        const admittedClaimLabels = new Set(retained.admitted.filter((row) => row.kind === 'claim').map((row) => row.label));
        const admittedCertLabels = new Set(retained.admitted.filter((row) => row.kind === 'cert').map((row) => row.label));
        const remaining = pending.filter((row) => {
          if (row.productionCertificationId) {
            const statement = certificationStatementForSelection(row.productionCertificationId, row.literalWording, row.canonicalName);
            return !admittedCertLabels.has(statement);
          }
          return !admittedClaimLabels.has(row.literalWording.trim());
        });
        void rememberPending(remaining);
        if (admittedClaimLabels.has(packetQuery.trim())) setPacketQuery('');
      }
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
    } catch (error) {
      trace.noteError(error);
      trace.mark('submit_failed', 'failed');
      setPartialNotice(contributionTransportFailureNotice());
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
        style={{ flex: 1, backgroundColor: pageBg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        style={[styles.page, { backgroundColor: pageBg }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 24) + 24 },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        nestedScrollEnabled
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.headerRow}>
          <Text style={[styles.header, { color: ink, flex: 1 }]}>{journey.header}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeControl, { backgroundColor: emerald.chevronCircle }]}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={{ color: ink, fontWeight: '700' }}>Close</Text>
          </TouchableOpacity>
        </View>
        {phase === 'capture' ? (
          <View style={phaseCard}>
            <Text style={[styles.body, { color: ink }]}>{journey.instruction}</Text>
            <View style={styles.row}>
              <TouchableOpacity onPress={captureCamera} style={filledButton} accessibilityRole="button">
                <Text style={styles.buttonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={captureGallery} style={filledButton} accessibilityRole="button">
                <Text style={styles.buttonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
            {targeted.filter((asset) => asset.imagePhase !== 'parked_after_interrupted_resume' && evidenceImageStatus(asset)).map((asset) => (
              <Text key={asset.assetId} style={{ color: ink }}>
                {evidenceImageStatus(asset)}
              </Text>
            ))}
            {needsAttention.map((asset) => (
              <View key={`attention-${asset.assetId}`}>
                <Text style={{ color: ink }}>
                  {evidenceImageStatus(asset)}
                </Text>
                <TouchableOpacity onPress={() => void retryPhoto(asset.assetId)} style={filledButton} accessibilityRole="button">
                  <Text style={styles.buttonText}>Retry photo</Text>
                </TouchableOpacity>
              </View>
            ))}
            {submissionAttention.map((item) => (
              <View key={item.idempotencyKey}>
                <Text style={{ color: ink }}>This send needs attention.</Text>
                <TouchableOpacity onPress={() => void retrySubmission(item.idempotencyKey)} style={filledButton} accessibilityRole="button">
                  <Text style={styles.buttonText}>Retry send</Text>
                </TouchableOpacity>
              </View>
            ))}
            {displayedPreviews.map((preview) => (
              <View key={preview.tempKey} style={styles.previewRow}>
                <Image source={{ uri: preview.uri }} style={styles.thumb} />
                <TouchableOpacity onPress={() => retake(preview)}>
                  <Text style={{ color: action }}>Retake</Text>
                </TouchableOpacity>
              </View>
            ))}
            {showReadPhotos ? (
              <TouchableOpacity onPress={readPhotos} style={filledButton}>
                <Text style={styles.buttonText}>Read photos</Text>
              </TouchableOpacity>
            ) : null}
            {proposals.length > 0 ? (
              <View>
                {proposals.some((proposal) => !proposal.resolution) ? (
                  <Text style={[styles.body, { color: ink }]}>Also found on this photo</Text>
                ) : null}
                {proposals.map((proposal) =>
                  proposal.resolution?.kind === 'closer_photo' ? (
                    <View key={proposal.id}>
                      <Text style={{ color: ink }}>{CLOSER_PHOTO_TITLE}</Text>
                      <Text style={{ color: ink }}>{CLOSER_PHOTO_BODY}</Text>
                      <TouchableOpacity onPress={captureCamera} accessibilityRole="button">
                        <Text style={{ color: action }}>{CLOSER_PHOTO_ACTION}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : proposal.resolution?.kind === 'shortlist' ? (
                    <View key={proposal.id}>
                      <Text style={{ color: ink }}>{PACKET_REVIEW_PROMPT}</Text>
                      {proposal.resolution.options.map((option) => (
                        <TouchableOpacity
                          key={option.displayName}
                          onPress={() =>
                            acceptPacketResolution(
                              proposal.id,
                              resolvePacketObservation({
                                observedWording: option.displayName,
                                selectedCertificationId: option.certificationId,
                                scopeClass: proposal.scopeClass,
                                scopeSubject: proposal.scopeSubject,
                              }),
                              proposal.support
                            )
                          }
                        >
                          <Text style={{ color: action }}>{option.displayName}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : proposal.resolution ? (
                    <View key={proposal.id}>
                      <Text style={{ color: ink }}>
                        {proposal.resolution.kind === 'certification' ? proposal.resolution.displayName : proposal.text}
                      </Text>
                      <Text style={{ color: ink }}>{PACKET_REVIEW_PROMPT}</Text>
                      <View style={styles.row}>
                        <TouchableOpacity
                          onPress={() => acceptPacketResolution(proposal.id, proposal.resolution as PacketResolution, proposal.support)}
                          accessibilityRole="button"
                        >
                          <Text style={{ color: action }}>{PACKET_REVIEW_YES}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            setAcceptedProposals((rows) => (rows.includes(proposal.id) ? rows : [...rows, proposal.id]));
                            setPacketQuery(proposal.text);
                            setPhase('entry');
                          }}
                          accessibilityRole="button"
                        >
                          <Text style={{ color: action }}>{PACKET_REVIEW_CHANGE}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View key={proposal.id} style={styles.row}>
                      <Text style={{ color: ink }}>{proposal.text}</Text>
                      <TouchableOpacity onPress={() => acceptProposal(proposal)}>
                        <Text style={{ color: action }}>Review</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setSkippedProposals((rows) => [...rows, proposal.id])}>
                        <Text style={{ color: action }}>Skip</Text>
                      </TouchableOpacity>
                    </View>
                  )
                )}
              </View>
            ) : null}
            <TouchableOpacity
              onPress={() => setPhase('entry')}
              style={filledButton}
            >
              <Text style={styles.buttonText}>{journey.manual}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {phase === 'entry' || phase === 'review' ? (
          <View style={phaseCard}>
            {phase === 'review'
              ? displayedPreviews.map((preview) => (
                  <View key={preview.tempKey} style={styles.previewRow}>
                    <Image source={{ uri: preview.uri }} style={styles.thumb} />
                    <TouchableOpacity onPress={() => retake(preview)}>
                      <Text style={{ color: action }}>Remove</Text>
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
              style={styles.closeControl}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Text style={{ color: action, fontWeight: '700' }}>Back</Text>
            </TouchableOpacity>
            {activeContext === 'ingredients' ? (
              <View>
                <TextInput
                  value={ingredientsText}
                  onChangeText={setIngredientsText}
                  multiline
                  placeholder="Ingredients"
                  style={[styles.input, { color: ink, borderColor: line, backgroundColor: fieldBg }]}
                />
                <TouchableOpacity onPress={() => setIngredientsText('')}>
                  <Text style={{ color: action }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {activeContext === 'nutrition' ? (
              <View>
                <Text style={{ color: ink }}>{NUTRITION_CONTRIBUTION_BASES[0].label}</Text>
                {NUTRITION_FIELDS.map((field) => (
                  <View key={field.attribute}>
                    <Text style={{ color: ink }}>{field.packetConcept}</Text>
                    <TextInput
                      value={amounts[field.attribute] || ''}
                      onChangeText={(value) => {
                        setAmounts((current) => ({ ...current, [field.attribute]: value }));
                      }}
                      keyboardType="decimal-pad"
                      style={[styles.input, { color: ink, borderColor: line, backgroundColor: fieldBg }]}
                    />
                    {field.attribute === 'sodium' ? (
                      <View style={styles.row}>
                        <TouchableOpacity
                          onPress={() => {
                            setSodiumUnit('mg');
                            setAmounts((current) => {
                              if (sodiumUnit !== 'g') return current;
                              const grams = Number(current.sodium);
                              if (!Number.isFinite(grams)) return current;
                              return { ...current, sodium: String(grams * 1000) };
                            });
                          }}
                        >
                          <Text style={{ color: sodiumUnit === 'mg' ? action : ink }}>mg</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            setSodiumUnit('g');
                            setAmounts((current) => {
                              if (sodiumUnit !== 'mg') return current;
                              const milligrams = Number(current.sodium);
                              if (!Number.isFinite(milligrams)) return current;
                              return { ...current, sodium: String(milligrams / 1000) };
                            });
                          }}
                        >
                          <Text style={{ color: sodiumUnit === 'g' ? action : ink }}>g</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={{ color: muted }}>{field.acceptedUnits[0]}</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : null}
            {activeContext === 'origins'
              ? origins.map((row, index) => {
                  const country = governedOriginCountryNames(row.place)[0] || row.place.trim();
                  const currentProposition =
                    surfaceMode === 'change' && row.intent === 'edited' && Boolean(row.claimType) && country.length > 0;
                  const removeThisOrigin = () => {
                    setEditingOrigin(null);
                    setOrigins((rows) => {
                      const remaining = rows.filter((_, itemIndex) => itemIndex !== index);
                      return remaining.length > 0 ? remaining : [EMPTY_ORIGIN];
                    });
                    setCountryBlanks((counts) => {
                      const remaining = counts.filter((_, itemIndex) => itemIndex !== index);
                      return remaining.length > 0 ? remaining : [0];
                    });
                  };
                  if (currentProposition && editingOrigin !== index) {
                    return (
                      <View key={`${row.evidenceId || row.claimType || 'origin'}-${index}`}>
                        <Text style={{ color: ink }}>
                          {`${countryFlagEmoji(country)} ${originChangeLine(row.claimType!, country)}`}
                        </Text>
                        <View style={styles.row}>
                          <TouchableOpacity onPress={() => setEditingOrigin(index)} accessibilityRole="button">
                            <Text style={{ color: action }}>{PACKET_REVIEW_CHANGE}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={removeThisOrigin} accessibilityRole="button">
                            <Text style={{ color: action }}>{PACKET_REVIEW_REMOVE}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }
                  return (
                  <View key={`${row.evidenceId || row.claimType || 'origin'}-${index}`}>
                    <Text style={[styles.header, { color: ink, fontSize: 18 }]}>
                      {origins.length > 1 ? `Origin statement ${index + 1}` : 'Origin statement'}
                    </Text>
                    <Text style={{ color: ink }}>What does the pack say?</Text>
                    <TextInput
                      value={row.wording}
                      onChangeText={(value) =>
                        setOrigins((rows) => rows.map((item, itemIndex) => (itemIndex === index ? { ...item, wording: value } : item)))
                      }
                      multiline
                      style={[styles.input, { color: ink, borderColor: line, backgroundColor: fieldBg }]}
                    />
                    <Text style={{ color: ink }}>Type of origin statement</Text>
                    <View style={styles.row}>
                      {PRODUCT_ORIGINS_CLAIM_TYPES.map((claimType) => (
                        <TouchableOpacity
                          key={claimType}
                          onPress={() =>
                            setOrigins((rows) => rows.map((item, itemIndex) => (itemIndex === index ? { ...item, claimType } : item)))
                          }
                        >
                          <Text style={{ color: row.claimType === claimType ? action : ink }}>
                            {ORIGIN_LABELS[claimType]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {row.claimType === 'ingredient_origin' ? (
                      <View>
                        <Text style={{ color: ink }}>Ingredient named on the pack</Text>
                        <TextInput
                          value={row.ingredient}
                          onChangeText={(value) =>
                            setOrigins((rows) => rows.map((item, itemIndex) => (itemIndex === index ? { ...item, ingredient: value } : item)))
                          }
                          placeholder="Ingredient named on the pack"
                          style={[styles.input, { color: ink, borderColor: line, backgroundColor: fieldBg }]}
                        />
                      </View>
                    ) : null}
                    <Text style={{ color: ink }}>Country</Text>
                    {originCountrySlots(row.place, countryBlanks[index] ?? 0).map((slot, slotIndex, slots) => (
                      <View key={`${index}-country-${slotIndex}`}>
                        <CountryPicker
                          appearance="emerald"
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
                            <Text style={{ color: action }}>Remove country</Text>
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
                      <Text style={{ color: action }}>Add another country</Text>
                    </TouchableOpacity>
                    <Text style={{ color: ink }}>Percentage</Text>
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
                      <Text style={{ color: row.percentageNotStated ? action : ink }}>Not stated</Text>
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
                      style={[styles.input, { color: ink, borderColor: line, backgroundColor: fieldBg }]}
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
                          <Text style={{ color: row.qualifier === item.value ? action : ink }}>{item.label}</Text>
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
                        <Text style={{ color: row.local ? action : ink }}>Local</Text>
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
                        <Text style={{ color: row.imported ? action : ink }}>Imported</Text>
                      </TouchableOpacity>
                    </View>
                    {row.claimType && row.place.trim() ? (
                    <View style={styles.row}>
                      {surfaceMode === 'change' && row.intent === 'edited' ? (
                        <TouchableOpacity onPress={() => setEditingOrigin(index)} accessibilityRole="button">
                          <Text style={{ color: action }}>{PACKET_REVIEW_CHANGE}</Text>
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity onPress={removeThisOrigin} accessibilityRole="button">
                        <Text style={{ color: action }}>{PACKET_REVIEW_REMOVE}</Text>
                      </TouchableOpacity>
                    </View>
                    ) : null}
                  </View>
                  );
                })
              : null}
            {activeContext === 'origins' && journey.another ? (
              <TouchableOpacity
                onPress={() => {
                  setOrigins((rows) => [...rows, EMPTY_ORIGIN]);
                  setCountryBlanks((counts) => [...counts, 0]);
                }}
              >
                <Text style={{ color: action }}>{journey.another}</Text>
              </TouchableOpacity>
            ) : null}
            {packetInformationContext(activeContext) ? (
              <View>
                <Text style={[styles.body, { color: ink }]}>{PACKET_INPUT_INSTRUCTION}</Text>
                <View style={styles.row}>
                  <TouchableOpacity onPress={captureCamera} style={filledButton} accessibilityRole="button" accessibilityLabel="Camera">
                    <Text style={styles.buttonText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={captureGallery} style={filledButton} accessibilityRole="button" accessibilityLabel="Gallery">
                    <Text style={styles.buttonText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
                {permissionNotice ? <Text style={{ color: ink }}>{permissionNotice}</Text> : null}
                {targeted.filter((asset) => asset.imagePhase !== 'parked_after_interrupted_resume' && evidenceImageStatus(asset)).map((asset) => (
                  <Text key={asset.assetId} style={{ color: ink }}>{evidenceImageStatus(asset)}</Text>
                ))}
                {needsAttention.map((asset) => (
                  <View key={`packet-attention-${asset.assetId}`}>
                    <Text style={{ color: ink }}>{evidenceImageStatus(asset)}</Text>
                    <TouchableOpacity onPress={() => void retryPhoto(asset.assetId)} style={filledButton} accessibilityRole="button">
                      <Text style={styles.buttonText}>Retry photo</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {submissionAttention.map((item) => (
                  <View key={item.idempotencyKey}>
                    <Text style={{ color: ink }}>This send needs attention.</Text>
                    <TouchableOpacity onPress={() => void retrySubmission(item.idempotencyKey)} style={filledButton} accessibilityRole="button">
                      <Text style={styles.buttonText}>Retry send</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {displayedPreviews.map((preview) => (
                  <View key={preview.tempKey} style={styles.previewRow}>
                    <Image source={{ uri: preview.uri }} style={styles.thumb} accessibilityLabel="Packet photo" />
                    <TouchableOpacity onPress={() => retake(preview)} accessibilityRole="button" accessibilityLabel="Remove photo">
                      <Text style={{ color: action }}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {pending.map((row) => (
                  <View key={row.localId}>
                    {editingPendingId === row.localId ? (
                      <TextInput
                        value={row.literalWording}
                        onChangeText={(value) => {
                          if (value.trim()) setAbsence(false);
                          void rememberPending(replacePendingLiteral(pending, row.localId, value));
                        }}
                        style={[styles.input, { color: ink, borderColor: line, backgroundColor: fieldBg }]}
                        accessibilityLabel="Edit packet wording"
                      />
                    ) : row.productionCertificationId ? (
                      <View>
                        <CertificationMark
                          name={row.canonicalName || row.literalWording}
                          productionId={row.productionCertificationId}
                          surface="contribution_review"
                          color={ink}
                        />
                        {row.literalWording && row.canonicalName && row.literalWording.trim().toLowerCase() !== row.canonicalName.trim().toLowerCase() ? (
                          <Text style={{ color: muted }}>As on pack: {row.literalWording}</Text>
                        ) : null}
                      </View>
                    ) : (
                      <Text style={{ color: ink }}>{row.literalWording}</Text>
                    )}
                    <View style={styles.row}>
                      <TouchableOpacity onPress={() => setEditingPendingId(row.localId)} accessibilityRole="button" accessibilityLabel={PACKET_REVIEW_CHANGE}>
                        <Text style={{ color: action }}>{PACKET_REVIEW_CHANGE}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => void rememberPending(removePendingObservation(pending, row.localId))}
                        accessibilityRole="button"
                        accessibilityLabel={PACKET_REVIEW_REMOVE}
                      >
                        <Text style={{ color: action }}>{PACKET_REVIEW_REMOVE}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TextInput
                  ref={packetInputRef}
                  value={packetQuery}
                  onChangeText={(value) => {
                    if (value.trim()) setAbsence(false);
                    setPacketQuery(value);
                  }}
                  placeholder={PACKET_WORDING_FIELD}
                  accessibilityLabel={PACKET_WORDING_FIELD}
                  style={[styles.input, { color: ink, borderColor: line, backgroundColor: fieldBg }]}
                />
                {packetSuggestions.map((hit) =>
                  hit.selectable && hit.productionId ? (
                    <Pressable
                      key={hit.entryId}
                      onPress={() => chooseSuggestion(hit)}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${hit.consumerName}`}
                      style={[styles.suggestionRow, styles.suggestionChoice, { borderColor: line, backgroundColor: fieldBg }]}
                    >
                      <Text style={{ color: action, fontWeight: '700' }}>{hit.consumerName}</Text>
                      {hit.qualifier ? <Text style={{ color: muted }}>{hit.qualifier}</Text> : null}
                    </Pressable>
                  ) : (
                    <View key={hit.entryId} style={styles.suggestionRow} accessibilityRole="text">
                      <Text style={{ color: muted }}>{hit.consumerName}</Text>
                      {hit.qualifier ? <Text style={{ color: muted }}>{hit.qualifier}</Text> : null}
                    </View>
                  )
                )}
                {packetQuery.trim() ? (
                  <TouchableOpacity
                    onPress={() => addLiteralWording(packetQuery)}
                    accessibilityRole="button"
                    accessibilityLabel={PACKET_ADD_WORDING}
                    style={styles.suggestionRow}
                  >
                    <Text style={{ color: action, fontWeight: '700' }}>{PACKET_ADD_WORDING}</Text>
                  </TouchableOpacity>
                ) : null}
                {pending.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      setPacketQuery('');
                      packetInputRef.current?.focus();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={PACKET_ADD_ANOTHER}
                  >
                    <Text style={{ color: action }}>{PACKET_ADD_ANOTHER}</Text>
                  </TouchableOpacity>
                ) : null}
                {proposals.map((proposal) =>
                  proposal.resolution?.kind === 'certification' ? (
                    <TouchableOpacity
                      key={proposal.id}
                      onPress={() =>
                        addSelectedCertification(
                          proposal.resolution && proposal.resolution.kind === 'certification' ? proposal.resolution.certificationId : '',
                          proposal.resolution && proposal.resolution.kind === 'certification' ? proposal.resolution.displayName : proposal.text,
                          proposal.text,
                          'machine_proposal',
                          proposal.id
                        )
                      }
                      accessibilityRole="button"
                    >
                      <Text style={{ color: ink }}>{PACKET_REVIEW_PROMPT}</Text>
                      <Text style={{ color: action }}>{PACKET_REVIEW_YES} {proposal.resolution.displayName}</Text>
                    </TouchableOpacity>
                  ) : proposal.resolution?.kind === 'wording' ? (
                    <TouchableOpacity key={proposal.id} onPress={() => addLiteralWording(proposal.text, 'machine_proposal', proposal.id)} accessibilityRole="button">
                      <Text style={{ color: action }}>{PACKET_REVIEW_YES} {proposal.text}</Text>
                    </TouchableOpacity>
                  ) : proposal.resolution?.kind === 'closer_photo' ? (
                    <View key={proposal.id}>
                      <Text style={{ color: ink }}>{CLOSER_PHOTO_TITLE}</Text>
                      <Text style={{ color: ink }}>{CLOSER_PHOTO_BODY}</Text>
                      <TouchableOpacity onPress={captureCamera} accessibilityRole="button">
                        <Text style={{ color: action }}>{CLOSER_PHOTO_ACTION}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null
                )}
                {packetAbsenceAvailable && targeted.length > 0 && pending.length === 0 && !packetQuery.trim() ? (
                  <TouchableOpacity
                    onPress={() => {
                      setAbsence(true);
                      void rememberPending([]);
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={{ color: absence ? action : ink }}>{PACKET_ABSENCE_CONSUMER_COPY}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
            {partialNotice ? (
              <View style={[styles.notice, { backgroundColor: emerald.chevronCircle }]}>
                <Text style={{ color: ink }}>{partialNotice}</Text>
              </View>
            ) : null}
            <TouchableOpacity onPress={submit} style={filledButton} accessibilityRole="button">
              <Text style={styles.buttonText}>{journey.submit}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {busy ? <ActivityIndicator color={resultPresentation.emerald.action.light} /> : null}
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
  input: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 48 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  closeControl: { minWidth: 44, minHeight: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  phaseCard: { padding: 16, gap: 12 },
  notice: { borderRadius: 12, padding: 12 },
  suggestionRow: { minHeight: 44, justifyContent: 'center' },
  suggestionChoice: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12 },
});
