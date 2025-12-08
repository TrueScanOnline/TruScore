# Modular Architecture Implementation Guide

**Date:** January 2025  
**Purpose:** Step-by-step guide for implementing the modular architecture

---

## Implementation Strategy

This guide provides detailed implementation steps, code examples, and migration patterns for restructuring the codebase into a modular architecture.

---

## Phase 1: Data Layer Foundation

### Step 1.1: Create Database Interface Layer

**File:** `src/data/databases/productDatabase.ts`

```typescript
import { Product, ProductWithTrustScore } from '../../types/product';
import { NutritionData } from '../../types/nutrition';
import { Certification } from '../../types/product';
import { UnifiedRecall } from '../../types/recall';

/**
 * Unified database interface - single source of truth for all product data
 * All database queries go through this interface
 */
export interface ProductDatabase {
  // Core product data
  getProduct(barcode: string): Promise<Product | null>;
  getProductWithTrustScore(barcode: string): Promise<ProductWithTrustScore | null>;
  
  // Specific data queries (for cards that only need specific data)
  getProductNutrition(barcode: string): Promise<NutritionData | null>;
  getProductCertifications(barcode: string): Promise<Certification[]>;
  getProductRecalls(barcode: string): Promise<UnifiedRecall[]>;
  getProductManufacturingCountry(barcode: string): Promise<string | null>;
  getProductEcoScore(barcode: string): Promise<{ score: number; grade: string } | null>;
  getProductPalmOilAnalysis(barcode: string): Promise<any>;
  getProductPackaging(barcode: string): Promise<any>;
  getProductPricing(barcode: string): Promise<any>;
  
  // Batch queries
  getMultipleProducts(barcodes: string[]): Promise<Product[]>;
}

/**
 * Database implementation - wraps existing services
 */
export class ProductDatabaseImpl implements ProductDatabase {
  constructor(
    private productService: any, // Will be typed properly
    private cacheService: any,
    private sqliteService: any
  ) {}
  
  async getProduct(barcode: string): Promise<Product | null> {
    // 1. Check SQLite (offline-first)
    const sqliteProduct = await this.sqliteService.lookupProduct(barcode);
    if (sqliteProduct) return sqliteProduct;
    
    // 2. Check cache
    const cached = await this.cacheService.getCachedProduct(barcode);
    if (cached) return cached;
    
    // 3. Fetch from APIs (existing productService logic)
    return await this.productService.fetchProduct(barcode);
  }
  
  async getProductWithTrustScore(barcode: string): Promise<ProductWithTrustScore | null> {
    const product = await this.getProduct(barcode);
    if (!product) return null;
    
    // Calculate trust score if not present
    if (!product.trust_score) {
      // Use existing trust score calculation
      return await this.productService.calculateTrustScore(product);
    }
    
    return product as ProductWithTrustScore;
  }
  
  // Implement other methods...
}
```

### Step 1.2: Create Repository Pattern

**File:** `src/data/repositories/productRepository.ts`

```typescript
import { ProductDatabase } from '../databases/productDatabase';
import { Product, ProductWithTrustScore } from '../../types/product';

/**
 * Repository pattern - abstraction layer for data access
 * Provides clean interface for feature modules
 */
export class ProductRepository {
  constructor(private database: ProductDatabase) {}
  
  /**
   * Get complete product data for result page
   */
  async getProductData(barcode: string): Promise<ProductWithTrustScore | null> {
    return await this.database.getProductWithTrustScore(barcode);
  }
  
  /**
   * Get only nutrition data (for NutritionCard)
   */
  async getNutritionData(barcode: string) {
    return await this.database.getProductNutrition(barcode);
  }
  
  /**
   * Get only certifications (for CertificationsCard)
   */
  async getCertifications(barcode: string) {
    return await this.database.getProductCertifications(barcode);
  }
  
  // ... other specific queries
}
```

---

## Phase 2: Modular Card Components

### Step 2.1: Create Card Base Structure

**File:** `src/features/product/cards/TruScoreCard/TruScoreCard.tsx`

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../theme';
import { useTruScoreData } from './hooks/useTruScoreData';
import { usePremiumAccess } from '../../../../features/premium/hooks/usePremiumAccess';
import { useShare } from '../../../../features/sharing/hooks/useShare';
import { PremiumFeature } from '../../../../features/premium/types';
import TruScore from '../../../../components/TruScore';
import TruScoreCardModal from './TruScoreCardModal';

interface TruScoreCardProps {
  barcode: string;
  product?: ProductWithTrustScore; // Optional - card can fetch if needed
}

export function TruScoreCard({ barcode, product }: TruScoreCardProps) {
  const { colors } = useTheme();
  const { truScore, loading, error } = useTruScoreData(barcode, product);
  const { canAccess, upgradeRequired, onUpgrade } = usePremiumAccess(
    PremiumFeature.ENHANCED_INSIGHTS
  );
  const { share } = useShare();
  
  const handleShare = () => {
    if (truScore) {
      share({
        type: 'truScore',
        data: {
          score: truScore.truscore,
          breakdown: truScore.breakdown,
          barcode,
          productName: product?.product_name,
        },
      });
    }
  };
  
  if (loading) {
    return <TruScoreCardSkeleton />;
  }
  
  if (error || !truScore) {
    return <TruScoreCardError error={error} />;
  }
  
  // Premium gating for enhanced insights
  if (upgradeRequired) {
    return (
      <PremiumGate
        feature={PremiumFeature.ENHANCED_INSIGHTS}
        onUpgrade={onUpgrade}
      >
        <TruScoreCardContent truScore={truScore} onShare={handleShare} />
      </PremiumGate>
    );
  }
  
  return (
    <TruScoreCardContent 
      truScore={truScore} 
      onShare={handleShare}
      showEnhancedInsights={canAccess}
    />
  );
}

function TruScoreCardContent({ truScore, onShare, showEnhancedInsights }) {
  // Card rendering logic
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>TruScore</Text>
        <TouchableOpacity onPress={onShare}>
          <Ionicons name="share-outline" size={20} />
        </TouchableOpacity>
      </View>
      <TruScore truScore={truScore} />
      {/* Enhanced insights only if premium */}
      {showEnhancedInsights && <EnhancedInsightsSection />}
    </View>
  );
}
```

**File:** `src/features/product/cards/TruScoreCard/hooks/useTruScoreData.ts`

```typescript
import { useState, useEffect } from 'react';
import { ProductRepository } from '../../../../../data/repositories/productRepository';
import { TruScoreResult } from '../../../../../lib/truscoreEngine';
import { ProductWithTrustScore } from '../../../../../types/product';

export function useTruScoreData(
  barcode: string,
  product?: ProductWithTrustScore
) {
  const [truScore, setTruScore] = useState<TruScoreResult | null>(null);
  const [loading, setLoading] = useState(!product);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function loadTruScore() {
      try {
        setLoading(true);
        
        // If product provided, use it; otherwise fetch
        let productData = product;
        if (!productData) {
          const repository = new ProductRepository(/* database */);
          productData = await repository.getProductData(barcode);
        }
        
        if (productData?.trust_score !== null && productData?.trust_score_breakdown) {
          setTruScore({
            truscore: productData.trust_score,
            breakdown: productData.trust_score_breakdown,
            // ... other fields
          });
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    
    loadTruScore();
  }, [barcode, product]);
  
  return { truScore, loading, error };
}
```

### Step 2.2: Create Other Card Components

Follow the same pattern for:
- `CountryOfManufactureCard/`
- `EcoScoreCard/`
- `PalmOilCard/`
- `PackagingCard/`
- `PricingCard/`
- `NutritionCard/`
- `IngredientsCard/`
- `ProcessingLevelCard/`
- `AllergensAdditivesCard/`

Each card:
- Has its own directory
- Has its own hook for data fetching
- Has its own modal component
- Is completely independent

---

## Phase 3: Premium Features Module

### Step 3.1: Centralize Premium Service

**File:** `src/features/premium/services/premiumService.ts`

```typescript
import { PremiumFeature, PREMIUM_FEATURES, ENABLE_PREMIUM_GATING } from '../types';
import { SubscriptionInfo } from '../../../store/useSubscriptionStore';

export class PremiumService {
  /**
   * Check if user has access to a premium feature
   */
  checkAccess(feature: PremiumFeature, subscription: SubscriptionInfo): boolean {
    // If premium gating disabled, allow all
    if (!ENABLE_PREMIUM_GATING) return true;
    
    // If feature not premium, allow
    if (!PREMIUM_FEATURES[feature]?.isPremium) return true;
    
    // Check subscription status
    return subscription.isPremium && 
           (subscription.status === 'active' || 
            subscription.status === 'trial' ||
            subscription.status === 'grace_period');
  }
  
  /**
   * Get upgrade message for a feature
   */
  getUpgradeMessage(feature: PremiumFeature): string {
    const desc = PremiumFeatureDescriptions[feature];
    return `Unlock ${desc.title} with Premium subscription`;
  }
  
  /**
   * Check if upgrade should be shown
   */
  shouldShowUpgrade(feature: PremiumFeature, subscription: SubscriptionInfo): boolean {
    return !this.checkAccess(feature, subscription);
  }
}
```

### Step 3.2: Create Premium Hooks

**File:** `src/features/premium/hooks/usePremiumAccess.ts`

```typescript
import { useMemo } from 'react';
import { useSubscriptionStore } from '../../../store/useSubscriptionStore';
import { PremiumFeature } from '../types';
import { PremiumService } from '../services/premiumService';

const premiumService = new PremiumService();

export function usePremiumAccess(feature: PremiumFeature) {
  const subscriptionInfo = useSubscriptionStore(state => state.subscriptionInfo);
  
  const access = useMemo(() => {
    const canAccess = premiumService.checkAccess(feature, subscriptionInfo);
    const upgradeRequired = premiumService.shouldShowUpgrade(feature, subscriptionInfo);
    const upgradeMessage = premiumService.getUpgradeMessage(feature);
    
    return {
      canAccess,
      upgradeRequired,
      upgradeMessage,
      onUpgrade: () => {
        // Navigate to subscription screen
        // navigation.navigate('Subscription');
      },
    };
  }, [feature, subscriptionInfo]);
  
  return access;
}
```

---

## Phase 4: Sharing Module

### Step 4.1: Define Shareable Items

**File:** `src/features/sharing/types/shareableItems.ts`

```typescript
export type ShareableItem = 
  | { type: 'truScore'; data: TruScoreShareData }
  | { type: 'recall'; data: RecallShareData }
  | { type: 'country'; data: CountryShareData }
  | { type: 'negativePoint'; data: NegativePointShareData }
  | { type: 'values'; data: ValuesShareData }
  | { type: 'product'; data: ProductShareData };

export interface TruScoreShareData {
  score: number;
  breakdown: {
    Body: number;
    Planet: number;
    Care: number;
    Open: number;
  };
  barcode: string;
  productName?: string;
  negativePoints?: string[];
}

export interface RecallShareData {
  recall: UnifiedRecall;
  barcode: string;
  productName?: string;
}

export interface CountryShareData {
  country: string;
  barcode: string;
  productName?: string;
  isNotDisclosed?: boolean;
}

export interface NegativePointShareData {
  point: string;
  description: string;
  barcode: string;
  productName?: string;
}

export interface ValuesShareData {
  preferences: string[];
  barcode: string;
  productName?: string;
}

export interface ProductShareData {
  product: Product;
  barcode: string;
}
```

### Step 4.2: Create Share Service

**File:** `src/features/sharing/services/shareService.ts`

```typescript
import { Share } from 'react-native';
import { ShareableItem } from '../types/shareableItems';
import { buildShareContent } from './shareContentBuilder';

export class ShareService {
  /**
   * Share an item to social media
   */
  async share(item: ShareableItem, platform?: SocialPlatform): Promise<void> {
    const content = buildShareContent(item);
    
    if (platform) {
      // Platform-specific sharing
      await this.shareToPlatform(content, platform);
    } else {
      // Native share sheet
      await Share.share({
        message: content.message,
        title: content.title,
        url: content.url,
      });
    }
  }
  
  /**
   * Build share content from shareable item
   */
  buildShareContent(item: ShareableItem): ShareContent {
    return buildShareContent(item);
  }
  
  /**
   * Get available platforms for an item
   */
  getAvailablePlatforms(item: ShareableItem): SocialPlatform[] {
    // Return platforms that support this item type
    return ['twitter', 'facebook', 'whatsapp', 'email'];
  }
}
```

**File:** `src/features/sharing/services/shareContentBuilder.ts`

```typescript
import { ShareableItem } from '../types/shareableItems';

export function buildShareContent(item: ShareableItem): ShareContent {
  switch (item.type) {
    case 'truScore':
      return buildTruScoreShareContent(item.data);
    case 'recall':
      return buildRecallShareContent(item.data);
    case 'country':
      return buildCountryShareContent(item.data);
    case 'negativePoint':
      return buildNegativePointShareContent(item.data);
    case 'values':
      return buildValuesShareContent(item.data);
    case 'product':
      return buildProductShareContent(item.data);
  }
}

function buildTruScoreShareContent(data: TruScoreShareData): ShareContent {
  let message = `TruScore ${data.score}/100 for ${data.productName || 'this product'}\n\n`;
  
  message += `Breakdown:\n`;
  message += `Body: ${data.breakdown.Body}/25\n`;
  message += `Planet: ${data.breakdown.Planet}/25\n`;
  message += `Care: ${data.breakdown.Care}/25\n`;
  message += `Open: ${data.breakdown.Open}/25\n\n`;
  
  if (data.negativePoints && data.negativePoints.length > 0) {
    message += `⚠️ Concerns:\n`;
    data.negativePoints.forEach(point => {
      message += `• ${point}\n`;
    });
    message += `\n`;
  }
  
  message += `Scan with TrueScan app to see full details!\n`;
  message += `#TruScore #FoodTransparency`;
  
  return {
    message,
    title: `TruScore ${data.score}/100 - ${data.productName}`,
    url: `https://truescan.app/barcode/${data.barcode}`,
  };
}

function buildRecallShareContent(data: RecallShareData): ShareContent {
  const message = `🚨 FOOD RECALL ALERT 🚨\n\n` +
    `${data.productName || 'Product'} has been recalled!\n\n` +
    `Reason: ${data.recall.reason}\n` +
    `Date: ${data.recall.date}\n` +
    `Authority: ${data.recall.authority}\n\n` +
    `Check the full recall details in TrueScan app.\n` +
    `#FoodRecall #FoodSafety`;
  
  return {
    message,
    title: `Food Recall: ${data.productName}`,
    url: `https://truescan.app/barcode/${data.barcode}`,
  };
}

function buildCountryShareContent(data: CountryShareData): ShareContent {
  if (data.isNotDisclosed) {
    const message = `🚫 Country of manufacture NOT DISCLOSED!\n\n` +
      `The brand is hiding where ${data.productName || 'this product'} is made.\n\n` +
      `Demand transparency! Share this to raise awareness.\n` +
      `#Transparency #CountryOfOrigin`;
    
    return {
      message,
      title: `Country Not Disclosed: ${data.productName}`,
      url: `https://truescan.app/barcode/${data.barcode}`,
    };
  }
  
  const message = `📍 Country of Manufacture: ${data.country}\n\n` +
    `${data.productName || 'This product'} is made in ${data.country}.\n\n` +
    `Know where your food comes from with TrueScan!\n` +
    `#CountryOfOrigin #FoodTransparency`;
  
  return {
    message,
    title: `Made in ${data.country}: ${data.productName}`,
    url: `https://truescan.app/barcode/${data.barcode}`,
  };
}

function buildNegativePointShareContent(data: NegativePointShareData): ShareContent {
  const message = `⚠️ ${data.point}\n\n` +
    `${data.description}\n\n` +
    `Found in: ${data.productName || 'product'}\n\n` +
    `Check full details in TrueScan app.\n` +
    `#FoodSafety #ConsumerAwareness`;
  
  return {
    message,
    title: `${data.point} - ${data.productName}`,
    url: `https://truescan.app/barcode/${data.barcode}`,
  };
}

// ... other builders
```

### Step 4.3: Create Share Hook

**File:** `src/features/sharing/hooks/useShare.ts`

```typescript
import { useCallback } from 'react';
import { ShareService } from '../services/shareService';
import { ShareableItem } from '../types/shareableItems';

const shareService = new ShareService();

export function useShare() {
  const share = useCallback(async (
    item: ShareableItem,
    platform?: SocialPlatform
  ) => {
    try {
      await shareService.share(item, platform);
    } catch (error) {
      console.error('Error sharing:', error);
      // Show error toast
    }
  }, []);
  
  return { share };
}
```

---

## Phase 5: Refactored Result Page

### Step 5.1: Simplified Result Page

**File:** `app/result/[barcode].tsx` (Refactored)

```typescript
import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { useSubscriptionStore } from '../../src/store/useSubscriptionStore';

// Import modular cards
import { TruScoreCard } from '../../src/features/product/cards/TruScoreCard';
import { CountryOfManufactureCard } from '../../src/features/product/cards/CountryOfManufactureCard';
import { EcoScoreCard } from '../../src/features/product/cards/EcoScoreCard';
import { PalmOilCard } from '../../src/features/product/cards/PalmOilCard';
import { PackagingCard } from '../../src/features/product/cards/PackagingCard';
import { PricingCard } from '../../src/features/product/cards/PricingCard';
import { NutritionCard } from '../../src/features/product/cards/NutritionCard';
import { IngredientsCard } from '../../src/features/product/cards/IngredientsCard';
import { ProcessingLevelCard } from '../../src/features/product/cards/ProcessingLevelCard';
import { AllergensAdditivesCard } from '../../src/features/product/cards/AllergensAdditivesCard';

// Import product data hook
import { useProductData } from '../../src/features/product/hooks/useProductData';

export default function ResultScreen() {
  const route = useRoute();
  const { barcode } = route.params;
  const { colors } = useTheme();
  const { subscriptionInfo } = useSubscriptionStore();
  const { product, loading, error } = useProductData(barcode);
  const isPremium = subscriptionInfo.isPremium && 
    (subscriptionInfo.status === 'active' || 
     subscriptionInfo.status === 'trial' || 
     subscriptionInfo.status === 'grace_period');
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (error || !product) {
    return <ErrorScreen error={error} barcode={barcode} />;
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Hero Section */}
        <ProductHero product={product} barcode={barcode} />
        
        {/* Modular Cards - Each is independent */}
        <TruScoreCard barcode={barcode} product={product} />
        <CountryOfManufactureCard barcode={barcode} product={product} />
        <EcoScoreCard barcode={barcode} product={product} />
        <PalmOilCard barcode={barcode} product={product} />
        <PackagingCard barcode={barcode} product={product} />
        <PricingCard barcode={barcode} product={product} isPremium={isPremium} />
        <NutritionCard barcode={barcode} product={product} />
        <IngredientsCard barcode={barcode} product={product} />
        <ProcessingLevelCard barcode={barcode} product={product} />
        <AllergensAdditivesCard barcode={barcode} product={product} />
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Migration Strategy

### Incremental Migration

1. **Keep existing code working** - Don't break current functionality
2. **Build new alongside old** - Create new structure while keeping old
3. **Migrate one card at a time** - Start with simplest card
4. **Test thoroughly** - Ensure each card works independently
5. **Switch over gradually** - Use feature flags to toggle between old/new

### Feature Flags

```typescript
// src/config/featureFlags.ts
export const FEATURE_FLAGS = {
  USE_MODULAR_CARDS: false, // Toggle to use new card system
  USE_DATA_REPOSITORY: false, // Toggle to use new data layer
  USE_PREMIUM_SERVICE: false, // Toggle to use new premium service
  USE_SHARING_MODULE: false, // Toggle to use new sharing system
};
```

---

## Benefits Summary

### Before (Current)
- ❌ 2,448 line result page
- ❌ Mixed concerns
- ❌ Hard to test
- ❌ Hard to maintain
- ❌ Changes affect multiple areas

### After (Proposed)
- ✅ Modular cards (100-200 lines each)
- ✅ Separated concerns
- ✅ Easy to test
- ✅ Easy to maintain
- ✅ Changes isolated to one card

---

## Next Steps

1. **Review and approve** architecture proposal
2. **Create detailed specs** for each card
3. **Set up project structure** (directories)
4. **Begin Phase 1** - Data layer
5. **Iterate and refine** as we build

---

**This implementation guide provides the roadmap for a clean, maintainable, and scalable codebase.**


