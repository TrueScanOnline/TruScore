# TruScore Data Sources: Nutri-Score, NOVA, and Eco-Score

## Overview

All three scoring systems (Nutri-Score, NOVA, and Eco-Score) are **fetched directly from Open Food Facts (OFF)** when we query their API. These scores are **calculated by Open Food Facts**, not by our app.

---

## 1. Nutri-Score

### Source
- **Open Food Facts API** (`nutriscore_grade` and `nutriscore_score` fields)
- Calculated by Open Food Facts based on nutritional data

### How We Get It

```typescript
// In src/services/openFoodFacts.ts
export async function fetchProductFromOFF(barcode: string): Promise<Product | null> {
  // Fetches from: https://world.openfoodfacts.org/api/v2/product/{barcode}.json
  // Returns product with nutriscore_grade and nutriscore_score
}
```

### What Open Food Facts Provides
- `nutriscore_grade`: Letter grade ('a', 'b', 'c', 'd', 'e')
- `nutriscore_score`: Numerical score (typically -15 to 40)

### How Open Food Facts Calculates It
Open Food Facts uses the official Nutri-Score algorithm:
- **Positive points** for: fiber, protein, fruits/vegetables/nuts
- **Negative points** for: energy (calories), saturated fat, sugar, sodium
- Final grade: A (best) to E (worst)

### How We Use It in TruScore
```typescript
// In src/lib/truscoreEngine/pillars/bodyPillar.ts
const gradeMapping: Record<string, number> = { 
  a: 25,  // Best
  b: 20, 
  c: 15,  // Base score
  d: 10, 
  e: 5    // Worst
};
// Adjustment from base 15:
// A = +10, B = +5, C = 0, D = -5, E = -10
```

### If Missing
- If `nutriscore_grade` is not available, the Body pillar starts at base score 15 with no adjustment

---

## 2. NOVA Group

### Source
- **Open Food Facts API** (`nova_group` field)
- Calculated by Open Food Facts based on processing level

### How We Get It

```typescript
// In src/services/openFoodFacts.ts
// Same API call as Nutri-Score
// Returns product with nova_group: 1 | 2 | 3 | 4
```

### What Open Food Facts Provides
- `nova_group`: Number (1, 2, 3, or 4)
  - **1**: Unprocessed or minimally processed foods
  - **2**: Processed culinary ingredients
  - **3**: Processed foods
  - **4**: Ultra-processed foods

### How Open Food Facts Calculates It
Open Food Facts uses the NOVA classification system:
- Analyzes ingredients list and processing methods
- Categorizes based on level of industrial processing
- Group 4 (ultra-processed) includes products with many additives, preservatives, and industrial ingredients

### How We Use It in TruScore
```typescript
// In src/lib/truscoreEngine/pillars/bodyPillar.ts
if (nova === 1) {
  adjustment = +3;  // Bonus for unprocessed
} else if (nova === 2) {
  adjustment = 0;   // No change
} else if (nova === 3) {
  adjustment = -3;  // Penalty for processed
} else if (nova === 4) {
  adjustment = -8;  // Penalty for ultra-processed
}
```

### If Missing
- If `nova_group` is not available, no NOVA adjustment is applied

---

## 3. Eco-Score

### Source
- **Open Food Facts API** (`ecoscore_grade`, `ecoscore_score`, and `ecoscore_data` fields)
- Calculated by Open Food Facts based on environmental impact data

### How We Get It

```typescript
// In src/services/openFoodFacts.ts
export async function fetchProductFromOFF(barcode: string): Promise<Product | null> {
  // Returns product with:
  // - ecoscore_grade: 'a' | 'b' | 'c' | 'd' | 'e'
  // - ecoscore_score: number (0-100)
  // - ecoscore_data: Full Eco-Score object with Agribalyse data
}
```

### What Open Food Facts Provides
- `ecoscore_grade`: Letter grade ('a', 'b', 'c', 'd', 'e')
- `ecoscore_score`: Numerical score (0-100)
- `ecoscore_data`: Full object containing:
  - Agribalyse LCA (Life Cycle Assessment) data
  - CO2 emissions
  - Water footprint
  - Land use
  - Biodiversity threats
  - Transport impact
  - Packaging impact

### How Open Food Facts Calculates It
Open Food Facts uses the Eco-Score algorithm:
- **Base score** from Agribalyse database (LCA data for ingredients)
- **Penalties** for:
  - Non-organic ingredients
  - Non-sustainable palm oil
  - Deforestation risk
  - Transport distance
  - Packaging impact
- **Bonuses** for:
  - Organic certification
  - Sustainable sourcing
  - Recyclable packaging
- Final grade: A (best) to E (worst)

### How We Use It in TruScore
```typescript
// In src/lib/truscoreEngine/pillars/planetPillar.ts
const gradeMapping: Record<string, number> = { 
  a: 25,  // Best
  b: 20, 
  c: 15,  // Base score
  d: 10, 
  e: 5    // Worst
};
// Adjustment from base 15:
// A = +10, B = +5, C = 0, D = -5, E = -10
```

### If Missing
- If `ecoscore_grade` is not available, the Planet pillar starts at base score 15 with no adjustment

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Open Food Facts API                      │
│  https://world.openfoodfacts.org/api/v2/product/{barcode}   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Returns JSON with:
                            │ - nutriscore_grade
                            │ - nutriscore_score
                            │ - nova_group
                            │ - ecoscore_grade
                            │ - ecoscore_score
                            │ - ecoscore_data
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         src/services/openFoodFacts.ts                        │
│         fetchProductFromOFF(barcode)                          │
│         - Fetches from OFF API                               │
│         - Returns Product object with all scores             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         src/lib/truscoreEngine/pillars/                      │
│                                                              │
│  bodyPillar.ts:    Uses nutriscore_grade + nova_group       │
│  planetPillar.ts:  Uses ecoscore_grade                       │
│                                                              │
│  - Reads scores from Product object                          │
│  - Applies adjustments to base score (15)                     │
│  - Returns final pillar score (0-25)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Important Notes

### 1. We Don't Calculate These Scores
- **Nutri-Score**: Calculated by Open Food Facts using official algorithm
- **NOVA**: Classified by Open Food Facts based on processing level
- **Eco-Score**: Calculated by Open Food Facts using Agribalyse LCA data

### 2. Data Availability
- Not all products in Open Food Facts have these scores
- Coverage varies by country and product type
- If a score is missing, we use the base score (15) with no adjustment

### 3. Score Updates
- Open Food Facts updates scores as more data becomes available
- Our app always fetches the latest scores from OFF
- User-contributed data can improve OFF's ability to calculate scores

### 4. User Contributions
- When users add nutritional data, ingredients, or packaging info, this helps Open Food Facts calculate more accurate scores
- We submit user data to Open Food Facts (via `manualProductService.ts`)
- This improves score accuracy for future scans

---

## Code References

### Fetching from Open Food Facts
```20:58:src/services/openFoodFacts.ts
async function fetchProductFromOFFInstance(barcode: string, instance: string): Promise<Product | null> {
  try {
    const url = `https://${instance}/api/v2/product/${barcode}.json`;
    
    const response = await fetchWithRateLimit(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    }, 'openfoodfacts');

    if (!response.ok) {
      if (response.status !== 404) {
        logger.debug(`OFF API error (${instance}): ${response.status} ${response.statusText}`);
      }
      return null;
    }

    const data: OFFResponse = await response.json();

    if (data.status === 0 || !data.product) {
      return null;
    }

    // Add source and barcode
    const product: Product = {
      ...data.product,
      barcode,
      source: 'openfoodfacts',
    };

    // Enhance product with extracted sustainability data
    enhanceProductWithSustainabilityData(product);

    return product;
  } catch (error) {
    logger.debug(`Error fetching from ${instance}:`, error);
    return null;
  }
}
```

### Using Nutri-Score in Body Pillar
```67:95:src/lib/truscoreEngine/pillars/bodyPillar.ts
  let nutriscoreValue: number | undefined;
  if (hasNutriScore) {
    const ns = product.nutriscore_grade?.toLowerCase();
    if (ns) {
      const gradeMapping: Record<string, number> = { a: 25, b: 20, c: 15, d: 10, e: 5 };
      nutriscoreValue = gradeMapping[ns] || 15;
      const adjustment = nutriscoreValue - 15; // Adjustment from base 15
      
      if (adjustment > 0) {
        adjustments.push({
          description: `Nutri-Score Grade ${ns.toUpperCase()} (${nutriscoreValue} points)`,
          value: adjustment,
          type: 'positive',
        });
      } else if (adjustment < 0) {
        adjustments.push({
          description: `Nutri-Score Grade ${ns.toUpperCase()} (${nutriscoreValue} points)`,
          value: adjustment,
          type: 'negative',
        });
      }
      score += adjustment;
    }
  }
```

### Using NOVA in Body Pillar
```214:243:src/lib/truscoreEngine/pillars/bodyPillar.ts
  // NOVA adjustments
  const nova = product.nova_group;
  let novaAdjustment = 0;
  if (nova === 1) {
    novaAdjustment = 3;
    adjustments.push({
      description: 'NOVA Group 1 (unprocessed)',
      value: novaAdjustment,
      type: 'positive',
    });
    score += novaAdjustment;
  } else if (nova === 2) {
    // No adjustment for NOVA 2
  } else if (nova === 3) {
    novaAdjustment = -3;
    adjustments.push({
      description: 'NOVA Group 3 (processed)',
      value: novaAdjustment,
      type: 'negative',
    });
    score += novaAdjustment; // Already negative
  } else if (nova === 4) {
    novaAdjustment = -8;
    adjustments.push({
      description: 'NOVA Group 4 (ultra-processed)',
      value: novaAdjustment,
      type: 'negative',
    });
    score += novaAdjustment; // Already negative
  }
```

### Using Eco-Score in Planet Pillar
```53:85:src/lib/truscoreEngine/pillars/planetPillar.ts
  let ecoscoreValue: number | undefined;
  if (hasEcoScore) {
    const es = product.ecoscore_grade?.toLowerCase();
    if (es) {
      const gradeMapping: Record<string, number> = { a: 25, b: 20, c: 15, d: 10, e: 5 };
      ecoscoreValue = gradeMapping[es] || 15;
      const adjustment = ecoscoreValue - 15; // Adjustment from base 15
      
      if (adjustment > 0) {
        adjustments.push({
          description: `Eco-Score Grade ${es.toUpperCase()} (${ecoscoreValue} points)`,
          value: adjustment,
          type: 'positive',
        });
      } else if (adjustment < 0) {
        adjustments.push({
          description: `Eco-Score Grade ${es.toUpperCase()} (${ecoscoreValue} points)`,
          value: adjustment,
          type: 'negative',
        });
      }
      score += adjustment;
    }
  }
```

---

## Testing

To see what scores are available for a product:

```powershell
# Analyze a barcode to see all available data
npm run analyze-truscore -- 9310055105850

# Analyze specific pillar to see score source
npm run analyze-pillar -- body 9310055105850
npm run analyze-pillar -- planet 9310055105850
```

---

## Summary

| Score | Source | Calculated By | Used In | Base Score |
|-------|--------|---------------|---------|------------|
| **Nutri-Score** | Open Food Facts API | Open Food Facts | Body Pillar | 15 |
| **NOVA Group** | Open Food Facts API | Open Food Facts | Body Pillar | N/A (adjustment only) |
| **Eco-Score** | Open Food Facts API | Open Food Facts | Planet Pillar | 15 |

**Key Point**: All three scores come from Open Food Facts. We fetch them via their API and use them to adjust our TruScore pillar calculations. We do not calculate these scores ourselves.



