# Pricing Scraping Improvements

## Changes Made

### 1. ✅ Removed Google Shopping
- **Reason**: Unreliable source returning incorrect prices (e.g., $2.00 for olive oil)
- **Location**: `src/services/pricingService.ts`
- **Impact**: Pricing now comes only from official store websites

### 2. ✅ Removed Price-Based Filtering
- **Reason**: Products can legitimately be very cheap (e.g., NZ$0.049)
- **Changes**:
  - Removed $3.00 minimum threshold from Google Shopping
  - Removed $1.00 minimum threshold from store scraping
  - Validation now based on context, not price value

### 3. ✅ Enhanced HTML Pattern Matching
- **New File**: `src/services/pricingApis/enhancedStoreScraping.ts`
- **Improvements**:
  - Store-specific patterns for NZ supermarkets (New World, Pak'nSave, Countdown, Woolworths, Fresh Choice)
  - More specific regex patterns targeting actual HTML structures
  - Multiple pattern strategies with confidence scoring

### 4. ✅ Context-Based Validation
- **Approach**: Validates prices based on context, not value
- **Factors**:
  - Product name/barcode proximity (+10 confidence if barcode found)
  - Product keyword matching (+3 confidence)
  - Price-related keywords (+2 confidence)
  - Product-related keywords (+2 confidence)
  - Negative factors: shipping costs (-4), quantities (-3), promotional text (-1)

### 5. ✅ Fallback Mechanism
- **Strategy**: Multiple scraping strategies tried in sequence
  1. Enhanced scraping with improved patterns
  2. Regular scraping (fallback)
  3. Service-based proxy (placeholder for future)

## Headless Browser Implementation (Future)

### Current Limitation
React Native/Expo cannot directly use Puppeteer/Playwright as they require Node.js environment.

### Recommended Solutions

#### Option 1: Service-Based Headless Browser (Recommended)
Use a service that provides headless browser capabilities via API:

**Services to Consider:**
- **ScraperAPI** (https://www.scraperapi.com/)
  - Handles JavaScript rendering
  - Rotates proxies automatically
  - Pricing: Free tier available, paid plans from $29/month

- **ScrapingBee** (https://www.scrapingbee.com/)
  - JavaScript rendering support
  - Built-in proxy rotation
  - Pricing: Free tier available, paid plans from $49/month

- **Bright Data** (https://brightdata.com/)
  - Enterprise-grade solution
  - Full browser automation
  - Pricing: Custom pricing

**Implementation Example:**
```typescript
async function scrapeWithServiceProxy(
  url: string,
  store: StoreLocation,
  productName: string,
  barcode: string,
  countryCode: string
): Promise<PriceEntry | null> {
  const apiKey = process.env.EXPO_PUBLIC_SCRAPER_API_KEY;
  if (!apiKey) {
    return null; // Service not configured
  }

  // ScraperAPI example
  const serviceUrl = `https://api.scraperapi.com?api_key=${apiKey}&url=${encodeURIComponent(url)}&render=true`;
  
  const response = await fetch(serviceUrl);
  const html = await response.text();
  
  // Extract prices from rendered HTML
  const prices = extractPricesWithEnhancedPatterns(html, store.name, productName, barcode);
  // ... rest of logic
}
```

#### Option 2: Backend Service
Create a backend service (Node.js) that uses Puppeteer/Playwright:
- Backend handles JavaScript rendering
- Mobile app calls backend API
- More control but requires backend infrastructure

#### Option 3: WebView Approach
Use React Native WebView to render pages:
- Load page in WebView
- Execute JavaScript to extract prices
- More complex but no external service needed

### Next Steps for Headless Browser

1. **Choose a Service**: Evaluate ScraperAPI or ScrapingBee
2. **Add API Key**: Store in environment variables
3. **Implement Service Integration**: Update `scrapeWithServiceProxy` function
4. **Test**: Verify JavaScript-rendered prices are extracted correctly

## Current Pattern Matching

### New World Patterns
- `<span class="price">` with price content
- JSON-LD structured data
- `data-price` attributes
- `price-amount` class patterns

### Pak'nSave Patterns
- `product-price` class patterns
- Span elements with price classes
- JSON-LD and data attributes

### Countdown/Woolworths Patterns
- `price-value` class patterns
- Span elements with price classes
- JSON-LD structured data

### Fresh Choice Patterns
- Generic price class patterns
- JSON-LD structured data

## Testing

To test the improvements:

1. **Scan Cobrams Olive Oil** (barcode: 852696000204)
2. **Check logs** for:
   - Enhanced scraping attempts
   - Pattern matching results
   - Confidence scores
   - Fallback mechanism activation

3. **Expected Results**:
   - Prices from New World: ~$24.99
   - Prices from Pak'nSave: ~$17.99
   - Prices from Countdown/Woolworths: ~$24.99
   - Prices from Fresh Choice: ~$24.99

## Debugging

Enhanced logging includes:
- HTML length received
- Price candidates found with confidence scores
- Context validation results
- Fallback mechanism triggers

## Future Improvements

1. **Implement Service-Based Headless Browser**: Add ScraperAPI or similar
2. **Machine Learning**: Train model to identify correct prices
3. **Price History**: Track price changes to validate current prices
4. **User Feedback**: Allow users to report incorrect prices
5. **Caching**: Cache successful scraping patterns per store

