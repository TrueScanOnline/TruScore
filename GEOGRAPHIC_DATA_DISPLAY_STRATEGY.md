# Geographic Data Display Strategy - Recommendations

**Date:** January 2026  
**Purpose:** Best practices for displaying geographic/origin information accurately and without misleading users

---

## Question 1: How to Display Geographic/Origin Information?

### **Core Principle: "Show Only What We Know"**

**Never display misleading information.** Better to show nothing than show incorrect data.

---

## Display Strategy Recommendations

### **1. Data Source Priority (Already Implemented)**

Our extraction logic prioritizes in this order:
1. ✅ `manufacturing_places_tags` (most accurate, rarely available <10%)
2. ✅ `manufacturing_places` (accurate, rarely available <10%)
3. ✅ `origins_tags` (accurate when available, often missing 60-70%)
4. ✅ `origins` (accurate when available, often missing 60-70%)
5. ❌ **NEVER USE** `countries_tags` (shows distribution, not manufacturing)

### **2. Display Rules**

#### **Rule 1: Only Show When We Have Reliable Data**

**✅ SHOW Country of Manufacture When:**
- We have data from `manufacturing_places_tags` → **HIGH CONFIDENCE**
- We have data from `origins_tags` → **MEDIUM CONFIDENCE**
- We have verified user contributions (3+ matching submissions) → **HIGH CONFIDENCE**
- We have community user contributions (2 matching submissions) → **MEDIUM CONFIDENCE**

**❌ DO NOT SHOW When:**
- Only have `countries_tags` (distribution country) → **MISLEADING**
- Only have `ecoscore_data.origins_of_ingredients` (ingredient origins ≠ manufacturing) → **MISLEADING**
- Data is conflicting/disputed → **UNRELIABLE**
- Single unverified user submission → **TOO EARLY** (wait for validation)

#### **Rule 2: Always Indicate Confidence Level**

**Visual Indicators:**
- ✅ **Verified (High Confidence):** Green checkmark + "Verified"
- 👥 **Community (Medium Confidence):** People icon + "Community verified"
- ⚠️ **Unverified (Low Confidence):** Help icon + "Unverified - help verify"
- ⚠️ **Disputed (Conflicting):** Warning icon + "Disputed - needs review"

#### **Rule 3: Clear Labeling**

**Always use specific label:**
- ✅ "Country of Manufacture" (not "Country of Origin")
- ✅ "Manufactured in: [Country]"
- ✅ "Made in: [Country]"

**Never use ambiguous labels:**
- ❌ "Country" (unclear what it means)
- ❌ "Origin" (could mean ingredient origin or manufacturing)
- ❌ "Country of Origin" (ambiguous, often means distribution)

#### **Rule 4: Show Source Attribution**

**Display data source when helpful:**
- "From Open Food Facts database" (when from OFF)
- "Verified by 5 users" (when user-contributed)
- "Community verified by 2 users" (when partially verified)
- "Based on product label" (when from OFF origins)

#### **Rule 5: Provide Context When Missing**

**When data is missing:**
- Show "Help us identify" card
- Explain what we're looking for: "Look for 'Product of X' or 'Made in X' on the label"
- Provide easy way to contribute
- Don't show placeholder or "Unknown" (better to show nothing)

---

## UI Display Recommendations

### **Visual Design**

#### **High Confidence Display (Verified Data)**
```
┌─────────────────────────────────────┐
│ Country of Manufacture        ✅    │
├─────────────────────────────────────┤
│ 🇨🇳 China                           │
│ Verified by Open Food Facts         │
└─────────────────────────────────────┘
```

#### **Medium Confidence Display (Community Verified)**
```
┌─────────────────────────────────────┐
│ Country of Manufacture        👥    │
├─────────────────────────────────────┤
│ 🇨🇳 China                           │
│ Community verified by 2 users       │
└─────────────────────────────────────┘
```

#### **Low Confidence Display (Unverified)**
```
┌─────────────────────────────────────┐
│ Country of Manufacture        ⚠️    │
├─────────────────────────────────────┤
│ 🇨🇳 China                           │
│ Unverified - help verify            │
│ [Report different country]          │
└─────────────────────────────────────┘
```

#### **Disputed Display (Conflicting Data)**
```
┌─────────────────────────────────────┐
│ Country of Manufacture        ⚠️    │
├─────────────────────────────────────┤
│ 🇨🇳 China                           │
│ Disputed - conflicting reports      │
│ [Review submissions]                │
└─────────────────────────────────────┘
```

#### **Missing Data Display (No Information)**
```
┌─────────────────────────────────────┐
│ 🌍                                  │
│ Help us identify this product       │
│                                     │
│ Do you see "Product of X" or        │
│ "Made in X" on the label?           │
│                                     │
│ [Report Manufacturing Country]      │
└─────────────────────────────────────┘
```

### **Color Coding**

- ✅ **Verified:** Green (#16a085) - High confidence
- 👥 **Community:** Light green (#4dd09f) - Medium confidence
- ⚠️ **Unverified:** Yellow (#ffd93d) - Low confidence, needs validation
- ⚠️ **Disputed:** Orange (#ff9800) - Conflicting data, needs review
- 🌍 **Missing:** Gray (#95a5a6) - No data, call to action

---

## Implementation Enhancements

### **Recommended Improvements**

1. **Add Info Modal for Country Card**
   - Explain what "Country of Manufacture" means
   - Explain how we verify this data
   - Explain confidence levels
   - Link to user contribution system

2. **Add Tooltip/Help Text**
   - "This is where the product was made, not where it's sold"
   - "Verified by X users" or "From Open Food Facts database"

3. **Add "Report Different" Link**
   - Always allow users to report different country
   - Even when country is shown (in case of error)

4. **Show Submission Count**
   - "Verified by 5 users" (when verified)
   - "2 users reported this" (when community verified)
   - "Help verify - be the first to report" (when unverified)

5. **Add Source Attribution**
   - Small text: "From Open Food Facts" or "User-contributed"
   - Helps build trust

---

## Code Implementation

### **Display Logic**

```typescript
// Priority order for display
const displayManufacturingCountry = 
  manufacturingCountryFromOFF ||        // Priority 1: Open Food Facts
  verifiedUserContributedCountry ||     // Priority 2: Verified (3+ users)
  communityUserContributedCountry ||    // Priority 3: Community (2 users)
  null;                                 // Priority 4: Nothing (don't show wrong data)

// Confidence level
const confidence = 
  manufacturingCountryFromOFF ? 'verified' :
  verifiedUserContributedCountry ? 'verified' :
  communityUserContributedCountry ? 'community' :
  unverifiedUserContributedCountry ? 'unverified' :
  'missing';
```

### **UI Component Logic**

```typescript
{displayManufacturingCountry ? (
  <CountryCard
    country={displayManufacturingCountry}
    confidence={confidence}
    source={source} // 'openfoodfacts' | 'user-contributed'
    submissionCount={submissionCount}
    onReportDifferent={() => openModal()}
  />
) : (
  <ContributeCard onPress={() => openModal()} />
)}
```

---

## User Education

### **Help Modal Content**

**What is "Country of Manufacture"?**
- This is where the product was actually made/manufactured
- Different from "Country of Origin" (which can mean distribution)
- Different from ingredient origins (where ingredients come from)

**How do we verify this information?**
- Primary source: Open Food Facts database (crowdsourced)
- Secondary source: User contributions (validated by multiple users)
- We require 3+ matching submissions for verification
- We never use distribution/sales country as manufacturing country

**What if the information is wrong?**
- Tap "Report different country" to submit correction
- Your submission helps verify the information
- If you're the first to report, we'll show it as "unverified" until validated

**Confidence Levels:**
- ✅ **Verified:** 3+ users reported the same country
- 👥 **Community:** 2 users reported the same country
- ⚠️ **Unverified:** 1 user reported (needs validation)
- ⚠️ **Disputed:** Conflicting submissions (needs review)

---

## Best Practices Summary

1. ✅ **Show only reliable data** (never use distribution country for manufacturing)
2. ✅ **Always indicate confidence level** (verified, community, unverified)
3. ✅ **Clear, specific labeling** ("Country of Manufacture" not "Origin")
4. ✅ **Provide context** (explain what it means and how we verify)
5. ✅ **Make it easy to contribute** (clear call-to-action when missing)
6. ✅ **Allow corrections** (always show "report different" option)
7. ✅ **Build trust** (show source attribution and validation process)
8. ✅ **Don't mislead** (better to show nothing than show wrong data)

---

## Conclusion

**Key Principles:**
- **Accuracy over Coverage:** Better to show nothing than show wrong data
- **Transparency:** Always show confidence level and source
- **User Empowerment:** Make it easy to contribute and correct
- **Trust Building:** Explain verification process and data sources

**Current Implementation Status:**
- ✅ Data extraction prioritizes reliable sources
- ✅ User contribution system implemented
- ✅ Confidence levels displayed
- ⚠️ Need to add: Info modal, tooltips, submission counts

