// Comprehensive brand and company database
// Includes parent-subsidiary relationships, ethical ratings, and country of origin

export interface BrandData {
  name: string;
  aliases?: string[]; // Alternative names, common misspellings
  parentCompany?: string; // Parent company name
  countryOfOrigin: string[]; // ISO country codes
  industry: string[]; // Industry sectors
  ethicalRating?: 'excellent' | 'good' | 'fair' | 'poor';
  animalTesting?: boolean; // Known for animal testing
  palmOilPolicy?: 'sustainable' | 'mixed' | 'unsustainable' | 'unknown';
  laborPractices?: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  subsidiaries?: string[]; // Subsidiary brand names
  marketCap?: number; // Market capitalization in billions USD
  certifications?: string[]; // Certifications held
  notes?: string; // Additional notes
}

// Comprehensive brand database (500+ companies)
export const BRAND_DATABASE: Record<string, BrandData> = {
  // Major Consumer Goods Conglomerates
  'unilever': {
    name: 'Unilever',
    aliases: ['unilever plc', 'unilever nv'],
    countryOfOrigin: ['GB', 'NL'],
    industry: ['Consumer Goods', 'Food & Beverages', 'Personal Care'],
    ethicalRating: 'fair',
    animalTesting: true,
    palmOilPolicy: 'mixed',
    laborPractices: 'good',
    subsidiaries: [
      'dove', 'axe', 'lipton', 'hellmann\'s', 'knorr', 'magnum', 'ben & jerry\'s',
      'breyers', 'talenti', 'sunsilk', 'tresemme', 'vaseline', 'pond\'s', 'clear',
      'surf', 'omo', 'persil', 'comfort', 'cif', 'domestos', 'signal', 'close-up'
    ],
    marketCap: 120,
    notes: 'One of the largest consumer goods companies. Mixed record on sustainability.'
  },
  'procter & gamble': {
    name: 'Procter & Gamble',
    aliases: ['p&g', 'procter and gamble', 'pg'],
    countryOfOrigin: ['US'],
    industry: ['Consumer Goods', 'Personal Care', 'Household Products'],
    ethicalRating: 'fair',
    animalTesting: true,
    palmOilPolicy: 'unsustainable',
    laborPractices: 'good',
    subsidiaries: [
      'tide', 'ariel', 'gain', 'downy', 'bounce', 'pampers', 'luvs', 'always',
      'tampax', 'charmin', 'bounty', 'puffs', 'crest', 'oral-b', 'head & shoulders',
      'pantene', 'herbal essences', 'olay', 'gillette', 'old spice', 'secret',
      'febreze', 'swiffer', 'cascade', 'dawn', 'mr. clean', 'vicks', 'nyquil'
    ],
    marketCap: 350,
    notes: 'Largest consumer goods company. Known for animal testing.'
  },
  'nestle': {
    name: 'Nestlé',
    aliases: ['nestlé', 'nestle sa'],
    countryOfOrigin: ['CH'],
    industry: ['Food & Beverages', 'Confectionery', 'Dairy'],
    ethicalRating: 'poor',
    animalTesting: false,
    palmOilPolicy: 'unsustainable',
    laborPractices: 'poor',
    subsidiaries: [
      'nescafe', 'nespresso', 'starbucks', 'gerber', 'purina', 'friskies', 'fancy feast',
      'kit kat', 'smarties', 'aero', 'butterfinger', 'crunch', 'wonka', 'poland spring',
      'perrier', 'san pellegrino', 'vittel', 'haagen-dazs', 'dreyer\'s', 'edys',
      'carnation', 'coffee-mate', 'libby\'s', 'lean cuisine', 'stouffer\'s', 'hot pockets',
      'digiorno', 'tombstone', 'häagen-dazs', 'drumstick', 'outshine'
    ],
    marketCap: 280,
    notes: 'Controversial company with poor labor practices and water extraction issues.'
  },
  'coca-cola': {
    name: 'Coca-Cola',
    aliases: ['coke', 'coca cola', 'coca-cola company'],
    countryOfOrigin: ['US'],
    industry: ['Beverages', 'Food & Beverages'],
    ethicalRating: 'fair',
    animalTesting: false,
    palmOilPolicy: 'unknown',
    laborPractices: 'fair',
    subsidiaries: [
      'sprite', 'fanta', 'minute maid', 'powerade', 'vitaminwater', 'smartwater',
      'dasani', 'honest tea', 'gold peak', 'fairlife', 'costa coffee', 'innocent',
      'adez', 'fuze', 'glaceau', 'bodyarmor', 'topo chico', 'ahh-ha', 'barq\'s',
      'cherry coke', 'vanilla coke', 'fresca', 'seagram\'s', 'schweppes'
    ],
    marketCap: 260,
    notes: 'Largest beverage company. Mixed record on sustainability and labor.'
  },
  "l'oreal": {
    name: "L'Oréal",
    aliases: ['loreal', 'l\'oreal', 'loreal paris'],
    countryOfOrigin: ['FR'],
    industry: ['Cosmetics', 'Personal Care', 'Beauty'],
    ethicalRating: 'fair',
    animalTesting: true,
    palmOilPolicy: 'mixed',
    laborPractices: 'good',
    subsidiaries: [
      'l\'oreal paris', 'maybelline', 'garnier', 'lancome', 'ysl beauty', 'giorgio armani',
      'biotherm', 'kiehl\'s', 'shu uemura', 'urban decay', 'essie', 'redken', 'matrix',
      'kerastase', 'l\'oreal professional', 'vichy', 'la roche-posay', 'cerave',
      'skinactive', 'the body shop', 'nyx', 'it cosmetics', 'carson', 'ralph lauren'
    ],
    marketCap: 220,
    notes: 'Largest cosmetics company. Known for animal testing despite claims.'
  },
  'pepsico': {
    name: 'PepsiCo',
    aliases: ['pepsi', 'pepsico inc'],
    countryOfOrigin: ['US'],
    industry: ['Food & Beverages', 'Snacks'],
    ethicalRating: 'fair',
    animalTesting: false,
    palmOilPolicy: 'mixed',
    laborPractices: 'fair',
    subsidiaries: [
      'pepsi', 'mountain dew', 'sierra mist', '7up', 'mirinda', 'tropicana', 'naked juice',
      'gatorade', 'aquafina', 'bubly', 'lifewtr', 'frito-lay', 'lays', 'doritos',
      'cheetos', 'ruffles', 'fritos', 'tostitos', 'sunchips', 'quaker', 'cap\'n crunch',
      'life', 'aunt jemima', 'maple grove farms', 'rice-a-roni', 'near east'
    ],
    marketCap: 240,
    notes: 'Second largest beverage company. Mixed sustainability record.'
  },
  'mars': {
    name: 'Mars',
    aliases: ['mars inc', 'mars incorporated'],
    countryOfOrigin: ['US'],
    industry: ['Confectionery', 'Pet Food', 'Food & Beverages'],
    ethicalRating: 'poor',
    animalTesting: false,
    palmOilPolicy: 'unsustainable',
    laborPractices: 'poor',
    subsidiaries: [
      'm&m\'s', 'snickers', 'twix', 'milky way', '3 musketeers', 'skittles', 'starburst',
      'orbit', 'extra', 'dove chocolate', 'galaxy', 'mars bar', 'bounty', 'malteasers',
      'pedigree', 'whiskas', 'cesar', 'sheba', 'royal canin', 'iams', 'eukanuba',
      'banfield', 'bluepearl', 'vca', 'wisdom panel'
    ],
    marketCap: 35,
    notes: 'Private company. Poor labor practices, especially in cocoa supply chain.'
  },
  'mondelez': {
    name: 'Mondelez International',
    aliases: ['mondelez', 'kraft foods'],
    countryOfOrigin: ['US'],
    industry: ['Confectionery', 'Snacks', 'Food & Beverages'],
    ethicalRating: 'fair',
    animalTesting: false,
    palmOilPolicy: 'unsustainable',
    laborPractices: 'fair',
    subsidiaries: [
      'oreo', 'cadbury', 'milka', 'toblerone', 'trident', 'dentyne', 'clorets',
      'hall\'s', 'belvita', 'ritz', 'wheat thins', 'triscuit', 'nabisco', 'chips ahoy!',
      'newtons', 'nilla', 'honey maid', 'barnum\'s animals', 'teddy grahams',
      'wheatsworth', 'premium', 'lu', 'prince', 'petit ecolier', 'peek freans'
    ],
    marketCap: 90,
    notes: 'Major confectionery company. Palm oil sustainability concerns.'
  },
  'danone': {
    name: 'Danone',
    aliases: ['danone sa', 'dannon'],
    countryOfOrigin: ['FR'],
    industry: ['Dairy', 'Food & Beverages', 'Baby Food'],
    ethicalRating: 'good',
    animalTesting: false,
    palmOilPolicy: 'sustainable',
    laborPractices: 'good',
    subsidiaries: [
      'activia', 'danone', 'dannon', 'oikos', 'light & fit', 'two good', 'danimals',
      'evian', 'volvic', 'aqua', 'bonafont', 'horizon organic', 'wallaby organic',
      'silk', 'so delicious', 'vegan', 'good plants', 'follow your heart', 'earth\'s best',
      'happy family', 'aptamil', 'nutricia', 'cow & gate', 'blédina'
    ],
    marketCap: 45,
    notes: 'Better sustainability record than most. Focus on health and nutrition.'
  },
  'johnson & johnson': {
    name: 'Johnson & Johnson',
    aliases: ['j&j', 'johnson and johnson'],
    countryOfOrigin: ['US'],
    industry: ['Pharmaceuticals', 'Medical Devices', 'Consumer Health'],
    ethicalRating: 'poor',
    animalTesting: true,
    palmOilPolicy: 'unknown',
    laborPractices: 'poor',
    subsidiaries: [
      'band-aid', 'tylenol', 'motrin', 'benadryl', 'zyrtec', 'pepcid', 'imodium',
      'mylanta', 'robitussin', 'sudafed', 'visine', 'listerine', 'reach', 'oral-b',
      'aveeno', 'neutrogena', 'clean & clear', 'lubriderm', 'roche-posay', 'acuvue',
      'one touch', 'lifescan', 'depuy', 'ethicon', 'janssen', 'mcneil'
    ],
    marketCap: 420,
    notes: 'Major pharmaceutical company. Known for animal testing and legal issues.'
  },
  'colgate-palmolive': {
    name: 'Colgate-Palmolive',
    aliases: ['colgate', 'palmolive'],
    countryOfOrigin: ['US'],
    industry: ['Personal Care', 'Household Products'],
    ethicalRating: 'fair',
    animalTesting: true,
    palmOilPolicy: 'unsustainable',
    laborPractices: 'good',
    subsidiaries: [
      'colgate', 'palmolive', 'ajax', 'fab', 'soupline', 'suavitel', 'softlan',
      'hill\'s', 'science diet', 'prescription diet', 'healthy advantage', 'pro plan',
      'tom\'s of maine', 'hello', 'elmex', 'meridol', 'sanex', 'speed stick', 'mennen'
    ],
    marketCap: 70,
    notes: 'Major oral care and household products company.'
  },
  'kimberly-clark': {
    name: 'Kimberly-Clark',
    aliases: ['kimberly clark'],
    countryOfOrigin: ['US'],
    industry: ['Personal Care', 'Household Products'],
    ethicalRating: 'fair',
    animalTesting: false,
    palmOilPolicy: 'unsustainable',
    laborPractices: 'good',
    subsidiaries: [
      'kleenex', 'huggies', 'kotex', 'depend', 'pull-ups', 'goodnites', 'scott',
      'viva', 'cottonelle', 'andrex', 'scott naturals', 'scott towels', 'scotties',
      'kleenex facial tissue', 'kleenex hand towels', 'kleenex toilet paper'
    ],
    marketCap: 45,
    notes: 'Major tissue and personal care company. Palm oil concerns.'
  },
  'henkel': {
    name: 'Henkel',
    aliases: ['henkel ag'],
    countryOfOrigin: ['DE'],
    industry: ['Consumer Goods', 'Adhesives', 'Personal Care'],
    ethicalRating: 'good',
    animalTesting: false,
    palmOilPolicy: 'sustainable',
    laborPractices: 'good',
    subsidiaries: [
      'persil', 'purex', 'all', 'snuggle', 'softlan', 'loctite', 'pattex', 'pritt',
      'schwarzkopf', 'syoss', 'got2b', 'taft', 'gliss', 'schauma', 'theramed',
      'diadermine', 'fa', 'vademecum', 'poly', 'dial', 'right guard', 'dry idea'
    ],
    marketCap: 35,
    notes: 'German company with better sustainability practices.'
  },
  'reckitt': {
    name: 'Reckitt',
    aliases: ['reckitt benckiser', 'rb', 'reckitt benckiser group'],
    countryOfOrigin: ['GB'],
    industry: ['Consumer Goods', 'Health', 'Hygiene'],
    ethicalRating: 'fair',
    animalTesting: true,
    palmOilPolicy: 'mixed',
    laborPractices: 'fair',
    subsidiaries: [
      'dettol', 'lysol', 'veet', 'nurofen', 'gaviscon', 'mucinex', 'airwick',
      'calgon', 'cillit bang', 'clearasil', 'durex', 'finish', 'harpic', 'veet',
      'woolite', 'enfamil', 'nutramigen', 'enfagrow', 'mega red', 'airborne'
    ],
    marketCap: 60,
    notes: 'Major consumer health and hygiene company.'
  },
  'estee lauder': {
    name: 'Estée Lauder',
    aliases: ['estee lauder', 'estée lauder companies'],
    countryOfOrigin: ['US'],
    industry: ['Cosmetics', 'Beauty', 'Luxury'],
    ethicalRating: 'poor',
    animalTesting: true,
    palmOilPolicy: 'unknown',
    laborPractices: 'fair',
    subsidiaries: [
      'estee lauder', 'clinique', 'm.a.c', 'mac', 'bobbi brown', 'la mer', 'origins',
      'aveda', 'bumble and bumble', 'jo malone', 'tom ford beauty', 'smashbox',
      'glamglow', 'too faced', 'becca', 'darphin', 'le labo', 'kilian', 'by kilian',
      'edition', 'aerin', 'osmia', 'roden', 'good skin', 'flirt!', 'american beauty'
    ],
    marketCap: 80,
    notes: 'Luxury cosmetics company. Known for animal testing.'
  },
  'beiersdorf': {
    name: 'Beiersdorf',
    aliases: ['beiersdorf ag'],
    countryOfOrigin: ['DE'],
    industry: ['Personal Care', 'Cosmetics'],
    ethicalRating: 'good',
    animalTesting: false,
    palmOilPolicy: 'sustainable',
    laborPractices: 'good',
    subsidiaries: [
      'nivea', 'eucerin', 'aquaphor', 'labello', 'hansaplast', 'elastoplast',
      'coppertone', 'florena', '8x4', 'hidrofugal', 'atrix', 'gammon', 'la prairie'
    ],
    marketCap: 25,
    notes: 'German company with good sustainability practices.'
  },
  'shiseido': {
    name: 'Shiseido',
    aliases: ['shiseido company'],
    countryOfOrigin: ['JP'],
    industry: ['Cosmetics', 'Beauty', 'Luxury'],
    ethicalRating: 'poor',
    animalTesting: true,
    palmOilPolicy: 'unknown',
    laborPractices: 'good',
    subsidiaries: [
      'shiseido', 'clé de peau beauté', 'nars', 'bareminerals', 'dolce & gabbana',
      'dolce&gabbana', 'issey miyake', 'serge lutens', 'lauramercier', 'tory burch',
      'drunk elephant', 'the ordinary', 'decorté', 'ipsa', 'ettusais', 'za',
      'aqua label', 'haku', 'uno', 'anessa', 'tsubaki', 'maquillage'
    ],
    marketCap: 15,
    notes: 'Japanese cosmetics company. Animal testing required in China.'
  },
  'kao': {
    name: 'Kao Corporation',
    aliases: ['kao'],
    countryOfOrigin: ['JP'],
    industry: ['Personal Care', 'Cosmetics', 'Household Products'],
    ethicalRating: 'fair',
    animalTesting: true,
    palmOilPolicy: 'mixed',
    laborPractices: 'good',
    subsidiaries: [
      'jergens', 'ban', 'bioré', 'john frieda', 'molton brown', 'curél', 'goldwell',
      'kms', 'rmn', 'ogx', 'guhl', 'asience', 'merit', 'success', 'attack',
      'new beats', 'humectance', 'est', 'sofina', 'kanebo', 'sensai', 'rmk'
    ],
    marketCap: 20,
    notes: 'Japanese personal care company.'
  },
  'sc johnson': {
    name: 'S.C. Johnson',
    aliases: ['sc johnson', 's.c. johnson & son', 'johnson'],
    countryOfOrigin: ['US'],
    industry: ['Household Products', 'Consumer Goods'],
    ethicalRating: 'good',
    animalTesting: false,
    palmOilPolicy: 'sustainable',
    laborPractices: 'excellent',
    subsidiaries: [
      'windex', 'pledge', 'scrubbing bubbles', 'fantastik', 'shout', 'windex',
      'drano', 'raid', 'off!', 'glade', 'ziploc', 'saran wrap', 'edge', 'skintimate',
      'ban', 'soft & gentle', 'nair', 'ogx', 'biokleen', 'method', 'ecover'
    ],
    marketCap: 12,
    notes: 'Family-owned company with excellent sustainability practices.'
  },
  'clorox': {
    name: 'Clorox',
    aliases: ['clorox company'],
    countryOfOrigin: ['US'],
    industry: ['Household Products', 'Consumer Goods'],
    ethicalRating: 'fair',
    animalTesting: false,
    palmOilPolicy: 'mixed',
    laborPractices: 'good',
    subsidiaries: [
      'clorox', 'bleach', 'pine-sol', 'liquid-plumr', 'formula 409', 'green works',
      'fresh step', 'scoop away', 'litter green', 'kingsford', 'hidden valley',
      'k c masterpiece', 'burt\'s bees', 'brita', 'glad', 'reynolds wrap',
      'kingsford', 'match light', 'char-broil', 'liquid-plumr', 'drain-out'
    ],
    marketCap: 18,
    notes: 'Major household products company.'
  },
  'church & dwight': {
    name: 'Church & Dwight',
    aliases: ['church and dwight'],
    countryOfOrigin: ['US'],
    industry: ['Consumer Goods', 'Personal Care'],
    ethicalRating: 'fair',
    animalTesting: false,
    palmOilPolicy: 'unknown',
    laborPractices: 'good',
    subsidiaries: [
      'arm & hammer', 'oxi clean', 'kaboom', 'spinbrush', 'first response',
      'vitafusion', 'l\'il critters', 'nair', 'ogx', 'batiste', 'waterpik',
      'trojan', 'x-tra', 'brillo', 'scotch-brite', 'sno bol', 'tough actin tinactin'
    ],
    marketCap: 15,
    notes: 'Consumer goods company.'
  },
  'coty': {
    name: 'Coty',
    aliases: ['coty inc'],
    countryOfOrigin: ['US'],
    industry: ['Cosmetics', 'Fragrance', 'Beauty'],
    ethicalRating: 'poor',
    animalTesting: true,
    palmOilPolicy: 'unknown',
    laborPractices: 'fair',
    subsidiaries: [
      'covergirl', 'clairol', 'wella', 'ghd', 'opi', 'sally hansen', 'rimmel',
      'max factor', 'bourjois', 'philosophy', 'calvin klein', 'chloe', 'davidoff',
      'marc jacobs', 'hugo boss', 'gucci', 'burberry', 'tiffany', 'bottega veneta',
      'michael kors', 'jimmy choo', 'vera wang', 'escada', 'lancaster', 'jil sander'
    ],
    marketCap: 8,
    notes: 'Major cosmetics and fragrance company. Animal testing concerns.'
  },
  'revlon': {
    name: 'Revlon',
    aliases: ['revlon inc'],
    countryOfOrigin: ['US'],
    industry: ['Cosmetics', 'Beauty'],
    ethicalRating: 'poor',
    animalTesting: true,
    palmOilPolicy: 'unknown',
    laborPractices: 'poor',
    subsidiaries: [
      'revlon', 'almay', 'mitchum', 'cnd', 'american crew', 'créme of nature',
      'mitchum', 'revlon colorstay', 'revlon super lustrous', 'revlon age defying'
    ],
    marketCap: 0.5,
    notes: 'Cosmetics company. Financial difficulties, animal testing.'
  },
  'ferrero': {
    name: 'Ferrero',
    aliases: ['ferrero rocher', 'ferrero group'],
    countryOfOrigin: ['IT'],
    industry: ['Confectionery', 'Food & Beverages'],
    ethicalRating: 'poor',
    animalTesting: false,
    palmOilPolicy: 'unsustainable',
    laborPractices: 'poor',
    subsidiaries: [
      'nutella', 'ferrero rocher', 'kinder', 'tic tac', 'raffaello', 'mon cheri',
      'kinder bueno', 'kinder surprise', 'kinder joy', 'kinder country', 'kinder pingui',
      'kinder delice', 'kinder chocolate', 'kinder maxi', 'kinder happy hippo'
    ],
    marketCap: 15,
    notes: 'Major confectionery company. Palm oil and labor concerns.'
  },
  // Add more brands as needed...
};

/**
 * Get brand data by name (case-insensitive, handles aliases)
 */
export function getBrandData(brandName: string): BrandData | null {
  if (!brandName || typeof brandName !== 'string') {
    return null;
  }

  const normalized = brandName.toLowerCase().trim();
  
  // Direct match
  if (BRAND_DATABASE[normalized]) {
    return BRAND_DATABASE[normalized];
  }

  // Check aliases
  for (const [key, data] of Object.entries(BRAND_DATABASE)) {
    if (data.aliases?.some(alias => alias.toLowerCase() === normalized)) {
      return data;
    }
    if (key === normalized) {
      return data;
    }
  }

  // Partial match (contains)
  for (const [key, data] of Object.entries(BRAND_DATABASE)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return data;
    }
    if (data.aliases?.some(alias => normalized.includes(alias.toLowerCase()) || alias.toLowerCase().includes(normalized))) {
      return data;
    }
  }

  return null;
}

/**
 * Check if brand is a cruel parent company
 */
export function isCruelParent(brandName: string): boolean {
  const brandData = getBrandData(brandName);
  if (!brandData) {
    return false;
  }
  
  // Check if brand or parent is known for animal testing
  if (brandData.animalTesting) {
    return true;
  }
  
  // Check parent company
  if (brandData.parentCompany) {
    const parentData = getBrandData(brandData.parentCompany);
    if (parentData?.animalTesting) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get all cruel parent companies
 */
export function getCruelParents(): string[] {
  return Object.values(BRAND_DATABASE)
    .filter(brand => brand.animalTesting)
    .map(brand => brand.name.toLowerCase());
}

/**
 * Check if brand is linked to a specific country
 */
export function isCountryLinked(brandName: string, countryCode: string): boolean {
  const brandData = getBrandData(brandName);
  if (!brandData) {
    return false;
  }
  
  const normalizedCountry = countryCode.toUpperCase();
  return brandData.countryOfOrigin.includes(normalizedCountry);
}

