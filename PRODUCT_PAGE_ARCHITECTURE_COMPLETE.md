# Product Information Page Architecture - Complete Guide

## Overview

The Product Information page (`app/result/[barcode].refactored.tsx`) uses a **modular card-based architecture** where each piece of information is displayed in its own independent, reusable card component. This architecture ensures:

- ✅ **Modularity**: Each card is self-contained
- ✅ **Reusability**: Cards can be used in different contexts
- ✅ **Error Isolation**: Cards have error boundaries
- ✅ **Progressive Loading**: Cards show skeletons while loading
- ✅ **Premium Gating**: Cards can be gated at the card level
- ✅ **Data Independence**: Cards can fetch their own data or receive via props

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Product Information Page                       │
│         (app/result/[barcode].refactored.tsx)              │
└──────────────────────┬────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Data Loading                                        │
│  • useProductData() hook                                     │
│  • Fetches product from all databases                        │
│  • Calculates TruScore                                       │
│  • Returns: product, truScore, loading, error                │
└──────────────────────┬────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Page Layout                                         │
│  • Hero Section (image, name, brand)                         │
│  • ScrollView container                                      │
│  • Cards rendered in order                                   │
└──────────────────────┬────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Card Rendering (Sequential)                         │
│  • Each card checks if it should render                      │
│  • Cards wrap content in CardPremiumGate                     │
│  • Cards handle their own loading/error states                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Card Rendering Order

Cards are rendered in this **exact order** on the page:

1. **RecallsCard** (Banner - shown at top if recalls exist)
2. **TruScoreCard** (Always shown if product exists)
3. **Insights Carousel** (If TruScore has insights)
4. **Values Preferences Card** (Navigation card)
5. **EcoScoreCard** (If Eco-Score data exists)
6. **NutritionCard** (If nutrition data exists)
7. **PalmOilCard** (If palm oil analysis exists)
8. **PackagingCard** (If packaging data exists)
9. **AllergensCard** (If allergens/additives exist)
10. **ProcessingCard** (If NOVA group exists)
11. **CountryCard** (Always shown)
12. **CertificationsCard** (If certifications exist)
13. **PricingCard** (Always shown)

---

## 🎯 Card Architecture Pattern

Every card follows the **same architecture pattern**:

### **1. Component Structure**

```typescript
// Card Component (Exported)
export default function CardName(props: CardProps) {
  return (
    <ErrorBoundary feature="CardName">
      <Suspense fallback={<CardSkeleton />}>
        <CardContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Card Content (Internal)
function CardContent({ product, onShare, premiumFeatures }: CardProps) {
  // 1. Check if card should render (data check)
  if (!product || !product.requiredData) {
    return null; // Don't render if no data
  }

  // 2. Wrap in premium gate
  return (
    <CardPremiumGate features={premiumFeatures || []}>
      <View style={styles.card}>
        {/* Card content */}
      </View>
    </CardPremiumGate>
  );
}
```

### **2. Three States Per Card**

Every card has **three states**:

1. **Loading State**: `<CardSkeleton />` (shown while loading)
2. **Error State**: `<CardError />` (shown if error occurs)
3. **Content State**: Actual card content (shown when data ready)

### **3. Error Boundary**

Each card is wrapped in `<ErrorBoundary>` to prevent one card's error from crashing the entire page.

### **4. Suspense Boundary**

Each card uses `<Suspense>` with a skeleton fallback for progressive loading.

---

## 📋 Individual Card Logic

### **1. TruScoreCard** 🛡️

**Location**: `src/features/product/cards/TruScoreCard/TruScoreCard.tsx`

**Data Source**: 
- Props: `product` (from `useProductData`)
- Hook: `useTruScoreData()` (calculates TruScore from product)

**Rendering Logic**:
```typescript
if (loading) return <TruScoreCardSkeleton />;
if (error) return <TruScoreCardError />;
if (!truScore) return <InsufficientDataCard />;
// Otherwise: Show TruScore card with score, breakdown, flags
```

**Features**:
- Shows TruScore (0-100) with color coding
- Shows breakdown by pillar (Body, Planet, Care, Open)
- Shows green/red flags
- Favorite button
- Share button
- Info modal (explains TruScore)
- Border color based on score

**Premium Gating**: None (always visible)

---

### **2. EcoScoreCard** 🌿

**Location**: `src/features/product/cards/EcoScoreCard/EcoScoreCard.tsx`

**Data Source**: 
- Props: `product`
- Calculates: `calculateEcoScore(product)`

**Rendering Logic**:
```typescript
if (!product) return null;
const ecoScore = calculateEcoScore(product);
if (!ecoScore || ecoScore.score <= 0) return null; // Don't show if no data
// Otherwise: Show Eco-Score card
```

**Features**:
- Shows Eco-Score grade (A-E) with color
- Shows score (0-100)
- Border color based on grade
- Info modal (explains Eco-Score)
- Share button

**Premium Gating**: Configurable via `premiumFeatures` prop

---

### **3. NutritionCard** 🍎

**Location**: `src/features/product/cards/NutritionCard/NutritionCard.tsx`

**Data Source**: 
- Props: `product.nutriments`

**Rendering Logic**:
```typescript
if (!product || !product.nutriments) return null; // Don't show if no nutrition data
// Otherwise: Show nutrition table
```

**Features**:
- Shows nutrition table (per 100g)
- Shows nutrient levels (low/medium/high)
- Shows serving size if available
- Share button

**Premium Gating**: Configurable via `premiumFeatures` prop

---

### **4. PalmOilCard** 🏴

**Location**: `src/features/product/cards/PalmOilCard/PalmOilCard.tsx`

**Data Source**: 
- Props: `product.palm_oil_analysis`

**Rendering Logic**:
```typescript
if (!product || !product.palm_oil_analysis) return null; // Don't show if no analysis
const status = getPalmOilStatus(product.palm_oil_analysis);
if (!status) return null; // Don't show if status invalid
// Otherwise: Show palm oil card with flag
```

**Features**:
- Shows palm oil status (🟢 Free / 🟠 Contains / 🔴 Non-Sustainable)
- Border color based on flag (green/orange/red)
- Info modal (explains palm oil)
- Share button

**Premium Gating**: Configurable via `premiumFeatures` prop

---

### **5. PackagingCard** 📦

**Location**: `src/features/product/cards/PackagingCard/PackagingCard.tsx`

**Data Source**: 
- Props: `product.packaging_data`

**Rendering Logic**:
```typescript
if (!product || !product.packaging_data || product.packaging_data.items.length === 0) {
  return null; // Don't show if no packaging data
}
// Otherwise: Show packaging card
```

**Features**:
- Shows packaging items (materials, recyclability)
- Shows badges (Recyclable, Reusable, Biodegradable)
- Border color based on local recycling requirements
- Info modal (explains packaging)
- Share button

**Premium Gating**: Configurable via `premiumFeatures` prop

---

### **6. AllergensCard** ⚠️

**Location**: `src/features/product/cards/AllergensCard/AllergensCard.tsx`

**Data Source**: 
- Props: `product.allergens_tags`, `product.additives_tags`

**Rendering Logic**:
```typescript
if (!product || (!product.allergens_tags && !product.additives_tags)) {
  return null; // Don't show if no allergens or additives
}
// Otherwise: Show allergens/additives card
```

**Features**:
- Shows allergens (if present) with warning
- Shows additives (if present) with count
- Red border if allergens detected
- Info modal (explains allergens/additives)
- Share button

**Premium Gating**: Configurable via `premiumFeatures` prop

---

### **7. ProcessingCard** ⚙️

**Location**: `src/features/product/cards/ProcessingCard/ProcessingCard.tsx`

**Data Source**: 
- Props: `product.nova_group`

**Rendering Logic**:
```typescript
if (!product || !product.nova_group) return null; // Don't show if no NOVA group
// Otherwise: Show processing level card
```

**Features**:
- Shows NOVA group (1-4) with color coding
- Shows processing level description
- Border color based on NOVA group
- Info modal (explains NOVA groups)
- Share button

**Premium Gating**: Configurable via `premiumFeatures` prop

---

### **8. RecallsCard** 🚨

**Location**: `src/features/product/cards/RecallsCard/RecallsCard.tsx`

**Data Source**: 
- Props: `product.recalls`

**Rendering Logic**:
```typescript
if (!product || !product.recalls || product.recalls.length === 0) {
  return null; // Don't show if no recalls
}
// Otherwise: Show recall banner (not a card)
```

**Features**:
- Shows as **banner** (not card) at top of page
- Red warning style
- Shows recall count
- Click to open recall modal
- Share button

**Premium Gating**: None (always visible if recalls exist)

---

### **9. CountryCard** 🌍

**Location**: `src/features/product/cards/CountryCard/CountryCard.tsx`

**Data Source**: 
- Props: `product.origins_tags`, `product.manufacturing_places_tags`
- Fetches: Country data from APIs

**Rendering Logic**:
```typescript
// Always shown (even if no data, shows "Unknown")
// Fetches country data if not in product
```

**Features**:
- Shows country of origin
- Shows manufacturing country
- Shows flags
- Opens modal for country selection (if user wants to contribute)
- Share button

**Premium Gating**: Configurable via `premiumFeatures` prop

---

### **10. CertificationsCard** ✅

**Location**: `src/features/product/cards/CertificationsCard/CertificationsCard.tsx`

**Data Source**: 
- Props: `product.labels_tags`, `product.certifications`

**Rendering Logic**:
```typescript
if (!product || (!product.labels_tags && !product.certifications)) {
  return null; // Don't show if no certifications
}
// Otherwise: Show certifications card
```

**Features**:
- Shows certification badges (Organic, Fair Trade, etc.)
- Shows labels (Vegan, Gluten-Free, etc.)
- Grid layout for badges
- Share button

**Premium Gating**: Configurable via `premiumFeatures` prop

---

### **11. PricingCard** 💰

**Location**: `src/features/product/cards/PricingCard/PricingCard.tsx`

**Data Source**: 
- Props: `barcode`, `productName`
- Fetches: Prices from store APIs (NZ Stores, AU Retailers, etc.)

**Rendering Logic**:
```typescript
// Always shown (fetches prices in background)
// Shows loading state while fetching
```

**Features**:
- Shows prices from multiple stores
- Location-specific (NZ/AU stores)
- Shows specials/regular prices
- Links to store websites
- Share button

**Premium Gating**: Configurable via `premiumFeatures` prop

---

## 🔒 Premium Gating Architecture

### **CardPremiumGate Component**

**Location**: `src/features/premium/CardPremiumGate.tsx`

**Purpose**: Wraps card content and shows upgrade prompt if premium features not enabled

**Logic**:
```typescript
// Check if all premium features are enabled
const allEnabled = features.every(feature => 
  isPremiumFeatureEnabled(feature, subscriptionInfo)
);

if (allEnabled) {
  return <>{children}</>; // Show card content
}

// Otherwise: Show upgrade prompt
return <UpgradePrompt />;
```

**Features**:
- Supports multiple premium features per card
- Shows upgrade button
- Navigates to subscription screen
- Customizable fallback content

**Usage**:
```typescript
<CardPremiumGate features={['premium_feature_1', 'premium_feature_2']}>
  <CardContent />
</CardPremiumGate>
```

---

## 📊 Data Flow Architecture

### **Step 1: Page Loads**

```
User navigates to Result screen
    ↓
useProductData() hook called
    ↓
Fetches product from all databases
    ↓
Calculates TruScore
    ↓
Returns: { product, truScore, loading, error }
```

### **Step 2: Cards Render**

```
Product data available
    ↓
Each card component renders
    ↓
Card checks if it should render (data check)
    ↓
Card wraps content in CardPremiumGate
    ↓
Card displays content or skeleton/error
```

### **Step 3: Card-Specific Data**

Some cards fetch additional data:

- **TruScoreCard**: Uses `useTruScoreData()` hook (can recalculate if needed)
- **PricingCard**: Fetches prices from store APIs
- **CountryCard**: Fetches country data if not in product

---

## 🎨 Card Rendering Logic

### **Conditional Rendering Pattern**

Every card follows this pattern:

```typescript
// 1. Check if product exists
if (!product) return null;

// 2. Check if required data exists
if (!product.requiredData) return null;

// 3. Check premium gating
<CardPremiumGate features={premiumFeatures}>
  {/* 4. Render card content */}
</CardPremiumGate>
```

### **Card Visibility Rules**

| Card | Always Shown? | Condition |
|------|---------------|-----------|
| TruScoreCard | ✅ Yes | If product exists |
| RecallsCard | ⚠️ Conditional | Only if recalls exist |
| EcoScoreCard | ❌ No | Only if Eco-Score data exists |
| NutritionCard | ❌ No | Only if nutrition data exists |
| PalmOilCard | ❌ No | Only if palm oil analysis exists |
| PackagingCard | ❌ No | Only if packaging data exists |
| AllergensCard | ❌ No | Only if allergens/additives exist |
| ProcessingCard | ❌ No | Only if NOVA group exists |
| CountryCard | ✅ Yes | Always shown |
| CertificationsCard | ❌ No | Only if certifications exist |
| PricingCard | ✅ Yes | Always shown (fetches in background) |

---

## 🔄 Card Lifecycle

### **1. Initial Render**

```
Card Component Mounts
    ↓
ErrorBoundary wraps component
    ↓
Suspense shows skeleton (if loading)
    ↓
Card checks data availability
    ↓
Card renders content or returns null
```

### **2. Data Updates**

```
Product data changes
    ↓
Cards re-render automatically (React)
    ↓
Cards check new data
    ↓
Cards update or hide if data removed
```

### **3. Error Handling**

```
Error occurs in card
    ↓
ErrorBoundary catches error
    ↓
Shows CardError component
    ↓
User can retry or continue
```

---

## 🎯 Card Component Structure

### **Standard Card Structure**

```typescript
// 1. Imports
import ErrorBoundary from '../../../../components/ErrorBoundary';
import { CardPremiumGate } from '../../../premium/CardPremiumGate';
import { CardSkeleton } from './CardSkeleton';
import { CardError } from './CardError';

// 2. Props Interface
interface CardProps {
  product?: ProductWithTrustScore;
  onShare?: () => void;
  premiumFeatures?: PremiumFeature[];
}

// 3. Card Content Component
function CardContent({ product, onShare, premiumFeatures }: CardProps) {
  // Data check
  if (!product || !product.requiredData) return null;

  return (
    <CardPremiumGate features={premiumFeatures || []}>
      <View style={styles.card}>
        {/* Card header */}
        {/* Card content */}
        {/* Share button */}
      </View>
    </CardPremiumGate>
  );
}

// 4. Exported Card Component
export default function Card(props: CardProps) {
  return (
    <ErrorBoundary feature="CardName">
      <Suspense fallback={<CardSkeleton />}>
        <CardContent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

## 📱 Page Layout Structure

### **Result Screen Layout**

```
┌─────────────────────────────────────┐
│  SafeAreaView (Container)            │
│  ┌───────────────────────────────┐  │
│  │ ScrollView                     │  │
│  │ ┌─────────────────────────┐  │  │
│  │ │ Hero Section              │  │  │
│  │ │ • Product Image           │  │  │
│  │ │ • Product Name            │  │  │
│  │ │ • Brand                   │  │  │
│  │ └─────────────────────────┘  │  │
│  │                                │  │
│  │ ┌─────────────────────────┐  │  │
│  │ │ RecallsCard (Banner)     │  │  │
│  │ └─────────────────────────┘  │  │
│  │                                │  │
│  │ ┌─────────────────────────┐  │  │
│  │ │ TruScoreCard             │  │  │
│  │ └─────────────────────────┘  │  │
│  │                                │  │
│  │ ┌─────────────────────────┐  │  │
│  │ │ Insights Carousel        │  │  │
│  │ └─────────────────────────┘  │  │
│  │                                │  │
│  │ ┌─────────────────────────┐  │  │
│  │ │ Values Preferences Card  │  │  │
│  │ └─────────────────────────┘  │  │
│  │                                │  │
│  │ ┌─────────────────────────┐  │  │
│  │ │ EcoScoreCard             │  │  │
│  │ └─────────────────────────┘  │  │
│  │                                │  │
│  │ ┌─────────────────────────┐  │  │
│  │ │ NutritionCard            │  │  │
│  │ └─────────────────────────┘  │  │
│  │                                │  │
│  │ ... (other cards) ...          │  │
│  │                                │  │
│  │ ┌─────────────────────────┐  │  │
│  │ │ PricingCard             │  │  │
│  │ └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 🔧 Technical Implementation Details

### **1. Props-First Architecture**

Cards use **props-first** approach:
- Prefer data from props (passed from parent)
- Fallback to fetching if props not provided
- Ensures data consistency

### **2. Error Boundaries**

Each card wrapped in `<ErrorBoundary>`:
- Prevents one card's error from crashing page
- Shows error UI for that card only
- Allows user to continue using other cards

### **3. Suspense Boundaries**

Each card uses `<Suspense>`:
- Shows skeleton while loading
- Progressive loading (cards load independently)
- Better UX (no blank screens)

### **4. Premium Gating**

Cards use `<CardPremiumGate>`:
- Card-level premium features
- Multiple features per card
- Upgrade prompts
- Customizable fallback

### **5. Conditional Rendering**

Cards use smart conditional rendering:
- Return `null` if no data (doesn't render)
- Prevents empty cards
- Clean UI (only shows relevant cards)

---

## 📊 Data Dependencies

### **Card Data Requirements**

| Card | Required Data | Optional Data |
|------|---------------|---------------|
| TruScoreCard | `product` | `truScore` (calculated) |
| EcoScoreCard | `product.ecoscore_grade` or calculated | `product.ecoscore_score` |
| NutritionCard | `product.nutriments` | `product.nutrient_levels`, `product.serving_size` |
| PalmOilCard | `product.palm_oil_analysis` | - |
| PackagingCard | `product.packaging_data.items` | `product.packaging_data.isRecyclable` |
| AllergensCard | `product.allergens_tags` OR `product.additives_tags` | - |
| ProcessingCard | `product.nova_group` | - |
| RecallsCard | `product.recalls` | - |
| CountryCard | - | `product.origins_tags`, `product.manufacturing_places_tags` |
| CertificationsCard | `product.labels_tags` OR `product.certifications` | - |
| PricingCard | `barcode`, `productName` | - |

---

## 🎨 Styling Architecture

### **Card Styling**

All cards use consistent styling:
- `borderRadius: 16`
- `padding: 16`
- `margin: 16`
- Shadow/elevation for depth
- Theme-aware colors

### **Border Colors**

Cards use border colors to indicate status:
- **TruScoreCard**: Color based on score (green/yellow/red)
- **EcoScoreCard**: Color based on grade (A-E)
- **PalmOilCard**: Color based on flag (green/orange/red)
- **PackagingCard**: Color based on recyclability
- **AllergensCard**: Red border if allergens detected
- **ProcessingCard**: Color based on NOVA group

---

## ✅ Summary

The Product Information page uses a **modular, card-based architecture** where:

1. **Data flows** from `useProductData()` hook to cards via props
2. **Cards render** conditionally based on data availability
3. **Premium gating** is handled at the card level
4. **Error handling** is isolated per card
5. **Loading states** are handled with skeletons
6. **Cards are independent** and can be used elsewhere

This architecture ensures:
- ✅ **Maintainability**: Easy to add/remove cards
- ✅ **Reliability**: Errors don't crash entire page
- ✅ **Performance**: Progressive loading
- ✅ **Flexibility**: Cards can be reordered/configured
- ✅ **User Experience**: Only relevant cards shown

