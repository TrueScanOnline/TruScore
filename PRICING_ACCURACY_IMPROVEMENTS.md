# Pricing Accuracy Improvements

## Problem Analysis

### Current Issues
1. **Wrong Prices Extracted**: App shows $6-$43 for Branston pickle, but Google shows $10.29 at Woolworths
2. **Missing Stores**: Woolworths not showing in results even though Google shows it has the product
3. **Product Not Found**: Logs show "Product not found in search results" - product matching is failing

### Root Causes
1. **Product Matching Too Strict**: Not finding products in search results
2. **Extracting Wrong Prices**: When product not found, fallback extracts prices from other products on the page
3. **HTML Structure Mismatch**: Patterns don't match actual supermarket website structures
4. **Compressed HTML**: Some sites return compressed/binary HTML that's hard to parse

## Solutions Implemented

### 1. Improved Product Matching
- **More Flexible Keywords**: Now includes 2+ character keywords (not just 3+)
- **Scoring System**: Product cards scored by:
  - Keyword matches (15 points per keyword, requires 2+ matches)
  - Barcode match (100 points)
  - Price indicators (+5 points)
  - Product terms (+3 points)
  - Penalties for navigation/header/footer (-20 points)
- **Multiple Strategies**:
  1. JSON-LD structured data (most reliable)
  2. Product card patterns (flexible HTML matching)
  3. Keyword proximity search (finds section near product name)
  4. Barcode search (if name not found)

### 2. Better Price Extraction
- **Section-Based**: Only extracts prices from the product's specific section
- **Confidence Scoring**: Requires confidence ≥8 for acceptance
- **Price Range Validation**: Only accepts prices $1-$100 (filters out CSS/JS values)
- **Multiple Candidates**: Tries alternative prices if best doesn't meet criteria

### 3. Uncompressed HTML Requests
- **Accept-Encoding: identity**: Requests uncompressed HTML
- **Binary Detection**: Detects and handles compressed/binary HTML
- **Readable Section Extraction**: Extracts readable sections from compressed HTML

### 4. No Wrong Data Policy
- **Return Null Instead of Wrong Prices**: If product not found, return null rather than extracting wrong prices
- **Verified Flag**: Marks prices as verified/unverified based on product matching success

## Current Flow

1. **Product-Specific Scraping** (Primary):
   - Searches for product in HTML
   - Finds product section by barcode/name
   - Extracts price only from that section
   - Returns null if product not found (no wrong data)

2. **Enhanced Scraping** (Fallback):
   - Better pattern matching
   - Multiple user agent attempts
   - JSON-LD extraction

3. **Regular Scraping** (Final Fallback):
   - Standard HTML scraping
   - Basic pattern matching

## Why Prices Are Still Wrong

Based on logs and screenshots:
- **Product matching is failing**: "Product not found in search results"
- **Fallback is extracting wrong prices**: When product not found, fallback extracts prices from other products
- **HTML structure unknown**: We don't know the exact HTML structure of these sites

## Next Steps Needed

### Option 1: Manual HTML Inspection (Recommended)
1. Visit each supermarket website manually
2. Search for a product (e.g., "Branston Small Chunk Pickle")
3. Inspect the HTML structure of the search results
4. Update patterns to match actual structure

### Option 2: Better Product Matching
1. Make product matching even more flexible
2. Try fuzzy matching for product names
3. Look for product images near prices
4. Match by product size/weight (520g in this case)

### Option 3: Alternative Approach
1. Use Google Shopping API (if available)
2. Use supermarket APIs (if they exist)
3. Use a paid scraping service that handles JavaScript
4. Build a backend service with Puppeteer

## Testing Recommendations

1. **Test with Known Products**: Use products you know are available
2. **Check Logs**: Look for "Product not found" messages
3. **Verify HTML**: Check if HTML is being fetched correctly
4. **Compare with Google**: Use Google Shopping as reference for expected prices

## Current Status

- ✅ Product-specific scraping implemented
- ✅ Better product matching with scoring
- ✅ Uncompressed HTML requests
- ✅ No wrong data policy (returns null if product not found)
- ⚠️ Product matching still needs improvement
- ⚠️ HTML patterns need to match actual site structures

The system is now more accurate but may return fewer results (null instead of wrong prices). This is better than showing incorrect data.

