# Score Highlight Rules Management Strategy

## 🎯 Recommended Approach: **Hybrid JSON Configuration System**

The best approach for ongoing rule management is a **hybrid system** that combines:
1. **JSON configuration file** for easy editing (no code changes needed)
2. **Code-based defaults** as fallback (ensures app always works)
3. **Hot reload capability** (optional - reload rules without app restart)

---

## 📋 Implementation Strategy

### **Option 1: JSON Configuration File (RECOMMENDED)**

**Best for:** Easy ongoing management, no code deployment needed, version control friendly

#### Structure:
```
src/config/
  ├── scoreHighlightOverrides.ts (code - fallback defaults)
  └── scoreHighlightRules.json (JSON - editable rules)
```

#### Advantages:
- ✅ **No code compilation** - Edit JSON file directly
- ✅ **Version control** - Track rule changes in git
- ✅ **Easy to edit** - Non-developers can modify rules
- ✅ **Fast deployment** - Update JSON file, no app rebuild needed
- ✅ **Validation** - Can validate JSON structure before applying

#### Implementation Steps:

1. **Create JSON configuration file:**
   ```json
   // src/config/scoreHighlightRules.json
   {
     "version": "1.0",
     "rules": [
       {
         "name": "Exclude Vegan Product for dairy products",
         "priority": 10,
         "condition": {
           "categories": ["dairy", "milk", "cheese"],
           "productNameKeywords": ["milk", "cheese"],
           "ingredientsKeywords": ["milk", "cheese", "lactose"],
           "allergensTags": ["milk", "dairy"]
         },
         "action": {
           "excludeFlagTitles": ["Vegan Product"],
           "excludeFlagTitleKeywords": ["vegan"]
         }
       }
     ]
   }
   ```

2. **Update code to load JSON:**
   ```typescript
   // src/config/scoreHighlightOverrides.ts
   import rulesConfig from './scoreHighlightRules.json';
   import { DEFAULT_OVERRIDE_RULES } from './scoreHighlightRulesDefaults';
   
   export function loadOverrideRules(): ScoreHighlightOverrideRule[] {
     try {
       // Try to load from JSON config
       if (rulesConfig?.rules && Array.isArray(rulesConfig.rules)) {
         return rulesConfig.rules as ScoreHighlightOverrideRule[];
       }
     } catch (error) {
       console.warn('[OverrideRules] Failed to load JSON config, using defaults', error);
     }
     
     // Fallback to code-based defaults
     return DEFAULT_OVERRIDE_RULES;
   }
   ```

3. **Move current rules to defaults file:**
   ```typescript
   // src/config/scoreHighlightRulesDefaults.ts
   export const DEFAULT_OVERRIDE_RULES: ScoreHighlightOverrideRule[] = [
     // Current rules as fallback
   ];
   ```

---

### **Option 2: Remote Configuration (ADVANCED)**

**Best for:** Dynamic updates, A/B testing, analytics tracking

#### Structure:
- Rules stored in database/API
- Fetched on app startup or periodically
- Cached locally with expiration

#### Advantages:
- ✅ **Instant updates** - No app deployment needed
- ✅ **A/B testing** - Test different rule sets
- ✅ **Analytics** - Track which rules are most effective
- ✅ **User segmentation** - Different rules for different user groups

#### Implementation:
```typescript
// src/services/rulesService.ts
export async function fetchRulesFromAPI(): Promise<ScoreHighlightOverrideRule[]> {
  try {
    const response = await fetch('https://api.example.com/rules/score-highlights');
    const data = await response.json();
    return data.rules;
  } catch (error) {
    // Fallback to local JSON or defaults
    return loadLocalRules();
  }
}
```

---

### **Option 3: Admin UI (FUTURE ENHANCEMENT)**

**Best for:** Non-technical team members, visual rule builder

#### Structure:
- Web-based admin panel
- Visual rule builder interface
- Export to JSON/API
- Validation and testing tools

---

## 🚀 Recommended Implementation Plan

### **Phase 1: JSON Configuration (Immediate - Easiest)**

1. **Create JSON schema:**
   - Define structure for rules
   - Add validation schema
   - Document all fields

2. **Implement loader:**
   - Load JSON on app startup
   - Validate structure
   - Fallback to code defaults on error

3. **Migration:**
   - Export current rules to JSON
   - Test loading and validation
   - Update documentation

### **Phase 2: Enhanced Management (Future)**

1. **Validation service:**
   - Validate rule syntax
   - Check for conflicts
   - Test rules against sample products

2. **Rule testing tool:**
   - Test rules with specific barcodes
   - Preview which highlights would be excluded
   - Debug rule matching

3. **Version control:**
   - Track rule changes
   - Rollback capability
   - Change history

---

## 📝 JSON Configuration Format

### Complete Example:

```json
{
  "version": "1.0",
  "lastUpdated": "2024-01-15T10:00:00Z",
  "rules": [
    {
      "id": "rule-4-dairy",
      "name": "Exclude Vegan Product for dairy products",
      "priority": 10,
      "enabled": true,
      "condition": {
        "categories": ["dairy", "milk", "cheese", "yogurt", "butter", "cream"],
        "productNameKeywords": ["milk", "cheese", "yogurt", "butter", "cream", "dairy"],
        "ingredientsKeywords": ["milk", "cheese", "yogurt", "butter", "cream", "dairy", "lactose"],
        "allergensTags": ["milk", "dairy", "lactose"]
      },
      "action": {
        "excludeFlagTitles": ["Vegan Product"],
        "excludeFlagTitleKeywords": ["vegan"]
      },
      "description": "Prevents 'Vegan Product' highlight from showing on products containing dairy",
      "testCases": [
        {
          "barcode": "5740900404601",
          "productName": "Lurpak Spreadable",
          "expected": "Vegan Product should be excluded"
        }
      ]
    }
  ]
}
```

---

## 🛠️ Implementation Code

### Step 1: Create JSON Loader

```typescript
// src/config/scoreHighlightRulesLoader.ts
import { ScoreHighlightOverrideRule } from './scoreHighlightOverrides';
import { DEFAULT_OVERRIDE_RULES } from './scoreHighlightRulesDefaults';

interface RulesConfig {
  version: string;
  lastUpdated?: string;
  rules: ScoreHighlightOverrideRule[];
}

let cachedRules: ScoreHighlightOverrideRule[] | null = null;

export async function loadOverrideRules(): Promise<ScoreHighlightOverrideRule[]> {
  // Return cached rules if available
  if (cachedRules) {
    return cachedRules;
  }

  try {
    // Try to load from JSON file
    // In React Native, you'll need to use require() or fetch from assets
    const rulesConfig: RulesConfig = require('./scoreHighlightRules.json');
    
    if (rulesConfig?.rules && Array.isArray(rulesConfig.rules)) {
      // Validate rules structure
      const validatedRules = validateRules(rulesConfig.rules);
      cachedRules = validatedRules;
      console.log(`[OverrideRules] Loaded ${validatedRules.length} rules from JSON config`);
      return validatedRules;
    }
  } catch (error) {
    console.warn('[OverrideRules] Failed to load JSON config, using defaults', error);
  }

  // Fallback to code-based defaults
  console.log('[OverrideRules] Using default rules from code');
  cachedRules = DEFAULT_OVERRIDE_RULES;
  return DEFAULT_OVERRIDE_RULES;
}

function validateRules(rules: any[]): ScoreHighlightOverrideRule[] {
  // Basic validation - ensure required fields exist
  return rules.filter(rule => {
    return rule.name && rule.condition && rule.action;
  }) as ScoreHighlightOverrideRule[];
}

export function clearRulesCache(): void {
  cachedRules = null;
}
```

### Step 2: Update Override Rules File

```typescript
// src/config/scoreHighlightOverrides.ts
import { loadOverrideRules } from './scoreHighlightRulesLoader';

// Update applyOverrideRules to use loader
export async function applyOverrideRules(
  flags: ProductFlag[],
  product: ProductWithTrustScore,
  rules?: ScoreHighlightOverrideRule[]
): Promise<ProductFlag[]> {
  // Load rules if not provided
  const rulesToUse = rules || await loadOverrideRules();
  
  // Rest of the function remains the same...
  const sortedRules = [...rulesToUse].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  // ... existing logic
}
```

### Step 3: Update productFlags.ts

```typescript
// src/utils/productFlags.ts
import { applyOverrideRules } from '../config/scoreHighlightOverrides';

export async function generateProductFlags(
  product: ProductWithTrustScore
): Promise<ProductFlag[]> {
  const flags: ProductFlag[] = [];
  
  // ... generate flags as before
  
  // Apply override rules (now async)
  const filteredFlags = await applyOverrideRules(flags, product);
  
  return filteredFlags;
}
```

---

## 📚 Rule Management Workflow

### **Adding a New Rule:**

1. **Open JSON file:** `src/config/scoreHighlightRules.json`
2. **Add new rule object** to the `rules` array
3. **Save file**
4. **Test with sample product** (barcode scanner)
5. **Commit to git** (if using version control)

### **Modifying Existing Rule:**

1. **Find rule** in JSON file (search by name or ID)
2. **Update condition or action** fields
3. **Save file**
4. **Test with affected products**
5. **Commit changes**

### **Disabling a Rule:**

```json
{
  "id": "rule-4-dairy",
  "enabled": false,  // Set to false to disable
  ...
}
```

---

## ✅ Validation & Testing

### **Rule Validation Checklist:**

- [ ] Rule has unique `id` or `name`
- [ ] `priority` is a number (higher = checked first)
- [ ] `condition` has at least one field
- [ ] `action` has at least one exclusion field
- [ ] Keywords are lowercase (for consistency)
- [ ] Test with sample products

### **Testing Tools:**

1. **Barcode Scanner Test:**
   - Scan product with known characteristics
   - Verify expected highlights are excluded

2. **Rule Tester Function:**
   ```typescript
   // Test a rule against a product
   function testRule(rule: ScoreHighlightOverrideRule, product: Product) {
     const matches = matchesCondition(product, rule.condition);
     console.log(`Rule "${rule.name}" matches: ${matches}`);
   }
   ```

---

## 🎯 Best Practices

1. **Version Control:**
   - Always commit JSON changes to git
   - Use descriptive commit messages
   - Tag major rule updates

2. **Documentation:**
   - Add comments in JSON (using `//` or `_comment` fields)
   - Document test cases for each rule
   - Keep changelog of rule updates

3. **Testing:**
   - Test each new rule with multiple products
   - Verify no unintended exclusions
   - Check rule priority ordering

4. **Performance:**
   - Cache loaded rules
   - Validate rules on load, not on each product scan
   - Use efficient matching logic

---

## 📊 Comparison Table

| Approach | Ease of Use | Update Speed | Technical Skill | Version Control | Recommended For |
|----------|-------------|--------------|-----------------|-----------------|-----------------|
| **JSON Config** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Low | ✅ Yes | **Most teams** |
| **Code-based** | ⭐⭐⭐ | ⭐⭐ | High | ✅ Yes | Initial setup |
| **Remote API** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Medium | ✅ Yes | Large scale |
| **Admin UI** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Very Low | ✅ Yes | Future enhancement |

---

## 🚀 Quick Start

1. **Create JSON file:** `src/config/scoreHighlightRules.json`
2. **Export current rules** to JSON format
3. **Update loader** to read from JSON
4. **Test** with sample products
5. **Document** the process for your team

---

**Recommendation:** Start with **JSON Configuration (Option 1)** - it's the easiest to implement, requires no infrastructure changes, and allows for easy ongoing management while maintaining code-based fallbacks for reliability.
