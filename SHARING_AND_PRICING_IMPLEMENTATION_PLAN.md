# Sharing & Pricing Implementation Plan

## Current Issues

### 1. Pricing Function
- ❌ Only works for NZ (returns nil for other countries)
- ❌ No Google search fallback when prices unavailable
- ❌ No modal/popup for Google search results
- ❌ Limited to Vercel backend only

### 2. Sharing Function
- ⚠️ Basic text-based sharing (not optimized for viral growth)
- ⚠️ No visual share cards
- ⚠️ No direct social media posting
- ⚠️ Content not engaging enough for viral sharing

---

## Implementation Strategy

### Phase 1: Pricing Function Fix (Priority 1)

1. **Create Universal Pricing Card**
   - Works for all countries (not just NZ)
   - Shows local store prices when available
   - Falls back to Google search when no prices found

2. **Google Search Fallback Modal**
   - "Check pricing on Google" button
   - Modal with WebView showing Google search results
   - Geolocation-based search query
   - Product name + location context

3. **Enhanced Pricing Service**
   - Multi-country support
   - Better error handling
   - Cache management

### Phase 2: Viral Sharing System (Priority 2)

1. **Visual Share Card Generator**
   - Generate beautiful image cards
   - TruScore visualization
   - Product image
   - QR code for easy scanning
   - Brand colors and styling

2. **Enhanced Share Content**
   - Platform-specific optimizations
   - Engaging hooks and CTAs
   - Hashtag strategies
   - Story templates

3. **Direct Social Media Integration**
   - Native sharing APIs
   - Deep linking
   - Share analytics

---

## Files to Create/Modify

### Pricing:
- `src/components/UniversalPricingCard.tsx` (NEW)
- `src/components/GoogleSearchPricingModal.tsx` (NEW)
- `src/services/pricingService.ts` (MODIFY)
- `app/result/[barcode].tsx` (MODIFY - replace GlobalPricingCard)

### Sharing:
- `src/components/ShareCardGenerator.tsx` (NEW)
- `src/features/sharing/services/ShareContentBuilder.ts` (ENHANCE)
- `src/features/sharing/services/ShareService.ts` (ENHANCE)
- `src/components/ShareModal.tsx` (NEW - platform picker)
- `src/utils/shareAnalytics.ts` (NEW)

---

## Next Steps

Starting implementation now...
