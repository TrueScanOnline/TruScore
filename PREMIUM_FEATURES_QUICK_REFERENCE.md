# Premium Features - Quick Reference Guide

## 🎯 Recommended Premium Features (Final Decision)

### ✅ Tier 1: Must Implement (Launch)

1. **Offline Mode** ⭐⭐⭐⭐⭐
   - Scan products without internet
   - Already implemented (cache system ready)
   - **Gate:** `PremiumFeature.OFFLINE_MODE`

2. **Unlimited History** ⭐⭐⭐⭐⭐
   - Remove 100-scan limit
   - **Gate:** `PremiumFeature.UNLIMITED_HISTORY` (NEW)

3. **Advanced Search & Filters** ⭐⭐⭐⭐
   - Trust Score, Eco-Score, NOVA filters
   - Already implemented, just needs gating
   - **Gate:** `PremiumFeature.ADVANCED_SEARCH`

4. **Export Functionality** ⭐⭐⭐⭐
   - Export scan history to CSV/JSON
   - **Gate:** `PremiumFeature.EXPORT_DATA` (NEW)

### ✅ Tier 2: Nice to Have

5. **Enhanced Insights** ⭐⭐⭐⭐
   - Detailed TruScore breakdown
   - Advanced nutrition analytics
   - **Gate:** `PremiumFeature.ENHANCED_INSIGHTS` (NEW)

6. **Ad-Free Experience** ⭐⭐⭐
   - Remove ads (if implemented)
   - **Gate:** `PremiumFeature.AD_FREE`

7. **Extended Cache** ⭐⭐⭐
   - 500 products vs 100 (already implemented)
   - 30 days vs 7 days expiry (already implemented)
   - **Gate:** Already working, just highlight benefit

---

## 💰 Recommended Pricing

- **Monthly:** $4.99/month
- **Annual:** $39.99/year (save 33%)
- **Trial:** 7-day free trial

**Rationale:** Competitive with Yuka (market leader), psychological pricing, clear value.

---

## 🚀 Implementation Priority

### Week 1: Core Premium Gating
1. Enable premium gating (remove `return true`)
2. Implement unlimited history gating
3. Add upgrade prompts at key points

### Week 2-4: Enhanced Features
4. Implement export functionality
5. Add enhanced insights
6. Test conversion flows

---

## 📊 Free vs Premium Matrix

| Feature | Free | Premium |
|---------|------|---------|
| Basic scanning | ✅ Unlimited | ✅ Unlimited |
| TruScore | ✅ Yes | ✅ Enhanced |
| Nutrition facts | ✅ Yes | ✅ Enhanced |
| History | ✅ 100 scans | ✅ Unlimited |
| Offline mode | ❌ No | ✅ Yes |
| Advanced search | ❌ No | ✅ Yes |
| Export data | ❌ No | ✅ Yes |
| Enhanced insights | ❌ No | ✅ Yes |

---

## 🔧 Quick Implementation

### 1. Update Premium Feature Enum

```typescript
// src/utils/premiumFeatures.ts
export enum PremiumFeature {
  OFFLINE_MODE = 'offline_mode',
  ADVANCED_SEARCH = 'advanced_search',
  UNLIMITED_HISTORY = 'unlimited_history', // NEW
  EXPORT_DATA = 'export_data', // NEW
  ENHANCED_INSIGHTS = 'enhanced_insights', // NEW
  AD_FREE = 'ad_free',
}
```

### 2. Enable Premium Gating

```typescript
// src/utils/premiumFeatures.ts
export function isPremiumFeatureEnabled(
  feature: PremiumFeature,
  subscriptionInfo: SubscriptionInfo
): boolean {
  // REMOVE: return true; // TEMPORARY
  
  if (!subscriptionInfo.isPremium) return false;
  if (subscriptionInfo.status !== 'active' && subscriptionInfo.status !== 'trial') {
    return subscriptionInfo.status === 'grace_period';
  }
  return true;
}
```

### 3. Gate Unlimited History

```typescript
// src/store/useScanStore.ts
const MAX_SCANS_FREE = 100;
const isUnlimited = isPremiumFeatureEnabled(PremiumFeature.UNLIMITED_HISTORY, subscriptionInfo);
const maxScans = isUnlimited ? Infinity : MAX_SCANS_FREE;
```

---

## 📈 Conversion Points

**High-Value:**
1. History limit reached (100 scans)
2. Offline mode attempted
3. Advanced search attempted

**Medium-Value:**
4. Export attempted
5. Enhanced insights viewed

---

## ✅ Implementation Checklist

- [ ] Remove `return true` in `isPremiumFeatureEnabled()`
- [ ] Add `UNLIMITED_HISTORY` feature
- [ ] Add `EXPORT_DATA` feature
- [ ] Add `ENHANCED_INSIGHTS` feature
- [ ] Gate unlimited history
- [ ] Implement export functionality
- [ ] Add upgrade prompts
- [ ] Test subscription flow
- [ ] Update subscription screen

---

**See:** `PREMIUM_FEATURES_ANALYSIS_AND_STRATEGY.md` for full details.


