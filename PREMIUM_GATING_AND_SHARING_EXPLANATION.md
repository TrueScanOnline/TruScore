# Premium Gating & Sharing Module - Detailed User Experience Guide

**Date:** December 1, 2025  
**Purpose:** Explain exactly what is complete and how it functions in practice for users

---

## 1. ✅ Premium Gating - Complete Implementation

### What is Complete?

**Card-Level Premium Gating** is fully implemented and functional. This means:

1. ✅ **CardPremiumGate Component** - A reusable component that wraps any card
2. ✅ **Premium Feature Checking** - Checks user's subscription status
3. ✅ **Upgrade Prompts** - Shows upgrade UI when premium features are locked
4. ✅ **All 11 Cards Integrated** - Every card can have premium features
5. ✅ **Flexible Configuration** - Each card can have different premium features

---

### How It Works in Practice

#### **For Free Users:**

**Scenario 1: Card with Premium Features (Locked)**
```
User scans a product → Views TruScore Card
↓
Card has premiumFeatures={['enhanced_insights']}
↓
CardPremiumGate checks: Is user premium? → NO
↓
CardPremiumGate shows:
  ┌─────────────────────────────┐
  │   [⭐ Icon]                  │
  │   Enhanced Insights         │
  │                             │
  │   Detailed TruScore         │
  │   breakdown, advanced       │
  │   nutrition analytics, and  │
  │   personalized              │
  │   recommendations           │
  │                             │
  │   [⭐ Upgrade to Premium]    │
  └─────────────────────────────┘
```

**What the user sees:**
- A card with an icon (e.g., analytics icon for "Enhanced Insights")
- Title: "Enhanced Insights" (or feature name)
- Description explaining what they're missing
- "Upgrade to Premium" button
- Tapping the button navigates to Subscription screen

**Scenario 2: Card with No Premium Features (Unlocked)**
```
User scans a product → Views Nutrition Card
↓
Card has premiumFeatures={[]} (empty array)
↓
CardPremiumGate checks: Is user premium? → Doesn't matter
↓
CardPremiumGate shows: Full card content (no gate)
```

**What the user sees:**
- Full nutrition information
- No premium gate
- All features accessible

---

#### **For Premium Users:**

**Scenario: Card with Premium Features (Unlocked)**
```
User scans a product → Views TruScore Card
↓
Card has premiumFeatures={['enhanced_insights']}
↓
CardPremiumGate checks: Is user premium? → YES
↓
CardPremiumGate shows: Full card content (no gate)
```

**What the user sees:**
- Full TruScore card with all features
- Enhanced insights visible
- No upgrade prompts
- All premium features accessible

---

### Technical Implementation

#### **1. CardPremiumGate Component**

```typescript
// Location: src/features/premium/CardPremiumGate.tsx

// How it works:
1. Receives array of premium features: features={['enhanced_insights']}
2. Checks subscription status from useSubscriptionStore
3. If ALL features enabled → Shows children (card content)
4. If ANY feature disabled → Shows upgrade UI
```

**Key Features:**
- ✅ Checks multiple features (all must be enabled)
- ✅ Shows feature-specific icon and description
- ✅ Upgrade button navigates to Subscription screen
- ✅ Customizable fallback content
- ✅ Theme-aware (dark/light mode)

#### **2. Integration in Cards**

**Example: TruScoreCard**
```typescript
// Location: src/features/product/cards/TruScoreCard/TruScoreCard.tsx

<TruScoreCard
  barcode={barcode}
  product={product}
  premiumFeatures={['enhanced_insights']} // ← Premium features for this card
/>

// Inside the card:
<CardPremiumGate features={premiumFeatures || []}>
  {/* Full card content here */}
  <TouchableOpacity>
    <Text>TruScore: {truScore.truscore}/100</Text>
    {/* Enhanced insights only visible if premium */}
  </TouchableOpacity>
</CardPremiumGate>
```

**All 11 Cards Support Premium Gating:**
- ✅ TruScoreCard - Can gate enhanced insights
- ✅ EcoScoreCard - Can gate detailed analysis
- ✅ NutritionCard - Can gate advanced nutrition
- ✅ PalmOilCard - Can gate detailed analysis
- ✅ PackagingCard - Can gate sustainability details
- ✅ AllergensCard - Can gate detailed allergen info
- ✅ ProcessingCard - Can gate NOVA analysis
- ✅ RecallsCard - Can gate recall history
- ✅ CountryCard - Can gate manufacturing details
- ✅ CertificationsCard - Can gate certification details
- ✅ PricingCard - Can gate pricing trends

#### **3. Premium Feature Definitions**

```typescript
// Location: src/utils/premiumFeatures.ts

export enum PremiumFeature {
  ENHANCED_INSIGHTS = 'enhanced_insights',
  OFFLINE_MODE = 'offline_mode',
  UNLIMITED_HISTORY = 'unlimited_history',
  ADVANCED_SEARCH = 'advanced_search',
  EXPORT_DATA = 'export_data',
  AD_FREE = 'ad_free',
  // ... more features
}
```

**Each feature has:**
- Title (e.g., "Enhanced Insights")
- Description (what user gets)
- Icon (for UI display)

---

### User Experience Flow

#### **Free User Journey:**

1. **User scans product** → Product result page loads
2. **TruScore Card loads** → Has `premiumFeatures={['enhanced_insights']}`
3. **CardPremiumGate checks** → User is NOT premium
4. **Upgrade UI shown** → User sees:
   - Icon (analytics icon)
   - Title: "Enhanced Insights"
   - Description: "Detailed TruScore breakdown..."
   - Button: "⭐ Upgrade to Premium"
5. **User taps button** → Navigates to Subscription screen
6. **User subscribes** → Returns to product page
7. **Card reloads** → Now shows full content (premium unlocked)

#### **Premium User Journey:**

1. **User scans product** → Product result page loads
2. **TruScore Card loads** → Has `premiumFeatures={['enhanced_insights']}`
3. **CardPremiumGate checks** → User IS premium
4. **Full card shown** → All features visible, no gate

---

### Configuration Examples

**Example 1: Single Premium Feature**
```typescript
<TruScoreCard
  premiumFeatures={['enhanced_insights']} // One feature
/>
```

**Example 2: Multiple Premium Features**
```typescript
<TruScoreCard
  premiumFeatures={['enhanced_insights', 'export_data']} // Multiple features
/>
// User needs BOTH features to see content
```

**Example 3: No Premium Features**
```typescript
<NutritionCard
  premiumFeatures={[]} // Empty = always visible
/>
```

---

## 2. ✅ Sharing Module - Complete Implementation

### What is Complete?

**Multi-Platform Sharing** is fully implemented and functional. This means:

1. ✅ **ShareService** - Unified sharing service
2. ✅ **6 Platform Implementations** - Facebook, Instagram, Twitter, Snapchat, TikTok, YouTube
3. ✅ **Platform-Optimized Content** - Each platform gets optimized content
4. ✅ **Share Content Builder** - Builds different content for different share types
5. ✅ **Native Share Fallback** - Falls back to native share sheet
6. ✅ **All Cards Integrated** - Every card can share its content

---

### How It Works in Practice

#### **For Users:**

**Scenario 1: Sharing TruScore**
```
User views TruScore Card → Taps Share button
↓
ShareService.share() called with:
  - product: Product data
  - truScore: TruScore data
  - item: 'truScore'
  - platform: 'native' (or specific platform)
↓
ShareContentBuilder builds content:
  Title: "Check out 'Product Name' on TrueScan!"
  Message: "TruScore: 75/100 (Good)
            Body: 20/25 | Planet: 15/25 | Care: 20/25 | Open: 20/25
            Barcode: 1234567890
            [Share URL]
            Scan with TrueScan: [Deep Link]"
  URL: Share URL
  Image: Product image
  Hashtags: ['TrueScan', 'TruScore', 'FoodScanner']
↓
Native share sheet opens (or platform-specific share)
↓
User selects platform → Content shared
```

**What the user sees:**
1. Share button (📤 icon) on card
2. Taps share button
3. Native share sheet opens (iOS/Android)
4. User selects platform (e.g., Facebook, WhatsApp, Email, etc.)
5. Pre-filled content appears:
   - Title: "Check out 'Product Name' on TrueScan!"
   - Message with TruScore details
   - Product image (if available)
   - Share URL
6. User can edit content before sharing
7. User taps "Share" → Content shared to selected platform

**Scenario 2: Sharing Food Recall Alert**
```
User views Recalls Card → Taps Share button
↓
ShareService.share() called with:
  - product: Product data
  - item: 'recall'
↓
ShareContentBuilder builds recall-specific content:
  Title: "⚠️ Food Recall Alert: Product Name"
  Message: "1 recall found for this product.
            Reason: [Recall reason]
            Date: [Recall date]
            [Share URL]
            Check details in TrueScan: [Deep Link]"
  Hashtags: ['FoodRecall', 'ProductSafety', 'TrueScan']
↓
Native share sheet opens
↓
User shares recall alert
```

**Scenario 3: Sharing Country of Manufacture**
```
User views Country Card → Taps Share button
↓
ShareService.share() called with:
  - product: Product data
  - item: 'countryOfManufacture'
↓
ShareContentBuilder builds country-specific content:
  Title: "Product Name - Made in [Country]"
  Message: "This product is manufactured in [Country].
            [Country-specific information]
            [Share URL]"
↓
Native share sheet opens
↓
User shares country information
```

---

### Technical Implementation

#### **1. ShareService**

```typescript
// Location: src/features/sharing/services/ShareService.ts

// How it works:
ShareService.share({
  product: productData,
  truScore: truScoreData,
  item: 'truScore', // or 'recall', 'countryOfManufacture', etc.
  platform: 'native' // or 'facebook', 'instagram', etc.
})
```

**Process:**
1. Receives share options (product, item type, platform)
2. Builds content using ShareContentBuilder
3. Optimizes content for platform
4. Shares to platform (or native share sheet)

#### **2. ShareContentBuilder**

```typescript
// Location: src/features/sharing/services/ShareContentBuilder.ts

// Builds different content for different share types:
- 'truScore' → TruScore-specific content
- 'recall' → Recall alert content
- 'countryOfManufacture' → Country information content
- 'negativeTruScore' → Negative score content
- 'productInfo' → General product information
```

**Content Includes:**
- Title (platform-optimized)
- Message (with relevant details)
- URL (share URL)
- Image URL (product image)
- Hashtags (platform-appropriate)

#### **3. Platform Implementations**

**All 6 Platforms Implemented:**

1. **Facebook** (`facebook.ts`)
   - Uses Facebook Share Dialog URL
   - Falls back to native share

2. **Instagram** (`instagram.ts`)
   - Uses Instagram deep links
   - Falls back to native share

3. **Twitter/X** (`twitter.ts`)
   - Uses Twitter Share URL
   - Falls back to native share

4. **Snapchat** (`snapchat.ts`)
   - Uses Snapchat Creative Kit
   - Falls back to native share

5. **TikTok** (`tiktok.ts`)
   - Uses TikTok Share deep links
   - Falls back to native share

6. **YouTube** (`youtube.ts`)
   - Uses YouTube Data API
   - Falls back to native share

**All platforms:**
- ✅ Try platform-specific sharing first
- ✅ Fall back to native share sheet if platform not available
- ✅ Handle errors gracefully
- ✅ Return success/failure status

#### **4. Integration in Cards**

**Example: TruScoreCard**
```typescript
// Location: src/features/product/cards/TruScoreCard/TruScoreCard.tsx

<TruScoreCard
  barcode={barcode}
  product={product}
  onShare={() => handleShare('truScore')} // ← Share handler
/>

// In result page:
const handleShare = async (item: ShareableItem) => {
  const result = await ShareService.share({
    product,
    truScore: truScore || undefined,
    item,
    platform: 'native', // or specific platform
  });
  
  if (result.success) {
    Toast.show({ type: 'success', text1: 'Shared successfully!' });
  }
};
```

**All 11 Cards Support Sharing:**
- ✅ TruScoreCard - Shares TruScore
- ✅ EcoScoreCard - Shares Eco-Score
- ✅ NutritionCard - Shares nutrition info
- ✅ PalmOilCard - Shares palm oil analysis
- ✅ PackagingCard - Shares packaging info
- ✅ AllergensCard - Shares allergen info
- ✅ ProcessingCard - Shares processing level
- ✅ RecallsCard - Shares recall alerts
- ✅ CountryCard - Shares country of manufacture
- ✅ CertificationsCard - Shares certifications
- ✅ PricingCard - Shares pricing info

---

### User Experience Flow

#### **Sharing Journey:**

1. **User views product** → Product result page loads
2. **User views card** → Sees share button (📤 icon)
3. **User taps share button** → `onShare()` handler called
4. **ShareService.share()** → Builds content, opens share sheet
5. **Native share sheet opens** → Shows all available platforms
6. **User selects platform** → (e.g., Facebook, WhatsApp, Email)
7. **Pre-filled content appears** → User can edit
8. **User taps "Share"** → Content shared
9. **Success message** → "Shared successfully!" toast

#### **Platform-Specific Sharing:**

**If user selects Facebook:**
- Facebook app opens (if installed)
- Share dialog pre-filled with content
- User can edit and share

**If user selects WhatsApp:**
- WhatsApp opens (if installed)
- Message pre-filled with content
- User can edit and send

**If user selects Email:**
- Email app opens
- Email pre-filled with content
- User can edit and send

---

### Share Content Examples

#### **TruScore Share:**
```
Title: "Check out 'Panko Bread Crumbs' on TrueScan!"

Message:
Check out "Panko Bread Crumbs" on TrueScan!

TruScore: 49/100 (Fair)
Body: 7/25 | Planet: 12/25 | Care: 15/25 | Open: 15/25

Barcode: 9310432003212

https://truscore.app/product/9310432003212

Scan with TrueScan: truescan://product/9310432003212

#TrueScan #TruScore #FoodScanner #ProductScan
```

#### **Recall Alert Share:**
```
Title: "⚠️ Food Recall Alert: Product Name"

Message:
⚠️ Food Recall Alert: Product Name

1 recall found for this product.

Reason: [Recall reason]
Date: [Recall date]

https://truscore.app/product/1234567890

Check details in TrueScan: truescan://product/1234567890

#FoodRecall #ProductSafety #TrueScan
```

---

## Summary

### ✅ Premium Gating - Complete

**What works:**
- ✅ Card-level premium gating functional
- ✅ All 11 cards support premium features
- ✅ Upgrade prompts show when features locked
- ✅ Premium users see full content
- ✅ Free users see upgrade prompts

**User experience:**
- Free users see upgrade UI when premium features are locked
- Premium users see full content without gates
- Upgrade button navigates to subscription screen

### ✅ Sharing Module - Complete

**What works:**
- ✅ 6 platforms implemented (Facebook, Instagram, Twitter, Snapchat, TikTok, YouTube)
- ✅ Native share sheet fallback
- ✅ Platform-optimized content
- ✅ All 11 cards support sharing
- ✅ Different content for different share types

**User experience:**
- Users tap share button on any card
- Native share sheet opens with pre-filled content
- Users select platform and share
- Content is optimized for each platform

---

**Both systems are fully functional and ready for production use!**

