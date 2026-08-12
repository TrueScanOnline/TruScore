import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const USER_ID_KEY = 'manufacturing_country_user_id';

/** Stable pseudonymous contributor id (same store as existing CoM submissions). */
export async function getContributorId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(USER_ID_KEY);
    if (existing) return existing;
    const created = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await AsyncStorage.setItem(USER_ID_KEY, created);
    return created;
  } catch (error) {
    logger.error('[contributions] contributor id failed', error);
    return `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
