// Consolidated Product Cards Component
// Renders all modular cards for a product

import React from 'react';
import { ProductWithTrustScore } from '../../../types/product';
import { TruScoreResult } from '../../../lib/truscoreEngine';
import { ShareableItem } from '../../sharing/types';
import { ShareService } from '../../sharing';
import { TruScoreCard } from './TruScoreCard';
import { EcoScoreCard } from './EcoScoreCard';
import { NutritionCard } from './NutritionCard';
import { PalmOilCard } from './PalmOilCard';
import { PackagingCard } from './PackagingCard';
import CarbonFootprintCard from './CarbonFootprintCard/CarbonFootprintCard';
import { AllergensCard } from './AllergensCard';
import { ProcessingCard } from './ProcessingCard';
import { RecallsCard } from './RecallsCard';
import { CountryCard } from './CountryCard';
import { CertificationsCard } from './CertificationsCard';
import { PricingCard } from './PricingCard';
import { PremiumFeature } from '../../../utils/premiumFeatures';

interface ProductCardsProps {
  barcode: string;
  product?: ProductWithTrustScore;
  truScore?: TruScoreResult;
  onShare?: (item: ShareableItem) => void;
}

export function ProductCards({ barcode, product, truScore, onShare }: ProductCardsProps) {
  const handleShare = (item: ShareableItem) => {
    if (onShare) {
      onShare(item);
    } else if (product) {
      // Default share handler
      ShareService.share({
        product,
        truScore,
        item,
        platform: 'native',
      });
    }
  };

  return (
    <>
      {/* TruScore Card - Always show if product exists */}
      {product && (
        <TruScoreCard
          barcode={barcode}
          product={product}
          onShare={() => handleShare('truScore')}
          premiumFeatures={[]} // Configure per card
        />
      )}

      {/* EcoScore Card */}
      <EcoScoreCard
        product={product}
        onShare={() => handleShare('productInfo')}
        premiumFeatures={[]}
      />

      {/* Nutrition Card */}
      <NutritionCard
        product={product}
        onShare={() => handleShare('productInfo')}
        premiumFeatures={[]}
      />

      {/* Palm Oil Card */}
      <PalmOilCard
        product={product}
        onShare={() => handleShare('productInfo')}
        premiumFeatures={[]}
      />

      {/* Packaging Card */}
      <PackagingCard
        product={product}
        onShare={() => handleShare('productInfo')}
        premiumFeatures={[]}
      />

      {/* Carbon footprint — Open Food Facts; opens OFF product page */}
      <CarbonFootprintCard product={product} premiumFeatures={[]} />

      {/* Allergens & Additives Card */}
      <AllergensCard
        product={product}
        onShare={() => handleShare('productInfo')}
        premiumFeatures={[]}
      />

      {/* Processing Level Card */}
      <ProcessingCard
        product={product}
        onShare={() => handleShare('productInfo')}
        premiumFeatures={[]}
      />

      {/* Recalls Card (shown as banner, not card) */}
      <RecallsCard
        product={product}
        onShare={() => handleShare('recall')}
        premiumFeatures={[]}
      />

      {/* Country Card */}
      <CountryCard
        barcode={barcode}
        product={product}
        onShare={() => handleShare('countryOfManufacture')}
        premiumFeatures={[]}
      />

      {/* Certifications Card */}
      <CertificationsCard
        product={product}
        onShare={() => handleShare('productInfo')}
        premiumFeatures={[]}
      />

      {/* Pricing Card */}
      <PricingCard
        barcode={barcode}
        productName={product?.product_name || product?.product_name_en}
        onShare={() => handleShare('productInfo')}
        premiumFeatures={[]}
      />
    </>
  );
}


