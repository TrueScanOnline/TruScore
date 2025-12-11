// CSV Database Service Layer
// Provides unified interface for querying CSV-based environmental and sustainability databases
// Used for PLANET Pillar scoring when primary data sources (OFF) are unavailable

import { logger } from '../../utils/logger';

/**
 * Base interface for CSV database entries
 */
export interface CSVDatabaseEntry {
  [key: string]: string | number | undefined;
}

/**
 * CSV Database Service
 * Loads and queries CSV databases for environmental/sustainability data
 */
export class CSVDatabaseService {
  private databases: Map<string, CSVDatabaseEntry[]> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize all CSV databases
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Load all CSV databases in parallel
      await Promise.all([
        this.loadEWGDirtyDozen(),
        this.loadRSPOCertified(),
        this.loadIdematEcoCost(),
        this.loadFAOCropData(),
        this.loadUSDAPDP(),
        this.loadAgribalyseFallback(),
      ]);

      this.initialized = true;
      logger.debug('[CSVDatabaseService] All databases initialized');
    } catch (error) {
      logger.error('[CSVDatabaseService] Error initializing databases:', error);
      throw error;
    }
  }

  /**
   * Load EWG Dirty Dozen database
   * List of crops with highest pesticide residues
   * Expanded list based on EWG's annual reports
   */
  private async loadEWGDirtyDozen(): Promise<void> {
    // EWG Dirty Dozen 2024 (expanded - includes Clean Fifteen for comparison)
    const dirtyDozen: CSVDatabaseEntry[] = [
      // Dirty Dozen (high pesticide residue)
      { crop: 'strawberries', rank: 1, pesticideCount: 9, category: 'dirty_dozen' },
      { crop: 'spinach', rank: 2, pesticideCount: 8, category: 'dirty_dozen' },
      { crop: 'kale', rank: 3, pesticideCount: 5, category: 'dirty_dozen' },
      { crop: 'collard greens', rank: 4, pesticideCount: 5, category: 'dirty_dozen' },
      { crop: 'mustard greens', rank: 5, pesticideCount: 5, category: 'dirty_dozen' },
      { crop: 'peaches', rank: 6, pesticideCount: 4, category: 'dirty_dozen' },
      { crop: 'pears', rank: 7, pesticideCount: 4, category: 'dirty_dozen' },
      { crop: 'nectarines', rank: 8, pesticideCount: 4, category: 'dirty_dozen' },
      { crop: 'apples', rank: 9, pesticideCount: 4, category: 'dirty_dozen' },
      { crop: 'bell peppers', rank: 10, pesticideCount: 4, category: 'dirty_dozen' },
      { crop: 'hot peppers', rank: 11, pesticideCount: 4, category: 'dirty_dozen' },
      { crop: 'cherries', rank: 12, pesticideCount: 4, category: 'dirty_dozen' },
      { crop: 'blueberries', rank: 13, pesticideCount: 4, category: 'dirty_dozen' },
      { crop: 'green beans', rank: 14, pesticideCount: 4, category: 'dirty_dozen' },
      // Note: Only the official "Dirty Dozen" (top 14) are included
      // Additional crops like grapes, celery, tomatoes, potatoes are NOT in the official list
      // and should NOT trigger high-impact detection (they may have some residue but not enough)
    ];

    this.databases.set('ewg_dirty_dozen', dirtyDozen);
    logger.debug(`[CSVDatabaseService] Loaded EWG Dirty Dozen: ${dirtyDozen.length} crops`);
  }

  /**
   * Load RSPO Certified database
   * Brands/companies with RSPO certification
   * Expanded list based on RSPO member directory
   */
  private async loadRSPOCertified(): Promise<void> {
    // RSPO Certified brands (expanded - known certified companies from RSPO member directory)
    // This can be expanded with full RSPO CSV when available
    const rspoCertified: CSVDatabaseEntry[] = [
      // Major CPG companies
      { brand: 'unilever', certified: 'true', rspoType: 'mass_balance', commitment: 'high' },
      { brand: 'nestle', certified: 'true', rspoType: 'mass_balance', commitment: 'high' },
      { brand: 'pepsico', certified: 'true', rspoType: 'segregated', commitment: 'high' },
      { brand: 'coca-cola', certified: 'true', rspoType: 'segregated', commitment: 'high' },
      { brand: 'mars', certified: 'true', rspoType: 'mass_balance', commitment: 'high' },
      { brand: 'mondelēz', certified: 'true', rspoType: 'mass_balance', commitment: 'high' },
      { brand: 'kellogg', certified: 'true', rspoType: 'mass_balance', commitment: 'high' },
      { brand: 'general mills', certified: 'true', rspoType: 'mass_balance', commitment: 'medium' },
      { brand: 'procter & gamble', certified: 'true', rspoType: 'mass_balance', commitment: 'medium' },
      { brand: 'johnson & johnson', certified: 'true', rspoType: 'mass_balance', commitment: 'medium' },
      { brand: 'l\'oréal', certified: 'true', rspoType: 'segregated', commitment: 'high' },
      { brand: 'henkel', certified: 'true', rspoType: 'mass_balance', commitment: 'medium' },
      { brand: 'colgate-palmolive', certified: 'true', rspoType: 'mass_balance', commitment: 'medium' },
      { brand: 'reckitt', certified: 'true', rspoType: 'mass_balance', commitment: 'medium' },
      { brand: 'danone', certified: 'true', rspoType: 'mass_balance', commitment: 'high' },
      // Additional RSPO members
      { brand: 'frieslandcampina', certified: 'true', rspoType: 'mass_balance', commitment: 'medium' },
      { brand: 'friesland campina', certified: 'true', rspoType: 'mass_balance', commitment: 'medium' },
      { brand: 'arche', certified: 'true', rspoType: 'mass_balance', commitment: 'medium' },
      { brand: 'barry callebaut', certified: 'true', rspoType: 'segregated', commitment: 'high' },
      { brand: 'cargill', certified: 'true', rspoType: 'mass_balance', commitment: 'high' },
      { brand: 'bunge', certified: 'true', rspoType: 'mass_balance', commitment: 'medium' },
      { brand: 'adm', certified: 'true', rspoType: 'mass_balance', commitment: 'medium' },
      { brand: 'wilmar', certified: 'true', rspoType: 'mass_balance', commitment: 'high' },
      { brand: 'sime darby', certified: 'true', rspoType: 'mass_balance', commitment: 'medium' },
      { brand: 'ioi', certified: 'true', rspoType: 'mass_balance', commitment: 'medium' },
      { brand: 'musim mas', certified: 'true', rspoType: 'mass_balance', commitment: 'high' },
      { brand: 'golden agri-resources', certified: 'true', rspoType: 'mass_balance', commitment: 'medium' },
      { brand: 'golden agri', certified: 'true', rspoType: 'mass_balance', commitment: 'medium' },
    ];

    this.databases.set('rspo_certified', rspoCertified);
    logger.debug(`[CSVDatabaseService] Loaded RSPO Certified: ${rspoCertified.length} brands`);
  }

  /**
   * Load Idemat Eco-Cost database
   * Material eco-cost factors for packaging
   * Expanded with more materials based on Idemat database
   */
  private async loadIdematEcoCost(): Promise<void> {
    // Idemat eco-cost factors (expanded - common packaging materials)
    // Based on Idemat material database (eco-cost in points)
    // High eco-cost materials (>100 eco-cost points)
    const idematEcoCost: CSVDatabaseEntry[] = [
      // Very high eco-cost (>150)
      { material: 'copper', ecoCost: 200, category: 'very_high' },
      { material: 'aluminum', ecoCost: 150, category: 'very_high' },
      { material: 'polycarbonate', ecoCost: 140, category: 'very_high' },
      { material: 'expanded polystyrene', ecoCost: 130, category: 'very_high' },
      // High eco-cost (100-150)
      { material: 'steel', ecoCost: 120, category: 'high' },
      { material: 'pvc', ecoCost: 110, category: 'high' },
      { material: 'polystyrene', ecoCost: 105, category: 'high' },
      { material: 'abs', ecoCost: 100, category: 'high' },
      // Medium eco-cost (50-100)
      { material: 'glass', ecoCost: 80, category: 'medium' },
      { material: 'pet', ecoCost: 60, category: 'medium' },
      { material: 'hdpe', ecoCost: 55, category: 'medium' },
      { material: 'ldpe', ecoCost: 50, category: 'medium' },
      // Low eco-cost (<50)
      { material: 'pp', ecoCost: 45, category: 'low' },
      { material: 'polypropylene', ecoCost: 45, category: 'low' },
      { material: 'cardboard', ecoCost: 30, category: 'low' },
      { material: 'paper', ecoCost: 25, category: 'low' },
      { material: 'biodegradable plastic', ecoCost: 40, category: 'low' },
      { material: 'compostable', ecoCost: 35, category: 'low' },
    ];

    this.databases.set('idemat_ecocost', idematEcoCost);
    logger.debug(`[CSVDatabaseService] Loaded Idemat Eco-Cost: ${idematEcoCost.length} materials`);
  }

  /**
   * Load FAO Crop Data
   * Water usage, carbon footprint, land use by crop
   * Expanded with more crops based on FAO FAOSTAT data
   */
  private async loadFAOCropData(): Promise<void> {
    // FAO crop data (expanded - common crops with environmental impact data)
    // Based on FAO FAOSTAT and research data
    // Full FAO FAOSTAT CSV can be loaded when available
    const faoCropData: CSVDatabaseEntry[] = [
      // High water usage crops (>5000 L/kg)
      { crop: 'rice', waterUsage: 2500, carbonFootprint: 4.0, landUse: 2.8, category: 'high' },
      { crop: 'cotton', waterUsage: 10000, carbonFootprint: 2.5, landUse: 1.5, category: 'high' },
      { crop: 'sugar cane', waterUsage: 1500, carbonFootprint: 0.5, landUse: 0.8, category: 'high' },
      { crop: 'coffee', waterUsage: 21000, carbonFootprint: 15.0, landUse: 0.3, category: 'high' },
      { crop: 'cocoa', waterUsage: 27000, carbonFootprint: 2.9, landUse: 0.2, category: 'high' },
      { crop: 'almonds', waterUsage: 8000, carbonFootprint: 2.3, landUse: 0.5, category: 'high' },
      { crop: 'walnuts', waterUsage: 9000, carbonFootprint: 2.0, landUse: 0.4, category: 'high' },
      { crop: 'pistachios', waterUsage: 8500, carbonFootprint: 2.1, landUse: 0.4, category: 'high' },
      { crop: 'avocados', waterUsage: 2000, carbonFootprint: 2.5, landUse: 0.3, category: 'high' },
      // Medium water usage crops (2000-5000 L/kg)
      { crop: 'wheat', waterUsage: 1800, carbonFootprint: 1.4, landUse: 1.2, category: 'medium' },
      { crop: 'corn', waterUsage: 900, carbonFootprint: 1.0, landUse: 0.8, category: 'medium' },
      { crop: 'soybeans', waterUsage: 2145, carbonFootprint: 2.0, landUse: 0.5, category: 'medium' },
      { crop: 'barley', waterUsage: 1400, carbonFootprint: 1.2, landUse: 1.0, category: 'medium' },
      { crop: 'oats', waterUsage: 1500, carbonFootprint: 1.3, landUse: 1.1, category: 'medium' },
      { crop: 'sugar beets', waterUsage: 800, carbonFootprint: 0.4, landUse: 0.6, category: 'medium' },
      { crop: 'sunflower', waterUsage: 2000, carbonFootprint: 1.8, landUse: 0.7, category: 'medium' },
      { crop: 'rapeseed', waterUsage: 1800, carbonFootprint: 1.6, landUse: 0.6, category: 'medium' },
      // Low water usage crops (<2000 L/kg)
      { crop: 'potatoes', waterUsage: 287, carbonFootprint: 0.2, landUse: 0.2, category: 'low' },
      { crop: 'tomatoes', waterUsage: 214, carbonFootprint: 2.2, landUse: 0.2, category: 'low' },
      { crop: 'lettuce', waterUsage: 237, carbonFootprint: 0.4, landUse: 0.1, category: 'low' },
      { crop: 'carrots', waterUsage: 131, carbonFootprint: 0.4, landUse: 0.1, category: 'low' },
      { crop: 'onions', waterUsage: 180, carbonFootprint: 0.5, landUse: 0.1, category: 'low' },
      { crop: 'cucumbers', waterUsage: 237, carbonFootprint: 2.0, landUse: 0.1, category: 'low' },
      { crop: 'peppers', waterUsage: 287, carbonFootprint: 2.0, landUse: 0.1, category: 'low' },
      { crop: 'broccoli', waterUsage: 285, carbonFootprint: 2.0, landUse: 0.1, category: 'low' },
      { crop: 'cabbage', waterUsage: 237, carbonFootprint: 0.3, landUse: 0.1, category: 'low' },
      { crop: 'cauliflower', waterUsage: 285, carbonFootprint: 1.6, landUse: 0.1, category: 'low' },
    ];

    this.databases.set('fao_crop_data', faoCropData);
    logger.debug(`[CSVDatabaseService] Loaded FAO Crop Data: ${faoCropData.length} crops`);
  }

  /**
   * Load USDA PDP (Pesticide Data Program) database
   * Pesticide residue data by crop
   * Expanded with more crops from USDA PDP reports
   */
  private async loadUSDAPDP(): Promise<void> {
    // USDA PDP data (expanded - high residue crops from USDA Pesticide Data Program)
    // Based on USDA PDP annual reports
    // Full USDA PDP CSV can be loaded when available
    const usdaPDP: CSVDatabaseEntry[] = [
      // Very high residue (8+ pesticides)
      { crop: 'strawberries', residueLevel: 'very_high', pesticideCount: 9 },
      { crop: 'spinach', residueLevel: 'very_high', pesticideCount: 8 },
      // High residue (4-7 pesticides)
      { crop: 'kale', residueLevel: 'high', pesticideCount: 5 },
      { crop: 'collard greens', residueLevel: 'high', pesticideCount: 5 },
      { crop: 'mustard greens', residueLevel: 'high', pesticideCount: 5 },
      { crop: 'peaches', residueLevel: 'high', pesticideCount: 4 },
      { crop: 'pears', residueLevel: 'high', pesticideCount: 4 },
      { crop: 'nectarines', residueLevel: 'high', pesticideCount: 4 },
      { crop: 'apples', residueLevel: 'high', pesticideCount: 4 },
      { crop: 'bell peppers', residueLevel: 'high', pesticideCount: 4 },
      { crop: 'cherries', residueLevel: 'high', pesticideCount: 4 },
      { crop: 'blueberries', residueLevel: 'high', pesticideCount: 4 },
      { crop: 'green beans', residueLevel: 'high', pesticideCount: 4 },
      // Note: Medium-high residue crops (grapes, celery, tomatoes, potatoes, etc.)
      // are NOT included here as they don't trigger high-impact detection
      // Only 'high' and 'very_high' residue levels are considered high-impact
    ];

    this.databases.set('usda_pdp', usdaPDP);
    logger.debug(`[CSVDatabaseService] Loaded USDA PDP: ${usdaPDP.length} crops`);
  }

  /**
   * Load Agribalyse fallback database
   * Carbon footprint data for Eco-Score fallback
   */
  private async loadAgribalyseFallback(): Promise<void> {
    // Agribalyse carbon factors (simplified - common food categories)
    // Used as fallback when Eco-Score is missing from OFF
    // High carbon (>5 kg CO2eq/kg)
    const agribalyseFallback: CSVDatabaseEntry[] = [
      // Very high carbon (>10)
      { category: 'beef', co2eq: 27.0, impactLevel: 'very_high' },
      { category: 'lamb', co2eq: 39.2, impactLevel: 'very_high' },
      { category: 'cheese', co2eq: 13.5, impactLevel: 'very_high' },
      // High carbon (5-10)
      { category: 'pork', co2eq: 12.1, impactLevel: 'high' },
      { category: 'poultry', co2eq: 6.9, impactLevel: 'high' },
      { category: 'fish', co2eq: 6.1, impactLevel: 'high' },
      { category: 'eggs', co2eq: 4.2, impactLevel: 'high' },
      { category: 'coffee', co2eq: 15.0, impactLevel: 'high' },
      { category: 'chocolate', co2eq: 19.0, impactLevel: 'high' },
      // Medium carbon (2-5)
      { category: 'rice', co2eq: 4.0, impactLevel: 'medium' },
      { category: 'bread', co2eq: 1.4, impactLevel: 'medium' },
      { category: 'pasta', co2eq: 1.5, impactLevel: 'medium' },
      // Low carbon (<2)
      { category: 'vegetables', co2eq: 0.4, impactLevel: 'low' },
      { category: 'fruits', co2eq: 0.4, impactLevel: 'low' },
      { category: 'legumes', co2eq: 0.9, impactLevel: 'low' },
    ];

    this.databases.set('agribalyse_fallback', agribalyseFallback);
    logger.debug(`[CSVDatabaseService] Loaded Agribalyse Fallback: ${agribalyseFallback.length} categories`);
  }

  /**
   * Query EWG Dirty Dozen database
   */
  queryEWGDirtyDozen(cropName: string): CSVDatabaseEntry | null {
    const db = this.databases.get('ewg_dirty_dozen');
    if (!db) return null;

    const normalized = cropName.toLowerCase().trim();
    return db.find(entry => {
      const crop = String(entry.crop || '').toLowerCase();
      return crop === normalized || normalized.includes(crop) || crop.includes(normalized);
    }) || null;
  }

  /**
   * Query RSPO Certified database
   */
  queryRSPOCertified(brandName: string): CSVDatabaseEntry | null {
    const db = this.databases.get('rspo_certified');
    if (!db) return null;

    const normalized = brandName.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    return db.find(entry => {
      const brand = String(entry.brand || '').toLowerCase();
      return brand === normalized || normalized.includes(brand) || brand.includes(normalized);
    }) || null;
  }

  /**
   * Query Idemat Eco-Cost database
   */
  queryIdematEcoCost(materialName: string): CSVDatabaseEntry | null {
    const db = this.databases.get('idemat_ecocost');
    if (!db) return null;

    const normalized = materialName.toLowerCase().trim();
    return db.find(entry => {
      const material = String(entry.material || '').toLowerCase();
      return normalized.includes(material) || material.includes(normalized);
    }) || null;
  }

  /**
   * Query FAO Crop Data
   */
  queryFAOCropData(cropName: string): CSVDatabaseEntry | null {
    const db = this.databases.get('fao_crop_data');
    if (!db) return null;

    const normalized = cropName.toLowerCase().trim();
    return db.find(entry => {
      const crop = String(entry.crop || '').toLowerCase();
      return crop === normalized || normalized.includes(crop) || crop.includes(normalized);
    }) || null;
  }

  /**
   * Query USDA PDP database
   */
  queryUSDAPDP(cropName: string): CSVDatabaseEntry | null {
    const db = this.databases.get('usda_pdp');
    if (!db) return null;

    const normalized = cropName.toLowerCase().trim();
    return db.find(entry => {
      const crop = String(entry.crop || '').toLowerCase();
      return crop === normalized || normalized.includes(crop) || crop.includes(normalized);
    }) || null;
  }

  /**
   * Check if a crop is in EWG Dirty Dozen (high pesticide residue)
   */
  isDirtyDozenCrop(cropName: string): boolean {
    return this.queryEWGDirtyDozen(cropName) !== null;
  }

  /**
   * Check if a brand is RSPO certified
   */
  isRSPOCertified(brandName: string): boolean {
    const result = this.queryRSPOCertified(brandName);
    if (!result) return false;
    const certified = result.certified;
    // Handle string, number, or boolean values
    if (typeof certified === 'string') {
      return certified === 'true' || certified === '1';
    }
    if (typeof certified === 'number') {
      return certified === 1;
    }
    if (typeof certified === 'boolean') {
      return certified === true;
    }
    return false;
  }

  /**
   * Check if a material has high eco-cost
   */
  isHighEcoCostMaterial(materialName: string): boolean {
    const result = this.queryIdematEcoCost(materialName);
    if (!result) return false;
    const ecoCost = Number(result.ecoCost || 0);
    return ecoCost >= 100; // High eco-cost threshold
  }

  /**
   * Check if a crop has high farming impact
   * 
   * High impact criteria (ALL must be validated):
   * 1. High water usage (>5000 L/kg) - NOT just category='high'
   * 2. OR in EWG Dirty Dozen (verified high pesticide residue)
   * 3. OR high USDA PDP residue (verified high pesticide count)
   * 
   * Note: Category='high' alone is NOT sufficient - need actual high water usage
   */
  hasHighFarmingImpact(cropName: string): boolean {
    const faoData = this.queryFAOCropData(cropName);
    const ewgData = this.queryEWGDirtyDozen(cropName);
    const usdaData = this.queryUSDAPDP(cropName);

    // High impact if:
    // 1. High water usage (>5000 L/kg) - strict threshold for actual high impact
    // 2. In EWG Dirty Dozen (verified high pesticide residue)
    // 3. High USDA PDP residue (verified high pesticide count)
    const highWater = !!(faoData && Number(faoData.waterUsage || 0) > 5000);
    const dirtyDozen = ewgData !== null;
    const highResidue = !!(usdaData && (
      String(usdaData.residueLevel || '').toLowerCase() === 'high' ||
      String(usdaData.residueLevel || '').toLowerCase() === 'very_high'
    ));

    // Only return true if we have VERIFIED high impact (not just category)
    return !!(highWater || dirtyDozen || highResidue);
  }

  /**
   * Query Agribalyse fallback for carbon footprint
   * Used when Eco-Score is missing from OFF
   */
  queryAgribalyseFallback(categoryName: string): CSVDatabaseEntry | null {
    const db = this.databases.get('agribalyse_fallback');
    if (!db) return null;

    const normalized = categoryName.toLowerCase().trim();
    return db.find(entry => {
      const category = String(entry.category || '').toLowerCase();
      return category === normalized || normalized.includes(category) || category.includes(normalized);
    }) || null;
  }

  /**
   * Check if category has high carbon footprint (for Eco-Score fallback)
   */
  hasHighCarbonFootprint(categoryName: string): boolean {
    const result = this.queryAgribalyseFallback(categoryName);
    if (!result) return false;
    const co2eq = Number(result.co2eq || 0);
    return co2eq >= 5; // High carbon threshold (5 kg CO2eq/kg)
  }
}

// Singleton instance
let csvDatabaseService: CSVDatabaseService | null = null;

/**
 * Get CSV Database Service instance
 */
export function getCSVDatabaseService(): CSVDatabaseService {
  if (!csvDatabaseService) {
    csvDatabaseService = new CSVDatabaseService();
  }
  return csvDatabaseService;
}

/**
 * Initialize CSV Database Service
 */
export async function initializeCSVDatabases(): Promise<void> {
  const service = getCSVDatabaseService();
  await service.initialize();
}

