// Modular Pricing Card Component
// Wraps GlobalPricingCard with modular architecture

import React, { Suspense } from 'react';
import ErrorBoundary from '../../../../components/ErrorBoundary';
import GlobalPricingCard from '../../../../components/GlobalPricingCard';
import { CardPremiumGate } from '../../../premium/CardPremiumGate';
import { PremiumFeature } from '../../../../utils/premiumFeatures';
import { PricingCardSkeleton } from './PricingCardSkeleton';
import { PricingCardError } from './PricingCardError';

interface PricingCardProps {
  barcode: string;
  productName?: string;
  onShare?: () => void;
  premiumFeatures?: PremiumFeature[];
}

function PricingCardContent({ barcode, productName, onShare, premiumFeatures }: PricingCardProps) {
  return (
    <CardPremiumGate features={premiumFeatures || []}>
      <GlobalPricingCard
        barcode={barcode}
        productName={productName}
      />
    </CardPremiumGate>
  );
}

export default function PricingCard(props: PricingCardProps) {
  return (
    <ErrorBoundary feature="PricingCard">
      <Suspense fallback={<PricingCardSkeleton />}>
        <PricingCardContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}


