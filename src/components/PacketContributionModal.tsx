import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  applyReviewAction,
  commitStagedCapture,
  handoffReviewedUnits,
  openSessionForProduct,
  rejectStagedCapture,
  runExtraction,
  setSourceFraming,
  type EvidenceUnitDomain,
  type PacketContributionSession,
} from '../packetContribution';

type Preview = {
  tempKey: string;
  uri: string;
  source: 'camera' | 'gallery';
  bytes: Uint8Array;
};

async function readUriBytes(uri: string): Promise<Uint8Array> {
  const encoded = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const binary = globalThis.atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export default function PacketContributionModal({
  visible,
  barcode,
  variantKey,
  onClose,
}: {
  visible: boolean;
  barcode: string;
  variantKey?: string;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [session, setSession] = useState<PacketContributionSession | null>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [busy, setBusy] = useState(false);
  const [statement, setStatement] = useState('');
  const [domain, setDomain] = useState<EvidenceUnitDomain>('unspecified');
  const [section, setSection] = useState<'ingredients' | 'nutrition'>('ingredients');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        await activateDevicePrivateByteStore();
        const opened = await openSessionForProduct({ barcode, variantKey });
        if (!cancelled) setSession(opened);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, barcode, variantKey]);

  const stageAssets = async (assets: ImagePicker.ImagePickerAsset[], source: 'camera' | 'gallery') => {
    const next: Preview[] = [];
    for (const asset of assets) {
      let uri = asset.uri;
      if (source === 'gallery') {
        const stripped = await ImageManipulator.manipulateAsync(uri, [], {
          compress: 1,
          format: ImageManipulator.SaveFormat.JPEG,
        });
        uri = stripped.uri;
      }
      const bytes = await readUriBytes(uri);
      const tempKey = `packet/preview/${Date.now()}_${next.length}`;
      next.push({ tempKey, uri, source, bytes });
    }
    setPreviews((current) => [...current, ...next]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission is needed to photograph the pack.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) await stageAssets(result.assets, 'camera');
  };

  const pickGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo library permission is needed to import pack photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled) await stageAssets(result.assets, 'gallery');
  };

  const usePreview = async (preview: Preview) => {
    if (!session) return;
    setBusy(true);
    try {
      const committed = await commitStagedCapture({
        sessionId: session.sessionId,
        bytes: preview.bytes,
        source: preview.source,
        metadata: undefined,
      });
      setSession(committed.session);
      setPreviews((current) => current.filter((item) => item.tempKey !== preview.tempKey));
      setNotice(committed.duplicate ? 'That photo is already in this contribution.' : 'Photo kept with this contribution.');
    } finally {
      setBusy(false);
    }
  };

  const retakePreview = async (preview: Preview) => {
    await rejectStagedCapture(preview.tempKey);
    setPreviews((current) => current.filter((item) => item.tempKey !== preview.tempKey));
  };

  const markTargeted = async (assetId: string) => {
    if (!session) return;
    setSession(await setSourceFraming(session.sessionId, assetId, 'targeted'));
  };

  const extract = async () => {
    if (!session) return;
    setBusy(true);
    try {
      const result = await runExtraction({ sessionId: session.sessionId });
      setSession(result.session);
      setNotice(result.run.statusDetail);
    } finally {
      setBusy(false);
    }
  };

  const addManual = async () => {
    if (!session || !statement.trim()) return;
    const asset = session.sourceAssets.find((item) => item.framing === 'targeted') || session.sourceAssets[0];
    if (!asset) {
      setNotice('Add a photo first, or continue with text only after a targeted photo is kept.');
      return;
    }
    if (asset.framing !== 'targeted') {
      setNotice('Mark the photo as only the relevant information, or take a closer photo, before saving this statement.');
      return;
    }
    const sugars = Number(statement);
    const nutritionNumbers =
      domain === 'ingredients_nutrition' && section === 'nutrition' && Number.isFinite(sugars)
        ? { sugars_100g: sugars }
        : undefined;
    if (domain === 'ingredients_nutrition' && section === 'nutrition' && !nutritionNumbers) {
      setNotice('Enter one nutrition value as a number. A partial entry is not a complete panel, and it does not create a Nutri-Score or NOVA group.');
      return;
    }
    const unit = await addManualEvidenceUnit({
      sessionId: session.sessionId,
      domain,
      statement: nutritionNumbers ? `Sugars ${sugars} per 100g` : statement,
      support: { coverage: 'whole_image', sourceAssetId: asset.assetId },
      section: domain === 'ingredients_nutrition' ? section : undefined,
      nutriments: nutritionNumbers,
      nutritionBasis: nutritionNumbers ? 'per_100g' : undefined,
    });
    const reviewed = await applyReviewAction({
      sessionId: session.sessionId,
      unitId: unit.unitId,
      action: 'manual_entry',
      correctionText: statement,
    });
    const refreshed = await openSessionForProduct({ barcode, variantKey });
    setSession(refreshed);
    setStatement('');
    setNotice(reviewed.status === 'reviewed' ? 'Saved for submission. Other photos stay in this contribution.' : 'Saved.');
  };

  const setAside = async (unitId: string) => {
    if (!session) return;
    await applyReviewAction({ sessionId: session.sessionId, unitId, action: 'set_aside' });
    setSession(await openSessionForProduct({ barcode, variantKey }));
  };

  const submit = async () => {
    if (!session) return;
    setBusy(true);
    try {
      const results = await handoffReviewedUnits({ sessionId: session.sessionId });
      setSession(await openSessionForProduct({ barcode, variantKey }));
      const submitted = results.filter((item) => item.outcome === 'submitted').length;
      const held = results.filter((item) => item.outcome === 'held_for_later_receiver').length;
      setNotice(
        held > 0
          ? `${submitted} submitted for governed review. ${held} kept locally until that section’s receiver exists.`
          : `${submitted} submitted for governed review. Nothing was scored from this step.`
      );
    } finally {
      setBusy(false);
    }
  };

  const preview = previews[0];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Photograph the pack</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Photograph the information on the pack clearly. Take more than one photo if needed.
          </Text>
          {busy ? <ActivityIndicator /> : null}
          {notice ? <Text style={[styles.notice, { color: colors.text }]}>{notice}</Text> : null}

          {preview ? (
            <View style={[styles.card, { borderColor: colors.border }]}>
              <Image source={{ uri: preview.uri }} style={styles.preview} />
              <View style={styles.row}>
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => usePreview(preview)}>
                  <Text style={styles.buttonText}>Use</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.card }]} onPress={() => retakePreview(preview)}>
                  <Text style={[styles.buttonText, { color: colors.text }]}>Retake</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.row}>
              <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={takePhoto}>
                <Text style={styles.buttonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={pickGallery}>
                <Text style={styles.buttonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {(session?.sourceAssets || []).map((asset) => (
            <View key={asset.assetId} style={[styles.card, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text }}>
                Photo kept · {asset.source} · {asset.framing === 'targeted' ? 'one section' : 'not yet marked as one section'}
              </Text>
              {asset.framing !== 'targeted' ? (
                <TouchableOpacity onPress={() => markTargeted(asset.assetId)}>
                  <Text style={{ color: colors.primary }}>This photo shows only the relevant information</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.card }]} onPress={extract}>
            <Text style={[styles.buttonText, { color: colors.text }]}>Read the photos</Text>
          </TouchableOpacity>

          <Text style={[styles.body, { color: colors.textSecondary }]}>
            If reading the pack does not work, type the statement yourself. It is not scored from this screen.
          </Text>
          <TextInput
            value={statement}
            onChangeText={setStatement}
            placeholder="What the pack says"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          />
          <View style={styles.row}>
            {(['origins', 'certifications', 'ingredients_nutrition', 'packet_claims'] as const).map((item) => (
              <TouchableOpacity key={item} onPress={() => setDomain(item)}>
                <Text style={{ color: domain === item ? colors.primary : colors.textSecondary }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {domain === 'ingredients_nutrition' ? (
            <View style={styles.row}>
              {(['ingredients', 'nutrition'] as const).map((item) => (
                <TouchableOpacity key={item} onPress={() => setSection(item)}>
                  <Text style={{ color: section === item ? colors.primary : colors.textSecondary }}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          {domain === 'ingredients_nutrition' ? (
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Ingredients and nutrition can be saved separately. A partial nutrition entry is not a complete panel, and it does not create a Nutri-Score or NOVA group.
            </Text>
          ) : null}
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={addManual}>
            <Text style={styles.buttonText}>Save statement</Text>
          </TouchableOpacity>

          {(session?.units || []).map((unit) => (
            <View key={unit.unitId} style={[styles.card, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text }}>{unit.statement}</Text>
              <Text style={{ color: colors.textSecondary }}>{unit.status}</Text>
              {unit.status === 'open' ? (
                <TouchableOpacity onPress={() => setAside(unit.unitId)}>
                  <Text style={{ color: colors.primary }}>Set this aside</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={submit}>
            <Text style={styles.buttonText}>Submit reviewed statements</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: colors.textSecondary }}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 22 },
  notice: { fontSize: 15 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
  preview: { width: '100%', height: 220, borderRadius: 8 },
  row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  button: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16 },
  buttonText: { color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 },
});
