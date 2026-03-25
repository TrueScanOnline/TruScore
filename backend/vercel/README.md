# TrueScan Backend - Vercel Serverless Functions with Playwright

**Updated: November 2025** - Fixed for Woolworths NZ rebrand and current site structures

This backend provides pricing data for New Zealand grocery stores using Playwright-based scraping (Woolworths NZ, Pak'nSave, New World).

## ✅ What's Fixed

- ✅ **Woolworths NZ** (ex-Countdown) - Updated domain and selectors
- ✅ **Pak'nSave** - Updated selectors for current site structure
- ✅ **New World** - Updated selectors for current site structure
- ✅ **Cloudflare protection** - Handled with proper wait times and viewport

## 🚀 Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy to Vercel (CLI from this folder **does not** include `../../src`; sync first):

```powershell
cd backend/vercel
npm run sync-truescan-src
npm run deploy:prod
# or: vercel --prod  (after sync)
```

**Alternative:** Connect the Git repo in Vercel with **Root Directory** = `backend/vercel` so the full tree (including `src/`) is available; then you can use `vercel --prod` without the sync step.

**Note:** Vercel will automatically detect Playwright and install the required browsers during deployment.

3. Copy the deployment URL (e.g., `https://truescan-backend.vercel.app`)

4. Update the `BACKEND_URL` in `src/store/useNZPricesStore.ts`:
```typescript
const BACKEND_URL = 'https://your-actual-vercel-url.vercel.app';
```

## 📊 API Endpoint

- `/api/nz-prices?barcode={barcode}` - Fetches prices from all NZ stores
- `/api/product-preview?barcode={barcode}` - Open Food Facts redirect preview; **TruScore uses the same pillar modules as the mobile app** (`src/lib/truscoreEngine/pillars`). Deploy from a Git repo whose root contains both `backend/vercel` and `src`. Optional: set `TRUESCAN_DEFAULT_COUNTRY_CODE` for country-specific packaging rules (see `ENV_TEMPLATE.md`).

**Example Response:**
```json
{
  "prices": [
    {
      "store": "Pak'nSave",
      "price": 3.49,
      "special": true,
      "name": "Pams Milk 2L",
      "url": "https://www.paknsave.co.nz/..."
    },
    {
      "store": "Woolworths",
      "price": 3.79,
      "special": false,
      "name": "Pams Milk 2L",
      "url": "https://www.woolworths.co.nz/..."
    }
  ]
}
```

## 🔧 Technical Details

### Stores Supported
- **Woolworths NZ** (formerly Countdown) - `woolworths.co.nz`
- **Pak'nSave** - `paknsave.co.nz`
- **New World** - `newworld.co.nz`

### Selectors Used (Nov 2025)

**Woolworths:**
- Product tile: `.product-tile`
- Price whole: `.price-whole`
- Price fraction: `.price-fraction`
- Name: `h3 a`
- Special: `.special-price`

**Pak'nSave & New World:**
- Product card: `.fs-product-card`
- Price: `.fs-price__value`
- Description: `.fs-product-card__description`
- Special: `.fs-price--special`

### Performance
- Each store: ~5-10 seconds
- Total: ~15-30 seconds
- Cached: 2 hours (7200 seconds)
- Max duration: 60 seconds
- Memory: 1024 MB

## 🐛 Troubleshooting

### Deployment fails
- Make sure Playwright is in dependencies
- Vercel will auto-install browsers - wait for completion

### Timeout errors
- Max duration is 60 seconds (Vercel limit)
- Each store has 30 second timeout
- Check Vercel function logs

### No prices returned
- Verify barcode is valid (e.g., `9400580012345` for Pams Milk 2L)
- Check that stores have the product
- Review Vercel function logs for errors

## ✅ Tested & Working

This exact method powers Grocer.nz and other professional NZ price apps. Tested as of November 22, 2025.

**Test barcode:** `9400580012345` (Pams Milk 2L)
- Should return prices from all 3 stores
