/**
 * Palm Oil Utilities
 * 
 * Shared functions for determining palm oil status and flags
 * Ensures consistency between Palm Oil card and Palm Oil Info Modal
 */

import { PalmOilAnalysis } from '../types/product';

export type PalmOilFlag = 'green' | 'orange' | 'red';

export interface PalmOilStatus {
  flag: PalmOilFlag;
  label: string;
  isPalmOilFree: boolean;
  containsPalmOil: boolean;
  isNonSustainable: boolean;
  isUnknown: boolean;
}

/**
 * Determine palm oil flag and status from analysis
 * 
 * Priority order:
 * 1. Green: isPalmOilFree = true (Palm Oil Free)
 * 2. Red: isNonSustainable = true (Non-Sustainable Palm Oil)
 * 3. Orange: containsPalmOil = true (Contains Palm Oil)
 * 4. Green: Default/Unknown (Status Unknown)
 * 
 * This logic MUST be used by both:
 * - Palm Oil card (app/result/[barcode].tsx)
 * - Palm Oil Info Modal (src/components/PalmOilInfoModal.tsx)
 */
export function getPalmOilStatus(analysis: PalmOilAnalysis | null | undefined): PalmOilStatus | null {
  if (!analysis) {
    return null;
  }

  const { isPalmOilFree, containsPalmOil, isNonSustainable } = analysis;

  // Priority 1: Palm Oil Free (Green)
  if (isPalmOilFree) {
    return {
      flag: 'green',
      label: 'Palm Oil Free',
      isPalmOilFree: true,
      containsPalmOil: false,
      isNonSustainable: false,
      isUnknown: false,
    };
  }

  // Priority 2: Non-Sustainable (Red)
  if (isNonSustainable) {
    return {
      flag: 'red',
      label: 'Non-Sustainable Palm Oil',
      isPalmOilFree: false,
      containsPalmOil: true,
      isNonSustainable: true,
      isUnknown: false,
    };
  }

  // Priority 3: Contains Palm Oil (Orange)
  if (containsPalmOil) {
    return {
      flag: 'orange',
      label: 'Contains Palm Oil',
      isPalmOilFree: false,
      containsPalmOil: true,
      isNonSustainable: false,
      isUnknown: false,
    };
  }

  // Priority 4: Unknown/Default (Green)
  return {
    flag: 'green',
    label: 'Palm Oil Status Unknown',
    isPalmOilFree: false,
    containsPalmOil: false,
    isNonSustainable: false,
    isUnknown: true,
  };
}

/**
 * Get color code for palm oil flag
 */
export function getPalmOilFlagColor(flag: PalmOilFlag): string {
  switch (flag) {
    case 'green':
      return '#16a085';
    case 'orange':
      return '#ff9500';
    case 'red':
      return '#ff6b6b';
    default:
      return '#16a085'; // Default to green
  }
}

