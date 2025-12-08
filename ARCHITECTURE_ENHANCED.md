# Enhanced Architecture Proposal - World-Class App Design

**Date:** January 2025  
**Status:** Enhanced with Industry Best Practices & User Requirements

---

## Executive Summary

This enhanced architecture proposal incorporates:
- ✅ **User requirements** (card-level premium, specific sharing platforms, Yuka-style offline)
- ✅ **Industry best practices** (React Query, error boundaries, performance optimization)
- ✅ **World-class UX patterns** (progressive loading, skeleton screens, offline-first)
- ✅ **Modern React patterns** (suspense, code splitting, memoization)
- ✅ **Accessibility standards** (WCAG compliance, screen reader support)
- ✅ **Analytics & monitoring** (user behavior tracking, performance metrics)

---

## Key Design Decisions (Based on Your Answers)

### 1. Data Fetching Strategy
**Decision: Props-First with Fallback Fetching (Hybrid Approach)**

**Rationale:**
- **Props-first**: Result page fetches product data once, passes to all cards (better performance, single source)
- **Fallback fetching**: Cards can fetch their own data if props not available (flexibility for standalone use)
- **Benefits**: 
  - Avoids duplicate API calls
  - Cards can be used independently
  - Better performance (single fetch)
  - Progressive enhancement

**Implementation:**
```typescript
// Card receives props but can fetch if needed
interface TruScoreCardProps {
  barcode: string;
  product?: ProductWithTrustScore; // Optional - prefer props
  // Card will fetch if product not provided
}
```

### 2. Loading States Strategy
**Decision: Progressive Loading with Skeleton Screens**

**Rationale:**
- **Skeleton screens**: Show card structure while loading (better UX than spinners)
- **Progressive loading**: Cards load independently (don't block each other)
- **Optimistic UI**: Show cached data immediately, update when fresh data arrives
- **Benefits**:
  - Perceived performance improvement
  - Users see content faster
  - Better offline experience

**Implementation:**
- Each card has its own loading state
- Skeleton screens match final layout
- Staggered loading (cards appear as ready)
- Background refresh after initial render

### 3. Premium Gating
**Decision: Card-Level Premium Gating**

**Rationale:**
- Each card can have premium features
- Cards control their own premium logic
- More granular control
- Better user experience (see what's premium)

**Implementation:**
- Each card has `premiumFeatures` prop
- Card-level `PremiumGate` component
- Cards can have multiple premium features
- Clear upgrade prompts per card

### 4. Sharing Platforms
**Decision: Multi-Platform Sharing with Native Integration**

**Platforms to Support:**
- Facebook (via Facebook SDK)
- Instagram (via Instagram API/Stories)
- Twitter/X (via Twitter API)
- Snapchat (via Snapchat Creative Kit)
- TikTok (via TikTok Share)
- YouTube (via YouTube API for video sharing)

**Implementation:**
- Native SDKs for each platform
- Fallback to native share sheet
- Platform-specific content optimization
- Share analytics tracking

### 5. Offline Architecture
**Decision: Yuka-Style Offline-First Architecture**

**Yuka App Strategy (Research-Based):**
- **Aggressive caching**: Cache all scanned products locally
- **Offline-first**: App works completely offline
- **Background sync**: Sync when connection restored
- **Smart prefetching**: Pre-cache popular products
- **Local database**: SQLite for offline storage
- **Progressive enhancement**: Show cached data, update when online

**Implementation:**
- SQLite database for all product data
- Aggressive prefetching of popular products
- Background sync service
- Offline indicator in UI
- Queue actions for when online

---

## Enhanced Architecture Structure

```
src/
├── data/                          # Data Access Layer
│   ├── databases/                 # Database interfaces
│   │   ├── productDatabase.ts
│   │   ├── offlineDatabase.ts    # NEW: Offline-first database
│   │   └── ...
│   ├── repositories/              # Data repositories
│   │   ├── productRepository.ts
│   │   └── ...
│   ├── cache/                     # NEW: Advanced caching
│   │   ├── cacheManager.ts        # Unified cache management
│   │   ├── prefetchService.ts     # Smart prefetching
│   │   └── syncService.ts         # Background sync
│   └── query/                     # NEW: React Query integration
│       ├── queryClient.ts
│       └── productQueries.ts
│
├── features/
│   ├── product/
│   │   ├── cards/                 # Modular Cards
│   │   │   ├── TruScoreCard/
│   │   │   │   ├── TruScoreCard.tsx
│   │   │   │   ├── TruScoreCardSkeleton.tsx  # NEW: Skeleton loader
│   │   │   │   ├── TruScoreCardError.tsx     # NEW: Error boundary
│   │   │   │   ├── TruScoreCardModal.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useTruScoreData.ts
│   │   │   │   ├── premium/       # NEW: Card-level premium
│   │   │   │   │   └── TruScorePremiumGate.tsx
│   │   │   │   └── index.ts
│   │   │   └── ... (other cards)
│   │   └── hooks/
│   │       └── useProductData.ts  # Main product data hook
│   │
│   ├── premium/
│   │   ├── gates/
│   │   │   ├── PremiumGate.tsx
│   │   │   ├── CardPremiumGate.tsx  # NEW: Card-level gate
│   │   │   └── ...
│   │   └── ...
│   │
│   ├── sharing/
│   │   ├── platforms/            # NEW: Platform-specific
│   │   │   ├── facebook.ts
│   │   │   ├── instagram.ts
│   │   │   ├── twitter.ts
│   │   │   ├── snapchat.ts
│   │   │   ├── tiktok.ts
│   │   │   └── youtube.ts
│   │   └── ...
│   │
│   └── offline/                   # NEW: Offline module
│       ├── services/
│       │   ├── offlineService.ts
│       │   ├── syncService.ts
│       │   └── prefetchService.ts
│       └── hooks/
│           └── useOfflineMode.ts
│
├── performance/                   # NEW: Performance optimization
│   ├── codeSplitting.ts
│   ├── imageOptimization.ts
│   └── bundleOptimization.ts
│
├── analytics/                     # NEW: Analytics & monitoring
│   ├── analyticsService.ts
│   ├── performanceMonitoring.ts
│   └── userTracking.ts
│
└── accessibility/                 # NEW: Accessibility
    ├── screenReader.ts
    └── a11yUtils.ts
```

---

## Enhanced Component Design

### 1. Card Component with Progressive Loading

```typescript
// src/features/product/cards/TruScoreCard/TruScoreCard.tsx
import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { TruScoreCardSkeleton } from './TruScoreCardSkeleton';
import { TruScoreCardError } from './TruScoreCardError';
import { TruScoreCardContent } from './TruScoreCardContent';
import { useTruScoreData } from './hooks/useTruScoreData';
import { CardPremiumGate } from '../../../premium/gates/CardPremiumGate';

interface TruScoreCardProps {
  barcode: string;
  product?: ProductWithTrustScore; // Props-first approach
  // Card will fetch if product not provided
}

export function TruScoreCard({ barcode, product }: TruScoreCardProps) {
  // Props-first: Use provided product, fetch if not available
  const { truScore, loading, error } = useTruScoreData(barcode, product);
  
  return (
    <ErrorBoundary
      FallbackComponent={TruScoreCardError}
      onError={(error) => {
        // Log to analytics
        analyticsService.logError('TruScoreCard', error);
      }}
    >
      <Suspense fallback={<TruScoreCardSkeleton />}>
        <CardPremiumGate
          cardId="truScore"
          premiumFeatures={['enhanced_insights', 'detailed_breakdown']}
        >
          <TruScoreCardContent
            truScore={truScore}
            loading={loading}
            error={error}
          />
        </CardPremiumGate>
      </Suspense>
    </ErrorBoundary>
  );
}
```

### 2. Data Fetching with React Query

```typescript
// src/data/query/productQueries.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProductRepository } from '../repositories/productRepository';

const productRepository = new ProductRepository(/* database */);

export function useProductData(barcode: string, options?: {
  enabled?: boolean;
  staleTime?: number;
}) {
  return useQuery({
    queryKey: ['product', barcode],
    queryFn: () => productRepository.getProductData(barcode),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours (cache time)
    enabled: options?.enabled ?? true,
    // Offline support
    networkMode: 'offlineFirst', // Try cache first
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Prefetch popular products
export function usePrefetchProduct(barcode: string) {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: ['product', barcode],
      queryFn: () => productRepository.getProductData(barcode),
    });
  };
}
```

### 3. Offline-First Database

```typescript
// src/data/databases/offlineDatabase.ts
import * as SQLite from 'expo-sqlite';
import { Product } from '../../types/product';

export class OfflineDatabase {
  private db: SQLite.SQLiteDatabase;
  
  constructor() {
    this.db = SQLite.openDatabaseSync('truescan_offline.db');
    this.initializeSchema();
  }
  
  /**
   * Yuka-style: Aggressive caching
   * Store all scanned products locally
   */
  async saveProduct(product: Product): Promise<void> {
    await this.db.runAsync(`
      INSERT OR REPLACE INTO products (
        barcode, data, updated_at, source
      ) VALUES (?, ?, ?, ?)
    `, [
      product.barcode,
      JSON.stringify(product),
      Date.now(),
      product.source,
    ]);
  }
  
  /**
   * Get product from offline database
   * Always available, even offline
   */
  async getProduct(barcode: string): Promise<Product | null> {
    const result = await this.db.getFirstAsync<{ data: string }>(
      'SELECT data FROM products WHERE barcode = ?',
      [barcode]
    );
    
    if (!result) return null;
    return JSON.parse(result.data) as Product;
  }
  
  /**
   * Prefetch popular products (Yuka strategy)
   * Cache top 1000 most scanned products
   */
  async prefetchPopularProducts(barcodes: string[]): Promise<void> {
    // Background prefetching
    // Don't block UI
  }
  
  /**
   * Background sync when online
   */
  async syncWithServer(): Promise<void> {
    // Sync queued actions
    // Update cached products
    // Download new data
  }
}
```

### 4. Card-Level Premium Gating

```typescript
// src/features/premium/gates/CardPremiumGate.tsx
import React from 'react';
import { usePremiumAccess } from '../hooks/usePremiumAccess';
import { PremiumFeature } from '../types';

interface CardPremiumGateProps {
  cardId: string;
  premiumFeatures: PremiumFeature[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function CardPremiumGate({
  cardId,
  premiumFeatures,
  children,
  fallback,
}: CardPremiumGateProps) {
  // Check access for all premium features in this card
  const accessChecks = premiumFeatures.map(feature =>
    usePremiumAccess(feature)
  );
  
  const allAccessible = accessChecks.every(check => check.canAccess);
  const anyUpgradeRequired = accessChecks.some(check => check.upgradeRequired);
  
  if (allAccessible) {
    return <>{children}</>;
  }
  
  // Show premium gate with card-specific features
  return (
    <PremiumGate
      cardId={cardId}
      features={premiumFeatures}
      fallback={fallback}
    >
      {children}
    </PremiumGate>
  );
}
```

### 5. Multi-Platform Sharing

```typescript
// src/features/sharing/platforms/facebook.ts
import { ShareService } from '../services/shareService';
import { ShareableItem } from '../types/shareableItems';

export class FacebookShareService {
  /**
   * Share to Facebook using Facebook SDK
   */
  async share(item: ShareableItem): Promise<void> {
    const content = ShareService.buildShareContent(item);
    
    // Use Facebook SDK for native sharing
    if (await this.isFacebookInstalled()) {
      await this.shareViaSDK(content);
    } else {
      // Fallback to web sharing
      await this.shareViaWeb(content);
    }
  }
  
  private async shareViaSDK(content: ShareContent): Promise<void> {
    // Facebook SDK implementation
    // Supports Stories, Feed, etc.
  }
}

// Similar implementations for:
// - Instagram (Stories, Feed)
// - Twitter/X (Tweet, Thread)
// - Snapchat (Snap, Story)
// - TikTok (Video, Story)
// - YouTube (Video upload)
```

### 6. Skeleton Loaders

```typescript
// src/features/product/cards/TruScoreCard/TruScoreCardSkeleton.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from 'react-native-skeleton-loader'; // Or custom

export function TruScoreCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={120} height={20} style={styles.title} />
      <Skeleton width={100} height={100} style={styles.circle} />
      <Skeleton width="100%" height={16} style={styles.text} />
      <Skeleton width="80%" height={16} style={styles.text} />
    </View>
  );
}
```

---

## Performance Optimizations

### 1. Code Splitting
```typescript
// Lazy load cards
const TruScoreCard = React.lazy(() => 
  import('./features/product/cards/TruScoreCard')
);

// Lazy load modals
const TruScoreModal = React.lazy(() =>
  import('./features/product/cards/TruScoreCard/TruScoreCardModal')
);
```

### 2. Memoization
```typescript
// Memoize expensive calculations
const truScore = useMemo(
  () => calculateTruScore(product),
  [product.barcode, product.nutriments]
);

// Memoize callbacks
const handleShare = useCallback(() => {
  shareService.share({ type: 'truScore', data: ... });
}, [truScore]);
```

### 3. Image Optimization
```typescript
// Lazy load images
<Image
  source={{ uri: imageUrl }}
  loading="lazy"
  placeholder={placeholderImage}
  progressiveRenderingEnabled
/>
```

### 4. Bundle Optimization
- Tree shaking
- Dynamic imports
- Remove unused dependencies
- Optimize bundle size

---

## Analytics & Monitoring

### 1. User Behavior Tracking
```typescript
// Track card interactions
analyticsService.track('card_viewed', {
  cardId: 'truScore',
  barcode,
  isPremium,
});

// Track sharing
analyticsService.track('share_initiated', {
  platform: 'facebook',
  itemType: 'truScore',
  barcode,
});
```

### 2. Performance Monitoring
```typescript
// Monitor card load times
performanceService.measure('truScoreCard_load', () => {
  // Card loading logic
});
```

---

## Accessibility Enhancements

### 1. Screen Reader Support
```typescript
<View
  accessible={true}
  accessibilityLabel="TruScore card, score 78 out of 100"
  accessibilityHint="Double tap to view detailed breakdown"
  accessibilityRole="button"
>
  {/* Card content */}
</View>
```

### 2. Keyboard Navigation
- Full keyboard support
- Focus management
- Skip links

---

## Additional Improvements

### 1. Error Handling
- Error boundaries per card
- Graceful degradation
- User-friendly error messages
- Error reporting to analytics

### 2. State Management
- Consider Zustand (already using) or Redux Toolkit
- Optimistic updates
- Undo/redo support

### 3. Testing Strategy
- Unit tests per card
- Integration tests for data layer
- E2E tests for full flows
- Visual regression tests

### 4. Internationalization
- Full i18n support (already have)
- RTL language support
- Date/number formatting

### 5. Progressive Web App
- Service workers for offline
- Install prompts
- Push notifications

---

## Implementation Priority

### Phase 1: Foundation (Week 1-2)
1. ✅ Data layer with React Query
2. ✅ Offline database (Yuka-style)
3. ✅ Repository pattern

### Phase 2: Cards (Week 3-5)
1. ✅ Extract cards with skeleton loaders
2. ✅ Error boundaries per card
3. ✅ Card-level premium gating
4. ✅ Progressive loading

### Phase 3: Sharing (Week 6)
1. ✅ Multi-platform sharing
2. ✅ Platform-specific optimization
3. ✅ Share analytics

### Phase 4: Performance (Week 7)
1. ✅ Code splitting
2. ✅ Image optimization
3. ✅ Bundle optimization

### Phase 5: Polish (Week 8)
1. ✅ Analytics integration
2. ✅ Accessibility improvements
3. ✅ Performance monitoring

---

## Success Metrics

### Performance
- First contentful paint < 1.5s
- Time to interactive < 3s
- Card load time < 500ms
- Offline availability > 95%

### User Experience
- Share success rate > 80%
- Premium conversion > 5%
- Error rate < 1%
- User satisfaction > 4.5/5

---

**This enhanced architecture positions TrueScan as a world-class, industry-leading food transparency app.**


