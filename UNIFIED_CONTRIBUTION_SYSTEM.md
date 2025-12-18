# Unified User Contribution System

## Problem Statement

Users can contribute data in multiple places throughout the app:
- **Photo upload** (separate action)
- **Product information** (ManualProductEntryModal - name, ingredients, nutrition)
- **Country of origin** (ManufacturingCountryModal)
- **Nutrition data** (can be added separately)

**Issue**: Each contribution point submits independently, which means:
1. If a user adds a photo, then nutrition, then country - these are 3 separate submissions
2. There's no unified "save/submit" action
3. Data might not be merged properly
4. Users don't know if their contributions are pending or submitted

## Solution: Unified Contribution Service

### Architecture

1. **Pending Contributions Storage**
   - All contributions are stored locally as "pending" until user explicitly submits
   - Stored in AsyncStorage with key: `@truescan_pending_contributions_{barcode}`
   - Accumulates: photos, product data, nutrition, country, ingredients

2. **Unified Submission**
   - `submitAllContributions()` merges all pending contributions
   - Submits everything in one coordinated request
   - Ensures all data is available to other users

3. **UI Indicator**
   - `PendingContributionsBanner` shows when there are pending contributions
   - Displays what's pending (photos, product info, country)
   - "Submit All" button to submit everything at once

### Key Components

#### 1. `unifiedContributionService.ts`

**Functions:**
- `addPendingContribution()` - Add contribution to pending list (doesn't submit)
- `getPendingContributions()` - Get all pending contributions for a barcode
- `hasPendingContributions()` - Check if there are pending contributions
- `submitAllContributions()` - Submit ALL pending contributions at once
- `clearPendingContributions()` - Clear pending contributions (if user cancels)

**Flow:**
```
User adds photo → addPendingContribution('photo', ...)
User adds nutrition → addPendingContribution('nutrition', ...)
User adds country → addPendingContribution('country', ...)
User clicks "Submit All" → submitAllContributions() → All data submitted together
```

#### 2. `PendingContributionsBanner.tsx`

**Features:**
- Shows when there are pending contributions
- Displays what's pending (photos count, product info, country)
- "Submit All" button to submit everything
- "Dismiss" button to clear pending contributions
- Auto-refreshes after submission

### Usage Examples

#### Example 1: User adds data incrementally

```typescript
// User adds photo
await addPendingContribution(barcode, 'photo', {
  path: '/path/to/photo.jpg',
  type: 'front'
});

// User adds nutrition data
await addPendingContribution(barcode, 'nutrition', {
  energy: 250,
  fat: 10,
  protein: 5
});

// User adds country
await addPendingContribution(barcode, 'country', {
  country: 'New Zealand',
  hasImportedIngredients: false
});

// Banner appears showing 3 pending contributions
// User clicks "Submit All"
await submitAllContributions(barcode);
// All data submitted together in one request
```

#### Example 2: User submits immediately (existing flow)

```typescript
// ManualProductEntryModal still works as before
// User fills form and clicks "Save"
await saveManualProduct(productData);
// Data submitted immediately (not added to pending)
```

### Integration Points

#### 1. Result Screen (`app/result/[barcode].tsx`)
- Added `<PendingContributionsBanner />` at top of ScrollView
- Shows when user has pending contributions
- Refreshes product data after submission

#### 2. Manual Product Entry Modal
- **Option A**: Continue submitting immediately (current behavior)
- **Option B**: Add to pending contributions (new behavior)
- Can be configured via prop: `submitImmediately={true/false}`

#### 3. Manufacturing Country Modal
- **Option A**: Submit immediately (current behavior)
- **Option B**: Add to pending contributions (new behavior)

#### 4. Photo Upload
- Can add to pending instead of uploading immediately
- Use `addPendingContribution('photo', ...)` instead of `uploadProductPhoto()`

### Benefits

1. **Unified Submission**: All contributions submitted together
2. **Better UX**: Users see what's pending and can submit all at once
3. **Data Integrity**: All data merged before submission
4. **Flexibility**: Can still submit immediately if needed
5. **Visibility**: Users know when contributions are pending vs submitted

### Migration Path

**Phase 1: Add Unified Service (Current)**
- ✅ Created `unifiedContributionService.ts`
- ✅ Created `PendingContributionsBanner.tsx`
- ✅ Added banner to result screen

**Phase 2: Update Contribution Points (Next)**
- Update `ManualProductEntryModal` to optionally add to pending
- Update `ManufacturingCountryModal` to optionally add to pending
- Update photo upload to optionally add to pending

**Phase 3: User Choice (Future)**
- Add setting: "Submit immediately" vs "Add to pending"
- Default to "Add to pending" for better UX
- Allow users to change preference

### Testing

1. **Test incremental contributions:**
   - Add photo → Check banner appears
   - Add nutrition → Banner updates
   - Add country → Banner shows all 3
   - Click "Submit All" → All submitted together

2. **Test immediate submission:**
   - Use ManualProductEntryModal → Submit immediately
   - Should still work as before

3. **Test mixed flow:**
   - Add photo (pending)
   - Submit product info immediately
   - Banner shows only photo pending
   - Submit photo separately or with "Submit All"

### Files Created/Modified

**New Files:**
- `src/services/unifiedContributionService.ts` - Core service
- `src/components/PendingContributionsBanner.tsx` - UI component
- `UNIFIED_CONTRIBUTION_SYSTEM.md` - This document

**Modified Files:**
- `app/result/[barcode].tsx` - Added banner component

### Next Steps

1. ✅ Create unified service
2. ✅ Create banner component
3. ✅ Add banner to result screen
4. ⏳ Update contribution points to use unified service
5. ⏳ Add user preference for immediate vs pending submission
6. ⏳ Add analytics for contribution submission rates

