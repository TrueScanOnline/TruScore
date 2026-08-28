/**
 * product_scope_guard = coles_family for SIG-SR-AU-003 / TGT-008.
 * Requires corroborated Coles-family chain eligibility — not product_name-only inference.
 */

export type ColesFamilyScopeChainContext = {
  brand_id: string | null;
  parent_id: string | null;
  brand_match_channel?: 'brands_field' | 'product_name' | 'gtin_link' | 'injected' | null;
  brand_type?: string | null;
};

const COLES_PARENT_ID = 'P0002';

export function colesFamilyScopeGuardAllows(chain: ColesFamilyScopeChainContext | null | undefined): boolean {
  if (!chain?.brand_id || !chain.parent_id) return false;
  if (chain.parent_id !== COLES_PARENT_ID) return false;

  const brandType = (chain.brand_type ?? '').trim();
  if (brandType !== 'retailer_own_label' && brandType !== 'brand_family') return false;

  const channel = chain.brand_match_channel ?? null;
  if (channel === 'product_name') return false;
  if (channel === 'brands_field' || channel === 'gtin_link' || channel === 'injected') return true;

  return false;
}
