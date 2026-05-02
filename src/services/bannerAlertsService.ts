/**
 * Banner Alerts Service
 *
 * Collects and generates banner alerts from:
 * 1. User preference alerts (from user Alerts tab / alert preferences)
 *
 * Legacy `product.recalls` (FDA/USDA/CFIA/RASFF) and brand “recall history” FDA homepage links are NOT surfaced
 * on the product result screen. Safety/regulatory notices use governed Workstream C `ProductScanResult.signals`
 * with exact `source_record_url` only.
 *
 * BBFAW/KTC: intentionally NOT surfaced as banner / Signal-style alerts — remain in TruScore Ethics pillar
 * calculation and explanation surfaces (e.g. Trust Score modal / pillar breakdown).
 */

import { Product, ProductWithTrustScore } from '../types/product';
import { BannerAlert, BannerAlertsData } from '../types/bannerAlerts';
import { AlertsPreferences } from '../store/useAlertsStore';
import { extractAllBrands } from '../utils/brandExtraction';
import { getBrandData } from '../data/brandDatabase';

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
  /** Reserved for tests / future time-bound banners (recall path removed). */
  _options?: GenerateBannerAlertsOptions
): BannerAlertsData {
  const alerts: BannerAlert[] = [];

  // 1. USER PREFERENCE ALERTS

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
