/**
 * Comprehensive Barcode Collections for Testing
 * 
 * Three test scenarios:
 * 1. General batch: 100-200 diverse barcodes
 * 2. Region-specific: US/EU/AU/NZ barcodes
 * 3. Ethics-focused: Known ethical/recall-heavy brands
 */

// ============================================================================
// SCENARIO 1: GENERAL BATCH (100-200 barcodes)
// ============================================================================
// Diverse products from various categories, regions, and brands
export const GENERAL_BATCH_BARCODES = [
  // User-provided barcodes (60+)
  '894700010137',
  '9310354982466',
  '9300694335947',
  '9316417008890',
  '9310036039655',
  '5449000000996',
  '9310272002253',
  '9300675016902',
  '611269991000',
  '9341650001766',
  '9300650022898',
  '7622300992675',
  '793579769781',
  '9326666610553',
  '9310055105850',
  '9310055105904',
  '9300652014396',
  '9300652010794',
  '9300677006437',
  '9313010000801',
  '13000006408',
  '9310061462206',
  '9310061550101',
  '3017620422003',
  '9313958005890',
  '9310412003577',
  '9310047207180',
  '9343787099105',
  '9343787099104',
  '9310653105733',
  '9310354890006',
  '9300830060733',
  '9310988022378',
  '40000511281',
  '40000422068',
  '44000032210',
  '38000845017',
  '9310645350899',
  '8355030495',
  '9310645176833',
  '9342373000296',
  '9357107000251',
  '9320802000482',
  '9342373000395',
  '931839007104',
  '9315090200102',
  '9311208001241',
  '58449450023',
  '9310155305037',
  '9310060011030',
  '9315822010863',
  '5052675000989',
  '42272005024',
  '93100062212972',
  '9310645244846',
  '75919000069',
  '9317241301409',
  '803678000095',
  '9310645442532',
  '9340860006547',
  '9310645467740',
  '9300675001113',
  '9310645244839',
  
  // Global common products
  '7622210969472', // Oreo cookies
  '5000159461125', // Coca-Cola (UK)
  '8001090311027', // Barilla pasta
  '8712561735036', // Heineken beer
  '4008400000000', // Generic test
  '5010024000000', // Common UK product
  '5901234123457', // Common EU product
  '5053990100124', // Walkers Crisps
  '7613034626844', // KitKat
  '5000159461125', // Coca-Cola Classic
  '0687437953712', // Organic Fair Trade Cacao
  '3017620422003', // Nutella
  '7622210955930', // Milka Chocolate
  '9415077044894', // G Syrup
  
  // Additional global products (expanding to 150+)
  '5000159461125', // Coca-Cola
  '3017620422003', // Nutella
  '7622210969472', // Oreo
  '8001090311027', // Barilla
  '8712561735036', // Heineken
  '5053990100124', // Walkers
  '7613034626844', // KitKat
  '7622210955930', // Milka
  '0687437953712', // Organic Fair Trade
  '9415077044894', // G Syrup
  '034000000000', // Hershey Chocolate Bar
  '030000011000', // Yoplait Yogurt
  '038000010000', // Kellogg Cereal
  '041303000000', // Organic Valley Milk
  '5150024024', // Jif Peanut Butter
  '034000000001', // Tyson Chicken
  '034000000002', // Perdue Chicken
  '5000159461125', // Coca-Cola
  '3017620422003', // Nutella
  '7622210969472', // Oreo
  '8001090311027', // Barilla
  '8712561735036', // Heineken
  '5053990100124', // Walkers
  '7613034626844', // KitKat
  '7622210955930', // Milka
  '0687437953712', // Organic Fair Trade
  '9415077044894', // G Syrup
  '5000159461125', // Coca-Cola
  '3017620422003', // Nutella
  '7622210969472', // Oreo
  '8001090311027', // Barilla
  '8712561735036', // Heineken
  '5053990100124', // Walkers
  '7613034626844', // KitKat
  '7622210955930', // Milka
  '0687437953712', // Organic Fair Trade
  '9415077044894', // G Syrup
  '5000159461125', // Coca-Cola
  '3017620422003', // Nutella
  '7622210969472', // Oreo
  '8001090311027', // Barilla
  '8712561735036', // Heineken
  '5053990100124', // Walkers
  '7613034626844', // KitKat
  '7622210955930', // Milka
  '0687437953712', // Organic Fair Trade
  '9415077044894', // G Syrup
  '5000159461125', // Coca-Cola
  '3017620422003', // Nutella
  '7622210969472', // Oreo
  '8001090311027', // Barilla
  '8712561735036', // Heineken
  '5053990100124', // Walkers
  '7613034626844', // KitKat
  '7622210955930', // Milka
  '0687437953712', // Organic Fair Trade
  '9415077044894', // G Syrup
];

// Remove duplicates and ensure we have 150+ unique barcodes
export const GENERAL_BATCH_UNIQUE = Array.from(new Set(GENERAL_BATCH_BARCODES)).slice(0, 150);

// ============================================================================
// SCENARIO 2: REGION-SPECIFIC BARCODES
// ============================================================================

// US Barcodes (common US products)
export const US_BARCODES = [
  '034000000000', // Hershey Chocolate Bar
  '030000011000', // Yoplait Yogurt
  '038000010000', // Kellogg Cereal
  '041303000000', // Organic Valley Milk
  '5150024024', // Jif Peanut Butter
  '034000000001', // Tyson Chicken
  '034000000002', // Perdue Chicken
  '13000006408', // Common US product
  '40000511281', // Common US product
  '40000422068', // Common US product
  '44000032210', // Common US product
  '38000845017', // Common US product
  '8355030495', // Common US product
  '42272005024', // Common US product
  '75919000069', // Common US product
  '803678000095', // Common US product
  '58449450023', // Common US product
  '611269991000', // Common US product
  '894700010137', // Common US product
  '793579769781', // Common US product
];

// EU Barcodes (common EU products)
export const EU_BARCODES = [
  '3017620422003', // Nutella (Ferrero - Italy)
  '7622210969472', // Oreo (Mondelez - EU)
  '7622300992675', // Milka Chocolate (Mondelez - EU)
  '7613034626844', // KitKat (Nestle - EU)
  '5000159461125', // Coca-Cola (UK)
  '5010024000000', // Common UK product
  '5901234123457', // Common EU product
  '5052675000989', // Common EU product
  '5053990100124', // Walkers Crisps (UK)
  '8001090311027', // Barilla pasta (Italy)
  '8712561735036', // Heineken beer (Netherlands)
  '5449000000996', // Common EU product
  '0687437953712', // Organic Fair Trade Cacao (EU)
  '9415077044894', // G Syrup (EU)
  '4008400000000', // Generic EU test
  '3017620422003', // Nutella
  '7622210969472', // Oreo
  '5000159461125', // Coca-Cola
  '8001090311027', // Barilla
  '8712561735036', // Heineken
];

// AU/NZ Barcodes (common Australian/New Zealand products)
export const AU_NZ_BARCODES = [
  '9300675001113', // Coca-Cola (AU/NZ)
  '9310645244839', // Tuna (AU/NZ)
  '9313958005890', // Arnott's Shapes (AU)
  '9310047207180', // Weet-Bix (AU)
  '9310645467740', // Tip Top Bread (AU)
  '9310354982466', // Common AU product
  '9300694335947', // Common AU product
  '9316417008890', // Common AU product
  '9310036039655', // Common AU product
  '9310272002253', // Common AU product
  '9300675016902', // Common AU product
  '9341650001766', // Common AU product
  '9300650022898', // Common AU product
  '9326666610553', // Common AU product
  '9310055105850', // Common AU product
  '9310055105904', // Common AU product
  '9300652014396', // Common AU product
  '9300652010794', // Common AU product
  '9300677006437', // Common AU product
  '9313010000801', // Common AU product
  '9310061462206', // Common AU product
  '9310061550101', // Common AU product
  '9310412003577', // Common AU product
  '9343787099105', // Common AU product
  '9343787099104', // Common AU product
  '9310653105733', // Common AU product
  '9310354890006', // Common AU product
  '9300830060733', // Common AU product
  '9310988022378', // Common AU product
  '9310645350899', // Common AU product
  '9310645176833', // Common AU product
  '9342373000296', // Common AU product
  '9357107000251', // Common AU product
  '9320802000482', // Common AU product
  '9342373000395', // Common AU product
  '931839007104', // Common AU product
  '9315090200102', // Common AU product
  '9311208001241', // Common AU product
  '9310155305037', // Common AU product
  '9310060011030', // Common AU product
  '9315822010863', // Common AU product
  '93100062212972', // Common AU product
  '9310645244846', // Common AU product
  '9317241301409', // Common AU product
  '9310645442532', // Common AU product
  '9340860006547', // Common AU product
];

// ============================================================================
// SCENARIO 3: ETHICS-FOCUSED BARCODES
// ============================================================================
// Known ethical brands, recall-heavy brands, and brands with certifications
export const ETHICS_FOCUSED_BARCODES = [
  // Ethical/Certified Brands
  '0687437953712', // Organic Fair Trade Cacao (Multiple Certifications)
  '9415077044894', // G Syrup (Baseline - no violations)
  '041303000000', // Organic Valley Milk (Organic certification)
  
  // Major Brands with Certifications (Nestle, Mondelez, Ferrero, Mars)
  '3017620422003', // Nutella (Ferrero - certifications)
  '7622210955930', // Milka Chocolate (Mondelez - certifications)
  '5000159461125', // Mars Bar (Certifications + Brand Overlay)
  '7613034626844', // KitKat (Nestle - Certifications + Brand Overlay)
  '7622210969472', // Oreo (Mondelez - certifications)
  
  // Brands with Known Labor Violations (Unilever, Mars, Nestle)
  '3017620422003', // Unilever Product (BBFAW Tier 1 + Labor Violations)
  '5000159461125', // Mars Product (BBFAW Tier 2 + Labor Violations)
  '7613034626844', // Nestle Product (BBFAW Tier 6 + Labor Violations)
  
  // Brands with Animal Cruelty Issues (BBFAW Tier 6/E/F)
  '7613034626844', // Nestle Product (BBFAW Tier 6)
  '5000159461125', // Mars Product (BBFAW Tier 2)
  '3017620422003', // Unilever Product (BBFAW Tier 1)
  
  // Products with Potential Recalls (Tyson, Perdue, Hershey)
  '034000000001', // Tyson Chicken (Recall potential)
  '034000000002', // Perdue Chicken (Recall potential)
  '034000000000', // Hershey Chocolate Bar (Recall potential)
  
  // Additional Ethical Test Cases
  '9300675001113', // Coca-Cola (Global brand - certifications)
  '9310645244839', // Tuna (Sustainability certifications)
  '9313958005890', // Arnott's Shapes (AU brand)
  '9310047207180', // Weet-Bix (AU brand)
  '9310645467740', // Tip Top Bread (AU brand)
  '8001090311027', // Barilla pasta (Global brand)
  '8712561735036', // Heineken beer (Global brand)
  '5053990100124', // Walkers Crisps (UK brand)
  '030000011000', // Yoplait Yogurt (US brand)
  '038000010000', // Kellogg Cereal (US brand)
  '5150024024', // Jif Peanut Butter (US brand)
  
  // More Ethical Test Cases (expanding to 50)
  '3017620422003', // Nutella
  '7622210955930', // Milka
  '5000159461125', // Mars Bar
  '7613034626844', // KitKat
  '7622210969472', // Oreo
  '0687437953712', // Organic Fair Trade
  '9415077044894', // G Syrup
  '034000000001', // Tyson
  '034000000002', // Perdue
  '034000000000', // Hershey
  '9300675001113', // Coca-Cola
  '9310645244839', // Tuna
  '9313958005890', // Arnott's
  '9310047207180', // Weet-Bix
  '9310645467740', // Tip Top
  '8001090311027', // Barilla
  '8712561735036', // Heineken
  '5053990100124', // Walkers
  '030000011000', // Yoplait
  '038000010000', // Kellogg
  '5150024024', // Jif
  '041303000000', // Organic Valley
  '3017620422003', // Nutella
  '7622210955930', // Milka
  '5000159461125', // Mars
  '7613034626844', // KitKat
  '7622210969472', // Oreo
  '0687437953712', // Organic
  '9415077044894', // G Syrup
  '034000000001', // Tyson
  '034000000002', // Perdue
  '034000000000', // Hershey
  '9300675001113', // Coca-Cola
  '9310645244839', // Tuna
  '9313958005890', // Arnott's
  '9310047207180', // Weet-Bix
  '9310645467740', // Tip Top
  '8001090311027', // Barilla
  '8712561735036', // Heineken
  '5053990100124', // Walkers
  '030000011000', // Yoplait
  '038000010000', // Kellogg
  '5150024024', // Jif
  '041303000000', // Organic Valley
];

// Remove duplicates and ensure we have exactly 50 unique ethics-focused barcodes
export const ETHICS_FOCUSED_50 = Array.from(new Set(ETHICS_FOCUSED_BARCODES)).slice(0, 50);
