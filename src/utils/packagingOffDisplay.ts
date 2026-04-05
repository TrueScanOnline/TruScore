/**
 * Helpers for displaying Open Food Facts–sourced packaging only.
 */

import type { Product, PackagingItem } from '../types/product';

export function getOffPackagingItems(product: Product): PackagingItem[] {
  const fromData = product.packaging_data?.items;
  if (fromData && fromData.length > 0) {
    return fromData;
  }
  return product.packagings || [];
}

/** kg CO₂e per kg of product from OFF Eco-Score / Agribalyse (lifecycle), when present. */
export function getOffCarbonFootprintKgPerKg(product: Product): number | undefined {
  const ed = product.ecoscore_data;
  if (!ed) return undefined;
  const raw = ed.co2_total ?? ed.agribalyse?.co2_total ?? ed.co2_total_fr;
  if (typeof raw !== 'number' || Number.isNaN(raw)) return undefined;
  return raw;
}

/**
 * g CO₂e / 100 g from OFF nutriments (when lifecycle CO₂ is missing or in addition).
 * See Open Food Facts field carbon-footprint-from-known-ingredients_100g.
 */
export function getOffCarbonFootprintGPer100g(product: Product): number | undefined {
  const n = product.nutriments;
  if (!n) return undefined;
  const raw =
    n['carbon-footprint-from-known-ingredients_100g'] ??
    n['carbon-footprint-from-known-ingredients-product_100g'];
  if (typeof raw !== 'number' || Number.isNaN(raw)) return undefined;
  return raw;
}

/** Eco-Score packaging adjustment / impact from OFF (several possible JSON shapes). */
export function getOffPackagingImpactRating(product: Product): number | undefined {
  const ed = product.ecoscore_data as Record<string, unknown> | undefined;
  if (!ed) return undefined;
  const direct = ed.packaging_impact;
  if (typeof direct === 'number' && !Number.isNaN(direct)) return direct;

  const adj = ed.adjustments;
  if (adj && typeof adj === 'object' && adj !== null) {
    const pkg = (adj as Record<string, unknown>).packaging;
    if (typeof pkg === 'number' && !Number.isNaN(pkg)) return pkg;
    if (pkg && typeof pkg === 'object' && pkg !== null) {
      const v = (pkg as { value?: unknown }).value;
      if (typeof v === 'number' && !Number.isNaN(v)) return v;
    }
  }

  const pkgRoot = ed.packaging;
  if (pkgRoot && typeof pkgRoot === 'object' && pkgRoot !== null) {
    const v = (pkgRoot as { value?: unknown }).value;
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
  }
  return undefined;
}

/** Count from OFF ecoscore_data.packaging when present. */
export function getOffPackagingNonRecyclableMaterialsCount(product: Product): number | undefined {
  const ed = product.ecoscore_data as Record<string, unknown> | undefined;
  const pkg = ed?.packaging;
  if (!pkg || typeof pkg !== 'object' || pkg === null) return undefined;
  const n = (pkg as { non_recyclable_and_non_biodegradable_materials?: unknown })
    .non_recyclable_and_non_biodegradable_materials;
  if (typeof n !== 'number' || Number.isNaN(n)) return undefined;
  return n;
}

export function collectUniquePackagingShapes(items: PackagingItem[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const s = formatOffPackagingField(rawShape(item));
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export function collectUniquePackagingMaterials(items: PackagingItem[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const s = formatOffPackagingField(rawMaterial(item));
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/**
 * True when OFF provides substantive packaging information (parts, text, tags, or recyclability flags).
 * Eco-Score-only adjustment scores without real packaging fields do not show the card.
 */
export function hasOffPackagingDisplay(product: Product): boolean {
  if (getOffPackagingItems(product).length > 0) return true;
  if (product.packaging?.trim()) return true;
  if (product.packaging_tags && product.packaging_tags.length > 0) return true;
  if (product.packaging_data) {
    const pd = product.packaging_data;
    if (pd.isRecyclable || pd.isReusable || pd.isBiodegradable) return true;
    if (pd.items && pd.items.length > 0) return true;
  }
  if (product.packagings && product.packagings.length > 0) return true;
  return false;
}

export function isPackagingItemRecyclablePerOff(item: PackagingItem): boolean {
  const r = (item.recycling || '').toLowerCase();
  return r.includes('recyclable') && !r.includes('non-recyclable');
}

export function formatOffPackagingField(raw?: string): string {
  if (!raw) return '';
  const clean = raw.replace(/^en:/, '');
  return clean
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function rawShape(item: PackagingItem): string | undefined {
  const any = item as Record<string, unknown>;
  const s = item.shape ?? any.packaging_shape ?? any.shape_lc;
  return typeof s === 'string' ? s : undefined;
}

function rawMaterial(item: PackagingItem): string | undefined {
  const any = item as Record<string, unknown>;
  const m = item.material ?? any.packaging_material ?? any.materials;
  if (typeof m === 'string') return m;
  return undefined;
}

export function describePackagingItem(item: PackagingItem): string {
  const shape = formatOffPackagingField(rawShape(item));
  const material = formatOffPackagingField(rawMaterial(item));
  const parts = [shape, material].filter(Boolean);
  let line = parts.join(' · ') || '—';
  if (item.recycling) {
    line += ` — ${formatOffPackagingField(item.recycling)}`;
  }
  return line;
}
