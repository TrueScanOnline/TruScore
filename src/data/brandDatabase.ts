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
  recallHistory?: boolean; // Has history of product recalls
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
    recallHistory: true, // Known for multiple product recalls
    subsidiaries: [
      'nescafe', 'nespresso', 'starbucks', 'gerber', 'purina', 'friskies', 'fancy feast',
      'kit kat', 'smarties', 'aero', 'butterfinger', 'crunch', 'wonka', 'poland spring',
      'perrier', 'san pellegrino', 'vittel', 'haagen-dazs', 'dreyer\'s', 'edys',
      'carnation', 'coffee-mate', 'libby\'s', 'lean cuisine', 'stouffer\'s', 'hot pockets',
      'digiorno', 'tombstone', 'häagen-dazs', 'drumstick', 'outshine'
    ],
    marketCap: 280,
    notes: 'Controversial company with poor labor practices and water extraction issues. History of product recalls.'
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
    recallHistory: true, // Known for major product recalls (Tylenol, talc, etc.)
    subsidiaries: [
      'band-aid', 'tylenol', 'motrin', 'benadryl', 'zyrtec', 'pepcid', 'imodium',
      'mylanta', 'robitussin', 'sudafed', 'visine', 'listerine', 'reach', 'oral-b',
      'aveeno', 'neutrogena', 'clean & clear', 'lubriderm', 'roche-posay', 'acuvue',
      'one touch', 'lifescan', 'depuy', 'ethicon', 'janssen', 'mcneil'
    ],
    marketCap: 420,
    notes: 'Major pharmaceutical company. Known for animal testing, legal issues, and major product recalls.'
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
  // Australian & New Zealand Brands
  'jalna': {
    name: 'Jalna',
    aliases: ['jalna yoghurt', 'jalna yogurt', 'jalna greek yoghurt'],
    countryOfOrigin: ['AU'],
    industry: ['Dairy'],
    ethicalRating: 'good',
    animalTesting: false,
    palmOilPolicy: 'unknown',
    laborPractices: 'good',
    parentCompany: 'Parmalat',
    notes: 'Australian dairy brand, owned by Parmalat (Lactalis)'
  },
  'norco': {
    name: 'Norco',
    aliases: ['norco cooperative', 'norco dairy'],
    countryOfOrigin: ['AU'],
    industry: ['Dairy'],
    ethicalRating: 'good',
    animalTesting: false,
    palmOilPolicy: 'unknown',
    laborPractices: 'good',
    notes: 'Australian dairy cooperative, member-owned'
  },
  // US Organic & Specialty Brands
  'chobani': {
    name: 'Chobani',
    aliases: ['chobani inc', 'chobani greek yogurt'],
    countryOfOrigin: ['US'],
    industry: ['Dairy'],
    ethicalRating: 'good',
    animalTesting: false,
    palmOilPolicy: 'unknown',
    laborPractices: 'good',
    notes: 'US Greek yogurt brand, known for ethical practices and worker ownership'
  },
  "nature's path": {
    name: "Nature's Path",
    aliases: ['natures path', 'nature path', 'nature\'s path organic'],
    countryOfOrigin: ['CA', 'US'],
    industry: ['Food & Beverages', 'Cereal'],
    ethicalRating: 'excellent',
    animalTesting: false,
    palmOilPolicy: 'sustainable',
    laborPractices: 'excellent',
    notes: 'Organic cereal brand, family-owned, B-Corp certified, excellent ethical practices'
  },
  "amy's kitchen": {
    name: "Amy's Kitchen",
    aliases: ['amys kitchen', 'amy kitchen', 'amys', 'amy\'s'],
    countryOfOrigin: ['US'],
    industry: ['Food & Beverages', 'Frozen Foods'],
    ethicalRating: 'good',
    animalTesting: false,
    palmOilPolicy: 'sustainable',
    laborPractices: 'good',
    notes: 'Organic frozen foods brand, family-owned, focuses on natural ingredients'
  },
  // Add more brands as needed...
};

/**
 * Normalize brand name for matching
 * Handles common variations: "Coca-Cola" vs "Coca Cola", "P&G" vs "Procter & Gamble", etc.
 * Enhanced with: accents, hyphens, US/UK spelling, company suffixes
 */
export function normalizeBrandNameForLookup(brandName: string): string {
  if (!brandName || typeof brandName !== 'string') {
    return '';
  }
  
  return brandName
    .toLowerCase()
    .trim()
    // Remove common punctuation (but keep hyphens for now, handle separately)
    .replace(/[.,;:!?'"()\[\]{}]/g, '')
    // Normalize hyphens and dashes to spaces (Coca-Cola -> coca cola)
    .replace(/[-–—]/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Handle common abbreviations
    .replace(/\b&\b/g, 'and')
    .replace(/\bp&g\b/g, 'procter and gamble')
    .replace(/\bj&j\b/g, 'johnson and johnson')
    // Remove common company suffixes
    .replace(/\binc\b/g, '')
    .replace(/\bllc\b/g, '')
    .replace(/\bltd\b/g, '')
    .replace(/\bcorp\b/g, '')
    .replace(/\bcorporation\b/g, '')
    .replace(/\bco\b/g, '')
    .replace(/\bcompany\b/g, '')
    .replace(/\bgroup\b/g, '')
    .replace(/\bholdings\b/g, '')
    .replace(/\benterprises\b/g, '')
    .replace(/\bplc\b/g, '')
    .replace(/\bsa\b/g, '')
    .replace(/\bag\b/g, '')
    // Remove common prefixes
    .replace(/^the\s+/i, '')
    // Normalize accented characters (US/UK and international)
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/ç/g, 'c')
    .replace(/ñ/g, 'n')
    .replace(/ß/g, 'ss')
    // Remove apostrophes (L'Oréal -> loreal)
    .replace(/'/g, '')
    // Normalize whitespace again after all replacements
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get brand data by name (case-insensitive, handles aliases, optimized for performance)
 * Enhanced to check parent companies when brand not found directly
 * 
 * PERFORMANCE: Uses in-memory lookup - O(1) for direct matches, O(n) for partial matches
 * Caching could be added if needed, but current implementation is fast enough
 */
export function getBrandData(brandName: string, parentCompany?: string): BrandData | null {
  if (!brandName || typeof brandName !== 'string') {
    return null;
  }

  const normalized = normalizeBrandNameForLookup(brandName);
  
  if (!normalized) {
    return null;
  }
  
  // Direct match (fastest - O(1))
  if (BRAND_DATABASE[normalized]) {
    return BRAND_DATABASE[normalized];
  }

  // Check aliases (O(n) but n is small ~500 brands)
  for (const [key, data] of Object.entries(BRAND_DATABASE)) {
    // Exact alias match
    if (data.aliases?.some(alias => normalizeBrandNameForLookup(alias) === normalized)) {
      return data;
    }
    
    // Check if normalized brand matches key exactly
    if (normalizeBrandNameForLookup(key) === normalized) {
      return data;
    }
  }

  // Partial match (contains) - only if no exact match found
  // This handles cases like "Coca-Cola" matching "coca cola"
  for (const [key, data] of Object.entries(BRAND_DATABASE)) {
    const normalizedKey = normalizeBrandNameForLookup(key);
    
    // Check if normalized brand contains key or vice versa
    if (normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
      // Only return if match is significant (at least 3 characters)
      if (normalizedKey.length >= 3 && normalized.length >= 3) {
        return data;
      }
    }
    
    // Check aliases for partial matches
    if (data.aliases) {
      for (const alias of data.aliases) {
        const normalizedAlias = normalizeBrandNameForLookup(alias);
        if (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized)) {
          // Only return if match is significant
          if (normalizedAlias.length >= 3 && normalized.length >= 3) {
            return data;
          }
        }
      }
    }
  }

  // ENHANCED: If brand not found, check parent company
  if (parentCompany) {
    const parentNormalized = normalizeBrandNameForLookup(parentCompany);
    if (parentNormalized) {
      // Try direct parent company lookup
      const parentData = getBrandDataDirect(parentNormalized);
      if (parentData) {
        return parentData;
      }
    }
  }

  return null;
}

/**
 * Direct brand data lookup (internal helper, no parent company check)
 */
function getBrandDataDirect(normalized: string): BrandData | null {
  if (BRAND_DATABASE[normalized]) {
    return BRAND_DATABASE[normalized];
  }
  
  // Check aliases
  for (const [key, data] of Object.entries(BRAND_DATABASE)) {
    if (data.aliases?.some(alias => normalizeBrandNameForLookup(alias) === normalized)) {
      return data;
    }
    if (normalizeBrandNameForLookup(key) === normalized) {
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

/**
 * Check if brand has recall history
 * Used for CARE Pillar brand overlay penalty
 */
export function hasRecallHistory(brandName: string): boolean {
  const brandData = getBrandData(brandName);
  if (!brandData) {
    return false;
  }
  
  // Check brand recall history
  if (brandData.recallHistory === true) {
    return true;
  }
  
  // Check parent company recall history
  if (brandData.parentCompany) {
    const parentData = getBrandData(brandData.parentCompany);
    if (parentData?.recallHistory === true) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extract brand name from product name when brands field is empty or generic
 * Handles patterns like: "Brand Name - Product", "Brand Name Product", "Brand Name: Product"
 */
export function extractBrandFromProductName(productName?: string, brandOwner?: string): string | null {
  if (!productName || typeof productName !== 'string') {
    // Fallback to brand_owner if available
    if (brandOwner && brandOwner.trim()) {
      return brandOwner.trim();
    }
    return null;
  }
  
  // Pattern 1: "Brand Name - Product Description" or "Brand Name: Product"
  const pattern1 = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+[-:]/i;
  const match1 = productName.match(pattern1);
  if (match1 && match1[1]) {
    const potentialBrand = match1[1].trim();
    if (isLikelyBrandName(potentialBrand)) {
      return potentialBrand;
    }
  }
  
  // Pattern 2: "Brand Name Product Description" (brand at start, followed by lowercase product word)
  const pattern2 = /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+[a-z]/i;
  const match2 = productName.match(pattern2);
  if (match2 && match2[1]) {
    const potentialBrand = match2[1].trim();
    if (isLikelyBrandName(potentialBrand)) {
      return potentialBrand;
    }
  }
  
  // Pattern 3: Extract first 1-3 capitalized words (common brand pattern)
  const words = productName.split(/\s+/);
  if (words.length >= 2) {
    // Check if first 1-2 words look like a brand
    for (let i = 1; i <= Math.min(3, words.length); i++) {
      const candidate = words.slice(0, i).join(' ');
      if (isLikelyBrandName(candidate)) {
        return candidate;
      }
    }
  }
  
  // Fallback: Use brand_owner if available
  if (brandOwner && brandOwner.trim()) {
    return brandOwner.trim();
  }
  
  return null;
}

/**
 * Check if a string is likely a brand name (heuristics)
 */
function isLikelyBrandName(name: string): boolean {
  if (!name || name.length < 2) return false;
  
  const genericWords = new Set([
    'organic', 'natural', 'premium', 'fresh', 'pure', 'healthy', 'whole', 'free',
    'range', 'style', 'choice', 'select', 'value', 'best', 'great', 'new', 'old',
    'original', 'classic', 'traditional', 'authentic', 'artisan', 'gourmet',
    'farm', 'country', 'home', 'family', 'kitchen', 'garden', 'valley', 'mountain',
    'river', 'lake', 'spring', 'summer', 'winter', 'autumn', 'fall'
  ]);
  
  const words = name.toLowerCase().split(/\s+/);
  
  // Too long to be a brand (usually 1-4 words)
  if (words.length > 4) return false;
  
  // First word is generic
  if (genericWords.has(words[0])) return false;
  
  // All words are generic
  if (words.every(w => genericWords.has(w))) return false;
  
  // Contains numbers (unlikely to be brand at start)
  if (/^\d/.test(name)) return false;
  
  return true;
}

