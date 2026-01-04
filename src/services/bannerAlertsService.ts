/**
 * Banner Alerts Service
 * 
 * Collects and generates banner alerts from:
 * 1. APP-generated alerts (recalls, animal cruelty, PETA, Ethical Consumer, HSUS, RSPCA, ASPCA, ALDF, Compassion in World Farming, Buycott, news sources)
 * 2. User Preference alerts (from Values Preferences card)
 * 
 * Note: Banner alerts are SCORING NEUTRAL - they don't affect TruScore calculation.
 * They are informational only, displayed to alert users to potential concerns.
 */

import { Product, ProductWithTrustScore } from '../types/product';
import { BannerAlert, AlertSource, AlertCategory, BannerAlertsData } from '../types/bannerAlerts';
import { ValuesPreferences } from '../store/useValuesStore';
import { checkAnimalCruelty, AnimalCrueltyData } from './animalCrueltyService';
import { checkLaborViolations, LaborViolationData } from './laborViolationsService';
import { extractAllBrands } from '../utils/brandExtraction';
import { getBrandData } from '../data/brandDatabase';
import { logger } from '../utils/logger';

/**
 * Generate banner alerts for a product
 * Combines APP-generated alerts and User Preference alerts
 * 
 * NOTE: This function is SYNCHRONOUS and FAST - it only processes data already in the product object.
 * It does NOT make any API calls or web scraping. All async data fetching happens in productService.ts
 * and is non-blocking (with timeouts).
 */
export function generateBannerAlerts(
  product: Product | ProductWithTrustScore,
  userPreferences: ValuesPreferences
): BannerAlertsData {
  const alerts: BannerAlert[] = [];

  // 1. APP-GENERATED ALERTS

  // 1.1 Product Recalls
  // Time-bound: <12 months per spec (changed from 3 months to 12 months)
  if (product.recalls && product.recalls.length > 0) {
    const now = Date.now();
    const twelveMonthsAgo = now - (12 * 30 * 24 * 60 * 60 * 1000);
    
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
      
      // Use recall URL if available, otherwise use agency website
      let actionUrl = highestSeverity.recall.url;
      if (!actionUrl) {
        // Fallback to agency website
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
        id: `recall-${product.barcode}-${Date.now()}`,
        source: 'app',
        category: 'recall',
        title: 'Product Recall',
        message: `${recentRecalls.length} active recall(s) found. ${highestSeverity.recall.reason || 'Safety concern identified.'}`,
        severity,
        timestamp: Date.now(),
        actionUrl,
        sourceDetails: {
          organization,
          recallClassification: highestSeverity.recall.classification === 'Unknown' ? undefined : highestSeverity.recall.classification,
        },
      });
    }
  }

  // 1.2 Animal Cruelty Alerts (from PETA, Ethical Consumer, HSUS, RSPCA, ASPCA, ALDF, Compassion in World Farming, Buycott, X/Reuters)
  // Note: These are for banner alerts only (scoring neutral)
  // Time-bound: <12 months per spec
  const animalCrueltyData = checkAnimalCruelty(product);
  if (animalCrueltyData.hasViolations) {
    // Time-bound filtering: Only show alerts from last 12 months
    const now = Date.now();
    const twelveMonthsAgo = now - (12 * 30 * 24 * 60 * 60 * 1000);
    
    // Check if violation has timestamp within 12 months
    if (animalCrueltyData.timestamp && animalCrueltyData.timestamp < twelveMonthsAgo) {
      // Violation is older than 12 months, skip alert
      logger.debug('[BannerAlerts] Animal cruelty violation older than 12 months, skipping alert');
    } else {
      // Violation is within 12 months or no timestamp (show for safety)
      const sources = animalCrueltyData.sources || [];
    const hasPETA = sources.some(s => s.toLowerCase().includes('peta'));
    const hasEthicalConsumer = sources.some(s => s.toLowerCase().includes('ethical consumer'));
    const hasHSUS = sources.some(s => s.toLowerCase().includes('hsus'));
    const hasRSPCA = sources.some(s => s.toLowerCase().includes('rspca'));
    const hasASPCA = sources.some(s => s.toLowerCase().includes('aspca'));
    const hasALDF = sources.some(s => s.toLowerCase().includes('aldf'));
    const hasCompassion = sources.some(s => s.toLowerCase().includes('compassion'));
    const hasBuycott = sources.some(s => s.toLowerCase().includes('buycott'));
    const hasX = sources.some(s => s.toLowerCase().includes('x') || s.toLowerCase().includes('twitter'));
    const hasReuters = sources.some(s => s.toLowerCase().includes('reuters'));

    const organizations: string[] = [];
    if (hasPETA) organizations.push('PETA');
    if (hasEthicalConsumer) organizations.push('Ethical Consumer');
    if (hasHSUS) organizations.push('HSUS');
    if (hasRSPCA) organizations.push('RSPCA');
    if (hasASPCA) organizations.push('ASPCA');
    if (hasALDF) organizations.push('ALDF');
    if (hasCompassion) organizations.push('Compassion in World Farming');
    if (hasBuycott) organizations.push('Buycott');
    if (hasX) organizations.push('X (Twitter)');
    if (hasReuters) organizations.push('Reuters');

    if (organizations.length > 0) {
      const severity = animalCrueltyData.violationType === 'major' ? 'high' :
                      animalCrueltyData.violationType === 'moderate' ? 'medium' : 'low';

      // Determine action URL based on primary organization
      let actionUrl: string | undefined;
      if (hasPETA) {
        actionUrl = 'https://www.peta.org/';
      } else if (hasHSUS) {
        actionUrl = 'https://www.humanesociety.org/';
      } else if (hasRSPCA) {
        actionUrl = 'https://www.rspca.org.uk/';
      } else if (hasASPCA) {
        actionUrl = 'https://www.aspca.org/';
      } else if (hasEthicalConsumer) {
        actionUrl = 'https://www.ethicalconsumer.org/';
      } else if (hasBuycott) {
        actionUrl = 'https://www.buycott.com/';
      }

      alerts.push({
        id: `animal-cruelty-${product.barcode}-${Date.now()}`,
        source: 'app',
        category: 'animal_cruelty',
        title: 'Animal Cruelty Concerns',
        message: `Recent cruelty concerns reported by ${organizations.join(', ')}. Check sources for details.`,
        severity,
        timestamp: Date.now(),
        actionUrl,
        sourceDetails: {
          organization: organizations.join(', '),
        },
      });
    }
    }
  }

  // 1.3 Labor Violations Alerts (from DOL, Walk Free, Oxfam, ILO, Buycott, X/Reuters)
  // Time-bound: <12 months per spec
  const laborViolationData = checkLaborViolations(product);
  if (laborViolationData.hasViolations) {
    // Time-bound filtering: Only show alerts from last 12 months
    const now = Date.now();
    const twelveMonthsAgo = now - (12 * 30 * 24 * 60 * 60 * 1000);
    
    // Check if violation has timestamp within 12 months
    if (laborViolationData.timestamp && laborViolationData.timestamp < twelveMonthsAgo) {
      // Violation is older than 12 months, skip alert
      logger.debug('[BannerAlerts] Labor violation older than 12 months, skipping alert');
    } else {
      // Violation is within 12 months or no timestamp (show for safety)
      const sources = laborViolationData.sources || [];
    const hasDOL = sources.some(s => s.toLowerCase().includes('dol') || s.toLowerCase().includes('department of labor'));
    const hasWalkFree = sources.some(s => s.toLowerCase().includes('walk free'));
    const hasOxfam = sources.some(s => s.toLowerCase().includes('oxfam'));
    const hasILO = sources.some(s => s.toLowerCase().includes('ilo'));
    const hasBuycott = sources.some(s => s.toLowerCase().includes('buycott'));
    const hasX = sources.some(s => s.toLowerCase().includes('x') || s.toLowerCase().includes('twitter'));
    const hasReuters = sources.some(s => s.toLowerCase().includes('reuters'));

    const organizations: string[] = [];
    if (hasDOL) organizations.push('DOL');
    if (hasWalkFree) organizations.push('Walk Free');
    if (hasOxfam) organizations.push('Oxfam');
    if (hasILO) organizations.push('ILO');
    if (hasBuycott) organizations.push('Buycott');
    if (hasX) organizations.push('X (Twitter)');
    if (hasReuters) organizations.push('Reuters');

    if (organizations.length > 0) {
      const severity = laborViolationData.violationType === 'major' ? 'high' :
                      laborViolationData.violationType === 'moderate' ? 'medium' : 'low';

      // Determine action URL based on primary organization (prioritize DOL)
      let actionUrl: string | undefined;
      if (hasDOL) {
        actionUrl = 'https://www.dol.gov/general/topic/youthlabor';
      } else if (hasWalkFree) {
        actionUrl = 'https://www.walkfree.org/';
      } else if (hasOxfam) {
        actionUrl = 'https://www.oxfam.org/en/what-we-do/work/labour-rights';
      } else if (hasILO) {
        actionUrl = 'https://www.ilo.org/global/lang--en/index.htm';
      } else if (hasBuycott) {
        actionUrl = 'https://www.buycott.com/';
      }

      alerts.push({
        id: `labor-violations-${product.barcode}-${Date.now()}`,
        source: 'app',
        category: 'labor_violations',
        title: 'Labor Concerns',
        message: `Labor concerns reported by ${organizations.join(', ')}. Verify sources for details.`,
        severity,
        timestamp: Date.now(),
        actionUrl,
        sourceDetails: {
          organization: organizations.join(', '),
        },
      });
    }
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
        title: 'Animal Testing Detected',
        message: 'This product/brand is known for animal testing, which conflicts with your preferences.',
        severity: 'high',
        sourceDetails: {
          preferenceType: 'avoidAnimalTesting',
        },
      });
    }
  }

  // 2.2 Forced/Child Labor Preference
  if (userPreferences.ethicalEnabled && userPreferences.avoidForcedLabour) {
    const laborViolationData = checkLaborViolations(product);
    if (laborViolationData.hasViolations) {
      alerts.push({
        id: `user-pref-labor-${product.barcode}`,
        source: 'user_preference',
        category: 'labor_violations',
        title: 'Labor Violations Detected',
        message: 'This product/brand has labor concerns that conflict with your preferences.',
        severity: laborViolationData.violationType === 'major' ? 'high' :
                 laborViolationData.violationType === 'moderate' ? 'medium' : 'low',
        sourceDetails: {
          preferenceType: 'avoidForcedLabour',
        },
      });
    }
  }

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
