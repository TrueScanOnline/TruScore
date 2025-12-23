// Unified Recall interface for all recall sources
// Consolidates FDA, Recalls.gov, EU RASFF, and CFIA recall data

export type RecallClassification = 'Class I' | 'Class II' | 'Class III' | 'Unknown';

export interface UnifiedRecall {
  recallId: string;
  productName: string;
  brand?: string;
  reason: string;
  recallDate: string;
  agency: 'FDA' | 'USDA_FSIS' | 'CPSC' | 'RASFF' | 'CFIA' | 'UK_FSA' | 'OTHER';
  distribution?: string[];
  isActive: boolean;
  url?: string;
  barcode?: string;
  classification?: RecallClassification; // FDA Class I/II/III for severity-based scoring
}

/**
 * Convert FDA FoodRecall to UnifiedRecall
 */
export function convertFDARecall(recall: { recallId?: string; productName?: string; brand?: string; reason?: string; recallDate?: string; distribution?: string[]; isActive?: boolean; url?: string; barcode?: string; classification?: RecallClassification }): UnifiedRecall {
  return {
    recallId: recall.recallId || 'unknown',
    productName: recall.productName || 'Unknown Product',
    brand: recall.brand,
    reason: recall.reason || 'No reason provided',
    recallDate: recall.recallDate || new Date().toISOString(),
    agency: 'FDA',
    distribution: recall.distribution,
    isActive: recall.isActive !== false,
    url: recall.url,
    barcode: recall.barcode,
    classification: recall.classification,
  };
}

/**
 * Infer recall classification from reason text
 */
function inferClassificationFromReason(reason: string): RecallClassification {
  if (!reason) return 'Unknown';
  
  const reasonLower = reason.toLowerCase();
  
  // Class I indicators: death, serious, life-threatening, contamination, listeria, salmonella, e.coli
  if (reasonLower.match(/\b(death|serious|life-threatening|fatal|contamination|listeria|salmonella|e\.?coli|botulism|lead|mercury|arsenic)\b/)) {
    return 'Class I';
  }
  // Class II indicators: temporary, reversible, minor, mislabeling
  if (reasonLower.match(/\b(temporary|reversible|minor|mislabeling|undeclared|allergen)\b/)) {
    return 'Class II';
  }
  // Class III: unlikely to cause, quality issues
  if (reasonLower.match(/\b(unlikely|quality|packaging|cosmetic)\b/)) {
    return 'Class III';
  }
  
  return 'Unknown';
}

/**
 * Convert ComprehensiveUSRecall to UnifiedRecall
 */
export function convertComprehensiveUSRecall(recall: { recallId?: string; productName?: string; brand?: string; reason?: string; recallDate?: string; agency?: string; distribution?: string[]; isActive?: boolean; url?: string; barcode?: string; classification?: RecallClassification }): UnifiedRecall {
  // Validate agency type
  const validAgencies: Array<'FDA' | 'USDA_FSIS' | 'CPSC' | 'RASFF' | 'CFIA' | 'OTHER'> = ['FDA', 'USDA_FSIS', 'CPSC', 'RASFF', 'CFIA', 'OTHER'];
  const agency = (recall.agency && validAgencies.includes(recall.agency as any)) 
    ? (recall.agency as 'FDA' | 'USDA_FSIS' | 'CPSC' | 'RASFF' | 'CFIA' | 'OTHER')
    : 'OTHER';
  
  // Infer classification if not provided
  const classification = recall.classification || inferClassificationFromReason(recall.reason || '');
  
  return {
    recallId: recall.recallId || 'unknown',
    productName: recall.productName || 'Unknown Product',
    brand: recall.brand,
    reason: recall.reason || 'No reason provided',
    recallDate: recall.recallDate || new Date().toISOString(),
    agency,
    distribution: recall.distribution,
    isActive: recall.isActive !== false,
    url: recall.url,
    barcode: recall.barcode,
    classification,
  };
}

/**
 * Convert RASFFAlert to UnifiedRecall
 */
export function convertRASFFAlert(alert: { alertId?: string; productName?: string; brand?: string; reason?: string; alertDate?: string; country?: string; isActive?: boolean; url?: string; barcode?: string; riskLevel?: string }): UnifiedRecall {
  // Infer classification from RASFF risk level or reason
  let classification: RecallClassification = 'Unknown';
  if (alert.riskLevel) {
    const riskLower = alert.riskLevel.toLowerCase();
    if (riskLower.includes('serious')) {
      classification = 'Class I';
    } else if (riskLower.includes('information')) {
      classification = 'Class II';
    } else if (riskLower.includes('border')) {
      classification = 'Class II';
    }
  }
  if (classification === 'Unknown' && alert.reason) {
    classification = inferClassificationFromReason(alert.reason);
  }
  
  return {
    recallId: alert.alertId || 'unknown',
    productName: alert.productName || 'Unknown Product',
    brand: alert.brand,
    reason: alert.reason || 'No reason provided',
    recallDate: alert.alertDate || new Date().toISOString(),
    agency: 'RASFF',
    distribution: alert.country ? [alert.country] : undefined,
    isActive: alert.isActive !== false,
    url: alert.url,
    barcode: alert.barcode,
    classification,
  };
}

/**
 * Convert CFIARecall to UnifiedRecall
 */
export function convertCFIARecall(recall: { recallId?: string; productName?: string; brand?: string; reason?: string; recallDate?: string; distribution?: string[]; isActive?: boolean; url?: string; barcode?: string }): UnifiedRecall {
  // Infer classification from reason text
  const classification = inferClassificationFromReason(recall.reason || '');
  
  return {
    recallId: recall.recallId || 'unknown',
    productName: recall.productName || 'Unknown Product',
    brand: recall.brand,
    reason: recall.reason || 'No reason provided',
    recallDate: recall.recallDate || new Date().toISOString(),
    agency: 'CFIA',
    distribution: recall.distribution,
    isActive: recall.isActive !== false,
    url: recall.url,
    barcode: recall.barcode,
    classification,
  };
}

