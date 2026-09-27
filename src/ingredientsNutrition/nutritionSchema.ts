/**
 * Closed nutrition schema for packet contribution.
 * Missing attributes are not stated. A stored 0 is a stated zero.
 * Unknown attributes, units, or an unresolved basis are dropped and are not written.
 */

export type NutritionBasis = 'per_100g' | 'per_100ml' | 'per_serving';

export type NutritionAttribute =
  | 'energy-kcal'
  | 'energy-kj'
  | 'fat'
  | 'saturated-fat'
  | 'carbohydrates'
  | 'sugars'
  | 'fiber'
  | 'proteins'
  | 'sodium';

export type StatedNutritionAmount = {
  attribute: NutritionAttribute;
  /** Finite and >= 0. Zero is a genuine stated zero. */
  value: number;
  unit: string;
};

export type EstablishedNutrition = {
  basis: NutritionBasis;
  amounts: StatedNutritionAmount[];
  nutritionComplete: boolean;
};

type FieldSpec = {
  attribute: NutritionAttribute;
  packetConcept: string;
  acceptedUnits: readonly string[];
  /** Open Food Facts nutrient name, without basis suffix. */
  offNutrient: string;
  /** Unit written to OFF after an explicit conversion, if any. */
  offUnit: string;
};

export const NUTRITION_FIELDS: readonly FieldSpec[] = [
  { attribute: 'energy-kcal', packetConcept: 'Energy', acceptedUnits: ['kcal'], offNutrient: 'energy-kcal', offUnit: 'kcal' },
  { attribute: 'energy-kj', packetConcept: 'Energy', acceptedUnits: ['kJ'], offNutrient: 'energy-kj', offUnit: 'kJ' },
  { attribute: 'fat', packetConcept: 'Fat', acceptedUnits: ['g'], offNutrient: 'fat', offUnit: 'g' },
  { attribute: 'saturated-fat', packetConcept: 'Saturated fat', acceptedUnits: ['g'], offNutrient: 'saturated-fat', offUnit: 'g' },
  { attribute: 'carbohydrates', packetConcept: 'Carbohydrate', acceptedUnits: ['g'], offNutrient: 'carbohydrates', offUnit: 'g' },
  { attribute: 'sugars', packetConcept: 'Sugars', acceptedUnits: ['g'], offNutrient: 'sugars', offUnit: 'g' },
  { attribute: 'fiber', packetConcept: 'Fibre', acceptedUnits: ['g'], offNutrient: 'fiber', offUnit: 'g' },
  { attribute: 'proteins', packetConcept: 'Protein', acceptedUnits: ['g'], offNutrient: 'proteins', offUnit: 'g' },
  { attribute: 'sodium', packetConcept: 'Sodium', acceptedUnits: ['mg', 'g'], offNutrient: 'sodium', offUnit: 'g' },
];

/** Attributes the existing nutrition table treats as the panel, aside from optional fibre. */
const REQUIRED_ATTRIBUTES: readonly NutritionAttribute[] = [
  'fat',
  'saturated-fat',
  'carbohydrates',
  'sugars',
  'proteins',
  'sodium',
];

const FIELD_BY_ATTRIBUTE = new Map(NUTRITION_FIELDS.map((field) => [field.attribute, field]));

export function nutritionField(attribute: NutritionAttribute): FieldSpec {
  const field = FIELD_BY_ATTRIBUTE.get(attribute);
  if (!field) throw new Error('nutrition_attribute_unknown');
  return field;
}

function isBasis(value: string | undefined): value is NutritionBasis {
  return value === 'per_100g' || value === 'per_100ml' || value === 'per_serving';
}

function isAttribute(value: string | undefined): value is NutritionAttribute {
  return !!value && FIELD_BY_ATTRIBUTE.has(value as NutritionAttribute);
}

/**
 * Complete only when one basis is resolved and every required panel attribute
 * is a finite stated number, including zero. Energy may be kcal or kJ.
 * Fibre is accepted and is not required. A caller completeness flag is not an input.
 */
export function nutritionPanelIsComplete(nutrition: {
  basis?: NutritionBasis;
  amounts: StatedNutritionAmount[];
}): boolean {
  if (!isBasis(nutrition.basis) || nutrition.amounts.length === 0) return false;
  const present = new Set(nutrition.amounts.map((amount) => amount.attribute));
  const energyStated = present.has('energy-kcal') || present.has('energy-kj');
  return energyStated && REQUIRED_ATTRIBUTES.every((attribute) => present.has(attribute));
}

export function establishNutrition(input: {
  basis?: string;
  amounts?: Array<{ attribute?: string; value?: unknown; unit?: string }>;
} | null | undefined): EstablishedNutrition | undefined {
  if (!input || !isBasis(input.basis)) return undefined;
  const amounts: StatedNutritionAmount[] = [];
  const seen = new Set<NutritionAttribute>();
  for (const raw of input.amounts || []) {
    if (!isAttribute(raw.attribute) || seen.has(raw.attribute)) continue;
    const field = nutritionField(raw.attribute);
    const unit = raw.unit?.trim();
    if (!unit || !field.acceptedUnits.includes(unit)) continue;
    const value = typeof raw.value === 'number' ? raw.value : Number.NaN;
    if (!Number.isFinite(value) || value < 0) continue;
    seen.add(raw.attribute);
    amounts.push({ attribute: raw.attribute, value, unit });
  }
  if (amounts.length === 0) return undefined;
  return {
    basis: input.basis,
    amounts,
    nutritionComplete: nutritionPanelIsComplete({ basis: input.basis, amounts }),
  };
}

function offBasis(basis: NutritionBasis): { nutritionDataPer: string; suffix: '100g' | 'serving' } {
  if (basis === 'per_serving') return { nutritionDataPer: 'serving', suffix: 'serving' };
  if (basis === 'per_100ml') return { nutritionDataPer: '100ml', suffix: '100g' };
  return { nutritionDataPer: '100g', suffix: '100g' };
}

/** OFF sodium is grams. Milligrams convert only when the stated unit is mg. */
export function offNutrientValue(amount: StatedNutritionAmount): string | undefined {
  const field = nutritionField(amount.attribute);
  if (amount.attribute === 'sodium' && amount.unit === 'mg') return String(amount.value / 1000);
  if (amount.unit === field.offUnit || (amount.attribute === 'sodium' && amount.unit === 'g')) {
    return String(amount.value);
  }
  return undefined;
}

export function projectOffWriteFields(input: {
  barcode: string;
  ingredientsText?: string;
  nutrition?: EstablishedNutrition;
}): Record<string, string> | null {
  const fields: Record<string, string> = {};
  const ingredients = input.ingredientsText?.trim();
  if (ingredients) fields.ingredients_text = ingredients;
  if (input.nutrition) {
    const basis = offBasis(input.nutrition.basis);
    const nutrientFields: Record<string, string> = {};
    for (const amount of input.nutrition.amounts) {
      const written = offNutrientValue(amount);
      if (written === undefined) continue;
      nutrientFields[`nutriment_${nutritionField(amount.attribute).offNutrient}_${basis.suffix}`] = written;
    }
    if (Object.keys(nutrientFields).length > 0) {
      fields.nutrition_data_per = basis.nutritionDataPer;
      Object.assign(fields, nutrientFields);
    }
  }
  if (Object.keys(fields).length === 0) return null;
  fields.code = input.barcode;
  return fields;
}
