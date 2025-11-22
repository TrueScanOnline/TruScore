# Pricing System Rebuild Plan

## Problem Analysis

### Current Issues (From Logs)
1. **Compressed/Binary HTML**: Sites return compressed HTML that's unreadable (`AT^в/aM5`)
2. **JavaScript-Rendered Content**: Sites use React/Next.js - products loaded via JS, not in initial HTML
3. **Product Matching Fails**: "Product name 'Minced garlic' NOT found in HTML" - because it's not in the HTML we receive
4. **Wrong Prices Extracted**: When product matching fails, we extract prices from random products on the page
5. **No PricePatterns Found**: "PricePatterns=false" - our patterns don't match the actual HTML structure

### Root Cause
**Modern e-commerce sites (Woolworths, Countdown, New World, etc.) are Single Page Applications (SPAs) that:**
- Load content via JavaScript after initial page load
- Use compressed/minified HTML
- Require browser execution to render product listings
- Don't expose product data in initial HTML response

## Solution Options

### Option 1: Product Detail Page URLs (Recommended)
**Strategy**: Instead of scraping search results, try to construct direct product detail page URLs using barcode.

**Pros**:
- Product detail pages often have simpler HTML structure
- May contain JSON-LD or meta tags with product data
- Less likely to be compressed (static product pages)

**Cons**:
- Need to know URL structure for each store
- Some stores may not support direct barcode URLs

**Implementation**:
- Try barcode-based URLs first (already partially implemented)
- If that fails, fall back to search
- Extract from product detail page instead of search results

### Option 2: Accept Limited Functionality
**Strategy**: Only show prices when we can definitively match the product.

**Pros**:
- No wrong data
- Honest with users

**Cons**:
- Many products won't have prices
- Poor user experience

### Option 3: Use Third-Party Price APIs
**Strategy**: Integrate with price comparison APIs or grocery APIs.

**Pros**:
- Reliable data
- No scraping needed

**Cons**:
- Cost (APIs usually cost money)
- May not have all stores/countries
- May not have all products

### Option 4: User-Submitted Prices (Hybrid)
**Strategy**: Allow users to submit prices, build a database over time.

**Pros**:
- Community-driven
- Accurate (users verify)
- No scraping needed

**Cons**:
- Slow to build database
- Requires user participation
- Need moderation

## Recommended Approach: Hybrid Solution

### Phase 1: Improve Product Detail Page Scraping
1. **Prioritize barcode direct URLs** - Try these first for all stores
2. **Better HTML decompression** - Handle compressed HTML properly
3. **Extract from product detail pages** - Not search results
4. **Strict product matching** - Only return prices if we're 100% sure it's the right product

### Phase 2: Add User Price Submission
1. **"Submit Store Price" button** (already exists in UI)
2. **Store user-submitted prices** in database
3. **Show user-submitted prices** alongside scraped prices
4. **Verify user submissions** (check for duplicates, outliers)

### Phase 3: Fallback to Search (Last Resort)
1. **Only if product detail page fails**
2. **Strict validation** - Require high confidence match
3. **Return null if uncertain** - Better than wrong data

## Immediate Actions

1. **Fix HTML Decompression**: Properly handle gzip/deflate compressed responses
2. **Prioritize Product Detail Pages**: Try barcode URLs first, search last
3. **Stricter Validation**: Only return prices if product name/barcode matches
4. **Better Error Handling**: Return null instead of wrong prices
5. **Add Logging**: Show why prices were/weren't found

## Code Changes Needed

1. **`corsProxy.ts`**: Add proper decompression handling
2. **`productSpecificScraping.ts`**: Prioritize product detail pages
3. **`pricingService.ts`**: Stricter validation before returning prices
4. **New service**: User price submission storage

## Success Criteria

- ✅ No wrong prices shown
- ✅ Prices only shown when product is definitively matched
- ✅ Product detail pages work better than search results
- ✅ User can submit prices when scraping fails


