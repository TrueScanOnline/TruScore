/**
 * Utility script to clear onboarding flag for testing
 * Run this with: node clear-onboarding.js
 * 
 * Note: This is for development/testing only.
 * In production, users should use Settings → About → "Show Onboarding Again"
 */

const AsyncStorage = require('@react-native-async-storage/async-storage');

async function clearOnboarding() {
  try {
    const STORAGE_KEY = '@truescan_settings';
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('Current settings:', parsed);
      
      // Set hasCompletedOnboarding to false
      parsed.hasCompletedOnboarding = false;
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      console.log('✅ Onboarding flag cleared. hasCompletedOnboarding set to false.');
      console.log('Updated settings:', parsed);
    } else {
      console.log('No stored settings found. Onboarding will show by default.');
    }
  } catch (error) {
    console.error('Error clearing onboarding:', error);
  }
}

clearOnboarding();

