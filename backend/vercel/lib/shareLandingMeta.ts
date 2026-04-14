/**
 * Share landing page: HTML escaping and context-specific titles (Open Graph / on-page).
 */

export const ALLOWED_SHARE_CONTEXTS = new Set([
  'truScore',
  'recall',
  'countryOfManufacture',
  'negativeTruScore',
  'productInfo',
  'insights',
  'palmOil',
  'nutrition',
  'ingredients',
  'processing',
  'allergens',
  'ecoscore',
]);

export function normalizeShareContext(raw: unknown): string | undefined {
  const s = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined;
  if (!s || !ALLOWED_SHARE_CONTEXTS.has(s)) return undefined;
  return s;
}

export function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Safe inside double-quoted HTML attributes (meta content, etc.). */
export function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function absoluteImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const t = url.trim();
  if (!t) return '';
  if (t.startsWith('//')) return `https:${t}`;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, '')}`;
}

export function pickQueryString(
  reqQuery: Record<string, string | string[] | undefined>,
  keys: string[]
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const v = reqQuery[key];
    const s = typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined;
    if (!s || s.length > 200) continue;
    if (/^[\w.\-+%]{1,200}$/.test(s)) {
      out[key] = s;
    }
  }
  return out;
}

export interface LandingPresentation {
  pageHeadlinePlain: string;
  documentTitlePlain: string;
  metaDescriptionPlain: string;
  heroTaglinePlain: string;
  heroViralPlain: string;
}

export function buildLandingPresentation(args: {
  ctx?: string;
  productNamePlain: string;
  trustScore: number | null | undefined;
  defaultHeadline: string;
  defaultMetaDescription: string;
  scoreHook: string;
  scoreViral: string;
}): LandingPresentation {
  const { ctx, productNamePlain: pn, defaultHeadline, defaultMetaDescription, scoreHook, scoreViral } = args;

  switch (ctx) {
    case 'recall':
      return {
        pageHeadlinePlain: `Recall alert: ${pn}`,
        documentTitlePlain: `${pn} · Recall · Rveel`,
        metaDescriptionPlain: `Recall and safety context for ${pn}. Open Rveel for full details — free app.`,
        heroTaglinePlain: 'Someone shared this for your safety',
        heroViralPlain: 'Check recall status and product details in Rveel.',
      };
    case 'nutrition':
      return {
        pageHeadlinePlain: `Nutrition snapshot: ${pn}`,
        documentTitlePlain: `${pn} · Nutrition · Rveel`,
        metaDescriptionPlain: `Nutrition and Rveel Score for ${pn}. Tap to open in the Rveel app.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: 'See full nutrition facts and Rveel Score in the app.',
      };
    case 'allergens':
      return {
        pageHeadlinePlain: `Allergens & additives: ${pn}`,
        documentTitlePlain: `${pn} · Allergens · Rveel`,
        metaDescriptionPlain: `Allergen and additive context for ${pn}. View details in Rveel.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: 'See allergen and ingredient details in the app.',
      };
    case 'ecoscore':
      return {
        pageHeadlinePlain: `Environmental score: ${pn}`,
        documentTitlePlain: `${pn} · Eco · Rveel`,
        metaDescriptionPlain: `Environmental impact and Rveel Score for ${pn}. Open in Rveel.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: 'See Eco-Score-style context and full breakdown in the app.',
      };
    case 'countryOfManufacture':
      return {
        pageHeadlinePlain: `Country of manufacture: ${pn}`,
        documentTitlePlain: `${pn} · Origin · Rveel`,
        metaDescriptionPlain: `Where ${pn} is made — see sourcing details in Rveel.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: 'Trace manufacturing and origins in the app.',
      };
    case 'insights':
      return {
        pageHeadlinePlain: `Alert insight: ${pn}`,
        documentTitlePlain: `${pn} · Alerts · Rveel`,
        metaDescriptionPlain: `Optional user-alert insight for ${pn}. Open Rveel to read more.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: 'See how this product lines up with your chosen alerts.',
      };
    case 'palmOil':
      return {
        pageHeadlinePlain: `Palm oil: ${pn}`,
        documentTitlePlain: `${pn} · Palm oil · Rveel`,
        metaDescriptionPlain: `Palm oil and sourcing context for ${pn} in Rveel.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: 'See palm oil and transparency details in the app.',
      };
    case 'ingredients':
      return {
        pageHeadlinePlain: `Ingredients: ${pn}`,
        documentTitlePlain: `${pn} · Ingredients · Rveel`,
        metaDescriptionPlain: `Ingredient list and analysis for ${pn} — Rveel app.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: 'Read ingredients and processing in the app.',
      };
    case 'processing':
      return {
        pageHeadlinePlain: `Processing level: ${pn}`,
        documentTitlePlain: `${pn} · Processing · Rveel`,
        metaDescriptionPlain: `How processed is ${pn}? See NOVA-style context in Rveel.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: 'See processing and nutrition context in the app.',
      };
    case 'negativeTruScore':
      return {
        pageHeadlinePlain: `Low Rveel Score: ${pn}`,
        documentTitlePlain: `${pn} · Rveel Score`,
        metaDescriptionPlain: `This product has a low Rveel Score. See why in the free Rveel app.`,
        heroTaglinePlain: scoreHook,
        heroViralPlain: scoreViral,
      };
    case 'truScore':
    case 'productInfo':
    default:
      return {
        pageHeadlinePlain: defaultHeadline,
        documentTitlePlain: `${pn} · Rveel Score`,
        metaDescriptionPlain: defaultMetaDescription,
        heroTaglinePlain: scoreHook,
        heroViralPlain: scoreViral,
      };
  }
}
