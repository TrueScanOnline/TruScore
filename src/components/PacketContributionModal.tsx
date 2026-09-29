import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme';
import {
  activateDevicePrivateByteStore,
  addManualEvidenceUnit,
  commitStagedCapture,
  getSession,
  handoffReviewedUnits,
  openSessionForProduct,
  runExtraction,
  setSourceFraming,
  upsertSession,
  abstainingExtractionProducer,
  type ExtractionProducer,
  type PacketContributionSession,
} from '../packetContribution';
import { transmitSessionToAuthority } from '../evidenceAuthority/device';
import {
  NUTRITION_FIELDS,
  type NutritionAttribute,
  type NutritionBasis,
  type StatedNutritionAmount,
} from '../ingredientsNutrition/nutritionSchema';
import { PRODUCT_ORIGINS_CLAIM_TYPES, type ProductOriginsClaimType } from '../origins/governedFacts';
import type { ContributionEntryContext } from '../contribution/resultContributionActions';

type Preview = {
  tempKey: string;
  uri: string;
  source: 'camera' | 'gallery';
  bytes: Uint8Array;
};

type OriginDraft = {
  claimType: ProductOriginsClaimType;
  wording: string;
  place: string;
  ingredient: string;
};

const ORIGIN_LABELS: Record<ProductOriginsClaimType, string> = {
  grown_in: 'Grown in',
  produced_in: 'Produced in',
  made_in: 'Made in',
  packed_in: 'Packed in',
  ingredient_origin: 'Ingredient origin',
};

const BASIS_LABELS: { basis: NutritionBasis; label: string }[] = [
  { basis: 'per_100g', label: 'Per 100 g' },
  { basis: 'per_100ml', label: 'Per 100 mL' },
  { basis: 'per_serving', label: 'Per serving' },
];

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
    manual: 'Type ingredients instead',
    review: 'Check ingredients',
    submit: 'Submit ingredients',
  },
  nutrition: {
    header: 'Nutrition',
    instruction: 'Photograph the nutrition information panel, or choose a photo you already took.',
    manual: 'Enter nutrition instead',
    review: 'Check nutrition',
    submit: 'Submit nutrition',
  },
  origins: {
    header: 'Product origins',
    instruction: 'Photograph the origin statement on the pack, or choose a photo you already took.',
    manual: 'Enter origin statement instead',
    review: 'Check product origins',
    submit: 'Submit product origins',
    another: 'Add another origin statement',
  },
  packetClaims: {
    header: 'Packet claims',
    instruction: 'Photograph the claim on the pack, or choose a photo you already took.',
    manual: 'Type a claim instead',
    review: 'Check packet claims',
    submit: 'Submit packet claims',
    another: 'Add another claim',
  },
  certifications: {
    header: 'Certifications',
    instruction: 'Photograph the certification mark or wording on the pack, or choose a photo you already took.',
    manual: 'Enter certification instead',
    review: 'Check certifications',
    submit: 'Submit certifications',
    another: 'Add another certification',
  },
};

const DOMAIN_FOR_CONTEXT: Record<ContributionEntryContext, 'ingredients_nutrition' | 'origins' | 'packet_claims' | 'certifications'> = {
  ingredients: 'ingredients_nutrition',
  nutrition: 'ingredients_nutrition',
  origins: 'origins',
  packetClaims: 'packet_claims',
  certifications: 'certifications',
};

async function readUriBytes(uri: string): Promise<Uint8Array> {
  const encoded = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const binary = globalThis.atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
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
  producer?: ExtractionProducer;
  onClose: () => void;
  onSharedEvidenceAdmitted?: () => void | Promise<void>;
  onSharedEvidenceFailed?: () => void;
}) {
  const { colors } = useTheme();
  const [session, setSession] = useState<PacketContributionSession | null>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<'capture' | 'entry' | 'review'>('capture');
  const [ingredientsText, setIngredientsText] = useState(initialIngredients || '');
  const [basis, setBasis] = useState<NutritionBasis | null>(null);
  const [amounts, setAmounts] = useState<Partial<Record<NutritionAttribute, string>>>({});
  const [sodiumUnit, setSodiumUnit] = useState<'mg' | 'g'>('mg');
  const [origins, setOrigins] = useState<OriginDraft[]>([
    { claimType: 'grown_in', wording: '', place: '', ingredient: '' },
  ]);
  const [claims, setClaims] = useState<string[]>(['']);
  const [certs, setCerts] = useState<string[]>(['']);
  const [absence, setAbsence] = useState(false);
  const [skippedProposals, setSkippedProposals] = useState<string[]>([]);
  const [activeContext, setActiveContext] = useState<ContributionEntryContext>(entryContext);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setPhase('capture');
    setActiveContext(entryContext);
    setIngredientsText(initialIngredients || '');
    setAbsence(false);
    setSkippedProposals([]);
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
  }, [visible, barcode, variantKey, entryContext, initialIngredients]);

  const targeted = useMemo(
    () => (session?.sourceAssets || []).filter((asset) => asset.framing === 'targeted'),
    [session]
  );
  const showReadPhotos = producer.kind !== 'abstaining' && targeted.length > 0;
  const proposals = useMemo(() => {
    if (producer.kind === 'abstaining' || !session) return [];
    return session.extractionRuns.flatMap((run) =>
      run.observations
        .map((observation) => ({
          id: observation.observationId,
          context: contextForProposal(observation.proposedDomain, observation.proposedSection),
        }))
        .filter(
          (item): item is { id: string; context: ContributionEntryContext } =>
            item.context !== null && item.context !== activeContext && !skippedProposals.includes(item.id)
        )
    );
  }, [producer.kind, session, activeContext, skippedProposals]);

  const stage = async (uri: string, source: 'camera' | 'gallery') => {
    const bytes = await readUriBytes(uri);
    const staged = await commitStagedCapture({
      sessionId: session!.sessionId,
      bytes,
      source,
      now: Date.now(),
    });
    const framed = await setSourceFraming(staged.session.sessionId, staged.asset.assetId, 'targeted');
    setSession(framed);
    setPreviews((current) => [
      ...current,
      { tempKey: staged.asset.assetId, uri, source, bytes },
    ]);
  };

  const captureCamera = async () => {
    if (!session) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const shot = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (shot.canceled || !shot.assets[0]) return;
    setBusy(true);
    try {
      await stage(shot.assets[0].uri, 'camera');
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
    });
    if (picked.canceled || picked.assets.length === 0) return;
    setBusy(true);
    try {
      for (const asset of picked.assets) {
        const manipulated = await ImageManipulator.manipulateAsync(asset.uri, [], {
          compress: 1,
          format: ImageManipulator.SaveFormat.JPEG,
        });
        await stage(manipulated.uri, 'gallery');
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

  const supportFor = () => {
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
    setBusy(true);
    try {
      const context = activeContext;
      const domain = DOMAIN_FOR_CONTEXT[context];
      const support = supportFor();
      const created: string[] = [];
      if (context === 'ingredients') {
        const text = ingredientsText.trim();
        if (!text) return;
        const unit = await addManualEvidenceUnit({
          sessionId: session.sessionId,
          domain,
          section: 'ingredients',
          statement: text,
          support,
        });
        created.push(unit.unitId);
      } else if (context === 'nutrition') {
        if (!basis) return;
        const stated: StatedNutritionAmount[] = [];
        for (const field of NUTRITION_FIELDS) {
          const raw = (amounts[field.attribute] || '').trim();
          if (!raw) continue;
          const value = Number(raw);
          if (!Number.isFinite(value) || value < 0) continue;
          const unit = field.attribute === 'sodium' ? sodiumUnit : field.acceptedUnits[0];
          stated.push({ attribute: field.attribute, value, unit });
        }
        if (stated.length === 0) return;
        const unit = await addManualEvidenceUnit({
          sessionId: session.sessionId,
          domain,
          section: 'nutrition',
          statement: 'Nutrition facts',
          nutritionBasis: basis,
          nutritionAmounts: stated,
          support,
        });
        created.push(unit.unitId);
      } else if (context === 'origins') {
        for (const row of origins) {
          const place = row.place.trim();
          const wording = row.wording.trim();
          if (!wording || !place) continue;
          if (row.claimType === 'ingredient_origin' && !row.ingredient.trim()) continue;
          const unit = await addManualEvidenceUnit({
            sessionId: session.sessionId,
            domain,
            statement: wording,
            originClaimType: row.claimType,
            originCountry: place,
            originCountries: [place],
            ingredientSubject: row.claimType === 'ingredient_origin' ? row.ingredient.trim() : undefined,
            support,
          });
          created.push(unit.unitId);
        }
      } else if (context === 'packetClaims') {
        if (absence) {
          if (targeted.length === 0) return;
          const unit = await addManualEvidenceUnit({
            sessionId: session.sessionId,
            domain,
            statement: '',
            packetAbsenceAffirmation: true,
            support: { coverage: 'whole_image', sourceAssetId: targeted[0].assetId },
          });
          created.push(unit.unitId);
        }
        for (const claim of claims) {
          const text = claim.trim();
          if (!text) continue;
          const unit = await addManualEvidenceUnit({
            sessionId: session.sessionId,
            domain,
            statement: text,
            support,
          });
          created.push(unit.unitId);
        }
      } else {
        for (const cert of certs) {
          const text = cert.trim();
          if (!text) continue;
          const unit = await addManualEvidenceUnit({
            sessionId: session.sessionId,
            domain,
            statement: text,
            support,
          });
          created.push(unit.unitId);
        }
      }
      if (created.length === 0) return;
      const latest = await getSession(session.sessionId);
      if (latest) {
        const companions = targeted.slice(1).map((asset) => asset.assetId);
        await upsertSession({
          ...latest,
          units: latest.units.map((unit) => {
            if (!created.includes(unit.unitId)) return unit;
            const photoSupport =
              targeted.length > 0 && unit.packetAbsenceAffirmation === true
                ? { coverage: 'whole_image' as const, sourceAssetId: targeted[0].assetId }
                : unit.support;
            if (targeted.length === 0 && unit.packetAbsenceAffirmation !== true) {
              return {
                ...unit,
                support: { coverage: 'whole_image' as const, sourceAssetId: `manual-text:${unit.unitId}` },
              };
            }
            return {
              ...unit,
              support: photoSupport,
              ...(companions.length > 0 ? { companionSourceAssetIds: companions } : {}),
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
      if (submitted.length === 0) {
        onSharedEvidenceFailed?.();
        return;
      }
      const transmitted = await transmitSessionToAuthority(session.sessionId);
      if (!transmitted.admitted) {
        onSharedEvidenceFailed?.();
        return;
      }
      await onSharedEvidenceAdmitted?.();
      onClose();
    } catch {
      onSharedEvidenceFailed?.();
    } finally {
      setBusy(false);
    }
  };

  const journey = JOURNEY[activeContext];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView style={[styles.page, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
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
            {previews.map((preview) => (
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
                    <TouchableOpacity onPress={() => setActiveContext(proposal.context)}>
                      <Text style={{ color: colors.primary }}>Review</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setSkippedProposals((rows) => [...rows, proposal.id])}>
                      <Text style={{ color: colors.primary }}>Skip</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}
            <TouchableOpacity onPress={() => setPhase('entry')} style={styles.button}>
              <Text style={styles.buttonText}>{journey.manual}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPhase('review')} style={styles.button}>
              <Text style={styles.buttonText}>{journey.review}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {phase === 'entry' || phase === 'review' ? (
          <View>
            <Text style={[styles.header, { color: colors.text }]}>{journey.review}</Text>
            {activeContext === 'ingredients' ? (
              <View>
                <Text style={{ color: colors.text }}>Ingredients</Text>
                <TextInput
                  value={ingredientsText}
                  onChangeText={setIngredientsText}
                  multiline
                  placeholder="Ingredients"
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                />
              </View>
            ) : null}
            {activeContext === 'nutrition' ? (
              <View>
                <Text style={{ color: colors.text }}>Values are shown</Text>
                <View style={styles.row}>
                  {BASIS_LABELS.map((item) => (
                    <TouchableOpacity key={item.basis} onPress={() => setBasis(item.basis)}>
                      <Text style={{ color: basis === item.basis ? colors.primary : colors.text }}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {NUTRITION_FIELDS.map((field) => (
                  <View key={field.attribute}>
                    <Text style={{ color: colors.text }}>{field.packetConcept}</Text>
                    <TextInput
                      value={amounts[field.attribute] || ''}
                      onChangeText={(value) => setAmounts((current) => ({ ...current, [field.attribute]: value }))}
                      keyboardType="decimal-pad"
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    />
                    {field.attribute === 'sodium' ? (
                      <View style={styles.row}>
                        <TouchableOpacity onPress={() => setSodiumUnit('mg')}>
                          <Text style={{ color: sodiumUnit === 'mg' ? colors.primary : colors.text }}>mg</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSodiumUnit('g')}>
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
                  <View key={`${row.claimType}-${index}`}>
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
                    <Text style={{ color: colors.text }}>Country or place stated on the pack</Text>
                    <TextInput
                      value={row.place}
                      onChangeText={(value) =>
                        setOrigins((rows) => rows.map((item, itemIndex) => (itemIndex === index ? { ...item, place: value } : item)))
                      }
                      placeholder="Country or place stated on the pack"
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    />
                  </View>
                ))
              : null}
            {activeContext === 'origins' && journey.another ? (
              <TouchableOpacity
                onPress={() => setOrigins((rows) => [...rows, { claimType: 'grown_in', wording: '', place: '', ingredient: '' }])}
              >
                <Text style={{ color: colors.primary }}>{journey.another}</Text>
              </TouchableOpacity>
            ) : null}
            {activeContext === 'packetClaims'
              ? claims.map((claim, index) => (
                  <View key={`claim-${index}`}>
                    <Text style={{ color: colors.text }}>Claim on the pack</Text>
                    <TextInput
                      value={claim}
                      onChangeText={(value) => setClaims((rows) => rows.map((item, itemIndex) => (itemIndex === index ? value : item)))}
                      placeholder="Claim on the pack"
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    />
                  </View>
                ))
              : null}
            {activeContext === 'packetClaims' ? (
              <View>
                <TouchableOpacity onPress={() => setClaims((rows) => [...rows, ''])}>
                  <Text style={{ color: colors.primary }}>{journey.another}</Text>
                </TouchableOpacity>
                {targeted.length > 0 ? (
                  <TouchableOpacity onPress={() => setAbsence(true)}>
                    <Text style={{ color: colors.primary }}>
                      I checked the pack and couldn’t find a relevant claim or certification.
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
            {activeContext === 'certifications'
              ? certs.map((cert, index) => (
                  <View key={`cert-${index}`}>
                    <Text style={{ color: colors.text }}>Certification shown on the pack</Text>
                    <TextInput
                      value={cert}
                      onChangeText={(value) => setCerts((rows) => rows.map((item, itemIndex) => (itemIndex === index ? value : item)))}
                      placeholder="Certification shown on the pack"
                      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    />
                  </View>
                ))
              : null}
            {activeContext === 'certifications' ? (
              <TouchableOpacity onPress={() => setCerts((rows) => [...rows, ''])}>
                <Text style={{ color: colors.primary }}>{journey.another}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={submit} style={styles.button} accessibilityRole="button">
              <Text style={styles.buttonText}>{journey.submit}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {busy ? <ActivityIndicator /> : null}
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: colors.primary }}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
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
