/**
 * Logo rendering stays closed unless every approval condition is present.
 * Recognition-example permission does not authorise a product Result mark.
 */

import { discoveryEntries, type DiscoveryArtwork } from './discoveryCatalogue';

export type CertificationArtworkSurface = 'product_result' | 'recognition_example' | 'contribution_review';

export type CertificationArtworkDecision =
  | { render: 'text'; accessibleName: string }
  | { render: 'mark'; accessibleName: string; assetRef: string };

export type CertificationArtworkRequest = {
  accessibleName: string;
  surface: CertificationArtworkSurface;
  productionId?: string;
  artwork?: DiscoveryArtwork | null;
  territory?: string | null;
  platform?: 'ios' | 'android' | string | null;
  now?: Date;
  associationAdmitted?: boolean;
};

function artworkForProduction(productionId: string | undefined): DiscoveryArtwork | null {
  if (!productionId) return null;
  return discoveryEntries().find((entry) => entry.productionId === productionId)?.artwork ?? null;
}

function expired(validUntil: string | null, now: Date): boolean {
  if (!validUntil) return false;
  const parsed = Date.parse(validUntil);
  if (Number.isNaN(parsed)) return true;
  return parsed <= now.getTime();
}

/** Text unless an exact approved asset is cleared for this surface, place, platform and time. */
export function resolveCertificationArtwork(request: CertificationArtworkRequest): CertificationArtworkDecision {
  const name = request.accessibleName.trim() || 'Certification';
  const artwork = request.artwork === undefined ? artworkForProduction(request.productionId) : request.artwork;
  const textOnly = { render: 'text' as const, accessibleName: name };
  if (!artwork) return textOnly;
  if (artwork.revokedAt) return textOnly;
  if (artwork.permissionStatus.trim().toLowerCase() !== 'approved') return textOnly;
  if (artwork.renderEnabled !== true) return textOnly;
  if (!artwork.assetRef) return textOnly;
  if (!artwork.approvedSurfaces.includes(request.surface)) return textOnly;
  if (artwork.territory && artwork.territory !== (request.territory || '')) return textOnly;
  if (artwork.platform && artwork.platform !== (request.platform || '')) return textOnly;
  if (expired(artwork.validUntil, request.now ?? new Date())) return textOnly;
  if (request.surface === 'product_result' && artwork.productAssociationRequired && request.associationAdmitted !== true) {
    return textOnly;
  }
  if (request.surface === 'product_result' && artwork.approvedSurfaces.includes('recognition_example') && !artwork.approvedSurfaces.includes('product_result')) {
    return textOnly;
  }
  return { render: 'mark', accessibleName: name, assetRef: artwork.assetRef };
}
