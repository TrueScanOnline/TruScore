import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPrivateByteStore } from './sourceAssets';

export const WAVE4A1_UAT_CUTOVER_ID = 'wave4a.1';
export const WAVE4A1_UAT_CUTOVER_MARKER = '@rveel_wave4a1_uat_cutover';

/** Contribution/UAT keys only. Unrelated app data is not matched. */
export const UAT_CONTRIBUTION_KEY_PREFIXES = [
  '@rveel_packet_contribution_sessions_v1',
  '@rveel_contribution_evidence_v1',
  '@rveel_contribution_recovery_v1',
  '@truescan_pending_contributions_',
  'manufacturing_country_submissions',
];

export function isUatContributionKey(key: string): boolean {
  return UAT_CONTRIBUTION_KEY_PREFIXES.some((prefix) => key === prefix || key.startsWith(prefix));
}

export async function resetWave4a1UatContributionState(): Promise<{ removedKeys: string[] }> {
  const keys = await AsyncStorage.getAllKeys();
  const removedKeys = keys.filter((key) => isUatContributionKey(key));
  if (removedKeys.length > 0) {
    await AsyncStorage.multiRemove(removedKeys);
  }
  await getPrivateByteStore().clearPacketObjects();
  return { removedKeys };
}

export async function ensureWave4a1UatCutoverOnce(): Promise<{ ran: boolean; removedKeys: string[] }> {
  const marker = await AsyncStorage.getItem(WAVE4A1_UAT_CUTOVER_MARKER);
  if (marker === WAVE4A1_UAT_CUTOVER_ID) {
    return { ran: false, removedKeys: [] };
  }
  const { removedKeys } = await resetWave4a1UatContributionState();
  await AsyncStorage.setItem(WAVE4A1_UAT_CUTOVER_MARKER, WAVE4A1_UAT_CUTOVER_ID);
  return { ran: true, removedKeys };
}
