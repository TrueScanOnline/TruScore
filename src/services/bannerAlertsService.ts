/**
 * Banner Alerts Service
 *
 * Collects and generates banner alerts from:
 * 1. APP-generated alerts (recalls, brand recall transparency note, Ethics pillar BBFAW/KTC mirrors)
 * 2. User preference alerts (from user Alerts tab / alert preferences)
 *
 * Ethics (BBFAW, KTC): Banner copy for animal welfare and supply-chain labour is derived ONLY from
 * `calculateEthicsPillar` (same engine as the Ethics pillar / spec sheet). Legacy NGO/DOL/brand-DB
 * “ethics” banners were removed so the UI cannot contradict the pillar.
 *
 * Note: Banner text explains scoring sources; TruScore is still computed in the TruScore engine.
 *
 * Legal (ID 17): Negative Ethics pillar factors (BBFAW, KTC) are surfaced with explanation + link.
 * Product recalls (FDA/USDA/CFIA/RASFF) keep specific/generic links as before.
 */

import { Product, ProductWithTrustScore } from '../types/product';
import { BannerAlert, BannerAlertsData } from '../types/bannerAlerts';
import { AlertsPreferences } from '../store/useAlertsStore';
import { extractAllBrands } from '../utils/brandExtraction';
import { getBrandData } from '../data/brandDatabase';
import { logger } from '../utils/logger';
import { buildEthicsPillarBannerAlerts } from './ethicsPillarBannerAlerts';
import { calculateEthicsPillar } from '../lib/truscoreEngine/pillars/ethicsPillar';

/**
 * Generate banner alerts for a product
 * Combines APP-generated alerts and User Preference alerts
 * 
 * NOTE: This function is SYNCHRONOUS and FAST - it only processes data already in the product object.
 * It does NOT make any API calls or web scraping. All async data fetching happens in productService.ts
 * and is non-blocking (with timeouts).
 */
export interface GenerateBannerAlertsOptions {
  /** Override clock (golden harness / tests) */
  now?: () => number;
}

export function generateBannerAlerts(
  product: Product | ProductWithTrustScore,
  userPreferences: AlertsPreferences,
  options?: GenerateBannerAlertsOptions
): BannerAlertsData {
  const alerts: BannerAlert[] = [];
  const nowMs = options?.now ? options.now() : Date.now();

  // 1. APP-GENERATED ALERTS

  // 1.1 Product Recalls
  // Time-bound: <12 months per spec (changed from 3 months to 12 months)
  if (product.recalls && product.recalls.length > 0) {
    const twelveMonthsAgo = nowMs - (12 * 30 * 24 * 60 * 60 * 1000);
    
    const recentRecalls = product.recalls.filter(recall => {
      if (!recall.isActive) return false;
      const recallDate = new Date(recall.recallDate).getTime();
      return recallDate >= twelveMonthsAgo;
    });

    if (recentRecalls.length > 0) {
      const highestSeverity = recentRecalls.reduce((highest, recall) => {
        const priority = recall.classification === 'Class I' ? 3 :
                        recall.classification === 'Class II' ? 2 :
                        recall.classification === 'Class III' ? 1 : 0;
        return priority > highest.priority ? { priority, recall } : highest;
      }, { priority: 0, recall: recentRecalls[0] });

      const severity = highestSeverity.recall.classification === 'Class I' ? 'high' :
                      highestSeverity.recall.classification === 'Class II' ? 'medium' : 'low';

      const organization = highestSeverity.recall.recallId?.toUpperCase().includes('FDA') || highestSeverity.recall.recallId?.startsWith('F-') ? 'FDA' :
                           highestSeverity.recall.recallId?.toUpperCase().includes('USDA') || 
                           highestSeverity.recall.recallId?.toUpperCase().includes('FSIS') || 
                           highestSeverity.recall.recallId?.toUpperCase().startsWith('FSIS-') ? 'USDA FSIS' :
                           highestSeverity.recall.recallId?.toUpperCase().includes('CFIA') ? 'CFIA' :
                           highestSeverity.recall.recallId?.toUpperCase().includes('RASFF') ? 'RASFF' : 'Government Agency';
      
      // Specific report URL first; only use generic agency link when exact URL not available (ID 17)
      let actionUrl: string | undefined = highestSeverity.recall.url;
      if (!actionUrl || !actionUrl.startsWith('http')) {
        if (organization === 'FDA') {
          actionUrl = 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts';
        } else if (organization === 'USDA FSIS') {
          actionUrl = 'https://www.fsis.usda.gov/recalls';
        } else if (organization === 'CFIA') {
          actionUrl = 'https://www.inspection.gc.ca/food-recall-warnings-and-allergies/recalls-and-alerts/eng/1351519587174/1351519588221';
        } else if (organization === 'RASFF') {
          actionUrl = 'https://webgate.ec.europa.eu/rasff-window/portal/';
        }
      }

      alerts.push({
        id: `recall-${product.barcode}-${nowMs}`,
        source: 'app',
        category: 'recall',
        signalClass: 'A',
        dedupeKey: `safety:recall:active:${product.barcode}`,
        title: 'Product Recall',
        message: `${recentRecalls.length} active recall(s) found. ${highestSeverity.recall.reason || 'Safety concern identified.'} Review official recall notices for safety details.`,
        severity,
        timestamp: nowMs,
        actionUrl,
        sourceDetails: {
          organization,
          recallClassification: highestSeverity.recall.classification === 'Unknown' ? undefined : highestSeverity.recall.classification,
        },
      });
    }
  }

  // 1.1a Ethics pillar mirrors — BBFAW & KTC only (same `calculateEthicsPillar` as TruScore Ethics)
  const ethicsPillarResult = calculateEthicsPillar(product);
  alerts.push(
    ...buildEthicsPillarBannerAlerts(product, ethicsPillarResult, {
      mentionForcedLabourPreference:
        userPreferences.ethicalEnabled && userPreferences.avoidForcedLabour,
    })
  );

  // 1.1b Brand recall history — informational only (not part of Ethics pillar v37 BBFAW/KTC)
  const hasRecentProductRecalls = product.recalls && product.recalls.some((r: { isActive?: boolean; recallDate?: string }) => {
    if (!r.isActive) return false;
    const recallDate = r.recallDate ? new Date(r.recallDate).getTime() : 0;
    const twelveMonthsAgo = nowMs - (12 * 30 * 24 * 60 * 60 * 1000);
    return recallDate >= twelveMonthsAgo;
  });
  if (!hasRecentProductRecalls) {
    const brandsForRecallCheck = extractAllBrands(product);
    let brandWithRecallHistory: string | null = null;
    for (const b of brandsForRecallCheck) {
      const data = getBrandData(b);
      if (data?.recallHistory === true) {
        brandWithRecallHistory = (data.name || b).trim();
        break;
      }
    }
    if (brandWithRecallHistory) {
      const recallSearchUrl = 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts';
      alerts.push({
        id: `brand-recall-history-${product.barcode}-${nowMs}`,
        source: 'app',
        category: 'recall',
        signalClass: 'B',
        dedupeKey: `transparency:recall:brand-history:${product.barcode}`,
        title: 'Brand recall history',
        message: `Our brand database flags ${brandWithRecallHistory} with a history of product recalls (transparency only; not part of the Rveel Score Ethics pillar BBFAW/KTC calculation). Tap for FDA recalls reference.`,
        severity: 'medium',
        timestamp: Date.now(),
        actionUrl: recallSearchUrl,
        sourceDetails: { organization: 'Brand database (FDA reference)' },
      });
    }
  }

  // 2. USER PREFERENCE ALERTS

  // 2.1 Animal Testing Preference
  if (userPreferences.ethicalEnabled && userPreferences.avoidAnimalTesting) {
    const brands = extractAllBrands(product);
    const brandData = brands.length > 0 ? getBrandData(brands[0]) : null;
    
    if (brandData && brandData.animalTesting === true) {
      alerts.push({
        id: `user-pref-animal-testing-${product.barcode}`,
        source: 'user_preference',
        category: 'animal_cruelty',
        signalClass: 'C',
        dedupeKey: `preference:animal_testing:${product.barcode}`,
        title: 'Animal Testing Detected',
        message: 'This product/brand is known for animal testing, which conflicts with your preferences.',
        severity: 'high',
        sourceDetails: {
          preferenceType: 'avoidAnimalTesting',
        },
      });
    }
  }

  // 2.2 Forced/child labour preference — surfaced via Ethics pillar KTC banner (same source) when applicable

  // 2.3 Palm Oil Preference
  if (userPreferences.environmentalEnabled && userPreferences.avoidPalmOil) {
    const palmOilStatus = product.ingredients_analysis?.['en:palm-oil'];
    if (palmOilStatus === 'yes' || palmOilStatus === 'maybe') {
      const palmOilAnalysis = product.palm_oil_analysis;
      const isUnsustainable = palmOilAnalysis?.isNonSustainable === true;
      
      if (isUnsustainable) {
        alerts.push({
          id: `user-pref-palm-oil-${product.barcode}`,
          source: 'user_preference',
          category: 'palm_oil',
          signalClass: 'C',
          dedupeKey: `preference:palm_oil:${product.barcode}`,
          title: 'Unsustainable Palm Oil Detected',
          message: 'This product contains palm oil that may not be sustainably sourced, which conflicts with your preferences.',
          severity: 'medium',
          sourceDetails: {
            preferenceType: 'avoidPalmOil',
          },
        });
      }
    }
  }

  // 2.4 Geopolitical Preferences
  if (userPreferences.geopoliticalEnabled) {
    const brands = extractAllBrands(product);
    const brandData = brands.length > 0 ? getBrandData(brands[0]) : null;
    
    if (brandData) {
      // Israel/Palestine preference
      if (userPreferences.israelPalestine === 'avoid_israel') {
        const isIsraelLinked = brandData.countryOfOrigin?.some(c => 
          c === 'IL' || c.toLowerCase().includes('israel')
        );
        if (isIsraelLinked) {
          alerts.push({
            id: `user-pref-israel-${product.barcode}`,
            source: 'user_preference',
            category: 'geopolitical',
            signalClass: 'C',
            dedupeKey: `preference:geopolitical:israel:${product.barcode}`,
            title: 'Israel-Linked Product',
            message: 'This product/brand is linked to Israel, which conflicts with your preferences.',
            severity: 'medium',
            sourceDetails: {
              preferenceType: 'avoid_israel',
            },
          });
        }
      } else if (userPreferences.israelPalestine === 'avoid_palestine') {
        const isPalestineLinked = brandData.countryOfOrigin?.some(c => 
          c === 'PS' || c.toLowerCase().includes('palestine')
        );
        if (isPalestineLinked) {
          alerts.push({
            id: `user-pref-palestine-${product.barcode}`,
            source: 'user_preference',
            category: 'geopolitical',
            signalClass: 'C',
            dedupeKey: `preference:geopolitical:palestine:${product.barcode}`,
            title: 'Palestine-Linked Product',
            message: 'This product/brand is linked to Palestine, which conflicts with your preferences.',
            severity: 'medium',
            sourceDetails: {
              preferenceType: 'avoid_palestine',
            },
          });
        }
      }

      // India/China preference
      if (userPreferences.indiaChina === 'avoid_china') {
        const isChinaLinked = brandData.countryOfOrigin?.some(c => 
          c === 'CN' || c.toLowerCase().includes('china')
        );
        if (isChinaLinked) {
          alerts.push({
            id: `user-pref-china-${product.barcode}`,
            source: 'user_preference',
            category: 'geopolitical',
            signalClass: 'C',
            dedupeKey: `preference:geopolitical:china:${product.barcode}`,
            title: 'China-Linked Product',
            message: 'This product/brand is linked to China, which conflicts with your preferences.',
            severity: 'medium',
            sourceDetails: {
              preferenceType: 'avoid_china',
            },
          });
        }
      } else if (userPreferences.indiaChina === 'avoid_india') {
        const isIndiaLinked = brandData.countryOfOrigin?.some(c => 
          c === 'IN' || c.toLowerCase().includes('india')
        );
        if (isIndiaLinked) {
          alerts.push({
            id: `user-pref-india-${product.barcode}`,
            source: 'user_preference',
            category: 'geopolitical',
            signalClass: 'C',
            dedupeKey: `preference:geopolitical:india:${product.barcode}`,
            title: 'India-Linked Product',
            message: 'This product/brand is linked to India, which conflicts with your preferences.',
            severity: 'medium',
            sourceDetails: {
              preferenceType: 'avoid_india',
            },
          });
        }
      }
    }
  }

  // Sort alerts by severity (high > medium > low)
  // Most severe alerts appear first
  const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
  alerts.sort((a, b) => {
    const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    if (severityDiff !== 0) return severityDiff;
    
    // If same severity, prioritize recalls, then animal cruelty, then labor violations
    const categoryOrder = { 'recall': 3, 'animal_cruelty': 2, 'labor_violations': 2, 'palm_oil': 1, 'geopolitical': 1, 'other': 0 };
    return (categoryOrder[b.category] || 0) - (categoryOrder[a.category] || 0);
  });

  return {
    alerts,
    hasAlerts: alerts.length > 0,
    alertCount: alerts.length,
  };
}
