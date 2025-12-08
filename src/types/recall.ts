// Unified Recall interface for all recall sources
// Consolidates FDA, Recalls.gov, EU RASFF, and CFIA recall data

export interface UnifiedRecall {
  recallId: string;
  productName: string;
  brand?: string;
  reason: string;
  recallDate: string;
  agency: 'FDA' | 'USDA_FSIS' | 'CPSC' | 'RASFF' | 'CFIA' | 'OTHER';
  distribution?: string[];
  isActive: boolean;
  url?: string;
  barcode?: string;
}

/**
 * Convert FDA FoodRecall to UnifiedRecall
 */
export function convertFDARecall(recall: { recallId?: string; productName?: string; brand?: string; reason?: string; recallDate?: string; distribution?: string[]; isActive?: boolean; url?: string; barcode?: string }): UnifiedRecall {
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
  };
}

/**
 * Convert ComprehensiveUSRecall to UnifiedRecall
 */
export function convertComprehensiveUSRecall(recall: { recallId?: string; productName?: string; brand?: string; reason?: string; recallDate?: string; agency?: string; distribution?: string[]; isActive?: boolean; url?: string; barcode?: string }): UnifiedRecall {
  // Validate agency type
  const validAgencies: Array<'FDA' | 'USDA_FSIS' | 'CPSC' | 'RASFF' | 'CFIA' | 'OTHER'> = ['FDA', 'USDA_FSIS', 'CPSC', 'RASFF', 'CFIA', 'OTHER'];
  const agency = (recall.agency && validAgencies.includes(recall.agency as any)) 
    ? (recall.agency as 'FDA' | 'USDA_FSIS' | 'CPSC' | 'RASFF' | 'CFIA' | 'OTHER')
    : 'OTHER';
  
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
  };
}

/**
 * Convert RASFFAlert to UnifiedRecall
 */
export function convertRASFFAlert(alert: { alertId?: string; productName?: string; brand?: string; reason?: string; alertDate?: string; country?: string; isActive?: boolean; url?: string; barcode?: string }): UnifiedRecall {
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
  };
}

/**
 * Convert CFIARecall to UnifiedRecall
 */
export function convertCFIARecall(recall: { recallId?: string; productName?: string; brand?: string; reason?: string; recallDate?: string; distribution?: string[]; isActive?: boolean; url?: string; barcode?: string }): UnifiedRecall {
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
  };
}

