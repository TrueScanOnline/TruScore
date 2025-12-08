# Product Page Card Flow - Visual Diagram

## Complete Data Flow: Product Scan → Cards Display

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER SCANS BARCODE                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  RESULT PAGE LOADS                                               │
│  (app/result/[barcode].refactored.tsx)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: useProductData() Hook                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ • Fetches product from all databases                      │ │
│  │ • Calculates TruScore                                     │ │
│  │ • Returns: { product, truScore, loading, error }          │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Page Renders                                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ • Hero Section (image, name, brand)                      │ │
│  │ • ScrollView container                                    │ │
│  │ • Cards rendered sequentially                             │ │
│  └───────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Cards Render (In Order)                                 │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ CARD 1: RecallsCard                                        │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ Check: product.recalls exists?                      │  │ │
│  │ │ If YES: Show red banner                              │  │ │
│  │ │ If NO:  Return null (don't render)                   │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ CARD 2: TruScoreCard                                      │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ Check: product exists?                               │  │ │
│  │ │ If YES:                                              │  │ │
│  │ │   • useTruScoreData() calculates TruScore            │  │ │
│  │ │   • Show TruScore (0-100) with breakdown            │  │ │
│  │ │   • Show flags (green/red)                           │  │ │
│  │ │ If NO:  Show insufficient data card                  │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ CARD 3: Insights Carousel                                  │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ Check: truScore.insights exists?                    │  │ │
│  │ │ If YES: Show expandable insights carousel           │  │ │
│  │ │ If NO:  Don't render                                │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ CARD 4: EcoScoreCard                                      │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ Check: product exists?                               │  │ │
│  │ │ Calculate: calculateEcoScore(product)                │  │ │
│  │ │ Check: ecoScore.score > 0?                           │  │ │
│  │ │ If YES: Show Eco-Score card with grade               │  │ │
│  │ │ If NO:  Return null (don't render)                   │  │ │
│  │ │ Premium Gate: Check premiumFeatures                  │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ CARD 5: NutritionCard                                     │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ Check: product.nutriments exists?                    │  │ │
│  │ │ If YES: Show nutrition table                         │  │ │
│  │ │ If NO:  Return null (don't render)                  │  │ │
│  │ │ Premium Gate: Check premiumFeatures                  │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ CARD 6: PalmOilCard                                       │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ Check: product.palm_oil_analysis exists?            │  │ │
│  │ │ Calculate: getPalmOilStatus(analysis)                │  │ │
│  │ │ If YES: Show palm oil flag (🟢/🟠/🔴)               │  │ │
│  │ │ If NO:  Return null (don't render)                   │  │ │
│  │ │ Premium Gate: Check premiumFeatures                  │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ CARD 7: PackagingCard                                    │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ Check: product.packaging_data.items exists?         │  │ │
│  │ │ If YES: Show packaging info with badges            │  │ │
│  │ │ If NO:  Return null (don't render)                 │  │ │
│  │ │ Premium Gate: Check premiumFeatures                │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ CARD 8: AllergensCard                                     │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ Check: product.allergens_tags OR additives_tags?    │  │ │
│  │ │ If YES: Show allergens/additives with warnings      │  │ │
│  │ │ If NO:  Return null (don't render)                   │  │ │
│  │ │ Premium Gate: Check premiumFeatures                  │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ CARD 9: ProcessingCard                                   │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ Check: product.nova_group exists?                    │  │ │
│  │ │ If YES: Show NOVA group (1-4) with color            │  │ │
│  │ │ If NO:  Return null (don't render)                   │  │ │
│  │ │ Premium Gate: Check premiumFeatures                  │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ CARD 10: CountryCard                                      │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ Check: product exists?                                │  │ │
│  │ │ Extract: extractManufacturingCountry(product)          │  │ │
│  │ │ Fetch: User-contributed country (if needed)          │  │ │
│  │ │ Always: Show country card (even if "Unknown")        │  │ │
│  │ │ Premium Gate: Check premiumFeatures                   │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ CARD 11: CertificationsCard                               │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ Check: product.labels_tags OR certifications?       │  │ │
│  │ │ If YES: Show certification badges                    │  │ │
│  │ │ If NO:  Return null (don't render)                   │  │ │
│  │ │ Premium Gate: Check premiumFeatures                  │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ CARD 12: PricingCard                                      │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ Always: Show pricing card                           │  │ │
│  │ │ Fetch: Prices from store APIs (background)          │  │ │
│  │ │ Show: Loading state while fetching                  │  │ │
│  │ │ Show: Prices when available                         │  │ │
│  │ │ Premium Gate: Check premiumFeatures                  │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Card Decision Tree

### **Every Card Follows This Pattern:**

```
Card Component Renders
    ↓
Check: Product exists?
    ├─ NO → Return null (don't render)
    └─ YES → Continue
        ↓
Check: Required data exists?
    ├─ NO → Return null (don't render)
    └─ YES → Continue
        ↓
Wrap in CardPremiumGate
    ↓
Check: Premium features enabled?
    ├─ NO → Show upgrade prompt
    └─ YES → Continue
        ↓
Render Card Content
    ├─ Loading → Show Skeleton
    ├─ Error → Show Error Component
    └─ Success → Show Card Content
```

---

## Premium Gating Flow

```
CardPremiumGate Component
    ↓
Check: All premiumFeatures enabled?
    ├─ YES → Show card content
    └─ NO → Show upgrade prompt
        ↓
User clicks upgrade
    ↓
Navigate to Subscription screen
    ↓
User subscribes
    ↓
Card content becomes visible
```

---

## Card State Management

### **Each Card Has 3 States:**

1. **Loading State**:
   - Shows `<CardSkeleton />`
   - While data is being fetched/calculated
   - Progressive loading (cards load independently)

2. **Error State**:
   - Shows `<CardError />`
   - If error occurs in card
   - Isolated (doesn't affect other cards)

3. **Content State**:
   - Shows actual card content
   - When data is ready
   - Fully interactive

---

## Data Flow Per Card

### **TruScoreCard**:
```
useProductData() → product
    ↓
useTruScoreData() → calculates TruScore
    ↓
TruScoreCard displays score, breakdown, flags
```

### **EcoScoreCard**:
```
useProductData() → product
    ↓
calculateEcoScore(product) → ecoScore
    ↓
EcoScoreCard displays grade, score
```

### **NutritionCard**:
```
useProductData() → product.nutriments
    ↓
NutritionCard displays nutrition table
```

### **PalmOilCard**:
```
useProductData() → product.palm_oil_analysis
    ↓
getPalmOilStatus(analysis) → status
    ↓
PalmOilCard displays flag
```

### **PricingCard**:
```
useProductData() → productName
    ↓
Fetch prices from store APIs (background)
    ↓
PricingCard displays prices when available
```

---

## Card Rendering Priority

Cards are rendered in this order (top to bottom):

1. **RecallsCard** (Critical - safety)
2. **TruScoreCard** (Primary - always shown)
3. **Insights** (Related to TruScore)
4. **EcoScoreCard** (Environmental)
5. **NutritionCard** (Health)
6. **PalmOilCard** (Ethical)
7. **PackagingCard** (Environmental)
8. **AllergensCard** (Safety)
9. **ProcessingCard** (Health)
10. **CountryCard** (Transparency)
11. **CertificationsCard** (Quality)
12. **PricingCard** (Utility)

---

## Error Handling Flow

```
Card Component
    ↓
ErrorBoundary wraps card
    ↓
Error occurs
    ↓
ErrorBoundary catches error
    ↓
Shows CardError component
    ↓
User can:
    • Retry (reload card)
    • Continue (other cards still work)
```

---

## Summary

The Product Information page uses a **modular card architecture** where:

1. **Data flows** from `useProductData()` to cards
2. **Cards render** conditionally based on data
3. **Premium gating** is at the card level
4. **Error handling** is isolated per card
5. **Loading states** use skeletons
6. **Cards are independent** and reusable

This ensures a **robust, maintainable, and user-friendly** product information display.

